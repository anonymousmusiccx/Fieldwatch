import React, { useState } from 'react';
import { Sighting, Fleet, Sit, GpsSample } from '../types';
import { DebriefReport } from '../domain/debriefReport';
import { sitStore } from '../domain/sitStore';
import { SitPathCanvas } from '../components/SitPathCanvas';
import {
  FileText,
  Download,
  Copy,
  Check,
  Play,
  Pause,
  MapPin,
  Sparkles,
  GitCompare,
  Upload,
  Radio,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface ReportsScreenProps {
  devices: Sighting[];
  fleets: Fleet[];
  demoMode: boolean;
  customNames: Map<string, string>;
  activeSit: Sit | null;
  onStartSit: (name?: string) => void;
  onPauseSit: () => void;
  onRenameSit: (id: string, name: string) => void;
  onLoadLog: (text: string) => void;
  onOpenCandidates: () => void;
  nightMode: boolean;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  devices,
  fleets,
  demoMode,
  customNames,
  activeSit,
  onStartSit,
  onPauseSit,
  onRenameSit,
  onLoadLog,
  onOpenCandidates,
  nightMode,
}) => {
  const [activeTab, setActiveTab] = useState<'DEBRIEF' | 'SIT' | 'AI' | 'LOGS'>(
    'DEBRIEF'
  );
  const [copied, setCopied] = useState(false);
  const [selectedSit1, setSelectedSit1] = useState<string>('');
  const [selectedSit2, setSelectedSit2] = useState<string>('');
  const [sitDiffResult, setSitDiffResult] = useState<ReturnType<
    typeof sitStore.compareSits
  > | null>(null);

  const sits = sitStore.getSits();

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCompare = () => {
    if (selectedSit1 && selectedSit2 && selectedSit1 !== selectedSit2) {
      const res = sitStore.compareSits(selectedSit1, selectedSit2);
      setSitDiffResult(res);
    }
  };

  const debriefText = DebriefReport.generateDebrief(
    devices,
    fleets,
    demoMode,
    customNames
  );
  const aiPromptText = DebriefReport.generateAiPrompt(
    devices,
    fleets,
    demoMode
  );

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4 pb-24 text-xs font-mono">
      {/* Top Header & Sub-navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-[#2A3340]">
        <div>
          <h2 className="text-sm font-bold text-[#D5DCE3]">
            REPORTS & SITS
          </h2>
          <p className="text-[11px] text-[#9AA6B2]">
            Tactical debriefs, session snapshots, and log management
          </p>
        </div>

        <button
          onClick={onOpenCandidates}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#1B232D] border border-[#2A3340] text-[#FFB020] hover:border-[#FFB020]"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Candidates</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-1.5 p-1 bg-[#141A22] rounded-lg border border-[#2A3340]">
        {[
          { id: 'DEBRIEF', label: 'Debrief' },
          { id: 'SIT', label: 'Sit Sessions' },
          { id: 'AI', label: 'AI Export' },
          { id: 'LOGS', label: 'Logs & Replay' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`py-2 rounded font-medium text-center text-xs transition-colors ${
              activeTab === tab.id
                ? nightMode
                  ? 'bg-[#3A1212] text-[#FF5A5A]'
                  : 'bg-[#163326] text-[#3DFF9A]'
                : 'text-[#9AA6B2] hover:text-[#D5DCE3]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: DEBRIEF */}
      {activeTab === 'DEBRIEF' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#9AA6B2]">
              Real-time tactical summary of observed radio traffic
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyText(debriefText)}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#141A22] border border-[#2A3340] hover:text-white"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-[#3DFF9A]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={() =>
                  handleDownload(
                    `fieldwatch-debrief-${Date.now()}.txt`,
                    debriefText,
                    'text/plain'
                  )
                }
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#141A22] border border-[#2A3340] hover:text-white"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>

          <pre className="p-3 bg-[#0B0F14] border border-[#2A3340] rounded-lg text-[11px] text-[#D5DCE3] leading-relaxed overflow-x-auto max-h-[60vh] select-text">
            {debriefText}
          </pre>
        </div>
      )}

      {/* TAB 2: SIT SESSIONS */}
      {activeTab === 'SIT' && (
        <div className="space-y-4">
          {/* Active Sit Card */}
          <div className="p-3 bg-[#141A22] rounded-lg border border-[#2A3340] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    activeSit
                      ? 'bg-[#3DFF9A] animate-pulse'
                      : 'bg-[#9AA6B2]/40'
                  }`}
                />
                <span className="font-semibold text-xs text-[#D5DCE3]">
                  {activeSit ? activeSit.name : 'No Active Sit Capture'}
                </span>
              </div>
              {activeSit ? (
                <button
                  onClick={onPauseSit}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#FF3D5A]/20 text-[#FF7A7A] border border-[#FF3D5A]/40"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Sit</span>
                </button>
              ) : (
                <button
                  onClick={() => onStartSit()}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#3DFF9A] text-[#003820] font-bold"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Start New Sit</span>
                </button>
              )}
            </div>

            {activeSit && (
              <p className="text-[11px] text-[#9AA6B2]">
                Recording {devices.length} current radio sightings and operator path.
              </p>
            )}
          </div>

          {/* Sit Compare Section */}
          {sits.length >= 2 && (
            <div className="p-3 bg-[#141A22] rounded-lg border border-[#2A3340] space-y-3">
              <div className="flex items-center gap-2 font-semibold text-xs text-[#D5DCE3]">
                <GitCompare className="w-4 h-4 text-[#FFB020]" />
                <span>Sit Comparison (Diff)</span>
              </div>
              <p className="text-[11px] text-[#9AA6B2]">
                Compare an earlier sit with a later sit to see what appeared, left, or moved.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedSit1}
                  onChange={(e) => setSelectedSit1(e.target.value)}
                  className="bg-[#1B232D] border border-[#2A3340] rounded p-2 text-xs text-[#D5DCE3]"
                >
                  <option value="">Baseline Sit (Older)...</option>
                  {sits.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({new Date(s.openedAt).toLocaleTimeString()})
                    </option>
                  ))}
                </select>

                <select
                  value={selectedSit2}
                  onChange={(e) => setSelectedSit2(e.target.value)}
                  className="bg-[#1B232D] border border-[#2A3340] rounded p-2 text-xs text-[#D5DCE3]"
                >
                  <option value="">Current Sit (Newer)...</option>
                  {sits.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({new Date(s.openedAt).toLocaleTimeString()})
                    </option>
                  ))}
                </select>
              </div>

              <button
                disabled={!selectedSit1 || !selectedSit2 || selectedSit1 === selectedSit2}
                onClick={handleCompare}
                className="w-full py-1.5 rounded bg-[#1B232D] border border-[#2A3340] hover:border-[#3DFF9A] text-xs font-semibold disabled:opacity-40"
              >
                Run Sit Comparison
              </button>

              {sitDiffResult && (
                <div className="pt-2 border-t border-[#2A3340] space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-[#163326] rounded border border-[#3DFF9A]/30">
                      <div className="text-base font-bold text-[#3DFF9A]">
                        +{sitDiffResult.appeared.length}
                      </div>
                      <div className="text-[10px] text-[#9AA6B2]">NEW ARRIVALS</div>
                    </div>
                    <div className="p-2 bg-[#3A1212] rounded border border-[#FF3D5A]/30">
                      <div className="text-base font-bold text-[#FF3D5A]">
                        -{sitDiffResult.departed.length}
                      </div>
                      <div className="text-[10px] text-[#9AA6B2]">DEPARTED</div>
                    </div>
                    <div className="p-2 bg-[#1B232D] rounded border border-[#2A3340]">
                      <div className="text-base font-bold text-[#4FC3F7]">
                        {sitDiffResult.persisted.length}
                      </div>
                      <div className="text-[10px] text-[#9AA6B2]">PERSISTED</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Past Sits List */}
          <div>
            <div className="text-xs font-bold text-[#9AA6B2] uppercase mb-2">
              Recorded Sits ({sits.length})
            </div>
            {sits.length === 0 ? (
              <p className="text-xs text-[#9AA6B2] italic">
                No sits recorded yet. Tap Start New Sit to snapshot the current RF landscape.
              </p>
            ) : (
              <div className="space-y-2">
                {sits.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 bg-[#141A22] rounded-lg border border-[#2A3340] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[#D5DCE3]">
                        {s.name}
                      </span>
                      <span className="text-[10px] text-[#9AA6B2]">
                        {new Date(s.openedAt).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#9AA6B2]">
                      Captured {s.devices.length} radios · {s.operatorPath.length} GPS breadcrumbs
                    </p>

                    {s.operatorPath.length > 0 && (
                      <SitPathCanvas
                        operatorPath={s.operatorPath}
                        payloadTrail={[]}
                        width={300}
                        height={120}
                        nightMode={nightMode}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: AI EXPORT */}
      {activeTab === 'AI' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#9AA6B2]">
              Structured analytical prompt for intelligence assessment
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyText(aiPromptText)}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#141A22] border border-[#2A3340] hover:text-white"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-[#3DFF9A]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copied ? 'Copied' : 'Copy Prompt'}</span>
              </button>
            </div>
          </div>

          <pre className="p-3 bg-[#0B0F14] border border-[#2A3340] rounded-lg text-[11px] text-[#D5DCE3] leading-relaxed overflow-x-auto max-h-[60vh] select-text">
            {aiPromptText}
          </pre>
        </div>
      )}

      {/* TAB 4: LOGS & REPLAY */}
      {activeTab === 'LOGS' && (
        <div className="space-y-4">
          <div className="p-3 bg-[#141A22] rounded-lg border border-[#2A3340] space-y-3">
            <div className="font-semibold text-xs text-[#D5DCE3]">
              EXPORT LIVE LOGS
            </div>
            <p className="text-[11px] text-[#9AA6B2]">
              Export the current radio observation table in standard Fieldwatch formats.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  handleDownload(
                    `fieldwatch-log-${Date.now()}.csv`,
                    DebriefReport.exportCsv(devices, demoMode),
                    'text/csv'
                  )
                }
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded bg-[#1B232D] border border-[#2A3340] hover:border-[#3DFF9A]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() =>
                  handleDownload(
                    `fieldwatch-log-${Date.now()}.jsonl`,
                    DebriefReport.exportJsonl(devices, demoMode),
                    'application/x-ndjson'
                  )
                }
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded bg-[#1B232D] border border-[#2A3340] hover:border-[#3DFF9A]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON Lines</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-[#141A22] rounded-lg border border-[#2A3340] space-y-3">
            <div className="font-semibold text-xs text-[#D5DCE3]">
              LOG REPLAY & IMPORT
            </div>
            <p className="text-[11px] text-[#9AA6B2]">
              Load a previously captured Fieldwatch CSV or JSONL log file to replay the scenario.
            </p>

            <label className="flex items-center justify-center gap-2 w-full py-3 rounded-lg border-2 border-dashed border-[#2A3340] hover:border-[#3DFF9A] cursor-pointer text-xs font-semibold text-[#9AA6B2] hover:text-[#D5DCE3]">
              <Upload className="w-4 h-4 text-[#3DFF9A]" />
              <span>Choose Log File (.csv or .jsonl)</span>
              <input
                type="file"
                accept=".csv,.json,.jsonl,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    const text = evt.target?.result as string;
                    if (text) onLoadLog(text);
                  };
                  reader.readAsText(file);
                  e.target.value = '';
                }}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
