import React, { useState, useEffect } from 'react';
import { Sighting } from '../types';
import { audioService } from '../domain/audioService';
import { Sparkline } from '../components/Sparkline';
import {
  Crosshair,
  Volume2,
  VolumeX,
  Radio,
  ArrowUp,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';

interface HuntScreenProps {
  devices: Sighting[];
  activeTarget: Sighting | null;
  onSelectTarget: (device: Sighting) => void;
  nightMode?: boolean;
}

export const HuntScreen: React.FC<HuntScreenProps> = ({
  devices,
  activeTarget,
  onSelectTarget,
  nightMode = false,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Periodic Geiger counter ticking based on target signal strength
  useEffect(() => {
    if (!activeTarget || !soundEnabled) return;

    // Normalizing RSSI: -90 dBm -> 1.5s interval; -40 dBm -> 100ms interval
    const clampedRssi = Math.max(-95, Math.min(-35, activeTarget.rssi));
    const normalized = (clampedRssi - (-95)) / 60; // 0.0 to 1.0
    const intervalMs = Math.max(80, Math.floor(1400 - normalized * 1300));

    const id = setInterval(() => {
      audioService.playGeigerClick(0.18 + normalized * 0.15);
    }, intervalMs);

    return () => clearInterval(id);
  }, [activeTarget?.rssi, activeTarget?.key, soundEnabled]);

  if (!activeTarget) {
    return (
      <div className="max-w-xl mx-auto p-4 text-center font-mono">
        <div className="p-8 bg-[#080D14] border border-[#1E293B] rounded-2xl">
          <Crosshair className="w-12 h-12 text-amber-400 mx-auto mb-3 animate-spin-slow" />
          <h2 className="text-base font-bold text-white mb-1">NO ACTIVE HUNT TARGET SELECTED</h2>
          <p className="text-xs text-slate-400 mb-6">
            Select a contact from the radar feed or picker below to initiate audio homing & proximity vectoring.
          </p>

          <div className="space-y-1.5 text-left">
            <span className="text-[11px] text-slate-400 font-bold uppercase">Nearby Transceivers:</span>
            {devices.map((d) => (
              <div
                key={d.key}
                onClick={() => onSelectTarget(d)}
                className="p-2.5 bg-[#0E1724] hover:bg-[#162335] rounded-xl flex items-center justify-between cursor-pointer border border-[#1E293B] hover:border-amber-500/50 transition-all text-xs"
              >
                <div>
                  <div className="font-bold text-white">{d.ssid || d.name || d.mac}</div>
                  <div className="text-[10px] text-slate-400">{d.mac} • {d.ouiVendor}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-amber-400">{d.rssi} dBm</div>
                  <div className="text-[10px] text-slate-400">~{(d.estimatedDistanceMeters ?? 0).toFixed(1)}m</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Active target calculations
  const distance = activeTarget.estimatedDistanceMeters ?? 0;
  const isHot = activeTarget.rssi > -50;
  const normalizedPower = Math.max(0, Math.min(100, ((activeTarget.rssi - (-95)) / 65) * 100));

  return (
    <div className="max-w-xl mx-auto p-3 sm:p-4 font-mono select-none">
      {/* Target Selector Dropdown */}
      <div className="mb-3 flex items-center justify-between p-2.5 bg-[#0B0F17] border border-[#1E293B] rounded-xl text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="p-1 rounded bg-amber-500/20 text-amber-400 shrink-0">
            <Crosshair className="w-4 h-4" />
          </span>
          <div className="truncate">
            <span className="text-[10px] text-slate-400 uppercase">HUNT TARGET:</span>
            <div className="font-bold text-white truncate">
              {activeTarget.ssid || activeTarget.name || activeTarget.mac}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            className={`p-1.5 rounded border transition-colors ${
              soundEnabled
                ? 'bg-amber-950/60 text-amber-400 border-amber-800'
                : 'bg-[#141E2B] text-slate-500 border-[#1E293B]'
            }`}
            title={soundEnabled ? 'Mute Geiger Ticks' : 'Enable Geiger Ticks'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Tactical Proximity Meter */}
      <div
        className={`relative p-6 rounded-2xl border text-center transition-all ${
          isHot
            ? 'bg-[#1F090E] border-rose-500/60 shadow-[0_0_25px_rgba(244,63,94,0.2)]'
            : 'bg-[#080D14] border-[#1E293B]'
        }`}
      >
        <div className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 border font-mono">
          {isHot ? (
            <span className="text-rose-400 border-rose-500/40 bg-rose-500/10 px-2 py-0.5 rounded">
              CRITICAL PROXIMITY / IMMEDIATE ZONE
            </span>
          ) : (
            <span className="text-amber-400 border-amber-500/40 bg-amber-500/10 px-2 py-0.5 rounded">
              HOMING SIGNAL ACQUIRED
            </span>
          )}
        </div>

        <div className="text-5xl font-black tracking-tight text-white mb-1 tabular-nums">
          {distance.toFixed(1)}
          <span className="text-xl font-normal text-slate-400 ml-1">meters</span>
        </div>

        <div className="text-xl font-bold text-amber-400 mb-6 tabular-nums">
          {activeTarget.rssi} <span className="text-xs text-slate-400">dBm</span>
        </div>

        {/* Tactical Signal Strength Arc / Level */}
        <div className="w-full bg-[#111827] h-4 rounded-full overflow-hidden p-0.5 mb-6 border border-[#1E293B]">
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{
              width: `${normalizedPower}%`,
              backgroundColor: isHot ? '#F43F5E' : '#F59E0B',
              boxShadow: `0 0 12px ${isHot ? '#F43F5E' : '#F59E0B'}`,
            }}
          />
        </div>

        {/* Signal History Sparkline */}
        <div className="p-3 bg-[#0B0F17] rounded-xl border border-[#1E293B] flex items-center justify-between text-xs">
          <span className="text-slate-400">SIGNAL HISTORY:</span>
          <Sparkline
            data={activeTarget.rssiHistory}
            width={140}
            height={28}
            color={isHot ? '#F43F5E' : '#F59E0B'}
          />
        </div>
      </div>

      {/* Target Details Grid */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="p-3 bg-[#0B0F17] border border-[#1E293B] rounded-xl">
          <span className="text-slate-500 text-[10px]">MAC ADDRESS</span>
          <div className="font-bold text-white mt-0.5">{activeTarget.mac}</div>
        </div>
        <div className="p-3 bg-[#0B0F17] border border-[#1E293B] rounded-xl">
          <span className="text-slate-500 text-[10px]">VENDOR / OUI</span>
          <div className="font-bold text-white mt-0.5 truncate">{activeTarget.ouiVendor}</div>
        </div>
      </div>
    </div>
  );
};
