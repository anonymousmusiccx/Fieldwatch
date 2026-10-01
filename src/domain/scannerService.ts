import { RadioKind, Sighting, RssiSample, RadioFacts, Fleet } from '../types';
import { MacUtil } from './macUtil';
import { STOCK_FLEETS } from './defaultCatalog';

export type SightingCallback = (sightings: Sighting[], newKeys: string[]) => void;

interface SimulatedEmitter {
  key: string;
  kind: RadioKind;
  mac: string;
  name: string;
  baseRssi: number;
  channel: number;
  frequencyMhz: number;
  vendor: string | null;
  randomized: boolean;
  hiddenSsid: boolean;
  serviceUuids: string[];
  manufacturerId: number | null;
  manufacturerDataHex: string;
  rawHex: string;
  extras: string;
  facts?: RadioFacts;
  baseLat?: number;
  baseLon?: number;
  bearingDeg?: number;
  intervalMs: number;
  lastEmitted: number;
}

const INITIAL_EMITTERS: SimulatedEmitter[] = [
  // 1. Apple AirTag (Find My offline beacon)
  {
    key: 'BLE:48:2A:E3:89:12:F1',
    kind: 'BLE',
    mac: '48:2A:E3:89:12:F1',
    name: '',
    baseRssi: -58,
    channel: 37,
    frequencyMhz: 2402,
    vendor: 'Apple, Inc.',
    randomized: true,
    hiddenSsid: false,
    serviceUuids: ['FD6F'],
    manufacturerId: 0x004c,
    manufacturerDataHex: '12191060938b819f05698b0e417a80',
    rawHex: '0201061bff4c0012191060938b819f05698b0e417a80',
    extras: 'Find My Offline Beacon',
    bearingDeg: 34,
    intervalMs: 2000,
    lastEmitted: 0,
  },
  // 2. Flock Safety ALPR Falcon Camera
  {
    key: 'WIFI:70:C9:60:44:81:AA',
    kind: 'WIFI',
    mac: '70:C9:60:44:81:AA',
    name: 'Flock-Falcon-9214',
    baseRssi: -71,
    channel: 6,
    frequencyMhz: 2437,
    vendor: 'Espressif Inc.',
    randomized: false,
    hiddenSsid: false,
    serviceUuids: [],
    manufacturerId: null,
    manufacturerDataHex: '',
    rawHex: '',
    extras: 'Automated License Plate Reader (ALPR)',
    bearingDeg: 142,
    intervalMs: 1500,
    lastEmitted: 0,
  },
  // 3. Axon Body 3 Camera (Law Enforcement)
  {
    key: 'BLE:00:25:DF:B8:31:09',
    kind: 'BLE',
    mac: '00:25:DF:B8:31:09',
    name: 'AXON_BODY_3_X819',
    baseRssi: -66,
    channel: 38,
    frequencyMhz: 2426,
    vendor: 'Axon Enterprise, Inc.',
    randomized: false,
    hiddenSsid: false,
    serviceUuids: ['FEBA', '180A'],
    manufacturerId: 0x05a1,
    manufacturerDataHex: '05a1030100',
    rawHex: '',
    extras: 'Axon Body-Worn Video Camera',
    bearingDeg: 215,
    intervalMs: 1200,
    lastEmitted: 0,
  },
  // 4. Samsung Galaxy SmartTag2
  {
    key: 'BLE:5C:CB:99:11:4F:72',
    kind: 'BLE',
    mac: '5C:CB:99:11:4F:72',
    name: 'SmartTag-4F72',
    baseRssi: -62,
    channel: 39,
    frequencyMhz: 2480,
    vendor: 'Samsung Electronics',
    randomized: true,
    hiddenSsid: false,
    serviceUuids: ['FD5A'],
    manufacturerId: 0x0075,
    manufacturerDataHex: '42010833a1',
    rawHex: '',
    extras: 'Samsung SmartThings Find Beacon',
    bearingDeg: 88,
    intervalMs: 2500,
    lastEmitted: 0,
  },
  // 5. DJI Drone Remote ID (OpenDroneID / FAA Broadcast)
  {
    key: 'BLE:60:60:1F:D3:99:04',
    kind: 'BLE',
    mac: '60:60:1F:D3:99:04',
    name: 'RID-1581F4B929',
    baseRssi: -79,
    channel: 37,
    frequencyMhz: 2402,
    vendor: 'DJI Technology Co., Ltd.',
    randomized: false,
    hiddenSsid: false,
    serviceUuids: ['FFFA'],
    manufacturerId: 0x089a,
    manufacturerDataHex: '19fa01001581f4b929',
    rawHex: '',
    extras: 'OpenDroneID UAS Telemetry Broadcast',
    bearingDeg: 310,
    intervalMs: 1000,
    lastEmitted: 0,
  },
  // 6. Flipper Zero (Sub-GHz / BadUSB Pentest Tool)
  {
    key: 'BLE:B4:E6:2D:88:51:7A',
    kind: 'BLE',
    mac: 'B4:E6:2D:88:51:7A',
    name: 'Flipper_Dr4g0n',
    baseRssi: -52,
    channel: 38,
    frequencyMhz: 2426,
    vendor: 'Espressif Inc.',
    randomized: false,
    hiddenSsid: false,
    serviceUuids: ['3082'],
    manufacturerId: null,
    manufacturerDataHex: '',
    rawHex: '',
    extras: 'Flipper Zero Multi-tool',
    bearingDeg: 190,
    intervalMs: 1800,
    lastEmitted: 0,
  },
  // 7. Ray-Ban Meta Smart Glasses
  {
    key: 'BLE:24:29:34:F1:C0:11',
    kind: 'BLE',
    mac: '24:29:34:F1:C0:11',
    name: 'Ray-Ban Meta 901',
    baseRssi: -74,
    channel: 39,
    frequencyMhz: 2480,
    vendor: 'Meta Platforms Inc.',
    randomized: true,
    hiddenSsid: false,
    serviceUuids: ['FE2C'],
    manufacturerId: 0x01ab,
    manufacturerDataHex: '02049184',
    rawHex: '',
    extras: 'Smart Audio/Camera Eyewear',
    bearingDeg: 275,
    intervalMs: 3000,
    lastEmitted: 0,
  },
  // 8. Hidden Wi-Fi AP (Surveillance/Tactical)
  {
    key: 'WIFI:00:1E:E5:A9:12:44',
    kind: 'WIFI',
    mac: '00:1E:E5:A9:12:44',
    name: '',
    baseRssi: -64,
    channel: 11,
    frequencyMhz: 2462,
    vendor: 'Cisco Systems',
    randomized: false,
    hiddenSsid: true,
    serviceUuids: [],
    manufacturerId: null,
    manufacturerDataHex: '',
    rawHex: '',
    extras: 'Stealth / Closed Enterprise WLAN',
    bearingDeg: 45,
    intervalMs: 1000,
    lastEmitted: 0,
  },
  // 9. UniFi Enterprise Access Point
  {
    key: 'WIFI:AC:8B:A9:43:10:E2',
    kind: 'WIFI',
    mac: 'AC:8B:A9:43:10:E2',
    name: 'UBNT-Office-Mesh-5G',
    baseRssi: -48,
    channel: 36,
    frequencyMhz: 5180,
    vendor: 'Ubiquiti Networks',
    randomized: false,
    hiddenSsid: false,
    serviceUuids: [],
    manufacturerId: null,
    manufacturerDataHex: '',
    rawHex: '',
    extras: 'Wi-Fi 6 AP (5GHz band)',
    bearingDeg: 12,
    intervalMs: 800,
    lastEmitted: 0,
  },
  // 10. Google Fast Pair Device (Pixel Buds Pro)
  {
    key: 'BLE:78:28:CA:33:B1:05',
    kind: 'BLE',
    mac: '78:28:CA:33:B1:05',
    name: 'Pixel Buds Pro',
    baseRssi: -55,
    channel: 37,
    frequencyMhz: 2402,
    vendor: 'Google LLC',
    randomized: true,
    hiddenSsid: false,
    serviceUuids: ['FE2C'],
    manufacturerId: 0x00e0,
    manufacturerDataHex: 'e0000214a0',
    rawHex: '',
    extras: 'Fast Pair Audio Peripheral',
    bearingDeg: 160,
    intervalMs: 1400,
    lastEmitted: 0,
  },
];

