import React, { useState } from 'react';
import {
  FilterState,
  FilterPreset,
  SignatureClass,
  VISIBLE_SIGNATURE_CLASSES,
  SIGNATURE_CLASS_LABELS,
  Fleet,
} from '../types';
import {
  Wifi,
  Bluetooth,
  Sliders,
  RotateCcw,
  Check,
  Search,
  Bookmark,
  Eye,
  Plus,
  Trash2,
} from 'lucide-react';

interface FiltersScreenProps {
  filter: FilterState;
  onChangeFilter: (f: FilterState) => void;
  fleets: Fleet[];
  presets: FilterPreset[];
  onApplyPreset: (preset: FilterPreset) => void;
  onSavePreset: (name: string) => void;
  onDeletePreset: (id: string) => void;
  onResetFilter: () => void;
  nightMode?: boolean;
}

export const FiltersScreen: React.FC<FiltersScreenProps> = ({
  filter,
  onChangeFilter,
  fleets,
  presets,
  onApplyPreset,
  onSavePreset,
  onDeletePreset,
  onResetFilter,
  nightMode = false,
}) => {
  const [newPresetName, setNewPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);

  const activeColor = nightMode ? 'text-[#FF3D5A]' : 'text-[#3DFF9A]';
  const activeBg = nightMode ? 'bg-[#3A1212]' : 'bg-[#163326]';
  const activeBorder = nightMode ? 'border-[#FF3D5A]' : 'border-[#3DFF9A]';

  const toggleClass = (cls: SignatureClass) => {
    const classes = filter.classes.includes(cls)
      ? filter.classes.filter((c) => c !== cls)
      : [...filter.classes, cls];
    onChangeFilter({ ...filter, classes, useClassFilter: true });
  };

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    onSavePreset(newPresetName.trim());
    setNewPresetName('');
    setShowSavePreset(false);
  };

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4 pb-24 text-xs font-mono select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#2A3340]">
        <div>
          <h2 className="text-sm font-bold text-[#D5DCE3]">
            SIGNAL & SIGNATURE FILTERS
          </h2>
          <p className="text-[11px] text-[#9AA6B2]">
            Isolate target frequencies, signal thresholds, and signature classes
          </p>
        </div>

        <button
          onClick={onResetFilter}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1B232D] border border-[#2A3340] text-[#9AA6B2] hover:text-white"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* 1. Presets */}
      <div className="p-3 bg-[#141A22] rounded-lg border border-[#2A3340] space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[11px] text-[#9AA6B2] uppercase">
            FILTER PRESETS
          </span>
          <button
            onClick={() => setShowSavePreset(!showSavePreset)}
            className="flex items-center gap-1 text-[11px] text-[#3DFF9A] hover:underline"
          >
            <Plus className="w-3 h-3" />
            <span>Save Current</span>
          </button>
        </div>

        {showSavePreset && (
          <form onSubmit={handleSavePreset} className="flex gap-2 pt-1">
            <input
              type="text"
              placeholder="Preset title (e.g. Drones & Trackers)..."
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              className="flex-1 bg-[#1B232D] border border-[#2A3340] rounded px-3 py-1.5 text-xs text-[#D5DCE3]"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded bg-[#3DFF9A] text-[#003820] font-bold"
            >
              Save
            </button>
          </form>
        )}

        <div className="flex flex-wrap gap-1.5">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="flex items-center gap-1 rounded bg-[#1B232D] border border-[#2A3340] pl-2 pr-1 py-1"
            >
              <button
                onClick={() => onApplyPreset(preset)}
                className="text-xs font-semibold text-[#D5DCE3] hover:text-[#3DFF9A]"
              >
                {preset.name}
              </button>
              {preset.id !== 'preset-all' && (
                <button
                  onClick={() => onDeletePreset(preset.id)}
                  className="p-1 text-[#9AA6B2] hover:text-[#FF3D5A]"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2. Radio Band Toggles & Minimum RSSI */}
      <div className="p-3 bg-[#141A22] rounded-lg border border-[#2A3340] space-y-3">
        <span className="font-bold text-[11px] text-[#9AA6B2] uppercase block">
          RADIO BANDS & SENSITIVITY
        </span>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onChangeFilter({ ...filter, showWifi: !filter.showWifi })}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg border font-bold ${
              filter.showWifi
                ? 'bg-[#0E2838] border-[#38BDF8] text-[#38BDF8]'
                : 'bg-[#1B232D] border-[#2A3340] text-[#9AA6B2]'
            }`}
          >
            <Wifi className="w-4 h-4" />
            <span>Wi-Fi (2.4/5GHz)</span>
          </button>

          <button
            onClick={() => onChangeFilter({ ...filter, showBle: !filter.showBle })}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg border font-bold ${
              filter.showBle
                ? `${activeBg} ${activeBorder} ${activeColor}`
                : 'bg-[#1B232D] border-[#2A3340] text-[#9AA6B2]'
            }`}
          >
            <Bluetooth className="w-4 h-4" />
            <span>Bluetooth LE</span>
          </button>
        </div>

        {/* RSSI Slider */}
        <div className="pt-2">
          <div className="flex justify-between text-[11px] text-[#9AA6B2] mb-1">
            <span>MINIMUM RSSI THRESHOLD</span>
            <span className="font-bold text-[#D5DCE3]">{filter.rssiMin} dBm</span>
          </div>
          <input
            type="range"
            min={-100}
            max={-35}
            step={1}
            value={filter.rssiMin}
            onChange={(e) =>
              onChangeFilter({ ...filter, rssiMin: Number(e.target.value) })
            }
            className="w-full accent-[#3DFF9A]"
          />
          <div className="flex justify-between text-[9px] text-[#9AA6B2]/60 mt-0.5">
            <span>-100 dBm (Faint / Far)</span>
            <span>-65 dBm (Medium)</span>
            <span>-35 dBm (Point Blank)</span>
          </div>
        </div>
      </div>

      {/* 3. Text & OUI Search */}
      <div className="p-3 bg-[#141A22] rounded-lg border border-[#2A3340] space-y-2">
        <span className="font-bold text-[11px] text-[#9AA6B2] uppercase block">
          SEARCH & QUERY MATCHING
        </span>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#9AA6B2]" />
          <input
            type="text"
            placeholder="Search device name, SSID, vendor, or MAC..."
            value={filter.nameQuery}
            onChange={(e) => onChangeFilter({ ...filter, nameQuery: e.target.value })}
            className="w-full bg-[#1B232D] border border-[#2A3340] rounded pl-8 pr-3 py-1.5 text-xs text-[#D5DCE3]"
          />
        </div>

        <input
          type="text"
          placeholder="OUI / MAC Prefix (e.g. 00:25:DF or Axon)..."
          value={filter.ouiQuery}
          onChange={(e) => onChangeFilter({ ...filter, ouiQuery: e.target.value })}
          className="w-full bg-[#1B232D] border border-[#2A3340] rounded px-3 py-1.5 text-xs text-[#D5DCE3]"
        />
      </div>

      {/* 4. Boolean Flags */}
      <div className="p-3 bg-[#141A22] rounded-lg border border-[#2A3340] space-y-2">
        <span className="font-bold text-[11px] text-[#9AA6B2] uppercase block">
          TARGET FLAGS
        </span>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2 p-2 rounded bg-[#1B232D] border border-[#2A3340] cursor-pointer">
            <input
              type="checkbox"
              checked={filter.namedOnly}
              onChange={(e) =>
                onChangeFilter({ ...filter, namedOnly: e.target.checked })
              }
              className="accent-[#3DFF9A]"
            />
            <span className="text-[11px] text-[#D5DCE3]">Named Only</span>
          </label>

          <label className="flex items-center gap-2 p-2 rounded bg-[#1B232D] border border-[#2A3340] cursor-pointer">
            <input
              type="checkbox"
              checked={filter.watchedOnly}
              onChange={(e) =>
                onChangeFilter({ ...filter, watchedOnly: e.target.checked })
              }
              className="accent-[#3DFF9A]"
            />
            <span className="text-[11px] text-[#D5DCE3]">Watchlist Only</span>
          </label>

          <label className="flex items-center gap-2 p-2 rounded bg-[#1B232D] border border-[#2A3340] cursor-pointer">
            <input
              type="checkbox"
              checked={filter.customNamesOnly}
              onChange={(e) =>
                onChangeFilter({ ...filter, customNamesOnly: e.target.checked })
              }
              className="accent-[#3DFF9A]"
            />
            <span className="text-[11px] text-[#D5DCE3]">Custom Labels Only</span>
          </label>

          <label className="flex items-center gap-2 p-2 rounded bg-[#1B232D] border border-[#2A3340] cursor-pointer">
            <input
              type="checkbox"
              checked={filter.hideFastPairAccountKey}
              onChange={(e) =>
                onChangeFilter({
                  ...filter,
                  hideFastPairAccountKey: e.target.checked,
                })
              }
              className="accent-[#3DFF9A]"
            />
            <span className="text-[11px] text-[#D5DCE3]">Hide Anon FastPair</span>
          </label>
        </div>
      </div>

      {/* 5. Signature Class Filtering */}
      <div className="p-3 bg-[#141A22] rounded-lg border border-[#2A3340] space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[11px] text-[#9AA6B2] uppercase">
            SIGNATURE CLASS ISOLATION
          </span>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-[10px] text-[#9AA6B2]">
              <input
                type="checkbox"
                checked={filter.excludeClasses}
                onChange={(e) =>
                  onChangeFilter({ ...filter, excludeClasses: e.target.checked })
                }
                className="accent-[#FF3D5A]"
              />
              <span>Invert (Exclude)</span>
            </label>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto">
          {VISIBLE_SIGNATURE_CLASSES.map((cls) => {
            const isSelected = filter.classes.includes(cls);
            return (
              <button
                key={cls}
                onClick={() => toggleClass(cls)}
                className={`px-2 py-1 rounded text-[11px] border font-semibold transition-colors ${
                  isSelected
                    ? filter.excludeClasses
                      ? 'bg-[#3A1212] border-[#FF3D5A] text-[#FF5A5A]'
                      : `${activeBg} ${activeBorder} ${activeColor}`
                    : 'bg-[#1B232D] border-[#2A3340] text-[#9AA6B2] hover:text-[#D5DCE3]'
                }`}
              >
                {SIGNATURE_CLASS_LABELS[cls] || cls}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
