import { useMemo, useState } from "react";
import { Card, CardHeader, Badge, StatCard } from "../components/ui/primitives";
import { PageHeader } from "../components/ui/primitives";
import { usePlatform } from "../store/platform";
import { roomTypes } from "../data/demo";
import { cn, ROOM_STATUS } from "../lib/utils";

export default function RoomsPage() {
  const { rooms } = usePlatform();
  const [floor, setFloor] = useState<string>("all");

  const floors = useMemo(() => Array.from(new Set(rooms.map((r) => r.floorId))).sort(), [rooms]);
  const shown = floor === "all" ? rooms : rooms.filter((r) => r.floorId === floor);
  const occupied = rooms.filter((r) => r.status.startsWith("occupied")).length;
  const ooo = rooms.filter((r) => r.status === "out_of_order" || r.status === "out_of_service").length;

  const tileClass = (status: string) =>
    status.startsWith("occupied")
      ? "border-brand-400/40 bg-brand-600/25 text-brand-50"
      : status === "vacant_clean"
        ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
        : status === "vacant_dirty"
          ? "border-stone-500/40 bg-stone-500/10 text-stone-200"
          : status === "reserved"
            ? "border-sky-400/40 bg-sky-500/10 text-sky-100"
            : "border-rose-400/40 bg-rose-500/10 text-rose-100";

  return (
    <div className="space-y-6">
      <PageHeader title="Room Rack" subtitle="Live room inventory — status engine across 5 floors" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Rooms" value={String(rooms.length)} sub="4 room types" />
        <StatCard label="Occupied" value={String(occupied)} sub={`${Math.round((occupied / rooms.length) * 100)}% occupancy`} accent="gold" />
        <StatCard label="Vacant Clean" value={String(rooms.filter((r) => r.status === "vacant_clean").length)} sub="ready to sell" accent="emerald" />
        <StatCard label="Out of Order" value={String(ooo)} sub="blocked from sale" accent="rose" />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFloor("all")}
          className={cn(
            "rounded-lg border px-3.5 py-1.5 text-sm",
            floor === "all" ? "border-brand-400/50 bg-brand-500/20 font-medium text-brand-50" : "border-brand-800/80 bg-brand-900/40 text-brand-100/70 hover:border-brand-600",
          )}
        >
          All floors
        </button>
        {floors.map((f) => (
          <button
            key={f}
            onClick={() => setFloor(f)}
            className={cn(
              "rounded-lg border px-3.5 py-1.5 text-sm capitalize",
              floor === f ? "border-brand-400/50 bg-brand-500/20 font-medium text-brand-50" : "border-brand-800/80 bg-brand-900/40 text-brand-100/70 hover:border-brand-600",
            )}
          >
            Floor {f.replace("floor-", "")}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Floor Map"
          subtitle="Hover a tile for full status — legend on the right"
          action={
            <div className="hidden flex-wrap gap-1.5 sm:flex">
              {Object.entries(ROOM_STATUS).map(([k, meta]) => (
                <Badge key={k} className={meta.chip}>
                  <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} /> {meta.short}
                </Badge>
              ))}
            </div>
          }
        />
        <div className="space-y-5 p-5">
          {floors
            .filter((f) => floor === "all" || floor === f)
            .map((f) => (
              <div key={f}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-200/50">
                  Floor {f.replace("floor-", "")}
                </p>
                <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                  {shown
                    .filter((r) => r.floorId === f)
                    .map((r) => {
                      const rt = roomTypes.find((t) => t.id === r.roomTypeId);
                      return (
                        <div
                          key={r.id}
                          title={`${ROOM_STATUS[r.status]?.label} · ${rt?.name ?? "Room"}`}
                          className={cn("cursor-default rounded-lg border px-2 py-2 text-center transition-transform hover:scale-105", tileClass(r.status))}
                        >
                          <p className="text-sm font-semibold">{r.number}</p>
                          <p className="mt-0.5 text-[9px] uppercase tracking-wide opacity-70">{ROOM_STATUS[r.status]?.short}</p>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Room Type Mix" subtitle="Rate card and inventory per type" />
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {roomTypes.map((rt) => {
            const count = rooms.filter((r) => r.roomTypeId === rt.id).length;
            return (
              <div key={rt.id} className="rounded-lg border border-brand-800/70 bg-brand-950/50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-brand-50">{rt.name}</p>
                  <Badge className="border-brand-700 bg-brand-900 text-brand-100">{rt.code}</Badge>
                </div>
                <p className="mt-2 font-display text-xl text-gold-400">₦{rt.baseRate.toLocaleString()}</p>
                <p className="mt-1 text-xs text-brand-200/60">{count} rooms · max {rt.maxOccupancy} guests</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
