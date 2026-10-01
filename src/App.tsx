import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Sighting,
  Fleet,
  FilterState,
  FilterPreset,
  WatchTarget,
  Sit,
  GpsSample,
  AppSettings,
  CandidateSignature,
  ViewMode,
  StrengthSort,
  ListSort,
  ListLine,
} from './types';
import { STOCK_FLEETS } from './domain/defaultCatalog';
import { scannerService } from './domain/scannerService';
import { sitStore } from './domain/sitStore';
import { audioService } from './domain/audioService';
import { filterSightings } from './domain/filterEngine';
import { GpsService } from './domain/gpsService';

import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { LiveSessionBar } from './components/LiveSessionBar';
import { ViewPicker } from './components/ViewPicker';
import { DisclaimerModal } from './components/DisclaimerModal';

import { LiveScreen } from './screens/LiveScreen';
import { FiltersScreen } from './screens/FiltersScreen';
import { FleetsScreen } from './screens/FleetsScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { DeviceDetailScreen } from './screens/DeviceDetailScreen';
import { HuntScreen } from './screens/HuntScreen';
import { CandidatesScreen } from './screens/CandidatesScreen';
import { RadioBookmarksScreen } from './screens/RadioBookmarksScreen';

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
  strengthSort: 'INSTANT',
  listSort: 'STRENGTH',
  averageWindowSec: 15,
  decaySec: 60,
  showRssiBar: true,
  showFleetName: true,
  showFrequency: true,
  showSeenTimes: true,
  listTitleLine: 'ADVERTISED_NAME',
  listSubtitleLine: 'NAME_AND_TYPE',
  disclaimerAccepted: true,
};

const DEFAULT_FILTER: FilterState = {
  showWifi: true,
  showBle: true,
  rssiMin: -100,
  namedOnly: false,
  customNamesOnly: false,
  watchedOnly: false,
  hideFastPairAccountKey: false,
  movingWithYou: false,
  arrivalsOnly: false,
  nameQuery: '',
  ouiQuery: '',
  useClassFilter: false,
  excludeClasses: false,
  classes: [],
  useFleetFilter: false,
  excludeSignatures: false,
  fleetIds: [],
  includeSignatures: false,
  includeFleetIds: [],
};

