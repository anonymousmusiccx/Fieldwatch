import React from 'react';
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
  Wifi,
  Bluetooth,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Bookmark,
  Radio,
  ChevronRight,
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
  showSeenTimes: boolean;
  demoMode: boolean;
  nightMode: boolean;
  customNames: Map<string, string>;
  watchlistKeys: Set<string>;
  onSelectDevice: (device: Sighting) => void;
  onHuntDevice?: (device: Sighting) => void;
  onToggleWatch?: (device: Sighting) => void;
}

export const LiveScreen: React.FC<LiveScreenProps> = ({
  devices,
  fleets,
  viewMode,
  onChangeViewMode,
  titleLine,
  subtitleLine,
  showBar,
  showFleet,
  showFrequency,
  showSeenTimes,
  demoMode,
  nightMode,
  customNames,
  watchlistKeys,
  onSelectDevice,
  onHuntDevice,
  onToggleWatch,
}) => {
  const fleetMap = new Map(fleets.map((f) => [f.id, f]));

  const renderModeSwitcher = () => (
    <div className="flex items-center justify-between px-3 pt-2 pb-2 bg-[#0B0F14] border-b border-[#2A3340]/60 select-none">
      <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono">
        {[
          { id: 'RADAR', label: 'Radar Sweep' },
          { id: 'BY_CLASS', label: 'By Class' },
          { id: 'LIST', label: 'Signal List' },
          { id: 'TIMELINE', label: 'Timeline' },
          { id: 'HYBRID', label: 'Telemetry' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChangeViewMode?.(tab.id as ViewMode)}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors whitespace-nowrap ${
              viewMode === tab.id
                ? nightMode
                  ? 'bg-[#3A1212] text-[#FF5A5A] border border-[#FF5A5A]'
                  : 'bg-[#163326] text-[#3DFF9A] border border-[#3DFF9A]'
                : 'text-[#9AA6B2] hover:text-[#D5DCE3] bg-[#141A22] border border-[#2A3340]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <span className="text-[10px] text-[#9AA6B2] shrink-0 ml-2 hidden sm:inline">
        {devices.length} signals
      </span>
    </div>
  );

  const getDeviceTitle = (dev: Sighting): string => {
    const custom = customNames.get(dev.key);
    if (custom) return custom;
    if (titleLine === 'MAC') return MacUtil.screenMac(dev.mac, demoMode);
    if (titleLine === 'ADVERTISED_NAME') {
      return (
        dev.name ||
        (dev.kind === 'WIFI' && dev.hiddenSsid
          ? '<hidden SSID>'
          : MacUtil.screenMac(dev.mac, demoMode))
      );
    }
    return dev.name || dev.vendor || MacUtil.screenMac(dev.mac, demoMode);
  };

  const getDeviceSubtitle = (dev: Sighting): string | null => {
    if (subtitleLine === 'NONE') return null;
    if (subtitleLine === 'MAC') return MacUtil.screenMac(dev.mac, demoMode);
    if (subtitleLine === 'ADVERTISED_NAME') {
      return (
        dev.name ||
        (dev.kind === 'WIFI' && dev.hiddenSsid ? '<hidden>' : 'unnamed LE')
      );
    }
    return (
      dev.vendor ||
      (dev.kind === 'WIFI' ? 'Wi-Fi AP' : 'Bluetooth LE')
    );
  };

  const renderTrendIcon = (dev: Sighting) => {
    if (dev.rssiHistory.length < 3) return null;
    const last = dev.rssiHistory[dev.rssiHistory.length - 1].rssi;
    const prev = dev.rssiHistory[dev.rssiHistory.length - 3].rssi;
    const diff = last - prev;
    if (diff >= 3)
      return (
        <span title="Signal rising">
          <TrendingUp className="w-3.5 h-3.5 text-[#10E79D]" />
        </span>
      );
    if (diff <= -3)
      return (
        <span title="Signal falling">
          <TrendingDown className="w-3.5 h-3.5 text-[#F43F5E]" />
        </span>
      );
    return <Minus className="w-3.5 h-3.5 text-[#94A3B8]" />;
  };

  if (devices.length === 0) {
    return (
      <div>
        {renderModeSwitcher()}
        <div className="flex flex-col items-center justify-center h-80 px-6 text-center">
          <Radio className="w-10 h-10 text-[#94A3B8]/30 mb-3" />
          <p className="text-sm font-semibold text-[#F1F5F9]">
            No radio signals matching current filters
          </p>
          <p className="text-xs text-[#94A3B8] mt-1 max-w-xs">
            Scanning Wi-Fi and Bluetooth LE advertisements. Adjust filter settings or reset filters.
          </p>
        </div>
      </div>
    );
  }

  // 1. INTERACTIVE RF RADAR VIEW
  if (viewMode === 'RADAR') {
    return (
      <div>
        {renderModeSwitcher()}
        <div className="flex flex-col items-center p-2 sm:p-3">
          <InteractiveRfRadar
            devices={devices}
            fleets={fleets}
            selectedKey={null}
            onSelectDevice={onSelectDevice}
            onHuntDevice={onHuntDevice}
            onToggleWatchlist={onToggleWatch}
            isWatchedKey={(key) => watchlistKeys.has(key)}
            customNames={customNames}
            demoMode={demoMode}
            nightMode={nightMode}
          />
          <div className="w-full mt-2 max-w-xl">
            <div className="text-xs font-mono font-bold text-[#94A3B8] uppercase mb-2 flex items-center justify-between">
              <span>Detected Target Table ({devices.length})</span>
              <span className="text-[10px] text-[#9AA6B2]/70">Tap to inspect or lock</span>
            </div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {devices.slice(0, 15).map((dev) => (
                <div
                  key={dev.key}
                  onClick={() => onSelectDevice(dev)}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#161B22] border border-[#2E384D] hover:border-[#10E79D] cursor-pointer text-xs font-mono transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    {dev.kind === 'WIFI' ? (
                      <Wifi className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                    ) : (
                      <Bluetooth className="w-3.5 h-3.5 text-[#10E79D] shrink-0" />
                    )}
                    <span className="truncate">{getDeviceTitle(dev)}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[#10E79D] font-bold">{dev.rssi} dBm</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. TIMELINE VIEW
  if (viewMode === 'TIMELINE') {
    const sessionStart = Math.min(...devices.map((d) => d.firstSeen));
    return (
      <div>
        {renderModeSwitcher()}
        <div className="p-3 space-y-2">
          <div className="flex justify-between text-[11px] font-mono text-[#94A3B8] px-1 pb-1 border-b border-[#2E384D]">
            <span>RADIO / ACTIVITY SPAN</span>
            <span>LAST SEEN</span>
          </div>
          {devices.map((dev) => (
            <div
              key={dev.key}
              onClick={() => onSelectDevice(dev)}
              className="p-3 rounded-lg bg-[#161B22] border border-[#2E384D] hover:border-[#10E79D] cursor-pointer text-xs font-mono"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 truncate">
                  {dev.kind === 'WIFI' ? (
                    <Wifi className="w-3.5 h-3.5 text-[#38BDF8]" />
                  ) : (
                    <Bluetooth className="w-3.5 h-3.5 text-[#10E79D]" />
                  )}
                  <span className="font-semibold text-[#F1F5F9] truncate">
                    {getDeviceTitle(dev)}
                  </span>
                </div>
                <span className="text-[#10E79D]">{dev.rssi} dBm</span>
              </div>
              <PresenceTrack
                presence={dev.presence}
                sessionStart={sessionStart}
                color={nightMode ? '#FF5A5A' : '#10E79D'}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3. HYBRID + SPARKLINES VIEW
  if (viewMode === 'HYBRID') {
    return (
      <div>
        {renderModeSwitcher()}
        <div className="p-2 overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-[#2E384D] text-[#94A3B8] text-[11px]">
                <th className="py-2 px-2">KIND</th>
                <th className="py-2 px-2">TARGET</th>
                <th className="py-2 px-2">RSSI</th>
                <th className="py-2 px-2">SPARKLINE</th>
                <th className="py-2 px-2">SIG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#212836]">
              {devices.map((dev) => {
                const sig = dev.fleetIds
                  .map((id) => fleetMap.get(id)?.name)
                  .filter(Boolean)[0];
                return (
                  <tr
                    key={dev.key}
                    onClick={() => onSelectDevice(dev)}
                    className="hover:bg-[#212836]/60 cursor-pointer"
                  >
                    <td className="py-2 px-2">
                      {dev.kind === 'WIFI' ? (
                        <span className="text-[#38BDF8]">WIFI</span>
                      ) : (
                        <span className="text-[#10E79D]">BLE</span>
                      )}
                    </td>
                    <td className="py-2 px-2 font-medium truncate max-w-[140px]">
                      {getDeviceTitle(dev)}
                    </td>
                    <td className="py-2 px-2 text-[#10E79D]">{dev.rssi}</td>
                    <td className="py-2 px-2">
                      <Sparkline
                        history={dev.rssiHistory}
                        width={54}
                        height={18}
                        color={nightMode ? '#FF5A5A' : '#10E79D'}
                      />
                    </td>
                    <td className="py-2 px-2 text-[#F59E0B] truncate max-w-[100px]">
                      {sig || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 4. BY CLASS VIEW
  if (viewMode === 'BY_CLASS') {
    const groups = new Map<string, Sighting[]>();
    for (const dev of devices) {
      if (dev.fleetIds.length > 0) {
        const primaryFleet = fleetMap.get(dev.fleetIds[0]);
        const clsKey = primaryFleet?.kind || 'OTHER';
        if (!groups.has(clsKey)) groups.set(clsKey, []);
        groups.get(clsKey)!.push(dev);
      } else {
        const unclassifiedKey = dev.kind === 'WIFI' ? 'UNCLASSIFIED_WIFI' : 'UNCLASSIFIED_BLE';
        if (!groups.has(unclassifiedKey)) groups.set(unclassifiedKey, []);
        groups.get(unclassifiedKey)!.push(dev);
      }
    }

    return (
      <div>
        {renderModeSwitcher()}
        <div className="p-3 space-y-4">
          {Array.from(groups.entries()).map(([clsKey, devs]) => {
            let label = 'Unclassified';
            if (clsKey === 'UNCLASSIFIED_WIFI') label = 'Other Wi-Fi Access Points';
            else if (clsKey === 'UNCLASSIFIED_BLE') label = 'Other Bluetooth LE Radios';
            else if (SIGNATURE_CLASS_LABELS[clsKey as SignatureClass]) {
              label = SIGNATURE_CLASS_LABELS[clsKey as SignatureClass];
            }

            return (
              <div key={clsKey} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-[#94A3B8] px-1">
                  <span>{label.toUpperCase()} ({devs.length})</span>
                </div>
                <div className="space-y-1.5">
                  {devs.map((dev) => renderDeviceCard(dev))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 5. DEFAULT STRENGTH LIST VIEW
  return (
    <div>
      {renderModeSwitcher()}
      <div className="p-3 space-y-2">
        {devices.map((dev) => renderDeviceCard(dev))}
      </div>
    </div>
  );

  function renderDeviceCard(dev: Sighting) {
    const subtitle = getDeviceSubtitle(dev);
    const matchedFleets = dev.fleetIds
      .map((id) => fleetMap.get(id))
      .filter((f): f is Fleet => f !== undefined);
    const hasAttention = matchedFleets.some((f) => f.attentionNote);
    const isBookmarked = watchlistKeys.has(dev.key);

    const normRssi = Math.max(0, Math.min(100, ((dev.rssi - -100) / 65) * 100));

    return (
      <div
        key={dev.key}
        onClick={() => onSelectDevice(dev)}
        className="p-3 rounded-xl bg-[#161B22] border border-[#2E384D] hover:border-[#10E79D]/70 transition-all cursor-pointer shadow-sm relative overflow-hidden"
      >
        {/* Subtle background RSSI fill bar if enabled */}
        {showBar && (
          <div
            className={`absolute top-0 bottom-0 left-0 opacity-12 pointer-events-none transition-all duration-300 ${
              nightMode ? 'bg-[#FF5A5A]' : 'bg-[#10E79D]'
            }`}
            style={{ width: `${normRssi}%` }}
          />
        )}

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="mt-0.5 shrink-0">
              {dev.kind === 'WIFI' ? (
                <Wifi className="w-4 h-4 text-[#38BDF8]" />
              ) : (
                <Bluetooth className="w-4 h-4 text-[#10E79D]" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-xs text-[#F1F5F9] truncate font-mono">
                  {getDeviceTitle(dev)}
                </span>
                {dev.randomized && (
                  <span className="px-1 py-0.2 text-[9px] font-mono bg-[#212836] text-[#94A3B8] rounded border border-[#2E384D]">
                    rand
                  </span>
                )}
                {isBookmarked && (
                  <Bookmark className="w-3 h-3 text-[#F59E0B] fill-[#F59E0B]" />
                )}
              </div>

              {subtitle && (
                <p className="text-[11px] text-[#94A3B8] truncate font-mono mt-0.5">
                  {subtitle}
                </p>
              )}

              {/* Matched Signatures */}
              {showFleet && matchedFleets.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {matchedFleets.map((fleet) => (
                    <span
                      key={fleet.id}
                      className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-[#212836] text-[#F59E0B] border border-[#F59E0B]/30"
                    >
                      {fleet.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Extra Attention Warning */}
              {hasAttention && (
                <div className="flex items-center gap-1 mt-1 text-[10px] font-mono text-[#F43F5E]">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    {matchedFleets.find((f) => f.attentionNote)?.attentionNote}
                  </span>
                </div>
              )}

              {/* Live Decoded Chips */}
              {dev.liveDecode && dev.liveDecode.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {dev.liveDecode.map((chip) => (
                    <span
                      key={chip.id}
                      className={`px-1.5 py-0.5 text-[9px] font-mono rounded ${
                        chip.emphasized
                          ? 'bg-[#F43F5E]/20 text-[#FF8A8A] border border-[#F43F5E]/40'
                          : 'bg-[#0E2E20] text-[#10E79D] border border-[#10E79D]/30'
                      }`}
                    >
                      {chip.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: RSSI & Sparkline */}
          <div className="flex flex-col items-end shrink-0 font-mono text-right relative z-10">
            <div className="flex items-center gap-1.5">
              {renderTrendIcon(dev)}
              <span className="text-sm font-bold text-[#10E79D]">
                {dev.rssi} <span className="text-[10px] font-normal text-[#94A3B8]">dBm</span>
              </span>
            </div>

            <div className="mt-1">
              <Sparkline
                history={dev.rssiHistory}
                width={50}
                height={16}
                color={nightMode ? '#FF5A5A' : '#10E79D'}
              />
            </div>

            <div className="flex items-center gap-2 mt-1 text-[10px] text-[#94A3B8]">
              {showFrequency && (
                <span>Ch {dev.channel}</span>
              )}
              {showSeenTimes && (
                <span>{new Date(dev.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
};