export class ScannerService {
  private timer: number | null = null;
  private isScanning = false;
  private sightingsMap = new Map<string, Sighting>();
  private emitters: SimulatedEmitter[] = [...INITIAL_EMITTERS];
  private callback: SightingCallback | null = null;
  private currentLat = 37.7749;
  private currentLon = -122.4194;
  private activeFleets: Fleet[] = STOCK_FLEETS;

  constructor() {
    this.initStockSightings();
  }

  setFleets(fleets: Fleet[]) {
    this.activeFleets = fleets;
    // Re-evaluate signatures
    this.matchFleetsForSightings();
  }

  private initStockSightings() {
    const now = Date.now();
    for (const emitter of this.emitters) {
      const dev = this.createOrUpdateSighting(emitter, now - 60000, 0);
      this.sightingsMap.set(dev.key, dev);
    }
    this.matchFleetsForSightings();
  }

  setGpsLocation(lat: number, lon: number) {
    this.currentLat = lat;
    this.currentLon = lon;
  }

  start(cb: SightingCallback, intervalMs = 1200) {
    this.callback = cb;
    this.isScanning = true;

    // Immediately trigger initial callback
    this.triggerCallback([]);

    if (this.timer) clearInterval(this.timer);
    this.timer = window.setInterval(() => {
      if (!this.isScanning) return;
      this.stepScan();
    }, intervalMs);
  }

