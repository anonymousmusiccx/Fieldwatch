import React, { useState } from 'react';
import { ShieldAlert, Check } from 'lucide-react';

interface DisclaimerModalProps {
  onAccept: () => void;
  nightMode?: boolean;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({
  onAccept,
  nightMode = false,
}) => {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0F172A] border border-[#334155] rounded-xl p-5 shadow-2xl text-sm font-sans">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              OPERATIONAL COMPLIANCE & LEGAL NOTICE
            </h2>
            <p className="text-xs text-[#94A3B8] font-mono">FIELDWATCH RF MONITORING</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-[#CBD5E1] leading-relaxed mb-5 bg-[#0B0F17] p-3.5 rounded-lg border border-[#1E293B]">
          <p>
            Fieldwatch is a <strong>purely passive</strong> tactical radio frequency monitor that visualizes ambient Wi-Fi 802.11 beacon frames and Bluetooth Low Energy advertisements.
          </p>
          <p>
            • <strong>No Transmissions:</strong> This tool performs zero active packet injection, jamming, de-authentication, or payload interception.
          </p>
          <p>
            • <strong>Privacy & Jurisdiction:</strong> Radio signal monitoring must comply with all applicable local, federal, and international wiretap and surveillance statutes.
          </p>
        </div>

        <label className="flex items-start gap-2.5 mb-5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-0.5 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
          />
          <span className="text-xs text-slate-300">
            I confirm authorized operational purpose and agree to conduct passive monitoring in compliance with applicable law.
          </span>
        </label>

        <button
          onClick={onAccept}
          disabled={!acknowledged}
          className={`w-full py-2.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
            acknowledged
              ? nightMode
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-emerald-500 hover:bg-emerald-400 text-black font-bold'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Check className="w-4 h-4" />
          <span>INITIALIZE FIELDWATCH SUITE</span>
        </button>
      </div>
    </div>
  );
};
