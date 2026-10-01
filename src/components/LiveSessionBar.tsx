import React from 'react';
import { Eye, RotateCcw, Navigation } from 'lucide-react';

interface LiveSessionBarProps {
  arrivalsOnly: boolean;
  movingWithYou: boolean;
  operatorSpanM: number;
  onMarkSeen: () => void;
  onResetSeen: () => void;
  onToggleArrivals: () => void;
  onToggleMovingWithYou: () => void;
  nightMode?: boolean;
}

export const LiveSessionBar: React.FC<LiveSessionBarProps> = ({
  arrivalsOnly,
  movingWithYou,
  operatorSpanM,
  onMarkSeen,
  onResetSeen,
  onToggleArrivals,
  onToggleMovingWithYou,
  nightMode = false,
}) => {
  return (
    <div className="bg-[#141A22] border-b border-[#2A3340] px-4 py-2 flex items-center justify-between text-xs font-mono select-none">
      {/* Arrivals Controls */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onToggleArrivals}
          className={`flex items-center gap-1 px-2.5 py-1 rounded border text-[11px] font-semibold transition-colors ${
            arrivalsOnly
              ? nightMode
                ? 'bg-[#3A1212] text-[#FF5A5A] border-[#FF5A5A]'
                : 'bg-[#163326] text-[#3DFF9A] border-[#3DFF9A]'
              : 'bg-[#1B232D] text-[#9AA6B2] border-[#2A3340] hover:text-[#D5DCE3]'
          }`}
          title="Only display radios that appeared after you marked seen"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>New Only</span>
        </button>

        <button
          onClick={onMarkSeen}
          className="px-2 py-1 rounded bg-[#1B232D] border border-[#2A3340] text-[11px] text-[#D5DCE3] hover:border-[#3DFF9A]"
          title="Mark all current radios as already seen"
        >
          Mark Seen
        </button>

        {arrivalsOnly && (
          <button
            onClick={onResetSeen}
            className="p-1 text-[#9AA6B2] hover:text-white"
            title="Reset seen state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Moving With You Hunter Toggle */}
      <button
        onClick={onToggleMovingWithYou}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-semibold transition-colors ${
          movingWithYou
            ? 'bg-[#FFB020]/20 text-[#FFB020] border-[#FFB020]'
            : 'bg-[#1B232D] text-[#9AA6B2] border-[#2A3340] hover:text-[#D5DCE3]'
        }`}
        title="Filter for transmitters moving along with you over distance"
      >
        <Navigation className="w-3.5 h-3.5" />
        <span>Moving With You</span>
        {operatorSpanM > 10 && (
          <span className="text-[10px] opacity-80">({Math.round(operatorSpanM)}m)</span>
        )}
      </button>
    </div>
  );
};
