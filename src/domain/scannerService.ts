import { Sighting, Fleet, RadioKind, SignatureClass } from '../types';
import { MacUtil } from './macUtil';

export const INITIAL_FLEETS: Fleet[] = [
  {
    id: 'fleet-drones',
    name: 'Unmanned Aerial Systems (UAV)',
    description: 'Commercial & tactical drones broadcasting Remote ID and telemetry',
    enabled: true,
    color: '#FB923C',
    rules: [
      {
        id: 'rule-dji',
        name: 'DJI Drone / DroneID',
        kind: 'MAC_PREFIX',
        pattern: '50:02:91',
        className: 'DRONE_UAV',
        notes: 'OUI registered to DJI Innovations',
      },
      {
        id: 'rule-dji-2',
        name: 'DJI Matrice / Mavic RF',
        kind: 'MAC_PREFIX',
        pattern: '60:60:1F',
        className: 'DRONE_UAV',
      },
      {
        id: 'rule-autel',
        name: 'Autel Robotics UAV',
        kind: 'MAC_PREFIX',
        pattern: '9C:8C:F9',
        className: 'DRONE_UAV',
      },
    ],
  },
  {
    id: 'fleet-surveillance',
    name: 'Surveillance / Cell Intercept',
    description: 'IMSI Catcher, stingray beacons, and clandestine tracking beacons',
    enabled: true,
    color: '#F43F5E',
    rules: [
      {
        id: 'rule-harris',
        name: 'Harris Tactical Intercept',
        kind: 'MAC_PREFIX',
        pattern: '00:12:7F',
        className: 'SURVEILLANCE',
      },
      {
        id: 'rule-ericsson-imsi',
        name: 'Cellular Test / Intercept Host',
        kind: 'MAC_PREFIX',
        pattern: '00:80:37',
        className: 'SURVEILLANCE',
      },
      {
        id: 'rule-l3harris',
        name: 'L3Harris Surveillance Transceiver',
        kind: 'MAC_PREFIX',
        pattern: '04:CF:4B',
        className: 'SURVEILLANCE',
      },
    ],
  },
  {
    id: 'fleet-public-safety',
    name: 'Public Safety & Emergency',
    description: 'Police APX radios, siren controllers, and emergency services',
    enabled: true,
    color: '#EF4444',
    rules: [
      {
        id: 'rule-motorola-apx',
        name: 'Motorola Solutions APX8000',
        kind: 'MAC_PREFIX',
        pattern: '48:2A:E3',
        className: 'POLICE_EMERGENCY',
      },
    ],
  },
  {
    id: 'fleet-wearables',
    name: 'Body-Worn Gear & Trackers',
    description: 'Body cameras, tactical wearables, AirTags, and beacons',
    enabled: true,
    color: '#A855F7',
    rules: [
      {
        id: 'rule-axon-body',
        name: 'Axon Body 3 / 4 Camera',
        kind: 'MAC_PREFIX',
        pattern: '00:14:B7',
        className: 'BODY_WORN',
      },
      {
        id: 'rule-airtag',
        name: 'Apple FindMy / AirTag Beacon',
        kind: 'MAC_PREFIX',
        pattern: 'D4:36:39',
        className: 'BODY_WORN',
      },
      {
        id: 'rule-smarttag',
        name: 'Samsung SmartTag Ultra',
        kind: 'MAC_PREFIX',
        pattern: 'F0:D1:A9',
        className: 'BODY_WORN',
      },
    ],
  },
  {
    id: 'fleet-infrastructure',
    name: 'Critical Infrastructure & SCADA',
    description: 'Industrial Wi-Fi APs, utility sensors, and base stations',
    enabled: true,
    color: '#34D399',
    rules: [
      {
        id: 'rule-cisco',
        name: 'Cisco Industrial Catalyst',
        kind: 'MAC_PREFIX',
        pattern: '00:16:B6',
        className: 'INFRASTRUCTURE',
      },
    ],
  },
];

interface DevicePreset {
  mac: string;
  name?: string;
  ssid?: string;
  kind: RadioKind;
  baseRssi: number;
  freq: number;
  channel: number;
  bearing: number;
  deltaRssi: number;
}

