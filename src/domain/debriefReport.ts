import { Fleet, Sighting } from '../types';
import { MacUtil } from './macUtil';
import { GpsService } from './gpsService';

export const DebriefReport = {
  /**
   * Generates formatted tactical Debrief text
   */
  generateDebrief(
    devices: Sighting[],
    fleets: Fleet[],
    demoMode: boolean,
    customNames: Map<string, string>
  ): string {
    const fleetMap = new Map(fleets.map((f) => [f.id, f]));
    const nowStr = new Date().toISOString();

    const wifiCount = devices.filter((d) => d.kind === 'WIFI').length;
    const bleCount = devices.filter((d) => d.kind === 'BLE').length;

    // Signature counts
    const classCounts: Record<string, number> = {};
    for (const dev of devices) {
      for (const fid of dev.fleetIds) {
        const fleet = fleetMap.get(fid);
        if (fleet) {
          classCounts[fleet.kind] = (classCounts[fleet.kind] || 0) + 1;
        }
      }
    }

    let out = `======================================================\n`;
    out += `FIELDWATCH RF TACTICAL SITUATION DEBRIEF\n`;
    out += `TIMESTAMP: ${nowStr}\n`;
    out += `TOTAL RADIOS OBSERVED: ${devices.length} (Wi-Fi APs: ${wifiCount}, BLE Advertisers: ${bleCount})\n`;
    out += `======================================================\n\n`;

    out += `[1] SIGNATURE CLASS BREAKDOWN:\n`;
    if (Object.keys(classCounts).length === 0) {
      out += `  - No classified signature matches found.\n`;
    } else {
      for (const [cls, count] of Object.entries(classCounts)) {
        out += `  * ${cls}: ${count} device(s)\n`;
      }
    }
    out += `\n`;

    out += `[2] HIGHEST SIGNAL THREATS / PROXIMATE RADIOS (Top 10):\n`;
    const sortedBySignal = [...devices].sort((a, b) => b.rssi - a.rssi).slice(0, 10);
    for (const dev of sortedBySignal) {
      const mac = MacUtil.screenMac(dev.mac, demoMode);
      const name = customNames.get(dev.key) || dev.name || '<unnamed>';
      const fleetNames = dev.fleetIds
        .map((id) => fleetMap.get(id)?.name)
        .filter(Boolean)
        .join(', ');
      out += `  * [${dev.kind}] RSSI: ${dev.rssi} dBm | MAC: ${mac} | Name: "${name}" | Vendor: ${dev.vendor || 'Unknown'}${
        fleetNames ? ` | Matched: [${fleetNames}]` : ''
      }\n`;
    }
    out += `\n`;

    out += `[3] OBSERVATION TIMELINE & MOBILITY:\n`;
    const randomizedCount = devices.filter((d) => d.randomized).length;
    out += `  * Privacy-Randomized MACs: ${randomizedCount} / ${devices.length}\n`;
    const taggedLocationCount = devices.filter((d) => d.latitude && d.longitude).length;
    out += `  * Radios with Geolocation Fixes: ${taggedLocationCount}\n`;

    out += `\n--- END OF DEBRIEF ---\n`;
    return out;
  },

  /**
   * Generates AI intelligence assessment prompt with context
   */
  generateAiPrompt(
    devices: Sighting[],
    fleets: Fleet[],
    demoMode: boolean
  ): string {
    const fleetMap = new Map(fleets.map((f) => [f.id, f]));
    const sampleDevices = devices.slice(0, 30).map((d) => ({
      kind: d.kind,
      mac: MacUtil.screenMac(d.mac, demoMode),
      name: d.name || null,
      rssi: d.rssi,
      vendor: d.vendor,
      randomized: d.randomized,
      signatures: d.fleetIds.map((id) => fleetMap.get(id)?.name).filter(Boolean),
      hits: d.hitCount,
      channel: d.channel,
    }));

    return `You are a signals intelligence and RF tactical operations analyst. Analyze the following passive RF monitoring snapshot captured by Fieldwatch.

SITUATION SUMMARY:
- Total Observed Signals: ${devices.length}
- Wi-Fi Access Points: ${devices.filter((d) => d.kind === 'WIFI').length}
- BLE Advertisers: ${devices.filter((d) => d.kind === 'BLE').length}

OBSERVED RADIO SAMPLE (JSON):
${JSON.stringify(sampleDevices, null, 2)}

TASK:
1. Identify any high-risk surveillance, tracker tags (e.g. AirTags, SmartTags), law enforcement equipment (ALPR/body-worn cameras), drones (Remote ID), or pentest/hacking devices present in this environment.
2. Note potential operator safety concerns or operational security (OPSEC) anomalies based on proximity (signal strength) and transmitter persistence.
3. Provide tactical recommendations for the operator (e.g. directional hunt, counter-surveillance sweep, or frequency monitoring).`;
  },

  /**
   * Export to CSV format
   */
  exportCsv(devices: Sighting[], demoMode: boolean): string {
    const headers = [
      'key',
      'kind',
      'mac',
      'name',
      'rssi',
      'channel',
      'frequency_mhz',
      'vendor',
      'randomized',
      'hidden_ssid',
      'first_seen',
      'last_seen',
      'hit_count',
      'latitude',
      'longitude',
      'signatures',
    ];

    const rows = devices.map((d) => [
      d.key,
      d.kind,
      MacUtil.screenMac(d.mac, demoMode),
      `"${(d.name || '').replace(/"/g, '""')}"`,
      d.rssi,
      d.channel,
      d.frequencyMhz,
      `"${(d.vendor || '').replace(/"/g, '""')}"`,
      d.randomized ? '1' : '0',
      d.hiddenSsid ? '1' : '0',
      new Date(d.firstSeen).toISOString(),
      new Date(d.lastSeen).toISOString(),
      d.hitCount,
      d.latitude ? d.latitude.toFixed(6) : '',
      d.longitude ? d.longitude.toFixed(6) : '',
      `"${d.fleetIds.join(';')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },

  /**
   * Export to JSONL format
   */
  exportJsonl(devices: Sighting[], demoMode: boolean): string {
    return devices
      .map((d) =>
        JSON.stringify({
          ...d,
          mac: MacUtil.screenMac(d.mac, demoMode),
        })
      )
      .join('\n');
  },
};
