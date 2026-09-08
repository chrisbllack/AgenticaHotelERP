import { useMemo, useState } from "react";
import { Card, CardHeader, Badge, Table, Td, EmptyState } from "../components/ui/primitives";
import { PageHeader } from "../components/ui/primitives";
import { usePlatform } from "../store/platform";
import { fmtDate, naira } from "../lib/utils";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { BOOKING_ENABLED, fmtKobo } from "../lib/booking-client";
import type { Id } from "../convex/_generated/dataModel";
import type { Guest } from "../types";
import { CheckCircle2, ExternalLink, Globe, Loader2, Wallet, XCircle } from "lucide-react";
import GuestFlagBadge from "../components/GuestFlagBadge";
import GuestFlagModal from "../components/GuestFlagModal";

const STATUS_BADGE: Record<string, string> = {
  confirmed: "border-sky-400/40 bg-sky-500/10 text-sky-200",
  tentative: "border-amber-400/40 bg-amber-500/10 text-amber-200",
  checked_in: "border-brand-400/40 bg-brand-500/15 text-brand-100",
  checked_out: "border-stone-400/40 bg-stone-500/10 text-stone-300",
  cancelled: "border-rose-400/40 bg-rose-500/10 text-rose-200",
  no_show: "border-rose-400/40 bg-rose-500/10 text-rose-200",
};

