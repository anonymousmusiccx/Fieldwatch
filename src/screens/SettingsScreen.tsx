import React from 'react';
import { AppSettings } from '../types';
import {
  Settings,
  Volume2,
  MapPin,
  Moon,
  Zap,
  Radio,
  Sliders,
} from 'lucide-react';

interface SettingsScreenProps {
  settings: AppSettings;
  onChangeSettings: (next: AppSettings) => void;
  onClearData?: () => void;
  nightMode?: boolean;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onChangeSettings,
  onClearData,
  nightMode = false,
}) => {
  return (
    <div className="max-w-xl mx-auto p-3 sm:p-4 font-mono text-xs select-none">
      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#1E293B]">
        <Settings className="w-5 h-5 text-emerald-400" />
        <h1 className="text-sm font-bold text-white tracking-wider">SYSTEM CONFIGURATION</h1>
      </div>

      <div className="space-y-4">
        {/* Audio Alerts */}
        <div className="bg-[#080D14] border border-[#1E293B] rounded-xl p-3.5 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold pb-2 border-b border-[#1E293B]">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            <span>AUDIBLE NOTIFICATIONS & SYNTHESIS</span>
          </div>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="font-bold text-white">Audio Alert Tones</div>
              <div className="text-[10px] text-slate-500">Chirp on priority threat contacts</div>
            </div>
            <input
              type="checkbox"
              checked={settings.alertBeep}
              onChange={(e) => onChangeSettings({ ...settings, alertBeep: e.target.checked })}
              className="accent-emerald-500 w-4 h-4"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="font-bold text-white">Synthesized Voice Alerts</div>
              <div className="text-[10px] text-slate-500">Read threat class aloud via Web Speech API</div>
            </div>
            <input
              type="checkbox"
              checked={settings.alertVoice}
              onChange={(e) => onChangeSettings({ ...settings, alertVoice: e.target.checked })}
              className="accent-emerald-500 w-4 h-4"
            />
          </label>
        </div>

        {/* GPS Location Tagging */}
        <div className="bg-[#080D14] border border-[#1E293B] rounded-xl p-3.5 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold pb-2 border-b border-[#1E293B]">
            <MapPin className="w-4 h-4 text-sky-400" />
            <span>OPERATOR GEOLOCATION</span>
          </div>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="font-bold text-white">Geotag Radio Fixes</div>
              <div className="text-[10px] text-slate-500">Attach latitude/longitude to detected packets</div>
            </div>
            <input
              type="checkbox"
              checked={settings.tagLocation}
              onChange={(e) => onChangeSettings({ ...settings, tagLocation: e.target.checked })}
              className="accent-emerald-500 w-4 h-4"
            />
          </label>
        </div>

        {/* Tactical Scan Intensity */}
        <div className="bg-[#080D14] border border-[#1E293B] rounded-xl p-3.5 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold pb-2 border-b border-[#1E293B]">
            <Radio className="w-4 h-4 text-amber-400" />
            <span>SCANNER SAMPLING FREQUENCY</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['PASSIVE', 'BALANCED', 'AGGRESSIVE'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => onChangeSettings({ ...settings, intensity: lvl })}
                className={`py-2 rounded-lg font-bold border transition-colors ${
                  settings.intensity === lvl
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                    : 'bg-[#0B0F17] text-slate-500 border-[#1E293B]'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Data Reset */}
        {onClearData && (
          <div className="pt-2">
            <button
              onClick={onClearData}
              className="w-full py-2.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800 text-rose-300 font-bold rounded-xl transition-colors"
            >
              PURGE LOCAL DATA & LOGS
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
