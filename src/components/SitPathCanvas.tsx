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
  width = 300,
  height = 120,
  nightMode = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    if (operatorPath.length === 0 && payloadTrail.length === 0) {
      ctx.fillStyle = '#475569';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('No GPS path coordinates', width / 2, height / 2);
      return;
    }

    // Determine bounding box
    const allLats = [
      ...operatorPath.map((p) => p.lat),
      ...payloadTrail.map((p) => p.lat),
    ];
    const allLons = [
      ...operatorPath.map((p) => p.lon),
      ...payloadTrail.map((p) => p.lon),
    ];

    let minLat = Math.min(...allLats);
    let maxLat = Math.max(...allLats);
    let minLon = Math.min(...allLons);
    let maxLon = Math.max(...allLons);

    // Padding if point or zero span
    if (maxLat - minLat < 0.0001) {
      minLat -= 0.0005;
      maxLat += 0.0005;
    }
    if (maxLon - minLon < 0.0001) {
      minLon -= 0.0005;
      maxLon += 0.0005;
    }

    const padding = 14;
    const drawW = width - padding * 2;
    const drawH = height - padding * 2;

    const toX = (lon: number) => padding + ((lon - minLon) / (maxLon - minLon)) * drawW;
    const toY = (lat: number) => height - padding - ((lat - minLat) / (maxLat - minLat)) * drawH;

    // Draw grid background
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding, padding, drawW, drawH);

    // Draw operator path
    if (operatorPath.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = nightMode ? '#FF3D5A' : '#10E79D';
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      operatorPath.forEach((pt, i) => {
        const x = toX(pt.lon);
        const y = toY(pt.lat);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Start dot
      const startPt = operatorPath[0];
      ctx.fillStyle = '#38BDF8';
      ctx.beginPath();
      ctx.arc(toX(startPt.lon), toY(startPt.lat), 3.5, 0, Math.PI * 2);
      ctx.fill();

      // End dot
      const endPt = operatorPath[operatorPath.length - 1];
      ctx.fillStyle = nightMode ? '#FF3D5A' : '#10E79D';
      ctx.beginPath();
      ctx.arc(toX(endPt.lon), toY(endPt.lat), 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw payload trail (e.g. Drone Remote ID trajectory)
    if (payloadTrail.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 2]);

      payloadTrail.forEach((pt, i) => {
        const x = toX(pt.lon);
        const y = toY(pt.lat);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [operatorPath, payloadTrail, width, height, nightMode]);

  return (
    <div className="bg-[#0B0F14] rounded-lg p-1.5 border border-[#2A3340]">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="block mx-auto rounded"
      />
    </div>
  );
};
