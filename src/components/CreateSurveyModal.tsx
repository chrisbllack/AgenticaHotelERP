import { useState } from "react";
import { usePlatform } from "../store/platform";
import type { GuestSurveyResponse } from "../types";
import { HeartHandshake, MessageSquare, Send, X } from "lucide-react";
import { cn } from "../lib/utils";

interface CreateSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateSurveyModal({ isOpen, onClose }: CreateSurveyModalProps) {
  const { createSurveyResponse, businessDate } = usePlatform();

  const [guestName, setGuestName] = useState("Chief Olumide Bamidele");
  const [roomNumber, setRoomNumber] = useState("001");
  const [channel, setChannel] = useState<GuestSurveyResponse["channel"]>("post_stay_email");
  const [overallScore, setOverallScore] = useState(6); // Detractor default to demonstrate automated recovery
  const [cleanliness, setCleanliness] = useState(4);
  const [dining, setDining] = useState(2);
  const [frontDesk, setFrontDesk] = useState(5);
  const [comfort, setComfort] = useState(4);
  const [value, setValue] = useState(3);
  const [comment, setComment] = useState(
    "Front desk was very polite and room was spotless, but dinner at the restaurant took over 65 minutes to arrive and order was mixed up."
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSurveyResponse({
      reservationId: "res-sim",
      guestName,
      roomNumber,
      checkoutDate: businessDate,
      channel,
      overallScore,
      sentiment: overallScore >= 9 ? "positive" : overallScore >= 7 ? "neutral" : "negative",
      categories: {
        cleanliness,
        dining,
        frontDesk,
        comfort,
        value,
      },
      comment,
      highlightTags: overallScore >= 8 ? ["Clean Room", "Polite Staff"] : ["Slow Dining Service", "Mixed Up Order"],
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-brand-700 bg-brand-950 p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-brand-800/80 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500/20 text-gold-400">
              <MessageSquare size={18} />
            </span>
            <div>
              <h2 className="font-display text-lg text-brand-50">Log Post-Stay Guest Survey</h2>
              <p className="text-xs text-brand-200/60">Capture post-checkout feedback & automate recovery workflows</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-brand-300 hover:bg-brand-800 hover:text-brand-50">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-brand-200/70">Guest Name</label>
              <input
                type="text"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-brand-700 bg-brand-900 px-3 py-2 text-xs text-brand-50 focus:border-gold-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-200/70">Room Number</label>
              <input
                type="text"
                required
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="mt-1 w-full rounded-lg border border-brand-700 bg-brand-900 px-3 py-2 text-xs text-brand-50 focus:border-gold-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-200/70">Survey Channel</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as any)}
              className="mt-1 w-full rounded-lg border border-brand-700 bg-brand-900 px-3 py-2 text-xs text-brand-50 focus:border-gold-500 focus:outline-none"
            >
              <option value="post_stay_email">Post-Stay Automated Email</option>
              <option value="in_stay_qr">In-Room Digital QR Survey</option>
              <option value="whatsapp">Automated WhatsApp Concierge</option>
              <option value="tablet_checkout">Front Desk Tablet at Checkout</option>
            </select>
          </div>

          {/* Overall NPS Score Picker (0 - 10) */}
          <div className="rounded-xl border border-brand-800/80 bg-brand-900/40 p-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-brand-100">
                Net Promoter Score (NPS 1 - 10):
              </label>
              <span
                className={cn(
                  "font-mono font-bold text-sm px-2 py-0.5 rounded",
                  overallScore >= 9
                    ? "bg-emerald-500/20 text-emerald-400"
                    : overallScore >= 7
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-rose-500/20 text-rose-400"
                )}
              >
                {overallScore} / 10 · {overallScore >= 9 ? "Promoter" : overallScore >= 7 ? "Passive" : "Detractor (Triggers Service Recovery)"}
              </span>
            </div>

            <div className="mt-3 flex justify-between gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setOverallScore(num)}
                  className={cn(
                    "h-8 flex-1 rounded border text-xs font-mono font-semibold transition-colors",
                    overallScore === num
                      ? num >= 9
                        ? "border-emerald-500 bg-emerald-500 text-brand-950"
                        : num >= 7
                        ? "border-amber-500 bg-amber-500 text-brand-950"
                        : "border-rose-500 bg-rose-500 text-white"
                      : "border-brand-800 bg-brand-950 text-brand-200 hover:border-brand-700"
                  )}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Department Star Ratings */}
          <div className="rounded-xl border border-brand-800/80 bg-brand-900/40 p-3 space-y-2 text-xs">
            <p className="font-semibold text-brand-200/80 uppercase text-[10px]">
              Departmental Experience (1 to 5 Stars)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between">
                <span className="text-brand-200/70">Cleanliness:</span>
                <select
                  value={cleanliness}
                  onChange={(e) => setCleanliness(parseInt(e.target.value))}
                  className="rounded border border-brand-700 bg-brand-950 px-2 py-1 text-xs text-gold-400"
                >
                  {[5, 4, 3, 2, 1].map((s) => (
                    <option key={s} value={s}>{s} Stars</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-brand-200/70">Food & Dining:</span>
                <select
                  value={dining}
                  onChange={(e) => setDining(parseInt(e.target.value))}
                  className="rounded border border-brand-700 bg-brand-950 px-2 py-1 text-xs text-gold-400"
                >
                  {[5, 4, 3, 2, 1].map((s) => (
                    <option key={s} value={s}>{s} Stars</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-brand-200/70">Front Desk:</span>
                <select
                  value={frontDesk}
                  onChange={(e) => setFrontDesk(parseInt(e.target.value))}
                  className="rounded border border-brand-700 bg-brand-950 px-2 py-1 text-xs text-gold-400"
                >
                  {[5, 4, 3, 2, 1].map((s) => (
                    <option key={s} value={s}>{s} Stars</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-brand-200/70">Room Comfort:</span>
                <select
                  value={comfort}
                  onChange={(e) => setComfort(parseInt(e.target.value))}
                  className="rounded border border-brand-700 bg-brand-950 px-2 py-1 text-xs text-gold-400"
                >
                  {[5, 4, 3, 2, 1].map((s) => (
                    <option key={s} value={s}>{s} Stars</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-brand-200/70">Value for Money:</span>
                <select
                  value={value}
                  onChange={(e) => setValue(parseInt(e.target.value))}
                  className="rounded border border-brand-700 bg-brand-950 px-2 py-1 text-xs text-gold-400"
                >
                  {[5, 4, 3, 2, 1].map((s) => (
                    <option key={s} value={s}>{s} Stars</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-200/70">Guest Remarks & Feedback</label>
            <textarea
              rows={2}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-700 bg-brand-950 p-2 text-xs text-brand-50 focus:border-gold-500 focus:outline-none"
            />
          </div>

          {overallScore <= 6 && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-200">
              <HeartHandshake size={16} className="text-rose-400 shrink-0" />
              <span>
                <strong>Automated Service Recovery Trigger:</strong> Rating is ≤6. System will automatically generate an assigned follow-up ticket for management resolution.
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-brand-800/80 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-brand-700 px-4 py-2 text-xs text-brand-200 hover:bg-brand-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-gold-500 px-5 py-2 text-xs font-semibold text-brand-950 hover:bg-gold-400 transition-colors"
            >
              <Send size={14} /> Submit Guest Survey
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
