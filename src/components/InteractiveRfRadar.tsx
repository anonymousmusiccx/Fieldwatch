import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Sighting, Fleet, RadioKind } from '../types';
import { MacUtil } from '../domain/macUtil';
import { audioService } from '../domain/audioService';
import { Sparkline } from './Sparkline';
import {
  Compass,
  Crosshair,
  Volume2,
  VolumeX,
  Eye,
  Sliders,
  Radio,
  Wifi,
  Bluetooth,
  ShieldAlert,
  Zap,
  Navigation,
  Bookmark,
  Activity,
  Layers,
} from 'lucide-react';

export interface InteractiveRfRadarProps {
  devices: Sighting[];
  fleets?: Fleet[];
  selectedKey?: string | null;
  onSelectDevice?: (device: Sighting) => void;
  onHuntDevice?: (device: Sighting) => void;
  onToggleWatchlist?: (device: Sighting) => void;
  isWatchedKey?: (key: string) => boolean;
  nightMode?: boolean;
}

export const InteractiveRfRadar: React.FC<InteractiveRfRadarProps> = ({
  devices,
  fleets = [],
  selectedKey = null,
  onSelectDevice,
  onHuntDevice,
  onToggleWatchlist,
  isWatchedKey,
  nightMode = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Radar controls state
  const [rangeScaleMeters, setRangeScaleMeters] = useState<number>(25); // 10, 25, 50
  const [sweepSpeed, setSweepSpeed] = useState<'FAST' | 'NORMAL' | 'SLOW'>('NORMAL');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [cockpitRedMode, setCockpitRedMode] = useState<boolean>(nightMode);
  const [filterKind, setFilterKind] = useState<'ALL' | 'WIFI' | 'BLE'>('ALL');
  const [filterClassifiedOnly, setFilterClassifiedOnly] = useState<boolean>(false);
  const [minCutoffRssi, setMinCutoffRssi] = useState<number>(-95);

  // Selection & Hover
  const [lockedTargetKey, setLockedTargetKey] = useState<string | null>(selectedKey);
  const [hoveredTargetKey, setHoveredTargetKey] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Sweep animation state stored in ref for steady 60fps
  const sweepAngleRef = useRef<number>(0);
  const lastBlipHitsRef = useRef<Map<string, number>>(new Map()); // deviceKey -> timestampMs of hit

  const activeColor = cockpitRedMode ? '#F43F5E' : '#10E79D';
  const activeGlow = cockpitRedMode ? 'rgba(244, 63, 94, 0.25)' : 'rgba(16, 231, 157, 0.25)';

  // Sync selectedKey prop
  useEffect(() => {
    if (selectedKey !== undefined) {
      setLockedTargetKey(selectedKey);
    }
  }, [selectedKey]);

  // Sync night mode
  useEffect(() => {
    setCockpitRedMode(nightMode);
  }, [nightMode]);

  // Filtered devices
  const visibleDevices = useMemo(() => {
    return devices.filter((dev) => {
      if (filterKind !== 'ALL' && dev.kind !== filterKind) return false;
      if (filterClassifiedOnly && (!dev.matchedClass || dev.matchedClass === 'UNKNOWN' || dev.matchedClass === 'CONSUMER')) {
        return false;
      }
      if (dev.rssi < minCutoffRssi) return false;
      return true;
    });
  }, [devices, filterKind, filterClassifiedOnly, minCutoffRssi]);

  // Current locked device
  const lockedDevice = useMemo(() => {
    if (!lockedTargetKey) return null;
    return devices.find((d) => d.key === lockedTargetKey) || null;
  }, [devices, lockedTargetKey]);

  // Hovered device
  const hoveredDevice = useMemo(() => {
    if (!hoveredTargetKey) return null;
    return devices.find((d) => d.key === hoveredTargetKey) || null;
  }, [devices, hoveredTargetKey]);

  // Calculate radar positions for devices
  const blipPositions = useMemo(() => {
    return visibleDevices.map((dev) => {
      const distance = dev.estimatedDistanceMeters ?? MacUtil.estimateProximity(dev.rssi, dev.kind).meters;
      const bearing = dev.bearingDeg ?? 0;
      // Normalized radius relative to chosen scale (0.0 center to 1.0 outer ring)
      const normRadius = Math.min(1.0, Math.max(0.06, distance / rangeScaleMeters));
      return {
        device: dev,
        distance,
        bearing,
        normRadius,
      };
    });
  }, [visibleDevices, rangeScaleMeters]);

  // Main canvas rendering loop
  useEffect(() => {
    let animId: number;
    let lastTimestamp = performance.now();

    const speedFactors = {
      FAST: 160,   // deg / sec
      NORMAL: 90,  // deg / sec
      SLOW: 45,    // deg / sec
    };

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (now: number) => {
      const deltaSec = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      // Update sweep angle
      const speed = speedFactors[sweepSpeed];
      const prevAngle = sweepAngleRef.current;
      const nextAngle = (prevAngle + speed * deltaSec) % 360;
      sweepAngleRef.current = nextAngle;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.min(centerX, centerY) - 24;

      // 1. Clear background
      ctx.clearRect(0, 0, width, height);

      // Radial base gradient
      const bgGrad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, maxRadius);
      bgGrad.addColorStop(0, cockpitRedMode ? '#1A060A' : '#071813');
      bgGrad.addColorStop(0.7, cockpitRedMode ? '#100407' : '#05100D');
      bgGrad.addColorStop(1, '#0B0F14');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
      ctx.fill();

      // 2. Draw Range Rings
      const ringDistances = [
        { ratio: 0.25, dist: (rangeScaleMeters * 0.25).toFixed(0), label: 'IMMEDIATE' },
        { ratio: 0.50, dist: (rangeScaleMeters * 0.50).toFixed(0), label: 'NEAR' },
        { ratio: 0.75, dist: (rangeScaleMeters * 0.75).toFixed(0), label: 'TACTICAL' },
        { ratio: 1.00, dist: `${rangeScaleMeters}m`, label: 'PERIMETER' },
      ];

      ringDistances.forEach((ring) => {
        const r = maxRadius * ring.ratio;
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.strokeStyle = cockpitRedMode
          ? (ring.ratio === 0.25 ? 'rgba(244, 63, 94, 0.45)' : 'rgba(244, 63, 94, 0.18)')
          : (ring.ratio === 0.25 ? 'rgba(244, 63, 94, 0.4)' : 'rgba(16, 231, 157, 0.18)');
        ctx.lineWidth = ring.ratio === 1.0 ? 1.5 : 1;
        ctx.setLineDash(ring.ratio === 1.0 ? [] : [4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Ring distance label at 90 deg
        ctx.fillStyle = cockpitRedMode ? 'rgba(244, 63, 94, 0.5)' : 'rgba(16, 231, 157, 0.5)';
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${ring.dist}m`, centerX + r + 3, centerY - 2);
      });

      // Immediate threat proximity alert glow if device is within inner ring
      const hasImmediateContact = blipPositions.some((b) => b.normRadius <= 0.25);
      if (hasImmediateContact) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, maxRadius * 0.25, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(244, 63, 94, ${0.4 + Math.sin(now * 0.006) * 0.25})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 3. Compass Crosshairs & Angle Rays (0, 45, 90, 135, 180, 225, 270, 315)
      for (let deg = 0; deg < 360; deg += 45) {
        const rad = (deg - 90) * (Math.PI / 180);
        const x2 = centerX + Math.cos(rad) * maxRadius;
        const y2 = centerY + Math.sin(rad) * maxRadius;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = cockpitRedMode ? 'rgba(244, 63, 94, 0.12)' : 'rgba(16, 231, 157, 0.12)';
        ctx.lineWidth = deg % 90 === 0 ? 1.2 : 0.6;
        ctx.stroke();

        // Compass Ticks around rim
        const compassText =
          deg === 0 ? 'N 000°' :
          deg === 90 ? 'E 090°' :
          deg === 180 ? 'S 180°' :
          deg === 270 ? 'W 270°' : `${deg}°`;

        const tx = centerX + Math.cos(rad) * (maxRadius + 14);
        const ty = centerY + Math.sin(rad) * (maxRadius + 14);
        ctx.fillStyle = (deg % 90 === 0)
          ? (cockpitRedMode ? '#F43F5E' : '#10E79D')
          : (cockpitRedMode ? 'rgba(244, 63, 94, 0.4)' : 'rgba(16, 231, 157, 0.4)');
        ctx.font = deg % 90 === 0 ? 'bold 10px monospace' : '8px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(compassText, tx, ty);
      }

      // 4. Rotating Phosphor Sweep Beam with Decay Trail
      const sweepRad = (nextAngle - 90) * (Math.PI / 180);
      const trailAngleSpan = 50 * (Math.PI / 180); // 50 degrees trail

      const sweepGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, maxRadius);
      sweepGrad.addColorStop(0, cockpitRedMode ? 'rgba(244, 63, 94, 0.45)' : 'rgba(16, 231, 157, 0.45)');
      sweepGrad.addColorStop(1, 'transparent');

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, maxRadius, sweepRad - trailAngleSpan, sweepRad, false);
      ctx.closePath();

      const coneGrad = ctx.createConicGradient(sweepRad - Math.PI / 2, centerX, centerY);
      if (cockpitRedMode) {
        coneGrad.addColorStop(0, 'rgba(244, 63, 94, 0.35)');
        coneGrad.addColorStop(0.12, 'rgba(244, 63, 94, 0.08)');
        coneGrad.addColorStop(0.2, 'transparent');
        coneGrad.addColorStop(1, 'transparent');
      } else {
        coneGrad.addColorStop(0, 'rgba(16, 231, 157, 0.35)');
        coneGrad.addColorStop(0.12, 'rgba(16, 231, 157, 0.08)');
        coneGrad.addColorStop(0.2, 'transparent');
        coneGrad.addColorStop(1, 'transparent');
      }
      ctx.fillStyle = coneGrad;
      ctx.fill();

      // Sharp sweep leading line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(sweepRad) * maxRadius,
        centerY + Math.sin(sweepRad) * maxRadius
      );
      ctx.strokeStyle = cockpitRedMode ? '#FDA4AF' : '#6EE7B7';
      ctx.lineWidth = 1.8;
      ctx.shadowColor = activeColor;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.restore();

      // 5. Draw Blips & Check Sweep Hit for Audio / Glow
      blipPositions.forEach((blip) => {
        const { device, bearing, normRadius, distance } = blip;
        const rad = (bearing - 90) * (Math.PI / 180);
        const bx = centerX + Math.cos(rad) * (maxRadius * normRadius);
        const by = centerY + Math.sin(rad) * (maxRadius * normRadius);

        // Calculate angular difference with current sweep angle
        let angleDiff = (nextAngle - bearing + 360) % 360;
        const wasHit = (prevAngle <= bearing && nextAngle >= bearing) ||
                       (prevAngle > nextAngle && (bearing >= prevAngle || bearing <= nextAngle));

        const nowMs = Date.now();
        if (wasHit) {
          lastBlipHitsRef.current.set(device.key, nowMs);
          if (soundEnabled) {
            const isThreat = device.matchedClass === 'SURVEILLANCE' ||
                             device.matchedClass === 'DRONE_UAV' ||
                             (isWatchedKey && isWatchedKey(device.key));
            audioService.playRadarTargetBlip(isThreat ? 1650 : 1100, isThreat || false);
          }
        }

        const lastHit = lastBlipHitsRef.current.get(device.key) || 0;
        const timeSinceHit = nowMs - lastHit;
        const hitAlpha = Math.max(0, 1 - timeSinceHit / 2400); // fade out over 2.4s

        const isLocked = lockedTargetKey === device.key;
        const isHovered = hoveredTargetKey === device.key;
        const isWatched = isWatchedKey ? isWatchedKey(device.key) : false;
        const isThreat = device.matchedClass === 'SURVEILLANCE' ||
                         device.matchedClass === 'DRONE_UAV' ||
                         device.matchedClass === 'POLICE_EMERGENCY';

        // Blip color
        let blipColor = cockpitRedMode ? '#F43F5E' : '#10E79D';
        if (isThreat || isWatched) blipColor = '#F43F5E';
        else if (device.matchedClass === 'DRONE_UAV') blipColor = '#FB923C';
        else if (device.matchedClass === 'BODY_WORN') blipColor = '#A855F7';
        else if (device.kind === 'WIFI') blipColor = cockpitRedMode ? '#FB7185' : '#38BDF8';

        // Luminescent phosphor burst when beam sweeps across
        if (hitAlpha > 0) {
          ctx.beginPath();
          ctx.arc(bx, by, 7 + hitAlpha * 9, 0, Math.PI * 2);
          ctx.fillStyle = blipColor;
          ctx.globalAlpha = hitAlpha * 0.45;
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }

        // Draw geometric blip glyph
        ctx.save();
        ctx.translate(bx, by);

        if (isLocked) {
          // Tactical Reticle Bracket around locked target
          ctx.strokeStyle = '#FACC15';
          ctx.lineWidth = 1.5;
          const s = 11;
          // 4 corners
          ctx.beginPath();
          ctx.moveTo(-s, -s + 4); ctx.lineTo(-s, -s); ctx.lineTo(-s + 4, -s);
          ctx.moveTo(s - 4, -s); ctx.lineTo(s, -s); ctx.lineTo(s, -s + 4);
          ctx.moveTo(-s, s - 4); ctx.lineTo(-s, s); ctx.lineTo(-s + 4, s);
          ctx.moveTo(s - 4, s); ctx.lineTo(s, s); ctx.lineTo(s, s - 4);
          ctx.stroke();

          // Distance vector from center to target
          ctx.restore();
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(bx, by);
          ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.save();
          ctx.translate(bx, by);
        }

        // Base glyph shape by signature class
        ctx.fillStyle = blipColor;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = isHovered ? 1.5 : 0.8;

        if (device.matchedClass === 'DRONE_UAV') {
          // Diamond for UAV
          ctx.beginPath();
          ctx.moveTo(0, -6);
          ctx.lineTo(6, 0);
          ctx.lineTo(0, 6);
          ctx.lineTo(-6, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (isThreat || isWatched) {
          // Inverted Warning Triangle
          ctx.beginPath();
          ctx.moveTo(0, 6);
          ctx.lineTo(6, -5);
          ctx.lineTo(-6, -5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else if (device.kind === 'WIFI') {
          // Hexagon for Wi-Fi AP
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (i * Math.PI) / 3;
            const x = Math.cos(a) * 4.5;
            const y = Math.sin(a) * 4.5;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          // Circle for BLE / general
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        // Label on hover or locked
        if (isHovered || isLocked) {
          ctx.font = '10px monospace';
          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          const nameTag = device.ssid || device.name || (device.mac ? device.mac.substring(9) : 'Contact');
          ctx.fillText(`${nameTag} (${device.rssi}dBm)`, 9, -2);
        }

        ctx.restore();
      });

      // 6. Center Operator Position Ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
      ctx.fillStyle = activeColor;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
      ctx.strokeStyle = activeColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    blipPositions,
    sweepSpeed,
    rangeScaleMeters,
    cockpitRedMode,
    lockedTargetKey,
    hoveredTargetKey,
    soundEnabled,
    activeColor,
    isWatchedKey,
  ]);

  // Handle canvas mouse interaction (click blip, hover)
  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      setMousePos({ x, y });

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.min(centerX, centerY) - 24;

      let foundKey: string | null = null;

      for (const blip of blipPositions) {
        const rad = (blip.bearing - 90) * (Math.PI / 180);
        const bx = centerX + Math.cos(rad) * (maxRadius * blip.normRadius);
        const by = centerY + Math.sin(rad) * (maxRadius * blip.normRadius);

        const dist = Math.hypot(x - bx, y - by);
        if (dist <= 14) {
          foundKey = blip.device.key;
          break;
        }
      }
      setHoveredTargetKey(foundKey);
    },
    [blipPositions]
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.min(centerX, centerY) - 24;

      let clickedDevice: Sighting | null = null;

      for (const blip of blipPositions) {
        const rad = (blip.bearing - 90) * (Math.PI / 180);
        const bx = centerX + Math.cos(rad) * (maxRadius * blip.normRadius);
        const by = centerY + Math.sin(rad) * (maxRadius * blip.normRadius);

        const dist = Math.hypot(x - bx, y - by);
        if (dist <= 14) {
          clickedDevice = blip.device;
          break;
        }
      }

      if (clickedDevice) {
        setLockedTargetKey(clickedDevice.key);
        if (onSelectDevice) onSelectDevice(clickedDevice);
        audioService.playGeigerClick(0.3);
      } else {
        // Deselect if clicking center or empty space
        setLockedTargetKey(null);
      }
    },
    [blipPositions, onSelectDevice]
  );

  // Tactical summary counters
  const threatCount = useMemo(() => {
    return visibleDevices.filter(
      (d) =>
        d.matchedClass === 'SURVEILLANCE' ||
        d.matchedClass === 'DRONE_UAV' ||
        d.matchedClass === 'POLICE_EMERGENCY' ||
        (isWatchedKey && isWatchedKey(d.key))
    ).length;
  }, [visibleDevices, isWatchedKey]);

  const nearestDevice = useMemo(() => {
    if (visibleDevices.length === 0) return null;
    return [...visibleDevices].sort(
      (a, b) =>
        (a.estimatedDistanceMeters ?? 99) - (b.estimatedDistanceMeters ?? 99)
    )[0];
  }, [visibleDevices]);

  return (
    <div className="w-full flex flex-col items-center select-none" ref={containerRef}>
      {/* Top Tactical Status Bar */}
      <div className="w-full max-w-xl flex items-center justify-between px-3 py-2 bg-[#0E1520] border border-[#1E293B] rounded-lg mb-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                threatCount > 0 ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'
              }`}
            />
            <span className="text-[#94A3B8] uppercase">Contacts:</span>
            <span className="font-bold text-white tabular-nums">{visibleDevices.length}</span>
          </div>

          {threatCount > 0 && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-semibold border border-rose-500/40">
              <ShieldAlert className="w-3 h-3" />
              <span>{threatCount} PRIORITY</span>
            </div>
          )}
        </div>

        {nearestDevice && (
          <div className="flex items-center gap-1.5 text-[#94A3B8]">
            <Crosshair className="w-3 h-3 text-[#10E79D]" />
            <span>NEAREST:</span>
            <span className="text-white font-bold tabular-nums">
              {(nearestDevice.estimatedDistanceMeters ?? 0).toFixed(1)}m
            </span>
            <span className="text-[10px] text-[#64748B]">({nearestDevice.rssi}dBm)</span>
          </div>
        )}

        <div className="flex items-center gap-1">
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            title={soundEnabled ? 'Mute radar audio' : 'Enable radar audio'}
            className={`p-1.5 rounded hover:bg-[#1E293B] transition-colors ${
              soundEnabled ? 'text-[#10E79D]' : 'text-[#64748B]'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setCockpitRedMode((prev) => !prev)}
            title="Toggle FLIR Night Mode"
            className={`px-1.5 py-1 rounded text-[10px] font-semibold border transition-colors ${
              cockpitRedMode
                ? 'bg-rose-950 text-rose-300 border-rose-700'
                : 'bg-[#14231E] text-emerald-400 border-emerald-800'
            }`}
          >
            {cockpitRedMode ? 'FLIR RED' : 'PHOSPHOR'}
          </button>
        </div>
      </div>

      {/* Main Radar Screen */}
      <div className="relative flex items-center justify-center p-2 bg-[#080D14] border border-[#182332] rounded-xl shadow-2xl">
        <canvas
          ref={canvasRef}
          width={380}
          height={380}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={() => setHoveredTargetKey(null)}
          className="cursor-crosshair block rounded-lg touch-none max-w-full"
          style={{ width: '380px', height: '380px' }}
        />

        {/* HUD Range Calibration Floating Badge */}
        <div className="absolute top-4 left-4 flex flex-col gap-1 pointer-events-none">
          <div className="flex items-center gap-1 text-[10px] font-mono text-[#94A3B8] bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded border border-[#1E293B]">
            <Compass className="w-3 h-3 text-[#10E79D]" />
            <span>SCALE: {rangeScaleMeters}m</span>
          </div>
          <div className="text-[9px] font-mono text-[#64748B] bg-black/40 px-1.5 py-0.5 rounded">
            SWEEP: {sweepSpeed}
          </div>
        </div>

        {/* Target Hover Quick Card */}
        {hoveredDevice && !lockedDevice && (
          <div className="absolute bottom-4 left-4 right-4 bg-[#0E1724]/90 backdrop-blur-md border border-[#1E2E42] p-2.5 rounded-lg flex items-center justify-between text-xs pointer-events-none animate-in fade-in zoom-in-95 duration-150">
            <div>
              <div className="font-semibold text-white flex items-center gap-1.5">
                {hoveredDevice.kind === 'WIFI' ? (
                  <Wifi className="w-3.5 h-3.5 text-sky-400" />
                ) : (
                  <Bluetooth className="w-3.5 h-3.5 text-blue-400" />
                )}
                <span>{hoveredDevice.ssid || hoveredDevice.name || hoveredDevice.mac}</span>
              </div>
              <div className="text-[10px] text-[#94A3B8] font-mono mt-0.5">
                {hoveredDevice.ouiVendor || 'Unknown Vendor'} • {hoveredDevice.mac}
              </div>
            </div>
            <div className="text-right font-mono">
              <div className="text-[#10E79D] font-bold">
                {(hoveredDevice.estimatedDistanceMeters ?? 0).toFixed(1)}m
              </div>
              <div className="text-[10px] text-[#94A3B8]">{hoveredDevice.rssi} dBm</div>
            </div>
          </div>
        )}
      </div>

      {/* Locked Target Tactical HUD Card */}
      {lockedDevice && (
        <div className="w-full max-w-xl mt-3 p-3 bg-[#0F172A] border border-amber-500/40 rounded-xl shadow-lg animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#1E293B]">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-amber-500/20 text-amber-400">
                <Crosshair className="w-4 h-4 animate-spin-slow" />
              </span>
              <div>
                <div className="font-bold text-sm text-white flex items-center gap-2">
                  <span>{lockedDevice.ssid || lockedDevice.name || 'Unnamed Transceiver'}</span>
                  {lockedDevice.matchedClass && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      {lockedDevice.matchedClass}
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-[#94A3B8]">
                  {lockedDevice.mac} • {lockedDevice.ouiVendor}
                </div>
              </div>
            </div>

            <button
              onClick={() => setLockedTargetKey(null)}
              className="text-xs text-[#94A3B8] hover:text-white px-2 py-1 bg-[#1E293B] rounded hover:bg-[#334155] transition-colors"
            >
              DISENGAGE
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono py-1 mb-2 bg-[#0B0F17] rounded-lg border border-[#1E293B]">
            <div>
              <div className="text-[10px] text-[#64748B]">DISTANCE</div>
              <div className="font-bold text-emerald-400 text-sm">
                {(lockedDevice.estimatedDistanceMeters ?? 0).toFixed(1)}m
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#64748B]">AZIMUTH / BEARING</div>
              <div className="font-bold text-sky-400 text-sm">
                {(lockedDevice.bearingDeg ?? 0).toFixed(0)}°
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#64748B]">SIGNAL (RSSI)</div>
              <div className="font-bold text-rose-400 text-sm">{lockedDevice.rssi} dBm</div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#94A3B8]">HISTORY:</span>
              <Sparkline data={lockedDevice.rssiHistory} width={80} height={18} color="#FACC15" />
            </div>

            <div className="flex items-center gap-1.5">
              {onHuntDevice && (
                <button
                  onClick={() => onHuntDevice(lockedDevice)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs rounded transition-colors"
                >
                  <Navigation className="w-3 h-3" />
                  <span>HUNT</span>
                </button>
              )}
              {onToggleWatchlist && (
                <button
                  onClick={() => onToggleWatchlist(lockedDevice)}
                  className={`flex items-center gap-1 px-2 py-1 text-xs rounded border transition-colors ${
                    isWatchedKey && isWatchedKey(lockedDevice.key)
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                      : 'bg-[#1E293B] text-[#94A3B8] border-[#334155] hover:text-white'
                  }`}
                >
                  <Bookmark className="w-3 h-3" />
                  <span>{isWatchedKey && isWatchedKey(lockedDevice.key) ? 'WATCHED' : 'WATCH'}</span>
                </button>
              )}
              {onSelectDevice && (
                <button
                  onClick={() => onSelectDevice(lockedDevice)}
                  className="px-2 py-1 bg-[#1E293B] hover:bg-[#334155] text-white text-xs rounded transition-colors"
                >
                  DETAILS
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Radar Control Station Dock */}
      <div className="w-full max-w-xl mt-3 p-3 bg-[#0B0F17] border border-[#1E293B] rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Scale Picker */}
        <div className="flex items-center gap-1">
          <span className="text-[#64748B] font-mono text-[10px] mr-1">RANGE:</span>
          {[10, 25, 50].map((scale) => (
            <button
              key={scale}
              onClick={() => setRangeScaleMeters(scale)}
              className={`px-2 py-1 rounded font-mono font-medium transition-colors ${
                rangeScaleMeters === scale
                  ? 'bg-emerald-500 text-black font-bold'
                  : 'bg-[#141E2B] text-[#94A3B8] hover:text-white'
              }`}
            >
              {scale}m
            </button>
          ))}
        </div>

        {/* Sweep Speed Picker */}
        <div className="flex items-center gap-1">
          <span className="text-[#64748B] font-mono text-[10px] mr-1">SPEED:</span>
          {(['SLOW', 'NORMAL', 'FAST'] as const).map((spd) => (
            <button
              key={spd}
              onClick={() => setSweepSpeed(spd)}
              className={`px-2 py-1 rounded font-mono text-[10px] transition-colors ${
                sweepSpeed === spd
                  ? 'bg-sky-500 text-black font-bold'
                  : 'bg-[#141E2B] text-[#94A3B8] hover:text-white'
              }`}
            >
              {spd}
            </button>
          ))}
        </div>

        {/* Radio Filter Selector */}
        <div className="flex items-center gap-1">
          <span className="text-[#64748B] font-mono text-[10px] mr-1">BAND:</span>
          {(['ALL', 'WIFI', 'BLE'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilterKind(k)}
              className={`px-2 py-1 rounded font-mono text-[10px] transition-colors ${
                filterKind === k
                  ? 'bg-amber-400 text-black font-bold'
                  : 'bg-[#141E2B] text-[#94A3B8] hover:text-white'
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        {/* Classified Only Toggle */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={() => setFilterClassifiedOnly((prev) => !prev)}
            className={`px-2 py-1 rounded font-mono text-[10px] border transition-colors ${
              filterClassifiedOnly
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/60 font-bold'
                : 'bg-[#141E2B] text-[#94A3B8] border-transparent hover:text-white'
            }`}
          >
            THREATS ONLY
          </button>
        </div>
      </div>
    </div>
  );
};
