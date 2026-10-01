import React from 'react';
import {
  ViewMode,
  StrengthSort,
  ListSort,
  ListLine,
} from '../types';
import {
  X,
  Compass,
  List,
  Layers,
  Activity,
  GitBranch,
} from 'lucide-react';

interface ViewPickerProps {
  mode: ViewMode;
  sort: StrengthSort;
  listSort: ListSort;
  windowSec: number;
  decaySec: number;
  showRssiBar: boolean;
  showFleetName: boolean;
  showFrequency: boolean;
  showSeenTimes: boolean;
  listTitleLine: ListLine;
  listSubtitleLine: ListLine;
  onChangeMode: (m: ViewMode) => void;
  onChangeSort: (s: StrengthSort) => void;
  onChangeListSort: (s: ListSort) => void;
  onChangeWindowSec: (sec: number) => void;
  onChangeDecaySec: (sec: number) => void;
  onToggleShowRssiBar: () => void;
  onToggleShowFleetName: () => void;
  onToggleShowFrequency: () => void;
  onToggleShowSeenTimes: () => void;
  onChangeTitleLine: (line: ListLine) => void;
  onChangeSubtitleLine: (line: ListLine) => void;
  onClose: () => void;
  nightMode?: boolean;
}

export const ViewPicker: React.FC<ViewPickerProps> = ({
  mode,
  sort,
  listSort,
  windowSec,
  decaySec,
  showRssiBar,
  showFleetName,
  showFrequency,
  showSeenTimes,
  listTitleLine,
  listSubtitleLine,
  onChangeMode,
  onChangeSort,
  onChangeListSort,
  onChangeWindowSec,
  onChangeDecaySec,
  onToggleShowRssiBar,
  onToggleShowFleetName,
  onToggleShowFrequency,
  onToggleShowSeenTimes,
  onChangeTitleLine,
  onChangeSubtitleLine,
  onClose,
  nightMode = false,
}) => {
  const modes: { id: ViewMode; label: string; desc: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'BY_CLASS', label: 'By Class', desc: 'Tactical grouping by signature class', icon: Layers },
    { id: 'RADAR', label: 'Classic Radar', desc: 'Polar sweep display with bearing rings', icon: Compass },
    { id: 'LIST', label: 'Signal List', desc: 'Dense high-visibility radio cards', icon: List },
    { id: 'TIMELINE', label: 'Timeline Track', desc: 'Presence intervals over observation window', icon: Activity },
    { id: 'HYBRID', label: 'Telemetry Grid', desc: 'Multi-column telemetry with live sparklines', icon: GitBranch },
  ];

  const activeColor = nightMode ? 'text-[#FF3D5A]' : 'text-[#3DFF9A]';
  const activeBorder = nightMode ? 'border-[#FF3D5A]' : 'border-[#3DFF9A]';
  const activeBg = nightMode ? 'bg-[#3A1212]' : 'bg-[#163326]';

  return (
    <div className="bg-[#141A22] border-b border-[#2A3340] p-4 text-xs font-mono select-none space-y-4 max-w-2xl mx-auto shadow-2xl">
      <div className="flex items-center justify-between pb-2 border-b border-[#2A3340]">
        <span className="font-bold text-sm text-[#D5DCE3]">
          TUNING & DISPLAY MODES
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded text-[#9AA6B2] hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 1. Visualization Mode Selection */}
      <div>
        <div className="text-[11px] font-bold text-[#9AA6B2] uppercase mb-2">
          Visualization Mode
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {modes.map((m) => {
            const Icon = m.icon;
            const isSelected = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => onChangeMode(m.id)}
                className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition-all ${
                  isSelected
                    ? `${activeBg} ${activeBorder} ${activeColor}`
                    : 'bg-[#1B232D] border-[#2A3340] text-[#D5DCE3] hover:border-[#3DFF9A]/40'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <Icon className="w-4 h-4" />
                  <span>{m.label}</span>
                </div>
                <span className="text-[10px] text-[#9AA6B2] leading-tight">
                  {m.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Sort & Window Settings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#2A3340]">
        <div>
          <label className="text-[11px] font-bold text-[#9AA6B2] uppercase block mb-1.5">
            Strength Metric
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onChangeSort('INSTANT')}
              className={`py-1.5 rounded border text-center font-semibold ${
                sort === 'INSTANT'
                  ? `${activeBg} ${activeBorder} ${activeColor}`
                  : 'bg-[#1B232D] border-[#2A3340] text-[#9AA6B2]'
              }`}
            >
              Instant RSSI
            </button>
            <button
              onClick={() => onChangeSort('AVERAGE')}
              className={`py-1.5 rounded border text-center font-semibold ${
                sort === 'AVERAGE'
                  ? `${activeBg} ${activeBorder} ${activeColor}`
                  : 'bg-[#1B232D] border-[#2A3340] text-[#9AA6B2]'
              }`}
            >
              Rolling Average
            </button>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-[#9AA6B2] uppercase block mb-1.5">
            List Ordering
          </label>
          <select
            value={listSort}
            onChange={(e) => onChangeListSort(e.target.value as ListSort)}
            className="w-full bg-[#1B232D] border border-[#2A3340] rounded p-2 text-xs text-[#D5DCE3]"
          >
            <option value="STRENGTH">By Signal Strength (Strongest first)</option>
            <option value="NEWEST">By Newest Heard</option>
            <option value="FIRST_SEEN">By First Heard</option>
            <option value="NAME">By Name / OUI</option>
            <option value="SIGNATURES">By Matched Signatures</option>
          </select>
        </div>
      </div>

      {/* 3. Rolling Window & Decay Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#2A3340]">
        <div>
          <div className="flex justify-between text-[11px] text-[#9AA6B2] mb-1">
            <span>AVERAGE WINDOW</span>
            <span className="font-bold text-[#D5DCE3]">{windowSec}s</span>
          </div>
          <input
            type="range"
            min={3}
            max={60}
            step={1}
            value={windowSec}
            onChange={(e) => onChangeWindowSec(Number(e.target.value))}
            className="w-full accent-[#3DFF9A]"
          />
        </div>

        <div>
          <div className="flex justify-between text-[11px] text-[#9AA6B2] mb-1">
            <span>SIGNAL DECAY TIMEOUT</span>
            <span className="font-bold text-[#D5DCE3]">{decaySec}s</span>
          </div>
          <input
            type="range"
            min={10}
            max={300}
            step={10}
            value={decaySec}
            onChange={(e) => onChangeDecaySec(Number(e.target.value))}
            className="w-full accent-[#3DFF9A]"
          />
        </div>
      </div>

      {/* 4. Display Row Layout Toggles */}
      <div className="pt-2 border-t border-[#2A3340] space-y-2">
        <div className="text-[11px] font-bold text-[#9AA6B2] uppercase">
          Card Metadata Rows
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={onToggleShowRssiBar}
            className={`py-1.5 px-2 rounded border text-center font-semibold ${
              showRssiBar
                ? `${activeBg} ${activeBorder} ${activeColor}`
                : 'bg-[#1B232D] border-[#2A3340] text-[#9AA6B2]'
            }`}
          >
            RSSI Bar: {showRssiBar ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={onToggleShowFleetName}
            className={`py-1.5 px-2 rounded border text-center font-semibold ${
              showFleetName
                ? `${activeBg} ${activeBorder} ${activeColor}`
                : 'bg-[#1B232D] border-[#2A3340] text-[#9AA6B2]'
            }`}
          >
            Signature Tag: {showFleetName ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={onToggleShowFrequency}
            className={`py-1.5 px-2 rounded border text-center font-semibold ${
              showFrequency
                ? `${activeBg} ${activeBorder} ${activeColor}`
                : 'bg-[#1B232D] border-[#2A3340] text-[#9AA6B2]'
            }`}
          >
            Ch / Freq: {showFrequency ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={onToggleShowSeenTimes}
            className={`py-1.5 px-2 rounded border text-center font-semibold ${
              showSeenTimes
                ? `${activeBg} ${activeBorder} ${activeColor}`
                : 'bg-[#1B232D] border-[#2A3340] text-[#9AA6B2]'
            }`}
          >
            Seen Times: {showSeenTimes ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>
    </div>
  );
};
