import { RadioKind } from '../types';

export interface ProximityEstimate {
  meters: number;
  label: string;
  zone: 'IMMEDIATE' | 'NEAR' | 'TACTICAL' | 'STRATEGIC';
  zoneColor: string;
}

export class MacUtil {
  /**
   * Checks if MAC address uses locally administered address (LAA / random MAC)
   */
  static isRandomized(mac?: string | null): boolean {
    if (!mac || typeof mac !== 'string') return false;
    const clean = mac.replace(/[:-]/g, '').toUpperCase();
    if (clean.length < 2) return false;
    const firstByte = parseInt(clean.substring(0, 2), 16);
    // Bit 1 (0b00000010) set means Locally Administered
    return (firstByte & 0x02) !== 0;
  }

  /**
   * Returns known manufacturer / OUI database match
   */
  static getVendor(mac?: string | null): string {
    if (!mac || typeof mac !== 'string') return 'Unknown';
    const clean = mac.replace(/[:-]/g, '').toUpperCase();
    if (clean.length < 6) return 'Unknown';
    const oui = clean.substring(0, 6);

    const OUI_MAP: Record<string, string> = {
      '001A11': 'Google Inc.',
      'F4F5D8': 'Google LLC (Pixel)',
      '001788': 'Philips Hue',
      'ACDE48': 'Apple Inc.',
      'F84D89': 'Apple Inc.',
      '60F445': 'Apple Inc.',
      'DC2C26': 'Apple Inc.',
      '000C43': 'Ralink Technology',
      'B827EB': 'Raspberry Pi Foundation',
      'DCA632': 'Raspberry Pi Foundation',
      'E45F01': 'Raspberry Pi Foundation',
      '600194': 'Espressif (ESP8266/ESP32)',
      'A4C138': 'Telink Semiconductor (BLE)',
      '500291': 'DJI Technologies (Drone)',
      '60601F': 'DJI Innovations (UAV)',
      '9C8CF9': 'Autel Robotics',
      '0024E8': 'Dell Inc.',
      '3C5282': 'Intel Corporate',
      '482AE3': 'Motorola Solutions (Police APX)',
      '0014B7': 'Axon Enterprise (Body Camera)',
      '40C62A': 'Axon Enterprise (Taser/Fleet)',
      '008037': 'Ericsson AB (IMSI Catcher/Surveillance)',
      '00127F': 'Harris Corp (Tactical RF)',
      'BC307E': 'Samsung Electronics',
      '0016B6': 'Cisco Systems',
      'CC40D0': 'Tile Tracker',
      'D43639': 'Apple AirTag BLE',
      'F0D1A9': 'Samsung SmartTag',
      '304A26': 'Amazon Ring Security',
      '04CF4B': 'L3Harris Technologies',
    };

    if (OUI_MAP[oui]) return OUI_MAP[oui];
    if (this.isRandomized(mac)) return 'Randomized / Private MAC';
    return 'Unregistered OUI';
  }

  /**
   * Logarithmic path-loss RF distance estimation
   * Formula: d = 10 ^ ((MeasuredPower - RSSI) / (10 * n))
   */
  static estimateProximity(rssi: number, kind: RadioKind = 'BLE'): ProximityEstimate {
    // Reference RSSI at 1 meter: Wi-Fi ~ -40 dBm, BLE ~ -59 dBm
    const measuredPower = kind === 'WIFI' ? -42 : -59;
    // Path loss exponent n in suburban/indoor clutter: 2.4 - 3.2
    const n = 2.6;

    const exp = (measuredPower - rssi) / (10 * n);
    let meters = Math.pow(10, exp);

    // Clamp realistic range
    if (meters < 0.3) meters = 0.3;
    if (meters > 80) meters = 80;

    let label = `${meters.toFixed(1)}m`;
    let zone: 'IMMEDIATE' | 'NEAR' | 'TACTICAL' | 'STRATEGIC';
    let zoneColor = '#10E79D';

    if (meters < 2.5 || rssi > -50) {
      zone = 'IMMEDIATE';
      zoneColor = '#F43F5E';
      label = `< 2.5m (Immediate)`;
    } else if (meters < 7.0 || rssi > -65) {
      zone = 'NEAR';
      zoneColor = '#FB923C';
      label = `~${meters.toFixed(1)}m (Near)`;
    } else if (meters < 18.0 || rssi > -80) {
      zone = 'TACTICAL';
      zoneColor = '#EAB308';
      label = `~${meters.toFixed(0)}m (Tactical)`;
    } else {
      zone = 'STRATEGIC';
      zoneColor = '#38BDF8';
      label = `> 20m (Strategic)`;
    }

    return {
      meters: Math.round(meters * 10) / 10,
      label,
      zone,
      zoneColor,
    };
  }

  /**
   * Formats hex MAC into standard tactical string
   */
  static formatMac(mac?: string | null): string {
    if (!mac || typeof mac !== 'string') return '';
    const clean = mac.replace(/[^A-Fa-f0-9]/g, '').toUpperCase();
    if (clean.length !== 12) return mac;
    return clean.match(/.{1,2}/g)?.join(':') || mac;
  }
}
