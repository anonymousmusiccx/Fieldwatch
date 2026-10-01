import React from 'react';
import { PresenceSpan } from '../types';

interface PresenceTrackProps {
  presence: PresenceSpan[];
  sessionStart: number;
  sessionEnd?: number;
  width?: string;
  color?: string;
}

export const PresenceTrack: React.FC<PresenceTrackProps> = ({
  presence,
  sessionStart,
  sessionEnd = Date.now(),
  width = '100%',
  color = '#10E79D',
}) => {
  const totalDuration = Math.max(1000, sessionEnd - sessionStart);

  return (
    <div
      className="h-2 bg-[#0B0F14] rounded overflow-hidden relative border border-[#2E384D]/60"
      style={{ width }}
    >
      {presence.map((span, idx) => {
        const startOffset = Math.max(0, span.start - sessionStart);
        const endOffset = Math.min(totalDuration, (span.end || sessionEnd) - sessionStart);
        const leftPercent = Math.min(100, Math.max(0, (startOffset / totalDuration) * 100));
        const widthPercent = Math.max(1, Math.min(100 - leftPercent, ((endOffset - startOffset) / totalDuration) * 100));

        return (
          <div
            key={idx}
            className="absolute top-0 bottom-0 rounded-xs"
            style={{
              left: `${leftPercent}%`,
              width: `${widthPercent}%`,
              backgroundColor: color,
              opacity: 0.85,
            }}
          />
        );
      })}
    </div>
  );
};
