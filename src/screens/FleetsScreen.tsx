import React, { useState } from 'react';
import {
  Fleet,
  MatchRule,
  RuleKind,
  SignatureClass,
  VISIBLE_SIGNATURE_CLASSES,
  SIGNATURE_CLASS_LABELS,
} from '../types';
import {
  Search,
  Plus,
  Download,
  Upload,
  AlertTriangle,
  Trash2,
  Edit2,
  Check,
  X,
  Layers,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

interface FleetsScreenProps {
  fleets: Fleet[];
  onToggleFleet: (id: string) => void;
  onAddFleet: (fleet: Fleet) => void;
  onUpdateFleet: (fleet: Fleet) => void;
  onDeleteFleet: (id: string) => void;
  onResetFleets: () => void;
  nightMode?: boolean;
}

export const FleetsScreen: React.FC<FleetsScreenProps> = ({
  fleets,
  onToggleFleet,
  onAddFleet,
  onUpdateFleet,
  onDeleteFleet,
  onResetFleets,
  nightMode = false,
}) => {
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [editingFleet, setEditingFleet] = useState<Fleet | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // New signature draft
  const [draftName, setDraftName] = useState('');
  const [draftKind, setDraftKind] = useState<SignatureClass>('SURVEILLANCE');
  const [draftNotes, setDraftNotes] = useState('');
  const [draftRuleKind, setDraftRuleKind] = useState<RuleKind>('NAME_CONTAINS');
  const [draftRuleValue, setDraftRuleValue] = useState('');

  const filteredFleets = fleets.filter((f) => {
    if (selectedClass !== 'ALL' && f.kind !== selectedClass) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = f.name.toLowerCase().includes(q);
      const matchNotes = f.notes.toLowerCase().includes(q);
      const matchRules = f.rules.some(
        (r) =>
          r.text?.toLowerCase().includes(q) ||
          r.dataPrefixHex?.toLowerCase().includes(q)
      );
      if (!matchName && !matchNotes && !matchRules) return false;
    }
    return true;
  });

  const handleCreateSignature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftName.trim()) return;

    const newRule: MatchRule = {
      kind: draftRuleKind,
      text: draftRuleValue.trim(),
      enabled: true,
    };

    if (draftRuleKind === 'MANUFACTURER_ID') {
      newRule.companyId = parseInt(draftRuleValue, 16) || 0;
    } else if (draftRuleKind === 'MANUFACTURER_DATA') {
      newRule.dataPrefixHex = draftRuleValue.trim();
    }

    const newFleet: Fleet = {
      id: `fleet-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: draftName.trim(),
      enabled: true,
      matchAny: true,
      colorIndex: 0,
      rules: [newRule],
      notes: draftNotes.trim(),
      attentionNote: '',
      builtIn: false,
      kind: draftKind,
    };

    onAddFleet(newFleet);
    setDraftName('');
    setDraftNotes('');
    setDraftRuleValue('');
    setShowAddModal(false);
  };

  const handleExportSignatures = () => {
    const blob = new Blob([JSON.stringify(fleets, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fieldwatch-signatures-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSignatures = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item.name && item.rules) {
              onAddFleet(item);
            }
          }
        }
      } catch {
        // Parse error fallback
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4 pb-24 text-xs font-mono select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#2A3340]">
        <div>
          <h2 className="text-sm font-bold text-[#D5DCE3]">
            SIGNATURES & CATALOG ({fleets.length})
          </h2>
          <p className="text-[11px] text-[#9AA6B2]">
            Rules-based pattern matcher for surveillance, trackers, and tactical radios
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#3DFF9A] text-[#003820] font-bold hover:bg-[#52FFA8]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#9AA6B2]" />
          <input
            type="text"
            placeholder="Search signatures by name, notes, or rule value..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1B232D] border border-[#2A3340] rounded pl-8 pr-3 py-1.5 text-xs text-[#D5DCE3]"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExportSignatures}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#1B232D] border border-[#2A3340] text-[#9AA6B2] hover:text-white"
            title="Export catalog as JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <label className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#1B232D] border border-[#2A3340] text-[#9AA6B2] hover:text-white cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportSignatures}
              className="hidden"
            />
          </label>

          <button
            onClick={onResetFleets}
            className="p-1.5 rounded bg-[#1B232D] border border-[#2A3340] text-[#9AA6B2] hover:text-white"
            title="Reset to factory stock signatures"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Class Chips Bar */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedClass('ALL')}
          className={`px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap font-semibold border ${
            selectedClass === 'ALL'
              ? 'bg-[#163326] text-[#3DFF9A] border-[#3DFF9A]'
              : 'bg-[#141A22] border-[#2A3340] text-[#9AA6B2]'
          }`}
        >
          All ({fleets.length})
        </button>
        {VISIBLE_SIGNATURE_CLASSES.map((cls) => {
          const count = fleets.filter((f) => f.kind === cls).length;
          if (count === 0) return null;
          return (
            <button
              key={cls}
              onClick={() => setSelectedClass(cls)}
              className={`px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap font-semibold border ${
                selectedClass === cls
                  ? 'bg-[#163326] text-[#3DFF9A] border-[#3DFF9A]'
                  : 'bg-[#141A22] border-[#2A3340] text-[#9AA6B2]'
              }`}
            >
              {SIGNATURE_CLASS_LABELS[cls] || cls} ({count})
            </button>
          );
        })}
      </div>

      {/* Fleets List */}
      <div className="space-y-2">
        {filteredFleets.map((fleet) => (
          <div
            key={fleet.id}
            className="p-3 bg-[#141A22] rounded-lg border border-[#2A3340] space-y-2 hover:border-[#3DFF9A]/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-[#D5DCE3]">
                    {fleet.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1B232D] text-[#FFB020] border border-[#2A3340]">
                    {SIGNATURE_CLASS_LABELS[fleet.kind] || fleet.kind}
                  </span>
                  {fleet.builtIn && (
                    <span className="text-[9px] text-[#9AA6B2]">BUILT-IN</span>
                  )}
                </div>
                <p className="text-[11px] text-[#9AA6B2]">
                  {fleet.notes || 'No description notes.'}
                </p>
              </div>

              {/* Toggle Enabled Switch */}
              <button
                onClick={() => onToggleFleet(fleet.id)}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors shrink-0 ${
                  fleet.enabled ? 'bg-[#3DFF9A]' : 'bg-[#2A3340]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-[#0B0F14] transition-transform ${
                    fleet.enabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Rules list */}
            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[#2A3340]/60">
              {fleet.rules.map((rule, rIdx) => (
                <span
                  key={rIdx}
                  className="text-[10px] px-2 py-0.5 rounded bg-[#1B232D] border border-[#2A3340] text-[#D5DCE3]"
                >
                  <strong className="text-[#38BDF8]">{rule.kind}:</strong>{' '}
                  {rule.text ||
                    (rule.companyId !== undefined
                      ? `0x${rule.companyId.toString(16)}`
                      : '') ||
                    rule.dataPrefixHex ||
                    ''}
                </span>
              ))}
            </div>

            {/* Action buttons if custom */}
            {!fleet.builtIn && (
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => onDeleteFleet(fleet.id)}
                  className="flex items-center gap-1 text-[11px] text-[#FF7A7A] hover:underline"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete Signature</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Signature Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSignature}
            className="bg-[#141A22] border border-[#2A3340] rounded-xl max-w-md w-full p-5 space-y-3.5 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#2A3340]">
              <span className="font-bold text-sm text-[#D5DCE3]">
                CREATE NEW SIGNATURE
              </span>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[#9AA6B2] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#9AA6B2]">
                SIGNATURE NAME
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Axon Body 4 or Flock ALPR"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="w-full bg-[#1B232D] border border-[#2A3340] rounded px-3 py-1.5 text-xs text-[#D5DCE3]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#9AA6B2]">
                CLASSIFICATION CATEGORY
              </label>
              <select
                value={draftKind}
                onChange={(e) => setDraftKind(e.target.value as SignatureClass)}
                className="w-full bg-[#1B232D] border border-[#2A3340] rounded p-1.5 text-xs text-[#D5DCE3]"
              >
                {VISIBLE_SIGNATURE_CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    {SIGNATURE_CLASS_LABELS[cls] || cls}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#9AA6B2]">
                PRIMARY MATCH RULE
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={draftRuleKind}
                  onChange={(e) => setDraftRuleKind(e.target.value as RuleKind)}
                  className="bg-[#1B232D] border border-[#2A3340] rounded p-1.5 text-xs text-[#D5DCE3]"
                >
                  <option value="NAME_CONTAINS">Name Contains</option>
                  <option value="MAC_PREFIX">MAC Prefix</option>
                  <option value="OUI">OUI Vendor</option>
                  <option value="SERVICE_UUID">Service UUID</option>
                  <option value="MANUFACTURER_ID">Company ID (Hex)</option>
                  <option value="MANUFACTURER_DATA">Payload Prefix</option>
                </select>

                <input
                  type="text"
                  required
                  placeholder="Rule pattern value..."
                  value={draftRuleValue}
                  onChange={(e) => setDraftRuleValue(e.target.value)}
                  className="bg-[#1B232D] border border-[#2A3340] rounded px-3 py-1.5 text-xs text-[#D5DCE3]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#9AA6B2]">
                DESCRIPTION & NOTES
              </label>
              <textarea
                rows={2}
                placeholder="Tactical context or device notes..."
                value={draftNotes}
                onChange={(e) => setDraftNotes(e.target.value)}
                className="w-full bg-[#1B232D] border border-[#2A3340] rounded px-3 py-1.5 text-xs text-[#D5DCE3]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#2A3340]">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 rounded bg-[#1B232D] text-[#9AA6B2]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-[#3DFF9A] text-[#003820] font-bold"
              >
                Save Signature
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
