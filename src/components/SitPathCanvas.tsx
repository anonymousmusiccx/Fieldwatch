import React, { useEffect, useRef } from 'react';
import { GpsSample, PayloadFix } from '../types';

interface SitPathCanvasProps {
  operatorPath: GpsSample[];
  payloadTrail?: PayloadFix[];
  width?: number;
  height?: number;
  nightMode?: boolean;
}

export const SitPathCanvas: React.FC<SitPathCanvasProps> = ({
  operatorPath,
  payloadTrail = [],
  width = 340,
  height = 200,
  nightMode = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // Grid background
    ctx.fillStyle = nightMode ? '#100508' : '#070D14';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = nightMode ? 'rgba(244, 63, 94, 0.08)' : 'rgba(16, 231, 157, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (operatorPath.length === 0 && payloadTrail.length === 0) {
      ctx.fillStyle = '#64748B';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NO GPS TRAIL LOGGED', width / 2, height / 2);
      return;
    }

    // Determine bounding box
    const allLats = [
      ...operatorPath.map((p) => p.latitude),
      ...payloadTrail.map((p) => p.lat),
    ];
    const allLngs = [
      ...operatorPath.map((p) => p.longitude),
      ...payloadTrail.map((p) => p.lng),
    ];

    const minLat = Math.min(...allLats);
    const maxLat = Math.max(...allLats);
    const minLng = Math.min(...allLngs);
    const maxLng = Math.max(...allLngs);

    const latSpan = maxLat - minLat || 0.0005;
    const lngSpan = maxLng - minLng || 0.0005;
    const padding = 25;

    const toX = (lng: number) =>
      padding + ((lng - minLng) / lngSpan) * (width - padding * 2);
    const toY = (lat: number) =>
      height - padding - ((lat - minLat) / latSpan) * (height - padding * 2);

    // Draw Operator Trail
    if (operatorPath.length > 1) {
      ctx.beginPath();
      ctx.moveTo(toX(operatorPath[0].longitude), toY(operatorPath[0].latitude));
      for (let i = 1; i < operatorPath.length; i++) {
        ctx.lineTo(toX(operatorPath[i].longitude), toY(operatorPath[i].latitude));
      }
      ctx.strokeStyle = nightMode ? '#F43F5E' : '#38BDF8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Start & End markers
      const startP = operatorPath[0];
      const endP = operatorPath[operatorPath.length - 1];

      // Start circle
      ctx.beginPath();
      ctx.arc(toX(startP.longitude), toY(startP.latitude), 3, 0, Math.PI * 2);
      ctx.fillStyle = '#94A3B8';
      ctx.fill();

      // Current position pulsed
      ctx.beginPath();
      ctx.arc(toX(endP.longitude), toY(endP.latitude), 5, 0, Math.PI * 2);
      ctx.fillStyle = nightMode ? '#FDA4AF' : '#10E79D';
      ctx.fill();
    }

    // Draw RF Fixes
    payloadTrail.forEach((fix) => {
      const fx = toX(fix.lng);
      const fy = toY(fix.lat);
      ctx.beginPath();
      ctx.arc(fx, fy, 4, 0, Math.PI * 2);
      ctx.fillStyle = fix.rssi > -60 ? '#F43F5E' : '#EAB308';
      ctx.fill();
    });
  }, [operatorPath, payloadTrail, width, height, nightMode]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-lg border border-[#1E293B] block max-w-full"
    />
  );
};
