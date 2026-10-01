import React, { useEffect, useRef } from 'react';
import { RssiSample } from '../types';

interface SparklineProps {
  history: RssiSample[];
  width?: number;
  height?: number;
  color?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  history,
  width = 60,
  height = 20,
  color = '#10E79D',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    if (history.length < 2) {
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      return;
    }

    // Normalized RSSI between -100 (bottom) and -30 (top)
    const minRssi = -100;
    const maxRssi = -30;
    const span = maxRssi - minRssi;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const step = width / (history.length - 1);
    history.forEach((sample, i) => {
      const clamped = Math.max(minRssi, Math.min(maxRssi, sample.rssi));
      const ratio = (clamped - minRssi) / span;
      const y = height - ratio * height;
      const x = i * step;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw last point dot
    const lastSample = history[history.length - 1];
    const clampedLast = Math.max(minRssi, Math.min(maxRssi, lastSample.rssi));
    const ratioLast = (clampedLast - minRssi) / span;
    const lastY = height - ratioLast * height;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(width - 1, lastY, 2, 0, Math.PI * 2);
    ctx.fill();
  }, [history, width, height, color]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="inline-block shrink-0 align-middle"
    />
  );
};
