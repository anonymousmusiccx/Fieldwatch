export type RadioKind = 'WIFI' | 'BLE';

export type SignatureClass =
  | 'SURVEILLANCE'
  | 'POLICE_EMERGENCY'
  | 'DRONE_UAV'
  | 'TACTICAL'
  | 'BODY_WORN'
  | 'VEHICLE_FLEET'
  | 'INFRASTRUCTURE'
  | 'CONSUMER'
  | 'UNKNOWN';

export const VISIBLE_SIGNATURE_CLASSES: SignatureClass[] = [
  'SURVEILLANCE',
  'DRONE_UAV',
  'POLICE_EMERGENCY',
  'TACTICAL',
  'BODY_WORN',
  'VEHICLE_FLEET',
  'INFRASTRUCTURE',
  'CONSUMER',
  'UNKNOWN',
];

export const SIGNATURE_CLASS_LABELS: Record<SignatureClass, { label: string; color: string; bg: string; border: string }> = {
  SURVEILLANCE: { label: 'Surveillance / IMSI', color: '#F43F5E', bg: 'rgba(244, 63, 94, 0.15)', border: '#F43F5E' },
  DRONE_UAV: { label: 'Drone / Remote ID', color: '#FB923C', bg: 'rgba(251, 146, 60, 0.15)', border: '#FB923C' },
  POLICE_EMERGENCY: { label: 'Public Safety / Siren', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)', border: '#EF4444' },
  TACTICAL: { label: 'Tactical Radio / Mesh', color: '#EAB308', bg: 'rgba(234, 179, 8, 0.15)', border: '#EAB308' },
  BODY_WORN: { label: 'Body Worn / Wearable', color: '#A855F7', bg: 'rgba(168, 85, 247, 0.15)', border: '#A855F7' },
  VEHICLE_FLEET: { label: 'Fleet Telemetry / OBD', color: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)', border: '#38BDF8' },
  INFRASTRUCTURE: { label: 'Critical Infrastructure', color: '#34D399', bg: 'rgba(52, 211, 153, 0.15)', border: '#34D399' },
  CONSUMER: { label: 'Consumer Device', color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.12)', border: '#94A3B8' },
  UNKNOWN: { label: 'Unclassified RF', color: '#64748B', bg: 'rgba(100, 116, 139, 0.1)', border: '#64748B' },
};

export type RuleKind = 'MAC_PREFIX' | 'SSID_REGEX' | 'MANUFACTURER_DATA' | 'OUI';

export interface MatchRule {
  id: string;
  name: string;
  kind: RuleKind;
  pattern: string;
  className: SignatureClass;
  notes?: string;
}

export interface Fleet {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  color?: string;
  rules: MatchRule[];
}

export interface GpsSample {
  latitude: number;
  longitude: number;
  altitudeMeters?: number;
  accuracyMeters?: number;
  timestampMs: number;
}

export interface PayloadFix {
  lat: number;
  lng: number;
  rssi: number;
  timestampMs: number;
}

export interface Sighting {
  key: string;
  mac: string;
  kind: RadioKind;
  ssid?: string;
  name?: string;
  rssi: number;
  rssiHistory: number[];
  firstSeenMs: number;
  lastSeenMs: number;
  matchedClass?: SignatureClass;
  matchedFleet?: string;
  matchedRule?: string;
  frequencyMhz?: number;
  channel?: number;
  packetCount: number;
  ouiVendor?: string;
  estimatedDistanceMeters?: number;
  bearingDeg?: number;
  latitude?: number;
  longitude?: number;
}

export interface WatchTarget {
  deviceKey: string;
  note?: string;
  addedMs: number;
  customName?: string;
}

export interface FilterState {
  kinds: RadioKind[];
  minRssi: number;
  classes: SignatureClass[];
  searchQuery: string;
  classifiedOnly: boolean;
  watchlistOnly: boolean;
}

export interface FilterPreset {
  id: string;
  name: string;
  filter: FilterState;
}

export type ViewMode = 'RADAR' | 'LIST' | 'BY_CLASS' | 'SIGNAL_HEATMAP';
export type StrengthSort = 'STRONGEST_FIRST' | 'WEAKEST_FIRST' | 'MOST_ACTIVE' | 'NEWEST_FIRST';
export type ListSort = 'RSSI_DESC' | 'RSSI_ASC' | 'LAST_SEEN_DESC' | 'PACKET_COUNT_DESC' | 'NAME_ASC';
export type ListLine = 'MAC' | 'NAME' | 'CLASS' | 'DISTANCE' | 'FREQ';

export interface AppSettings {
  nightMode: boolean;
  demoMode: boolean;
  tagLocation: boolean;
  alertBeep: boolean;
  alertVoice: boolean;
  alertVoiceWhat: 'BOTH' | 'WATCHLIST' | 'CLASSIFIED';
  intensity: 'PASSIVE' | 'BALANCED' | 'AGGRESSIVE';
  keepScreenOn: boolean;
  viewMode: ViewMode;
  strengthSort: StrengthSort;
  listSort: ListSort;
  titleLine: ListLine;
  subtitleLine: ListLine;
  radarRangeMeters: number;
  radarSweepSpeed: 'FAST' | 'NORMAL' | 'SLOW';
  radarAudioPing: boolean;
}

export interface Sit {
  id: string;
  title: string;
  createdAtMs: number;
  sightings: Sighting[];
  operatorPath: GpsSample[];
  durationSec: number;
}

export interface CandidateSignature {
  id: string;
  mac: string;
  name: string;
  kind: RadioKind;
  observedCount: number;
  candidateClass: SignatureClass;
  notes: string;
}
