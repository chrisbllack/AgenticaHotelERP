import { useMemo, useState } from "react";
import { Card, CardHeader, Badge, StatCard, PageHeader } from "../components/ui/primitives";
import { usePlatform } from "../store/platform";
import { roomTypes, employees } from "../data/demo";
import { cn, ROOM_STATUS, fmtDate, naira } from "../lib/utils";
import type { Room, RoomStatus } from "../types";
import {
  CheckCircle2,
  Clock,
  Search,
  ShieldAlert,
  Sparkles,
  User,
  Wrench,
  X,
} from "lucide-react";

export default function RoomsPage() {
  const { rooms, reservations, guests, folios, stays, updateRoomStatus, assignHousekeeper } = usePlatform();
  const [selectedFloor, setSelectedFloor] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchNumber, setSearchNumber] = useState<string>("");

  // Room Inspector Modal
  const [inspectingRoom, setInspectingRoom] = useState<Room | null>(null);
  const [oooReasonInput, setOooReasonInput] = useState<string>("");
  const [oooDateInput, setOooDateInput] = useState<string>("");
  const [selectedAttendant, setSelectedAttendant] = useState<string>("");
  const [notification, setNotification] = useState<string | null>(null);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 5000);
  };

  const floors = useMemo(() => Array.from(new Set(rooms.map((r) => r.floorId))).sort(), [rooms]);
  const attendants = useMemo(() => employees.filter((e) => e.departmentId === "dept-house"), []);

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const matchFloor = selectedFloor === "all" || r.floorId === selectedFloor;
      const matchType = selectedType === "all" || r.roomTypeId === selectedType;
      const matchStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "clean"
            ? r.housekeepingStatus === "clean" || r.status === "vacant_clean"
            : statusFilter === "dirty"
              ? r.housekeepingStatus === "dirty" || r.status.includes("dirty")
              : statusFilter === "occupied"
                ? r.status.startsWith("occupied")
                : statusFilter === "ooo"
                  ? r.status === "out_of_order" || r.status === "out_of_service"
                  : true;
      const matchSearch = searchNumber === "" || r.number.includes(searchNumber);

      return matchFloor && matchType && matchStatus && matchSearch;
    });
  }, [rooms, selectedFloor, selectedType, statusFilter, searchNumber]);

  // Statistics
  const totalCount = rooms.length;
  const occupiedCount = rooms.filter((r) => r.status.startsWith("occupied")).length;
  const vacantCleanCount = rooms.filter((r) => r.status === "vacant_clean").length;
  const dirtyCount = rooms.filter((r) => r.housekeepingStatus === "dirty" || r.status.includes("dirty")).length;
  const oooCount = rooms.filter((r) => r.status === "out_of_order" || r.status === "out_of_service").length;
  const occupancyPct = Math.round((occupiedCount / totalCount) * 100);

  // Helper to find guest in room
  const getRoomOccupant = (roomId: string) => {
    const res = reservations.find((r) => r.roomId === roomId && r.status === "checked_in");
    if (!res) return null;
    const guest = guests.find((g) => g.id === res.guestId);
    const stay = stays.find((s) => s.reservationId === res.id);
    const folio = stay ? folios.find((f) => f.guestStayId === stay.id) : null;
    return { res, guest, stay, folio };
  };

  const tileClass = (r: Room) => {
    if (r.status === "out_of_order" || r.status === "out_of_service") {
      return "border-rose-500/50 bg-rose-500/15 text-rose-100 hover:border-rose-400";
    }
    if (r.status.startsWith("occupied")) {
      return r.housekeepingStatus === "dirty"
        ? "border-amber-500/50 bg-amber-500/15 text-amber-100 hover:border-amber-400"
        : "border-sky-500/50 bg-sky-500/15 text-sky-100 hover:border-sky-400";
    }
    if (r.status === "vacant_clean") {
      return r.housekeepingStatus === "inspected"
        ? "border-emerald-400 bg-emerald-500/20 text-emerald-100 hover:border-emerald-300"
        : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:border-emerald-400";
    }
    if (r.status === "vacant_dirty") {
      return "border-stone-500/50 bg-stone-500/15 text-stone-200 hover:border-stone-400";
    }
    return "border-brand-700 bg-brand-800/40 text-brand-100";
  };

  // Change room status handlers
  const handleSetStatus = (status: RoomStatus, hkStatus: "clean" | "dirty" | "inspected") => {
    if (!inspectingRoom) return;
    updateRoomStatus(inspectingRoom.id, status, hkStatus);
    notify(`Room ${inspectingRoom.number} updated to ${ROOM_STATUS[status]?.label || status}.`);
    setInspectingRoom((prev) => (prev ? { ...prev, status, housekeepingStatus: hkStatus } : null));
  };

  const handleBlockRoom = () => {
    if (!inspectingRoom) return;
    const reason = oooReasonInput || "Scheduled AC / Deep Plumbing Maintenance";
    const retDate = oooDateInput || "2026-09-12";
    updateRoomStatus(inspectingRoom.id, "out_of_order", "dirty", reason, retDate);
    notify(`Room ${inspectingRoom.number} placed Out of Order: ${reason}.`);
    setInspectingRoom((prev) =>
      prev
        ? {
            ...prev,
            status: "out_of_order",
            housekeepingStatus: "dirty",
            outOfOrderReason: reason,
            outOfOrderReturnDate: retDate,
          }
        : null
    );
  };

  const handleReturnToService = () => {
    if (!inspectingRoom) return;
    updateRoomStatus(inspectingRoom.id, "vacant_dirty", "dirty");
    notify(`Room ${inspectingRoom.number} released from Out of Order back to Vacant Dirty for cleaning.`);
    setInspectingRoom((prev) =>
      prev
        ? {
            ...prev,
            status: "vacant_dirty",
            housekeepingStatus: "dirty",
            outOfOrderReason: undefined,
            outOfOrderReturnDate: undefined,
          }
        : null
    );
  };

  const handleAssignHousekeeper = () => {
    if (!inspectingRoom || !selectedAttendant) return;
    assignHousekeeper(inspectingRoom.id, selectedAttendant, 1.5);
    notify(`Housekeeper ${selectedAttendant} assigned to Room ${inspectingRoom.number}.`);
    setInspectingRoom((prev) =>
      prev
        ? {
            ...prev,
            assignedHousekeeper: selectedAttendant,
          }
        : null
    );
  };

  const activeOccupant = inspectingRoom ? getRoomOccupant(inspectingRoom.id) : null;

  return (
    <div className="space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div className="flex items-center justify-between rounded-lg border border-gold-500/40 bg-gold-500/10 px-4 py-3 text-sm text-gold-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-gold-400" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-gold-400 hover:text-gold-200">
            <X size={14} />
          </button>
        </div>
      )}

      <PageHeader
        title="Live Room Rack & Inventory Control"
        subtitle="Visual grid of 5 floors, physical status, housekeeping stages, and room maintenance lockouts"
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Rooms" value={String(totalCount)} sub="Inventory matrix" accent="brand" />
        <StatCard label="Occupied" value={String(occupiedCount)} sub={`${occupancyPct}% occupancy`} accent="sky" />
        <StatCard label="Vacant Clean" value={String(vacantCleanCount)} sub="Ready to sell" accent="emerald" />
        <StatCard label="Dirty Service" value={String(dirtyCount)} sub="Pending cleaning" accent="gold" />
        <StatCard label="Out of Order" value={String(oooCount)} sub="Maintenance block" accent="rose" />
        <StatCard
          label="Inspected"
          value={String(rooms.filter((r) => r.housekeepingStatus === "inspected").length)}
          sub="Supervisor passed"
          accent="emerald"
        />
      </div>

      {/* Filters Bar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Floor filter */}
            <div className="flex items-center gap-1 rounded-lg border border-brand-800 bg-brand-950/60 p-1">
              <button
                onClick={() => setSelectedFloor("all")}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium",
                  selectedFloor === "all" ? "bg-brand-700 text-brand-50" : "text-brand-200/60 hover:text-brand-100"
                )}
              >
                All Floors
              </button>
              {floors.map((f) => (
                <button
                  key={f}
                  onClick={() => setSelectedFloor(f)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium",
                    selectedFloor === f ? "bg-brand-700 text-brand-50" : "text-brand-200/60 hover:text-brand-100"
                  )}
                >
                  Fl {f.replace("floor-", "")}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 rounded-lg border border-brand-800 bg-brand-950/60 p-1">
              {[
                { id: "all", label: "All Status" },
                { id: "clean", label: "Clean" },
                { id: "dirty", label: "Dirty" },
                { id: "occupied", label: "Occupied" },
                { id: "ooo", label: "Out of Order" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStatusFilter(s.id)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium",
                    statusFilter === s.id ? "bg-brand-700 text-brand-50" : "text-brand-200/60 hover:text-brand-100"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Room Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="rounded-lg border border-brand-800 bg-brand-950/60 px-3 py-1.5 text-xs text-brand-100 focus:border-brand-500 focus:outline-none"
            >
              <option value="all">All Room Types</option>
              {roomTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
          </div>

          {/* Search by room # */}
          <div className="relative min-w-[180px]">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-200/40" />
            <input
              type="text"
              placeholder="Search room #..."
              value={searchNumber}
              onChange={(e) => setSearchNumber(e.target.value)}
              className="w-full rounded-lg border border-brand-800 bg-brand-950/60 py-1 pl-7 pr-3 text-xs text-brand-100 placeholder-brand-200/40 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-brand-800/60 pt-3 text-[11px] text-brand-200/70">
          <span className="font-semibold text-brand-100">Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border border-emerald-400 bg-emerald-500/40" />
            <span>Vacant Clean</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border border-sky-400 bg-sky-500/40" />
            <span>Occupied Clean</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border border-amber-400 bg-amber-500/40" />
            <span>Occupied Dirty</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border border-stone-400 bg-stone-500/40" />
            <span>Vacant Dirty</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border border-rose-400 bg-rose-500/40" />
            <span>Out of Order</span>
          </div>
        </div>
      </Card>

      {/* Floor-by-Floor Interactive Room Grid */}
      <div className="space-y-6">
        {floors
          .filter((f) => selectedFloor === "all" || selectedFloor === f)
          .map((floorId) => {
            const floorRooms = filteredRooms.filter((r) => r.floorId === floorId);
            if (floorRooms.length === 0) return null;

            return (
              <Card key={floorId}>
                <CardHeader
                  title={`Floor ${floorId.replace("floor-", "")}`}
                  subtitle={`${floorRooms.length} rooms on this level · Click any room tile to inspect or change status`}
                />
                <div className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10">
                  {floorRooms.map((r) => {
                    const rt = roomTypes.find((t) => t.id === r.roomTypeId);
                    const isOccupied = r.status.startsWith("occupied");
                    const isOOO = r.status === "out_of_order" || r.status === "out_of_service";

                    return (
                      <div
                        key={r.id}
                        onClick={() => setInspectingRoom(r)}
                        className={cn(
                          "group relative cursor-pointer rounded-xl border p-2.5 text-center transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg",
                          tileClass(r)
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-base font-bold tracking-tight">{r.number}</span>
                          {isOccupied && <User size={12} className="text-sky-300" />}
                          {isOOO && <Wrench size={12} className="text-rose-300" />}
                          {r.housekeepingStatus === "inspected" && (
                            <CheckCircle2 size={12} className="text-emerald-400" />
                          )}
                        </div>

                        <p className="mt-1 text-[10px] uppercase tracking-wider opacity-80">{rt?.code || "STD"}</p>

                        <div className="mt-1 flex items-center justify-center gap-1">
                          <span className="text-[9px] capitalize opacity-70">
                            {isOOO
                              ? "Out of Order"
                              : isOccupied
                                ? "Occupied"
                                : r.housekeepingStatus === "inspected"
                                  ? "Inspected"
                                  : r.status === "vacant_clean"
                                    ? "Clean"
                                    : "Dirty"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
      </div>

      {/* MODAL: ROOM INSPECTION & STATUS MANAGEMENT DRAWER */}
      {inspectingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-brand-700 bg-brand-900 p-6 text-brand-50 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-brand-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-brand-600 bg-brand-800 font-mono text-xl font-bold text-brand-50">
                  {inspectingRoom.number}
                </span>
                <div>
                  <h3 className="text-base font-bold text-brand-50">
                    Room {inspectingRoom.number} — Inspector & Maintenance
                  </h3>
                  <p className="text-xs text-brand-200/60">
                    Floor {inspectingRoom.floorId.replace("floor-", "")} · {inspectingRoom.wing} Wing ·{" "}
                    {roomTypes.find((t) => t.id === inspectingRoom.roomTypeId)?.name}
                  </p>
                </div>
              </div>
              <button onClick={() => setInspectingRoom(null)} className="text-brand-200/60 hover:text-brand-50">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 py-4">
              {/* Room Specifications */}
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-brand-800 bg-brand-950/60 p-3 text-xs sm:grid-cols-4">
                <div>
                  <span className="text-brand-200/50">Bed Configuration:</span>
                  <p className="font-semibold text-brand-100">{inspectingRoom.bedType || "King Bed"}</p>
                </div>
                <div>
                  <span className="text-brand-200/50">Current Status:</span>
                  <p className="font-semibold capitalize text-brand-100">{inspectingRoom.status.replace("_", " ")}</p>
                </div>
                <div>
                  <span className="text-brand-200/50">Housekeeping:</span>
                  <p className="font-semibold capitalize text-brand-100">
                    {inspectingRoom.housekeepingStatus || "Clean"}
                  </p>
                </div>
                <div>
                  <span className="text-brand-200/50">Connecting Room:</span>
                  <p className="font-semibold text-brand-100">
                    {inspectingRoom.connectingRoomNumber ? `Room ${inspectingRoom.connectingRoomNumber}` : "None"}
                  </p>
                </div>
              </div>

              {/* Features & Amenities */}
              {inspectingRoom.features && inspectingRoom.features.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-brand-200/80">Room Amenities & Features:</span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {inspectingRoom.features.map((f) => (
                      <span key={f} className="rounded-md border border-brand-700 bg-brand-800/70 px-2 py-0.5 text-xs text-brand-200">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* In-House Guest Details (if occupied) */}
              {activeOccupant && activeOccupant.guest && (
                <div className="rounded-lg border border-sky-500/40 bg-sky-500/10 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-sky-400" />
                      <span className="text-xs font-bold text-sky-200">Current Occupant</span>
                    </div>
                    {activeOccupant.res.isVip && (
                      <Badge className="border-gold-500/40 bg-gold-500/20 text-gold-300">VIP Guest</Badge>
                    )}
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-brand-200/60">Guest Name:</span>
                      <p className="font-semibold text-brand-50">
                        {activeOccupant.guest.firstName} {activeOccupant.guest.lastName}
                      </p>
                    </div>
                    <div>
                      <span className="text-brand-200/60">Stay Dates:</span>
                      <p className="font-semibold text-brand-50">
                        {fmtDate(activeOccupant.res.arrivalDate)} → {fmtDate(activeOccupant.res.departureDate)}
                      </p>
                    </div>
                    <div>
                      <span className="text-brand-200/60">Folio Balance:</span>
                      <p className="font-semibold text-brand-50">
                        {activeOccupant.folio ? naira(Math.abs(activeOccupant.folio.balance)) : "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-brand-200/60">Confirmation:</span>
                      <p className="font-mono text-brand-100">{activeOccupant.res.confirmationNumber}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Out of Order Notice if applicable */}
              {inspectingRoom.status === "out_of_order" && (
                <div className="rounded-lg border border-rose-500/40 bg-rose-500/15 p-4 text-xs text-rose-200">
                  <div className="flex items-center gap-2 font-bold">
                    <Wrench size={16} /> Room Out of Order
                  </div>
                  <p className="mt-1">
                    <span className="font-semibold">Reason:</span>{" "}
                    {inspectingRoom.outOfOrderReason || "Scheduled maintenance"}
                  </p>
                  <p className="mt-0.5">
                    <span className="font-semibold">Expected Return to Service:</span>{" "}
                    {inspectingRoom.outOfOrderReturnDate || "Pending parts"}
                  </p>
                </div>
              )}

              {/* Quick Status Action Buttons */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-brand-200/80">Update Room Status:</span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => handleSetStatus("vacant_clean", "clean")}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/50 bg-emerald-500/20 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/30"
                  >
                    <Sparkles size={13} /> Mark Vacant Clean
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetStatus("vacant_clean", "inspected")}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-400 bg-emerald-500/30 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/40"
                  >
                    <CheckCircle2 size={13} /> Mark Inspected
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetStatus("vacant_dirty", "dirty")}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-stone-500/50 bg-stone-500/20 py-2 text-xs font-semibold text-stone-200 hover:bg-stone-500/30"
                  >
                    <Clock size={13} /> Mark Vacant Dirty
                  </button>
                </div>
              </div>

              {/* Maintenance / Out of Order Section */}
              <div className="rounded-lg border border-brand-800 bg-brand-950/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-100">Engineering & Out of Order Block</span>
                  {inspectingRoom.status === "out_of_order" ? (
                    <button
                      type="button"
                      onClick={handleReturnToService}
                      className="rounded-md border border-emerald-500/50 bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/30"
                    >
                      Return to Service
                    </button>
                  ) : null}
                </div>

                {inspectingRoom.status !== "out_of_order" && (
                  <div className="mt-3 space-y-2">
                    <div>
                      <label className="block text-[11px] text-brand-200/60">Reason for Out of Order block</label>
                      <input
                        type="text"
                        placeholder="e.g. Air conditioning compressor defect"
                        value={oooReasonInput}
                        onChange={(e) => setOooReasonInput(e.target.value)}
                        className="mt-1 w-full rounded-md border border-brand-800 bg-brand-900 px-2.5 py-1.5 text-xs text-brand-100 focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <label className="block text-[11px] text-brand-200/60">Expected Return Date</label>
                        <input
                          type="date"
                          value={oooDateInput}
                          onChange={(e) => setOooDateInput(e.target.value)}
                          className="mt-1 rounded-md border border-brand-800 bg-brand-900 px-2.5 py-1 text-xs text-brand-100"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleBlockRoom}
                        className="mt-4 flex items-center gap-1 rounded-md border border-rose-500/50 bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-100 hover:bg-rose-500/30"
                      >
                        <ShieldAlert size={12} /> Place Out of Order
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Assign Attendant Section */}
              <div className="rounded-lg border border-brand-800 bg-brand-950/60 p-4">
                <span className="text-xs font-bold text-brand-100">Housekeeping Attendant Assignment</span>
                <div className="mt-2 flex items-center gap-2">
                  <select
                    value={selectedAttendant}
                    onChange={(e) => setSelectedAttendant(e.target.value)}
                    className="w-full rounded-md border border-brand-800 bg-brand-900 px-2.5 py-1.5 text-xs text-brand-100"
                  >
                    <option value="">Select housekeeping attendant...</option>
                    {attendants.map((a) => (
                      <option key={a.id} value={`${a.firstName} ${a.lastName}`}>
                        {a.firstName} {a.lastName} ({a.shift} shift)
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAssignHousekeeper}
                    className="whitespace-nowrap rounded-md border border-brand-700 bg-brand-800 px-3 py-1.5 text-xs font-semibold text-brand-100 hover:bg-brand-700"
                  >
                    Assign Attendant
                  </button>
                </div>
                {inspectingRoom.assignedHousekeeper && (
                  <p className="mt-2 text-[11px] text-emerald-300">
                    Currently assigned to: {inspectingRoom.assignedHousekeeper}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end border-t border-brand-800 pt-4">
              <button
                type="button"
                onClick={() => setInspectingRoom(null)}
                className="rounded-lg border border-brand-700 px-4 py-1.5 text-xs text-brand-200 hover:bg-brand-800"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
