import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sighting,
  Fleet,
  FilterState,
  WatchTarget,
  Sit,
  GpsSample,
  AppSettings,
  ViewMode,
  StrengthSort,
  ListSort,
  ListLine,
  MatchRule,
} from './types';
import { scannerService, INITIAL_FLEETS, type ScanStatus } from './domain/scannerService';
import { audioService } from './domain/audioService';
import { GpsService } from './domain/gpsService';
import { isNative } from './domain/rfScanner';
import { Header } from './components/Header';
import { BottomNav, AppRoute } from './components/BottomNav';
import { DisclaimerModal } from './components/DisclaimerModal';

import { LiveScreen } from './screens/LiveScreen';
import { HuntScreen } from './screens/HuntScreen';
import { FiltersScreen } from './screens/FiltersScreen';
import { FleetsScreen } from './screens/FleetsScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { DeviceDetailScreen } from './screens/DeviceDetailScreen';
import { AlertTriangle, MapPinOff, BluetoothOff, ShieldAlert, Info } from 'lucide-react';

const DEFAULT_SETTINGS: AppSettings = {
  nightMode: false,
  demoMode: false,
  tagLocation: true,
  alertBeep: true,
  alertVoice: true,
  alertVoiceWhat: 'BOTH',
  intensity: 'BALANCED',
  keepScreenOn: true,
  viewMode: 'RADAR',
  strengthSort: 'STRONGEST_FIRST',
  listSort: 'RSSI_DESC',
  titleLine: 'NAME',
  subtitleLine: 'MAC',
  radarRangeMeters: 25,
  radarSweepSpeed: 'NORMAL',
  radarAudioPing: true,
};

const DEFAULT_FILTER: FilterState = {
  kinds: ['WIFI', 'BLE'],
  minRssi: -95,
  classes: [],
  searchQuery: '',
  classifiedOnly: false,
  watchlistOnly: false,
};

