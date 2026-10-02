import React from 'react';

interface PresenceTrackProps {
  rssi: number;
  minRssi?: number;
  maxRssi?: number;
  className?: string;
  showDbm?: boolean;
}

export const PresenceTrack: React.FC<PresenceTrackProps> = ({
  rssi,
  minRssi = -95,
  maxRssi = -30,
  className = '',
  showDbm = false,
}) => {
  const percent = Math.max(0, Math.min(100, ((rssi - minRssi) / (maxRssi - minRssi)) * 100));

  let barColor = '#38BDF8';
  if (percent > 75) barColor = '#F43F5E'; // Immediate / very strong
  else if (percent > 50) barColor = '#FB923C'; // Near
  else if (percent > 25) barColor = '#10E79D'; // Tactical

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="h-1.5 w-16 bg-[#182230] rounded-full overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${percent}%`,
            backgroundColor: barColor,
            boxShadow: `0 0 6px ${barColor}80`,
          }}
        />
      </div>
      {showDbm && (
        <span className="text-[10px] font-mono tabular-nums font-medium text-[#94A3B8]">
          {rssi}dBm
        </span>
      )}
    </div>
  );
};
