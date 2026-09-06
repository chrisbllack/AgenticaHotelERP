import { Card, CardHeader, Badge, Table, Td, StatCard } from "../components/ui/primitives";
import { PageHeader } from "../components/ui/primitives";
import { hardwareDevices } from "../data/demo";
import { fmtDateTime } from "../lib/utils";
import { Activity, CircleCheck, CircleAlert, CircleOff, RefreshCcw } from "lucide-react";

const TYPE_LABEL: Record<string, string> = {
  door_lock: "Door Lock",
  printer: "Printer",
  pos_terminal: "POS Terminal",
  kds: "Kitchen Display",
  scanner: "Scanner",
  iptv: "IPTV",
  biometric: "Biometric Reader",
};

const STATUS_META: Record<string, { chip: string; icon: typeof Activity }> = {
  online: { chip: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200", icon: CircleCheck },
  error: { chip: "border-rose-400/40 bg-rose-500/15 text-rose-200", icon: CircleAlert },
  offline: { chip: "border-stone-400/40 bg-stone-500/15 text-stone-300", icon: CircleOff },
};

export default function HardwarePage() {
  const online = hardwareDevices.filter((d) => d.status === "online").length;
  const alerts = hardwareDevices.filter((d) => d.status !== "online");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Device Health"
        subtitle="M-HDW · locks, printers, KDS, terminals, biometric readers — one health board"
        actions={
          <button className="flex items-center gap-2 rounded-lg border border-brand-700 px-4 py-2 text-sm text-brand-100 transition-colors hover:border-brand-500">
            <RefreshCcw size={14} /> Poll all devices
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Devices" value={String(hardwareDevices.length)} sub="registered at property" />
        <StatCard label="Online" value={String(online)} sub="reporting healthy" accent="emerald" />
        <StatCard label="Errors" value={String(hardwareDevices.filter((d) => d.status === "error").length)} sub="needs attention" accent="rose" />
        <StatCard label="Offline" value={String(hardwareDevices.filter((d) => d.status === "offline").length)} sub="no heartbeat" accent="gold" />
      </div>

      {alerts.length > 0 ? (
        <Card className="border-rose-500/30">
          <CardHeader title="Attention Required" subtitle="Devices with failing or missing heartbeats" />
          <ul className="divide-y divide-brand-800/50">
            {alerts.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                {d.status === "error" ? (
                  <CircleAlert size={16} className="text-rose-300" />
                ) : (
                  <CircleOff size={16} className="text-stone-300" />
                )}
                <span className="text-sm font-medium text-brand-50">{d.vendor} {d.model}</span>
                <span className="text-xs text-brand-200/60">{d.location} · SN {d.serialNumber}</span>
                <Badge className={`ml-auto ${STATUS_META[d.status].chip}`}>
                  {d.status === "error" ? "Printer error — KOT queue backed up" : "Last seen 08:02 at staff entrance"}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Device Inventory" subtitle="All registered hardware with last health check" />
        <Table head={["Device", "Type", "Location", "Serial", "Status", "Last check"]}>
          {hardwareDevices.map((d) => {
            const meta = STATUS_META[d.status];
            const Icon = meta.icon;
            return (
              <tr key={d.id} className="hover:bg-brand-800/30">
                <Td><span className="font-medium text-brand-50">{d.vendor} {d.model}</span></Td>
                <Td>{TYPE_LABEL[d.deviceType]}</Td>
                <Td>{d.location}</Td>
                <Td><span className="font-mono text-xs text-brand-100/70">{d.serialNumber}</span></Td>
                <Td><Badge className={meta.chip}><Icon size={11} /> {d.status}</Badge></Td>
                <Td>{d.lastHealthCheck ? fmtDateTime(d.lastHealthCheck) : "—"}</Td>
              </tr>
            );
          })}
        </Table>
        <p className="flex items-center gap-2 border-t border-brand-800/70 px-5 py-3 text-xs text-brand-200/50">
          <Activity size={13} /> Health probes run every 60s; device state is mirrored into the executive dashboard alerts.
        </p>
      </Card>
    </div>
  );
}
