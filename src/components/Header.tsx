import React from 'react';
import {
  Radio,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Camera,
  MapPin,
  Shield,
  Wifi,
} from 'lucide-react';
import { audioService } from '../domain/audioService';

interface HeaderProps {
  nightMode: boolean;
  onToggleNightMode: () => void;
  gpsActive: boolean;
  totalDevices: number;
  threatCount: number;
  onSnapshotSit?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  nightMode,
  onToggleNightMode,
  gpsActive,
  totalDevices,
  threatCount,
  onSnapshotSit,
}) => {
  const [muted, setMuted] = React.useState(audioService.getMuted());

  const handleToggleMute = () => {
    const next = !muted;
    audioService.setMuted(next);
    setMuted(next);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#080D14]/95 backdrop-blur border-b border-[#1E293B] px-3 py-2 flex items-center justify-between text-xs font-mono">
      {/* App branding */}
      <div className="flex items-center gap-2">
        <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-[#10E79D]">
          <Radio className="w-4 h-4 animate-pulse" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400" />
        </div>
        <div>
          <div className="font-bold tracking-wider text-white flex items-center gap-1.5">
            <span>FIELDWATCH</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
              TACTICAL RF
            </span>
          </div>
          <div className="text-[10px] text-[#64748B]">PASSIVE INTERCEPT SUITE</div>
        </div>
      </div>

      {/* Center status indicators */}
      <div className="hidden sm:flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0E1724] border border-[#1E2E42]">
          <MapPin className={`w-3.5 h-3.5 ${gpsActive ? 'text-emerald-400' : 'text-slate-500'}`} />
          <span className="text-[11px] text-[#94A3B8]">GPS:</span>
          <span className={`font-bold ${gpsActive ? 'text-emerald-400' : 'text-slate-400'}`}>
            {gpsActive ? 'LOCK 3D' : 'SEARCHING'}
          </span>
        </div>

        {threatCount > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 animate-pulse">
            <Shield className="w-3.5 h-3.5" />
            <span className="font-bold">{threatCount} PRIORITY TARGETS</span>
          </div>
        )}
      </div>

      {/* Quick Action controls */}
      <div className="flex items-center gap-1">
        {onSnapshotSit && (
          <button
            onClick={onSnapshotSit}
            title="Snapshot Situation Report"
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#0E1724] hover:bg-[#1E2A3A] text-slate-300 border border-[#1E2E42] text-[11px] transition-colors"
          >
            <Camera className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">SITREP</span>
          </button>
        )}

        <button
          onClick={handleToggleMute}
          title={muted ? 'Unmute Audio' : 'Mute Audio'}
          className={`p-1.5 rounded border transition-colors ${
            muted
              ? 'bg-[#0E1724] text-slate-500 border-[#1E2E42]'
              : 'bg-emerald-950/40 text-emerald-400 border-emerald-800'
          }`}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          onClick={onToggleNightMode}
          title={nightMode ? 'Normal Phosphor Mode' : 'FLIR Night Mode'}
          className={`p-1.5 rounded border transition-colors ${
            nightMode
              ? 'bg-rose-950/60 text-rose-400 border-rose-800'
              : 'bg-[#0E1724] text-slate-300 border-[#1E2E42] hover:text-white'
          }`}
        >
          {nightMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
