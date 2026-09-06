import { Card, CardHeader, StatCard, Badge, Table, Td } from "../components/ui/primitives";
import { PageHeader } from "../components/ui/primitives";
import { usePlatform } from "../store/platform";
import { guests, posOrders, posOrderLines, eventBookings, hardwareDevices, PROPERTY, rooms as seedRooms } from "../data/demo";
import { naira, num, ROOM_STATUS, todayISO } from "../lib/utils";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, Radio } from "lucide-react";

export default function DashboardPage() {
  const { rooms, reservations, tasks } = usePlatform();

  const inHouse = reservations.filter((r) => r.status === "checked_in");
  const arrivalsToday = reservations.filter((r) => r.status === "confirmed" && r.arrivalDate <= todayISO);
  const departuresToday = inHouse.filter((r) => r.departureDate <= todayISO);
  const occupied = rooms.filter((r) => r.status.startsWith("occupied")).length;
  const ooo = rooms.filter((r) => r.status === "out_of_order" || r.status === "out_of_service").length;
  const sellable = rooms.length - ooo;
  const occupancy = Math.round((occupied / sellable) * 100);
  const roomRevenue = inHouse.reduce((a, r) => a + r.totalEstimate / Math.max(r.nights, 1), 0);
  const adr = occupied ? roomRevenue / occupied : 0;
  const revpar = roomRevenue / sellable;
  const posToday = posOrders.reduce((a, o) => a + o.total, 0);
  const covers = posOrderLines.reduce((a, l) => a + l.quantity, 0);
  const dirtyCount = rooms.filter((r) => r.housekeepingStatus === "dirty").length;
  const pendingTasks = tasks.filter((t) => t.status === "pending").length;
  const eventRevenue = eventBookings.filter((e) => e.status === "confirmed").reduce((a, e) => a + e.totalAmount, 0);
  const deviceAlerts = hardwareDevices.filter((d) => d.status !== "online");

  const statusCounts = Object.keys(ROOM_STATUS).map((s) => ({
    status: s,
    count: rooms.filter((r) => r.status === s).length,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Dashboard"
        subtitle={`${PROPERTY.name} · business date 5 Sep 2026 · all figures local, offline-capable`}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Occupancy" value={`${occupancy}%`} sub={`${occupied} of ${sellable} sellable rooms`} accent="gold" />
        <StatCard label="ADR" value={naira(adr, true)} sub="average daily rate" />
        <StatCard label="RevPAR" value={naira(revpar, true)} sub="revenue per available room" />
        <StatCard label="Today's Revenue" value={naira(roomRevenue + posToday, true)} sub={`Rooms ${naira(roomRevenue, true)} · F&B ${naira(posToday, true)}`} accent="emerald" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Rooms Status Board"
            subtitle="Live room state — updates instantly from every module"
            action={
              <Link to="/rooms" className="flex items-center gap-1 text-xs font-medium text-gold-400 hover:text-gold-300">
                Room rack <ArrowRight size={13} />
              </Link>
            }
          />
          <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
            {statusCounts
              .filter((s) => s.count > 0)
              .map((s) => (
                <div key={s.status} className="rounded-lg border border-brand-800/70 bg-brand-950/50 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${ROOM_STATUS[s.status].dot}`} />
                    <p className="text-[11px] text-brand-200/70">{ROOM_STATUS[s.status].label}</p>
                  </div>
                  <p className="mt-1 font-display text-xl text-brand-50">{s.count}</p>
                </div>
              ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Today at the Front Desk" subtitle=" arrivals & departures queues" />
          <div className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-brand-200/60">Arrivals (expected)</p>
                <p className="font-display text-2xl text-brand-50">{arrivalsToday.length}</p>
              </div>
              <Link to="/front-desk" className="rounded-lg border border-brand-700 px-3 py-1.5 text-xs text-brand-100 hover:border-brand-500">
                Open front desk
              </Link>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-brand-200/60">In-house guests</p>
                <p className="font-display text-2xl text-brand-50">{inHouse.length}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-brand-200/60">Departures due</p>
                <p className="font-display text-2xl text-brand-50">{departuresToday.length}</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-brand-800/70 pt-3">
              <div>
                <p className="text-xs text-brand-200/60">Housekeeping load</p>
                <p className="text-sm text-brand-100">{dirtyCount} dirty rooms · {pendingTasks} open tasks</p>
              </div>
              <Link to="/housekeeping" className="text-xs font-medium text-gold-400 hover:text-gold-300">
                Board
              </Link>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="F&B Pulse" subtitle="Point of sale across all outlets" action={<Link to="/pos" className="text-xs font-medium text-gold-400 hover:text-gold-300">POS terminal</Link>} />
          <Table head={["Metric", "Value"]}>
            <tr><Td>F&B revenue today</Td><Td>{naira(posToday)}</Td></tr>
            <tr><Td>Open orders</Td><Td>{posOrders.filter((o) => o.status === "open").length}</Td></tr>
            <tr><Td>Items served (covers)</Td><Td>{num(covers)}</Td></tr>
            <tr><Td>Awaiting payment</Td><Td>{posOrders.filter((o) => o.paymentStatus === "pending").length} orders</Td></tr>
          </Table>
        </Card>

        <Card>
          <CardHeader title="Operations & Alerts" subtitle="Events, devices and distribution" />
          <ul className="divide-y divide-brand-800/50">
            <li className="flex items-center gap-3 px-5 py-3">
              <Badge className="border-gold-500/40 bg-gold-500/10 text-gold-300">{eventBookings.filter((e) => e.status === "confirmed").length} confirmed</Badge>
              <span className="text-sm text-brand-100/90">Events booked — {naira(eventRevenue, true)} on the diary</span>
              <Link to="/events" className="ml-auto text-xs text-gold-400 hover:text-gold-300">Diary</Link>
            </li>
            <li className="flex items-center gap-3 px-5 py-3">
              <Radio size={15} className="text-sky-300" />
              <span className="text-sm text-brand-100/90">Channels syncing · Booking.com & Expedia online</span>
              <Link to="/channels" className="ml-auto text-xs text-gold-400 hover:text-gold-300">Channels</Link>
            </li>
            {deviceAlerts.map((d) => (
              <li key={d.id} className="flex items-center gap-3 px-5 py-3">
                <AlertTriangle size={15} className={d.status === "error" ? "text-rose-300" : "text-amber-300"} />
                <span className="text-sm text-brand-100/90">
                  {d.vendor} {d.model} ({d.location}) — {d.status === "error" ? "printer error" : "offline since 08:02"}
                </span>
                <Link to="/hardware" className="ml-auto text-xs text-gold-400 hover:text-gold-300">Devices</Link>
              </li>
            ))}
            <li className="flex items-center gap-3 px-5 py-3">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
              <span className="text-sm text-brand-100/90">Night audit scheduled 02:00 · last run 2026-09-04 clean</span>
            </li>
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader title="VIP & Long-Stay In-House" subtitle="Guests currently on property flagged for attention" />
        <Table head={["Guest", "Company", "Room", "Departing", "Balance of stay", "Source"]}>
          {inHouse
            .filter((r) => r.isVip || r.nights >= 7)
            .map((r) => {
              const guest = guests.find((g) => g.id === r.guestId);
              const room = rooms.find((rm) => rm.id === r.roomId) ?? seedRooms.find((rm) => rm.id === r.roomId);
              return (
                <tr key={r.id} className="hover:bg-brand-800/30">
                  <Td>
                    <span className="font-medium text-brand-50">{guest?.firstName} {guest?.lastName}</span>
                    {r.isVip ? <Badge className="ml-2 border-gold-500/40 bg-gold-500/10 text-gold-300">VIP</Badge> : null}
                  </Td>
                  <Td>{guest?.company}</Td>
                  <Td>{room?.number}</Td>
                  <Td>{r.departureDate}</Td>
                  <Td>{naira(r.totalEstimate - r.depositPaid)}</Td>
                  <Td>{r.source}</Td>
                </tr>
              );
            })}
        </Table>
      </Card>
    </div>
  );
}
