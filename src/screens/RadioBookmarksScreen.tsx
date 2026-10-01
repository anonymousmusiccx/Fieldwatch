import React, { useState } from 'react';
import { WatchTarget, Sighting } from '../types';
import { ArrowLeft, Bookmark, Bell, BellOff, Trash2, Edit3 } from 'lucide-react';

interface RadioBookmarksScreenProps {
  watchlist: WatchTarget[];
  onBack: () => void;
  onToggleAlert: (id: string) => void;
  onRemoveWatch: (id: string) => void;
  onUpdateWatch: (target: WatchTarget) => void;
  onOpenDevice: (deviceKey: string) => void;
  nightMode: boolean;
}

export const RadioBookmarksScreen: React.FC<RadioBookmarksScreenProps> = ({
  watchlist,
  onBack,
  onToggleAlert,
  onRemoveWatch,
  onUpdateWatch,
  onOpenDevice,
  nightMode,
}) => {
  const [editingTarget, setEditingTarget] = useState<WatchTarget | null>(null);

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4 pb-24 text-xs font-mono">
      <div className="flex items-center gap-3 pb-3 border-b border-[#2A3340]">
        <button
          onClick={onBack}
          className="p-1 text-[#9AA6B2] hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-sm font-bold text-[#D5DCE3]">
            BOOKMARKED & NAMED RADIOS ({watchlist.length})
          </h2>
          <p className="text-[11px] text-[#9AA6B2]">
            Custom named radios and watchlist targets for audible alert chirps
          </p>
        </div>
      </div>

      {watchlist.length === 0 ? (
        <div className="text-center py-16 text-[#9AA6B2] space-y-2">
          <Bookmark className="w-8 h-8 text-[#9AA6B2]/40 mx-auto mb-2" />
          <p className="font-semibold text-xs text-[#D5DCE3]">
            No bookmarked radios
          </p>
          <p className="text-[11px] max-w-xs mx-auto">
            Tap a radio in the Live list to open details, then tap Bookmark to track it here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {watchlist.map((target) => (
            <div
              key={target.id}
              className="p-3 bg-[#141A22] rounded-lg border border-[#2A3340] space-y-2 hover:border-[#3DFF9A]/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className="cursor-pointer min-w-0 flex-1"
                  onClick={() => target.deviceKey && onOpenDevice(target.deviceKey)}
                >
                  <span className="font-bold text-xs text-[#D5DCE3] block truncate">
                    {target.label}
                  </span>
                  {target.deviceKey && (
                    <span className="text-[11px] text-[#9AA6B2] font-mono block">
                      {target.deviceKey}
                    </span>
                  )}
                  {target.observerNotes && (
                    <p className="text-[11px] text-[#FFB020] mt-1 italic">
                      “{target.observerNotes}”
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Alert toggle */}
                  <button
                    onClick={() => onToggleAlert(target.id)}
                    className={`p-1.5 rounded ${
                      target.alert
                        ? 'bg-[#163326] text-[#3DFF9A]'
                        : 'bg-[#1B232D] text-[#9AA6B2]'
                    }`}
                    title={target.alert ? 'Alerts active' : 'Alerts muted'}
                  >
                    {target.alert ? (
                      <Bell className="w-4 h-4" />
                    ) : (
                      <BellOff className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => setEditingTarget(JSON.parse(JSON.stringify(target)))}
                    className="p-1.5 rounded bg-[#1B232D] text-[#9AA6B2] hover:text-[#D5DCE3]"
                    title="Edit label & notes"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onRemoveWatch(target.id)}
                    className="p-1.5 rounded bg-[#1B232D] text-[#FF3D5A] hover:text-[#FF7A7A]"
                    title="Delete bookmark"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#141A22] border border-[#2A3340] rounded-xl max-w-sm w-full p-4 space-y-3">
            <h3 className="text-sm font-bold text-[#D5DCE3]">
              Edit Named Radio
            </h3>
            <div>
              <label className="text-[11px] text-[#9AA6B2] block mb-1">
                LABEL
              </label>
              <input
                type="text"
                value={editingTarget.label}
                onChange={(e) =>
                  setEditingTarget({ ...editingTarget, label: e.target.value })
                }
                className="w-full bg-[#1B232D] border border-[#2A3340] rounded px-3 py-1.5 text-xs text-[#D5DCE3]"
              />
            </div>
            <div>
              <label className="text-[11px] text-[#9AA6B2] block mb-1">
                OBSERVER NOTES
              </label>
              <textarea
                rows={2}
                value={editingTarget.observerNotes || ''}
                onChange={(e) =>
                  setEditingTarget({
                    ...editingTarget,
                    observerNotes: e.target.value,
                  })
                }
                className="w-full bg-[#1B232D] border border-[#2A3340] rounded px-3 py-1.5 text-xs text-[#D5DCE3]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingTarget(null)}
                className="px-3 py-1.5 rounded bg-[#1B232D] text-[#9AA6B2]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onUpdateWatch(editingTarget);
                  setEditingTarget(null);
                }}
                className="px-3 py-1.5 rounded bg-[#3DFF9A] text-[#003820] font-bold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
