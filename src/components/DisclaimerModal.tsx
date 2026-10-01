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
  const [checked, setChecked] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#141A22] border border-[#2A3340] rounded-xl max-w-md w-full p-5 space-y-4 text-xs font-mono shadow-2xl">
        <div className="flex items-center gap-3 pb-3 border-b border-[#2A3340]">
          <ShieldAlert className="w-6 h-6 text-[#FFB020] shrink-0" />
          <div>
            <h2 className="text-sm font-bold text-[#D5DCE3]">
              OPERATIONAL USE NOTICE
            </h2>
            <p className="text-[11px] text-[#9AA6B2]">
              Fieldwatch RF Monitoring & Safety Notice
            </p>
          </div>
        </div>

        <div className="space-y-2 text-[#9AA6B2] text-[11px] leading-relaxed max-h-60 overflow-y-auto pr-1">
          <p>
            <strong className="text-[#D5DCE3]">1. Passive Reception Only:</strong>{' '}
            Fieldwatch operates purely as a passive observer of public Wi-Fi beacon frames and Bluetooth Low Energy advertisements. It does not transmit, deauthenticate, inject, or tamper with wireless signals.
          </p>
          <p>
            <strong className="text-[#D5DCE3]">2. Informational Signatures:</strong>{' '}
            Signature classifications (AirTags, body cameras, surveillance, drones) are probabilistic heuristic pattern matches against broadcast MAC OUIs, service UUIDs, and manufacturer payloads. False positives and spoofed broadcasts can occur.
          </p>
          <p>
            <strong className="text-[#D5DCE3]">3. Operator Privacy:</strong>{' '}
            GPS location data tagged to sightings stays local in your browser session. You can enable Demo Mode in settings to mask MAC addresses and geographic coordinates for screen sharing.
          </p>
        </div>

        <label className="flex items-center gap-2.5 p-2.5 rounded bg-[#1B232D] border border-[#2A3340] cursor-pointer hover:border-[#3DFF9A]">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="w-4 h-4 accent-[#3DFF9A] rounded"
          />
          <span className="text-[11px] text-[#D5DCE3]">
            I understand and accept operational responsibility.
          </span>
        </label>

        <button
          disabled={!checked}
          onClick={onAccept}
          className={`w-full py-2.5 rounded font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            checked
              ? nightMode
                ? 'bg-[#FF3D5A] text-white hover:bg-[#FF5A72]'
                : 'bg-[#3DFF9A] text-[#003820] hover:bg-[#52FFA8]'
              : 'bg-[#1B232D] text-[#9AA6B2] opacity-40 cursor-not-allowed'
          }`}
        >
          <Check className="w-4 h-4" />
          <span>Acknowledge & Enter Monitor</span>
        </button>
      </div>
    </div>
  );
};