export const App: React.FC = () => {
  // Navigation
  const [currentRoute, setCurrentRoute] = useState<string>('LIVE');
  const [selectedDevice, setSelectedDevice] = useState<Sighting | null>(null);

  // Core State
  const [devices, setDevices] = useState<Sighting[]>([]);
  const [fleets, setFleets] = useState<Fleet[]>(() => {
    try {
      const saved = localStorage.getItem('fieldwatch_fleets');
      return saved ? JSON.parse(saved) : STOCK_FLEETS;
    } catch {
      return STOCK_FLEETS;
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
  const [presets, setPresets] = useState<FilterPreset[]>([
    { id: 'preset-all', name: 'All Traffic', filter: DEFAULT_FILTER },
    {
      id: 'preset-wifi',
      name: 'Wi-Fi Only',
      filter: { ...DEFAULT_FILTER, showBle: false, showWifi: true },
    },
    {
      id: 'preset-ble',
      name: 'BLE Only',
      filter: { ...DEFAULT_FILTER, showBle: true, showWifi: false },
    },
    {
      id: 'preset-surv',
      name: 'Surveillance & Law',
      filter: {
        ...DEFAULT_FILTER,
        useClassFilter: true,
        classes: ['SURVEILLANCE', 'BODYWORN', 'LAW_ENFORCEMENT', 'DRONE'],
      },
    },
  ]);

  const [watchlist, setWatchlist] = useState<WatchTarget[]>(() => {
    try {
      const saved = localStorage.getItem('fieldwatch_watchlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [customNames, setCustomNames] = useState<Map<string, string>>(() => {
    try {
      const saved = localStorage.getItem('fieldwatch_custom_names');
      return saved ? new Map(JSON.parse(saved)) : new Map();
    } catch {
      return new Map();
    }
  });

  // Operational State
  const [isPaused, setIsPaused] = useState(false);
  const [isViewPickerOpen, setIsViewPickerOpen] = useState(false);
  const [arrivalsSeen, setArrivalsSeen] = useState<Set<string>>(new Set());
  const [movingWithYouActive, setMovingWithYouActive] = useState(false);
  const [huntBeep, setHuntBeep] = useState(true);
  const [huntVibrate, setHuntVibrate] = useState(true);
  const [activeSit, setActiveSit] = useState<Sit | null>(sitStore.getActiveSit());
  const [operatorPath, setOperatorPath] = useState<GpsSample[]>([]);
  const [showDisclaimer, setShowDisclaimer] = useState(!settings.disclaimerAccepted);

  // Synchronize fleets with scanner
  useEffect(() => {
    scannerService.setFleets(fleets);
    localStorage.setItem('fieldwatch_fleets', JSON.stringify(fleets));
  }, [fleets]);

  // Persist settings
  useEffect(() => {
    localStorage.setItem('fieldwatch_settings', JSON.stringify(settings));
  }, [settings]);

  // Persist watchlist
  useEffect(() => {
    localStorage.setItem('fieldwatch_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  // Start Scanner Engine
  useEffect(() => {
    const handleSightings = (sightings: Sighting[], newKeys: string[]) => {
      setDevices([...sightings]);

      // If active Sit recording, stream into sit store
      if (sitStore.getActiveSit()) {
        sitStore.updateCurrentSit(sightings, operatorPath);
      }

      // Check watchlist and signature alerts on new arrivals
      if (newKeys.length > 0 && settings.alertBeep) {
        const fleetMap = new Map(fleets.map((f) => [f.id, f]));
        const watchedKeys = new Set(watchlist.filter((w) => w.alert).map((w) => w.deviceKey));

        for (const k of newKeys) {
          const dev = sightings.find((s) => s.key === k);
          if (!dev) continue;

          if (watchedKeys.has(dev.key)) {
            audioService.playAlertBeep();
            if (settings.alertVoice) {
              const label = customNames.get(dev.key) || dev.name || 'Watch target';
              audioService.speakWatchlistAlert('Target Sighted', label, settings.alertVoiceWhat);
            }
            break;
          }

          if (dev.fleetIds.length > 0) {
            const firstFleet = fleetMap.get(dev.fleetIds[0]);
            if (firstFleet) {
              audioService.playAlertBeep();
              if (settings.alertVoice) {
                audioService.speakWatchlistAlert(
                  firstFleet.kind,
                  firstFleet.name,
                  settings.alertVoiceWhat
                );
              }
              break;
            }
          }
        }
      }
    };

    scannerService.start(handleSightings, 1200);
    return () => {
      scannerService.stop();
    };
  }, [fleets, watchlist, settings.alertBeep, settings.alertVoice, settings.alertVoiceWhat, customNames, operatorPath]);

  // Geolocation updates
  useEffect(() => {
    if (!settings.tagLocation || typeof navigator === 'undefined' || !navigator.geolocation) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const sample: GpsSample = {
          at: Date.now(),
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          alt: pos.coords.altitude || undefined,
          accuracy: pos.coords.accuracy,
        };
        scannerService.setGpsLocation(sample.lat, sample.lon);
        setOperatorPath((prev) => {
          const next = [...prev, sample];
          if (next.length > 200) next.shift();
          return next;
        });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [settings.tagLocation]);

  // Handle Pause / Resume
  const handleTogglePause = useCallback(() => {
    if (isPaused) {
      scannerService.resume();
      setIsPaused(false);
    } else {
      scannerService.pause();
      setIsPaused(true);
    }
  }, [isPaused]);

  // Mark all currently seen
  const handleMarkSeen = useCallback(() => {
    const keys = new Set(devices.map((d) => d.key));
    setArrivalsSeen(keys);
  }, [devices]);

  const handleResetSeen = useCallback(() => {
    setArrivalsSeen(new Set());
  }, []);

  // Filtered sightings
  const filteredSightings = useMemo(() => {
    let list = filterSightings(
      devices,
      filterState,
      fleets,
      customNames,
      watchlist,
      arrivalsSeen
    );

    // Moving with you filter (displaced transmitters)
    if (movingWithYouActive && operatorPath.length > 2) {
      const span = GpsService.calculatePathSpan(operatorPath);
      if (span > 30) {
        list = list.filter((d) => d.hitCount > 3);
      }
    }

    // Sort order
    if (settings.listSort === 'STRENGTH') {
      list.sort((a, b) => b.rssi - a.rssi);
    } else if (settings.listSort === 'NEWEST') {
      list.sort((a, b) => b.lastSeen - a.lastSeen);
    } else if (settings.listSort === 'FIRST_SEEN') {
      list.sort((a, b) => a.firstSeen - b.firstSeen);
    } else if (settings.listSort === 'NAME') {
      list.sort((a, b) => (a.name || a.mac).localeCompare(b.name || b.mac));
    } else if (settings.listSort === 'SIGNATURES') {
      list.sort((a, b) => b.fleetIds.length - a.fleetIds.length);
    }

    return list;
  }, [devices, filterState, fleets, customNames, watchlist, arrivalsSeen, movingWithYouActive, operatorPath, settings.listSort]);

  // Candidate Signatures (Repeated unclassified sightings)
  const candidateSignatures = useMemo<CandidateSignature[]>(() => {
    const unclassified = devices.filter((d) => d.fleetIds.length === 0 && d.hitCount >= 2);
    const groups = new Map<string, { count: number; dev: Sighting }>();

    for (const dev of unclassified) {
      const ouiPrefix = dev.mac.substring(0, 8).toUpperCase();
      const existing = groups.get(ouiPrefix);
      if (existing) {
        existing.count += dev.hitCount;
      } else {
        groups.set(ouiPrefix, { count: dev.hitCount, dev });
      }
    }

    const res: CandidateSignature[] = [];
    for (const [oui, { count, dev }] of groups.entries()) {
      res.push({
        id: `cand-${oui}`,
        name: dev.vendor ? `${dev.vendor} Radio` : `Device ${oui}`,
        kind: dev.kind === 'WIFI' ? 'SURVEILLANCE' : 'WEARABLE',
        oui,
        occurrences: count,
        suggestedRules: [
          {
            kind: 'OUI',
            text: oui,
            enabled: true,
          },
        ],
      });
    }
    return res;
  }, [devices]);

  // Sits Management
  const handleStartSit = (name?: string) => {
    const sit = sitStore.startSit(name, devices);
    setActiveSit(sit);
  };

  const handlePauseSit = () => {
    sitStore.pauseSit();
    setActiveSit(null);
  };

  const handleRenameSit = (id: string, name: string) => {
    sitStore.renameSit(id, name);
  };

  // Watchlist Actions
  const handleToggleWatch = (device: Sighting) => {
    const existing = watchlist.find((w) => w.deviceKey === device.key);
    if (existing) {
      const next = watchlist.filter((w) => w.deviceKey !== device.key);
      setWatchlist(next);
    } else {
      const next: WatchTarget[] = [
        ...watchlist,
        {
          id: `watch-${Date.now()}`,
          deviceKey: device.key,
          label: customNames.get(device.key) || device.name || device.mac,
          alert: true,
        },
      ];
      setWatchlist(next);
    }
  };

  const handleSaveCustomName = (macKey: string, name: string, notes: string) => {
    const updated = new Map(customNames);
    if (name.trim()) {
      updated.set(macKey, name.trim());
    } else {
      updated.delete(macKey);
    }
    setCustomNames(updated);
    localStorage.setItem(
      'fieldwatch_custom_names',
      JSON.stringify(Array.from(updated.entries()))
    );

    // Update observer notes in watchlist if exists
    if (notes.trim()) {
      setWatchlist((prev) =>
        prev.map((w) => (w.deviceKey === macKey ? { ...w, observerNotes: notes.trim() } : w))
      );
    }
  };

  const handleAcceptDisclaimer = () => {
    const next = { ...settings, disclaimerAccepted: true };
    setSettings(next);
    setShowDisclaimer(false);
  };

  const wifiCount = devices.filter((d) => d.kind === 'WIFI').length;
  const bleCount = devices.filter((d) => d.kind === 'BLE').length;
  const signatureCount = devices.filter((d) => d.fleetIds.length > 0).length;

  return (
    <div
      className={`min-h-screen text-[#D5DCE3] flex flex-col font-sans transition-colors ${
        settings.nightMode ? 'bg-[#0E0606] text-[#FFBABA]' : 'bg-[#0B0F14]'
      }`}
    >
      {/* Header */}
      <Header
        wifiCount={wifiCount}
        bleCount={bleCount}
        signatureCount={signatureCount}
        isPaused={isPaused}
        sitOpen={Boolean(activeSit)}
        sitName={activeSit?.name}
        onViewPicker={() => setIsViewPickerOpen(!isViewPickerOpen)}
        isViewPickerOpen={isViewPickerOpen}
        nightMode={settings.nightMode}
      />

      {/* View Tuning Drawer */}
      {isViewPickerOpen && (
        <ViewPicker
          mode={settings.viewMode}
          sort={settings.strengthSort}
          listSort={settings.listSort}
          windowSec={settings.averageWindowSec}
          decaySec={settings.decaySec}
          showRssiBar={settings.showRssiBar}
          showFleetName={settings.showFleetName}
          showFrequency={settings.showFrequency}
          showSeenTimes={settings.showSeenTimes}
          listTitleLine={settings.listTitleLine}
          listSubtitleLine={settings.listSubtitleLine}
          onChangeMode={(m: ViewMode) => setSettings({ ...settings, viewMode: m })}
          onChangeSort={(s: StrengthSort) => setSettings({ ...settings, strengthSort: s })}
          onChangeListSort={(s: ListSort) => setSettings({ ...settings, listSort: s })}
          onChangeWindowSec={(sec: number) => setSettings({ ...settings, averageWindowSec: sec })}
          onChangeDecaySec={(sec: number) => setSettings({ ...settings, decaySec: sec })}
          onToggleShowRssiBar={() =>
            setSettings({ ...settings, showRssiBar: !settings.showRssiBar })
          }
          onToggleShowFleetName={() =>
            setSettings({ ...settings, showFleetName: !settings.showFleetName })
          }
          onToggleShowFrequency={() =>
            setSettings({ ...settings, showFrequency: !settings.showFrequency })
          }
          onToggleShowSeenTimes={() =>
            setSettings({ ...settings, showSeenTimes: !settings.showSeenTimes })
          }
          onChangeTitleLine={(line: ListLine) =>
            setSettings({ ...settings, listTitleLine: line })
          }
          onChangeSubtitleLine={(line: ListLine) =>
            setSettings({ ...settings, listSubtitleLine: line })
          }
          onClose={() => setIsViewPickerOpen(false)}
          nightMode={settings.nightMode}
        />
      )}

      {/* Live Session Controls Sub-bar */}
      {currentRoute === 'LIVE' && (
        <LiveSessionBar
          arrivalsOnly={filterState.arrivalsOnly}
          movingWithYou={movingWithYouActive}
          operatorSpanM={GpsService.calculatePathSpan(operatorPath)}
          onMarkSeen={handleMarkSeen}
          onResetSeen={handleResetSeen}
          onToggleArrivals={() =>
            setFilterState({ ...filterState, arrivalsOnly: !filterState.arrivalsOnly })
          }
          onToggleMovingWithYou={() => setMovingWithYouActive(!movingWithYouActive)}
          nightMode={settings.nightMode}
        />
      )}

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {currentRoute === 'LIVE' && (
          <LiveScreen
            devices={filteredSightings}
            fleets={fleets}
            viewMode={settings.viewMode}
            sortMode={settings.strengthSort}
            listSort={settings.listSort}
            titleLine={settings.listTitleLine}
            subtitleLine={settings.listSubtitleLine}
            showBar={settings.showRssiBar}
            showFleet={settings.showFleetName}
            showFrequency={settings.showFrequency}
            showSeenTimes={settings.showSeenTimes}
            demoMode={settings.demoMode}
            nightMode={settings.nightMode}
            customNames={customNames}
            watchlistKeys={new Set(watchlist.map((w) => w.deviceKey || ''))}
            onChangeViewMode={(m) => setSettings((prev) => ({ ...prev, viewMode: m }))}
            onSelectDevice={(dev) => {
              setSelectedDevice(dev);
              setCurrentRoute('DETAIL');
            }}
            onHuntDevice={(dev) => {
              setSelectedDevice(dev);
              setCurrentRoute('HUNT');
            }}
            onToggleWatch={(dev) => {
              handleToggleWatch(dev);
            }}
          />
        )}

        {currentRoute === 'FILTERS' && (
          <FiltersScreen
            filter={filterState}
            onChangeFilter={setFilterState}
            fleets={fleets}
            presets={presets}
            onApplyPreset={(p) => setFilterState(p.filter)}
            onSavePreset={(name) =>
              setPresets((prev) => [
                ...prev,
                { id: `p-${Date.now()}`, name, filter: { ...filterState } },
              ])
            }
            onDeletePreset={(id) => setPresets((prev) => prev.filter((p) => p.id !== id))}
            onResetFilter={() => setFilterState(DEFAULT_FILTER)}
            nightMode={settings.nightMode}
          />
        )}

        {currentRoute === 'FLEETS' && (
          <FleetsScreen
            fleets={fleets}
            onToggleFleet={(id) =>
              setFleets((prev) =>
                prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f))
              )
            }
            onAddFleet={(f) => setFleets((prev) => [f, ...prev])}
            onUpdateFleet={(f) =>
              setFleets((prev) => prev.map((item) => (item.id === f.id ? f : item)))
            }
            onDeleteFleet={(id) => setFleets((prev) => prev.filter((item) => item.id !== id))}
            onResetFleets={() => setFleets(STOCK_FLEETS)}
            nightMode={settings.nightMode}
          />
        )}

        {currentRoute === 'REPORTS' && (
          <ReportsScreen
            devices={devices}
            fleets={fleets}
            demoMode={settings.demoMode}
            customNames={customNames}
            activeSit={activeSit}
            onStartSit={handleStartSit}
            onPauseSit={handlePauseSit}
            onRenameSit={handleRenameSit}
            onLoadLog={(text) => {
              try {
                if (text.startsWith('{') || text.includes('\n{')) {
                  const lines = text.trim().split('\n');
                  const parsed = lines.map((l) => JSON.parse(l));
                  scannerService.loadSightingsFromData(parsed);
                }
              } catch {}
            }}
            onOpenCandidates={() => setCurrentRoute('CANDIDATES')}
            nightMode={settings.nightMode}
          />
        )}

        {currentRoute === 'SETTINGS' && (
          <SettingsScreen
            settings={settings}
            onChangeSettings={setSettings}
            onOpenBookmarks={() => setCurrentRoute('BOOKMARKS')}
            onShowDisclaimer={() => setShowDisclaimer(true)}
            onExportSettings={() => {
              const blob = new Blob([JSON.stringify(settings, null, 2)], {
                type: 'application/json',
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `fieldwatch-settings-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            onImportSettings={(str) => {
              try {
                const parsed = JSON.parse(str);
                setSettings((prev) => ({ ...prev, ...parsed }));
              } catch {}
            }}
            nightMode={settings.nightMode}
          />
        )}

        {/* Modal-style Detail Screens */}
        {currentRoute === 'DETAIL' && selectedDevice && (
          <DeviceDetailScreen
            device={selectedDevice}
            fleets={fleets}
            isWatched={watchlist.some((w) => w.deviceKey === selectedDevice.key)}
            onBack={() => setCurrentRoute('LIVE')}
            onHunt={() => setCurrentRoute('HUNT')}
            onToggleWatch={() => handleToggleWatch(selectedDevice)}
            onCreateSignature={() => {
              setCurrentRoute('FLEETS');
            }}
            onSaveCustomName={(name, notes) =>
              handleSaveCustomName(selectedDevice.key, name, notes)
            }
            customName={customNames.get(selectedDevice.key)}
            observerNotes={
              watchlist.find((w) => w.deviceKey === selectedDevice.key)?.observerNotes
            }
            demoMode={settings.demoMode}
            nightMode={settings.nightMode}
          />
        )}

        {currentRoute === 'HUNT' && selectedDevice && (
          <HuntScreen
            device={selectedDevice}
            onBack={() => setCurrentRoute('DETAIL')}
            huntBeep={huntBeep}
            huntVibrate={huntVibrate}
            onToggleHuntBeep={() => setHuntBeep(!huntBeep)}
            demoMode={settings.demoMode}
            nightMode={settings.nightMode}
          />
        )}

        {currentRoute === 'CANDIDATES' && (
          <CandidatesScreen
            candidates={candidateSignatures}
            onBack={() => setCurrentRoute('REPORTS')}
            onCreateSignature={(c) => {
              const newFleet: Fleet = {
                id: `fleet-${Date.now()}`,
                name: c.name,
                enabled: true,
                matchAny: true,
                colorIndex: 0,
                rules: c.suggestedRules,
                notes: `Auto-generated from candidate OUI: ${c.oui}`,
                attentionNote: '',
                builtIn: false,
                kind: c.kind,
              };
              setFleets((prev) => [newFleet, ...prev]);
              setCurrentRoute('FLEETS');
            }}
            nightMode={settings.nightMode}
          />
        )}

        {currentRoute === 'BOOKMARKS' && (
          <RadioBookmarksScreen
            watchlist={watchlist}
            onBack={() => setCurrentRoute('SETTINGS')}
            onToggleAlert={(id) =>
              setWatchlist((prev) =>
                prev.map((w) => (w.id === id ? { ...w, alert: !w.alert } : w))
              )
            }
            onRemoveWatch={(id) => setWatchlist((prev) => prev.filter((w) => w.id !== id))}
            onUpdateWatch={(t) =>
              setWatchlist((prev) => prev.map((w) => (w.id === t.id ? t : w)))
            }
            onOpenDevice={(key) => {
              const found = devices.find((d) => d.key === key);
              if (found) {
                setSelectedDevice(found);
                setCurrentRoute('DETAIL');
              }
            }}
            nightMode={settings.nightMode}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        currentRoute={currentRoute}
        onChangeRoute={(r) => {
          setCurrentRoute(r);
          setIsViewPickerOpen(false);
        }}
        isPaused={isPaused}
        onTogglePause={handleTogglePause}
        activeFilterCount={
          (filterState.namedOnly ? 1 : 0) +
          (filterState.watchedOnly ? 1 : 0) +
          (filterState.useClassFilter && filterState.classes.length > 0 ? 1 : 0) +
          (filterState.nameQuery ? 1 : 0)
        }
        nightMode={settings.nightMode}
      />

      {/* Operational Disclaimer Modal */}
      {showDisclaimer && (
        <DisclaimerModal
          onAccept={handleAcceptDisclaimer}
          nightMode={settings.nightMode}
        />
      )}
    </div>
  );
};
