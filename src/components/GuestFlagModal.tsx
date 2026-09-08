import { useState } from "react";
import type { Guest, GuestFlag } from "../types";
import { usePlatform } from "../store/platform";
import { AlertOctagon, Check, Crown, Gem, ShieldAlert, X } from "lucide-react";
import { cn } from "../lib/utils";

interface GuestFlagModalProps {
  isOpen: boolean;
  onClose: () => void;
  guest: Guest | null;
}

export default function GuestFlagModal({ isOpen, onClose, guest }: GuestFlagModalProps) {
  if (!isOpen || !guest) return null;
  return <GuestFlagModalContent key={guest.id} guest={guest} onClose={onClose} />;
}

function GuestFlagModalContent({ guest, onClose }: { guest: Guest; onClose: () => void }) {
  const { updateGuestFlags } = usePlatform();
  const [selectedFlags, setSelectedFlags] = useState<GuestFlag[]>(guest.flags || []);
  const [blacklistReason, setBlacklistReason] = useState(guest.blacklistReason || "");
  const [flagNotes, setFlagNotes] = useState(guest.flagNotes || "");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const toggleFlag = (flag: GuestFlag) => {
    if (selectedFlags.includes(flag)) {
      setSelectedFlags(selectedFlags.filter((f) => f !== flag));
    } else {
      setSelectedFlags([...selectedFlags, flag]);
    }
  };

  const handleSave = () => {
    updateGuestFlags(
      guest.id,
      selectedFlags,
      selectedFlags.includes("Blacklist") ? blacklistReason : undefined,
      flagNotes
    );
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const isBlacklistSelected = selectedFlags.includes("Blacklist");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-xl border border-brand-800 bg-brand-950 p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-brand-800/80 pb-3">
          <div>
            <h3 className="text-base font-semibold text-brand-50">Guest Profile Flagging</h3>
            <p className="text-xs text-brand-200/60">
              {guest.firstName} {guest.lastName} · {guest.company || guest.nationality}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-brand-200/60 hover:bg-brand-900 hover:text-brand-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <p className="text-xs text-brand-200/80">
            Select profile status flags. These flags appear prominently across Front Desk check-in worklists, reservations, and guest directories.
          </p>

          <div className="grid grid-cols-1 gap-2.5">
            {/* VIP Option */}
            <button
              type="button"
              onClick={() => toggleFlag("VIP")}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 text-left transition-all",
                selectedFlags.includes("VIP")
                  ? "border-amber-400/60 bg-amber-500/15 text-amber-100"
                  : "border-brand-800/70 bg-brand-900/30 text-brand-200 hover:border-brand-700"
              )}
            >
              <div className="rounded-md bg-amber-500/20 p-2 text-amber-400">
                <Crown size={18} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-amber-200">VIP Guest</span>
                  {selectedFlags.includes("VIP") && <Check size={16} className="text-amber-400" />}
                </div>
                <p className="text-[11px] text-brand-200/70 mt-0.5">
                  High-profile guest, executive dignitary, or board member. Triggers priority check-in, fruit basket, and manager greeting.
                </p>
              </div>
            </button>

            {/* High-Spend Option */}
            <button
              type="button"
              onClick={() => toggleFlag("High-Spend")}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 text-left transition-all",
                selectedFlags.includes("High-Spend")
                  ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-100"
                  : "border-brand-800/70 bg-brand-900/30 text-brand-200 hover:border-brand-700"
              )}
            >
              <div className="rounded-md bg-emerald-500/20 p-2 text-emerald-400">
                <Gem size={18} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-emerald-200">High-Spend Guest</span>
                  {selectedFlags.includes("High-Spend") && <Check size={16} className="text-emerald-400" />}
                </div>
                <p className="text-[11px] text-brand-200/70 mt-0.5">
                  Demonstrated high lifetime folio spend across suites, dining, and banqueting. Eligible for complimentary upgrades.
                </p>
              </div>
            </button>

            {/* Blacklist Option */}
            <button
              type="button"
              onClick={() => toggleFlag("Blacklist")}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 text-left transition-all",
                selectedFlags.includes("Blacklist")
                  ? "border-rose-500/80 bg-rose-950/80 text-rose-100"
                  : "border-brand-800/70 bg-brand-900/30 text-brand-200 hover:border-brand-700"
              )}
            >
              <div className="rounded-md bg-rose-500/20 p-2 text-rose-400">
                <ShieldAlert size={18} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-rose-200">Blacklist (Restricted)</span>
                  {selectedFlags.includes("Blacklist") && <Check size={16} className="text-rose-400" />}
                </div>
                <p className="text-[11px] text-rose-200/70 mt-0.5">
                  Guest restricted due to severe non-payment, property damage, or security misconduct. Blocks self check-in.
                </p>
              </div>
            </button>
          </div>

          {/* Blacklist details if enabled */}
          {isBlacklistSelected && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-950/40 p-3 space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-rose-300">
                <AlertOctagon size={13} />
                <span>Blacklist Justification Reason (Required for Audit Log)</span>
              </label>
              <textarea
                rows={2}
                value={blacklistReason}
                onChange={(e) => setBlacklistReason(e.target.value)}
                placeholder="e.g. Non-payment of mini-bar and incidentals, unauthorized room modification, police report filed..."
                className="w-full rounded-md border border-rose-500/50 bg-brand-950 px-2.5 py-1.5 text-xs text-brand-100 placeholder-brand-200/40 focus:border-rose-400 focus:outline-none"
              />
            </div>
          )}

          {/* General Staff notes */}
          <div>
            <label className="block text-xs font-medium text-brand-200/80 mb-1">
              Internal Concierge & Front Desk Notes
            </label>
            <input
              type="text"
              value={flagNotes}
              onChange={(e) => setFlagNotes(e.target.value)}
              placeholder="e.g. Likes high floor away from lift, MD personal friend..."
              className="w-full rounded-lg border border-brand-800 bg-brand-900/50 px-3 py-1.5 text-xs text-brand-100 placeholder-brand-200/40 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-brand-800/80 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-brand-800 px-3 py-1.5 text-xs font-medium text-brand-200/80 hover:bg-brand-900 hover:text-brand-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isBlacklistSelected && !blacklistReason.trim()}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold shadow-sm transition-all",
              savedSuccess
                ? "bg-emerald-600 text-white"
                : isBlacklistSelected && !blacklistReason.trim()
                  ? "bg-brand-800 text-brand-200/40 cursor-not-allowed"
                  : "bg-gold-500 text-brand-950 hover:bg-gold-400"
            )}
          >
            {savedSuccess ? (
              <>
                <Check size={14} /> Saved!
              </>
            ) : (
              "Save Flags"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