  stop() {
    this.isScanning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  pause() {
    this.isScanning = false;
  }

  resume() {
    this.isScanning = true;
  }

  getSightings(): Sighting[] {
    return Array.from(this.sightingsMap.values());
  }

  private stepScan() {
    const now = Date.now();
    const newKeys: string[] = [];

    // Pick 2-4 emitters to advertise in this cycle
    const sampleCount = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < sampleCount; i++) {
      const emitter = this.emitters[Math.floor(Math.random() * this.emitters.length)];
      const isNew = !this.sightingsMap.has(emitter.key);
      const dev = this.createOrUpdateSighting(emitter, now, (Math.random() - 0.5) * 6);
      this.sightingsMap.set(dev.key, dev);
      if (isNew) {
        newKeys.push(dev.key);
      }
    }

    this.matchFleetsForSightings();
    this.triggerCallback(newKeys);
  }

  private createOrUpdateSighting(
    emitter: SimulatedEmitter,
    now: number,
    noise: number
  ): Sighting {
    const existing = this.sightingsMap.get(emitter.key);
    const instantRssi = Math.round(emitter.baseRssi + noise);

    const history: RssiSample[] = existing ? [...existing.rssiHistory] : [];
    history.push({ at: now, rssi: instantRssi });
    if (history.length > 50) history.shift();

    // Calculate presence spans (group hits within 15 seconds)
    const presence = existing ? [...existing.presence] : [];
    if (presence.length === 0) {
      presence.push({ start: now, end: now });
    } else {
      const lastSpan = presence[presence.length - 1];
      if (lastSpan.end && now - lastSpan.end < 15000) {
        lastSpan.end = now;
      } else {
        presence.push({ start: now, end: now });
      }
    }

    const minRssi = existing ? Math.min(existing.rssiMin, instantRssi) : instantRssi;
    const maxRssi = existing ? Math.max(existing.rssiMax, instantRssi) : instantRssi;

    return {
      key: emitter.key,
      kind: emitter.kind,
      mac: emitter.mac,
      name: emitter.name,
      rssi: instantRssi,
      rssiMin: minRssi,
      rssiMax: maxRssi,
      channel: emitter.channel,
      frequencyMhz: emitter.frequencyMhz,
      vendor: emitter.vendor,
      randomized: emitter.randomized,
      hiddenSsid: emitter.hiddenSsid,
      serviceUuids: emitter.serviceUuids,
      manufacturerId: emitter.manufacturerId,
      manufacturerDataHex: emitter.manufacturerDataHex,
      rawHex: emitter.rawHex,
      extras: emitter.extras,
      firstSeen: existing ? existing.firstSeen : now,
      lastSeen: now,
      hitCount: (existing ? existing.hitCount : 0) + 1,
      fleetIds: existing ? existing.fleetIds : [],
      rssiHistory: history,
      presence,
      latitude: this.currentLat + (Math.random() - 0.5) * 0.0003,
      longitude: this.currentLon + (Math.random() - 0.5) * 0.0003,
      bearingDeg: emitter.bearingDeg || Math.floor(Math.random() * 360),
    };
  }

