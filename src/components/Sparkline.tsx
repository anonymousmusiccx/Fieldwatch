import React from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  min?: number;
  max?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 64,
  height = 20,
  color = '#10E79D',
  min = -95,
  max = -30,
}) => {
  if (!data || data.length < 2) {
    return <div style={{ width, height }} className="opacity-20 bg-slate-800 rounded" />;
  }

  const range = max - min || 1;
  const step = width / (data.length - 1);

  const points = data
    .map((val, i) => {
      const clamped = Math.max(min, Math.min(max, val));
      const normalized = (clamped - min) / range;
      const x = (i * step).toFixed(1);
      const y = (height - normalized * (height - 4) - 2).toFixed(1);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible shrink-0">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {/* End point marker */}
      {data.length > 0 && (
        <circle
          cx={(data.length - 1) * step}
          cy={height - ((Math.max(min, Math.min(max, data[data.length - 1])) - min) / range) * (height - 4) - 2}
          r="2"
          fill={color}
        />
      )}
    </svg>
  );
};
