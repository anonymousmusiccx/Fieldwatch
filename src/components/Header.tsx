import React from 'react';
import { Wifi, Bluetooth, Network, SlidersHorizontal, ChevronUp } from 'lucide-react';

interface HeaderProps {
  wifiCount: number;
  bleCount: number;
  signatureCount: number;
  isPaused: boolean;
  sitOpen: boolean;
  sitName?: string;
  onViewPicker: () => void;
  isViewPickerOpen: boolean;
  nightMode: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  wifiCount,
  bleCount,
  signatureCount,
  isPaused,
  sitOpen,
  sitName,
  onViewPicker,
  isViewPickerOpen,
  nightMode,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0B0F14]/90 backdrop-blur border-b border-[#2A3340] px-4 py-2.5 flex items-center justify-between text-xs font-mono">
      {/* Brand & status title */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 font-black text-sm tracking-wider">
          <span className={nightMode ? 'text-[#FF3D5A]' : 'text-[#3DFF9A]'}>
            FIELDWATCH
          </span>
          {sitOpen ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FF3D5A]/20 text-[#FF7A7A] border border-[#FF3D5A]/40 animate-pulse">
              {sitName ? `SIT: ${sitName}` : 'SIT CAPTURE'}
            </span>
          ) : isPaused ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FFB020]/20 text-[#FFB020] border border-[#FFB020]/40">
              PAUSED
            </span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-[#3DFF9A] animate-ping" />
          )}
        </div>
      </div>

      {/* Radio counters & view controls */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 px-2 py-1 bg-[#141A22] rounded border border-[#2A3340] text-[11px]">
          <span className="flex items-center gap-1 text-[#4FC3F7]" title="Wi-Fi APs">
            <Wifi className="w-3.5 h-3.5" />
            <span>{wifiCount}</span>
          </span>
          <span className="text-[#2A3340]">|</span>
          <span className="flex items-center gap-1 text-[#3DFF9A]" title="BLE Advertisers">
            <Bluetooth className="w-3.5 h-3.5" />
            <span>{bleCount}</span>
          </span>
          <span className="text-[#2A3340]">|</span>
          <span className="flex items-center gap-1 text-[#FFB020]" title="Signatures Matched">
            <Network className="w-3.5 h-3.5" />
            <span>{signatureCount}</span>
          </span>
        </div>

        <button
          onClick={onViewPicker}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
            isViewPickerOpen
              ? 'bg-[#163326] text-[#3DFF9A] border-[#3DFF9A]'
              : 'bg-[#141A22] text-[#9AA6B2] border-[#2A3340] hover:text-[#D5DCE3]'
          }`}
          title="Tune view and display options"
        >
          {isViewPickerOpen ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <SlidersHorizontal className="w-3.5 h-3.5" />
          )}
          <span>Tune</span>
        </button>
      </div>
    </header>
  );
};