  private matchFleetsForSightings() {
    for (const dev of this.sightingsMap.values()) {
      const matchedIds: string[] = [];
      for (const fleet of this.activeFleets) {
        if (!fleet.enabled) continue;
        const matches = this.evaluateFleetRules(dev, fleet);
        if (matches) {
          matchedIds.push(fleet.id);
        }
      }
      dev.fleetIds = matchedIds;
    }
  }

  private evaluateFleetRules(dev: Sighting, fleet: Fleet): boolean {
    if (!fleet.rules || fleet.rules.length === 0) return false;

    const results = fleet.rules
      .filter((r) => r.enabled)
      .map((rule) => {
        switch (rule.kind) {
          case 'RADIO_KIND':
            return rule.radio ? dev.kind === rule.radio : true;
          case 'HIDDEN_SSID':
            return dev.hiddenSsid;
          case 'NAME_CONTAINS':
            return rule.text ? dev.name.toLowerCase().includes(rule.text.toLowerCase()) : false;
          case 'MAC_PREFIX':
            return rule.text ? MacUtil.matchesPrefix(dev.mac, rule.text) : false;
          case 'OUI':
            return rule.text
              ? dev.mac.toUpperCase().startsWith(rule.text.toUpperCase()) ||
                  (dev.vendor ? dev.vendor.toLowerCase().includes(rule.text.toLowerCase()) : false)
              : false;
          case 'SERVICE_UUID':
            return rule.text
              ? dev.serviceUuids.some((uuid) =>
                  uuid.toUpperCase().includes(rule.text!.toUpperCase())
                )
              : false;
          case 'MANUFACTURER_ID':
            return rule.companyId !== undefined ? dev.manufacturerId === rule.companyId : false;
          case 'MANUFACTURER_DATA':
            if (rule.companyId !== undefined && dev.manufacturerId !== rule.companyId) {
              return false;
            }
            if (rule.dataPrefixHex) {
              return dev.manufacturerDataHex
                .toLowerCase()
                .startsWith(rule.dataPrefixHex.toLowerCase());
            }
            return true;
          default:
            return false;
        }
      });

    if (results.length === 0) return false;
    return fleet.matchAny ? results.some(Boolean) : results.every(Boolean);
  }

  private triggerCallback(newKeys: string[]) {
    if (this.callback) {
      this.callback(Array.from(this.sightingsMap.values()), newKeys);
    }
  }

  loadSightingsFromData(sightings: Sighting[]) {
    this.sightingsMap.clear();
    for (const s of sightings) {
      this.sightingsMap.set(s.key, s);
    }
    this.matchFleetsForSightings();
    this.triggerCallback([]);
  }
}

export const scannerService = new ScannerService();