export default function ReservationsPage() {
  const { reservations, checkIn, rooms, guests } = usePlatform();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [selectedFlagGuest, setSelectedFlagGuest] = useState<Guest | null>(null);

  // Live website bookings (Convex) — the same data the booking site writes.
  const websiteBookings = useQuery(
    api.booking.listWebsiteBookings,
    BOOKING_ENABLED ? {} : "skip",
  );
  const confirmWebsiteBooking = useMutation(api.ops.confirmWebsiteBooking);
  const recordManualPayment = useMutation(api.ops.recordManualPayment);
  const [opsMessage, setOpsMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return reservations.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!query) return true;
      const g = guests.find((x) => x.id === r.guestId);
      const hay = `${r.confirmationNumber} ${g?.firstName} ${g?.lastName} ${g?.company} ${r.source}`.toLowerCase();
      return hay.includes(query.toLowerCase());
    });
  }, [reservations, statusFilter, query, guests]);

  const counts = {
    all: reservations.length,
    confirmed: reservations.filter((r) => r.status === "confirmed").length,
    checked_in: reservations.filter((r) => r.status === "checked_in").length,
    checked_out: reservations.filter((r) => r.status === "checked_out").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Reservations" subtitle="Booking lifecycle — confirm, check in, track pickup across all channels" />

      <WebsiteBookingsPanel
        bookings={websiteBookings}
        message={opsMessage}
        onConfirm={async (id, code) => {
          try {
            await confirmWebsiteBooking({ reservationId: id });
            setOpsMessage(`Website booking ${code} confirmed.`);
          } catch (err) {
            setOpsMessage(err instanceof Error ? err.message : "Failed to confirm booking.");
          }
        }}
        onPayment={async (id, code) => {
          try {
            const r = await recordManualPayment({ reservationId: id, amountKobo: 2_000_000, method: "pos_terminal" });
            setOpsMessage(`₦20,000 deposit recorded for ${code}. Paid so far: ${fmtKobo(r.paidKobo)}.`);
          } catch (err) {
            setOpsMessage(err instanceof Error ? err.message : "Failed to record payment.");
          }
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        {(["all", "confirmed", "checked_in", "checked_out"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg border px-3.5 py-1.5 text-sm capitalize ${
              statusFilter === s
                ? "border-brand-400/50 bg-brand-500/20 font-medium text-brand-50"
                : "border-brand-800/80 bg-brand-900/40 text-brand-100/70 hover:border-brand-600"
            }`}
          >
            {s.replace("_", " ")} <span className="ml-1 text-xs text-brand-200/50">{counts[s]}</span>
          </button>
        ))}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search guest, company, confirmation #, source…"
          className="ml-auto w-full max-w-xs rounded-lg border border-brand-800 bg-brand-950/70 px-3 py-2 text-sm text-brand-50 outline-none focus:border-brand-500"
        />
      </div>

      <Card>
        <CardHeader title={`${filtered.length} reservation${filtered.length === 1 ? "" : "s"}`} subtitle="Sorted by arrival date" />
        {filtered.length === 0 ? (
          <EmptyState title="No reservations match" hint="Try clearing the search or filter." />
        ) : (
          <Table head={["Confirmation", "Guest", "Flags / Risk", "Stay", "Party", "Room", "Source", "Value", "Status", ""]}>
            {filtered.map((r) => {
              const g = guests.find((x) => x.id === r.guestId);
              return (
                <tr key={r.id} className="hover:bg-brand-800/30">
                  <Td><span className="font-mono text-xs text-gold-300">{r.confirmationNumber}</span></Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-brand-50">{g?.firstName} {g?.lastName}</span>
                      {r.isVip ? <Badge className="border-gold-500/40 bg-gold-500/10 text-gold-300 text-[10px]">VIP</Badge> : null}
                    </div>
                    <span className="block text-xs text-brand-200/50">{g?.company}</span>
                  </Td>
                  <Td>
                    {g?.flags && g.flags.length > 0 ? (
                      <GuestFlagBadge
                        flags={g.flags}
                        blacklistReason={g.blacklistReason}
                        onEditClick={() => setSelectedFlagGuest(g)}
                      />
                    ) : (
                      <button
                        onClick={() => setSelectedFlagGuest(g || null)}
                        className="text-[11px] text-brand-300/40 hover:text-brand-200 transition"
                      >
                        + Add Flag
                      </button>
                    )}
                  </Td>
                  <Td>{fmtDate(r.arrivalDate)} → {fmtDate(r.departureDate)}<span className="block text-xs text-brand-200/50">{r.nights} nights</span></Td>
                  <Td>{r.adults}A {r.children}C</Td>
                  <Td>{rooms.find((rm) => rm.id === r.roomId)?.number ?? "—"}</Td>
                  <Td>{r.source}</Td>
                  <Td>{naira(r.totalEstimate)}<span className="block text-xs text-emerald-300/80">dep. {naira(r.depositPaid, true)}</span></Td>
                  <Td><Badge className={STATUS_BADGE[r.status]}>{r.status.replace("_", " ")}</Badge></Td>
                  <Td>
                    {r.status === "confirmed" && r.roomId ? (
                      <button onClick={() => checkIn(r.id)} className="flex items-center gap-1.5 rounded-lg bg-brand-500/30 px-3 py-1.5 text-xs font-medium text-brand-50 ring-1 ring-brand-400/40 hover:bg-brand-500/50">
                        <CheckCircle2 size={13} /> Check in
                      </button>
                    ) : r.status === "confirmed" ? (
                      <span className="flex items-center gap-1.5 text-xs text-brand-200/50"><XCircle size={13} /> needs room</span>
                    ) : null}
                  </Td>
                </tr>
              );
            })}
          </Table>
        )}
      </Card>

      <GuestFlagModal
        isOpen={Boolean(selectedFlagGuest)}
        guest={selectedFlagGuest}
        onClose={() => setSelectedFlagGuest(null)}
      />
    </div>
  );
}

// ── Live website bookings (Convex) ───────────────────────────────────────

interface WebsiteBookingRow {
  _id: Id<"reservations">;
  code: string;
  status: string;
  guestName: string;
  guestEmail: string;
  roomTypeName: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  totalKobo: number;
  paidKobo: number;
  paymentStatus: string;
}

function WebsiteBookingsPanel({
  bookings, message, onConfirm, onPayment,
}: {
  bookings: WebsiteBookingRow[] | undefined;
  message: string | null;
  onConfirm: (id: WebsiteBookingRow["_id"], code: string) => Promise<void>;
  onPayment: (id: WebsiteBookingRow["_id"], code: string) => Promise<void>;
}) {
  if (!BOOKING_ENABLED) return null;

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Globe size={15} className="text-gold-400" /> Live website bookings
          </span>
        }
        subtitle="Created through the integrated booking website — reactively updated"
        action={
          <a
            href="/book"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-brand-700 px-3 py-1.5 text-xs text-brand-100/80 transition hover:border-gold-500/40 hover:text-gold-300"
          >
            <ExternalLink size={12} /> Open booking site
          </a>
        }
      />
      {message ? (
        <div className="border-b border-brand-800/60 bg-gold-500/10 px-5 py-2.5 text-xs text-gold-200">{message}</div>
      ) : null}
      {bookings === undefined ? (
        <div className="flex items-center gap-2 px-5 py-6 text-sm text-brand-200/60">
          <Loader2 size={15} className="animate-spin" /> Syncing website bookings…
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          title="No website bookings yet"
          hint="Bookings made on the public booking site appear here instantly."
        />
      ) : (
        <Table head={["Confirmation", "Guest", "Stay", "Value", "Payment", "Status", ""]}>
          {bookings.map((b) => (
            <tr key={b._id} className="hover:bg-brand-800/30">
              <Td><span className="font-mono text-xs text-gold-300">{b.code}</span></Td>
              <Td>
                <span className="font-medium text-brand-50">{b.guestName}</span>
                <span className="block text-xs text-brand-200/50">{b.guestEmail}</span>
              </Td>
              <Td>
                {fmtDate(b.checkInDate)} → {fmtDate(b.checkOutDate)}
                <span className="block text-xs text-brand-200/50">{b.roomTypeName} · {b.nights} nights</span>
              </Td>
              <Td>{fmtKobo(b.totalKobo)}</Td>
              <Td>
                <span className={`text-xs font-medium capitalize ${
                  b.paymentStatus === "paid" ? "text-emerald-300" : b.paymentStatus === "partial" ? "text-amber-300" : "text-brand-200/60"
                }`}>
                  {b.paymentStatus}
                </span>
                <span className="block text-xs text-brand-200/50">{fmtKobo(b.paidKobo)} received</span>
              </Td>
              <Td><Badge className={STATUS_BADGE[b.status] ?? "border-brand-700 bg-brand-900/50 text-brand-100"}>{b.status.replace("_", " ")}</Badge></Td>
              <Td>
                <div className="flex items-center gap-1.5">
                  {b.status === "pending" ? (
                    <button
                      onClick={() => onConfirm(b._id, b.code)}
                      className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2.5 py-1.5 text-xs font-medium text-emerald-200 ring-1 ring-emerald-400/30 hover:bg-emerald-500/30"
                    >
                      <CheckCircle2 size={12} /> Confirm
                    </button>
                  ) : null}
                  {b.paymentStatus !== "paid" && (b.status === "pending" || b.status === "confirmed") ? (
                    <button
                      onClick={() => onPayment(b._id, b.code)}
                      className="flex items-center gap-1 rounded-lg bg-brand-500/25 px-2.5 py-1.5 text-xs font-medium text-brand-50 ring-1 ring-brand-400/40 hover:bg-brand-500/40"
                    >
                      <Wallet size={12} /> ₦20k deposit
                    </button>
                  ) : null}
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </Card>
  );
}