const PRESET_DEVICES: DevicePreset[] = [
  {
    mac: '50:02:91:A3:8F:12',
    name: 'DJI Mavic 3 Pro (RID)',
    kind: 'WIFI',
    baseRssi: -58,
    freq: 2437,
    channel: 6,
    bearing: 42,
    deltaRssi: 3,
  },
  {
    mac: '00:12:7F:8C:22:90',
    name: 'Harris Stingray Cell Test',
    kind: 'WIFI',
    baseRssi: -49,
    freq: 5180,
    channel: 36,
    bearing: 195,
    deltaRssi: 2,
  },
  {
    mac: '00:14:B7:6E:9B:41',
    name: 'Axon Body 3 [ID: 9481]',
    kind: 'BLE',
    baseRssi: -62,
    freq: 2402,
    channel: 37,
    bearing: 280,
    deltaRssi: 4,
  },
  {
    mac: '48:2A:E3:D0:11:7A',
    name: 'APX8000 P25 Tactical Radio',
    kind: 'BLE',
    baseRssi: -71,
    freq: 2426,
    channel: 38,
    bearing: 110,
    deltaRssi: 5,
  },
  {
    mac: 'D4:36:39:1A:BC:88',
    name: 'AirTag Proximity Beacon',
    kind: 'BLE',
    baseRssi: -44,
    freq: 2480,
    channel: 39,
    bearing: 315,
    deltaRssi: 2,
  },
  {
    mac: '00:16:B6:54:19:EA',
    ssid: 'TAC-COMM-SECURE-AP',
    kind: 'WIFI',
    baseRssi: -53,
    freq: 5240,
    channel: 48,
    bearing: 15,
    deltaRssi: 2,
  },
  {
    mac: 'E4:5F:01:99:3B:1C',
    ssid: 'RaspberryPi-Mesh-Node',
    kind: 'WIFI',
    baseRssi: -67,
    freq: 2462,
    channel: 11,
    bearing: 155,
    deltaRssi: 4,
  },
  {
    mac: 'F4:F5:D8:0C:44:EE',
    name: 'Google Pixel 8 Pro',
    kind: 'BLE',
    baseRssi: -74,
    freq: 2402,
    channel: 37,
    bearing: 245,
    deltaRssi: 6,
  },
  {
    mac: '60:F4:45:88:12:34',
    name: 'Apple iPhone 15 Pro',
    kind: 'BLE',
    baseRssi: -65,
    freq: 2426,
    channel: 38,
    bearing: 70,
    deltaRssi: 3,
  },
  {
    mac: '00:80:37:33:91:AA',
    ssid: 'GSM-TEST-BASE-09',
    kind: 'WIFI',
    baseRssi: -79,
    freq: 2412,
    channel: 1,
    bearing: 330,
    deltaRssi: 5,
  },
];

export class ScannerService {
  private activeDevices: Map<string, Sighting> = new Map();
  private timer: number | null = null;
  private listeners: Set<(devices: Sighting[]) => void> = new Set();
  private fleets: Fleet[] = INITIAL_FLEETS;

  constructor() {
    this.initMockSightings();
  }

  setFleets(fleets: Fleet[]) {
    this.fleets = fleets;
    this.reclassifyAll();
  }

  private initMockSightings() {
    const now = Date.now();
    PRESET_DEVICES.forEach((preset, index) => {
      const { matchedClass, matchedFleet, matchedRule } = this.matchDevice(
        preset.mac,
        preset.ssid || preset.name || ''
      );

      const proximity = MacUtil.estimateProximity(preset.baseRssi, preset.kind);

      const sighting: Sighting = {
        key: preset.mac,
        mac: preset.mac,
        kind: preset.kind,
        name: preset.name,
        ssid: preset.ssid,
        rssi: preset.baseRssi,
        rssiHistory: [
          preset.baseRssi - 3,
          preset.baseRssi + 1,
          preset.baseRssi - 1,
          preset.baseRssi + 2,
          preset.baseRssi,
        ],
        firstSeenMs: now - (index * 24000 + 45000),
        lastSeenMs: now - index * 1200,
        matchedClass,
        matchedFleet,
        matchedRule,
        frequencyMhz: preset.freq,
        channel: preset.channel,
        packetCount: 12 + index * 8,
        ouiVendor: MacUtil.getVendor(preset.mac),
        estimatedDistanceMeters: proximity.meters,
        bearingDeg: preset.bearing,
      };

      this.activeDevices.set(preset.mac, sighting);
    });
  }

