import React, { useEffect, useRef, useState } from 'react';
import { Sighting, Fleet } from '../types';
import { MacUtil } from '../domain/macUtil';

interface RadarCanvasProps {
  devices: Sighting[];
  fleets: Fleet[];
  selectedKey?: string | null;
  onSelectDevice?: (device: Sighting) => void;
  onSelectKey?: (key: string) => void;
  nightMode?: boolean;
  demoMode?: boolean;
}

export const RadarCanvas: React.FC<RadarCanvasProps> = ({
  devices,
  fleets,
  selectedKey,
  onSelectDevice,
  onSelectKey,
  nightMode = false,
  demoMode = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredDevice, setHoveredDevice] = useState<Sighting | null>(null);
  const sweepAngleRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  // Theme colors
  const primaryColor = nightMode ? '#FF3D5A' : '#10E79D';
  const gridColor = nightMode ? 'rgba(255, 61, 90, 0.22)' : 'rgba(16, 231, 157, 0.22)';
  const sweepColor = nightMode ? 'rgba(255, 61, 90, 0.25)' : 'rgba(16, 231, 157, 0.25)';

  useEffect(() => {
    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      sweepAngleRef.current = (sweepAngleRef.current + dt * 1.5) % (Math.PI * 2);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = canvas.width;
      const center = size / 2;
      const radius = center - 18;

      ctx.clearRect(0, 0, size, size);

      // Background vignette
      const bgGrad = ctx.createRadialGradient(center, center, 10, center, center, radius);
      bgGrad.addColorStop(0, nightMode ? '#1A0808' : '#0B1510');
      bgGrad.addColorStop(1, '#080C10');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, size, size);

      // Concentric range circles
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      const rings = [0.25, 0.5, 0.75, 1.0];
      const ringLabels = ['-45dBm', '-60dBm', '-75dBm', '-90dBm'];

      rings.forEach((r, idx) => {
        ctx.beginPath();
        ctx.arc(center, center, radius * r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = nightMode ? 'rgba(255, 100, 100, 0.5)' : 'rgba(16, 231, 157, 0.45)';
        ctx.font = '9px monospace';
        ctx.fillText(ringLabels[idx], center + 4, center - radius * r + 11);
      });

      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(center - radius, center);
      ctx.lineTo(center + radius, center);
      ctx.moveTo(center, center - radius);
      ctx.lineTo(center, center + radius);
      ctx.stroke();

      // Cardinal labels
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = primaryColor;
      ctx.textAlign = 'center';
      ctx.fillText('N', center, center - radius - 4);
      ctx.fillText('S', center, center + radius + 13);
      ctx.fillText('E', center + radius + 10, center + 3);
      ctx.fillText('W', center - radius - 10, center + 3);

      // Sweep gradient sector
      const sweepAngle = sweepAngleRef.current;
      const sweepSector = Math.PI / 3; // 60 degrees fade
      const grad = ctx.createRadialGradient(center, center, 0, center, center, radius);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, sweepColor);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, sweepAngle - sweepSector, sweepAngle, false);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Sweep leading beam
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(
        center + Math.cos(sweepAngle) * radius,
        center + Math.sin(sweepAngle) * radius
      );
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Render device blips
      const fleetMap = new Map(fleets.map((f) => [f.id, f]));

      devices.forEach((dev) => {
        // Distance based on RSSI (-35 dBm is near center, -95 dBm is near edge)
        const clampedRssi = Math.max(-95, Math.min(-35, dev.rssi));
        const distanceRatio = (clampedRssi - -35) / (-95 - -35); // 0 (near) to 1 (far)
        const dist = Math.max(12, distanceRatio * radius * 0.95);

        // Angle from bearing or pseudo-angle from MAC hash
        let angle = ((dev.bearingDeg || 0) * Math.PI) / 180 - Math.PI / 2;
        if (dev.bearingDeg === undefined) {
          const hash = dev.mac.split(':').reduce((acc, p) => acc + parseInt(p, 16) || 0, 0);
          angle = (hash % 360) * (Math.PI / 180);
        }

        const x = center + Math.cos(angle) * dist;
        const y = center + Math.sin(angle) * dist;

        const isHovered = hoveredDevice?.key === dev.key;
        const isSelected = selectedKey === dev.key;

        // Color coding
        let blipColor = dev.kind === 'WIFI' ? '#38BDF8' : '#10E79D';
        if (dev.fleetIds.length > 0) {
          blipColor = '#F59E0B'; // Classified target
        }
        if (nightMode) {
          blipColor = '#FF5A5A';
        }

        // Draw blip
        ctx.beginPath();
        const blipRadius = isSelected || isHovered ? 6 : 4;
        ctx.arc(x, y, blipRadius, 0, Math.PI * 2);
        ctx.fillStyle = blipColor;
        ctx.fill();

        if (isSelected || isHovered) {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Blip ring echo
          ctx.beginPath();
          ctx.arc(x, y, 10, 0, Math.PI * 2);
          ctx.strokeStyle = blipColor;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Label if high signal or hovered
        if (dev.rssi > -60 || isHovered || isSelected) {
          ctx.fillStyle = '#F1F5F9';
          ctx.font = '9px monospace';
          ctx.textAlign = 'left';
          const name =
            dev.name ||
            (dev.fleetIds.length > 0 ? fleetMap.get(dev.fleetIds[0])?.name : '') ||
            MacUtil.screenMac(dev.mac, demoMode);
          ctx.fillText(`${name} (${dev.rssi})`, x + 7, y + 3);
        }
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [devices, fleets, selectedKey, hoveredDevice, nightMode, demoMode, gridColor, primaryColor, sweepColor]);

  // Click & hover hit-testing
  const handleCanvasInteraction = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    const center = canvas.width / 2;
    const radius = center - 18;

    let closest: Sighting | null = null;
    let closestDist = 20; // Hit radius

    devices.forEach((dev) => {
      const clampedRssi = Math.max(-95, Math.min(-35, dev.rssi));
      const distanceRatio = (clampedRssi - -35) / (-95 - -35);
      const dist = Math.max(12, distanceRatio * radius * 0.95);

      let angle = ((dev.bearingDeg || 0) * Math.PI) / 180 - Math.PI / 2;
      if (dev.bearingDeg === undefined) {
        const hash = dev.mac.split(':').reduce((acc, p) => acc + parseInt(p, 16) || 0, 0);
        angle = (hash % 360) * (Math.PI / 180);
      }

      const x = center + Math.cos(angle) * dist;
      const y = center + Math.sin(angle) * dist;
      const d = Math.hypot(clickX - x, clickY - y);

      if (d < closestDist) {
        closestDist = d;
        closest = dev;
      }
    });

    if (e.type === 'click' && closest) {
      if (onSelectDevice) onSelectDevice(closest);
      if (onSelectKey) onSelectKey((closest as Sighting).key);
    } else if (e.type === 'mousemove') {
      setHoveredDevice(closest);
    }
  };

  return (
    <div className="flex flex-col items-center select-none">
      <div className="relative rounded-full p-1 bg-[#161B22] border border-[#2E384D] shadow-2xl">
        <canvas
          ref={canvasRef}
          width={340}
          height={340}
          onClick={handleCanvasInteraction}
          onMouseMove={handleCanvasInteraction}
          onMouseLeave={() => setHoveredDevice(null)}
          className="rounded-full cursor-crosshair block"
        />
      </div>
      <div className="text-[11px] font-mono text-[#94A3B8] mt-2 flex items-center gap-3">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#38BDF8]" /> Wi-Fi
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#10E79D]" /> BLE
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> Classified
        </span>
      </div>
    </div>
  );
};
