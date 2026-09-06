import { useMemo, useState } from "react";
import { Card, CardHeader, Badge, Table, Td, EmptyState, StatCard } from "../components/ui/primitives";
import { PageHeader } from "../components/ui/primitives";
import { usePlatform, type WalkInInput } from "../store/platform";
import { guests as seedGuests, rooms as seedRooms } from "../data/demo";
import { fmtDate, naira, todayISO } from "../lib/utils";
import { LogIn, LogOut, UserPlus, ReceiptText, Wallet } from "lucide-react";

type Tab = "arrivals" | "inhouse" | "departures" | "walkin";

export default function FrontDeskPage() {
  const { reservations, stays, folios, folioLines, checkIn, checkOut, createWalkIn, postCharge, postPayment, rooms } = usePlatform();
  const [tab, setTab] = useState<Tab>("arrivals");
  const [message, setMessage] = useState<string | null>(null);
  const [walkIn, setWalkIn] = useState<WalkInInput>({ firstName: "", lastName: "", phone: "", roomId: "", nights: 1, rate: 25000 });
  const [chargeFolio, setChargeFolio] = useState<string | null>(null);
  const [chargeDesc, setChargeDesc] = useState("");
  const [chargeAmt, setChargeAmt] = useState("");

  const guests = seedGuests;
  const allRooms = rooms.length ? rooms : seedRooms;

  const arrivals = useMemo(
    () => reservations.filter((r) => r.status === "confirmed" && r.arrivalDate <= todayISO),
    [reservations],
  );
  const inHouse = useMemo(() => reservations.filter((r) => r.status === "checked_in"), [reservations]);
  const departures = useMemo(
    () => reservations.filter((r) => r.status === "checked_in" && r.departureDate <= todayISO),
    [reservations],
  );

  const folioFor = (reservationId: string) => {
    const stay = stays.find((s) => s.reservationId === reservationId);
    if (!stay) return null;
    const folio = folios.find((f) => f.guestStayId === stay.id);
    if (!folio) return null;
    const lines = folioLines.filter((l) => l.folioId === folio.id);
    return { folio, lines };
  };

  const doCheckIn = (id: string) => {
    checkIn(id);
    setMessage(`Checked in ${id.replace("res-", "CN-")} — key encoded, folio opened.`);
  };

  const doCheckOut = (id: string) => {
    checkOut(id);
    setMessage(`Checked out ${id.replace("res-", "CN-")} — folio settled, room queued for cleaning.`);
  };

  const submitWalkIn = () => {
    if (!walkIn.firstName || !walkIn.lastName || !walkIn.roomId) {
      setMessage("First name, last name and room are required for a walk-in.");
      return;
    }
    const res = createWalkIn(walkIn);
    checkIn(res.id);
    setMessage(`Walk-in created — ${res.confirmationNumber} checked into room ${allRooms.find((r) => r.id === walkIn.roomId)?.number}.`);
    setWalkIn({ firstName: "", lastName: "", phone: "", roomId: "", nights: 1, rate: 25000 });
  };

  const vacantRooms = allRooms.filter((r) => r.status === "vacant_clean" || r.status === "vacant_dirty");

  const tabs: Array<[Tab, string, number]> = [
    ["arrivals", "Arrivals", arrivals.length],
    ["inhouse", "In-House", inHouse.length],
    ["departures", "Departures", departures.length],
    ["walkin", "Walk-in", 0],
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Front Desk" subtitle="Arrivals · in-house · departures — check-in/out, folios, walk-ins" />

      {message ? (
        <div className="rounded-lg border border-gold-500/40 bg-gold-500/10 px-4 py-2.5 text-sm text-gold-200">
          {message}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Arrivals" value={String(arrivals.length)} sub="expected today" accent="gold" />
        <StatCard label="In-House" value={String(inHouse.length)} sub="occupied rooms" />
        <StatCard label="Departures" value={String(departures.length)} sub="due out today" />
        <StatCard label="Vacant Clean" value={String(allRooms.filter((r) => r.status === "vacant_clean").length)} sub="ready to sell" accent="emerald" />
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
              tab === key
                ? "border-brand-400/50 bg-brand-500/20 font-medium text-brand-50"
                : "border-brand-800/80 bg-brand-900/40 text-brand-100/70 hover:border-brand-600"
            }`}
          >
            {label}
            {count > 0 ? <span className="ml-2 rounded-full bg-brand-800/80 px-1.5 text-[11px] text-brand-100/80">{count}</span> : null}
          </button>
        ))}
      </div>

      {tab === "arrivals" ? (
        <Card>
          <CardHeader title="Expected Arrivals" subtitle="Confirm, assign and check in" />
          {arrivals.length === 0 ? (
            <EmptyState title="No arrivals pending" hint="All expected guests have been processed." />
          ) : (
            <Table head={["Confirmation", "Guest", "Party", "Room", "Stay", "Balance", ""]}>
              {arrivals.map((r) => {
                const g = guests.find((x) => x.id === r.guestId);
                return (
                  <tr key={r.id} className="hover:bg-brand-800/30">
                    <Td><span className="font-mono text-xs text-gold-300">{r.confirmationNumber}</span>{r.isVip ? <Badge className="ml-2 border-gold-500/40 bg-gold-500/10 text-gold-300">VIP</Badge> : null}</Td>
                    <Td>{g?.firstName} {g?.lastName}<span className="block text-xs text-brand-200/50">{g?.company}</span></Td>
                    <Td>{r.adults}A {r.children}C</Td>
                    <Td>{allRooms.find((rm) => rm.id === r.roomId)?.number ?? "—"}</Td>
                    <Td>{fmtDate(r.arrivalDate)} → {fmtDate(r.departureDate)}<span className="block text-xs text-brand-200/50">{r.nights} nights</span></Td>
                    <Td>{naira(r.totalEstimate - r.depositPaid)}</Td>
                    <Td>
                      <button onClick={() => doCheckIn(r.id)} className="flex items-center gap-1.5 rounded-lg bg-brand-500/30 px-3 py-1.5 text-xs font-medium text-brand-50 ring-1 ring-brand-400/40 transition-colors hover:bg-brand-500/50">
                        <LogIn size={13} /> Check in
                      </button>
                    </Td>
                  </tr>
                );
              })}
            </Table>
          )}
        </Card>
      ) : null}

      {tab === "inhouse" ? (
        <Card>
          <CardHeader title="In-House Guests" subtitle="Post charges & payments to open folios" />
          <Table head={["Guest", "Room", "Departing", "Folio", "Balance", ""]}>
            {inHouse.map((r) => {
              const g = guests.find((x) => x.id === r.guestId);
              const f = folioFor(r.id);
              return (
                <tr key={r.id} className="hover:bg-brand-800/30">
                  <Td>{g?.firstName} {g?.lastName}</Td>
                  <Td>{allRooms.find((rm) => rm.id === r.roomId)?.number}</Td>
                  <Td>{fmtDate(r.departureDate)}</Td>
                  <Td>{f ? <span className="font-mono text-xs text-brand-100/80">{f.folio.folioNumber}</span> : "—"}</Td>
                  <Td>{f ? naira(f.folio.balance) : "—"}</Td>
                  <Td>
                    {f ? (
                      <button
                        onClick={() => { setChargeFolio(f.folio.id); setChargeDesc(""); setChargeAmt(""); }}
                        className="flex items-center gap-1.5 rounded-lg border border-brand-700 px-3 py-1.5 text-xs text-brand-100 hover:border-brand-500"
                      >
                        <ReceiptText size={13} /> Folio
                      </button>
                    ) : null}
                  </Td>
                </tr>
              );
            })}
          </Table>
        </Card>
      ) : null}

      {tab === "departures" ? (
        <Card>
          <CardHeader title="Departures Due" subtitle="Settle folio, check out, release room" />
          {departures.length === 0 ? (
            <EmptyState title="No departures pending" hint="Every due-out guest has left." />
          ) : (
            <Table head={["Confirmation", "Guest", "Room", "Folio balance", ""]}>
              {departures.map((r) => {
                const g = guests.find((x) => x.id === r.guestId);
                const f = folioFor(r.id);
                return (
                  <tr key={r.id} className="hover:bg-brand-800/30">
                    <Td><span className="font-mono text-xs text-gold-300">{r.confirmationNumber}</span></Td>
                    <Td>{g?.firstName} {g?.lastName}</Td>
                    <Td>{allRooms.find((rm) => rm.id === r.roomId)?.number}</Td>
                    <Td>{f ? naira(f.folio.balance) : "—"}</Td>
                    <Td>
                      <button onClick={() => doCheckOut(r.id)} className="flex items-center gap-1.5 rounded-lg bg-brand-500/30 px-3 py-1.5 text-xs font-medium text-brand-50 ring-1 ring-brand-400/40 hover:bg-brand-500/50">
                        <LogOut size={13} /> Check out
                      </button>
                    </Td>
                  </tr>
                );
              })}
            </Table>
          )}
        </Card>
      ) : null}

      {tab === "walkin" ? (
        <Card className="max-w-2xl">
          <CardHeader title="New Walk-In" subtitle="Create guest, assign room, check in — in one transaction" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-xs text-brand-200/70">First name</span>
              <input value={walkIn.firstName} onChange={(e) => setWalkIn({ ...walkIn, firstName: e.target.value })}
                className="w-full rounded-lg border border-brand-800 bg-brand-950/70 px-3 py-2 text-sm text-brand-50 outline-none focus:border-brand-500" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-brand-200/70">Last name</span>
              <input value={walkIn.lastName} onChange={(e) => setWalkIn({ ...walkIn, lastName: e.target.value })}
                className="w-full rounded-lg border border-brand-800 bg-brand-950/70 px-3 py-2 text-sm text-brand-50 outline-none focus:border-brand-500" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-brand-200/70">Phone</span>
              <input value={walkIn.phone} onChange={(e) => setWalkIn({ ...walkIn, phone: e.target.value })}
                className="w-full rounded-lg border border-brand-800 bg-brand-950/70 px-3 py-2 text-sm text-brand-50 outline-none focus:border-brand-500" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-brand-200/70">Room</span>
              <select value={walkIn.roomId} onChange={(e) => setWalkIn({ ...walkIn, roomId: e.target.value })} className="w-full rounded-lg border border-brand-800 bg-brand-950/70 px-3 py-2 text-sm text-brand-50 outline-none focus:border-brand-500">
                <option value="">Select vacant room…</option>
                {vacantRooms.map((r) => (
                  <option key={r.id} value={r.id}>Room {r.number}</option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-brand-200/70">Nights</span>
              <input type="number" min={1} max={30} value={walkIn.nights} onChange={(e) => setWalkIn({ ...walkIn, nights: Math.max(1, Number(e.target.value)) })}
                className="w-full rounded-lg border border-brand-800 bg-brand-950/70 px-3 py-2 text-sm text-brand-50 outline-none focus:border-brand-500" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs text-brand-200/70">Nightly rate (₦)</span>
              <input type="number" min={0} step={500} value={walkIn.rate} onChange={(e) => setWalkIn({ ...walkIn, rate: Number(e.target.value) })}
                className="w-full rounded-lg border border-brand-800 bg-brand-950/70 px-3 py-2 text-sm text-brand-50 outline-none focus:border-brand-500" />
            </label>
          </div>
          <div className="border-t border-brand-800/70 px-5 py-4">
            <button onClick={submitWalkIn} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-500 to-brand-700 px-4 py-2 text-sm font-medium text-white ring-1 ring-brand-400/40 hover:from-brand-400 hover:to-brand-600">
              <UserPlus size={15} /> Create & check in
            </button>
          </div>
        </Card>
      ) : null}

      {chargeFolio ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setChargeFolio(null)}>
          <div className="w-full max-w-md animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <Card>
              <CardHeader title={`Folio — ${folios.find((f) => f.id === chargeFolio)?.folioNumber}`} subtitle="Post charges and take payment" />
              <div className="max-h-64 space-y-1.5 overflow-y-auto px-5 py-4">
                {folioLines.filter((l) => l.folioId === chargeFolio).length === 0 ? (
                  <p className="py-6 text-center text-xs text-brand-200/50">Session charges appear here as they are posted.</p>
                ) : (
                  folioLines.filter((l) => l.folioId === chargeFolio).map((l, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className={l.type === "credit" ? "text-emerald-300" : "text-brand-100/90"}>{l.description}</span>
                      <span className={l.type === "credit" ? "text-emerald-300" : "text-brand-50"}>{naira(l.amount)}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-brand-800/70 px-5 py-4">
                <p className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-brand-200/70">Balance due</span>
                  <span className="flex items-center gap-1.5 font-display text-lg text-gold-400"><Wallet size={15} />{naira(folios.find((f) => f.id === chargeFolio)?.balance ?? 0)}</span>
                </p>
                <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                  <input placeholder="e.g. Laundry, Minibar, Restaurant 42" value={chargeDesc} onChange={(e) => setChargeDesc(e.target.value)}
                    className="rounded-lg border border-brand-800 bg-brand-950/70 px-3 py-2 text-sm text-brand-50 outline-none focus:border-brand-500" />
                  <input placeholder="₦" type="number" value={chargeAmt} onChange={(e) => setChargeAmt(e.target.value)}
                    className="w-24 rounded-lg border border-brand-800 bg-brand-950/70 px-3 py-2 text-sm text-brand-50 outline-none focus:border-brand-500" />
                  <button
                    onClick={() => {
                      const amt = Number(chargeAmt);
                      if (!chargeDesc || !amt) return;
                      postCharge(chargeFolio, chargeDesc, amt);
                      setChargeDesc(""); setChargeAmt("");
                    }}
                    className="rounded-lg border border-brand-600 px-3 py-2 text-xs font-medium text-brand-50 hover:bg-brand-800/60"
                  >
                    Post
                  </button>
                </div>
                <button
                  onClick={() => {
                    const bal = folios.find((f) => f.id === chargeFolio)?.balance ?? 0;
                    if (bal < 0) postPayment(chargeFolio, -bal);
                  }}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 px-4 py-2 text-sm font-semibold text-brand-950 hover:from-gold-400 hover:to-gold-500"
                >
                  <Wallet size={15} /> Settle balance in full
                </button>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
