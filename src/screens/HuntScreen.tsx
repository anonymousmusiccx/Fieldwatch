import React, { useEffect, useState } from 'react';
import { Sighting } from '../types';
import { MacUtil } from '../domain/macUtil';
import { audioService } from '../domain/audioService';
import { Sparkline } from '../components/Sparkline';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Crosshair,
  TrendingUp,
  TrendingDown,
  Minus,
  Radio,
  Flame,
} from 'lucide-react';

interface HuntScreenProps {
  device: Sighting | null;
  onBack: () => void;
  huntBeep: boolean;
  huntVibrate: boolean;
  onToggleHuntBeep: () => void;
  demoMode: boolean;
  nightMode: boolean;
}

export const HuntScreen: React.FC<HuntScreenProps> = ({
  device,
  onBack,
  huntBeep,
  huntVibrate,
  onToggleHuntBeep,
  demoMode,
  nightMode,
}) => {
  const [lastRssi, setLastRssi] = useState(device?.rssi || -75);

  useEffect(() => {
    if (!device) return;
    setLastRssi(device.rssi);

    // Audio geiger tick
    if (huntBeep) {
      audioService.tickHuntRssi(device.rssi);
    }

    // Optional haptic vibration if supported
    if (huntVibrate && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      if (device.rssi > -60) {
        navigator.vibrate(40);
      }
    }
  }, [device, huntBeep, huntVibrate]);

  if (!device) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <p className="text-sm text-[#9AA6B2]">No target radio selected for hunt.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-[#1B232D] text-white rounded font-mono text-xs"
        >
          Return to Live
        </button>
      </div>
    );
  }

  const maskedMac = MacUtil.screenMac(device.mac, demoMode);

  // Proximity gauge calculations (-100 dBm to -35 dBm)
  const clamped = Math.max(-100, Math.min(-35, device.rssi));
  const pct = ((clamped - -100) / 65) * 100;

  let proximityLabel = 'SIGNAL DETECTED · DISTANT';
  let proximityColor = 'text-[#9AA6B2]';
  if (device.rssi >= -50) {
    proximityLabel = 'IMMEDIATE VICINITY · HOT';
    proximityColor = 'text-[#FF3D5A]';
  } else if (device.rssi >= -65) {
    proximityLabel = 'PROXIMITY ELEVATED · WARM';
    proximityColor = 'text-[#FFB020]';
  } else if (device.rssi >= -80) {
    proximityLabel = 'CLOSING DISTANCE';
    proximityColor = 'text-[#3DFF9A]';
  }

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-[#0B0F14] text-white font-mono select-none overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#2A3340] bg-[#141A22]">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 p-1 text-[#9AA6B2] hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold text-xs">Exit Hunt</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] font-bold text-[#FF3D5A] tracking-wider uppercase bg-[#FF3D5A]/15 px-2.5 py-1 rounded border border-[#FF3D5A]/30 animate-pulse">
            <Crosshair className="w-3.5 h-3.5" />
            <span>HUNT ACTIVE</span>
          </div>

          <button
            onClick={onToggleHuntBeep}
            className={`p-2 rounded-lg border transition-colors ${
              huntBeep
                ? 'bg-[#163326] border-[#3DFF9A] text-[#3DFF9A]'
                : 'bg-[#1B232D] border-[#2A3340] text-[#9AA6B2]'
            }`}
            title="Geiger Audio Clicker"
          >
            {huntBeep ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Target Info */}
      <div className="p-4 bg-[#141A22] border-b border-[#2A3340] text-center space-y-1">
        <span className="text-[10px] text-[#9AA6B2] uppercase tracking-widest block font-sans">
          TRACKING TARGET
        </span>
        <h2 className="text-lg font-bold tracking-wider text-[#D5DCE3]">
          {maskedMac}
        </h2>
        {device.name && (
          <p className="text-xs text-[#3DFF9A] font-sans font-medium">
            "{device.name}"
          </p>
        )}
        <div className="flex items-center justify-center gap-3 text-[11px] text-[#9AA6B2] pt-1">
          <span>{device.kind === 'WIFI' ? 'Wi-Fi AP' : 'Bluetooth LE'}</span>
          <span>·</span>
          <span>Ch {device.channel} ({device.frequencyMhz} MHz)</span>
          {device.vendor && (
            <>
              <span>·</span>
              <span>{device.vendor}</span>
            </>
          )}
        </div>
      </div>

      {/* Center Giant RSSI Meter */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <span
              className={`text-7xl font-black font-mono tracking-tighter ${
                device.rssi >= -55
                  ? 'text-[#FF3D5A]'
                  : device.rssi >= -70
                  ? 'text-[#FFB020]'
                  : 'text-[#3DFF9A]'
              }`}
            >
              {device.rssi}
            </span>
            <span className="text-lg font-normal text-[#9AA6B2] self-end mb-2">
              dBm
            </span>
          </div>

          <div className={`text-xs font-bold tracking-widest ${proximityColor}`}>
            {proximityLabel}
          </div>
        </div>

        {/* Hot / Cold Signal Bar */}
        <div className="w-full space-y-2 max-w-sm">
          <div className="flex justify-between text-[10px] text-[#9AA6B2]">
            <span>-100 dBm (COLD)</span>
            <span>-65 dBm</span>
            <span>-35 dBm (HOT)</span>
          </div>

          <div className="h-6 w-full rounded-lg bg-[#1B232D] border border-[#2A3340] overflow-hidden p-0.5 relative">
            <div
              className={`h-full rounded transition-all duration-200 ${
                device.rssi >= -55
                  ? 'bg-gradient-to-r from-[#FFB020] to-[#FF3D5A]'
                  : 'bg-gradient-to-r from-[#4FC3F7] to-[#3DFF9A]'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Geiger Audio Indicator */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#9AA6B2] bg-[#141A22] px-4 py-2 rounded-full border border-[#2A3340]">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              huntBeep ? 'bg-[#3DFF9A] animate-ping' : 'bg-[#9AA6B2]/40'
            }`}
          />
          <span>
            {huntBeep ? 'Geiger audio clicks enabled' : 'Geiger audio muted'}
          </span>
        </div>

        {/* Full Sparkline Real-time graph */}
        <div className="w-full max-w-sm p-3 bg-[#141A22] rounded-xl border border-[#2A3340] space-y-2">
          <div className="flex items-center justify-between text-[10px] text-[#9AA6B2]">
            <span>ROLLING SIGNAL GRAPH</span>
            <span>Min: {device.rssiMin} / Max: {device.rssiMax}</span>
          </div>
          <div className="flex justify-center bg-[#0B0F14] p-2 rounded">
            <Sparkline
              history={device.rssiHistory}
              width={300}
              height={44}
              color={device.rssi >= -55 ? '#FF3D5A' : '#3DFF9A'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
