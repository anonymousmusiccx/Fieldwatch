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
import { scannerService, INITIAL_FLEETS } from './domain/scannerService';
import { audioService } from './domain/audioService';
import { GpsService } from './domain/gpsService';
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

  // GPS Simulation / Tracking
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

  // Connect scanner service
  useEffect(() => {
    scannerService.start(settings.intensity === 'AGGRESSIVE' ? 800 : settings.intensity === 'PASSIVE' ? 2000 : 1200);
    const unsubscribe = scannerService.subscribe((devs) => {
      setDevices(devs);
    });

    return () => {
      unsubscribe();
      scannerService.stop();
    };
  }, [settings.intensity]);

  // Alert on priority threats
  const watchlistKeys = useMemo(
    () => new Set(watchlist.map((w) => w.deviceKey)),
    [watchlist]
  );

  // Keep track of previously alerted devices to avoid repetition
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
      // Kind
      if (!filterState.kinds.includes(dev.kind)) return false;
      // RSSI Cutoff
      if (dev.rssi < filterState.minRssi) return false;
      // Match Class
      if (filterState.classes.length > 0) {
        if (!dev.matchedClass || !filterState.classes.includes(dev.matchedClass)) return false;
      }
      // Classified only
      if (filterState.classifiedOnly && (!dev.matchedClass || dev.matchedClass === 'UNKNOWN')) {
        return false;
      }
      // Watchlist only
      if (filterState.watchlistOnly && !watchlistKeys.has(dev.key)) {
        return false;
      }
      // Search text
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

  // Accept Disclaimer
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
