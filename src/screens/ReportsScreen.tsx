import React, { useState } from 'react';
import { Sit, Sighting, Fleet } from '../types';
import { SitPathCanvas } from '../components/SitPathCanvas';
import {
  FileText,
  Download,
  Share2,
  Calendar,
  Clock,
  Radio,
  Trash2,
  Check,
} from 'lucide-react';

interface ReportsScreenProps {
  sits: Sit[];
  currentSightings: Sighting[];
  fleets: Fleet[];
  onDeleteSit?: (id: string) => void;
  nightMode?: boolean;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  sits,
  currentSightings,
  fleets,
  onDeleteSit,
  nightMode = false,
}) => {
  const [selectedSitId, setSelectedSitId] = useState<string | null>(sits[0]?.id || null);

  const activeSit = sits.find((s) => s.id === selectedSitId) || sits[0] || null;

  const exportSitJson = (sit: Sit) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sit, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `SITREP_${sit.id}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportTacticalText = (sit: Sit) => {
    let report = `==========================================================\n`;
    report += `FIELDWATCH TACTICAL DEBRIEF REPORT\n`;
    report += `INCIDENT / SNAPSHOT ID: ${sit.id}\n`;
    report += `TIMESTAMP: ${new Date(sit.createdAtMs).toISOString()}\n`;
    report += `TOTAL DETECTED CONTACTS: ${sit.sightings.length}\n`;
    report += `==========================================================\n\n`;

    report += `SIGNIFICANT CONTACTS LOG:\n`;
    sit.sightings.forEach((s, idx) => {
      report += `[#${idx + 1}] ${s.ssid || s.name || 'UNNAMED'}\n`;
      report += `    MAC: ${s.mac} | VENDOR: ${s.ouiVendor || 'Unknown'}\n`;
      report += `    BAND: ${s.kind} | RSSI: ${s.rssi} dBm | DIST: ~${(s.estimatedDistanceMeters ?? 0).toFixed(1)}m\n`;
      if (s.matchedClass) report += `    CLASS: ${s.matchedClass} (${s.matchedFleet})\n`;
      report += `\n`;
    });

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FIELDWATCH_DEBRIEF_${sit.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-4 font-mono text-xs select-none">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E293B]">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-sky-400" />
          <h1 className="text-sm font-bold text-white tracking-wider">TACTICAL DEBRIEF & SITREPS</h1>
        </div>
      </div>

      {sits.length === 0 ? (
        <div className="p-8 text-center bg-[#080D14] border border-[#1E293B] rounded-xl text-slate-500">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-40 text-sky-400" />
          <p className="font-bold text-white mb-1">NO SITUATION REPORTS LOGGED YET</p>
          <p className="text-[11px] text-slate-400">
            Tap the "SITREP" camera icon in the top header during an active operation to capture a real-time tactical snapshot.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Sits List Sidebar */}
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase">CAPTURED SITREPS:</span>
            {sits.map((sit) => (
              <div
                key={sit.id}
                onClick={() => setSelectedSitId(sit.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  activeSit?.id === sit.id
                    ? 'bg-[#132032] border-sky-500/70 text-white'
                    : 'bg-[#080D14] border-[#1E293B] text-slate-400 hover:text-white'
                }`}
              >
                <div className="font-bold text-white text-xs truncate">{sit.title}</div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(sit.createdAtMs).toLocaleTimeString()}</span>
                </div>
                <div className="text-[10px] text-sky-400 mt-1 font-semibold">
                  {sit.sightings.length} contacts logged
                </div>
              </div>
            ))}
          </div>

          {/* Sit Detail Viewer */}
          {activeSit && (
            <div className="md:col-span-2 bg-[#080D14] border border-[#1E293B] rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
                <div>
                  <h2 className="text-sm font-bold text-white">{activeSit.title}</h2>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(activeSit.createdAtMs).toLocaleString()} • ID: {activeSit.id}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => exportTacticalText(activeSit)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-[#1E293B] hover:bg-[#334155] text-white rounded text-[11px] transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>TXT</span>
                  </button>
                  <button
                    onClick={() => exportSitJson(activeSit)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded text-[11px] transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>JSON</span>
                  </button>
                </div>
              </div>

              {/* Operator GPS Track Canvas */}
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                  OPERATOR PATROL VECTOR & FIXES:
                </span>
                <SitPathCanvas
                  operatorPath={activeSit.operatorPath}
                  width={460}
                  height={160}
                  nightMode={nightMode}
                />
              </div>

              {/* Sighting list snapshot */}
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                  LOGGED RF TARGETS ({activeSit.sightings.length}):
                </span>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {activeSit.sightings.map((s) => (
                    <div
                      key={s.key}
                      className="p-2 bg-[#0B0F17] rounded-lg border border-[#1E293B] flex items-center justify-between text-xs"
                    >
                      <div className="truncate min-w-0 pr-2">
                        <div className="font-bold text-white truncate">
                          {s.ssid || s.name || s.mac}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {s.mac} • {s.ouiVendor}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-emerald-400">{s.rssi} dBm</span>
                        <div className="text-[10px] text-slate-500">
                          ~{(s.estimatedDistanceMeters ?? 0).toFixed(1)}m
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
