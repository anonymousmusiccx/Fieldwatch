import { Sighting, Fleet, RadioKind, SignatureClass } from '../types';
import { MacUtil } from './macUtil';
import { RfScanner, isNative, type RawRf, type StartResult } from './rfScanner';
import type { PluginListenerHandle } from '@capacitor/core';

export type ScanStatus =
  | 'OK'
  | 'PERMISSION_DENIED'
  | 'LOCATION_OFF'
  | 'BLUETOOTH_OFF'
  | 'STOPPED'
  | 'FALLBACK_DEMO';

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
  private demoTimer: number | null = null;
  private expiryTimer: number | null = null;
  private listeners: Set<(devices: Sighting[]) => void> = new Set();
  private statusListeners: Set<(status: ScanStatus) => void> = new Set();
  private fleets: Fleet[] = INITIAL_FLEETS;

  private isDemoMode: boolean = false;
  private currentStatus: ScanStatus = 'STOPPED';
  private nativeListenerHandle: PluginListenerHandle | null = null;

  constructor() {
    // If not running in a native Android environment (e.g. desktop web preview),
    // default to demo mode so testing works seamlessly.
    if (!isNative()) {
      this.isDemoMode = true;
      this.initMockSightings();
    }
  }

  setFleets(fleets: Fleet[]) {
    this.fleets = fleets;
    this.reclassifyAll();
  }

  /**
   * Switch between Real hardware scanning and Simulated Demo mode
   */
  async setMode(demo: boolean) {
    await this.stop();
    this.clear();
    this.isDemoMode = demo;

    if (this.isDemoMode || !isNative()) {
      this.initMockSightings();
      this.startDemo(1200);
      this.setStatus(!isNative() && !demo ? 'FALLBACK_DEMO' : 'OK');
    } else {
      await this.startReal();
    }
  }

  private setStatus(status: ScanStatus) {
    this.currentStatus = status;
    this.statusListeners.forEach((cb) => cb(status));
  }

  subscribeStatus(cb: (status: ScanStatus) => void): () => void {
    this.statusListeners.add(cb);
    cb(this.currentStatus);
    return () => this.statusListeners.delete(cb);
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
    this.notify();
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

  async start(intervalMs = 1200) {
    if (this.isDemoMode || !isNative()) {
      this.startDemo(intervalMs);
    } else {
      await this.startReal();
    }
  }

  private startDemo(intervalMs: number) {
    if (this.demoTimer) return;
    this.demoTimer = window.setInterval(() => {
      this.tick();
    }, intervalMs);
  }

  private async startReal() {
    try {
      // 1. Request Runtime Permissions
      const perms = await RfScanner.requestPerms();
      if (!perms.granted) {
        this.setStatus('PERMISSION_DENIED');
        return;
      }

      // 2. Start Scanner and check hardware flags
      const startRes: StartResult = await RfScanner.start({ wifi: true, ble: true });
      if (!startRes.locationEnabled) {
        this.setStatus('LOCATION_OFF');
      } else if (!startRes.bluetoothEnabled) {
        this.setStatus('BLUETOOTH_OFF');
      } else {
        this.setStatus('OK');
      }

      // 3. Attach Event Listener for Real Devices
      if (this.nativeListenerHandle) {
        await this.nativeListenerHandle.remove();
        this.nativeListenerHandle = null;
      }

      this.nativeListenerHandle = await RfScanner.addListener('devices', (payload) => {
        if (payload && Array.isArray(payload.devices)) {
          this.ingest(payload.devices);
        }
      });

      // 4. Start Expiry Cleaner (every 5 seconds)
      // Drops stale BLE devices after 30s and Wi-Fi APs after 90s
      if (!this.expiryTimer) {
        this.expiryTimer = window.setInterval(() => {
          this.cleanExpiredDevices();
        }, 5000);
      }
    } catch (err) {
      console.error('Failed to start native RF scanner:', err);
      this.setStatus('PERMISSION_DENIED');
    }
  }

  /**
   * Process raw Wi-Fi and Bluetooth LE devices received from native radio scans
   */
  private ingest(devices: RawRf[]) {
    if (!devices || devices.length === 0) return;
    const now = Date.now();

    for (const raw of devices) {
      if (!raw.mac) continue;
      const cleanMac = raw.mac.toUpperCase();
      const existing = this.activeDevices.get(cleanMac);

      const proximity = MacUtil.estimateProximity(raw.rssi, raw.kind);

      if (existing) {
        // Update existing device observation
        existing.rssi = raw.rssi;
        existing.rssiHistory.push(raw.rssi);
        if (existing.rssiHistory.length > 20) {
          existing.rssiHistory.shift();
        }
        existing.lastSeenMs = now;
        existing.packetCount += 1;
        existing.estimatedDistanceMeters = proximity.meters;
        if (raw.ssid && !existing.ssid) existing.ssid = raw.ssid;
        if (raw.name && (!existing.name || existing.name === 'Wi-Fi AP')) existing.name = raw.name;
        if (raw.frequency && !existing.frequencyMhz) {
          existing.frequencyMhz = raw.frequency;
          existing.channel = this.frequencyToChannel(raw.frequency);
        }
      } else {
        // New sighting observed
        const label = raw.ssid || raw.name || '';
        const { matchedClass, matchedFleet, matchedRule } = this.matchDevice(cleanMac, label);
        const channel = raw.frequency ? this.frequencyToChannel(raw.frequency) : undefined;
        const bearing = this.calculatePseudoBearing(cleanMac);

        const sighting: Sighting = {
          key: cleanMac,
          mac: cleanMac,
          kind: raw.kind,
          name: raw.name,
          ssid: raw.ssid,
          rssi: raw.rssi,
          rssiHistory: [raw.rssi],
          firstSeenMs: now,
          lastSeenMs: now,
          matchedClass,
          matchedFleet,
          matchedRule,
          frequencyMhz: raw.frequency,
          channel,
          packetCount: 1,
          ouiVendor: MacUtil.getVendor(cleanMac),
          estimatedDistanceMeters: proximity.meters,
          bearingDeg: bearing,
        };

        this.activeDevices.set(cleanMac, sighting);
      }
    }

    this.notify();
  }

  private cleanExpiredDevices() {
    const now = Date.now();
    let changed = false;

    this.activeDevices.forEach((dev, mac) => {
      // 30 seconds for BLE, 90 seconds for Wi-Fi (due to Android scan throttling)
      const timeoutMs = dev.kind === 'BLE' ? 30000 : 90000;
      if (now - dev.lastSeenMs > timeoutMs) {
        this.activeDevices.delete(mac);
        changed = true;
      }
    });

    if (changed) {
      this.notify();
    }
  }

  private calculatePseudoBearing(mac: string): number {
    let hash = 0;
    for (let i = 0; i < mac.length; i++) {
      hash = (hash << 5) - hash + mac.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 360;
  }

  private frequencyToChannel(freq: number): number | undefined {
    if (freq >= 2412 && freq <= 2484) {
      if (freq === 2484) return 14;
      return Math.round((freq - 2407) / 5);
    }
    if (freq >= 5170 && freq <= 5825) {
      return Math.round((freq - 5000) / 5);
    }
    return undefined;
  }

  async stop() {
    if (this.demoTimer) {
      clearInterval(this.demoTimer);
      this.demoTimer = null;
    }

    if (this.expiryTimer) {
      clearInterval(this.expiryTimer);
      this.expiryTimer = null;
    }

    if (this.nativeListenerHandle) {
      await this.nativeListenerHandle.remove();
      this.nativeListenerHandle = null;
    }

    if (isNative()) {
      try {
        await RfScanner.stop();
      } catch (ignored) {
      }
    }

    this.setStatus('STOPPED');
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
