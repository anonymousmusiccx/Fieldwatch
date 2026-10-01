import { FleetDecode, Sighting, LiveDecodeChip } from '../types';

export function decodePayloadFields(
  device: Sighting,
  decode: FleetDecode
): {
  values: Record<string, { label: string; value: string | number; unit?: string }>;
  liveChips: LiveDecodeChip[];
} {
  const result: Record<string, { label: string; value: string | number; unit?: string }> = {};
  const liveChips: LiveDecodeChip[] = [];

  let rawBytes: Uint8Array | null = null;
  const hex =
    decode.source === 'serviceData'
      ? device.facts?.serviceData?.[0]?.dataHex || ''
      : device.manufacturerDataHex || '';

  if (hex && hex.length >= 2) {
    try {
      const match = hex.match(/.{1,2}/g);
      if (match) {
        rawBytes = new Uint8Array(match.map((byte) => parseInt(byte, 16)));
      }
    } catch {
      rawBytes = null;
    }
  }

  // Common built-in decodes if no explicit custom fields or as additional context
  // 1. Apple Find My / AirTag
  if (device.manufacturerId === 0x004c && device.manufacturerDataHex) {
    const raw = device.manufacturerDataHex.toLowerCase();
    if (raw.startsWith('121910')) {
      const statusByte = parseInt(raw.substring(6, 8), 16);
      if (!isNaN(statusByte)) {
        const isLowBatt = (statusByte & 0x01) !== 0;
        result['apple_battery'] = {
          label: 'AirTag Battery',
          value: isLowBatt ? 'LOW BATTERY' : 'OK / NORMAL',
        };
        liveChips.push({
          id: 'airtag_battery',
          label: isLowBatt ? 'BATT LOW' : 'BATT OK',
          emphasized: isLowBatt,
        });
      }
    }
  }

  // 2. Google Fast Pair Model ID & Pairing state
  if (device.serviceUuids.includes('FE2C')) {
    if (device.fastPairPairing) {
      result['fast_pair_state'] = {
        label: 'Fast Pair State',
        value: 'Seeking Pairing (Open broadcast)',
      };
      liveChips.push({
        id: 'fast_pair_seek',
        label: 'FAST PAIR SEEKING',
        emphasized: true,
      });
    }
  }

  // 3. Apple iBeacon (0x0215 prefix in manufacturer data)
  if (device.manufacturerId === 0x004c && device.manufacturerDataHex) {
    const raw = device.manufacturerDataHex.toLowerCase();
    if (raw.startsWith('0215') && raw.length >= 46) {
      const uuidHex = raw.substring(4, 36);
      const major = parseInt(raw.substring(36, 40), 16);
      const minor = parseInt(raw.substring(40, 44), 16);
      const txPower = parseInt(raw.substring(44, 46), 16) - 256;
      result['ibeacon_uuid'] = {
        label: 'iBeacon Proximity UUID',
        value: `${uuidHex.slice(0, 8)}-${uuidHex.slice(8, 12)}-${uuidHex.slice(12, 16)}-${uuidHex.slice(16, 20)}-${uuidHex.slice(20)}`,
      };
      result['ibeacon_major'] = { label: 'Major', value: major };
      result['ibeacon_minor'] = { label: 'Minor', value: minor };
      result['ibeacon_tx'] = { label: 'Calibrated TxPower', value: txPower, unit: 'dBm' };
      liveChips.push({
        id: 'ibeacon_major_minor',
        label: `M:${major} m:${minor}`,
        emphasized: false,
      });
    }
  }

  // Custom Fleet Decode Fields
  if (rawBytes && decode.fields && decode.fields.length > 0) {
    const dataView = new DataView(rawBytes.buffer, rawBytes.byteOffset, rawBytes.byteLength);

    for (const field of decode.fields) {
      // Check gate if defined
      if (field.gate) {
        if (field.gate.op === 'len' && rawBytes.length < field.gate.offset) {
          continue;
        }
        if (field.gate.offset + (field.gate.length || 1) <= rawBytes.length) {
          const actualHex = Array.from(
            rawBytes.slice(field.gate.offset, field.gate.offset + (field.gate.length || 1))
          )
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
          if (
            field.gate.op === 'eq' &&
            actualHex.toLowerCase() !== field.gate.valueHex.toLowerCase()
          ) {
            continue;
          }
          if (
            field.gate.op === 'neq' &&
            actualHex.toLowerCase() === field.gate.valueHex.toLowerCase()
          ) {
            continue;
          }
        }
      }

      if (field.offset >= rawBytes.length) continue;

      let val: number | string = 0;
      const isLittleEndian = field.endian === 'le';

      try {
        switch (field.type) {
          case 'u8':
            val = dataView.getUint8(field.offset);
            break;
          case 'i8':
            val = dataView.getInt8(field.offset);
            break;
          case 'u16':
            if (field.offset + 2 <= rawBytes.length) {
              val = dataView.getUint16(field.offset, isLittleEndian);
            }
            break;
          case 'i16':
            if (field.offset + 2 <= rawBytes.length) {
              val = dataView.getInt16(field.offset, isLittleEndian);
            }
            break;
          case 'u32':
            if (field.offset + 4 <= rawBytes.length) {
              val = dataView.getUint32(field.offset, isLittleEndian);
            }
            break;
          case 'i32':
            if (field.offset + 4 <= rawBytes.length) {
              val = dataView.getInt32(field.offset, isLittleEndian);
            }
            break;
          case 'bool':
            val = dataView.getUint8(field.offset) !== 0 ? 'TRUE' : 'FALSE';
            break;
          case 'hex': {
            const len = field.length || 1;
            const slice = rawBytes.slice(field.offset, field.offset + len);
            val = Array.from(slice)
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('')
              .toUpperCase();
            break;
          }
          case 'utf8': {
            const len = field.length || rawBytes.length - field.offset;
            const slice = rawBytes.slice(field.offset, field.offset + len);
            val = new TextDecoder('utf-8', { fatal: false }).decode(slice).replace(/\0/g, '');
            break;
          }
        }

        // Apply scale/offset
        if (typeof val === 'number') {
          if (field.scale !== undefined) val = val * field.scale;
          if (field.offsetAdd !== undefined) val = val + field.offsetAdd;
          if (field.modulo !== undefined) val = val % field.modulo;
          // Format rounded
          val = Number(val.toFixed(2));
        }

        // Apply enum labels if available
        let displayVal: string | number = val;
        if (field.enumLabels && String(val) in field.enumLabels) {
          displayVal = field.enumLabels[String(val)];
        }

        result[field.id] = {
          label: field.label,
          value: displayVal,
          unit: field.unit,
        };

        if (field.live) {
          const isEmphasized =
            field.liveEmphasis?.includes(String(val)) ||
            field.liveEmphasis?.includes(String(displayVal));
          liveChips.push({
            id: field.id,
            label: `${field.label}: ${displayVal}${field.unit ? ` ${field.unit}` : ''}`,
            emphasized: !!isEmphasized,
          });
        }
      } catch {
        // Field extraction boundary issue
      }
    }
  }

  return { values: result, liveChips };
}
