import React, { useState } from 'react';
import { Fleet, MatchRule, RuleKind, SignatureClass, VISIBLE_SIGNATURE_CLASSES } from '../types';
import {
  Shield,
  Plus,
  Trash2,
  Check,
  ChevronRight,
  ChevronDown,
  Download,
  Upload,
} from 'lucide-react';

interface FleetsScreenProps {
  fleets: Fleet[];
  onToggleFleet: (id: string) => void;
  onAddRule: (fleetId: string, rule: MatchRule) => void;
  onDeleteRule: (fleetId: string, ruleId: string) => void;
  nightMode?: boolean;
}

export const FleetsScreen: React.FC<FleetsScreenProps> = ({
  fleets,
  onToggleFleet,
  onAddRule,
  onDeleteRule,
  nightMode = false,
}) => {
  const [expandedFleetId, setExpandedFleetId] = useState<string | null>(fleets[0]?.id || null);
  const [showAddModal, setShowAddModal] = useState<string | null>(null);

  // New Rule Form State
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleKind, setNewRuleKind] = useState<RuleKind>('MAC_PREFIX');
  const [newRulePattern, setNewRulePattern] = useState('');
  const [newRuleClass, setNewRuleClass] = useState<SignatureClass>('SURVEILLANCE');

  const handleCreateRule = (fleetId: string) => {
    if (!newRuleName.trim() || !newRulePattern.trim()) return;

    const rule: MatchRule = {
      id: `rule-${Date.now()}`,
      name: newRuleName.trim(),
      kind: newRuleKind,
      pattern: newRulePattern.trim(),
      className: newRuleClass,
    };

    onAddRule(fleetId, rule);
    setShowAddModal(null);
    setNewRuleName('');
    setNewRulePattern('');
  };

  return (
    <div className="max-w-2xl mx-auto p-3 sm:p-4 font-mono text-xs select-none">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E293B]">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-rose-400" />
          <h1 className="text-sm font-bold text-white tracking-wider">
            THREAT FLEETS & RF SIGNATURE RULES
          </h1>
        </div>
      </div>

      <p className="text-slate-400 mb-4 text-[11px] leading-relaxed">
        Fleets group signature matching rules for automated target classification against Wi-Fi MAC prefixes, SSIDs, and Bluetooth LE beacons.
      </p>

      {/* Fleets List */}
      <div className="space-y-3">
        {fleets.map((fleet) => {
          const isExpanded = expandedFleetId === fleet.id;
          return (
            <div
              key={fleet.id}
              className="bg-[#080D14] border border-[#1E293B] rounded-xl overflow-hidden"
            >
              {/* Fleet Header */}
              <div
                onClick={() => setExpandedFleetId(isExpanded ? null : fleet.id)}
                className="p-3 bg-[#0B0F17] hover:bg-[#111827] flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: fleet.color || '#38BDF8' }}
                  />
                  <div className="truncate">
                    <div className="font-bold text-white truncate text-xs">{fleet.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{fleet.description}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-slate-400">
                    {fleet.rules.length} {fleet.rules.length === 1 ? 'rule' : 'rules'}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFleet(fleet.id);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                      fleet.enabled
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-700'
                        : 'bg-slate-900 text-slate-600 border-slate-800'
                    }`}
                  >
                    {fleet.enabled ? 'ACTIVE' : 'MUTED'}
                  </button>

                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Rules List Accordion */}
              {isExpanded && (
                <div className="p-3 border-t border-[#1E293B] space-y-2 bg-[#06090F]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      MATCHING PATTERNS:
                    </span>
                    <button
                      onClick={() => setShowAddModal(fleet.id)}
                      className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded text-[10px] font-bold transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>ADD SIGNATURE</span>
                    </button>
                  </div>

                  {fleet.rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="p-2 bg-[#0B0F17] border border-[#1E293B] rounded-lg flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{rule.name}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                            {rule.kind}
                          </span>
                        </div>
                        <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                          PATTERN: <span className="text-white">{rule.pattern}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteRule(fleet.id, rule.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                        title="Delete rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Add Signature inline modal */}
                  {showAddModal === fleet.id && (
                    <div className="p-3 bg-[#0F172A] border border-emerald-500/40 rounded-xl space-y-2.5 mt-2 animate-in fade-in">
                      <div className="font-bold text-white text-xs">CREATE DETECTION SIGNATURE</div>
                      <div>
                        <label className="text-[10px] text-slate-400">SIGNATURE NAME</label>
                        <input
                          type="text"
                          value={newRuleName}
                          onChange={(e) => setNewRuleName(e.target.value)}
                          placeholder="e.g. Harris Stingray II"
                          className="w-full bg-[#080D14] border border-[#1E293B] rounded p-1.5 text-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-400">MATCH TYPE</label>
                          <select
                            value={newRuleKind}
                            onChange={(e) => setNewRuleKind(e.target.value as RuleKind)}
                            className="w-full bg-[#080D14] border border-[#1E293B] rounded p-1.5 text-white"
                          >
                            <option value="MAC_PREFIX">MAC Prefix (e.g. 50:02:91)</option>
                            <option value="SSID_REGEX">SSID Regex</option>
                            <option value="OUI">OUI Vendor Prefix</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400">CLASSIFICATION</label>
                          <select
                            value={newRuleClass}
                            onChange={(e) => setNewRuleClass(e.target.value as SignatureClass)}
                            className="w-full bg-[#080D14] border border-[#1E293B] rounded p-1.5 text-white"
                          >
                            {VISIBLE_SIGNATURE_CLASSES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400">HEX PATTERN / REGEX</label>
                        <input
                          type="text"
                          value={newRulePattern}
                          onChange={(e) => setNewRulePattern(e.target.value)}
                          placeholder="e.g. 00:12:7F"
                          className="w-full bg-[#080D14] border border-[#1E293B] rounded p-1.5 text-white"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => setShowAddModal(null)}
                          className="px-2.5 py-1 text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleCreateRule(fleet.id)}
                          className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded"
                        >
                          Save Signature
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
