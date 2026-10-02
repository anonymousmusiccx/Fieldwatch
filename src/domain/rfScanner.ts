import { registerPlugin, Capacitor, type PluginListenerHandle } from '@capacitor/core';

export interface RawRf {
  kind: 'WIFI' | 'BLE';
  mac: string;
  name?: string;
  ssid?: string;
  rssi: number;
  frequency?: number;
  mfrId?: number;
}

export interface StartResult {
  wifi: boolean;
  ble: boolean;
  locationEnabled: boolean;
  bluetoothEnabled: boolean;
}

export interface PermResult {
  granted: boolean;
  locationGranted?: boolean;
  bleGranted?: boolean;
}

interface RfScannerPlugin {
  requestPerms(): Promise<PermResult>;
  start(o: { wifi: boolean; ble: boolean }): Promise<StartResult>;
  stop(): Promise<void>;
  addListener(ev: 'devices', cb: (e: { devices: RawRf[] }) => void): Promise<PluginListenerHandle>;
}

export const RfScanner = registerPlugin<RfScannerPlugin>('RfScanner');
export const isNative = () => Capacitor.isNativePlatform();
