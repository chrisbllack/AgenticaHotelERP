import { useState } from "react";
import { Card, Badge, StatCard } from "../ui/primitives";
import { usePlatform } from "../../store/platform";
import { naira } from "../../lib/utils";
import type { BanquetEventOrder } from "../../types";
import {
  Calendar,
  Users,
  MapPin,
  Plus,
} from "lucide-react";

export function BanquetEventOrdersView() {
  const { banquetOrders, createBanquetOrder } = usePlatform();
  const [selectedBeo, setSelectedBeo] = useState<BanquetEventOrder | null>(
    banquetOrders[0] || null
  );
  const [showNewModal, setShowNewModal] = useState(false);
  const [clientName, setClientName] = useState("");
  const [eventName, setEventName] = useState("");
  const [venue, setVenue] = useState("Grand Eko Ballroom");
  const [eventDate, setEventDate] = useState("2026-09-15");
  const [pax, setPax] = useState(200);
  const [amount, setAmount] = useState(12000000);

  const totalContractValue = banquetOrders.reduce((acc, b) => acc + b.contractAmount, 0);
  const totalDeposits = banquetOrders.reduce((acc, b) => acc + b.depositPaid, 0);

  const handleCreateBeo = (e: React.FormEvent) => {
    e.preventDefault();
    createBanquetOrder({
      beoNumber: `BEO-2026-${Math.floor(100 + Math.random() * 900)}`,
      clientName,
      eventName,
      eventDate,
      venue,
      expectedPax: pax,
      guaranteedPax: Math.round(pax * 0.95),
      menuPackage: "Executive 4-Course Gala Buffet",
      contractAmount: amount,
      depositPaid: Math.round(amount * 0.5),
      status: "definite",
      avRequirements: ["Projector 4K", "Podium Mic", "Surround PA", "Stage Lighting"],
    });
    setShowNewModal(false);
    setClientName("");
    setEventName("");
  };

  return (
    <div className="space-y-6">
      {/* BEO Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Banquet Pipeline"
          value={naira(totalContractValue, true)}
          sub={`${banquetOrders.length} Confirmed Gala Events`}
          accent="gold"
        />
        <StatCard
          label="Advance Deposits"
          value={naira(totalDeposits, true)}
          sub="Locked in escrow"
          accent="emerald"
        />
        <StatCard
          label="Guaranteed Covers"
          value={String(banquetOrders.reduce((a, b) => a + b.guaranteedPax, 0))}
          sub="Catering production target"
          accent="sky"
        />
        <StatCard
          label="Venues Utilized"
          value="Grand Ballroom · Terrace"
          sub="High weekend occupancy"
        />
      </div>

      {/* Header and New BEO button */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-800/80 bg-brand-900/60 p-3">
        <span className="text-xs text-brand-300">
          Banquet Event Orders (BEO) synchronize F&amp;B Kitchen Production, Audio-Visual, and Service Staff.
        </span>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-3 py-1.5 text-xs font-semibold text-brand-950 hover:bg-gold-400 transition"
        >
          <Plus size={14} />
          Create New BEO
        </button>
      </div>

      {/* BEO Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left BEO List */}
        <Card className="lg:col-span-5 p-0">
          <div className="border-b border-brand-800/80 bg-brand-900/60 p-4">
            <h3 className="font-display font-semibold text-brand-50">Active BEO Contracts</h3>
          </div>
          <div className="divide-y divide-brand-800/40">
            {banquetOrders.map((b) => {
              const isSelected = b.id === selectedBeo?.id;
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedBeo(b)}
                  className={`w-full text-left p-4 transition ${
                    isSelected
                      ? "bg-brand-800/60 border-l-4 border-l-gold-400"
                      : "hover:bg-brand-800/20"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-gold-300 font-semibold">
                          {b.beoNumber}
                        </span>
                        <Badge
                          className={
                            b.status === "definite"
                              ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300 text-[10px]"
                              : "border-sky-400/40 bg-sky-500/10 text-sky-300 text-[10px]"
                          }
                        >
                          {b.status.toUpperCase()}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-sm text-brand-50 mt-1">{b.eventName}</h4>
                      <p className="text-xs text-brand-200/60">{b.clientName}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-sm font-semibold text-brand-100">
                        {naira(b.contractAmount, true)}
                      </span>
                      <p className="text-[11px] text-brand-300/60 mt-0.5">{b.eventDate}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Right BEO Spec Card */}
        {selectedBeo && (
          <Card className="lg:col-span-7">
            <div className="flex flex-wrap items-start justify-between border-b border-brand-800/80 p-5">
              <div>
                <span className="font-mono text-xs text-gold-300 font-semibold">
                  {selectedBeo.beoNumber} · Banquet Event Order
                </span>
                <h2 className="text-xl font-display font-bold text-brand-50 mt-1">
                  {selectedBeo.eventName}
                </h2>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-brand-200/70">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-brand-400" />
                    Date: {selectedBeo.eventDate}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-brand-400" />
                    Venue: {selectedBeo.venue}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users size={13} className="text-brand-400" />
                    Guaranteed: {selectedBeo.guaranteedPax} Pax (Exp: {selectedBeo.expectedPax})
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-brand-200/60">Contract Value</span>
                <p className="font-display text-2xl font-bold text-gold-300">
                  {naira(selectedBeo.contractAmount)}
                </p>
                <p className="text-xs text-emerald-400 font-mono">
                  Deposit: {naira(selectedBeo.depositPaid)}
                </p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-300 mb-1">
                  Catering &amp; Menu Package
                </h4>
                <p className="text-sm font-medium text-brand-100 bg-brand-950/50 p-3 rounded-lg border border-brand-800/60">
                  {selectedBeo.menuPackage}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-300 mb-2">
                  Staging &amp; Audio-Visual Setup
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedBeo.avRequirements.map((av, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg border border-brand-700 bg-brand-900/80 px-2.5 py-1 text-xs text-brand-200"
                    >
                      ✓ {av}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/15 p-3 text-xs text-emerald-300 space-y-1">
                <div className="font-semibold">Event Ops Signoff:</div>
                <p>
                  Kitchen head chef, banquet captain, and AV sound technician have acknowledged setup timeline.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* New BEO Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleCreateBeo}
            className="w-full max-w-md rounded-xl border border-brand-700 bg-brand-900 p-6 shadow-2xl space-y-4"
          >
            <h3 className="text-lg font-display font-semibold text-brand-50">
              Create Banquet Event Order
            </h3>

            <div>
              <label className="block text-xs font-medium text-brand-200 mb-1">Client Name</label>
              <input
                required
                type="text"
                placeholder="e.g. TotalEnergies E&P Nigeria"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm text-brand-50 focus:border-gold-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-brand-200 mb-1">Event Name</label>
              <input
                required
                type="text"
                placeholder="e.g. Annual Directors' Gala Dinner"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className="w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm text-brand-50 focus:border-gold-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-brand-200 mb-1">Date</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm text-brand-50 focus:border-gold-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-200 mb-1">Venue</label>
                <select
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm text-brand-50 focus:border-gold-400 focus:outline-none"
                >
                  <option value="Grand Eko Ballroom">Grand Eko Ballroom</option>
                  <option value="Lagoon Terrace Pavilion">Lagoon Terrace Pavilion</option>
                  <option value="Skyline Executive Boardroom">Skyline Executive Boardroom</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-brand-200 mb-1">Expected Pax</label>
                <input
                  type="number"
                  value={pax}
                  onChange={(e) => setPax(Number(e.target.value))}
                  className="w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm text-brand-50 focus:border-gold-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-brand-200 mb-1">Contract (₦)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full rounded-lg border border-brand-700 bg-brand-950 px-3 py-2 text-sm text-brand-50 focus:border-gold-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="rounded-lg border border-brand-700 px-4 py-2 text-xs font-medium text-brand-200 hover:bg-brand-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-gold-500 px-4 py-2 text-xs font-semibold text-brand-950 hover:bg-gold-400 shadow"
              >
                Confirm BEO Contract
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
