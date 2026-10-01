export type RadioKind = 'WIFI' | 'BLE';

export type ViewMode = 'BY_CLASS' | 'LIST' | 'RADAR' | 'TIMELINE' | 'HYBRID';
export type StrengthSort = 'AVERAGE' | 'INSTANT';
export type ListSort =
  | 'STRENGTH'
  | 'NEWEST'
  | 'NEWEST_ALERT'
  | 'FIRST_SEEN'
  | 'ARRIVAL'
  | 'NAME'
  | 'SIGNATURES';

export type ListLine = 'ADVERTISED_NAME' | 'NAME_AND_TYPE' | 'MAC' | 'NONE';

export type SignatureClass =
  | 'FINDER'
  | 'BEACON'
  | 'SIGNAGE'
  | 'WEARABLE'
  | 'SURVEILLANCE'
  | 'DRONE'
  | 'HACKING'
  | 'BODYWORN'
  | 'LAW_ENFORCEMENT'
  | 'VEHICLE'
  | 'GLASSES'
  | 'AUDIO'
  | 'CAMERA'
  | 'THERMOSTAT'
  | 'LOCK'
  | 'HEALTH'
  | 'HOME'
  | 'ISP'
  | 'MESH'
  | 'PHONE'
  | 'OTHER';

export const VISIBLE_SIGNATURE_CLASSES: SignatureClass[] = [
  'FINDER',
  'BEACON',
  'SIGNAGE',
  'WEARABLE',
  'SURVEILLANCE',
  'DRONE',
  'HACKING',
  'LAW_ENFORCEMENT',
  'VEHICLE',
  'GLASSES',
  'AUDIO',
  'CAMERA',
  'THERMOSTAT',
  'LOCK',
  'HEALTH',
  'HOME',
  'ISP',
  'MESH',
  'PHONE',
  'OTHER',
];

export const SIGNATURE_CLASS_LABELS: Record<SignatureClass, string> = {
  FINDER: 'Finder tags',
  BEACON: 'Retail beacons',
  SIGNAGE: 'Signage / displays',
  WEARABLE: 'Wearables',
  SURVEILLANCE: 'Surveillance',
  DRONE: 'Drones / Remote ID',
  HACKING: 'Pentest / hacking tools',
  BODYWORN: 'Body-worn video',
  LAW_ENFORCEMENT: 'Public safety / police',
  VEHICLE: 'Vehicles',
  GLASSES: 'Smart glasses',
  AUDIO: 'Headphones / audio',
  CAMERA: 'Cameras',
  THERMOSTAT: 'Thermostats',
  LOCK: 'Access control / locks',
  HEALTH: 'Medical / health',
  HOME: 'Home IoT',
  ISP: 'ISP / routers',
  MESH: 'Mesh networking',
  PHONE: 'Phones / PCs',
  OTHER: 'Other equipment',
};

export type RuleKind =
  | 'OUI'
  | 'MAC_PREFIX'
  | 'NAME_CONTAINS'
  | 'NAME_GLOB'
  | 'SERVICE_UUID'
  | 'SERVICE_DATA'
  | 'MANUFACTURER_ID'
  | 'MANUFACTURER_DATA'
  | 'RADIO_KIND'
  | 'HIDDEN_SSID'
  | 'VENDOR_IE_OUI';

export interface MatchRule {
  kind: RuleKind;
  text?: string;
  companyId?: number;
  dataPrefixHex?: string;
  radio?: RadioKind | null;
  enabled: boolean;
}

export type DecodeSource = 'manufacturerData' | 'serviceData' | 'unsupported';

export interface FieldGate {
  op: 'eq' | 'neq' | 'len';
  offset: number;
  length?: number;
  valueHex: string;
}

export interface DecodeFieldDef {
  id: string;
  label: string;
  offset: number;
  length?: number;
  type: 'u8' | 'i8' | 'u16' | 'i16' | 'u32' | 'i32' | 'utf8' | 'hex' | 'bool';
  endian?: 'le' | 'be';
  scale?: number;
  offsetAdd?: number;
  modulo?: number;
  unit?: string;
  live?: boolean;
  liveEmphasis?: string[];
  enumLabels?: Record<string, string>;
  gate?: FieldGate;
}

