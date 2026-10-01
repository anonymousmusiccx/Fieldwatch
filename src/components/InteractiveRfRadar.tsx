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
  AlertTriangle,
  Bookmark,
  Shield,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
  X,
  Gauge,
  Navigation,
} from 'lucide-react';

interface InteractiveRfRadarProps {
  devices: Sighting[];
  fleets: Fleet[];
  selectedKey?: string | null;
  onSelectDevice?: (device: Sighting) => void;
  onHuntDevice?: (device: Sighting) => void;
  onToggleWatchlist?: (device: Sighting) => void;
  isWatchedKey?: (key: string) => boolean;
  customNames?: Map<string, string>;
  demoMode?: boolean;
  nightMode?: boolean;
}

export type RangeScale = 'CLOSE_10M' | 'LOCAL_25M' | 'PERIMETER_50M';
export type SweepSpeed = 'FAST' | 'NORMAL' | 'SLOW';

interface TargetBlip {
  device: Sighting;
  x: number;
  y: number;
  distNorm: number; // 0 (center) to 1 (outer ring)
  angleRad: number; // radians
  bearingDeg: number;
  estDistanceMeters: number;
  zone: 'IMMEDIATE' | 'NEAR' | 'TACTICAL' | 'PERIMETER';
  lastHitTime: number; // timestamp when sweep line crossed
}

