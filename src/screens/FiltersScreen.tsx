import React, { useState } from 'react';
import {
  FilterState,
  FilterPreset,
  SignatureClass,
  VISIBLE_SIGNATURE_CLASSES,
  SIGNATURE_CLASS_LABELS,
  Fleet,
  RadioKind,
} from '../types';
import {
  Wifi,
  Bluetooth,
  Sliders,
  RotateCcw,
  Check,
  Search,
  Bookmark,
  Shield,
} from 'lucide-react';

interface FiltersScreenProps {
  filter: FilterState;
  onChangeFilter: (next: FilterState) => void;
  fleets: Fleet[];
  nightMode?: boolean;
}

export const FiltersScreen: React.FC<FiltersScreenProps> = ({
  filter,
  onChangeFilter,
  fleets,
  nightMode = false,
}) => {
  const toggleKind = (kind: RadioKind) => {
    const has = filter.kinds.includes(kind);
    const nextKinds = has
      ? filter.kinds.filter((k) => k !== kind)
      : [...filter.kinds, kind];
    onChangeFilter({ ...filter, kinds: nextKinds.length === 0 ? ['WIFI', 'BLE'] : nextKinds });
  };

  const toggleClass = (c: SignatureClass) => {
    const has = filter.classes.includes(c);
    const nextClasses = has
      ? filter.classes.filter((k) => k !== c)
      : [...filter.classes, c];
    onChangeFilter({ ...filter, classes: nextClasses });
  };

  const resetFilters = () => {
    onChangeFilter({
      kinds: ['WIFI', 'BLE'],
      minRssi: -95,
      classes: [],
      searchQuery: '',
      classifiedOnly: false,
      watchlistOnly: false,
    });
  };

  return (
    <div className="max-w-xl mx-auto p-3 sm:p-4 font-mono text-xs select-none">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E293B]">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-emerald-400" />
          <h1 className="text-sm font-bold text-white tracking-wider">TACTICAL SIGNAL FILTERS</h1>
        </div>
        <button
          onClick={resetFilters}
          className="flex items-center gap-1 px-2.5 py-1 bg-[#141E2B] hover:bg-[#1E2E42] text-slate-400 hover:text-white rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>RESET</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <label className="block text-[11px] text-slate-400 mb-1.5 uppercase font-bold">
          Search Identifier / SSID / MAC
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={filter.searchQuery}
            onChange={(e) => onChangeFilter({ ...filter, searchQuery: e.target.value })}
            placeholder="e.g. DJI, Axon, Harris, 50:02:91..."
            className="w-full bg-[#080D14] border border-[#1E293B] rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Radio Kind Toggles */}
      <div className="mb-4">
        <label className="block text-[11px] text-slate-400 mb-1.5 uppercase font-bold">
          Radio Bands
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => toggleKind('WIFI')}
            className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
              filter.kinds.includes('WIFI')
                ? 'bg-sky-950/60 text-sky-400 border-sky-600'
                : 'bg-[#080D14] text-slate-600 border-[#1E293B]'
            }`}
          >
            <Wifi className="w-4 h-4" />
            <span>WI-FI (802.11)</span>
          </button>

          <button
            onClick={() => toggleKind('BLE')}
            className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
              filter.kinds.includes('BLE')
                ? 'bg-indigo-950/60 text-indigo-400 border-indigo-600'
                : 'bg-[#080D14] text-slate-600 border-[#1E293B]'
            }`}
          >
            <Bluetooth className="w-4 h-4" />
            <span>BLUETOOTH LE</span>
          </button>
        </div>
      </div>

      {/* Minimum Cutoff RSSI Slider */}
      <div className="mb-4 bg-[#080D14] border border-[#1E293B] rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] text-slate-400 uppercase font-bold">Minimum Signal Threshold</span>
          <span className="font-bold text-emerald-400">{filter.minRssi} dBm</span>
        </div>
        <input
          type="range"
          min="-95"
          max="-40"
          step="1"
          value={filter.minRssi}
          onChange={(e) => onChangeFilter({ ...filter, minRssi: Number(e.target.value) })}
          className="w-full accent-emerald-500 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-600 mt-1">
          <span>-95 dBm (All signals)</span>
          <span>-40 dBm (Immediate only)</span>
        </div>
      </div>

      {/* Target Priority Filters */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <button
          onClick={() => onChangeFilter({ ...filter, classifiedOnly: !filter.classifiedOnly })}
          className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-semibold transition-all ${
            filter.classifiedOnly
              ? 'bg-rose-950/60 text-rose-300 border-rose-600'
              : 'bg-[#080D14] text-slate-500 border-[#1E293B]'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>MATCHED ONLY</span>
        </button>

        <button
          onClick={() => onChangeFilter({ ...filter, watchlistOnly: !filter.watchlistOnly })}
          className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 font-semibold transition-all ${
            filter.watchlistOnly
              ? 'bg-amber-950/60 text-amber-300 border-amber-600'
              : 'bg-[#080D14] text-slate-500 border-[#1E293B]'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>WATCHLIST ONLY</span>
        </button>
      </div>

      {/* Signature Classes Selector */}
      <div>
        <label className="block text-[11px] text-slate-400 mb-1.5 uppercase font-bold">
          Signature Class Filter
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {VISIBLE_SIGNATURE_CLASSES.map((cls) => {
            const isSelected = filter.classes.includes(cls);
            const meta = SIGNATURE_CLASS_LABELS[cls];
            return (
              <button
                key={cls}
                onClick={() => toggleClass(cls)}
                className={`p-2 rounded-lg border text-left flex items-center justify-between transition-all ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-950/40 text-white font-bold'
                    : 'border-[#1E293B] bg-[#080D14] text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                  <span className="truncate">{meta.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
