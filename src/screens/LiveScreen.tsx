import React, { useState } from 'react';
import {
  Sighting,
  Fleet,
  ViewMode,
  StrengthSort,
  ListSort,
  ListLine,
  SIGNATURE_CLASS_LABELS,
  SignatureClass,
} from '../types';
import { MacUtil } from '../domain/macUtil';
import { InteractiveRfRadar } from '../components/InteractiveRfRadar';
import { Sparkline } from '../components/Sparkline';
import { PresenceTrack } from '../components/PresenceTrack';
import {
  Compass,
  List,
  Layers,
  Activity,
  Wifi,
  Bluetooth,
  Shield,
  Crosshair,
  Bookmark,
  TrendingUp,
  TrendingDown,
  Minus,
  Radio,
} from 'lucide-react';

interface LiveScreenProps {
  devices: Sighting[];
  fleets: Fleet[];
  viewMode: ViewMode;
  onChangeViewMode?: (mode: ViewMode) => void;
  sortMode: StrengthSort;
  listSort: ListSort;
  titleLine: ListLine;
  subtitleLine: ListLine;
  showBar: boolean;
  showFleet: boolean;
  showFrequency: boolean;
  onSelectDevice?: (dev: Sighting) => void;
  onHuntDevice?: (dev: Sighting) => void;
  onToggleWatch?: (dev: Sighting) => void;
  watchlistKeys?: Set<string>;
  nightMode?: boolean;
}

