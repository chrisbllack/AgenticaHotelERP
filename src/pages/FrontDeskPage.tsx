import { useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  Badge,
  Table,
  Td,
  EmptyState,
  StatCard,
  PageHeader,
} from "../components/ui/primitives";
import {
  usePlatform,
  type WalkInInput,
  VAT_RATE,
  SERVICE_CHARGE_RATE,
} from "../store/platform";
import { roomTypes } from "../data/demo";
import { fmtDate, naira, cn } from "../lib/utils";
import type { Guest, GuestTrace, KeyCardRecord, Reservation } from "../types";
import GuestFlagBadge from "../components/GuestFlagBadge";
import GuestFlagModal from "../components/GuestFlagModal";
import {
  ArrowRight,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Crown,
  FileCheck2,
  Key,
  Layers,
  LogIn,
  LogOut,
  Moon,
  Plus,
  Printer,
  QrCode,
  Radio,
  Receipt,
  RotateCcw,
  Search,
  Send,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";

type Tab = "arrivals" | "inhouse" | "departures" | "walkin" | "traces" | "keycards" | "nightaudit";

export default function FrontDeskPage() {
  const {
    businessDate,
    reservations,
    stays,
    folios,
    folioLines,
    rooms,
    guests,
    traces,
    keyCards,
    checkIn,
    checkOut,
    createWalkIn,
    roomMove,
    encodeKeyCard,
    addTrace,
    resolveTrace,
    postChargeDetailed,
    settleFolioWindow,
    transferFolioCharge,
    runNightAuditStep,
  } = usePlatform();

  const [tab, setTab] = useState<Tab>("arrivals");
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<string | null>(null);
  const [selectedFlagGuest, setSelectedFlagGuest] = useState<Guest | null>(null);

  // Active modal states
  const [checkInModalRes, setCheckInModalRes] = useState<Reservation | null>(null);
  const [roomMoveModalRes, setRoomMoveModalRes] = useState<Reservation | null>(null);
  const [folioModalRes, setFolioModalRes] = useState<Reservation | null>(null);
  const [activeFolioWindow, setActiveFolioWindow] = useState<number>(1);
  const [showPostChargeModal, setShowPostChargeModal] = useState<boolean>(false);
  const [showSettleModal, setShowSettleModal] = useState<boolean>(false);
  const [showPrintInvoice, setShowPrintInvoice] = useState<boolean>(false);
  const [showNewTraceModal, setShowNewTraceModal] = useState<boolean>(false);

  // Night Audit Wizard state
  const [nightAuditStep, setNightAuditStep] = useState<number>(1);
  const [nightAuditRunning, setNightAuditRunning] = useState<boolean>(false);
  const [nightAuditResults, setNightAuditResults] = useState<{
    roomsCharged: number;
    totalPosted: number;
    noShowsHandled: number;
    newBusinessDate: string;
  } | null>(null);

  // Walk-in form state
  const [walkIn, setWalkIn] = useState<WalkInInput>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    nationality: "Nigerian",
    company: "",
    idType: "National ID / NIN",
    idNumber: "",
    roomId: "",
    nights: 1,
    rate: 35000,
    marketSegment: "FIT / Direct",
  });

  // Check-In Wizard state
  const [checkInStep, setCheckInStep] = useState<number>(1);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [depositMethod, setDepositMethod] = useState<string>("Credit Card");
  const [keyCardType, setKeyCardType] = useState<"guest" | "duplicate" | "master" | "mobile_nfc">("guest");
  const [isEncodingKey, setIsEncodingKey] = useState<boolean>(false);
  const [encodedKeyResult, setEncodedKeyResult] = useState<KeyCardRecord | null>(null);
  const [signedRegCard, setSignedRegCard] = useState<boolean>(false);

  // Room Move state
  const [moveTargetRoomId, setMoveTargetRoomId] = useState<string>("");
  const [moveReason, setMoveReason] = useState<string>("Guest requested quieter room");
  const [moveIsComplimentary, setMoveIsComplimentary] = useState<boolean>(true);
  const [moveRateAdjustment, setMoveRateAdjustment] = useState<number>(0);

  // Post Charge state
  const [newChargeDept, setNewChargeDept] = useState<string>("F&B");
  const [newChargeDesc, setNewChargeDesc] = useState<string>("");
  const [newChargeAmount, setNewChargeAmount] = useState<string>("");
  const [newChargeRef, setNewChargeRef] = useState<string>("");

  // Settle window state
  const [settleMethod, setSettleMethod] = useState<string>("card");
  const [settleRef, setSettleRef] = useState<string>("");

  // New Trace state
  const [newTraceGuestName, setNewTraceGuestName] = useState("");
  const [newTraceRoomNo, setNewTraceRoomNo] = useState("");
  const [newTraceDept, setNewTraceDept] = useState<GuestTrace["department"]>("front_desk");
  const [newTraceMsg, setNewTraceMsg] = useState("");
  const [newTraceTime, setNewTraceTime] = useState("14:00");

  // Trace department filter
  const [traceFilterDept, setTraceFilterDept] = useState<string>("all");

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 6000);
  };

  // Operational Queues
  const arrivals = useMemo(
    () => reservations.filter((r) => r.status === "confirmed" && r.arrivalDate <= businessDate),
    [reservations, businessDate]
  );
  const inHouse = useMemo(
    () => reservations.filter((r) => r.status === "checked_in"),
    [reservations]
  );
  const departures = useMemo(
    () => reservations.filter((r) => r.status === "checked_in" && r.departureDate <= businessDate),
    [reservations, businessDate]
  );

  const pendingTraces = useMemo(
    () => traces.filter((t) => t.status === "pending"),
    [traces]
  );

  // Filtered arrivals
  const filteredArrivals = useMemo(() => {
    return arrivals.filter((r) => {
      const g = guests.find((x) => x.id === r.guestId);
      const query = searchQuery.toLowerCase();
      return (
        r.confirmationNumber.toLowerCase().includes(query) ||
        (g?.firstName && g.firstName.toLowerCase().includes(query)) ||
        (g?.lastName && g.lastName.toLowerCase().includes(query)) ||
        (g?.company && g.company.toLowerCase().includes(query))
      );
    });
  }, [arrivals, guests, searchQuery]);

  // Filtered in-house
  const filteredInHouse = useMemo(() => {
    return inHouse.filter((r) => {
      const g = guests.find((x) => x.id === r.guestId);
      const rm = rooms.find((x) => x.id === r.roomId);
      const query = searchQuery.toLowerCase();
      return (
        (rm?.number && rm.number.includes(query)) ||
        r.confirmationNumber.toLowerCase().includes(query) ||
        (g?.firstName && g.firstName.toLowerCase().includes(query)) ||
        (g?.lastName && g.lastName.toLowerCase().includes(query))
      );
    });
  }, [inHouse, guests, rooms, searchQuery]);

  // Filtered departures
  const filteredDepartures = useMemo(() => {
    return departures.filter((r) => {
      const g = guests.find((x) => x.id === r.guestId);
      const rm = rooms.find((x) => x.id === r.roomId);
      const query = searchQuery.toLowerCase();
      return (
        (rm?.number && rm.number.includes(query)) ||
        (g?.firstName && g.firstName.toLowerCase().includes(query)) ||
        (g?.lastName && g.lastName.toLowerCase().includes(query))
      );
    });
  }, [departures, guests, rooms, searchQuery]);

  // Helper to get stay and folio for a reservation
  const getFolioDetails = (reservationId: string) => {
    const stay = stays.find((s) => s.reservationId === reservationId);
    if (!stay) return null;
    const folio = folios.find((f) => f.guestStayId === stay.id);
    if (!folio) return null;
    const lines = folioLines.filter((l) => l.folioId === folio.id);
    return { stay, folio, lines };
  };

  // Available vacant clean rooms for check-in / room move / walk-in
  const vacantCleanRooms = useMemo(
    () => rooms.filter((r) => r.status === "vacant_clean"),
    [rooms]
  );

  // Launch Check-In Modal
  const startCheckIn = (res: Reservation) => {
    setCheckInModalRes(res);
    setCheckInStep(1);
    setSelectedRoomId(res.roomId || (vacantCleanRooms[0]?.id ?? ""));
    setDepositAmount(0);
    setDepositMethod("Credit Card");
    setKeyCardType("guest");
    setEncodedKeyResult(null);
    setSignedRegCard(false);
  };

  // Execute Check-In after wizard completion
  const handleCompleteCheckIn = () => {
    if (!checkInModalRes) return;
    checkIn(checkInModalRes.id, {
      assignedRoomId: selectedRoomId,
      keyCardType,
      depositAmount,
      depositMethod,
    });
    notify(
      `Check-in complete for ${checkInModalRes.confirmationNumber}. Key card active and Room ${rooms.find((r) => r.id === selectedRoomId)?.number} marked Occupied Clean.`
    );
    setCheckInModalRes(null);
  };

  // Key card encode simulator
  const handleSimulateKeyEncode = () => {
    if (!checkInModalRes || !selectedRoomId) return;
    setIsEncodingKey(true);
    setTimeout(() => {
      const record = encodeKeyCard(checkInModalRes.id, selectedRoomId, keyCardType);
      setEncodedKeyResult(record);
      setIsEncodingKey(false);
      notify(`Key Card encoded successfully for Room ${record.roomNumber} [UID: ${record.cardUid}].`);
    }, 1200);
  };

  // Launch Room Move Modal
  const startRoomMove = (res: Reservation) => {
    setRoomMoveModalRes(res);
    const candidate = vacantCleanRooms.find((r) => r.id !== res.roomId);
    setMoveTargetRoomId(candidate?.id || "");
    setMoveReason("Guest requested quieter room away from elevator");
    setMoveIsComplimentary(true);
    setMoveRateAdjustment(0);
  };

  // Execute Room Move
  const handleExecuteRoomMove = () => {
    if (!roomMoveModalRes || !moveTargetRoomId) return;
    const targetRoom = rooms.find((r) => r.id === moveTargetRoomId);
    const oldRoom = rooms.find((r) => r.id === roomMoveModalRes.roomId);
    roomMove({
      reservationId: roomMoveModalRes.id,
      toRoomId: moveTargetRoomId,
      reason: moveReason,
      isComplimentary: moveIsComplimentary,
      rateAdjustment: moveRateAdjustment,
    });
    notify(
      `Room move executed! Guest transferred from Room ${oldRoom?.number} to Room ${targetRoom?.number}. Previous room marked Vacant Dirty for housekeeping touch-up.`
    );
    setRoomMoveModalRes(null);
  };

  // Check Out Action
  const handleCheckOut = (res: Reservation) => {
    const fd = getFolioDetails(res.id);
    const balance = fd?.folio.balance || 0;
    if (balance < -10) {
      notify(
        `Cannot checkout: Folio ${fd?.folio.folioNumber} has an outstanding balance of ${naira(Math.abs(balance))}. Please settle the folio first.`
      );
      setFolioModalRes(res);
      return;
    }
    checkOut(res.id);
    notify(
      `Checked out ${res.confirmationNumber} successfully. Room queued for sanitization cleaning and key cards revoked.`
    );
  };

  // Submit Walk-In
  const handleSubmitWalkIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkIn.firstName || !walkIn.lastName || !walkIn.roomId) {
      notify("Please provide guest first name, last name, and select an available room.");
      return;
    }
    const created = createWalkIn(walkIn);
    // Direct check-in option
    checkIn(created.id, {
      assignedRoomId: walkIn.roomId,
      keyCardType: "guest",
    });
    notify(
      `Walk-In Registration successful! ${created.confirmationNumber} checked into Room ${rooms.find((r) => r.id === walkIn.roomId)?.number}. Folio opened.`
    );
    setWalkIn({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      nationality: "Nigerian",
      company: "",
      idType: "National ID / NIN",
      idNumber: "",
      roomId: "",
      nights: 1,
      rate: 35000,
      marketSegment: "FIT / Direct",
    });
  };

  // Submit detailed charge
  const handlePostDetailedCharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folioModalRes || !newChargeDesc || !newChargeAmount) return;
    const fd = getFolioDetails(folioModalRes.id);
    if (!fd) return;

    const amt = parseFloat(newChargeAmount);
    if (isNaN(amt) || amt <= 0) return;

    const sub = Math.round((amt / (1 + VAT_RATE + SERVICE_CHARGE_RATE)) * 100) / 100;
    const tax = Math.round((amt - sub) * 100) / 100;

    postChargeDetailed({
      folioId: fd.folio.id,
      window: activeFolioWindow,
      department: newChargeDept,
      description: newChargeDesc,
      subtotal: sub,
      taxAmount: tax,
      reference: newChargeRef || `TX-${Date.now().toString().slice(-6)}`,
    });

    notify(`Posted ${naira(amt)} to Folio Window ${activeFolioWindow} (${newChargeDept}).`);
    setNewChargeDesc("");
    setNewChargeAmount("");
    setNewChargeRef("");
    setShowPostChargeModal(false);
  };

  // Submit window settlement
  const handleSettleWindow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folioModalRes) return;
    const fd = getFolioDetails(folioModalRes.id);
    if (!fd) return;

    // Calculate window balance
    const windowLines = fd.lines.filter((l) => (l.window || 1) === activeFolioWindow);
    const windowDebit = windowLines
      .filter((l) => l.type === "debit")
      .reduce((a, b) => a + b.amount, 0);
    const windowCredit = windowLines
      .filter((l) => l.type === "credit")
      .reduce((a, b) => a + Math.abs(b.amount), 0);
    const windowBal = windowDebit - windowCredit;

    if (windowBal <= 0) {
      notify(`Folio Window ${activeFolioWindow} is already balanced or has a credit.`);
      setShowSettleModal(false);
      return;
    }

    settleFolioWindow({
      folioId: fd.folio.id,
      window: activeFolioWindow,
      paymentMethod: settleMethod,
      amount: windowBal,
      reference: settleRef || `RCPT-${Math.floor(10000 + Math.random() * 90000)}`,
    });

    notify(`Folio Window ${activeFolioWindow} settled in full (${naira(windowBal)}) via ${settleMethod.toUpperCase()}.`);
    setShowSettleModal(false);
  };

  // Run Night Audit Step
  const handleRunNightAudit = () => {
    setNightAuditRunning(true);
    setTimeout(() => {
      const res = runNightAuditStep();
      setNightAuditResults(res);
      setNightAuditRunning(false);
      notify(
        `Night Audit completed successfully! Posted room charges to ${res.roomsCharged} rooms (${naira(res.totalPosted)}). Business date rolled to ${res.newBusinessDate}.`
      );
    }, 1500);
  };

  // Handle New Trace
  const handleCreateTrace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTraceMsg || !newTraceGuestName) return;
    addTrace({
      reservationId: "res-general",
      guestName: newTraceGuestName,
      roomNumber: newTraceRoomNo || "General",
      department: newTraceDept,
      message: newTraceMsg,
      time: newTraceTime,
      status: "pending",
    });
    notify(`Trace alert assigned to ${newTraceDept.toUpperCase()} department.`);
    setShowNewTraceModal(false);
    setNewTraceMsg("");
    setNewTraceGuestName("");
    setNewTraceRoomNo("");
  };

  // Active Folio Details when Folio Modal is open
  const currentFolioData = folioModalRes ? getFolioDetails(folioModalRes.id) : null;
  const currentFolioGuest = folioModalRes ? guests.find((g) => g.id === folioModalRes.guestId) : null;
  const currentFolioRoom = folioModalRes ? rooms.find((r) => r.id === folioModalRes.roomId) : null;

  // Window-filtered lines
  const currentWindowLines = useMemo(() => {
    if (!currentFolioData) return [];
    return currentFolioData.lines.filter((l) => (l.window || 1) === activeFolioWindow);
  }, [currentFolioData, activeFolioWindow]);

  const windowDebits = currentWindowLines
    .filter((l) => l.type === "debit")
    .reduce((a, b) => a + b.amount, 0);
  const windowCredits = currentWindowLines
    .filter((l) => l.type === "credit")
    .reduce((a, b) => a + Math.abs(b.amount), 0);
  const windowBalance = windowDebits - windowCredits;

  return (
    <div className="space-y-6">
      {/* Top Banner / Notification */}
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

      {/* Page Header with Business Date & Quick Actions */}
      <PageHeader
        title="Front Desk Command Hub"
        subtitle={`Operating Business Date: ${businessDate} · Full-service 5-star PMS front office operations`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setTab("walkin");
              }}
              className="flex items-center gap-1.5 rounded-lg border border-gold-500/50 bg-gold-500/20 px-3 py-1.5 text-xs font-semibold text-gold-100 hover:bg-gold-500/30"
            >
              <UserPlus size={14} /> Walk-In Check-In
            </button>
            <button
              onClick={() => {
                setShowNewTraceModal(true);
              }}
              className="flex items-center gap-1.5 rounded-lg border border-brand-700 bg-brand-800/60 px-3 py-1.5 text-xs font-medium text-brand-100 hover:bg-brand-700"
            >
              <Radio size={14} className="text-sky-400" /> Add Trace / Request
            </button>
            <button
              onClick={() => setTab("nightaudit")}
              className="flex items-center gap-1.5 rounded-lg border border-purple-500/50 bg-purple-500/20 px-3 py-1.5 text-xs font-semibold text-purple-200 hover:bg-purple-500/30"
            >
              <Moon size={14} /> Night Audit Wizard
            </button>
          </div>
        }
      />

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Arrivals Due In"
          value={String(arrivals.length)}
          sub={`${arrivals.filter((r) => r.isVip).length} VIP arrivals`}
          accent="sky"
        />
        <StatCard
          label="In-House Guests"
          value={String(inHouse.length)}
          sub={`${rooms.filter((r) => r.status.startsWith("occupied")).length} rooms occupied`}
          accent="emerald"
        />
        <StatCard
          label="Departures Today"
          value={String(departures.length)}
          sub="pending checkout"
          accent="gold"
        />
        <StatCard
          label="Vacant Clean"
          value={String(vacantCleanRooms.length)}
          sub="ready for check-in"
          accent="emerald"
        />
        <StatCard
          label="Active Traces"
          value={String(pendingTraces.length)}
          sub="department actions"
          accent="rose"
        />
        <StatCard
          label="Active Keys"
          value={String(keyCards.filter((k) => k.status === "active").length)}
          sub="encoded RFID cards"
          accent="brand"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-800/80 pb-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setTab("arrivals")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors",
              tab === "arrivals"
                ? "border border-sky-400/40 bg-sky-500/20 text-sky-100"
                : "text-brand-200/70 hover:bg-brand-900/60 hover:text-brand-50"
            )}
          >
            <LogIn size={14} />
            Arrivals & Pre-Reg
            <span className="rounded-full bg-sky-500/30 px-1.5 py-0.2 text-[10px] font-bold text-sky-200">
              {arrivals.length}
            </span>
          </button>

          <button
            onClick={() => setTab("inhouse")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors",
              tab === "inhouse"
                ? "border border-emerald-400/40 bg-emerald-500/20 text-emerald-100"
                : "text-brand-200/70 hover:bg-brand-900/60 hover:text-brand-50"
            )}
          >
            <Users size={14} />
            In-House Operations
            <span className="rounded-full bg-emerald-500/30 px-1.5 py-0.2 text-[10px] font-bold text-emerald-200">
              {inHouse.length}
            </span>
          </button>

          <button
            onClick={() => setTab("departures")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors",
              tab === "departures"
                ? "border border-gold-400/40 bg-gold-500/20 text-gold-100"
                : "text-brand-200/70 hover:bg-brand-900/60 hover:text-brand-50"
            )}
          >
            <LogOut size={14} />
            Departures & Settlement
            <span className="rounded-full bg-gold-500/30 px-1.5 py-0.2 text-[10px] font-bold text-gold-200">
              {departures.length}
            </span>
          </button>

          <button
            onClick={() => setTab("walkin")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors",
              tab === "walkin"
                ? "border border-gold-500/50 bg-gold-500/25 text-gold-100"
                : "text-brand-200/70 hover:bg-brand-900/60 hover:text-brand-50"
            )}
          >
            <UserPlus size={14} />
            Walk-In Registration
          </button>

          <button
            onClick={() => setTab("traces")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors",
              tab === "traces"
                ? "border border-rose-400/40 bg-rose-500/20 text-rose-100"
                : "text-brand-200/70 hover:bg-brand-900/60 hover:text-brand-50"
            )}
          >
            <Radio size={14} />
            Traces & Concierge
            {pendingTraces.length > 0 && (
              <span className="rounded-full bg-rose-500/30 px-1.5 py-0.2 text-[10px] font-bold text-rose-200">
                {pendingTraces.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setTab("keycards")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors",
              tab === "keycards"
                ? "border border-brand-400/40 bg-brand-500/20 text-brand-100"
                : "text-brand-200/70 hover:bg-brand-900/60 hover:text-brand-50"
            )}
          >
            <Key size={14} />
            Key Cards & RFID
          </button>

          <button
            onClick={() => setTab("nightaudit")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors",
              tab === "nightaudit"
                ? "border border-purple-400/40 bg-purple-500/25 text-purple-100"
                : "text-brand-200/70 hover:bg-brand-900/60 hover:text-brand-50"
            )}
          >
            <Moon size={14} />
            Night Audit
          </button>
        </div>

        {/* Global search within front desk */}
        {(tab === "arrivals" || tab === "inhouse" || tab === "departures") && (
          <div className="relative min-w-[240px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-200/40" />
            <input
              type="text"
              placeholder="Search guest, room, or conf #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-brand-800/80 bg-brand-950/60 py-1.5 pl-8 pr-3 text-xs text-brand-100 placeholder-brand-200/40 focus:border-brand-500 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* TAB 1: ARRIVALS WORKSPACE */}
      {tab === "arrivals" && (
        <Card>
          <CardHeader
            title="Expected Arrivals & Check-In Worklist"
            subtitle={`${filteredArrivals.length} arrivals due on business date ${businessDate} · Full registration & key encoder integration`}
          />
          {filteredArrivals.length === 0 ? (
            <EmptyState
              title="No pending arrivals for today"
              hint="All reservations for today have been checked in or marked no-show."
            />
          ) : (
            <Table head={["Conf # / ETA", "Guest Name & VIP", "Room / Type", "Dates / Nights", "Rate & Total", "Status", "Actions"]}>
              {filteredArrivals.map((res) => {
                const guest = guests.find((g) => g.id === res.guestId);
                const assignedRoom = rooms.find((r) => r.id === res.roomId);
                const roomType = roomTypes.find((t) => t.id === res.roomTypeId);

                return (
                  <tr key={res.id} className="hover:bg-brand-800/20">
                    <Td>
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-semibold text-brand-50">
                          {res.confirmationNumber}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-brand-200/60">
                          <Clock size={11} /> 14:00 ETA · {res.source}
                        </span>
                      </div>
                    </Td>

                    <Td>
                      <div className="flex items-center gap-2">
                        {res.isVip ? (
                          <span className="rounded bg-gold-500/20 p-1 text-gold-400">
                            <Crown size={14} />
                          </span>
                        ) : (
                          <span className="rounded bg-brand-800/60 p-1 text-brand-300">
                            <UserCheck size={14} />
                          </span>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-brand-100">
                              {guest ? `${guest.firstName} ${guest.lastName}` : "Guest"}
                            </p>
                            {guest && (
                              <GuestFlagBadge
                                flags={guest.flags}
                                blacklistReason={guest.blacklistReason}
                                onEditClick={() => setSelectedFlagGuest(guest)}
                              />
                            )}
                          </div>
                          <p className="text-[11px] text-brand-200/60">
                            {guest?.company ? `${guest.company} · ` : ""}
                            {guest?.nationality || "Nigeria"}
                          </p>
                        </div>
                      </div>
                    </Td>

                    <Td>
                      {assignedRoom ? (
                        <div className="flex items-center gap-1.5">
                          <Badge className="border-emerald-500/40 bg-emerald-500/15 text-emerald-200">
                            Room {assignedRoom.number}
                          </Badge>
                          <span className="text-[11px] text-brand-200/60">
                            {assignedRoom.housekeepingStatus === "clean" ? "Clean" : "Inspected"}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Badge className="border-amber-500/40 bg-amber-500/15 text-amber-200">
                            Unassigned
                          </Badge>
                          <span className="text-[11px] text-brand-200/60">{roomType?.code || "STD"}</span>
                        </div>
                      )}
                    </Td>

                    <Td>
                      <span className="text-xs text-brand-100">
                        {fmtDate(res.arrivalDate)} → {fmtDate(res.departureDate)}
                      </span>
                      <p className="text-[11px] text-brand-200/50">{res.nights} nights · {res.adults} adult(s)</p>
                    </Td>

                    <Td>
                      <span className="font-semibold text-brand-50">{naira(res.totalEstimate)}</span>
                      <p className="text-[11px] text-brand-200/50">
                        {res.depositPaid > 0 ? `Deposit: ${naira(res.depositPaid)}` : "No deposit"}
                      </p>
                    </Td>

                    <Td>
                      <Badge className="border-sky-400/40 bg-sky-500/15 text-sky-200">
                        Ready for Check-In
                      </Badge>
                    </Td>

                    <Td>
                      <button
                        onClick={() => startCheckIn(res)}
                        className="flex items-center gap-1.5 rounded-lg border border-emerald-500/50 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/30"
                      >
                        <LogIn size={13} /> Check In Suite
                      </button>
                    </Td>
                  </tr>
                );
              })}
            </Table>
          )}
        </Card>
      )}

      {/* TAB 2: IN-HOUSE OPERATIONS */}
      {tab === "inhouse" && (
        <Card>
          <CardHeader
            title="In-House Guest Roster & Room Management"
            subtitle={`${filteredInHouse.length} in-house guests · Live folio balance, room moves, and guest service traces`}
          />
          {filteredInHouse.length === 0 ? (
            <EmptyState title="No in-house guests found" hint="Check arrivals or create a walk-in to register guests." />
          ) : (
            <Table head={["Room #", "Guest Name & Contact", "Stay Dates", "Folio Balance", "Room Type / Bed", "Actions"]}>
              {filteredInHouse.map((res) => {
                const guest = guests.find((g) => g.id === res.guestId);
                const rm = rooms.find((r) => r.id === res.roomId);
                const rt = roomTypes.find((t) => t.id === rm?.roomTypeId);
                const fd = getFolioDetails(res.id);
                const balance = fd?.folio.balance || 0;

                return (
                  <tr key={res.id} className="hover:bg-brand-800/20">
                    <Td>
                      <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-400/40 bg-brand-500/20 font-mono text-sm font-bold text-brand-50">
                          {rm?.number || "N/A"}
                        </span>
                        <div>
                          <p className="text-[11px] font-semibold uppercase text-brand-200/70">Floor {rm?.floorId.replace("floor-", "")}</p>
                          <p className="text-[10px] text-brand-200/50">{rm?.wing || "East"} Wing</p>
                        </div>
                      </div>
                    </Td>

                    <Td>
                      <div className="flex items-center gap-2">
                        {res.isVip ? (
                          <span className="rounded bg-gold-500/20 p-1 text-gold-400" title="VIP Guest">
                            <Crown size={14} />
                          </span>
                        ) : null}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-brand-100">
                              {guest ? `${guest.firstName} ${guest.lastName}` : "Guest"}
                            </p>
                            {guest && (
                              <GuestFlagBadge
                                flags={guest.flags}
                                blacklistReason={guest.blacklistReason}
                                onEditClick={() => setSelectedFlagGuest(guest)}
                              />
                            )}
                          </div>
                          <p className="text-[11px] text-brand-200/60">
                            {guest?.phone} · {res.confirmationNumber}
                          </p>
                        </div>
                      </div>
                    </Td>

                    <Td>
                      <span className="text-xs text-brand-100">
                        {fmtDate(res.arrivalDate)} → {fmtDate(res.departureDate)}
                      </span>
                      <p className="text-[11px] text-brand-200/50">
                        {res.nights} nights total · Out in{" "}
                        {Math.max(
                          0,
                          Math.round((Date.parse(res.departureDate) - Date.parse(businessDate)) / 86400000)
                        )}{" "}
                        days
                      </p>
                    </Td>

                    <Td>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "font-mono text-xs font-bold",
                            balance < 0 ? "text-rose-300" : balance > 0 ? "text-emerald-300" : "text-brand-200/60"
                          )}
                        >
                          {balance < 0
                            ? `Owes ${naira(Math.abs(balance))}`
                            : balance > 0
                              ? `Credit ${naira(balance)}`
                              : "Settled (0.00)"}
                        </span>
                        {balance < -50000 && (
                          <Badge className="border-rose-500/40 bg-rose-500/20 text-rose-300">
                            High Balance
                          </Badge>
                        )}
                      </div>
                    </Td>

                    <Td>
                      <span className="text-xs font-medium text-brand-100">{rt?.name || "Standard Room"}</span>
                      <p className="text-[11px] text-brand-200/50">{rm?.bedType || "King Bed"}</p>
                    </Td>

                    <Td>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          onClick={() => {
                            setFolioModalRes(res);
                            setActiveFolioWindow(1);
                          }}
                          className="flex items-center gap-1 rounded-md border border-brand-700 bg-brand-800/60 px-2.5 py-1 text-xs font-medium text-brand-100 hover:bg-brand-700"
                        >
                          <Receipt size={12} className="text-gold-400" /> Folio
                        </button>

                        <button
                          onClick={() => startRoomMove(res)}
                          className="flex items-center gap-1 rounded-md border border-brand-700 bg-brand-800/60 px-2.5 py-1 text-xs font-medium text-brand-100 hover:bg-brand-700"
                        >
                          <ArrowRightLeft size={12} className="text-sky-400" /> Move
                        </button>

                        <button
                          onClick={() => {
                            setNewTraceGuestName(guest ? `${guest.firstName} ${guest.lastName}` : "Guest");
                            setNewTraceRoomNo(rm?.number || "");
                            setShowNewTraceModal(true);
                          }}
                          className="flex items-center gap-1 rounded-md border border-brand-700 bg-brand-800/60 px-2.5 py-1 text-xs font-medium text-brand-100 hover:bg-brand-700"
                        >
                          <Radio size={12} className="text-amber-400" /> Trace
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </Table>
          )}
        </Card>
      )}

      {/* TAB 3: DEPARTURES & SETTLEMENT */}
      {tab === "departures" && (
        <Card>
          <CardHeader
            title="Expected Departures & Express Settlement"
            subtitle={`${filteredDepartures.length} departures scheduled today · Folio balancing, payment collection, and sanitization release`}
          />
          {filteredDepartures.length === 0 ? (
            <EmptyState title="No pending departures today" hint="All scheduled departures have either checked out or extended their stay." />
          ) : (
            <Table head={["Room / Guest", "Stay Dates", "Folio Balance", "Payment Status", "Actions"]}>
              {filteredDepartures.map((res) => {
                const guest = guests.find((g) => g.id === res.guestId);
                const rm = rooms.find((r) => r.id === res.roomId);
                const fd = getFolioDetails(res.id);
                const balance = fd?.folio.balance || 0;
                const isZeroBalanced = Math.abs(balance) < 1;

                return (
                  <tr key={res.id} className="hover:bg-brand-800/20">
                    <Td>
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-700 bg-brand-800/80 font-mono text-xs font-bold text-brand-100">
                          {rm?.number}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-brand-100">
                              {guest ? `${guest.firstName} ${guest.lastName}` : "Guest"}
                            </p>
                            {guest && (
                              <GuestFlagBadge
                                flags={guest.flags}
                                blacklistReason={guest.blacklistReason}
                                onEditClick={() => setSelectedFlagGuest(guest)}
                              />
                            )}
                          </div>
                          <p className="text-[11px] text-brand-200/50">{res.confirmationNumber}</p>
                        </div>
                      </div>
                    </Td>

                    <Td>
                      <span className="text-xs text-brand-100">
                        {fmtDate(res.arrivalDate)} → {fmtDate(res.departureDate)}
                      </span>
                      <p className="text-[11px] text-brand-200/50">{res.nights} nights</p>
                    </Td>

                    <Td>
                      <span
                        className={cn(
                          "font-mono text-xs font-bold",
                          balance < 0 ? "text-rose-300" : balance > 0 ? "text-emerald-300" : "text-brand-200/70"
                        )}
                      >
                        {balance < 0
                          ? `Owes ${naira(Math.abs(balance))}`
                          : balance > 0
                            ? `Credit ${naira(balance)}`
                            : "0.00 Balanced"}
                      </span>
                    </Td>

                    <Td>
                      {isZeroBalanced ? (
                        <Badge className="border-emerald-500/40 bg-emerald-500/15 text-emerald-200">
                          <CheckCircle2 size={11} /> Settled · Express Ready
                        </Badge>
                      ) : (
                        <Badge className="border-rose-500/40 bg-rose-500/15 text-rose-200">
                          Requires Settlement
                        </Badge>
                      )}
                    </Td>

                    <Td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setFolioModalRes(res);
                            setActiveFolioWindow(1);
                          }}
                          className="flex items-center gap-1 rounded-md border border-brand-700 bg-brand-800/60 px-2.5 py-1 text-xs font-medium text-brand-100 hover:bg-brand-700"
                        >
                          <Receipt size={12} /> View Folio
                        </button>

                        <button
                          onClick={() => handleCheckOut(res)}
                          className={cn(
                            "flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold",
                            isZeroBalanced
                              ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30"
                              : "border-gold-500/50 bg-gold-500/20 text-gold-100 hover:bg-gold-500/30"
                          )}
                        >
                          <LogOut size={13} /> {isZeroBalanced ? "Express Check-Out" : "Settle & Check-Out"}
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </Table>
          )}
        </Card>
      )}

      {/* TAB 4: WALK-IN REGISTRATION */}
      {tab === "walkin" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader
              title="Walk-In Guest Registration & Direct Check-In"
              subtitle="Instantly create reservation, assign vacant clean room, open folio, and encode key card"
            />
            <form onSubmit={handleSubmitWalkIn} className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-brand-200/80">First Name *</label>
                  <input
                    type="text"
                    required
                    value={walkIn.firstName}
                    onChange={(e) => setWalkIn({ ...walkIn, firstName: e.target.value })}
                    placeholder="e.g. Olawale"
                    className="mt-1 w-full rounded-lg border border-brand-800/80 bg-brand-950/60 px-3 py-2 text-xs text-brand-100 focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-brand-200/80">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={walkIn.lastName}
                    onChange={(e) => setWalkIn({ ...walkIn, lastName: e.target.value })}
                    placeholder="e.g. Danjuma"
                    className="mt-1 w-full rounded-lg border border-brand-800/80 bg-brand-950/60 px-3 py-2 text-xs text-brand-100 focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-brand-200/80">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={walkIn.phone}
                    onChange={(e) => setWalkIn({ ...walkIn, phone: e.target.value })}
                    placeholder="+234 802 345 6789"
                    className="mt-1 w-full rounded-lg border border-brand-800/80 bg-brand-950/60 px-3 py-2 text-xs text-brand-100 focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-brand-200/80">Email Address</label>
                  <input
                    type="email"
                    value={walkIn.email}
                    onChange={(e) => setWalkIn({ ...walkIn, email: e.target.value })}
                    placeholder="guest@example.com"
                    className="mt-1 w-full rounded-lg border border-brand-800/80 bg-brand-950/60 px-3 py-2 text-xs text-brand-100 focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-brand-200/80">Identification Type</label>
                  <select
                    value={walkIn.idType}
                    onChange={(e) => setWalkIn({ ...walkIn, idType: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-brand-800/80 bg-brand-950/60 px-3 py-2 text-xs text-brand-100 focus:border-brand-500 focus:outline-none"
                  >
                    <option value="National ID / NIN">National ID / NIN</option>
                    <option value="International Passport">International Passport</option>
                    <option value="Driver's License">Driver's License</option>
                    <option value="Diplomatic Passport">Diplomatic Passport</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-brand-200/80">ID Document #</label>
                  <input
                    type="text"
                    value={walkIn.idNumber}
                    onChange={(e) => setWalkIn({ ...walkIn, idNumber: e.target.value })}
                    placeholder="e.g. A09283741"
                    className="mt-1 w-full rounded-lg border border-brand-800/80 bg-brand-950/60 px-3 py-2 text-xs text-brand-100 focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-brand-200/80">Assign Vacant Clean Room *</label>
                  <select
                    required
                    value={walkIn.roomId}
                    onChange={(e) => {
                      const selId = e.target.value;
                      const selRm = rooms.find((r) => r.id === selId);
                      const selType = roomTypes.find((t) => t.id === selRm?.roomTypeId);
                      setWalkIn({
                        ...walkIn,
                        roomId: selId,
                        rate: selType?.baseRate || walkIn.rate,
                      });
                    }}
                    className="mt-1 w-full rounded-lg border border-brand-800/80 bg-brand-950/60 px-3 py-2 text-xs text-brand-100 focus:border-brand-500 focus:outline-none"
                  >
                    <option value="">Select a ready room ({vacantCleanRooms.length} available)...</option>
                    {vacantCleanRooms.map((rm) => {
                      const t = roomTypes.find((x) => x.id === rm.roomTypeId);
                      return (
                        <option key={rm.id} value={rm.id}>
                          Room {rm.number} — {t?.name} ({rm.bedType || "King"}) · {naira(t?.baseRate || 35000)}/night
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-brand-200/80">Agreed Nightly Rate (NGN) *</label>
                  <input
                    type="number"
                    required
                    value={walkIn.rate}
                    onChange={(e) => setWalkIn({ ...walkIn, rate: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full rounded-lg border border-brand-800/80 bg-brand-950/60 px-3 py-2 text-xs text-brand-100 focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-brand-200/80">Number of Nights *</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    required
                    value={walkIn.nights}
                    onChange={(e) => setWalkIn({ ...walkIn, nights: parseInt(e.target.value) || 1 })}
                    className="mt-1 w-full rounded-lg border border-brand-800/80 bg-brand-950/60 px-3 py-2 text-xs text-brand-100 focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-brand-200/80">Market Segment</label>
                  <select
                    value={walkIn.marketSegment}
                    onChange={(e) => setWalkIn({ ...walkIn, marketSegment: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-brand-800/80 bg-brand-950/60 px-3 py-2 text-xs text-brand-100 focus:border-brand-500 focus:outline-none"
                  >
                    <option value="FIT / Leisure">FIT / Leisure</option>
                    <option value="Corporate Walk-In">Corporate Walk-In</option>
                    <option value="Airline Crew / Distress">Airline Crew / Distress</option>
                    <option value="Government / Official">Government / Official</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-brand-800/80 pt-4">
                <div>
                  <p className="text-xs text-brand-200/60">Estimated Total Stay Charge:</p>
                  <p className="font-display text-lg font-bold text-gold-400">
                    {naira(walkIn.nights * walkIn.rate)}
                  </p>
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/30"
                >
                  <LogIn size={14} /> Register & Check-In Directly
                </button>
              </div>
            </form>
          </Card>

          {/* Quick Room Rack Glance */}
          <Card>
            <CardHeader title="Available Clean Rooms" subtitle={`${vacantCleanRooms.length} rooms ready to sell`} />
            <div className="max-h-[440px] space-y-2 overflow-y-auto p-4">
              {vacantCleanRooms.map((rm) => {
                const rt = roomTypes.find((t) => t.id === rm.roomTypeId);
                return (
                  <div
                    key={rm.id}
                    onClick={() => {
                      setWalkIn({
                        ...walkIn,
                        roomId: rm.id,
                        rate: rt?.baseRate || walkIn.rate,
                      });
                    }}
                    className={cn(
                      "cursor-pointer rounded-lg border p-3 transition-colors",
                      walkIn.roomId === rm.id
                        ? "border-gold-500/60 bg-gold-500/20"
                        : "border-brand-800/60 bg-brand-950/40 hover:border-brand-700"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-brand-100">Room {rm.number}</span>
                      <span className="font-semibold text-gold-400">{naira(rt?.baseRate || 35000)}</span>
                    </div>
                    <p className="mt-1 text-xs text-brand-200/80">{rt?.name}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {rm.features?.map((f) => (
                        <span key={f} className="rounded bg-brand-800/60 px-1.5 py-0.5 text-[10px] text-brand-300">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 5: TRACES & CONCIERGE */}
      {tab === "traces" && (
        <Card>
          <CardHeader
            title="Guest Traces & Departmental Action Board"
            subtitle="Cross-department communication: Front Desk, Housekeeping, Room Service, Concierge & Maintenance"
            action={
              <button
                onClick={() => setShowNewTraceModal(true)}
                className="flex items-center gap-1.5 rounded-lg border border-brand-700 bg-brand-800/60 px-3 py-1.5 text-xs font-semibold text-brand-100 hover:bg-brand-700"
              >
                <Plus size={13} /> Add Trace
              </button>
            }
          />
          <div className="flex items-center gap-2 border-b border-brand-800/60 px-5 py-2.5">
            <span className="text-xs text-brand-200/60">Filter Department:</span>
            {["all", "front_desk", "housekeeping", "room_service", "concierge", "maintenance"].map((dept) => (
              <button
                key={dept}
                onClick={() => setTraceFilterDept(dept)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs capitalize",
                  traceFilterDept === dept
                    ? "border border-brand-400/40 bg-brand-500/20 text-brand-100"
                    : "text-brand-200/60 hover:text-brand-100"
                )}
              >
                {dept.replace("_", " ")}
              </button>
            ))}
          </div>

          <Table head={["Due Time / Dept", "Guest / Room", "Trace Action Request", "Status", "Action"]}>
            {traces
              .filter((t) => traceFilterDept === "all" || t.department === traceFilterDept)
              .map((trc) => (
                <tr key={trc.id} className="hover:bg-brand-800/20">
                  <Td>
                    <div className="flex flex-col">
                      <span className="font-mono text-xs font-bold text-brand-100">{trc.time}</span>
                      <span className="text-[10px] uppercase tracking-wider text-gold-400">
                        {trc.department.replace("_", " ")}
                      </span>
                    </div>
                  </Td>

                  <Td>
                    <p className="font-medium text-brand-100">{trc.guestName}</p>
                    <p className="text-[11px] text-brand-200/50">Room {trc.roomNumber}</p>
                  </Td>

                  <Td>
                    <p className="max-w-md text-xs text-brand-100/90">{trc.message}</p>
                  </Td>

                  <Td>
                    {trc.status === "pending" ? (
                      <Badge className="border-rose-500/40 bg-rose-500/15 text-rose-200">
                        Action Required
                      </Badge>
                    ) : (
                      <Badge className="border-emerald-500/40 bg-emerald-500/15 text-emerald-200">
                        <CheckCircle2 size={11} /> Resolved by {trc.resolvedBy || "Staff"}
                      </Badge>
                    )}
                  </Td>

                  <Td>
                    {trc.status === "pending" ? (
                      <button
                        onClick={() => {
                          resolveTrace(trc.id, "Front Desk Manager");
                          notify("Trace marked as resolved and logged to guest stay history.");
                        }}
                        className="flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-200 hover:bg-emerald-500/30"
                      >
                        <CheckCircle2 size={12} /> Mark Resolved
                      </button>
                    ) : (
                      <span className="text-xs text-brand-200/40">Complete</span>
                    )}
                  </Td>
                </tr>
              ))}
          </Table>
        </Card>
      )}

      {/* TAB 6: KEY CARDS & RFID */}
      {tab === "keycards" && (
        <Card>
          <CardHeader
            title="Key Card Encoder & Access Control Registry"
            subtitle="Simulate RFID, Magnetic stripe, and BLE mobile electronic key generation with validity windows"
          />
          <Table head={["Key Card UID", "Room Number", "Guest Name", "Key Type", "Issued At", "Valid Until", "Status"]}>
            {keyCards.map((kc) => (
              <tr key={kc.id} className="hover:bg-brand-800/20">
                <Td>
                  <span className="font-mono text-xs font-bold text-sky-300">{kc.cardUid}</span>
                </Td>
                <Td>
                  <span className="font-mono text-sm font-bold text-brand-100">Room {kc.roomNumber}</span>
                </Td>
                <Td>
                  <span className="text-xs text-brand-100">{kc.guestName}</span>
                </Td>
                <Td>
                  <Badge className="border-brand-500/40 bg-brand-500/20 text-brand-200 capitalize">
                    {kc.keyType.replace("_", " ")}
                  </Badge>
                </Td>
                <Td>
                  <span className="text-xs text-brand-200/70">{kc.issuedAt}</span>
                </Td>
                <Td>
                  <span className="text-xs text-brand-200/70">{kc.validUntil}</span>
                </Td>
                <Td>
                  {kc.status === "active" ? (
                    <Badge className="border-emerald-500/40 bg-emerald-500/15 text-emerald-200">
                      Active Access
                    </Badge>
                  ) : (
                    <Badge className="border-stone-500/40 bg-stone-500/15 text-stone-300">
                      Revoked / Checked-Out
                    </Badge>
                  )}
                </Td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      {/* TAB 7: NIGHT AUDIT WORKSPACE */}
      {tab === "nightaudit" && (
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Night Audit & End-of-Day Business Close"
              subtitle={`Current Business Date: ${businessDate} · Automated posting of room charges, cashier balancing, and statistical roll`}
            />
            <div className="space-y-6 p-6">
              {/* Process Steps Indicator */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <div
                  onClick={() => setNightAuditStep(1)}
                  className={cn(
                    "cursor-pointer rounded-lg border p-3 transition-colors",
                    nightAuditStep >= 1 ? "border-purple-500/50 bg-purple-500/15 text-purple-100" : "border-brand-800/60 bg-brand-950/40 text-brand-200/50"
                  )}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/40 text-[11px]">1</span>
                    Arrivals & Departures Sweep
                  </div>
                  <p className="mt-1 text-[11px] text-brand-200/70">
                    Verify no-shows ({arrivals.length} pending) and close departures ({departures.length} pending).
                  </p>
                </div>

                <div
                  onClick={() => setNightAuditStep(2)}
                  className={cn(
                    "cursor-pointer rounded-lg border p-3 transition-colors",
                    nightAuditStep >= 2 ? "border-purple-500/50 bg-purple-500/15 text-purple-100" : "border-brand-800/60 bg-brand-950/40 text-brand-200/50"
                  )}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/40 text-[11px]">2</span>
                    Room & Tax Auto-Posting
                  </div>
                  <p className="mt-1 text-[11px] text-brand-200/70">
                    Post nightly room rate, VAT (7.5%), and Service Charge (10%) to {inHouse.length} in-house folios.
                  </p>
                </div>

                <div
                  onClick={() => setNightAuditStep(3)}
                  className={cn(
                    "cursor-pointer rounded-lg border p-3 transition-colors",
                    nightAuditStep >= 3 ? "border-purple-500/50 bg-purple-500/15 text-purple-100" : "border-brand-800/60 bg-brand-950/40 text-brand-200/50"
                  )}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/40 text-[11px]">3</span>
                    POS Shift Reconciliation
                  </div>
                  <p className="mt-1 text-[11px] text-brand-200/70">
                    Lock F&B outlet cash drawers, verify room-charge routing, and reconcile credit cards.
                  </p>
                </div>

                <div
                  onClick={() => setNightAuditStep(4)}
                  className={cn(
                    "cursor-pointer rounded-lg border p-3 transition-colors",
                    nightAuditStep >= 4 ? "border-purple-500/50 bg-purple-500/15 text-purple-100" : "border-brand-800/60 bg-brand-950/40 text-brand-200/50"
                  )}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/40 text-[11px]">4</span>
                    Advance Business Date
                  </div>
                  <p className="mt-1 text-[11px] text-brand-200/70">
                    Roll system clock to next calendar day and produce Manager's Daily Trial Balance.
                  </p>
                </div>
              </div>

              {/* Execution Actions */}
              <div className="rounded-xl border border-brand-800/80 bg-brand-950/60 p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-brand-50">Ready to execute End-of-Day Routine?</h4>
                    <p className="text-xs text-brand-200/60">
                      This will post nightly room charges across all {inHouse.length} in-house folios and advance the business date from {businessDate}.
                    </p>
                  </div>

                  <button
                    disabled={nightAuditRunning}
                    onClick={handleRunNightAudit}
                    className="flex items-center gap-2 rounded-lg border border-purple-500/50 bg-purple-500/25 px-5 py-2.5 text-xs font-semibold text-purple-100 hover:bg-purple-500/40 disabled:opacity-50"
                  >
                    {nightAuditRunning ? (
                      <>
                        <RotateCcw size={14} className="animate-spin" /> Running Audit Roll...
                      </>
                    ) : (
                      <>
                        <Moon size={14} /> Execute Full Night Audit Roll
                      </>
                    )}
                  </button>
                </div>

                {nightAuditResults && (
                  <div className="mt-5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
                      <CheckCircle2 size={16} /> Night Audit Successfully Completed!
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
                      <div>
                        <span className="text-brand-200/60">Rooms Charged:</span>
                        <p className="font-bold text-brand-100">{nightAuditResults.roomsCharged} folios</p>
                      </div>
                      <div>
                        <span className="text-brand-200/60">Total Revenue Posted:</span>
                        <p className="font-bold text-emerald-300">{naira(nightAuditResults.totalPosted)}</p>
                      </div>
                      <div>
                        <span className="text-brand-200/60">No-Shows Processed:</span>
                        <p className="font-bold text-brand-100">{nightAuditResults.noShowsHandled}</p>
                      </div>
                      <div>
                        <span className="text-brand-200/60">New Business Date:</span>
                        <p className="font-bold text-gold-400">{nightAuditResults.newBusinessDate}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL 1: CHECK-IN SUITE WIZARD */}
      {checkInModalRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-brand-700 bg-brand-900 p-6 text-brand-50 shadow-2xl">
            <div className="flex items-center justify-between border-b border-brand-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-brand-50">
                  Guest Check-In Suite — {checkInModalRes.confirmationNumber}
                </h3>
                <p className="text-xs text-brand-200/60">
                  Step {checkInStep} of 4:{" "}
                  {checkInStep === 1
                    ? "Identity & Document Verification"
                    : checkInStep === 2
                      ? "Room Assignment & Upgrades"
                      : checkInStep === 3
                        ? "Payment Guarantee & Deposit"
                        : "Key Card Encoder & Registration Sign-Off"}
                </p>
              </div>
              <button onClick={() => setCheckInModalRes(null)} className="text-brand-200/60 hover:text-brand-50">
                <X size={18} />
              </button>
            </div>

            <div className="py-5">
              {/* STEP 1: GUEST IDENTITY */}
              {checkInStep === 1 && (
                <div className="space-y-4">
                  {(() => {
                    const g = guests.find((x) => x.id === checkInModalRes.guestId);
                    return (
                      <div className="rounded-lg border border-brand-800 bg-brand-950/60 p-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-brand-100">
                            {g?.firstName} {g?.lastName}
                          </h4>
                          <Badge className="border-gold-500/40 bg-gold-500/15 text-gold-300">
                            {g?.vipTier || "VIP Tier Standard"}
                          </Badge>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-brand-200/50">Phone:</span>
                            <p className="text-brand-100">{g?.phone || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-brand-200/50">Email:</span>
                            <p className="text-brand-100">{g?.email || "N/A"}</p>
                          </div>
                          <div>
                            <span className="text-brand-200/50">Nationality:</span>
                            <p className="text-brand-100">{g?.nationality || "Nigerian"}</p>
                          </div>
                          <div>
                            <span className="text-brand-200/50">ID Document:</span>
                            <p className="text-brand-100">{g?.idType || "NIN / Passport"} (Verified ✓)</p>
                          </div>
                        </div>

                        {checkInModalRes.specialRequests && (
                          <div className="mt-3 rounded border border-brand-800 bg-brand-900/60 p-2 text-xs text-amber-200">
                            <span className="font-semibold">Special Request:</span> {checkInModalRes.specialRequests}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
                    ✓ Identity document scanned and matched against hotel guest blacklist. No security flags.
                  </div>
                </div>
              )}

              {/* STEP 2: ROOM ASSIGNMENT */}
              {checkInStep === 2 && (
                <div className="space-y-4">
                  <p className="text-xs text-brand-200/70">
                    Select a clean & inspected room for this stay. You may also apply an upgraded room category:
                  </p>
                  <div className="grid max-h-[300px] grid-cols-1 gap-2.5 overflow-y-auto sm:grid-cols-2">
                    {vacantCleanRooms.map((rm) => {
                      const t = roomTypes.find((x) => x.id === rm.roomTypeId);
                      const isSelected = selectedRoomId === rm.id;
                      return (
                        <div
                          key={rm.id}
                          onClick={() => setSelectedRoomId(rm.id)}
                          className={cn(
                            "cursor-pointer rounded-lg border p-3 transition-colors",
                            isSelected
                              ? "border-emerald-500 bg-emerald-500/20"
                              : "border-brand-800 bg-brand-950/60 hover:border-brand-700"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm font-bold text-brand-50">Room {rm.number}</span>
                            <Badge className="border-emerald-500/40 bg-emerald-500/20 text-emerald-300">
                              Clean & Inspected
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-brand-200/80">{t?.name}</p>
                          <p className="text-[11px] text-brand-200/50">
                            Floor {rm.floorId.replace("floor-", "")} · {rm.wing} Wing · {rm.bedType}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: PAYMENT GUARANTEE */}
              {checkInStep === 3 && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-brand-800 bg-brand-950/60 p-4 text-xs">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-brand-200/80">Estimated Stay Amount:</span>
                      <span className="font-mono text-sm text-brand-50">{naira(checkInModalRes.totalEstimate)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-brand-200/60">
                      <span>Prior Deposit:</span>
                      <span>{naira(checkInModalRes.depositPaid)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-brand-200/80">Guarantee / Pre-Auth Method</label>
                    <select
                      value={depositMethod}
                      onChange={(e) => setDepositMethod(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-brand-800 bg-brand-950/60 px-3 py-2 text-xs text-brand-100 focus:border-brand-500 focus:outline-none"
                    >
                      <option value="Credit Card">Credit Card Pre-Authorization</option>
                      <option value="Cash Deposit">Cash Deposit</option>
                      <option value="Direct Bill / Corporate City Ledger">Direct Bill / Corporate City Ledger</option>
                      <option value="Bank Wire / Proof of Payment">Bank Wire / Verified Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-brand-200/80">
                      Collect Advance Deposit Amount (NGN)
                    </label>
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 50000"
                      className="mt-1 w-full rounded-lg border border-brand-800 bg-brand-950/60 px-3 py-2 text-xs text-brand-100 focus:border-brand-500 focus:outline-none"
                    />
                    <p className="mt-1 text-[11px] text-brand-200/50">
                      Deposits post as credit in Folio Window 1 and reduce balance automatically.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 4: KEY CARD & SIGN-OFF */}
              {checkInStep === 4 && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-brand-800 bg-brand-950/60 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Key size={16} className="text-gold-400" />
                        <span className="text-xs font-semibold text-brand-100">Electronic Key Encoder</span>
                      </div>
                      <select
                        value={keyCardType}
                        onChange={(e) => setKeyCardType(e.target.value as any)}
                        className="rounded border border-brand-700 bg-brand-900 px-2 py-1 text-xs text-brand-100"
                      >
                        <option value="guest">New Guest Key</option>
                        <option value="duplicate">Duplicate Key</option>
                        <option value="mobile_nfc">Mobile BLE / NFC Pass</option>
                      </select>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-brand-800 pt-3">
                      <div>
                        <p className="text-xs font-medium text-brand-100">
                          Target Room: {rooms.find((r) => r.id === selectedRoomId)?.number}
                        </p>
                        <p className="text-[11px] text-brand-200/50">Valid until {checkInModalRes.departureDate} 12:00</p>
                      </div>

                      <button
                        type="button"
                        disabled={isEncodingKey}
                        onClick={handleSimulateKeyEncode}
                        className="flex items-center gap-1.5 rounded-lg border border-gold-500/50 bg-gold-500/20 px-3 py-1.5 text-xs font-semibold text-gold-100 hover:bg-gold-500/30"
                      >
                        {isEncodingKey ? (
                          <>
                            <RotateCcw size={12} className="animate-spin" /> Encoding Card...
                          </>
                        ) : (
                          <>
                            <Key size={12} /> Encode Card Now
                          </>
                        )}
                      </button>
                    </div>

                    {encodedKeyResult && (
                      <div className="mt-3 rounded border border-emerald-500/40 bg-emerald-500/15 p-2 text-xs text-emerald-200">
                        ✓ RFID Card Encoded: {encodedKeyResult.cardUid} for Room {encodedKeyResult.roomNumber}
                      </div>
                    )}
                  </div>

                  {/* Digital Registration Card confirmation */}
                  <div className="rounded-lg border border-brand-800 bg-brand-950/60 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCheck2 size={16} className="text-sky-400" />
                        <span className="text-xs font-semibold text-brand-100">Guest Registration Agreement</span>
                      </div>
                      <label className="flex items-center gap-2 text-xs text-brand-200/80">
                        <input
                          type="checkbox"
                          checked={signedRegCard}
                          onChange={(e) => setSignedRegCard(e.target.checked)}
                          className="rounded border-brand-700 bg-brand-900 text-emerald-500"
                        />
                        Guest Digitally Signed
                      </label>
                    </div>
                    <p className="mt-2 text-[11px] text-brand-200/60">
                      Guest acknowledges hotel policies, smoking prohibition in suites, and checkout time (12:00 PM).
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Wizard Navigation */}
            <div className="flex items-center justify-between border-t border-brand-800 pt-4">
              {checkInStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCheckInStep((s) => s - 1)}
                  className="rounded-lg border border-brand-700 px-3 py-1.5 text-xs text-brand-200 hover:bg-brand-800"
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              {checkInStep < 4 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (checkInStep === 2 && !selectedRoomId) {
                      notify("Please select a clean room to continue.");
                      return;
                    }
                    setCheckInStep((s) => s + 1);
                  }}
                  className="flex items-center gap-1 rounded-lg border border-brand-600 bg-brand-700 px-4 py-1.5 text-xs font-semibold text-brand-50 hover:bg-brand-600"
                >
                  Next Step <ArrowRight size={13} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCompleteCheckIn}
                  className="flex items-center gap-1.5 rounded-lg border border-emerald-500/60 bg-emerald-500/25 px-5 py-2 text-xs font-bold text-emerald-100 hover:bg-emerald-500/40"
                >
                  <CheckCircle2 size={14} /> Complete Check-In
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ROOM MOVE / TRANSFER */}
      {roomMoveModalRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-brand-700 bg-brand-900 p-6 text-brand-50 shadow-2xl">
            <div className="flex items-center justify-between border-b border-brand-800 pb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft size={16} className="text-sky-400" />
                <h3 className="text-sm font-bold text-brand-50">Room Move / Transfer Suite</h3>
              </div>
              <button onClick={() => setRoomMoveModalRes(null)} className="text-brand-200/60 hover:text-brand-50">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 py-4">
              <div className="rounded-lg border border-brand-800 bg-brand-950/60 p-3 text-xs">
                <span className="text-brand-200/60">Current Room:</span>
                <p className="font-mono text-sm font-bold text-brand-50">
                  Room {rooms.find((r) => r.id === roomMoveModalRes.roomId)?.number}
                </p>
                <p className="text-[11px] text-brand-200/50">
                  Guest: {guests.find((g) => g.id === roomMoveModalRes.guestId)?.firstName}{" "}
                  {guests.find((g) => g.id === roomMoveModalRes.guestId)?.lastName}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-200/80">Transfer To Clean Room *</label>
                <select
                  value={moveTargetRoomId}
                  onChange={(e) => setMoveTargetRoomId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-brand-800 bg-brand-950/60 px-3 py-2 text-xs text-brand-100 focus:border-brand-500 focus:outline-none"
                >
                  <option value="">Select target room...</option>
                  {vacantCleanRooms
                    .filter((r) => r.id !== roomMoveModalRes.roomId)
                    .map((rm) => {
                      const t = roomTypes.find((x) => x.id === rm.roomTypeId);
                      return (
                        <option key={rm.id} value={rm.id}>
                          Room {rm.number} — {t?.name} ({rm.bedType})
                        </option>
                      );
                    })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-200/80">Reason for Move *</label>
                <select
                  value={moveReason}
                  onChange={(e) => setMoveReason(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-brand-800 bg-brand-950/60 px-3 py-2 text-xs text-brand-100 focus:border-brand-500 focus:outline-none"
                >
                  <option value="Guest requested quieter room away from elevator">Guest requested quieter room</option>
                  <option value="HVAC / Air conditioner failure in current room">HVAC / Air conditioning issue</option>
                  <option value="Plumbing / Water pressure defect">Plumbing / Water defect</option>
                  <option value="Complimentary Manager VIP Upgrade">Complimentary VIP Upgrade</option>
                  <option value="Guest paid category upcharge">Paid category upcharge</option>
                </select>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-brand-800 bg-brand-950/60 p-3">
                <div>
                  <label className="flex items-center gap-2 text-xs font-medium text-brand-100">
                    <input
                      type="checkbox"
                      checked={moveIsComplimentary}
                      onChange={(e) => setMoveIsComplimentary(e.target.checked)}
                      className="rounded border-brand-700 bg-brand-900 text-emerald-500"
                    />
                    Complimentary Move (No Rate Change)
                  </label>
                  <p className="mt-0.5 text-[11px] text-brand-200/50">
                    Preserves current reservation rate and folio charges.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                Notice: Executing this move will immediately turn current room to Vacant Dirty, alert housekeeping for a touch-up clean, and update key card valid permissions.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-brand-800 pt-4">
              <button
                type="button"
                onClick={() => setRoomMoveModalRes(null)}
                className="rounded-lg border border-brand-700 px-3 py-1.5 text-xs text-brand-200 hover:bg-brand-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRoomMove}
                className="flex items-center gap-1.5 rounded-lg border border-sky-500/50 bg-sky-500/25 px-4 py-1.5 text-xs font-semibold text-sky-100 hover:bg-sky-500/40"
              >
                <ArrowRightLeft size={13} /> Confirm Room Move
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: MULTI-WINDOW FOLIO & CASHIERING */}
      {folioModalRes && currentFolioData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-brand-700 bg-brand-900 p-6 text-brand-50 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-brand-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Receipt size={18} className="text-gold-400" />
                  <h3 className="text-base font-bold text-brand-50">
                    Guest Folio — {currentFolioData.folio.folioNumber}
                  </h3>
                  <Badge className="border-brand-500/40 bg-brand-500/20 text-brand-200">
                    Room {currentFolioRoom?.number}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-brand-200/60">
                  Guest: {currentFolioGuest?.firstName} {currentFolioGuest?.lastName} · Conf #{folioModalRes.confirmationNumber}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPrintInvoice(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-brand-700 bg-brand-800/80 px-3 py-1.5 text-xs font-semibold text-brand-100 hover:bg-brand-700"
                >
                  <Printer size={13} /> Print Invoice
                </button>
                <button onClick={() => setFolioModalRes(null)} className="text-brand-200/60 hover:text-brand-50">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Folio Multi-Window Tabs */}
            <div className="mt-4 flex items-center justify-between border-b border-brand-800 pb-2">
              <div className="flex items-center gap-2">
                {[
                  { id: 1, label: "Window 1: Room & Tax" },
                  { id: 2, label: "Window 2: Extras & Incidentals" },
                  { id: 3, label: "Window 3: Corporate Direct Bill" },
                ].map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setActiveFolioWindow(w.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      activeFolioWindow === w.id
                        ? "border border-gold-400/50 bg-gold-500/20 text-gold-100"
                        : "text-brand-200/60 hover:bg-brand-800 hover:text-brand-100"
                    )}
                  >
                    <Layers size={12} /> {w.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPostChargeModal(true)}
                  className="flex items-center gap-1 rounded-md border border-brand-700 bg-brand-800 px-2.5 py-1 text-xs font-semibold text-brand-100 hover:bg-brand-700"
                >
                  <Plus size={12} /> Post Charge
                </button>
                <button
                  onClick={() => setShowSettleModal(true)}
                  className="flex items-center gap-1 rounded-md border border-emerald-500/50 bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/30"
                >
                  <Wallet size={12} /> Settle Window
                </button>
              </div>
            </div>

            {/* Current Window Statement Table */}
            <div className="py-4">
              <div className="mb-3 flex items-center justify-between rounded-lg border border-brand-800 bg-brand-950/60 p-3 text-xs">
                <div>
                  <span className="text-brand-200/50">Debits (Charges):</span>
                  <p className="font-mono text-sm font-bold text-brand-100">{naira(windowDebits)}</p>
                </div>
                <div>
                  <span className="text-brand-200/50">Credits (Payments):</span>
                  <p className="font-mono text-sm font-bold text-emerald-300">{naira(windowCredits)}</p>
                </div>
                <div>
                  <span className="text-brand-200/50">Window Net Balance:</span>
                  <p
                    className={cn(
                      "font-mono text-sm font-bold",
                      windowBalance > 0 ? "text-rose-300" : windowBalance < 0 ? "text-emerald-300" : "text-brand-100"
                    )}
                  >
                    {windowBalance > 0 ? `Guest Owes ${naira(windowBalance)}` : windowBalance < 0 ? `Credit ${naira(Math.abs(windowBalance))}` : "0.00 Settled"}
                  </p>
                </div>
              </div>

              <Table head={["Date / Ref", "Dept", "Description", "Subtotal", "Tax (VAT/SC)", "Total Amount", "Window Transfer"]}>
                {currentWindowLines.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-brand-200/50">
                      No transactions posted to Folio Window {activeFolioWindow} yet.
                    </td>
                  </tr>
                ) : (
                  currentWindowLines.map((line) => (
                    <tr key={line.id} className="hover:bg-brand-800/20">
                      <Td>
                        <div className="flex flex-col">
                          <span className="text-xs text-brand-100">{line.date || businessDate}</span>
                          <span className="font-mono text-[10px] text-brand-200/50">{line.reference || "TX-01"}</span>
                        </div>
                      </Td>
                      <Td>
                        <Badge className="border-brand-700 bg-brand-800/80 text-[10px] text-brand-200">
                          {line.department || "General"}
                        </Badge>
                      </Td>
                      <Td>
                        <span className="text-xs font-medium text-brand-100">{line.description}</span>
                      </Td>
                      <Td>
                        <span className="font-mono text-xs text-brand-200/80">
                          {naira(line.subtotal || line.amount)}
                        </span>
                      </Td>
                      <Td>
                        <span className="font-mono text-xs text-brand-200/60">
                          {naira(line.taxAmount || 0)}
                        </span>
                      </Td>
                      <Td>
                        <span
                          className={cn(
                            "font-mono text-xs font-bold",
                            line.type === "credit" ? "text-emerald-300" : "text-brand-50"
                          )}
                        >
                          {line.type === "credit" ? `-${naira(Math.abs(line.amount))}` : naira(line.amount)}
                        </span>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3]
                            .filter((w) => w !== activeFolioWindow)
                            .map((targetW) => (
                              <button
                                key={targetW}
                                onClick={() => {
                                  if (line.id) {
                                    transferFolioCharge(line.id, targetW);
                                    notify(`Charge transferred to Window ${targetW}.`);
                                  }
                                }}
                                title={`Move to Window ${targetW}`}
                                className="rounded border border-brand-700 bg-brand-800 px-1.5 py-0.5 text-[10px] text-brand-200 hover:bg-brand-700"
                              >
                                → W{targetW}
                              </button>
                            ))}
                        </div>
                      </Td>
                    </tr>
                  ))
                )}
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL: POST DETAILED CHARGE */}
      {showPostChargeModal && folioModalRes && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-xl border border-brand-700 bg-brand-900 p-5 text-brand-50 shadow-2xl">
            <div className="flex items-center justify-between border-b border-brand-800 pb-3">
              <h4 className="text-sm font-bold text-brand-50">
                Post Charge — Window {activeFolioWindow}
              </h4>
              <button onClick={() => setShowPostChargeModal(false)} className="text-brand-200/60 hover:text-brand-50">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handlePostDetailedCharge} className="space-y-3 py-3">
              <div>
                <label className="block text-xs font-medium text-brand-200/80">Department</label>
                <select
                  value={newChargeDept}
                  onChange={(e) => setNewChargeDept(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-brand-800 bg-brand-950/60 px-3 py-2 text-xs text-brand-100"
                >
                  <option value="Rooms">Rooms Division</option>
                  <option value="F&B">Food & Beverage (Restaurant / Bar)</option>
                  <option value="Minibar">In-Room Minibar</option>
                  <option value="Laundry">Guest Laundry & Dry Cleaning</option>
                  <option value="Spa">Spa & Wellness</option>
                  <option value="Transport">Airport Transfer & Chauffeur</option>
                  <option value="Miscellaneous">Miscellaneous Incidentals</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-200/80">Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lagoon Bar Cocktail bill #492"
                  value={newChargeDesc}
                  onChange={(e) => setNewChargeDesc(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-brand-800 bg-brand-950/60 px-3 py-2 text-xs text-brand-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-200/80">Gross Amount (NGN) *</label>
                <input
                  type="number"
                  required
                  placeholder="15000"
                  value={newChargeAmount}
                  onChange={(e) => setNewChargeAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-brand-800 bg-brand-950/60 px-3 py-2 text-xs text-brand-100"
                />
                <p className="mt-1 text-[10px] text-brand-200/50">
                  Includes automatic breakdown for 7.5% VAT and 10% Service Charge.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-200/80">Reference / Docket #</label>
                <input
                  type="text"
                  placeholder="e.g. DOC-9821"
                  value={newChargeRef}
                  onChange={(e) => setNewChargeRef(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-brand-800 bg-brand-950/60 px-3 py-2 text-xs text-brand-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-brand-800 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPostChargeModal(false)}
                  className="rounded-lg border border-brand-700 px-3 py-1.5 text-xs text-brand-200 hover:bg-brand-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg border border-gold-500/50 bg-gold-500/25 px-4 py-1.5 text-xs font-semibold text-gold-100 hover:bg-gold-500/40"
                >
                  Confirm Posting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: SETTLE FOLIO WINDOW */}
      {showSettleModal && folioModalRes && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-xl border border-brand-700 bg-brand-900 p-5 text-brand-50 shadow-2xl">
            <div className="flex items-center justify-between border-b border-brand-800 pb-3">
              <h4 className="text-sm font-bold text-brand-50">
                Settle Folio Window {activeFolioWindow}
              </h4>
              <button onClick={() => setShowSettleModal(false)} className="text-brand-200/60 hover:text-brand-50">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSettleWindow} className="space-y-4 py-3">
              <div className="rounded-lg border border-brand-800 bg-brand-950/60 p-3 text-xs">
                <span className="text-brand-200/60">Outstanding Window Balance:</span>
                <p className="font-mono text-lg font-bold text-gold-400">{naira(Math.max(0, windowBalance))}</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-200/80">Tender / Payment Method</label>
                <select
                  value={settleMethod}
                  onChange={(e) => setSettleMethod(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-brand-800 bg-brand-950/60 px-3 py-2 text-xs text-brand-100"
                >
                  <option value="card">Credit / Debit Card (POS Terminal)</option>
                  <option value="cash">Cash Tender</option>
                  <option value="transfer">Bank Electronic Wire / NIP</option>
                  <option value="city_ledger">Corporate City Ledger (Direct Bill)</option>
                  <option value="complimentary">Complimentary / Management Waiver</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-200/80">Receipt / Transaction Ref</label>
                <input
                  type="text"
                  placeholder="e.g. POS-AUTH-9281"
                  value={settleRef}
                  onChange={(e) => setSettleRef(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-brand-800 bg-brand-950/60 px-3 py-2 text-xs text-brand-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-brand-800 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSettleModal(false)}
                  className="rounded-lg border border-brand-700 px-3 py-1.5 text-xs text-brand-200 hover:bg-brand-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg border border-emerald-500/50 bg-emerald-500/25 px-4 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/40"
                >
                  Process Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PRINT OFFICIAL FOLIO INVOICE */}
      {showPrintInvoice && folioModalRes && currentFolioData && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-stone-300 bg-white p-8 text-stone-900 shadow-2xl">
            <div className="flex items-start justify-between border-b-2 border-stone-800 pb-4">
              <div>
                <h2 className="font-serif text-2xl font-bold tracking-tight text-stone-900">
                  GRAND PALM HOTEL LAGOS
                </h2>
                <p className="text-xs text-stone-600">Plot 12, Victoria Island Boulevard, Lagos, Nigeria</p>
                <p className="text-xs text-stone-600">TIN: 10928374-0001 · VAT Reg No: W382910</p>
              </div>
              <div className="text-right">
                <span className="rounded bg-stone-100 px-2 py-1 font-mono text-xs font-bold text-stone-800">
                  OFFICIAL TAX INVOICE
                </span>
                <p className="mt-1 font-mono text-xs font-semibold text-stone-800">
                  Folio: {currentFolioData.folio.folioNumber}
                </p>
                <p className="text-[11px] text-stone-500">Date: {businessDate}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="font-semibold uppercase text-stone-500">Guest Information</p>
                <p className="font-bold text-stone-900">
                  {currentFolioGuest?.firstName} {currentFolioGuest?.lastName}
                </p>
                <p>{currentFolioGuest?.company || "Personal Account"}</p>
                <p>{currentFolioGuest?.phone}</p>
              </div>
              <div>
                <p className="font-semibold uppercase text-stone-500">Stay Information</p>
                <p>
                  <span className="font-medium">Room:</span> {currentFolioRoom?.number}
                </p>
                <p>
                  <span className="font-medium">Arrival:</span> {fmtDate(folioModalRes.arrivalDate)}
                </p>
                <p>
                  <span className="font-medium">Departure:</span> {fmtDate(folioModalRes.departureDate)}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-300 font-bold uppercase text-stone-600">
                    <th className="py-2">Date</th>
                    <th className="py-2">Department</th>
                    <th className="py-2">Description</th>
                    <th className="py-2 text-right">Amount (NGN)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {currentFolioData.lines.map((l) => (
                    <tr key={l.id}>
                      <td className="py-2">{l.date || businessDate}</td>
                      <td className="py-2">{l.department}</td>
                      <td className="py-2">{l.description}</td>
                      <td className="py-2 text-right font-mono">
                        {l.type === "credit" ? `-${naira(Math.abs(l.amount))}` : naira(l.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex items-end justify-between border-t-2 border-stone-800 pt-4">
              <div className="flex items-center gap-2">
                <QrCode size={40} className="text-stone-800" />
                <div className="text-[10px] text-stone-500">
                  <p>Certified Electronic Tax Receipt</p>
                  <p>Verify at: verify.grandpalm.com</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-stone-600">Final Balance Due:</p>
                <p className="font-mono text-xl font-bold text-stone-900">
                  {naira(Math.max(0, currentFolioData.folio.balance))}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-stone-200 pt-4">
              <button
                type="button"
                onClick={() => setShowPrintInvoice(false)}
                className="rounded-lg border border-stone-400 px-4 py-1.5 text-xs text-stone-700 hover:bg-stone-100"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-stone-800"
              >
                <Printer size={13} /> Print / Save as PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NEW GUEST TRACE */}
      {showNewTraceModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-xl border border-brand-700 bg-brand-900 p-5 text-brand-50 shadow-2xl">
            <div className="flex items-center justify-between border-b border-brand-800 pb-3">
              <h4 className="text-sm font-bold text-brand-50">Create Guest Trace / Request</h4>
              <button onClick={() => setShowNewTraceModal(false)} className="text-brand-200/60 hover:text-brand-50">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateTrace} className="space-y-3 py-3">
              <div>
                <label className="block text-xs font-medium text-brand-200/80">Guest Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chief Adebayo Alade"
                  value={newTraceGuestName}
                  onChange={(e) => setNewTraceGuestName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-brand-800 bg-brand-950/60 px-3 py-2 text-xs text-brand-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-200/80">Room Number</label>
                <input
                  type="text"
                  placeholder="e.g. 101"
                  value={newTraceRoomNo}
                  onChange={(e) => setNewTraceRoomNo(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-brand-800 bg-brand-950/60 px-3 py-2 text-xs text-brand-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-200/80">Assigned Department *</label>
                <select
                  value={newTraceDept}
                  onChange={(e) => setNewTraceDept(e.target.value as any)}
                  className="mt-1 w-full rounded-lg border border-brand-800 bg-brand-950/60 px-3 py-2 text-xs text-brand-100"
                >
                  <option value="front_desk">Front Desk</option>
                  <option value="housekeeping">Housekeeping</option>
                  <option value="room_service">Room Service / F&B</option>
                  <option value="concierge">Concierge / Transport</option>
                  <option value="maintenance">Engineering / Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-200/80">Target Action Time</label>
                <input
                  type="time"
                  value={newTraceTime}
                  onChange={(e) => setNewTraceTime(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-brand-800 bg-brand-950/60 px-3 py-2 text-xs text-brand-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-brand-200/80">Instruction / Trace Message *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Arrange 06:30 wakeup call and taxi for airport departure."
                  value={newTraceMsg}
                  onChange={(e) => setNewTraceMsg(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-brand-800 bg-brand-950/60 px-3 py-2 text-xs text-brand-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-brand-800 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewTraceModal(false)}
                  className="rounded-lg border border-brand-700 px-3 py-1.5 text-xs text-brand-200 hover:bg-brand-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg border border-sky-500/50 bg-sky-500/25 px-4 py-1.5 text-xs font-semibold text-sky-100 hover:bg-sky-500/40"
                >
                  <Send size={12} /> Assign Trace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <GuestFlagModal
        isOpen={Boolean(selectedFlagGuest)}
        guest={selectedFlagGuest}
        onClose={() => setSelectedFlagGuest(null)}
      />
    </div>
  );
}
