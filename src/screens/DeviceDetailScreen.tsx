import React, { useState } from 'react';
import { Sighting, Fleet } from '../types';
import { MacUtil } from '../domain/macUtil';
import { GpsService } from '../domain/gpsService';
import { decodePayloadFields } from '../domain/advPayloadDecoder';
import { Sparkline } from '../components/Sparkline';
import {
  ArrowLeft,
  Crosshair,
  Bookmark,
  Plus,
  Wifi,
  Bluetooth,
  AlertTriangle,
  Clock,
  Radio,
  MapPin,
  Compass,
  FileCode,
  Tag,
} from 'lucide-react';

interface DeviceDetailScreenProps {
  device: Sighting;
  fleets: Fleet[];
  isWatched: boolean;
  onBack: () => void;
  onHunt: () => void;
  onToggleWatch: () => void;
  onCreateSignature: () => void;
  onSaveCustomName: (name: string, notes: string) => void;
  customName?: string;
  observerNotes?: string;
  demoMode: boolean;
  nightMode: boolean;
}

export const DeviceDetailScreen: React.FC<DeviceDetailScreenProps> = ({
  device,
  fleets,
  isWatched,
  onBack,
  onHunt,
  onToggleWatch,
  onCreateSignature,
  onSaveCustomName,
  customName = '',
  observerNotes = '',
  demoMode,
  nightMode,
}) => {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(customName);
  const [notesDraft, setNotesDraft] = useState(observerNotes);

  const fleetMap = new Map(fleets.map((f) => [f.id, f]));
  const matchedFleets = device.fleetIds
    .map((id) => fleetMap.get(id))
    .filter((f): f is Fleet => f !== undefined);

  // Payload decodes
  const decodedSections: {
    fleetName: string;
    fields: { label: string; value: string | number; unit?: string }[];
  }[] = [];

  for (const fleet of matchedFleets) {
    if (fleet.decode) {
      const { values } = decodePayloadFields(device, fleet.decode);
      if (Object.keys(values).length > 0) {
        decodedSections.push({
          fleetName: fleet.name,
          fields: Object.values(values),
        });
      }
    }
  }

  const handleSaveNaming = () => {
    onSaveCustomName(nameDraft, notesDraft);
    setEditingName(false);
  };

  const maskedMac = MacUtil.screenMac(device.mac, demoMode);

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4 pb-24 text-xs font-mono">
      {/* Top action bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[#2A3340]">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 p-1 text-[#9AA6B2] hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold text-xs">Back</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Hunt Mode Button */}
          <button
            onClick={onHunt}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF3D5A] text-white font-bold hover:bg-[#FF5A7A] shadow-md shadow-[#FF3D5A]/20"
          >
            <Crosshair className="w-4 h-4" />
            <span>Hunt</span>
          </button>

          {/* Bookmark Button */}
          <button
            onClick={onToggleWatch}
            className={`p-2 rounded-lg border transition-colors ${
              isWatched
                ? 'bg-[#FFB020]/20 border-[#FFB020] text-[#FFB020]'
                : 'border-[#2A3340] bg-[#141A22] text-[#9AA6B2] hover:text-white'
            }`}
            title="Bookmark / Watchlist"
          >
            <Bookmark
              className={`w-4 h-4 ${isWatched ? 'fill-[#FFB020]' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Main Radio Header Card */}
      <div className="p-4 bg-[#141A22] rounded-xl border border-[#2A3340] space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              {device.kind === 'WIFI' ? (
                <Wifi className="w-4 h-4 text-[#4FC3F7]" />
              ) : (
                <Bluetooth className="w-4 h-4 text-[#3DFF9A]" />
              )}
              <h2 className="text-base font-bold text-[#D5DCE3] font-mono">
                {maskedMac}
              </h2>
            </div>
            {device.name && (
              <p className="text-xs text-[#3DFF9A] mt-0.5 font-sans font-medium">
                "{device.name}"
              </p>
            )}
            {customName && (
              <p className="text-xs text-[#FFB020] mt-0.5">
                Custom Label: {customName}
              </p>
            )}
            {device.vendor && (
              <p className="text-[11px] text-[#9AA6B2] mt-0.5">
                Vendor: {device.vendor}
              </p>
            )}
          </div>

          <div className="text-right">
            <div className="text-xl font-bold text-[#3DFF9A] font-mono">
              {device.rssi}{' '}
              <span className="text-xs font-normal text-[#9AA6B2]">dBm</span>
            </div>
            <div className="text-[10px] text-[#9AA6B2] mt-0.5">
              Min: {device.rssiMin} / Max: {device.rssiMax}
            </div>
          </div>
        </div>

        {/* Full Sparkline */}
        <div className="pt-2 border-t border-[#2A3340]/60">
          <div className="flex items-center justify-between text-[10px] text-[#9AA6B2] mb-1">
            <span>RSSI SIGNAL HISTORY</span>
            <span>{device.rssiHistory.length} SAMPLES</span>
          </div>
          <div className="w-full flex justify-center bg-[#0B0F14] p-2 rounded border border-[#2A3340]">
            <Sparkline
              history={device.rssiHistory}
              width={340}
              height={36}
              color={nightMode ? '#FF5A5A' : '#3DFF9A'}
            />
          </div>
        </div>
      </div>

      {/* Extra Attention Notes */}
      {matchedFleets.some((f) => f.attentionNote) && (
        <div className="p-3 bg-[#3A1212] border border-[#FF3D5A]/40 rounded-xl space-y-1.5 text-[#FF7A7A]">
          <div className="flex items-center gap-2 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#FF3D5A]" />
            <span>EXTRA ATTENTION NOTICE</span>
          </div>
          {matchedFleets
            .filter((f) => f.attentionNote)
            .map((f) => (
              <div key={f.id} className="text-[11px] leading-tight pl-6">
                • <strong className="text-white">{f.name}:</strong>{' '}
                {f.attentionNote}
              </div>
            ))}
        </div>
      )}

      {/* Decoded Field Values (e.g. Remote ID aircraft coordinates, battery) */}
      {decodedSections.length > 0 && (
        <div className="p-3 bg-[#141A22] rounded-xl border border-[#2A3340] space-y-3">
          <div className="flex items-center gap-2 font-bold text-xs text-[#D5DCE3]">
            <Compass className="w-4 h-4 text-[#3DFF9A]" />
            <span>DECODED TELEMETRY & ADVERTISEMENT FIELDS</span>
          </div>
          {decodedSections.map((sec, sIdx) => (
            <div key={sIdx} className="space-y-1.5">
              <div className="text-[10px] text-[#FFB020] uppercase font-bold">
                {sec.fleetName}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {sec.fields.map((f, fIdx) => (
                  <div
                    key={fIdx}
                    className="p-2 bg-[#1B232D] rounded border border-[#2A3340]"
                  >
                    <span className="text-[10px] text-[#9AA6B2] block">
                      {f.label}
                    </span>
                    <span className="text-xs font-bold text-[#D5DCE3]">
                      {f.value} {f.unit || ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Radio Specifications Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 bg-[#141A22] rounded-lg border border-[#2A3340]">
          <span className="text-[10px] text-[#9AA6B2] block">CHANNEL & FREQ</span>
          <span className="text-xs font-bold text-[#D5DCE3]">
            Ch {device.channel} · {device.frequencyMhz} MHz
          </span>
        </div>

        <div className="p-3 bg-[#141A22] rounded-lg border border-[#2A3340]">
          <span className="text-[10px] text-[#9AA6B2] block">MAC PROPERTIES</span>
          <span className="text-xs font-bold text-[#D5DCE3]">
            {device.randomized ? 'Randomized (Private)' : 'Universal (Burned-in)'}
          </span>
        </div>

        <div className="p-3 bg-[#141A22] rounded-lg border border-[#2A3340]">
          <span className="text-[10px] text-[#9AA6B2] block">FIRST SEEN</span>
          <span className="text-xs font-semibold text-[#D5DCE3]">
            {new Date(device.firstSeen).toLocaleTimeString()}
          </span>
        </div>

        <div className="p-3 bg-[#141A22] rounded-lg border border-[#2A3340]">
          <span className="text-[10px] text-[#9AA6B2] block">LAST SEEN / HITS</span>
          <span className="text-xs font-semibold text-[#D5DCE3]">
            {new Date(device.lastSeen).toLocaleTimeString()} · {device.hitCount} hits
          </span>
        </div>

        {device.latitude && device.longitude && (
          <div className="col-span-2 p-3 bg-[#141A22] rounded-lg border border-[#2A3340]">
            <span className="text-[10px] text-[#9AA6B2] block">HEAR-TIME GPS STAMP</span>
            <span className="text-xs font-semibold text-[#D5DCE3]">
              {GpsService.formatCoordinate(device.latitude, true, demoMode)},{' '}
              {GpsService.formatCoordinate(device.longitude, false, demoMode)}
            </span>
          </div>
        )}
      </div>

      {/* Matched Signatures */}
      <div className="p-3 bg-[#141A22] rounded-lg border border-[#2A3340] space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs text-[#D5DCE3]">
            MATCHED SIGNATURES ({matchedFleets.length})
          </span>
          <button
            onClick={onCreateSignature}
            className="flex items-center gap-1 text-[11px] text-[#3DFF9A] hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create signature from radio</span>
          </button>
        </div>

        {matchedFleets.length === 0 ? (
          <p className="text-[11px] text-[#9AA6B2] italic">
            No catalog signatures matched this radio. You can create a signature using its MAC, vendor, or broadcast payload.
          </p>
        ) : (
          <div className="space-y-1.5">
            {matchedFleets.map((fleet) => (
              <div
                key={fleet.id}
                className="p-2 rounded bg-[#1B232D] border border-[#2A3340] flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-xs text-[#FFB020]">
                    {fleet.name}
                  </span>
                  <span className="text-[10px] text-[#9AA6B2] block">
                    {fleet.notes || 'Catalog rule match'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Raw Payload / Services */}
      {(device.serviceUuids.length > 0 || device.manufacturerDataHex) && (
        <div className="p-3 bg-[#141A22] rounded-lg border border-[#2A3340] space-y-2">
          <span className="font-bold text-xs text-[#D5DCE3]">
            RAW BROADCAST IDENTIFIERS
          </span>
          {device.serviceUuids.length > 0 && (
            <div>
              <span className="text-[10px] text-[#9AA6B2] block">SERVICE UUIDS:</span>
              <p className="text-xs text-[#4FC3F7] break-all">
                {device.serviceUuids.join(', ')}
              </p>
            </div>
          )}
          {device.manufacturerDataHex && (
            <div>
              <span className="text-[10px] text-[#9AA6B2] block">
                MANUFACTURER DATA (HEX):
              </span>
              <p className="text-xs text-[#D5DCE3] break-all bg-[#0B0F14] p-1.5 rounded border border-[#2A3340]">
                {device.manufacturerId !== null && (
                  <span className="text-[#FFB020]">
                    [0x{device.manufacturerId.toString(16).padStart(4, '0')}]{' '}
                  </span>
                )}
                {device.manufacturerDataHex}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Custom Naming & Observer Notes */}
      <div className="p-3 bg-[#141A22] rounded-lg border border-[#2A3340] space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs text-[#D5DCE3]">
            OPERATOR LABEL & NOTES
          </span>
          {!editingName && (
            <button
              onClick={() => setEditingName(true)}
              className="text-[11px] text-[#3DFF9A] hover:underline"
            >
              Edit
            </button>
          )}
        </div>

        {editingName ? (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Custom device label..."
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              className="w-full bg-[#1B232D] border border-[#2A3340] rounded px-3 py-1.5 text-xs text-[#D5DCE3]"
            />
            <textarea
              rows={2}
              placeholder="Observer notes or context..."
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              className="w-full bg-[#1B232D] border border-[#2A3340] rounded px-3 py-1.5 text-xs text-[#D5DCE3]"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingName(false)}
                className="px-3 py-1 rounded bg-[#1B232D] text-[#9AA6B2]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNaming}
                className="px-3 py-1 rounded bg-[#3DFF9A] text-[#003820] font-bold"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-[#9AA6B2]">
            {customName || observerNotes
              ? `${customName ? `Label: "${customName}". ` : ''}${observerNotes ? `Notes: "${observerNotes}"` : ''}`
              : 'No custom label or notes assigned to this MAC.'}
          </p>
        )}
      </div>
    </div>
  );
};
