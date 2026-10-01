import React from 'react';
import { CandidateSignature, Fleet } from '../types';
import { Sparkles, ArrowLeft, Plus, Radio } from 'lucide-react';

interface CandidatesScreenProps {
  candidates: CandidateSignature[];
  onBack: () => void;
  onCreateSignature: (c: CandidateSignature) => void;
  nightMode: boolean;
}

export const CandidatesScreen: React.FC<CandidatesScreenProps> = ({
  candidates,
  onBack,
  onCreateSignature,
  nightMode,
}) => {
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
            SIGNATURE CANDIDATES ({candidates.length})
          </h2>
          <p className="text-[11px] text-[#9AA6B2]">
            Repeated unclassified radios ready for 1-click signature creation
          </p>
        </div>
      </div>

      {candidates.length === 0 ? (
        <div className="text-center py-16 text-[#9AA6B2] space-y-2">
          <Sparkles className="w-8 h-8 text-[#9AA6B2]/40 mx-auto mb-2" />
          <p className="font-semibold text-xs text-[#D5DCE3]">
            No signature candidates found
          </p>
          <p className="text-[11px] max-w-xs mx-auto">
            All current radios are either recognized by catalog signatures or have insufficient repeat sightings.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {candidates.map((cand) => (
            <div
              key={cand.id}
              className="p-3 bg-[#141A22] rounded-lg border border-[#2A3340] space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-[#D5DCE3]">
                      {cand.name}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-[#1B232D] text-[#4FC3F7] border border-[#2A3340]">
                      {cand.kind}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9AA6B2] font-mono mt-0.5">
                    OUI: {cand.oui} · {cand.occurrences} hits detected
                  </p>
                </div>

                <button
                  onClick={() => onCreateSignature(cand)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded bg-[#3DFF9A] text-[#003820] font-bold text-xs hover:bg-[#4EFEA7]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create</span>
                </button>
              </div>

              <div className="p-2 bg-[#1B232D] rounded border border-[#2A3340] text-[11px] text-[#9AA6B2]">
                <span className="text-[#D5DCE3] font-semibold">Suggested rules: </span>
                {cand.suggestedRules
                  .map((r) => `${r.kind}(${r.text || r.companyId})`)
                  .join(' · ')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
