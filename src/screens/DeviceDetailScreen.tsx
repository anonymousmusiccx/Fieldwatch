import React from 'react';
import { Sighting } from '../types';
import { Sparkline } from '../components/Sparkline';
import { PresenceTrack } from '../components/PresenceTrack';
import {
  ChevronLeft,
  Crosshair,
  Bookmark,
  Wifi,
  Bluetooth,
  Shield,
  Activity,
  Radio,
  Clock,
  Compass,
} from 'lucide-react';

interface DeviceDetailScreenProps {
  device: Sighting;
  onBack: () => void;
  onHunt: (device: Sighting) => void;
  onToggleWatch: (device: Sighting) => void;
  isWatched: boolean;
  nightMode?: boolean;
}

export const DeviceDetailScreen: React.FC<DeviceDetailScreenProps> = ({
  device,
  onBack,
  onHunt,
  onToggleWatch,
  isWatched,
  nightMode = false,
}) => {
  return (
    <div className="max-w-xl mx-auto p-3 sm:p-4 font-mono text-xs select-none">
      {/* Top back bar */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E293B]">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white px-2 py-1 bg-[#141E2B] rounded-lg transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>RETURN TO FEED</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onToggleWatch(device)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border font-bold transition-all ${
              isWatched
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/60'
                : 'bg-[#141E2B] text-slate-300 border-[#1E293B] hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>{isWatched ? 'WATCHLISTED' : 'ADD TO WATCHLIST'}</span>
          </button>

          <button
            onClick={() => onHunt(device)}
            className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>HOMING HUNT</span>
          </button>
        </div>
      </div>

      {/* Main Identity Card */}
      <div className="bg-[#080D14] border border-[#1E293B] rounded-2xl p-4 mb-3">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <span
              className={`p-3 rounded-xl ${
                device.kind === 'WIFI'
                  ? 'bg-sky-950/60 text-sky-400 border border-sky-800'
                  : 'bg-indigo-950/60 text-indigo-400 border border-indigo-800'
              }`}
            >
              {device.kind === 'WIFI' ? <Wifi className="w-6 h-6" /> : <Bluetooth className="w-6 h-6" />}
            </span>
            <div>
              <h1 className="text-base font-bold text-white">
                {device.ssid || device.name || 'Unnamed Contact'}
              </h1>
              <div className="text-slate-400 text-[11px] mt-0.5">{device.mac}</div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xl font-bold text-emerald-400">{device.rssi} dBm</div>
            <div className="text-[11px] text-slate-400">
              ~{(device.estimatedDistanceMeters ?? 0).toFixed(1)}m away
            </div>
          </div>
        </div>

        {/* Classification Tag */}
        {device.matchedClass && (
          <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-between text-rose-300">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-rose-400" />
              <span>CLASSIFIED THREAT: {device.matchedClass}</span>
            </div>
            <span className="text-[10px] text-slate-400">{device.matchedFleet}</span>
          </div>
        )}
      </div>

      {/* Signal History Graph */}
      <div className="bg-[#080D14] border border-[#1E293B] rounded-2xl p-4 mb-3">
        <div className="flex items-center justify-between mb-3 text-white font-bold">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>RECEIVED SIGNAL STRENGTH (RSSI) HISTORY</span>
          </div>
          <span className="text-slate-500 text-[10px]">{device.rssiHistory.length} samples</span>
        </div>

        <div className="py-2 flex justify-center">
          <Sparkline data={device.rssiHistory} width={340} height={60} color="#10E79D" />
        </div>
      </div>

      {/* Hardware & RF Telemetry Grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-3 bg-[#080D14] border border-[#1E293B] rounded-xl">
          <span className="text-slate-500 text-[10px]">OUI VENDOR</span>
          <div className="font-bold text-white mt-1">{device.ouiVendor || 'Unknown'}</div>
        </div>

        <div className="p-3 bg-[#080D14] border border-[#1E293B] rounded-xl">
          <span className="text-slate-500 text-[10px]">RADAR BEARING</span>
          <div className="font-bold text-sky-400 mt-1">{(device.bearingDeg ?? 0).toFixed(0)}° Azimuth</div>
        </div>

        <div className="p-3 bg-[#080D14] border border-[#1E293B] rounded-xl">
          <span className="text-slate-500 text-[10px]">FREQUENCY & CHANNEL</span>
          <div className="font-bold text-white mt-1">
            {device.frequencyMhz ? `${device.frequencyMhz} MHz (CH ${device.channel})` : '2.4 GHz ISM'}
          </div>
        </div>

        <div className="p-3 bg-[#080D14] border border-[#1E293B] rounded-xl">
          <span className="text-slate-500 text-[10px]">PACKET COUNT</span>
          <div className="font-bold text-white mt-1">{device.packetCount} frames logged</div>
        </div>
      </div>
    </div>
  );
};
