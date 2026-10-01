import React, { useState } from 'react';
import {
  AppSettings,
  AlertVoiceWhat,
  ScanIntensity,
  LogFormat,
} from '../types';
import { audioService } from '../domain/audioService';
import {
  Moon,
  Volume2,
  VolumeX,
  Mic,
  Shield,
  Radio,
  Share2,
  Download,
  Upload,
  Info,
  Smartphone,
  Bookmark,
  ChevronRight,
} from 'lucide-react';

interface SettingsScreenProps {
  settings: AppSettings;
  onChangeSettings: (s: AppSettings) => void;
  onOpenBookmarks: () => void;
  onShowDisclaimer: () => void;
  onExportSettings: () => void;
  onImportSettings: (jsonStr: string) => void;
  nightMode: boolean;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onChangeSettings,
  onOpenBookmarks,
  onShowDisclaimer,
  onExportSettings,
  onImportSettings,
  nightMode,
}) => {
  const handleTestChirp = () => {
    audioService.playAlertBeep();
    if (settings.alertVoice) {
      setTimeout(() => {
        audioService.speakWatchlistAlert(
          'Finder tags',
          'Apple AirTags',
          settings.alertVoiceWhat
        );
      }, 350);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        onImportSettings(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="p-4 max-w-xl mx-auto space-y-6 pb-28 text-xs font-mono">
      <div className="pb-3 border-b border-[#2A3340]">
        <h2 className="text-sm font-bold text-[#D5DCE3]">SETTINGS</h2>
        <p className="text-[11px] text-[#9AA6B2]">
          Hardware, tactical audio, privacy mode, and display configuration
        </p>
      </div>

      {/* Night Mode & Tactical Cockpit */}
      <div className="p-3 bg-[#141A22] rounded-xl border border-[#2A3340] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Moon className="w-4 h-4 text-[#FF5A5A]" />
            <div>
              <span className="font-semibold text-xs text-[#D5DCE3] block">
                Night Mode (Cockpit Red)
              </span>
              <span className="text-[11px] text-[#9AA6B2] leading-tight block">
                Transforms full UI into red-on-black tactical field display
              </span>
            </div>
          </div>

          <button
            onClick={() =>
              onChangeSettings({ ...settings, nightMode: !settings.nightMode })
            }
            className={`w-10 h-5 rounded-full p-0.5 transition-colors relative ${
              settings.nightMode ? 'bg-[#FF5A5A]' : 'bg-[#2A3340]'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                settings.nightMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Bookmarked Radios Shortcut */}
      <div
        onClick={onOpenBookmarks}
        className="p-3 bg-[#141A22] rounded-xl border border-[#2A3340] hover:border-[#3DFF9A]/40 transition-colors flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <Bookmark className="w-4 h-4 text-[#FFB020]" />
          <div>
            <span className="font-semibold text-xs text-[#D5DCE3] block">
              Bookmarked & Named Radios
            </span>
            <span className="text-[11px] text-[#9AA6B2] block">
              Manage custom labels, observer notes, and alert targets
            </span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-[#9AA6B2]" />
      </div>

      {/* Audio & Voice Alerts */}
      <div className="p-3 bg-[#141A22] rounded-xl border border-[#2A3340] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[#3DFF9A]" />
            <span className="font-semibold text-xs text-[#D5DCE3]">
              Tactical Audio & Voice Alerts
            </span>
          </div>
          <button
            onClick={handleTestChirp}
            className="px-2.5 py-1 rounded bg-[#1B232D] border border-[#2A3340] text-[11px] text-[#3DFF9A] hover:border-[#3DFF9A]"
          >
            Test Alert
          </button>
        </div>

        <div className="space-y-2 pt-1 border-t border-[#2A3340]/60">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-[#D5DCE3] block">Watchlist Alert Chime</span>
              <span className="text-[11px] text-[#9AA6B2] block">
                Two-tone tactical chirp on watchlist hit
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.alertBeep}
              onChange={(e) =>
                onChangeSettings({ ...settings, alertBeep: e.target.checked })
              }
              className="accent-[#3DFF9A] w-4 h-4"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-[#D5DCE3] block">Speech Synthesis Voice</span>
              <span className="text-[11px] text-[#9AA6B2] block">
                Speaks detection over speaker/headset
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.alertVoice}
              onChange={(e) =>
                onChangeSettings({ ...settings, alertVoice: e.target.checked })
              }
              className="accent-[#3DFF9A] w-4 h-4"
            />
          </label>

          {settings.alertVoice && (
            <div className="pt-2">
              <label className="text-[11px] text-[#9AA6B2] block mb-1">
                WHAT VOICE SAYS
              </label>
              <select
                value={settings.alertVoiceWhat}
                onChange={(e) =>
                  onChangeSettings({
                    ...settings,
                    alertVoiceWhat: e.target.value as AlertVoiceWhat,
                  })
                }
                className="w-full bg-[#1B232D] border border-[#2A3340] rounded p-2 text-xs text-[#D5DCE3]"
              >
                <option value="BOTH">Class + Signature (e.g. "Finder tags, Apple AirTags")</option>
                <option value="SIGNATURE">Signature Name Only</option>
                <option value="CLASS">Class Category Only</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Privacy / Demo Mode */}
      <div className="p-3 bg-[#141A22] rounded-xl border border-[#2A3340] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-[#4FC3F7]" />
            <div>
              <span className="font-semibold text-xs text-[#D5DCE3] block">
                Privacy / Demo Masking
              </span>
              <span className="text-[11px] text-[#9AA6B2] leading-tight block">
                Masks MAC address tails (**:**:**) and redacts GPS coordinates on screens and reports
              </span>
            </div>
          </div>

          <button
            onClick={() =>
              onChangeSettings({ ...settings, demoMode: !settings.demoMode })
            }
            className={`w-10 h-5 rounded-full p-0.5 transition-colors relative ${
              settings.demoMode ? 'bg-[#3DFF9A]' : 'bg-[#2A3340]'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                settings.demoMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Display & Screen Awake */}
      <div className="p-3 bg-[#141A22] rounded-xl border border-[#2A3340] space-y-3">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-[#3DFF9A]" />
            <div>
              <span className="font-semibold text-xs text-[#D5DCE3] block">
                Keep Screen Awake
              </span>
              <span className="text-[11px] text-[#9AA6B2] block">
                Prevents display sleep during active field monitoring
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.keepScreenOn}
            onChange={(e) =>
              onChangeSettings({ ...settings, keepScreenOn: e.target.checked })
            }
            className="accent-[#3DFF9A] w-4 h-4"
          />
        </label>
      </div>

      {/* Backup, Restore & License */}
      <div className="p-3 bg-[#141A22] rounded-xl border border-[#2A3340] space-y-3">
        <div className="font-semibold text-xs text-[#D5DCE3]">
          CONFIGURATION BACKUP & LEGAL
        </div>

        <div className="flex gap-2">
          <button
            onClick={onExportSettings}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded bg-[#1B232D] border border-[#2A3340] hover:border-[#3DFF9A]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Settings</span>
          </button>

          <label className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded bg-[#1B232D] border border-[#2A3340] hover:border-[#3DFF9A] cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Import Settings</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
        </div>

        <button
          onClick={onShowDisclaimer}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-[#9AA6B2] hover:text-[#D5DCE3] border-t border-[#2A3340]/60 pt-2"
        >
          <Info className="w-3.5 h-3.5" />
          <span>View Safety Disclaimer & MIT License</span>
        </button>
      </div>

      <div className="text-center text-[10px] text-[#9AA6B2]/60 pt-2">
        Fieldwatch v1.1.17 · Passive Radio Intelligence
      </div>
    </div>
  );
};