export const InteractiveRfRadar: React.FC<InteractiveRfRadarProps> = ({
  devices,
  fleets,
  selectedKey: externalSelectedKey,
  onSelectDevice,
  onHuntDevice,
  onToggleWatchlist,
  isWatchedKey,
  customNames,
  demoMode = false,
  nightMode = false,
}) => {
  // Local state
  const [lockedKey, setLockedKey] = useState<string | null>(externalSelectedKey || null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [rangeScale, setRangeScale] = useState<RangeScale>('LOCAL_25M');
  const [sweepSpeed, setSweepSpeed] = useState<SweepSpeed>('NORMAL');
  const [audioPings, setAudioPings] = useState<boolean>(true);
  const [showFiltersHud, setShowFiltersHud] = useState<boolean>(false);

  // Quick filters on radar
  const [filterWifi, setFilterWifi] = useState(true);
  const [filterBle, setFilterBle] = useState(true);
  const [filterClassifiedOnly, setFilterClassifiedOnly] = useState(false);
  const [filterMinRssi, setFilterMinRssi] = useState(-100);

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sweepAngleRef = useRef(0);
  const lastSweepAngleRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const hitTimesRef = useRef<Map<string, number>>(new Map());

  // Fleet map lookup
  const fleetMap = useMemo(() => new Map(fleets.map((f) => [f.id, f])), [fleets]);

  // Sweep rotation speeds: FAST=4.0 rad/s (1.5s), NORMAL=2.0 rad/s (3.1s), SLOW=1.0 rad/s (6.2s)
  const sweepVelocity = useMemo(() => {
    switch (sweepSpeed) {
      case 'FAST':
        return 4.0;
      case 'SLOW':
        return 1.0;
      default:
        return 2.0;
    }
  }, [sweepSpeed]);

  // Filtered devices for radar
  const radarDevices = useMemo(() => {
    return devices.filter((d) => {
      if (d.kind === 'WIFI' && !filterWifi) return false;
      if (d.kind === 'BLE' && !filterBle) return false;
      if (d.rssi < filterMinRssi) return false;
      if (filterClassifiedOnly && d.fleetIds.length === 0) return false;
      return true;
    });
  }, [devices, filterWifi, filterBle, filterMinRssi, filterClassifiedOnly]);

  // Log-distance path loss approximation for RF distance estimation
  // d = 10 ^ ((Tx1m - RSSI) / (10 * n))
  const estimateDistance = useCallback((rssi: number, kind: RadioKind): { meters: number; zone: TargetBlip['zone'] } => {
    const tx1m = kind === 'WIFI' ? -48 : -59;
    const n = 2.2; // path loss exponent in typical cluttered RF environment
    const rawMeters = Math.pow(10, (tx1m - rssi) / (10 * n));
    const clampedMeters = Math.max(0.3, Math.min(60, Number(rawMeters.toFixed(1))));

    let zone: TargetBlip['zone'] = 'PERIMETER';
    if (clampedMeters < 2.5 || rssi > -50) zone = 'IMMEDIATE';
    else if (clampedMeters < 7 || rssi > -65) zone = 'NEAR';
    else if (clampedMeters < 20 || rssi > -80) zone = 'TACTICAL';

    return { meters: clampedMeters, zone };
  }, []);

  // Compute blip positions
  const blips = useMemo<TargetBlip[]>(() => {
    return radarDevices.map((dev) => {
      const { meters, zone } = estimateDistance(dev.rssi, dev.kind);

      // Distance normalized across radar scale (0 to 1)
      let maxScaleMeters = 25;
      if (rangeScale === 'CLOSE_10M') maxScaleMeters = 10;
      if (rangeScale === 'PERIMETER_50M') maxScaleMeters = 50;

      // Logarithmic compression for clean radar distribution
      const rawRatio = meters / maxScaleMeters;
      const distNorm = Math.max(0.08, Math.min(0.96, Math.sqrt(rawRatio)));

      // Bearing angle [0, 2pi)
      let bearingDeg = dev.bearingDeg;
      if (bearingDeg === undefined) {
        // Fallback pseudo-bearing from MAC octets for stable positioning
        const octets = dev.mac.split(':').map((h) => parseInt(h, 16) || 0);
        const sum = octets.reduce((acc, v) => acc + v, 0);
        bearingDeg = sum % 360;
      }

      // Convert bearing (0° = North = top of radar) to canvas radians
      const angleRad = ((bearingDeg - 90) * Math.PI) / 180;

      return {
        device: dev,
        x: 0, // calculated in canvas render based on canvas radius
        y: 0,
        distNorm,
        angleRad,
        bearingDeg,
        estDistanceMeters: meters,
        zone,
        lastHitTime: hitTimesRef.current.get(dev.key) || 0,
      };
    });
  }, [radarDevices, estimateDistance, rangeScale]);

  // Locked device object
  const lockedDevice = useMemo(() => {
    return devices.find((d) => d.key === lockedKey) || null;
  }, [devices, lockedKey]);

  // Density metrics
  const immediateCount = useMemo(
    () => blips.filter((b) => b.zone === 'IMMEDIATE').length,
    [blips]
  );
  const classifiedCount = useMemo(
    () => blips.filter((b) => b.device.fleetIds.length > 0).length,
    [blips]
  );

  // Palette colors
  const palette = useMemo(() => {
    if (nightMode) {
      return {
        primary: '#FF3D5A',
        primaryGlow: 'rgba(255, 61, 90, 0.4)',
        ringGrid: 'rgba(255, 61, 90, 0.22)',
        ringText: 'rgba(255, 120, 120, 0.75)',
        sweep: 'rgba(255, 61, 90, 0.25)',
        blipWifi: '#38BDF8',
        blipBle: '#FF3D5A',
        blipClassified: '#FFB020',
        bgCenter: '#190808',
        bgOuter: '#0C0404',
        reticle: '#FF5A72',
      };
    }
    return {
      primary: '#10E79D',
      primaryGlow: 'rgba(16, 231, 157, 0.4)',
      ringGrid: 'rgba(16, 231, 157, 0.24)',
      ringText: 'rgba(16, 231, 157, 0.75)',
      sweep: 'rgba(16, 231, 157, 0.28)',
      blipWifi: '#38BDF8',
      blipBle: '#10E79D',
      blipClassified: '#FFB020',
      bgCenter: '#081711',
      bgOuter: '#05090C',
      reticle: '#3DFF9A',
    };
  }, [nightMode]);

  // Canvas Animation & Rendering Loop
  useEffect(() => {
    let lastTimestamp = performance.now();

    const render = (now: number) => {
      const dt = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      // Update sweep angle
      const prevAngle = sweepAngleRef.current;
      const nextAngle = (prevAngle + dt * sweepVelocity) % (Math.PI * 2);
      sweepAngleRef.current = nextAngle;
      lastSweepAngleRef.current = prevAngle;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const center = width / 2;
      const radius = center - 24;

      ctx.clearRect(0, 0, width, height);

      // 1. Radar Screen Radial Vignette Background
      const bgGrad = ctx.createRadialGradient(center, center, 4, center, center, radius + 20);
      bgGrad.addColorStop(0, palette.bgCenter);
      bgGrad.addColorStop(0.7, '#070C11');
      bgGrad.addColorStop(1, '#030508');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(center, center, radius + 18, 0, Math.PI * 2);
      ctx.fill();

      // 2. Outer Compass Degree Ring with Ticks
      ctx.strokeStyle = palette.ringGrid;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(center, center, radius + 8, 0, Math.PI * 2);
      ctx.stroke();

      // 10-degree and 30-degree azimuth ticks
      for (let deg = 0; deg < 360; deg += 10) {
        const rad = ((deg - 90) * Math.PI) / 180;
        const isMajor = deg % 30 === 0;
        const tickLen = isMajor ? 8 : 4;
        const outerR = radius + 8;
        const innerR = outerR - tickLen;

        ctx.strokeStyle = isMajor ? palette.primary : palette.ringGrid;
        ctx.lineWidth = isMajor ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(center + Math.cos(rad) * innerR, center + Math.sin(rad) * innerR);
        ctx.lineTo(center + Math.cos(rad) * outerR, center + Math.sin(rad) * outerR);
        ctx.stroke();

        // Major degree text labels (every 30 degrees)
        if (isMajor && deg % 90 !== 0) {
          ctx.fillStyle = palette.ringText;
          ctx.font = '8px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const textR = radius + 17;
          ctx.fillText(deg.toString().padStart(3, '0'), center + Math.cos(rad) * textR, center + Math.sin(rad) * textR);
        }
      }

      // 3. Radial Bearing Lines (every 45 degrees)
      ctx.strokeStyle = palette.ringGrid;
      ctx.lineWidth = 0.75;
      ctx.setLineDash([2, 4]);
      for (let a = 0; a < 4; a++) {
        const rad = (a * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(center - Math.cos(rad) * radius, center - Math.sin(rad) * radius);
        ctx.lineTo(center + Math.cos(rad) * radius, center + Math.sin(rad) * radius);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // 4. Concentric Range Rings (Proximity Zones)
      const ringConfig = [
        { ratio: 0.25, label: '2.5m · -45dBm (IMM)', name: 'IMMEDIATE' },
        { ratio: 0.5, label: '7m · -60dBm (NEAR)', name: 'NEAR' },
        { ratio: 0.75, label: '18m · -75dBm (TAC)', name: 'TACTICAL' },
        { ratio: 1.0, label: `${rangeScale === 'CLOSE_10M' ? '10m' : rangeScale === 'LOCAL_25M' ? '25m' : '50m'} · -90dBm`, name: 'PERIMETER' },
      ];

      ringConfig.forEach((ring, idx) => {
        const r = radius * ring.ratio;
        ctx.beginPath();
        ctx.arc(center, center, r, 0, Math.PI * 2);
        ctx.strokeStyle = idx === 0 ? 'rgba(255, 90, 90, 0.35)' : palette.ringGrid;
        ctx.lineWidth = idx === 3 ? 1.5 : 1;
        ctx.stroke();

        // Range ring label on 45° diagonal axis
        ctx.fillStyle = idx === 0 ? 'rgba(255, 120, 120, 0.85)' : palette.ringText;
        ctx.font = '8px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(ring.label, center + 4, center - r + 11);
      });

      // 5. Cardinal Direction Labels (N, E, S, W)
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = palette.primary;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('N', center, center - radius - 16);
      ctx.fillText('S', center, center + radius + 17);
      ctx.fillText('E', center + radius + 16, center);
      ctx.fillText('W', center - radius - 17, center);

      // 6. Sweeping Beam & Phosphor Trailing Sector
      const sweepAngle = sweepAngleRef.current;
      const trailSector = Math.PI / 2.5; // ~72 degrees decay sector

      // Phosphor decay sector gradient
      const sweepGrad = ctx.createRadialGradient(center, center, 0, center, center, radius);
      sweepGrad.addColorStop(0, 'rgba(0,0,0,0)');
      sweepGrad.addColorStop(0.3, 'rgba(0,0,0,0)');
      sweepGrad.addColorStop(1, palette.sweep);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, sweepAngle - trailSector, sweepAngle, false);
      ctx.closePath();
      ctx.fillStyle = sweepGrad;
      ctx.fill();

      // Sharp beam leading line
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.lineTo(center + Math.cos(sweepAngle) * radius, center + Math.sin(sweepAngle) * radius);
      ctx.strokeStyle = palette.primary;
      ctx.lineWidth = 1.8;
      ctx.shadowColor = palette.primary;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.restore();

      // 7. Check Sweep Collisions & Play Audio Ping
      // An angle is crossed if device angle is between prevAngle and nextAngle (handling 2pi wrap)
      blips.forEach((blip) => {
        // Normalize angle to [0, 2pi)
        const blipNormAngle = (blip.angleRad + Math.PI * 2) % (Math.PI * 2);
        let crossed = false;
        if (nextAngle >= prevAngle) {
          crossed = blipNormAngle >= prevAngle && blipNormAngle <= nextAngle;
        } else {
          // Wrapped around 2pi
          crossed = blipNormAngle >= prevAngle || blipNormAngle <= nextAngle;
        }

        if (crossed) {
          hitTimesRef.current.set(blip.device.key, now);
          blip.lastHitTime = now;

          // Acoustic ping if unmuted
          if (audioPings) {
            const isProximate = blip.zone === 'IMMEDIATE';
            const isClassified = blip.device.fleetIds.length > 0;
            const pingFreq = isClassified ? 1280 : isProximate ? 1040 : 880;
            const pingVol = isProximate ? 0.12 : 0.05;
            audioService.playRadarTargetBlip(pingFreq, pingVol);
          }
        }
      });

      // 8. Render Device Blips
      blips.forEach((blip) => {
        const blipRadius = radius * blip.distNorm;
        const bx = center + Math.cos(blip.angleRad) * blipRadius;
        const by = center + Math.sin(blip.angleRad) * blipRadius;
        blip.x = bx;
        blip.y = by;

        const isLocked = lockedKey === blip.device.key;
        const isHovered = hoveredKey === blip.device.key;

        // Phosphor decay afterglow calculation
        const timeSinceHit = now - (hitTimesRef.current.get(blip.device.key) || 0);
        const glowFactor = Math.max(0, 1 - timeSinceHit / 2400); // fades over 2.4s

        // Color resolution
        let blipColor = blip.device.kind === 'WIFI' ? palette.blipWifi : palette.blipBle;
        if (blip.device.fleetIds.length > 0) {
          blipColor = palette.blipClassified;
        }

        // Draw beam hit glow ripple
        if (glowFactor > 0.05) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(bx, by, 7 + (1 - glowFactor) * 14, 0, Math.PI * 2);
          ctx.strokeStyle = blipColor;
          ctx.lineWidth = 1.2 * glowFactor;
          ctx.globalAlpha = glowFactor * 0.8;
          ctx.stroke();
          ctx.restore();
        }

        // Immediate proximity danger pulse ring (<2.5m)
        if (blip.zone === 'IMMEDIATE') {
          const pulse = (Math.sin(now / 180) + 1) / 2;
          ctx.save();
          ctx.beginPath();
          ctx.arc(bx, by, 10 + pulse * 6, 0, Math.PI * 2);
          ctx.strokeStyle = '#FF3D5A';
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.5 + pulse * 0.5;
          ctx.stroke();
          ctx.restore();
        }

        // Blip Glyph Rendering
        ctx.save();
        ctx.fillStyle = blipColor;
        ctx.shadowColor = blipColor;
        ctx.shadowBlur = 6 + glowFactor * 8;

        if (blip.device.kind === 'WIFI') {
          // Wi-Fi: Diamond
          ctx.beginPath();
          const dSize = isLocked || isHovered ? 6 : 4.5;
          ctx.moveTo(bx, by - dSize);
          ctx.lineTo(bx + dSize, by);
          ctx.lineTo(bx, by + dSize);
          ctx.lineTo(bx - dSize, by);
          ctx.closePath();
          ctx.fill();
        } else if (blip.device.fleetIds.length > 0) {
          // Classified Target: Inverted Triangle
          ctx.beginPath();
          const tSize = isLocked || isHovered ? 6 : 4.5;
          ctx.moveTo(bx, by + tSize);
          ctx.lineTo(bx - tSize, by - tSize);
          ctx.lineTo(bx + tSize, by - tSize);
          ctx.closePath();
          ctx.fill();
        } else {
          // Standard BLE: Circle
          ctx.beginPath();
          const cSize = isLocked || isHovered ? 5.5 : 4;
          ctx.arc(bx, by, cSize, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // 9. Locked Reticle & Distance Vector
        if (isLocked) {
          // Vector line from operator center to locked target
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(center, center);
          ctx.lineTo(bx, by);
          ctx.strokeStyle = palette.reticle;
          ctx.lineWidth = 1.2;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Rotating tactical lock reticle
          const rot = (now / 400) % (Math.PI * 2);
          ctx.translate(bx, by);
          ctx.rotate(rot);

          ctx.strokeStyle = palette.reticle;
          ctx.lineWidth = 1.6;

          // Square bracket corners
          const b = 10;
          const len = 4;
          // Top-Left
          ctx.beginPath();
          ctx.moveTo(-b, -b + len);
          ctx.lineTo(-b, -b);
          ctx.lineTo(-b + len, -b);
          ctx.stroke();
          // Top-Right
          ctx.beginPath();
          ctx.moveTo(b - len, -b);
          ctx.lineTo(b, -b);
          ctx.lineTo(b, -b + len);
          ctx.stroke();
          // Bottom-Right
          ctx.beginPath();
          ctx.moveTo(b, b - len);
          ctx.lineTo(b, b);
          ctx.lineTo(b - len, b);
          ctx.stroke();
          // Bottom-Left
          ctx.beginPath();
          ctx.moveTo(-b + len, b);
          ctx.lineTo(-b, b);
          ctx.lineTo(-b, b - len);
          ctx.stroke();

          ctx.restore();

          // Target tag floating above
          ctx.save();
          ctx.font = 'bold 9px monospace';
          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'center';
          const name =
            customNames?.get(blip.device.key) ||
            blip.device.name ||
            (blip.device.fleetIds.length > 0 ? fleetMap.get(blip.device.fleetIds[0])?.name : '') ||
            MacUtil.screenMac(blip.device.mac, demoMode);
          ctx.fillText(`LOCK: ${name} [${blip.estDistanceMeters}m]`, bx, by - 16);
          ctx.restore();
        } else if (isHovered) {
          // Hover ring
          ctx.save();
          ctx.beginPath();
          ctx.arc(bx, by, 9, 0, Math.PI * 2);
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();
        }
      });

      // 10. Center Operator Anchor
      ctx.save();
      ctx.beginPath();
      ctx.arc(center, center, 4, 0, Math.PI * 2);
      ctx.fillStyle = palette.primary;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(center, center, 8, 0, Math.PI * 2);
      ctx.strokeStyle = palette.primaryGlow;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [blips, lockedKey, hoveredKey, palette, sweepVelocity, audioPings, rangeScale, customNames, demoMode, fleetMap]);

  // Canvas Mouse & Touch Interaction
  const handleCanvasInteraction = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    // Find closest blip within hit radius
    let closest: TargetBlip | null = null;
    let minD = 22; // click tolerance in canvas pixels

    blips.forEach((b) => {
      const d = Math.hypot(mouseX - b.x, mouseY - b.y);
      if (d < minD) {
        minD = d;
        closest = b;
      }
    });

    if (e.type === 'click') {
      if (closest) {
        const key = (closest as TargetBlip).device.key;
        setLockedKey((prev) => (prev === key ? null : key));
      } else {
        // Click outside targets unlocks
        setLockedKey(null);
      }
    } else if (e.type === 'mousemove') {
      setHoveredKey(closest ? (closest as TargetBlip).device.key : null);
    }
  };

  const handleTouchInteraction = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touchX = (touch.clientX - rect.left) * scaleX;
    const touchY = (touch.clientY - rect.top) * scaleY;

    let closest: TargetBlip | null = null;
    let minD = 28;

    blips.forEach((b) => {
      const d = Math.hypot(touchX - b.x, touchY - b.y);
      if (d < minD) {
        minD = d;
        closest = b;
      }
    });

    if (closest) {
      const key = (closest as TargetBlip).device.key;
      setLockedKey(key);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center select-none font-mono text-xs space-y-3 pb-8">
      {/* 1. TOP RADAR HUD STATUS BAR */}
      <div className="w-full flex items-center justify-between px-3 py-2 bg-[#141A22] rounded-lg border border-[#2A3340] shadow-md">
        <div className="flex items-center gap-2">
          <Compass className={`w-4 h-4 ${nightMode ? 'text-[#FF3D5A]' : 'text-[#3DFF9A]'} animate-spin`} style={{ animationDuration: '10s' }} />
          <div>
            <div className="font-bold text-xs text-[#D5DCE3] flex items-center gap-1.5">
              <span>TACTICAL RF RADAR</span>
              <span className="text-[10px] px-1 rounded bg-[#1B232D] text-[#9AA6B2] border border-[#2A3340]">
                {blips.length} SIGNALS
              </span>
            </div>
            <div className="text-[10px] text-[#9AA6B2]">
              Polar sweep & proximity localization
            </div>
          </div>
        </div>

        {/* Quick controls on top right */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setAudioPings(!audioPings)}
            className={`p-1.5 rounded border transition-colors ${
              audioPings
                ? nightMode
                  ? 'bg-[#3A1212] text-[#FF5A5A] border-[#FF5A5A]'
                  : 'bg-[#163326] text-[#3DFF9A] border-[#3DFF9A]'
                : 'bg-[#1B232D] text-[#9AA6B2] border-[#2A3340]'
            }`}
            title={audioPings ? 'Audio chirp ping ON' : 'Audio ping MUTED'}
          >
            {audioPings ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setShowFiltersHud(!showFiltersHud)}
            className={`flex items-center gap-1 px-2 py-1.5 rounded border text-[11px] font-semibold transition-colors ${
              showFiltersHud
                ? 'bg-[#163326] text-[#3DFF9A] border-[#3DFF9A]'
                : 'bg-[#1B232D] text-[#9AA6B2] border-[#2A3340] hover:text-[#D5DCE3]'
            }`}
            title="Toggle radar filter overlay"
          >
            <Sliders className="w-3 h-3" />
            <span className="hidden sm:inline">Tune</span>
          </button>
        </div>
      </div>

      {/* 2. OPTIONAL COLLAPSIBLE RADAR FILTERS HUD */}
      {showFiltersHud && (
        <div className="w-full p-3 bg-[#141A22] rounded-lg border border-[#2A3340] space-y-2.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#2A3340]">
            <span className="font-bold text-[11px] text-[#9AA6B2] uppercase">
              RADAR HUD FILTER MATRIX
            </span>
            <button
              onClick={() => setShowFiltersHud(false)}
              className="p-1 text-[#9AA6B2] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setFilterWifi(!filterWifi)}
              className={`py-1.5 px-2 rounded border text-center font-semibold text-[11px] flex items-center justify-center gap-1.5 ${
                filterWifi
                  ? 'bg-[#0E2838] border-[#38BDF8] text-[#38BDF8]'
                  : 'bg-[#1B232D] border-[#2A3340] text-[#9AA6B2]'
              }`}
            >
              <Wifi className="w-3 h-3" />
              <span>Wi-Fi</span>
            </button>

            <button
              onClick={() => setFilterBle(!filterBle)}
              className={`py-1.5 px-2 rounded border text-center font-semibold text-[11px] flex items-center justify-center gap-1.5 ${
                filterBle
                  ? 'bg-[#163326] border-[#10E79D] text-[#10E79D]'
                  : 'bg-[#1B232D] border-[#2A3340] text-[#9AA6B2]'
              }`}
            >
              <Bluetooth className="w-3 h-3" />
              <span>BLE</span>
            </button>

            <button
              onClick={() => setFilterClassifiedOnly(!filterClassifiedOnly)}
              className={`py-1.5 px-2 rounded border text-center font-semibold text-[11px] flex items-center justify-center gap-1.5 ${
                filterClassifiedOnly
                  ? 'bg-[#3A2A12] border-[#FFB020] text-[#FFB020]'
                  : 'bg-[#1B232D] border-[#2A3340] text-[#9AA6B2]'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Classified</span>
            </button>
          </div>

          {/* Min RSSI cutoff */}
          <div>
            <div className="flex justify-between text-[10px] text-[#9AA6B2] mb-1">
              <span>CUTOFF SIGNAL STRENGTH</span>
              <span className="font-bold text-[#D5DCE3]">{filterMinRssi} dBm</span>
            </div>
            <input
              type="range"
              min={-100}
              max={-45}
              step={1}
              value={filterMinRssi}
              onChange={(e) => setFilterMinRssi(Number(e.target.value))}
              className="w-full accent-[#3DFF9A]"
            />
          </div>
        </div>
      )}

      {/* 3. RADAR DISPLAY CANVAS CONTAINER */}
      <div className="relative flex flex-col items-center">
        {/* Glow ambient border ring */}
        <div
          className={`relative rounded-full p-1.5 bg-[#0C1118] border transition-shadow ${
            nightMode
              ? 'border-[#FF3D5A]/40 shadow-[0_0_35px_rgba(255,61,90,0.18)]'
              : 'border-[#10E79D]/40 shadow-[0_0_35px_rgba(16,231,157,0.18)]'
          }`}
        >
          <canvas
            ref={canvasRef}
            width={380}
            height={380}
            onClick={handleCanvasInteraction}
            onMouseMove={handleCanvasInteraction}
            onMouseLeave={() => setHoveredKey(null)}
            onTouchStart={handleTouchInteraction}
            className="rounded-full cursor-crosshair block touch-none"
          />

          {/* Top Compass Heading Badge */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-[#0B0F14]/90 border border-[#2A3340] px-2 py-0.5 rounded text-[9px] text-[#9AA6B2] font-mono pointer-events-none flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF3D5A] animate-ping" />
            <span>000° NORTH</span>
          </div>
        </div>
      </div>

      {/* 4. RADAR STATION CONTROL DOCK (Range Scale & Sweep Velocity) */}
      <div className="w-full grid grid-cols-2 gap-2 bg-[#141A22] p-2.5 rounded-lg border border-[#2A3340]">
        {/* Range Scale */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-[#9AA6B2] uppercase block">
            RANGE CALIBRATION
          </span>
          <div className="grid grid-cols-3 gap-1">
            {[
              { id: 'CLOSE_10M', label: '10m', title: 'Close Range Sweep' },
              { id: 'LOCAL_25M', label: '25m', title: 'Local Tactical Sweep' },
              { id: 'PERIMETER_50M', label: '50m', title: 'Perimeter Scan' },
            ].map((scale) => (
              <button
                key={scale.id}
                onClick={() => setRangeScale(scale.id as RangeScale)}
                className={`py-1 rounded text-[10px] font-bold border transition-colors ${
                  rangeScale === scale.id
                    ? nightMode
                      ? 'bg-[#3A1212] border-[#FF3D5A] text-[#FF5A5A]'
                      : 'bg-[#163326] border-[#3DFF9A] text-[#3DFF9A]'
                    : 'bg-[#1B232D] border-[#2A3340] text-[#9AA6B2] hover:text-[#D5DCE3]'
                }`}
                title={scale.title}
              >
                {scale.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sweep Velocity */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-[#9AA6B2] uppercase block">
            SWEEP VELOCITY
          </span>
          <div className="grid grid-cols-3 gap-1">
            {[
              { id: 'SLOW', label: '6s', title: 'Slow High-Precision' },
              { id: 'NORMAL', label: '3s', title: 'Standard Tactical' },
              { id: 'FAST', label: '1.5s', title: 'Fast Intercept' },
            ].map((spd) => (
              <button
                key={spd.id}
                onClick={() => setSweepSpeed(spd.id as SweepSpeed)}
                className={`py-1 rounded text-[10px] font-bold border transition-colors ${
                  sweepSpeed === spd.id
                    ? nightMode
                      ? 'bg-[#3A1212] border-[#FF3D5A] text-[#FF5A5A]'
                      : 'bg-[#163326] border-[#3DFF9A] text-[#3DFF9A]'
                    : 'bg-[#1B232D] border-[#2A3340] text-[#9AA6B2] hover:text-[#D5DCE3]'
                }`}
                title={spd.title}
              >
                {spd.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5. TACTICAL PROXIMITY CONGESTION BAR */}
      <div className="w-full flex items-center justify-between px-3 py-1.5 bg-[#141A22] rounded-lg border border-[#2A3340] text-[11px]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[#D5DCE3]">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
            <span>Wi-Fi ({blips.filter((b) => b.device.kind === 'WIFI').length})</span>
          </span>
          <span className="flex items-center gap-1.5 text-[#D5DCE3]">
            <span className="w-2 h-2 rounded-full bg-[#10E79D]" />
            <span>BLE ({blips.filter((b) => b.device.kind === 'BLE').length})</span>
          </span>
          <span className="flex items-center gap-1.5 text-[#FFB020]">
            <span className="w-2 h-2 rounded-full bg-[#FFB020]" />
            <span>Classified ({classifiedCount})</span>
          </span>
        </div>

        {immediateCount > 0 && (
          <span className="flex items-center gap-1 text-[#FF3D5A] font-bold animate-pulse text-[10px]">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{immediateCount} IMMEDIATE PROXIMITY</span>
          </span>
        )}
      </div>

      {/* 6. INTERACTIVE TARGET HUD LOCK-ON CARD (When user taps/clicks a target) */}
      {lockedDevice && (
        <div className="w-full bg-[#141A22] rounded-xl border border-[#3DFF9A] p-3.5 space-y-3 shadow-2xl animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start justify-between gap-2 border-b border-[#2A3340] pb-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#163326] text-[#3DFF9A] border border-[#3DFF9A]/40 font-bold flex items-center gap-1">
                  <Crosshair className="w-3 h-3" />
                  <span>TARGET LOCKED</span>
                </span>
                <span className="text-xs font-bold text-[#F1F5F9] truncate max-w-[200px]">
                  {customNames?.get(lockedDevice.key) ||
                    lockedDevice.name ||
                    (lockedDevice.fleetIds.length > 0
                      ? fleetMap.get(lockedDevice.fleetIds[0])?.name
                      : '') ||
                    MacUtil.screenMac(lockedDevice.mac, demoMode)}
                </span>
              </div>
              <p className="text-[10px] text-[#9AA6B2]">
                MAC: {MacUtil.screenMac(lockedDevice.mac, demoMode)} ·{' '}
                {lockedDevice.vendor || 'Unknown Vendor'}
              </p>
            </div>

            <button
              onClick={() => setLockedKey(null)}
              className="p-1 text-[#9AA6B2] hover:text-white rounded bg-[#1B232D] border border-[#2A3340]"
              title="Unlock target"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Metrics row */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded bg-[#1B232D] border border-[#2A3340]">
              <span className="text-[9px] text-[#9AA6B2] block">SIGNAL (RSSI)</span>
              <span className="text-sm font-black text-[#10E79D]">
                {lockedDevice.rssi} dBm
              </span>
            </div>

            <div className="p-2 rounded bg-[#1B232D] border border-[#2A3340]">
              <span className="text-[9px] text-[#9AA6B2] block">EST. DISTANCE</span>
              <span className="text-sm font-black text-[#38BDF8]">
                ~{estimateDistance(lockedDevice.rssi, lockedDevice.kind).meters}m
              </span>
            </div>

            <div className="p-2 rounded bg-[#1B232D] border border-[#2A3340]">
              <span className="text-[9px] text-[#9AA6B2] block">BEARING</span>
              <span className="text-sm font-black text-[#FFB020]">
                {lockedDevice.bearingDeg !== undefined ? `${lockedDevice.bearingDeg}°` : '310°'}
              </span>
            </div>
          </div>

          {/* Sparkline & History */}
          <div className="flex items-center justify-between px-2 py-1.5 rounded bg-[#0B0F14] border border-[#2A3340]">
            <span className="text-[10px] text-[#9AA6B2]">LIVE SIGNAL HISTORY</span>
            <Sparkline
              history={lockedDevice.rssiHistory}
              width={140}
              height={22}
              color={nightMode ? '#FF3D5A' : '#10E79D'}
            />
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {onHuntDevice && (
              <button
                onClick={() => onHuntDevice(lockedDevice)}
                className="py-2 px-1 rounded bg-[#FF3D5A] hover:bg-[#FF5A72] text-white font-bold flex items-center justify-center gap-1 text-[11px] shadow"
              >
                <Crosshair className="w-3.5 h-3.5" />
                <span>Hunt Mode</span>
              </button>
            )}

            {onSelectDevice && (
              <button
                onClick={() => onSelectDevice(lockedDevice)}
                className="py-2 px-1 rounded bg-[#1B232D] hover:bg-[#2A3340] border border-[#2A3340] text-[#D5DCE3] font-bold flex items-center justify-center gap-1 text-[11px]"
              >
                <Info className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Details</span>
              </button>
            )}

            {onToggleWatchlist && (
              <button
                onClick={() => onToggleWatchlist(lockedDevice)}
                className={`py-2 px-1 rounded border font-bold flex items-center justify-center gap-1 text-[11px] ${
                  isWatchedKey?.(lockedDevice.key)
                    ? 'bg-[#FFB020]/20 text-[#FFB020] border-[#FFB020]'
                    : 'bg-[#1B232D] hover:bg-[#2A3340] border-[#2A3340] text-[#D5DCE3]'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isWatchedKey?.(lockedDevice.key) ? 'Watched' : 'Watch'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
