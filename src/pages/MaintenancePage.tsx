import { useMemo, useState } from "react";
import { Card, CardHeader, Badge, StatCard, EmptyState, PageHeader } from "../components/ui/primitives";
import { usePlatform } from "../store/platform";
import { cn, ROOM_STATUS } from "../lib/utils";
import type { PreventativeMaintenanceSchedule, EquipmentType } from "../types";
import PmInspectionModal from "../components/PmInspectionModal";
import CreatePmScheduleModal from "../components/CreatePmScheduleModal";
import GuestPortalModal from "../components/GuestPortalModal";
import { MaintenanceAuditView } from "../components/maintenance/MaintenanceAuditView";
import {
  AlertTriangle,
  Calendar,
  Cpu,
  FileCheck2,
  Filter,
  Gauge,
  History,
  Leaf,
  Lightbulb,
  Plus,
  ShieldCheck,
  Snowflake,
  Thermometer,
  Wind,
  Wrench,
  WrenchOff,
  Zap,
} from "lucide-react";

type ActiveTab = "pm_schedules" | "work_orders" | "pm_history" | "smart_energy" | "maintenance_audit";
type Filter = "all" | "open" | "out_of_order";

const FILTERS: Array<[Filter, string]> = [
  ["all", "All rooms"],
  ["open", "Needs attention"],
  ["out_of_order", "Out of order"],
];