export const App: React.FC = () => {
  // Navigation
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('LIVE');
  const [selectedDevice, setSelectedDevice] = useState<Sighting | null>(null);
  const [huntTarget, setHuntTarget] = useState<Sighting | null>(null);

  // Disclaimer Modal
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean>(() => {
    return localStorage.getItem('fieldwatch_disclaimer_accepted') === 'true';
  });

  // Data Stores
  const [devices, setDevices] = useState<Sighting[]>([]);
  const [scanStatus, setScanStatus] = useState<ScanStatus>('OK');
  const [fleets, setFleets] = useState<Fleet[]>(() => {
    try {
      const saved = localStorage.getItem('fieldwatch_fleets');
      if (!saved) return INITIAL_FLEETS;
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_FLEETS;
      return parsed.map((f: Fleet) => ({
        ...f,
        rules: Array.isArray(f.rules)
          ? f.rules.filter((r) => r && typeof r.pattern === 'string')
          : [],
      }));
    } catch {
      return INITIAL_FLEETS;
    }
  });
  const [watchlist, setWatchlist] = useState<WatchTarget[]>(() => {
    try {
      const saved = localStorage.getItem('fieldwatch_watchlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [sits, setSits] = useState<Sit[]>(() => {
    try {
      const saved = localStorage.getItem('fieldwatch_sits');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('fieldwatch_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [filterState, setFilterState] = useState<FilterState>(DEFAULT_FILTER);

  // GPS Tracking
  const [operatorPath, setOperatorPath] = useState<GpsSample[]>(() =>
    GpsService.generateMockTrack(37.7749, -122.4194, 8)
  );

  // Persist State
  useEffect(() => {
    localStorage.setItem('fieldwatch_fleets', JSON.stringify(fleets));
    scannerService.setFleets(fleets);
  }, [fleets]);

  useEffect(() => {
    localStorage.setItem('fieldwatch_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    localStorage.setItem('fieldwatch_sits', JSON.stringify(sits));
  }, [sits]);

  useEffect(() => {
    localStorage.setItem('fieldwatch_settings', JSON.stringify(settings));
  }, [settings]);

  // Scanner status subscription
  useEffect(() => {
    const unsub = scannerService.subscribeStatus((status) => {
      setScanStatus(status);
    });
    return unsub;
  }, []);

  // Connect scanner service mode
  useEffect(() => {
    scannerService.setMode(settings.demoMode);
    const unsubscribe = scannerService.subscribe((devs) => {
      setDevices(devs);
    });

    return () => {
      unsubscribe();
      scannerService.stop();
    };
  }, [settings.demoMode, settings.intensity]);

  // Real Operator GPS Tracking
  useEffect(() => {
    if (!settings.tagLocation) return;

    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const sample: GpsSample = {
            timestampMs: Date.now(),
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracyMeters: pos.coords.accuracy || 10,
          };
          setOperatorPath((prev) => [...prev.slice(-120), sample]);
        },
        (err) => {
          console.warn('Geolocation unavailable:', err.message);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [settings.tagLocation]);

  // Alert on priority threats
  const watchlistKeys = useMemo(
    () => new Set(watchlist.map((w) => w.deviceKey)),
    [watchlist]
  );

  const alertedDevicesRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!settings.alertBeep && !settings.alertVoice) return;

    devices.forEach((dev) => {
      if (!alertedDevicesRef.current.has(dev.key)) {
        const isWatched = watchlistKeys.has(dev.key);
        const isThreat =
          dev.matchedClass === 'SURVEILLANCE' ||
          dev.matchedClass === 'DRONE_UAV' ||
          dev.matchedClass === 'POLICE_EMERGENCY';

        if (isWatched || isThreat) {
          alertedDevicesRef.current.add(dev.key);
          if (settings.alertBeep) {
            audioService.playTacticalAlert(isWatched ? 'WATCHLIST' : 'CLASSIFIED');
          }
          if (settings.alertVoice) {
            const name = dev.ssid || dev.name || 'Target';
            const label = isWatched ? `Watchlist contact ${name}` : `${dev.matchedClass} detected`;
            audioService.speakTactical(label);
          }
        }
      }
    });
  }, [devices, watchlistKeys, settings.alertBeep, settings.alertVoice]);

  // Filter devices
  const filteredDevices = useMemo(() => {
    return devices.filter((dev) => {
      if (!filterState.kinds.includes(dev.kind)) return false;
      if (dev.rssi < filterState.minRssi) return false;
      if (filterState.classes.length > 0) {
        if (!dev.matchedClass || !filterState.classes.includes(dev.matchedClass)) return false;
      }
      if (filterState.classifiedOnly && (!dev.matchedClass || dev.matchedClass === 'UNKNOWN')) {
        return false;
      }
      if (filterState.watchlistOnly && !watchlistKeys.has(dev.key)) {
        return false;
      }
      if (filterState.searchQuery.trim()) {
        const q = filterState.searchQuery.toLowerCase();
        const matchesMac = (dev.mac || '').toLowerCase().includes(q);
        const matchesName = (dev.ssid || dev.name || '').toLowerCase().includes(q);
        const matchesVendor = (dev.ouiVendor || '').toLowerCase().includes(q);
        if (!matchesMac && !matchesName && !matchesVendor) return false;
      }
      return true;
    });
  }, [devices, filterState, watchlistKeys]);

  // Threat count for top banner
  const threatCount = useMemo(() => {
    return filteredDevices.filter(
      (d) =>
        d.matchedClass === 'SURVEILLANCE' ||
        d.matchedClass === 'DRONE_UAV' ||
        d.matchedClass === 'POLICE_EMERGENCY' ||
        watchlistKeys.has(d.key)
    ).length;
  }, [filteredDevices, watchlistKeys]);

  // Snapshot Situation Report
  const handleSnapshotSit = useCallback(() => {
    const sit: Sit = {
      id: `SIT-${Date.now().toString().slice(-6)}`,
      title: `Tactical RF Fix (${filteredDevices.length} contacts)`,
      createdAtMs: Date.now(),
      sightings: filteredDevices.map((d) => ({ ...d })),
      operatorPath: [...operatorPath],
      durationSec: 120,
    };
    setSits((prev) => [sit, ...prev]);
    audioService.playTacticalAlert('CLASSIFIED');
    setCurrentRoute('REPORTS');
  }, [filteredDevices, operatorPath]);

  // Watchlist toggle handler
  const handleToggleWatch = useCallback((device: Sighting) => {
    setWatchlist((prev) => {
      const exists = prev.some((w) => w.deviceKey === device.key);
      if (exists) {
        return prev.filter((w) => w.deviceKey !== device.key);
      } else {
        return [
          ...prev,
          {
            deviceKey: device.key,
            addedMs: Date.now(),
            customName: device.ssid || device.name,
          },
        ];
      }
    });
  }, []);

  // Fleets handlers
  const handleToggleFleet = (id: string) => {
    setFleets((prev) =>
      prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f))
    );
  };

  const handleAddRule = (fleetId: string, rule: MatchRule) => {
    setFleets((prev) =>
      prev.map((f) => (f.id === fleetId ? { ...f, rules: [...f.rules, rule] } : f))
    );
  };

  const handleDeleteRule = (fleetId: string, ruleId: string) => {
    setFleets((prev) =>
      prev.map((f) =>
        f.id === fleetId ? { ...f, rules: f.rules.filter((r) => r.id !== ruleId) } : f
      )
    );
  };

  const handleAcceptDisclaimer = () => {
    localStorage.setItem('fieldwatch_disclaimer_accepted', 'true');
    setHasAcceptedTerms(true);
  };

  return (
    <div className={`min-h-screen bg-[#0B0F14] text-[#D5DCE3] pb-20 ${settings.nightMode ? 'night-vision' : ''}`}>
      {/* Disclaimer on first launch */}
      {!hasAcceptedTerms && (
        <DisclaimerModal onAccept={handleAcceptDisclaimer} nightMode={settings.nightMode} />
      )}

      {/* Main Tactical Header */}
      <Header
        nightMode={settings.nightMode}
        onToggleNightMode={() => setSettings((s) => ({ ...s, nightMode: !s.nightMode }))}
        gpsActive={settings.tagLocation}
        totalDevices={devices.length}
        threatCount={threatCount}
        onSnapshotSit={handleSnapshotSit}
      />

      {/* Hardware Warning Banners */}
      {!settings.demoMode && scanStatus !== 'OK' && (
        <div className="w-full max-w-2xl mx-auto px-3 pt-2">
          {scanStatus === 'PERMISSION_DENIED' && (
            <div className="flex items-center gap-2.5 p-2.5 bg-rose-950/80 border border-rose-500/70 rounded-lg text-rose-200 text-xs font-mono">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong>Permissions Required:</strong> Location & Nearby Devices permissions are required to scan live Wi-Fi and Bluetooth emitters.
              </span>
            </div>
          )}

          {scanStatus === 'LOCATION_OFF' && (
            <div className="flex items-center gap-2.5 p-2.5 bg-amber-950/80 border border-amber-500/70 rounded-lg text-amber-200 text-xs font-mono">
              <MapPinOff className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Location Service Off:</strong> Android requires system Location to be turned ON to return nearby Wi-Fi APs.
              </span>
            </div>
          )}

          {scanStatus === 'BLUETOOTH_OFF' && (
            <div className="flex items-center gap-2.5 p-2.5 bg-sky-950/80 border border-sky-500/70 rounded-lg text-sky-200 text-xs font-mono">
              <BluetoothOff className="w-4 h-4 text-sky-400 shrink-0" />
              <span>
                <strong>Bluetooth Disabled:</strong> Turn on Bluetooth on your device to intercept BLE tags and beacons.
              </span>
            </div>
          )}

          {scanStatus === 'FALLBACK_DEMO' && (
            <div className="flex items-center gap-2.5 p-2.5 bg-purple-950/80 border border-purple-500/70 rounded-lg text-purple-200 text-xs font-mono">
              <Info className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                <strong>Browser Preview:</strong> Native radio hardware is only available on Android. Displaying simulated RF signals.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Main Route Content */}
      <main className="w-full">
        {currentRoute === 'LIVE' && (
          <LiveScreen
            devices={filteredDevices}
            fleets={fleets}
            viewMode={settings.viewMode}
            onChangeViewMode={(m) => setSettings((s) => ({ ...s, viewMode: m }))}
            sortMode={settings.strengthSort}
            listSort={settings.listSort}
            titleLine={settings.titleLine}
            subtitleLine={settings.subtitleLine}
            showBar={true}
            showFleet={true}
            showFrequency={true}
            watchlistKeys={watchlistKeys}
            nightMode={settings.nightMode}
            onSelectDevice={(dev) => {
              setSelectedDevice(dev);
              setCurrentRoute('DETAIL');
            }}
            onHuntDevice={(dev) => {
              setHuntTarget(dev);
              setCurrentRoute('HUNT');
            }}
            onToggleWatch={handleToggleWatch}
          />
        )}

        {currentRoute === 'HUNT' && (
          <HuntScreen
            devices={filteredDevices}
            activeTarget={huntTarget}
            onSelectTarget={(dev) => setHuntTarget(dev)}
            nightMode={settings.nightMode}
          />
        )}

        {currentRoute === 'FILTERS' && (
          <FiltersScreen
            filter={filterState}
            onChangeFilter={setFilterState}
            fleets={fleets}
            nightMode={settings.nightMode}
          />
        )}

        {currentRoute === 'FLEETS' && (
          <FleetsScreen
            fleets={fleets}
            onToggleFleet={handleToggleFleet}
            onAddRule={handleAddRule}
            onDeleteRule={handleDeleteRule}
            nightMode={settings.nightMode}
          />
        )}

        {currentRoute === 'REPORTS' && (
          <ReportsScreen
            sits={sits}
            currentSightings={devices}
            fleets={fleets}
            onDeleteSit={(id) => setSits((prev) => prev.filter((s) => s.id !== id))}
            nightMode={settings.nightMode}
          />
        )}

        {currentRoute === 'SETTINGS' && (
          <SettingsScreen
            settings={settings}
            onChangeSettings={setSettings}
            onClearData={() => {
              setSits([]);
              setWatchlist([]);
              scannerService.clear();
            }}
            nightMode={settings.nightMode}
          />
        )}

        {currentRoute === 'DETAIL' && selectedDevice && (
          <DeviceDetailScreen
            device={selectedDevice}
            onBack={() => setCurrentRoute('LIVE')}
            onHunt={(dev) => {
              setHuntTarget(dev);
              setCurrentRoute('HUNT');
            }}
            onToggleWatch={handleToggleWatch}
            isWatched={watchlistKeys.has(selectedDevice.key)}
            nightMode={settings.nightMode}
          />
        )}
      </main>

      {/* Bottom Tactical Navigation Dock */}
      <BottomNav
        currentRoute={currentRoute}
        onChangeRoute={setCurrentRoute}
        nightMode={settings.nightMode}
        activeTargetKey={huntTarget?.key}
      />
    </div>
  );
};
export default App;