export interface FleetDecode {
  source: DecodeSource;
  serviceUuid?: string;
  includeCompanyId?: boolean;
  fields: DecodeFieldDef[];
}

export interface Fleet {
  id: string;
  name: string;
  enabled: boolean;
  matchAny: boolean;
  colorIndex: number;
  rules: MatchRule[];
  minPeers?: number;
  peerWindowSec?: number;
  notes: string;
  attentionNote: string;
  builtIn: boolean;
  kind: SignatureClass;
  decode?: FleetDecode | null;
}

export interface RssiSample {
  at: number;
  rssi: number;
}

export interface PresenceSpan {
  start: number;
  end: number | null;
}

export interface GpsSample {
  at: number;
  lat: number;
  lon: number;
  alt?: number;
  accuracy?: number;
}

export interface PayloadFix {
  at: number;
  lat: number;
  lon: number;
  alt?: number;
}

export interface LiveDecodeChip {
  id: string;
  label: string;
  emphasized: boolean;
}

export interface RadioFacts {
  serviceData?: { uuid: string; dataHex: string }[];
  vendorIes?: { oui: string; type: number; dataHex: string }[];
}

export interface Sighting {
  key: string; // "WIFI:AA:BB:CC:DD:EE:FF" or "BLE:AA:BB:CC:DD:EE:FF"
  kind: RadioKind;
  mac: string;
  name: string;
  rssi: number;
  rssiMin: number;
  rssiMax: number;
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
  firstSeen: number;
  lastSeen: number;
  hitCount: number;
  fleetIds: string[];
  rssiHistory: RssiSample[];
  presence: PresenceSpan[];
  latitude?: number;
  longitude?: number;
  altitude?: number;
  gpsTrail?: GpsSample[];
  bearingDeg?: number;
  fastPairPairing?: boolean;
  facts?: RadioFacts;
  liveDecode?: LiveDecodeChip[];
  payloadLat?: number;
  payloadLon?: number;
  payloadAlt?: number;
  payloadTrail?: PayloadFix[];
}

export interface FilterState {
  showWifi: boolean;
  showBle: boolean;
  rssiMin: number;
  namedOnly: boolean;
  customNamesOnly: boolean;
  watchedOnly: boolean;
  hideFastPairAccountKey: boolean;
  movingWithYou: boolean;
  arrivalsOnly: boolean;
  nameQuery: string;
  ouiQuery: string;
  useClassFilter: boolean;
  excludeClasses: boolean;
  classes: SignatureClass[];
  useFleetFilter: boolean;
  excludeSignatures: boolean;
  fleetIds: string[];
  includeSignatures: boolean;
  includeFleetIds: string[];
}

export interface FilterPreset {
  id: string;
  name: string;
  filter: FilterState;
}

export interface WatchTarget {
  id: string;
  deviceKey?: string;
  fleetId?: string;
  label: string;
  alert: boolean;
  observerNotes?: string;
}

export interface Sit {
  id: string;
  name: string;
  openedAt: number;
  closedAt: number | null;
  devices: Sighting[];
  operatorPath: GpsSample[];
}

export type AlertVoiceWhat = 'CLASS' | 'SIGNATURE' | 'BOTH';
export type ScanIntensity = 'SAVER' | 'BALANCED' | 'PERFORMANCE';
export type LogFormat = 'CSV' | 'JSONL';

export interface AppSettings {
  nightMode: boolean;
  demoMode: boolean;
  tagLocation: boolean;
  alertBeep: boolean;
  alertVoice: boolean;
  alertVoiceWhat: AlertVoiceWhat;
  intensity: ScanIntensity;
  keepScreenOn: boolean;
  viewMode: ViewMode;
  strengthSort: StrengthSort;
  listSort: ListSort;
  averageWindowSec: number;
  decaySec: number;
  showRssiBar: boolean;
  showFleetName: boolean;
  showFrequency: boolean;
  showSeenTimes: boolean;
  listTitleLine: ListLine;
  listSubtitleLine: ListLine;
  disclaimerAccepted: boolean;
}

export interface CandidateSignature {
  id: string;
  name: string;
  kind: SignatureClass;
  oui: string;
  occurrences: number;
  suggestedRules: MatchRule[];
}
