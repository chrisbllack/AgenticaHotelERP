import { useState } from "react";
import type { LostAndFoundItem } from "../types";
import { usePlatform } from "../store/platform";
import { naira } from "../lib/utils";
import {
  CheckCircle2,
  Mail,
  Package,
  Send,
  X,
} from "lucide-react";
import { cn } from "../lib/utils";

interface LostAndFoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "log" | "claim" | "dispose";
  itemToClaim?: LostAndFoundItem | null;
}

export default function LostAndFoundModal({
  isOpen,
  onClose,
  mode,
  itemToClaim,
}: LostAndFoundModalProps) {
  const { guests, rooms, createLostAndFoundItem, updateLostAndFoundStatus, sendLostAndFoundEmail, businessDate } =
    usePlatform();

  // Log Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState<LostAndFoundItem["category"]>("Electronics");
  const [description, setDescription] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [locationFound, setLocationFound] = useState("");
  const [foundByStaffName, setFoundByStaffName] = useState("Blessing Effiong (Housekeeper)");
  const [foundDate, setFoundDate] = useState(businessDate || "2026-09-05");
  const [estimatedValue, setEstimatedValue] = useState<number>(50000);
  const [storageLocker, setStorageLocker] = useState("Locker HK-A04");
  const [linkedGuestId, setLinkedGuestId] = useState("");
  const [logNotes, setLogNotes] = useState("");

  // Claim & Email State
  const [claimedBy, setClaimedBy] = useState(itemToClaim?.guestName || "");
  const [guestEmail, setGuestEmail] = useState(itemToClaim?.guestEmail || "");
  const [guestPhone, setGuestPhone] = useState(itemToClaim?.guestPhone || "");
  const [returnedByStaff, setReturnedByStaff] = useState("Chidi Amadi (Front Desk Manager)");
  const [emailSubject, setEmailSubject] = useState(
    `Grand Palm Hotel Lagos — Lost & Found Claim Confirmation [${itemToClaim?.itemNumber || "Item"}]`
  );
  const [emailBody, setEmailBody] = useState(
    `Dear ${itemToClaim?.guestName || "Valued Guest"},\n\nWe are pleased to inform you that your item (${itemToClaim?.name || "lost item"}) has been successfully logged and claimed under reference #${itemToClaim?.itemNumber || "LF-001"}.\n\nLocation: Grand Palm Hotel Front Desk / Concierge Vault.\nPlease present a valid government-issued photo ID upon collection.\n\nWarm regards,\nGrand Palm Hotel Concierge & Guest Services`
  );
  const [sendEmailNotification, setSendEmailNotification] = useState(true);
  const [emailDispatched, setEmailDispatched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Disposal State
  const [disposalReason, setDisposalReason] = useState(
    "Exceeded standard 90-day retention par window. Donated to local charitable organization with GM approval."
  );

  if (!isOpen) return null;

  const handleLogItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const guest = guests.find((g) => g.id === linkedGuestId);

    createLostAndFoundItem({
      name,
      category,
      description,
      roomNumber: roomNumber || undefined,
      locationFound: locationFound || (roomNumber ? `Room ${roomNumber}` : "Public Area"),
      foundByStaffName,
      foundDate,
      estimatedValue,
      storageLocker,
      status: "logged",
      guestId: guest?.id,
      guestName: guest ? `${guest.firstName} ${guest.lastName}` : undefined,
      guestEmail: guest?.email,
      guestPhone: guest?.phone,
      notes: logNotes,
    });

    onClose();
  };

  const handleClaimItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemToClaim) return;
    setIsSubmitting(true);

    if (sendEmailNotification && guestEmail) {
      sendLostAndFoundEmail(itemToClaim.id, guestEmail, emailBody);
      setEmailDispatched(true);
    }

    updateLostAndFoundStatus(itemToClaim.id, "claimed", {
      claimedBy,
      guestEmail,
      returnedByStaff,
    });

    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  const handleDisposeItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemToClaim) return;
    updateLostAndFoundStatus(itemToClaim.id, "disposed", {
      disposalReason,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-xl border border-brand-800 bg-brand-950 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-sky-500/20 p-2 text-sky-400">
              <Package size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-brand-50">
                {mode === "log" && "Log New Found Item (M-HKP)"}
                {mode === "claim" && `Claim & Release Item · ${itemToClaim?.itemNumber}`}
                {mode === "dispose" && `Item Disposal Authorization · ${itemToClaim?.itemNumber}`}
              </h3>
              <p className="text-xs text-brand-200/60">
                {mode === "log" && "Register item recovered by housekeeping or floor attendants with chain of custody"}
                {mode === "claim" && "Verify claimant identity and dispatch automated guest notification"}
                {mode === "dispose" && "Authorized end-of-lifecycle disposal per Lagos State hospitality bylaws"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-brand-200/60 hover:bg-brand-900 hover:text-brand-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* MODE 1: LOG NEW ITEM */}
        {mode === "log" && (
          <form onSubmit={handleLogItem} className="mt-4 space-y-4 text-xs">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block font-medium text-brand-200/80 mb-1">
                  Item Name / Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apple MacBook Pro 14-inch Space Black"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-brand-800 bg-brand-900/50 px-3 py-2 text-brand-100 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-brand-200/80 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as LostAndFoundItem["category"])}
                  className="w-full rounded-lg border border-brand-800 bg-brand-900/50 px-3 py-2 text-brand-100 focus:border-brand-500 focus:outline-none"
                >
                  <option value="Electronics">Electronics</option>
                  <option value="Jewelry & Valuables">Jewelry & Valuables</option>
                  <option value="Clothing & Apparel">Clothing & Apparel</option>
                  <option value="Documents & Passports">Documents & Passports</option>
                  <option value="Bags & Luggage">Bags & Luggage</option>
                  <option value="Keys & Cards">Keys & Cards</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-brand-200/80 mb-1">Estimated Value (₦ NGN)</label>
                <input
                  type="number"
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(Number(e.target.value))}
                  className="w-full rounded-lg border border-brand-800 bg-brand-900/50 px-3 py-2 text-brand-100 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium text-brand-200/80 mb-1">Detailed Physical Description</label>
                <textarea
                  rows={2}
                  placeholder="Include color, brand, condition, serial number fragments, or packaging..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-brand-800 bg-brand-900/50 px-3 py-2 text-brand-100 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-brand-200/80 mb-1">Found in Room (Optional)</label>
                <select
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full rounded-lg border border-brand-800 bg-brand-900/50 px-3 py-2 text-brand-100 focus:border-brand-500 focus:outline-none"
                >
                  <option value="">Public Area / Not in room</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.number}>
                      Room {r.number} ({r.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-brand-200/80 mb-1">Exact Location Found</label>
                <input
                  type="text"
                  placeholder="e.g. Under bed, poolside cabana, lobby sofa"
                  value={locationFound}
                  onChange={(e) => setLocationFound(e.target.value)}
                  className="w-full rounded-lg border border-brand-800 bg-brand-900/50 px-3 py-2 text-brand-100 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-brand-200/80 mb-1">Found Date</label>
                <input
                  type="date"
                  value={foundDate}
                  onChange={(e) => setFoundDate(e.target.value)}
                  className="w-full rounded-lg border border-brand-800 bg-brand-900/50 px-3 py-2 text-brand-100 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-brand-200/80 mb-1">Found By Staff Member</label>
                <input
                  type="text"
                  value={foundByStaffName}
                  onChange={(e) => setFoundByStaffName(e.target.value)}
                  className="w-full rounded-lg border border-brand-800 bg-brand-900/50 px-3 py-2 text-brand-100 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-brand-200/80 mb-1">Storage Locker / Safe ID</label>
                <input
                  type="text"
                  value={storageLocker}
                  onChange={(e) => setStorageLocker(e.target.value)}
                  className="w-full rounded-lg border border-brand-800 bg-brand-900/50 px-3 py-2 text-brand-100 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-brand-200/80 mb-1">Internal Custody Notes</label>
                <input
                  type="text"
                  placeholder="Security tag #, condition details..."
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  className="w-full rounded-lg border border-brand-800 bg-brand-900/50 px-3 py-2 text-brand-100 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium text-brand-200/80 mb-1">Link to Guest Profile (If Known)</label>
                <select
                  value={linkedGuestId}
                  onChange={(e) => setLinkedGuestId(e.target.value)}
                  className="w-full rounded-lg border border-brand-800 bg-brand-900/50 px-3 py-2 text-brand-100 focus:border-brand-500 focus:outline-none"
                >
                  <option value="">Unassigned / Unknown Guest</option>
                  {guests.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.firstName} {g.lastName} ({g.company || g.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-brand-800/80 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-brand-800 px-3.5 py-1.5 text-xs text-brand-200/80 hover:bg-brand-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-sky-400"
              >
                <Package size={14} /> Register Item in Vault
              </button>
            </div>
          </form>
        )}

        {/* MODE 2: CLAIM & RETURN ITEM WITH AUTOMATED EMAIL */}
        {mode === "claim" && itemToClaim && (
          <form onSubmit={handleClaimItem} className="mt-4 space-y-4 text-xs">
            <div className="rounded-lg border border-brand-800/80 bg-brand-900/40 p-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-brand-100 text-sm">{itemToClaim.name}</p>
                  <p className="text-brand-200/70 text-[11px] mt-0.5">{itemToClaim.description}</p>
                </div>
                <span className="rounded bg-sky-500/20 px-2 py-0.5 text-[11px] font-medium text-sky-200">
                  {itemToClaim.category}
                </span>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-brand-200/60 border-t border-brand-800/60 pt-2">
                <span>Location: {itemToClaim.locationFound}</span>
                <span>Storage: {itemToClaim.storageLocker}</span>
                <span>Est. Value: {naira(itemToClaim.estimatedValue || 0)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block font-medium text-brand-200/80 mb-1">
                  Claimant Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={claimedBy}
                  onChange={(e) => setClaimedBy(e.target.value)}
                  placeholder="Full name of person claiming item"
                  className="w-full rounded-lg border border-brand-800 bg-brand-900/50 px-3 py-2 text-brand-100 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-brand-200/80 mb-1">
                  Guest Email (For Automated Dispatch) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="guest@example.com"
                  className="w-full rounded-lg border border-brand-800 bg-brand-900/50 px-3 py-2 text-brand-100 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-brand-200/80 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="+234..."
                  className="w-full rounded-lg border border-brand-800 bg-brand-900/50 px-3 py-2 text-brand-100 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-brand-200/80 mb-1">Releasing Staff Officer</label>
                <input
                  type="text"
                  value={returnedByStaff}
                  onChange={(e) => setReturnedByStaff(e.target.value)}
                  className="w-full rounded-lg border border-brand-800 bg-brand-900/50 px-3 py-2 text-brand-100 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Automated Email Dispatch Section */}
            <div className="rounded-xl border border-sky-500/40 bg-sky-950/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sky-300 font-semibold text-xs">
                  <Mail size={15} />
                  <span>Automated Email Notification Generator</span>
                </div>
                <label className="flex items-center gap-2 text-[11px] text-sky-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendEmailNotification}
                    onChange={(e) => setSendEmailNotification(e.target.checked)}
                    className="rounded border-sky-500 bg-brand-950 text-sky-500 focus:ring-sky-400"
                  />
                  <span>Dispatch Email upon Claim</span>
                </label>
              </div>

              {sendEmailNotification && (
                <div className="space-y-2 text-[11px]">
                  <div>
                    <label className="block font-medium text-sky-200/70 mb-0.5">Subject Line</label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full rounded-md border border-sky-500/30 bg-brand-950 px-2.5 py-1.5 text-brand-100 focus:border-sky-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-sky-200/70 mb-0.5">Notification Body Preview</label>
                    <textarea
                      rows={5}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="w-full rounded-md border border-sky-500/30 bg-brand-950 px-2.5 py-1.5 font-mono text-[11px] leading-relaxed text-brand-100 focus:border-sky-400 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-brand-800/80 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-brand-800 px-3.5 py-1.5 text-xs text-brand-200/80 hover:bg-brand-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !claimedBy.trim()}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold shadow-sm transition-all",
                  emailDispatched
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-500 text-brand-950 hover:bg-emerald-400"
                )}
              >
                {emailDispatched ? (
                  <>
                    <CheckCircle2 size={14} /> Item Claimed & Email Dispatched!
                  </>
                ) : (
                  <>
                    <Send size={14} /> Process Claim & Send Notification
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* MODE 3: DISPOSE ITEM */}
        {mode === "dispose" && itemToClaim && (
          <form onSubmit={handleDisposeItem} className="mt-4 space-y-4 text-xs">
            <div className="rounded-lg border border-amber-500/50 bg-amber-950/30 p-3 text-amber-200 text-xs">
              <p className="font-semibold">Confirm Item Disposal</p>
              <p className="mt-0.5 text-[11px] text-amber-200/80">
                Item <span className="font-mono">{itemToClaim.itemNumber}</span> ({itemToClaim.name}) will be marked as Disposed.
              </p>
            </div>

            <div>
              <label className="block font-medium text-brand-200/80 mb-1">
                Disposal Justification / Method <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={disposalReason}
                onChange={(e) => setDisposalReason(e.target.value)}
                placeholder="State policy window, recycling, or authorized donation details..."
                className="w-full rounded-lg border border-brand-800 bg-brand-900/50 px-3 py-2 text-brand-100 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-brand-800/80 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-brand-800 px-3.5 py-1.5 text-xs text-brand-200/80 hover:bg-brand-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-500"
              >
                Authorize Disposal
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