export default function MaintenancePage() {
  const {
    rooms,
    tasks,
    pmSchedules,
    pmLogs,
    businessDate,
    smartRoomControls,
    updateSmartRoom,
    maintenanceAuditRecords,
  } = usePlatform();
  const [activeTab, setActiveTab] = useState<ActiveTab>("pm_schedules");
  const [filter, setFilter] = useState<Filter>("all");
  const [equipmentFilter, setEquipmentFilter] = useState<string>("all");

  // Modals
  const [selectedScheduleForInspect, setSelectedScheduleForInspect] = useState<PreventativeMaintenanceSchedule | null>(null);
  const [isCreatePmOpen, setIsCreatePmOpen] = useState(false);
  const [selectedRoomForPortal, setSelectedRoomForPortal] = useState<string | null>(null);

  // Work order board rows
  const rows = useMemo(() => {
    const relevant = tasks.filter((t) =>
      ["Inspection Required", "Maintenance + Cleaning", "Deep Cleaning"].includes(t.taskType)
    );
    const roomToTask = new Map(relevant.map((t) => [t.roomId, t]));
    return rooms
      .filter((r) => {
        if (filter === "out_of_order") return r.status === "out_of_order" || r.status === "out_of_service";
        if (filter === "open") {
          const ooo = r.status === "out_of_order" || r.status === "out_of_service";
          return ooo || roomToTask.has(r.id);
        }
        return true;
      })
      .map((r) => {
        const t = roomToTask.get(r.id);
        return {
          room: r,
          task: t,
          work: t?.taskType ?? (r.status.startsWith("out_of") ? "Repair required" : "No open work order"),
        };
      });
  }, [rooms, tasks, filter]);

  // PM Schedule calculations
  const activeSchedules = pmSchedules.filter((s) => s.status === "active");
  const overdueSchedules = pmSchedules.filter((s) => s.status === "overdue" || s.nextDueDate < businessDate);
  const avgCompliance = Math.round(
    pmSchedules.reduce((a, s) => a + s.compliancePercentage, 0) / Math.max(pmSchedules.length, 1)
  );
  const oooCount = rooms.filter((r) => r.status === "out_of_order" || r.status === "out_of_service").length;
  const openWork = rows.filter((x) => x.task).length;

  const filteredSchedules = pmSchedules.filter((s) => {
    if (equipmentFilter === "all") return true;
    return s.equipmentType === equipmentFilter;
  });

  const getEquipmentIcon = (type: EquipmentType) => {
    switch (type) {
      case "hvac":
        return <Gauge size={16} className="text-cyan-400" />;
      case "fire_safety":
        return <AlertTriangle size={16} className="text-rose-400" />;
      case "generator":
        return <Zap size={16} className="text-amber-400" />;
      case "door_lock":
        return <ShieldCheck size={16} className="text-emerald-400" />;
      default:
        return <Wrench size={16} className="text-gold-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance & Engineering"
        subtitle="M-ENG · Preventative maintenance schedules, room equipment inspections, and reactive work order control"
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setIsCreatePmOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-gold-500 px-4 py-2 text-xs font-semibold text-brand-950 shadow-md hover:bg-gold-400 transition-colors"
            >
              <Plus size={15} /> Set Recurring PM Schedule
            </button>
          </div>
        }
      />

      {/* Top High-level KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Recurring PM Schedules"
          value={String(pmSchedules.length)}
          change={`${activeSchedules.length} active programs`}
          trend="up"
        />
        <StatCard
          label="PM Compliance Rate"
          value={`${avgCompliance}%`}
          change="Target: >90% SLA"
          trend={avgCompliance >= 90 ? "up" : "down"}
        />
        <StatCard
          label="Overdue Inspections"
          value={String(overdueSchedules.length)}
          change={overdueSchedules.length > 0 ? "Requires technician action" : "All schedules on-time"}
          trend={overdueSchedules.length > 0 ? "down" : "neutral"}
        />
        <StatCard
          label="Rooms OOO / OOS"
          value={String(oooCount)}
          change="Out of inventory"
          trend={oooCount > 0 ? "down" : "neutral"}
        />
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-brand-800">
        <button
          onClick={() => setActiveTab("pm_schedules")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors",
            activeTab === "pm_schedules"
              ? "border-gold-500 text-gold-400"
              : "border-transparent text-brand-200/60 hover:text-brand-100"
          )}
        >
          <Calendar size={16} /> Preventative Maintenance Schedules ({pmSchedules.length})
        </button>

        <button
          onClick={() => setActiveTab("work_orders")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors",
            activeTab === "work_orders"
              ? "border-gold-500 text-gold-400"
              : "border-transparent text-brand-200/60 hover:text-brand-100"
          )}
        >
          <Wrench size={16} /> Work Order Board ({openWork})
        </button>

        <button
          onClick={() => setActiveTab("pm_history")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors",
            activeTab === "pm_history"
              ? "border-gold-500 text-gold-400"
              : "border-transparent text-brand-200/60 hover:text-brand-100"
          )}
        >
          <History size={16} /> Inspection History & Log ({pmLogs.length})
        </button>

        <button
          onClick={() => setActiveTab("smart_energy")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors",
            activeTab === "smart_energy"
              ? "border-gold-500 text-gold-400"
              : "border-transparent text-brand-200/60 hover:text-brand-100"
          )}
        >
          <Cpu size={16} /> Smart Rooms &amp; Energy IoT
        </button>

        <button
          onClick={() => setActiveTab("maintenance_audit")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors",
            activeTab === "maintenance_audit"
              ? "border-gold-500 text-gold-400"
              : "border-transparent text-brand-200/60 hover:text-brand-100"
          )}
        >
          <FileCheck2 size={16} /> Maintenance Audit Trail ({maintenanceAuditRecords.length})
        </button>
      </div>

      {/* Tab 1: Preventative Maintenance Schedules */}
      {activeTab === "pm_schedules" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-brand-200/70">
              <Filter size={14} /> Filter by Equipment:
              <select
                value={equipmentFilter}
                onChange={(e) => setEquipmentFilter(e.target.value)}
                className="rounded-lg border border-brand-700 bg-brand-900 px-2.5 py-1 text-xs text-brand-50 focus:outline-none"
              >
                <option value="all">All Equipment Types</option>
                <option value="hvac">HVAC & Climate Control</option>
                <option value="door_lock">RFID Door Locks</option>
                <option value="plumbing">Plumbing & Boilers</option>
                <option value="fire_safety">Fire Safety & Alarms</option>
                <option value="generator">Generators & ATS Power</option>
                <option value="elevator">Elevators & Lifts</option>
              </select>
            </div>

            <span className="text-xs text-brand-200/50">
              Scheduled tasks run recurring inspections automatically
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSchedules.map((schedule) => {
              const isOverdue = schedule.status === "overdue" || schedule.nextDueDate < businessDate;
              return (
                <div
                  key={schedule.id}
                  className="flex flex-col justify-between rounded-xl border border-brand-800/80 bg-brand-950/60 p-4 transition-all hover:border-brand-700"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-900 text-gold-400">
                          {getEquipmentIcon(schedule.equipmentType)}
                        </span>
                        <div>
                          <span className="font-mono text-[11px] font-semibold text-gold-400">
                            {schedule.scheduleCode}
                          </span>
                          <h4 className="text-sm font-semibold text-brand-50 leading-tight">
                            {schedule.title}
                          </h4>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 text-[10px] font-semibold uppercase",
                          isOverdue
                            ? "bg-rose-500/20 text-rose-300"
                            : "bg-emerald-500/20 text-emerald-300"
                        )}
                      >
                        {isOverdue ? "Overdue" : schedule.frequency.replace("_", " ")}
                      </span>
                    </div>

                    {/* Targets & Engineer */}
                    <div className="mt-3 space-y-1 text-xs text-brand-200/70">
                      <p>
                        <span className="text-brand-200/40">Scope:</span>{" "}
                        <span className="text-brand-100">{schedule.targetLocations.join(", ")}</span>
                      </p>
                      <p>
                        <span className="text-brand-200/40">Assigned:</span>{" "}
                        <span className="text-brand-100">{schedule.assignedEngineer}</span>
                      </p>
                      <p>
                        <span className="text-brand-200/40">Est. Time:</span>{" "}
                        <span className="text-brand-100">{schedule.estimatedDurationMinutes} mins</span>
                      </p>
                    </div>

                    {/* Checklist preview */}
                    <div className="mt-3 rounded-lg border border-brand-800/60 bg-brand-900/40 p-2 text-xs">
                      <p className="font-semibold text-brand-200/80">Checkpoints ({schedule.checklist.length}):</p>
                      <ul className="mt-1 space-y-0.5 text-[11px] text-brand-200/60 list-disc list-inside">
                        {schedule.checklist.slice(0, 3).map((c) => (
                          <li key={c.id} className="truncate">
                            {c.task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-brand-800/60">
                    <div className="flex items-center justify-between text-xs mb-3">
                      <span className="text-brand-200/50">Next Due:</span>
                      <span
                        className={cn(
                          "font-mono font-semibold",
                          isOverdue ? "text-rose-400" : "text-brand-100"
                        )}
                      >
                        {schedule.nextDueDate}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedScheduleForInspect(schedule)}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600/90 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
                    >
                      <FileCheck2 size={14} /> Log Inspection / Complete PM
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Work Order Board */}
      {activeTab === "work_orders" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={cn(
                  "rounded-lg border px-4 py-1.5 text-xs transition-colors",
                  filter === key
                    ? "border-brand-400/50 bg-brand-500/20 font-medium text-brand-50"
                    : "border-brand-800/80 bg-brand-900/40 text-brand-100/70 hover:border-brand-600"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <Card>
            <CardHeader
              title="Reactive Work Order Board"
              subtitle="Rooms with engineering involvement, surfaced from housekeeping and failed inspections"
            />
            {rows.length === 0 ? (
              <EmptyState title="Nothing matches this filter" hint="Switch filters to see room state." />
            ) : (
              <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {rows.map(({ room, task, work }) => {
                  const meta = ROOM_STATUS[room.status];
                  const isOoo = room.status === "out_of_order" || room.status === "out_of_service";
                  return (
                    <div
                      key={room.id}
                      className={cn(
                        "rounded-xl border p-4 transition-colors",
                        isOoo
                          ? "border-rose-500/40 bg-rose-500/5"
                          : "border-brand-800/70 bg-brand-950/50 hover:border-brand-600"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-display text-xl text-brand-50">Room {room.number}</p>
                        <Badge className={meta.chip}>{meta.short}</Badge>
                      </div>
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-brand-100/80">
                        {isOoo ? (
                          <WrenchOff className="h-3.5 w-3.5 text-rose-400" />
                        ) : (
                          <Wrench className="h-3.5 w-3.5 text-amber-400" />
                        )}
                        {work}
                      </p>
                      {task ? (
                        <p className="mt-1 text-[11px] text-brand-200/50">
                          Priority: {task.priority} · Status: {task.status}
                        </p>
                      ) : (
                        <p className="mt-1 text-[11px] text-brand-200/40">Cleanliness: {room.housekeepingStatus}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab 3: Inspection History & Compliance Logs */}
      {activeTab === "pm_history" && (
        <Card>
          <CardHeader
            title="Inspection History & Diagnostic Logs"
            subtitle="Audited physical readings, filter checks, and spawned corrective work orders"
          />
          <div className="divide-y divide-brand-800/60">
            {pmLogs.map((log) => (
              <div key={log.id} className="p-4 transition-colors hover:bg-brand-900/30">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-sm font-semibold text-brand-50">
                      {log.scheduleTitle}
                    </span>
                    <span className="rounded bg-brand-800 px-2 py-0.5 text-xs text-brand-200">
                      {log.inspectedTarget}
                    </span>
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 text-[10px] font-semibold uppercase",
                        log.result === "passed"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : log.result === "passed_minor_issues"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-rose-500/20 text-rose-300"
                      )}
                    >
                      {log.result.replace(/_/g, " ")}
                    </span>
                  </div>

                  <span className="font-mono text-xs text-brand-200/60">{log.inspectedAt}</span>
                </div>

                <div className="mt-2 text-xs text-brand-200/80">
                  <p>
                    <span className="text-brand-200/50">Inspector:</span> {log.technicianName}
                  </p>
                  <p className="mt-1">{log.findingsAndRepairs}</p>
                </div>

                {log.measuredReadings && log.measuredReadings.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {log.measuredReadings.map((r, i) => (
                      <div
                        key={i}
                        className="rounded-md border border-brand-800/60 bg-brand-950/60 px-2.5 py-1 text-[11px]"
                      >
                        <span className="text-brand-200/60">{r.label}: </span>
                        <span className="font-mono text-emerald-400 font-semibold">{r.actual}</span>
                        <span className="text-brand-200/40 ml-1">({r.target})</span>
                      </div>
                    ))}
                  </div>
                )}

                {log.spawnedWorkOrderId && (
                  <div className="mt-2.5 flex items-center gap-2 text-xs text-rose-300">
                    <AlertTriangle size={13} />
                    <span>Corrective Work Order Spawned: </span>
                    <span className="font-mono font-bold">{log.spawnedWorkOrderId}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab 4: Smart Rooms & Energy IoT Management */}
      {activeTab === "smart_energy" && (
        <div className="space-y-6">
          {/* Energy KPIs */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Instantaneous HVAC Load"
              value="114.6 kW"
              change="Sub-metered IoT telemetry"
              trend="neutral"
            />
            <StatCard
              label="Eco Setback Compliance"
              value="82%"
              change="18 of 22 vacant rooms dialed back"
              trend="up"
            />
            <StatCard
              label="Average Guestroom Temp"
              value="22.1 °C"
              change="Setpoints: 19°C – 25°C"
              trend="neutral"
            />
            <StatCard
              label="Estimated Today's Energy Savings"
              value="142.8 kWh"
              change="Saved via keycard relay & setbacks"
              trend="up"
            />
          </div>

          {/* Quick Actions & Policy Controls */}
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div>
                <h4 className="text-sm font-semibold text-brand-50 flex items-center gap-2">
                  <Leaf size={16} className="text-emerald-400" /> Hotel Energy Conservation Policy
                </h4>
                <p className="text-xs text-brand-200/60 mt-0.5">
                  Automated setback adjusts unoccupied rooms to 25°C and shuts off master relays upon checkout.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    rooms.forEach((r) => {
                      if (r.status.startsWith("vacant")) {
                        updateSmartRoom(r.id, {
                          targetTemperature: 25,
                          hvacMode: "eco",
                          lights: { master: false, entryway: false, bedroom: false, bathroom: false, nightstand: false },
                        });
                      }
                    });
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-3.5 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30 transition"
                >
                  <Leaf size={13} /> Enforce Vacant Room Setbacks (25°C)
                </button>
                <button
                  onClick={() => {
                    rooms.forEach((r) => {
                      if (r.status.startsWith("vacant")) {
                        updateSmartRoom(r.id, {
                          lights: { master: false, entryway: false, bedroom: false, bathroom: false, nightstand: false },
                        });
                      }
                    });
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-brand-700 bg-brand-800/80 px-3 py-1.5 text-xs font-medium text-brand-100 hover:bg-brand-700 transition"
                >
                  <Lightbulb size={13} className="text-amber-400" /> Vacant Lights Off
                </button>
              </div>
            </div>
          </Card>

          {/* Room-by-Room IoT Telemetry & Interactive Controls */}
          <Card>
            <CardHeader
              title="In-Room IoT Smart Controllers & Digital Key Relays"
              subtitle="Real-time thermostat telemetry, DND/MUR signals, lighting scenes, and guest portal simulator"
            />
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {rooms.map((room) => {
                const ctrl = smartRoomControls[room.id] || {
                  roomId: room.id,
                  roomNumber: room.number,
                  dndActive: false,
                  murActive: false,
                  targetTemperature: 21,
                  currentTemperature: 22,
                  hvacMode: "cool",
                  fanSpeed: "auto",
                  lightingScene: "relax",
                  lights: { master: true, entryway: false, bedroom: true, bathroom: false, nightstand: true },
                  doorLocked: true,
                  privacyLatchEngaged: false,
                  lastUpdated: "Just now",
                };

                const isOccupied = room.status === "occupied";
                const isEco = ctrl.targetTemperature >= 24 || ctrl.hvacMode === "eco";

                return (
                  <div
                    key={room.id}
                    className="rounded-xl border border-brand-800/80 bg-brand-950/40 p-4 space-y-3 transition hover:border-brand-700"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-bold text-brand-50">
                            Room {room.number}
                          </span>
                          <Badge
                            className={cn(
                              "text-[10px]",
                              isOccupied
                                ? "border-sky-500/40 bg-sky-500/15 text-sky-200"
                                : "border-stone-500/40 bg-stone-500/15 text-stone-300"
                            )}
                          >
                            {room.status.replace("_", " ")}
                          </Badge>
                          {isEco && (
                            <Badge className="border-emerald-500/40 bg-emerald-500/15 text-emerald-300 text-[10px]">
                              Eco
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-brand-200/50 mt-0.5">
                          Floor {room.floorId.replace("floor-", "")} · {room.wing || "East"} Wing
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {ctrl.dndActive && (
                          <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">
                            DND
                          </span>
                        )}
                        {ctrl.murActive && (
                          <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-bold text-sky-300">
                            MUR
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Thermostat & Climate */}
                    <div className="grid grid-cols-2 gap-2 rounded-lg border border-brand-800/60 bg-brand-900/30 p-2.5">
                      <div>
                        <span className="text-[10px] text-brand-200/60 flex items-center gap-1">
                          <Thermometer size={12} className="text-rose-400" /> Current Temp
                        </span>
                        <p className="font-mono text-base font-bold text-brand-50 mt-0.5">
                          {ctrl.currentTemperature}°C
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-brand-200/60 flex items-center gap-1">
                          <Snowflake size={12} className="text-sky-400" /> Setpoint
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <p className="font-mono text-base font-bold text-gold-300">
                            {ctrl.targetTemperature}°C
                          </p>
                          <div className="flex items-center gap-0.5 ml-auto">
                            <button
                              onClick={() =>
                                updateSmartRoom(room.id, {
                                  targetTemperature: Math.max(16, ctrl.targetTemperature - 1),
                                })
                              }
                              className="h-5 w-5 rounded bg-brand-800 text-xs font-bold text-brand-100 hover:bg-brand-700"
                            >
                              -
                            </button>
                            <button
                              onClick={() =>
                                updateSmartRoom(room.id, {
                                  targetTemperature: Math.min(30, ctrl.targetTemperature + 1),
                                })
                              }
                              className="h-5 w-5 rounded bg-brand-800 text-xs font-bold text-brand-100 hover:bg-brand-700"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* IoT Status summary */}
                    <div className="flex items-center justify-between text-[11px] text-brand-200/70 pt-1">
                      <span className="flex items-center gap-1">
                        <Wind size={12} className="text-cyan-400" /> {ctrl.hvacMode} · {ctrl.fanSpeed}
                      </span>
                      <span className="flex items-center gap-1">
                        <Lightbulb size={12} className={ctrl.lights?.master ? "text-amber-300" : "text-stone-500"} />
                        Scene: {ctrl.lightingScene}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-2 border-t border-brand-800/60 pt-2.5">
                      <button
                        onClick={() => {
                          const nextTemp = isEco ? 21 : 25;
                          updateSmartRoom(room.id, {
                            targetTemperature: nextTemp,
                            hvacMode: isEco ? "cool" : "eco",
                          });
                        }}
                        className="text-[11px] font-medium text-emerald-300 hover:text-emerald-200 transition"
                      >
                        {isEco ? "Restore Standard 21°C" : "Set Eco 25°C"}
                      </button>

                      <button
                        onClick={() => setSelectedRoomForPortal(room.id)}
                        className="flex items-center gap-1 rounded-md border border-gold-400/40 bg-brand-500/20 px-2.5 py-1 text-xs font-semibold text-gold-200 hover:bg-brand-500/40 transition"
                      >
                        <Cpu size={12} /> Test Guest Portal
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 5: Maintenance Audit Trail */}
      {activeTab === "maintenance_audit" && <MaintenanceAuditView />}

      {/* Modals */}
      {selectedScheduleForInspect && (
        <PmInspectionModal
          isOpen={!!selectedScheduleForInspect}
          onClose={() => setSelectedScheduleForInspect(null)}
          schedule={selectedScheduleForInspect}
        />
      )}

      {isCreatePmOpen && (
        <CreatePmScheduleModal
          isOpen={isCreatePmOpen}
          onClose={() => setIsCreatePmOpen(false)}
        />
      )}

      {selectedRoomForPortal && (
        <GuestPortalModal
          isOpen={Boolean(selectedRoomForPortal)}
          defaultRoomId={selectedRoomForPortal}
          onClose={() => setSelectedRoomForPortal(null)}
        />
      )}
    </div>
  );
}
