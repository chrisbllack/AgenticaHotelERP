import { Card, CardHeader, Badge, Table, Td, StatCard } from "../components/ui/primitives";
import { PageHeader } from "../components/ui/primitives";
import { channels, roomTypes, PROPERTY } from "../data/demo";
import { fmtDateTime } from "../lib/utils";
import { Plug, RefreshCcw, WifiOff } from "lucide-react";

const CH_STATUS: Record<string, { label: string; chip: string }> = {
  connected: { label: "Connected", chip: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200" },
  disconnected: { label: "Disconnected", chip: "border-stone-400/40 bg-stone-500/15 text-stone-300" },
  error: { label: "Sync Error", chip: "border-rose-400/40 bg-rose-500/15 text-rose-200" },
};

// Rate parity snapshot — demo mapping of channel markup to base rates
const PARITY: Array<{ channel: string; std: number; dlx: number; note: string }> = [
  { channel: "Direct / Website", std: 25000, dlx: 40000, note: "Best rate guaranteed" },
  { channel: "Booking.com", std: 27250, dlx: 43600, note: "15% commission loaded" },
  { channel: "Expedia", std: 27900, dlx: 44640, note: "Hybrid model" },
  { channel: "Jovago", std: 26500, dlx: 42400, note: "Stale since last sync" },
];

export default function ChannelsPage() {
  const connected = channels.filter((c) => c.status === "connected").length;
  const errors = channels.filter((c) => c.status === "error").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Channel Manager"
        subtitle="OTA & GDS connectivity — inventory push, rate sync, reservation pickup"
        actions={
          <button className="flex items-center gap-2 rounded-lg border border-brand-700 px-4 py-2 text-sm text-brand-100 transition-colors hover:border-brand-500">
            <RefreshCcw size={14} /> Sync all now
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Channels" value={String(channels.length)} sub="configured" />
        <StatCard label="Connected" value={String(connected)} sub="syncing normally" accent="emerald" />
        <StatCard label="Sync errors" value={String(errors)} sub="needs attention" accent="rose" />
        <StatCard label="Sync interval" value="15 min" sub="inventory & rates" accent="gold" />
      </div>

      <Card>
        <CardHeader title="Connected Channels" subtitle="Per-channel health, last pickup and commission posture" />
        <Table head={["Channel", "Code", "Type", "Status", "Last sync", ""]}>
          {channels.map((c) => {
            const st = CH_STATUS[c.status];
            return (
              <tr key={c.id} className="hover:bg-brand-800/30">
                <Td>
                  <span className="flex items-center gap-2.5">
                    <Plug size={15} className="text-brand-300" />
                    <span className="font-medium text-brand-50">{c.name}</span>
                  </span>
                </Td>
                <Td><span className="font-mono text-xs text-gold-300">{c.code}</span></Td>
                <Td className="uppercase">{c.type}</Td>
                <Td><Badge className={st.chip}>{st.label}</Badge></Td>
                <Td>{c.lastSyncAt ? fmtDateTime(c.lastSyncAt) : <span className="text-brand-200/40">never</span>}</Td>
                <Td>
                  <button className="rounded-lg border border-brand-700 px-3 py-1.5 text-xs text-brand-100 hover:border-brand-500">
                    {c.status === "connected" ? "Push inventory" : "Reconnect"}
                  </button>
                </Td>
              </tr>
            );
          })}
        </Table>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Rate Parity — Tonight" subtitle={`Base rack rates vs channel-loaded rates (${PROPERTY.currency})`} />
          <Table head={["Channel", "Standard", "Deluxe", "Note"]}>
            {PARITY.map((p) => (
              <tr key={p.channel} className="hover:bg-brand-800/30">
                <Td>{p.channel}</Td>
                <Td>₦{p.std.toLocaleString()}</Td>
                <Td>₦{p.dlx.toLocaleString()}</Td>
                <Td className="text-xs text-brand-200/60">{p.note}</Td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card>
          <CardHeader title="Inventory Push Map" subtitle="Rooms allocated to each distribution channel" />
          <Table head={["Room type", "Total", "Direct", "OTA pool", "GDS"]}>
            {roomTypes.map((rt) => {
              const total = rt.id === "STD-TYPE" ? 40 : rt.id === "DLX-TYPE" ? 7 : rt.id === "EXE-TYPE" ? 2 : 1;
              const ota = Math.floor(total * 0.3);
              const gds = rt.id === "STD-TYPE" ? 4 : 0;
              return (
                <tr key={rt.id} className="hover:bg-brand-800/30">
                  <Td>{rt.name}</Td>
                  <Td>{total}</Td>
                  <Td>{total - ota - gds}</Td>
                  <Td>{ota}</Td>
                  <Td>{gds}</Td>
                </tr>
              );
            })}
          </Table>
          <p className="flex items-center gap-2 border-t border-brand-800/70 px-5 py-3 text-xs text-brand-200/50">
            <WifiOff size={13} /> Channel queues persist offline and flush automatically when connectivity returns.
          </p>
        </Card>
      </div>
    </div>
  );
}