export const LiveScreen: React.FC<LiveScreenProps> = ({
  devices,
  fleets,
  viewMode,
  onChangeViewMode,
  sortMode,
  listSort,
  titleLine,
  subtitleLine,
  showBar,
  showFleet,
  showFrequency,
  onSelectDevice,
  onHuntDevice,
  onToggleWatch,
  watchlistKeys = new Set(),
  nightMode = false,
}) => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // Top mode switcher bar
  const renderModeSwitcher = () => (
    <div className="w-full max-w-xl mx-auto mb-3 flex items-center justify-between p-1 bg-[#080D14] border border-[#1E293B] rounded-xl font-mono text-xs">
      {[
        { mode: 'RADAR' as const, label: 'RADAR', icon: Compass },
        { mode: 'LIST' as const, label: 'FEED', icon: List },
        { mode: 'BY_CLASS' as const, label: 'CLASSES', icon: Layers },
        { mode: 'SIGNAL_HEATMAP' as const, label: 'SPECTRUM', icon: Activity },
      ].map(({ mode, label, icon: Icon }) => (
        <button
          key={mode}
          onClick={() => onChangeViewMode && onChangeViewMode(mode)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-semibold transition-all ${
            viewMode === mode
              ? nightMode
                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                : 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 shadow-sm'
              : 'text-[#94A3B8] hover:text-white hover:bg-[#0E1724]'
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );

  // 1. INTERACTIVE RF RADAR VIEW
  if (viewMode === 'RADAR') {
    return (
      <div className="flex flex-col items-center p-2 sm:p-3">
        {renderModeSwitcher()}
        <InteractiveRfRadar
          devices={devices}
          fleets={fleets}
          selectedKey={selectedKey}
          onSelectDevice={(dev) => {
            setSelectedKey(dev.key);
            if (onSelectDevice) onSelectDevice(dev);
          }}
          onHuntDevice={onHuntDevice}
          onToggleWatchlist={onToggleWatch}
          isWatchedKey={(k) => watchlistKeys.has(k)}
          nightMode={nightMode}
        />
      </div>
    );
  }

  // Helper for trend
  const getTrendIcon = (dev: Sighting) => {
    if (!dev.rssiHistory || dev.rssiHistory.length < 2) return null;
    const prev = dev.rssiHistory[dev.rssiHistory.length - 2];
    const diff = dev.rssi - prev;
    if (diff >= 2)
      return (
        <span title="Signal rising">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
        </span>
      );
    if (diff <= -2)
      return (
        <span title="Signal falling">
          <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
        </span>
      );
    return (
      <span title="Signal steady">
        <Minus className="w-3.5 h-3.5 text-slate-500" />
      </span>
    );
  };

  // 2. LIST VIEW
  if (viewMode === 'LIST') {
    return (
      <div className="max-w-3xl mx-auto p-2 sm:p-3">
        {renderModeSwitcher()}

        {devices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center text-slate-500 font-mono text-xs">
            <Radio className="w-8 h-8 mb-2 opacity-40 text-emerald-400" />
            <p>NO ACTIVE RF SIGNALS IN RANGE</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {devices.map((dev) => {
              const isWatched = watchlistKeys.has(dev.key);
              const classMeta = dev.matchedClass ? SIGNATURE_CLASS_LABELS[dev.matchedClass] : null;

              return (
                <div
                  key={dev.key}
                  onClick={() => onSelectDevice && onSelectDevice(dev)}
                  className="p-2.5 bg-[#0B0F17] hover:bg-[#111827] border border-[#1E293B] hover:border-[#334155] rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all font-mono text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`p-1.5 rounded-lg ${
                        dev.kind === 'WIFI'
                          ? 'bg-sky-950/60 text-sky-400 border border-sky-800/40'
                          : 'bg-indigo-950/60 text-indigo-400 border border-indigo-800/40'
                      }`}
                    >
                      {dev.kind === 'WIFI' ? <Wifi className="w-4 h-4" /> : <Bluetooth className="w-4 h-4" />}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-bold text-white text-sm truncate">
                          {dev.ssid || dev.name || 'Unnamed Contact'}
                        </span>
                        {isWatched && (
                          <Bookmark className="w-3.5 h-3.5 text-rose-400 fill-rose-400 shrink-0" />
                        )}
                        {classMeta && (
                          <span
                            className="text-[9px] px-1.5 py-0.2 rounded font-bold shrink-0"
                            style={{
                              backgroundColor: classMeta.bg,
                              color: classMeta.color,
                              border: `1px solid ${classMeta.border}60`,
                            }}
                          >
                            {dev.matchedClass}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-[#94A3B8] flex items-center gap-2 mt-0.5">
                        <span className="text-slate-400">{dev.mac}</span>
                        <span>•</span>
                        <span className="truncate">{dev.ouiVendor || 'Unknown'}</span>
                        {dev.frequencyMhz && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500">{dev.frequencyMhz}MHz (CH {dev.channel})</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Sparkline data={dev.rssiHistory} width={64} height={18} color="#10E79D" />

                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1 font-bold text-white">
                        <span>{dev.rssi} dBm</span>
                        {getTrendIcon(dev)}
                      </div>
                      <div className="text-[10px] text-emerald-400">
                        ~{(dev.estimatedDistanceMeters ?? 0).toFixed(1)}m
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {onHuntDevice && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onHuntDevice(dev);
                          }}
                          title="Homing Hunt Mode"
                          className="p-1.5 bg-[#1E293B] hover:bg-amber-500 hover:text-black rounded text-amber-400 transition-colors"
                        >
                          <Crosshair className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // 3. BY CLASS VIEW
  if (viewMode === 'BY_CLASS') {
    const classGroups: Record<SignatureClass, Sighting[]> = {
      SURVEILLANCE: [],
      DRONE_UAV: [],
      POLICE_EMERGENCY: [],
      TACTICAL: [],
      BODY_WORN: [],
      VEHICLE_FLEET: [],
      INFRASTRUCTURE: [],
      CONSUMER: [],
      UNKNOWN: [],
    };

    devices.forEach((d) => {
      const c = d.matchedClass || 'UNKNOWN';
      if (classGroups[c]) {
        classGroups[c].push(d);
      } else {
        classGroups['UNKNOWN'].push(d);
      }
    });

    return (
      <div className="max-w-3xl mx-auto p-2 sm:p-3">
        {renderModeSwitcher()}

        <div className="space-y-4">
          {(Object.keys(classGroups) as SignatureClass[]).map((className) => {
            const group = classGroups[className];
            if (group.length === 0) return null;
            const meta = SIGNATURE_CLASS_LABELS[className];

            return (
              <div key={className} className="bg-[#080D14] border border-[#1E293B] rounded-xl p-3">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1E293B]">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                    <span className="font-bold text-white text-xs font-mono tracking-wider">
                      {meta.label.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-400 font-semibold">
                    {group.length} {group.length === 1 ? 'contact' : 'contacts'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {group.map((dev) => (
                    <div
                      key={dev.key}
                      onClick={() => onSelectDevice && onSelectDevice(dev)}
                      className="p-2 bg-[#0E1724] hover:bg-[#162438] rounded-lg flex items-center justify-between font-mono text-xs cursor-pointer border border-transparent hover:border-[#334155] transition-all"
                    >
                      <div>
                        <div className="font-bold text-white">
                          {dev.ssid || dev.name || dev.mac}
                        </div>
                        <div className="text-[10px] text-slate-400">{dev.mac} • {dev.ouiVendor}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-400">{dev.rssi} dBm</div>
                        <div className="text-[10px] text-slate-400">
                          ~{(dev.estimatedDistanceMeters ?? 0).toFixed(1)}m
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 4. SPECTRUM / SIGNAL HEATMAP VIEW
  return (
    <div className="max-w-3xl mx-auto p-2 sm:p-3">
      {renderModeSwitcher()}

      <div className="bg-[#080D14] border border-[#1E293B] rounded-xl p-4 font-mono text-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-white font-bold">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>RF SIGNAL STRENGTH SPECTRUM DISTRIBUTION</span>
          </div>
          <span className="text-slate-400">{devices.length} transmitters</span>
        </div>

        {/* RSSI Distribution Bars */}
        <div className="space-y-2 mb-6">
          {[
            { range: '> -45 dBm (Immediate)', min: -45, max: 0, color: '#F43F5E' },
            { range: '-45 to -60 dBm (Near)', min: -60, max: -45, color: '#FB923C' },
            { range: '-60 to -75 dBm (Tactical)', min: -75, max: -60, color: '#EAB308' },
            { range: '-75 to -90 dBm (Strategic)', min: -90, max: -75, color: '#38BDF8' },
            { range: '< -90 dBm (Marginal)', min: -120, max: -90, color: '#64748B' },
          ].map((bucket) => {
            const count = devices.filter((d) => d.rssi >= bucket.min && d.rssi < bucket.max).length;
            const pct = devices.length > 0 ? (count / devices.length) * 100 : 0;
            return (
              <div key={bucket.range} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300">{bucket.range}</span>
                  <span className="font-bold text-white">{count} ({pct.toFixed(0)}%)</span>
                </div>
                <div className="h-2 w-full bg-[#111827] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: bucket.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Contact Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {devices.slice(0, 8).map((d) => (
            <div
              key={d.key}
              onClick={() => onSelectDevice && onSelectDevice(d)}
              className="p-2.5 bg-[#0E1724] border border-[#1E293B] rounded-lg cursor-pointer hover:border-emerald-500/40"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white truncate max-w-[140px]">
                  {d.ssid || d.name || d.mac}
                </span>
                <span className="font-bold text-emerald-400">{d.rssi} dBm</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                <span>{d.kind} • CH {d.channel || 1}</span>
                <PresenceTrack rssi={d.rssi} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