  private matchDevice(
    mac?: string | null,
    label?: string | null
  ): {
    matchedClass?: SignatureClass;
    matchedFleet?: string;
    matchedRule?: string;
  } {
    if (!mac || typeof mac !== 'string') {
      return { matchedClass: 'UNKNOWN' };
    }
    const cleanMac = mac.replace(/[:-]/g, '').toUpperCase();
    const safeLabel = label || '';

    if (!Array.isArray(this.fleets)) {
      return { matchedClass: 'UNKNOWN' };
    }

    for (const fleet of this.fleets) {
      if (!fleet || !fleet.enabled || !Array.isArray(fleet.rules)) continue;
      for (const rule of fleet.rules) {
        if (!rule || !rule.pattern || typeof rule.pattern !== 'string') continue;
        if (rule.kind === 'MAC_PREFIX' || rule.kind === 'OUI') {
          const ruleClean = rule.pattern.replace(/[:-]/g, '').toUpperCase();
          if (cleanMac.startsWith(ruleClean)) {
            return {
              matchedClass: rule.className,
              matchedFleet: fleet.name,
              matchedRule: rule.name,
            };
          }
        } else if (rule.kind === 'SSID_REGEX') {
          try {
            const re = new RegExp(rule.pattern, 'i');
            if (re.test(safeLabel)) {
              return {
                matchedClass: rule.className,
                matchedFleet: fleet.name,
                matchedRule: rule.name,
              };
            }
          } catch {
            // invalid regex
          }
        }
      }
    }

    return { matchedClass: 'UNKNOWN' };
  }

  private reclassifyAll() {
    this.activeDevices.forEach((dev) => {
      const matched = this.matchDevice(dev.mac, dev.ssid || dev.name || '');
      dev.matchedClass = matched.matchedClass;
      dev.matchedFleet = matched.matchedFleet;
      dev.matchedRule = matched.matchedRule;
    });
    this.notify();
  }

  start(intervalMs = 1200) {
    if (this.timer) return;
    this.timer = window.setInterval(() => {
      this.tick();
    }, intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  subscribe(cb: (devices: Sighting[]) => void): () => void {
    this.listeners.add(cb);
    cb(this.getDevices());
    return () => this.listeners.delete(cb);
  }

  private notify() {
    const list = this.getDevices();
    this.listeners.forEach((cb) => cb(list));
  }

  getDevices(): Sighting[] {
    return Array.from(this.activeDevices.values());
  }

  private tick() {
    const now = Date.now();

    // Randomly update 2-4 devices with new RSSI and packet count
    this.activeDevices.forEach((dev) => {
      if (Math.random() > 0.4) {
        const delta = Math.floor((Math.random() - 0.48) * 6);
        let newRssi = dev.rssi + delta;
        if (newRssi > -30) newRssi = -32;
        if (newRssi < -92) newRssi = -90;

        dev.rssi = newRssi;
        dev.rssiHistory.push(newRssi);
        if (dev.rssiHistory.length > 20) {
          dev.rssiHistory.shift();
        }
        dev.lastSeenMs = now;
        dev.packetCount += Math.floor(Math.random() * 4) + 1;

        const proximity = MacUtil.estimateProximity(newRssi, dev.kind);
        dev.estimatedDistanceMeters = proximity.meters;

        // Slight drift in bearing
        if (dev.bearingDeg !== undefined) {
          dev.bearingDeg = (dev.bearingDeg + (Math.random() - 0.5) * 4 + 360) % 360;
        }
      }
    });

    this.notify();
  }

  addManualSighting(sighting: Sighting) {
    this.activeDevices.set(sighting.key, sighting);
    this.notify();
  }

  clear() {
    this.activeDevices.clear();
    this.notify();
  }
}

export const scannerService = new ScannerService();
