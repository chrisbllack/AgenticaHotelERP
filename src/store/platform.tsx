import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  guests as seedGuests,
  reservations as seedReservations,
  rooms as seedRooms,
  housekeepingTasks as seedTasks,
  posOrders as seedOrders,
  posOrderLines as seedOrderLines,
  guestStays as seedStays,
  folios as seedFolios,
  menuItems as seedMenuItems,
  employees as seedEmployees,
} from "../data/demo";
import type {
  Folio,
  FolioLine,
  Guest,
  GuestFlag,
  GuestStay,
  GuestTrace,
  HousekeepingTask,
  KeyCardRecord,
  MenuItem,
  PosOrder,
  PosOrderLine,
  Reservation,
  Room,
  RoomStatus,
  ShiftHandoverRecord,
  PreventativeMaintenanceSchedule,
  PmInspectionLog,
  DynamicRateRecommendation,
  YieldRule,
  NightAuditReport,
  GuestSurveyResponse,
  ServiceRecoveryTicket,
  LostAndFoundItem,
  LostAndFoundStatus,
  RoomEnergyReading,
  SmartRoomControl,
  USALIDepartmentStatement,
  CityLedgerAccount,
  CityLedgerInvoice,
  AccountsPayableInvoice,
  TaxRemittanceSchedule,
  RestaurantTable,
  TableStatus,
  KitchenOrderTicket,
  KotStatus,
  RecipeCostingItem,
  BanquetEventOrder,
  KitchenWasteLog,
  SupplyChainStore,
  SupplyChainProduct,
  PurchaseRequisition,
  GoodsReceivedNote,
  StoreTransferRecord,
  StocktakeAuditRecord,
  SupplierContract,
  SupplierContractStatus,
  SupplierContractSla,
  KitchenPrepItem,
  KitchenPrepStation,
  PrepItemStatus,
  DailyCashFlowEntry,
  CashFlowScenario,
  MaintenanceAuditRecord,
  GuestPersonalizedPreferences,
  CoreInventoryThresholdItem,
  InventoryAlertNotification,
} from "../types";
import {
  initialHandovers,
  initialPmSchedules,
  initialPmLogs,
  initialRateRecommendations,
  initialYieldRules,
  initialAuditReports,
  initialGuestSurveys,
  initialRecoveryTickets,
  initialLostAndFound,
  initialEnergyReadings,
  initialSmartRoomControls,
} from "../data/enterpriseData";
import {
  initialUSALIDepartments,
  initialCityLedgerAccounts,
  initialAccountsPayableInvoices,
  initialTaxSchedules,
  initialRestaurantTables,
  initialKitchenTickets,
  initialRecipeCostings,
  initialBanquetOrders,
  initialKitchenWasteLogs,
  initialSupplyChainStores,
  initialSupplyChainProducts,
  initialPurchaseRequisitions,
  initialGoodsReceivedNotes,
  initialStoreTransfers,
  initialStocktakeAudits,
  initialSupplierContracts,
  initialKitchenPrepItems,
  generateCashFlowForecast,
  initialMaintenanceAuditRecords,
  initialGuestPersonalizedPreferences,
  initialCoreInventoryThresholdItems,
  initialInventoryAlertNotifications,
} from "../data/hospitalityEnterpriseData";

export const VAT_RATE = 0.075;
export const SERVICE_CHARGE_RATE = 0.10;
export const CONSUMPTION_TAX_RATE = 0.05;

export interface WalkInInput {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  nationality?: string;
  company?: string;
  idType?: string;
  idNumber?: string;
  roomId: string;
  nights: number;
  rate: number;
  marketSegment?: string;
}

export interface CheckInOptions {
  reservationId: string;
  assignedRoomId?: string;
  keyCardType?: "guest" | "duplicate" | "master" | "mobile_nfc";
  depositAmount?: number;
  depositMethod?: string;
  idType?: string;
  idNumber?: string;
  specialRequests?: string;
}

export interface RoomMoveInput {
  reservationId: string;
  toRoomId: string;
  reason: string;
  isComplimentary: boolean;
  rateAdjustment?: number;
}

export interface DetailedChargeInput {
  folioId: string;
  window: number;
  department: string;
  description: string;
  subtotal: number;
  taxAmount: number;
  reference?: string;
}

export interface FolioSettlementInput {
  folioId: string;
  window: number;
  paymentMethod: string;
  amount: number;
  reference: string;
}

export interface PlatformState {
  businessDate: string;
  rooms: Room[];
  guests: Guest[];
  reservations: Reservation[];
  stays: GuestStay[];
  folios: Folio[];
  folioLines: FolioLine[];
  tasks: HousekeepingTask[];
  orders: PosOrder[];
  orderLines: PosOrderLine[];
  menuItems: MenuItem[];
  traces: GuestTrace[];
  keyCards: KeyCardRecord[];
  
  // Lodging operations
  createWalkIn: (input: WalkInInput) => Reservation;
  checkIn: (reservationId: string, options?: Partial<CheckInOptions>) => void;
  checkOut: (reservationId: string) => void;
  assignRoomToReservation: (reservationId: string, roomId: string) => void;
  roomMove: (input: RoomMoveInput) => void;
  updateRoomStatus: (
    roomId: string,
    status: RoomStatus,
    hkStatus?: "clean" | "dirty" | "inspected",
    oooReason?: string,
    oooReturnDate?: string
  ) => void;
  assignHousekeeper: (roomId: string, employeeName: string, credits: number) => void;
  
  // Key card operations
  encodeKeyCard: (reservationId: string, roomId: string, keyType: "guest" | "duplicate" | "master" | "mobile_nfc") => KeyCardRecord;
  
  // Traces & Concierge
  addTrace: (trace: Omit<GuestTrace, "id">) => void;
  resolveTrace: (traceId: string, resolvedBy?: string) => void;
  
  // Housekeeping task operations
  completeTask: (taskId: string) => void;
  inspectTask: (taskId: string) => void;
  assignTask: (taskId: string, employeeId: string) => void;
  
  // POS operations
  createOrder: (outletId: string, lines: PosOrderLine[]) => PosOrder;
  closeOrder: (orderId: string) => void;
  
  // Multi-window Cashiering & Billing operations
  postCharge: (folioId: string, description: string, amount: number) => void;
  postChargeDetailed: (input: DetailedChargeInput) => void;
  postPayment: (folioId: string, amount: number) => void;
  settleFolioWindow: (input: FolioSettlementInput) => void;
  transferFolioCharge: (folioLineId: string, toWindow: number) => void;
  
  // Night Audit & Business Day
  runNightAuditStep: () => {
    roomsCharged: number;
    totalPosted: number;
    noShowsHandled: number;
    newBusinessDate: string;
  };
  auditReports: NightAuditReport[];
  executeComprehensiveNightAudit: (auditorName?: string) => NightAuditReport;

  // Shift Handover
  shiftHandovers: ShiftHandoverRecord[];
  createShiftHandover: (handover: Omit<ShiftHandoverRecord, "id" | "handoverNumber" | "submittedAt" | "status">) => ShiftHandoverRecord;
  acknowledgeShiftHandover: (handoverId: string, staffName: string) => void;
  updateShiftHandover: (handoverId: string, updates: Partial<ShiftHandoverRecord>) => void;

  // Preventative Maintenance
  pmSchedules: PreventativeMaintenanceSchedule[];
  pmLogs: PmInspectionLog[];
  createPmSchedule: (schedule: Omit<PreventativeMaintenanceSchedule, "id" | "scheduleCode">) => void;
  logPmInspection: (log: Omit<PmInspectionLog, "id" | "inspectedAt">) => void;
  updatePmSchedule: (scheduleId: string, updates: Partial<PreventativeMaintenanceSchedule>) => void;

  // Yield & Revenue Management
  rateRecommendations: DynamicRateRecommendation[];
  yieldRules: YieldRule[];
  applyRateRecommendation: (roomTypeId: string, newRate: number) => void;
  toggleYieldRule: (ruleId: string) => void;
  addYieldRule: (rule: Omit<YieldRule, "id">) => void;

  // Guest Sentiment & CRM Recovery
  guestSurveys: GuestSurveyResponse[];
  recoveryTickets: ServiceRecoveryTicket[];
  createSurveyResponse: (survey: Omit<GuestSurveyResponse, "id" | "submittedAt">) => GuestSurveyResponse;
  updateRecoveryTicket: (ticketId: string, updates: Partial<ServiceRecoveryTicket>) => void;

  // Guest Profile Flagging (M-CRM)
  updateGuestFlags: (guestId: string, flags: GuestFlag[], blacklistReason?: string, flagNotes?: string) => void;
  toggleGuestFlag: (guestId: string, flag: GuestFlag, reason?: string) => void;

  // Lost and Found (M-HKP)
  lostAndFound: LostAndFoundItem[];
  createLostAndFoundItem: (item: Omit<LostAndFoundItem, "id" | "itemNumber">) => LostAndFoundItem;
  updateLostAndFoundStatus: (
    itemId: string,
    status: LostAndFoundStatus,
    details?: { claimedBy?: string; guestEmail?: string; returnedByStaff?: string; disposalReason?: string }
  ) => void;
  sendLostAndFoundEmail: (itemId: string, recipientEmail: string, message: string) => { sent: boolean; sentAt: string };

  // Room Energy Telemetry & BMS (M-ENG)
  roomEnergyReadings: RoomEnergyReading[];
  triggerEcoKillswitch: (roomId: string) => void;
  resetEnergyAlert: (roomId: string) => void;

  // Smart Room Controls & Guest Portal Service Layer (M-GST)
  smartRoomControls: Record<string, SmartRoomControl>;
  updateSmartRoom: (roomId: string, updates: Partial<SmartRoomControl>) => void;
  toggleRoomDnd: (roomId: string) => boolean;
  toggleRoomMur: (roomId: string) => boolean;

  // Hospitality Finance (USALI, City Ledger, AP, Taxes)
  usaliStatements: USALIDepartmentStatement[];
  cityLedgerAccounts: CityLedgerAccount[];
  accountsPayableInvoices: AccountsPayableInvoice[];
  taxSchedules: TaxRemittanceSchedule[];
  recordCityLedgerPayment: (accountId: string, invoiceId: string, amountPaid: number) => void;
  createCityLedgerInvoice: (accountId: string, invoice: Omit<CityLedgerInvoice, "id" | "daysOverdue" | "netPayable">) => void;
  approveApInvoice: (invoiceId: string) => void;
  payApInvoice: (invoiceId: string, voucherRef: string) => void;
  remitTaxSchedule: (taxId: string, filingRef: string) => void;

  // Food & Beverage Operations (Tables, KOT, Costing, BEO, Waste)
  restaurantTables: RestaurantTable[];
  kitchenTickets: KitchenOrderTicket[];
  recipeCostings: RecipeCostingItem[];
  banquetOrders: BanquetEventOrder[];
  kitchenWasteLogs: KitchenWasteLog[];
  updateTableStatus: (tableId: string, status: TableStatus, guestName?: string, covers?: number) => void;
  updateKotStatus: (ticketId: string, status: KotStatus) => void;
  createBanquetOrder: (beo: Omit<BanquetEventOrder, "id" | "beoNumber">) => BanquetEventOrder;
  logKitchenWaste: (waste: Omit<KitchenWasteLog, "id" | "date">) => void;

  // Supply Chain & Inventory
  supplyChainStores: SupplyChainStore[];
  supplyChainProducts: SupplyChainProduct[];
  purchaseRequisitions: PurchaseRequisition[];
  goodsReceivedNotes: GoodsReceivedNote[];
  storeTransfers: StoreTransferRecord[];
  stocktakeAudits: StocktakeAuditRecord[];
  createPurchaseRequisition: (req: Omit<PurchaseRequisition, "id" | "requisitionNumber" | "requestDate">) => PurchaseRequisition;
  approvePurchaseRequisition: (reqId: string, poNumber: string) => void;
  receiveGrn: (grn: Omit<GoodsReceivedNote, "id" | "grnNumber" | "receivedDate">) => GoodsReceivedNote;
  createStoreTransfer: (transfer: Omit<StoreTransferRecord, "id" | "transferNumber" | "transferDate">) => StoreTransferRecord;
  recordStocktakeAudit: (audit: Omit<StocktakeAuditRecord, "id" | "auditNumber" | "auditDate">) => StocktakeAuditRecord;

  // Supplier Contracts & Procurement SLAs
  supplierContracts: SupplierContract[];
  addSupplierContract: (contract: Omit<SupplierContract, "id" | "contractNumber">) => SupplierContract;
  updateSupplierContractStatus: (contractId: string, status: SupplierContractStatus) => void;
  sendRenewalNotice: (contractId: string) => void;
  recordSlaAudit: (contractId: string, slaUpdates: Partial<SupplierContractSla>) => void;

  // Kitchen Prep & Scaling
  kitchenPrepItems: KitchenPrepItem[];
  updatePrepItemStatus: (prepId: string, status: PrepItemStatus) => void;
  assignChefToPrep: (prepId: string, chefName: string) => void;
  scalePrepPortions: (prepId: string, targetPortions: number) => void;
  bulkUpdatePrepStatus: (status: PrepItemStatus, station?: KitchenPrepStation) => void;

  // 30-Day Liquidity & Cash Flow Forecast
  getCashFlowForecast: (scenario?: CashFlowScenario) => DailyCashFlowEntry[];

  // Maintenance Audit Trail (Assets Module)
  maintenanceAuditRecords: MaintenanceAuditRecord[];
  addMaintenanceAuditRecord: (record: Omit<MaintenanceAuditRecord, "id" | "repairTicketCode">) => MaintenanceAuditRecord;
  updateMaintenanceAuditRecord: (id: string, updates: Partial<MaintenanceAuditRecord>) => void;
  verifyMaintenanceAuditRecord: (id: string, supervisorName: string, notes?: string) => void;

  // Personalized Preference Log & Pre-Arrival Automation (Guest 360 Profile)
  guestPersonalizedPreferences: Record<string, GuestPersonalizedPreferences>;
  updateGuestPersonalizedPreferences: (guestId: string, updates: Partial<GuestPersonalizedPreferences>) => void;
  preSetRoomControlsForGuest: (guestId: string, roomNumber: string) => { success: boolean; message: string; actionsApplied: string[] };

  // Core Inventory Threshold Alerts & Burn Rate System
  coreInventoryThresholdItems: CoreInventoryThresholdItem[];
  inventoryAlertNotifications: InventoryAlertNotification[];
  triggerInventoryThresholdAlert: (itemId: string, channel?: "email" | "push" | "both") => InventoryAlertNotification;
  triggerBatchInventoryAlerts: () => number;
  updateCoreInventoryThresholdItem: (itemId: string, updates: Partial<CoreInventoryThresholdItem>) => void;
  createEmergencyPoFromAlert: (alertId: string) => string;
}

const PlatformContext = createContext<PlatformState | null>(null);

let walkInSeq = 100;
let orderSeq = 100;
let traceSeq = 100;
let keyCardSeq = 1000;
let folioLineSeq = 100;

// Initial Traces seed
const seedTraces: GuestTrace[] = [
  {
    id: "trc-1",
    reservationId: "res-001",
    guestName: "Chief Adebayo Alade",
    roomNumber: "101",
    department: "front_desk",
    message: "VIP Platinum: Ensure welcome fruit basket and champagne placed in room before 14:00.",
    time: "11:30",
    status: "pending",
  },
  {
    id: "trc-2",
    reservationId: "res-002",
    guestName: "Sarah Jenkins",
    roomNumber: "102",
    department: "housekeeping",
    message: "Hypoallergenic foam pillows requested. Extra bath sheets.",
    time: "10:15",
    status: "pending",
  },
  {
    id: "trc-3",
    reservationId: "res-005",
    guestName: "Zainab Abubakar",
    roomNumber: "105",
    department: "room_service",
    message: "Early morning continental breakfast order for 06:30 prior to airport departure.",
    time: "19:00",
    status: "pending",
  },
];

// Initial Folio lines seed for existing in-house folios
const seedInitialFolioLines: FolioLine[] = [
  {
    id: "fl-1",
    folioId: "folio-stay-001",
    window: 1,
    type: "debit",
    description: "Room Charge - Deluxe Suite (Night 1)",
    amount: 40000,
    subtotal: 34042.55,
    taxAmount: 5957.45,
    department: "Rooms",
    date: "2026-09-04",
  },
  {
    id: "fl-2",
    folioId: "folio-stay-001",
    window: 2,
    type: "debit",
    description: "The Palms Restaurant - Dinner Bill #ORD-1014",
    amount: 14500,
    subtotal: 12340.42,
    taxAmount: 2159.58,
    department: "F&B",
    date: "2026-09-04",
  },
  {
    id: "fl-3",
    folioId: "folio-stay-001",
    window: 1,
    type: "credit",
    description: "Credit Card Advance Deposit - Visa ...4821",
    amount: -40000,
    subtotal: -40000,
    taxAmount: 0,
    department: "Cashiering",
    date: "2026-09-04",
    paymentMethod: "card",
  },
  {
    id: "fl-4",
    folioId: "folio-stay-002",
    window: 1,
    type: "debit",
    description: "Room Charge - Executive Suite (Night 1)",
    amount: 65000,
    subtotal: 55319.15,
    taxAmount: 9680.85,
    department: "Rooms",
    date: "2026-09-04",
  },
  {
    id: "fl-5",
    folioId: "folio-stay-002",
    window: 2,
    type: "debit",
    description: "Lagoon Bar - Cocktail & Hors d'oeuvres",
    amount: 8500,
    subtotal: 7234,
    taxAmount: 1266,
    department: "F&B",
    date: "2026-09-04",
  },
];

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [businessDate, setBusinessDate] = useState<string>("2026-09-05");
  const [rooms, setRooms] = useState<Room[]>(() =>
    seedRooms.map((r, idx) => ({
      ...r,
      wing: idx % 2 === 0 ? "East" : "West",
      bedType: r.roomTypeId === "STD-TYPE" ? "Queen" : r.roomTypeId === "DLX-TYPE" ? "King" : "Suite",
      features:
        idx % 3 === 0
          ? ["Pool View", "Balcony", "Smart TV"]
          : idx % 3 === 1
            ? ["City View", "Work Desk", "High-speed Wi-Fi"]
            : ["Garden View", "Nespresso Machine", "Marble Bath"],
      cleaningCredits: r.roomTypeId === "PRM-TYPE" ? 4 : r.roomTypeId === "EXE-TYPE" ? 3 : 2,
    }))
  );
  const [guests, setGuests] = useState<Guest[]>(seedGuests);
  const [reservations, setReservations] = useState<Reservation[]>(seedReservations);
  const [stays, setStays] = useState<GuestStay[]>(seedStays);
  const [folios, setFolios] = useState<Folio[]>(seedFolios);
  const [folioLines, setFolioLines] = useState<FolioLine[]>(seedInitialFolioLines);
  const [tasks, setTasks] = useState<HousekeepingTask[]>(seedTasks);
  const [orders, setOrders] = useState<PosOrder[]>(seedOrders);
  const [orderLines, setOrderLines] = useState<PosOrderLine[]>(seedOrderLines);
  const [menuItems] = useState<MenuItem[]>(seedMenuItems);
  const [traces, setTraces] = useState<GuestTrace[]>(seedTraces);
  const [keyCards, setKeyCards] = useState<KeyCardRecord[]>([
    {
      id: "kc-1",
      reservationId: "res-001",
      roomNumber: "101",
      guestName: "Chief Adebayo Alade",
      keyType: "guest",
      issuedAt: "2026-09-04 14:15",
      validUntil: "2026-09-08 12:00",
      cardUid: "RFID-4A-82-FE-01",
      status: "active",
    },
    {
      id: "kc-2",
      reservationId: "res-002",
      roomNumber: "102",
      guestName: "Sarah Jenkins",
      keyType: "guest",
      issuedAt: "2026-09-04 15:30",
      validUntil: "2026-09-07 12:00",
      cardUid: "RFID-9C-11-AA-42",
      status: "active",
    },
  ]);

  // Enterprise Module States
  const [shiftHandovers, setShiftHandovers] = useState<ShiftHandoverRecord[]>(initialHandovers);
  const [pmSchedules, setPmSchedules] = useState<PreventativeMaintenanceSchedule[]>(initialPmSchedules);
  const [pmLogs, setPmLogs] = useState<PmInspectionLog[]>(initialPmLogs);
  const [rateRecommendations, setRateRecommendations] = useState<DynamicRateRecommendation[]>(initialRateRecommendations);
  const [yieldRules, setYieldRules] = useState<YieldRule[]>(initialYieldRules);
  const [auditReports, setAuditReports] = useState<NightAuditReport[]>(initialAuditReports);
  const [guestSurveys, setGuestSurveys] = useState<GuestSurveyResponse[]>(initialGuestSurveys);
  const [recoveryTickets, setRecoveryTickets] = useState<ServiceRecoveryTicket[]>(initialRecoveryTickets);
  const [lostAndFound, setLostAndFound] = useState<LostAndFoundItem[]>(initialLostAndFound);
  const [roomEnergyReadings, setRoomEnergyReadings] = useState<RoomEnergyReading[]>(initialEnergyReadings);
  const [smartRoomControls, setSmartRoomControls] = useState<Record<string, SmartRoomControl>>(initialSmartRoomControls);

  // Hospitality Finance (USALI, City Ledger, AP, Tax)
  const [usaliStatements] = useState<USALIDepartmentStatement[]>(initialUSALIDepartments);
  const [cityLedgerAccounts, setCityLedgerAccounts] = useState<CityLedgerAccount[]>(initialCityLedgerAccounts);
  const [accountsPayableInvoices, setAccountsPayableInvoices] = useState<AccountsPayableInvoice[]>(initialAccountsPayableInvoices);
  const [taxSchedules, setTaxSchedules] = useState<TaxRemittanceSchedule[]>(initialTaxSchedules);

  // Food & Beverage Operations
  const [restaurantTables, setRestaurantTables] = useState<RestaurantTable[]>(initialRestaurantTables);
  const [kitchenTickets, setKitchenTickets] = useState<KitchenOrderTicket[]>(initialKitchenTickets);
  const [recipeCostings] = useState<RecipeCostingItem[]>(initialRecipeCostings);
  const [banquetOrders, setBanquetOrders] = useState<BanquetEventOrder[]>(initialBanquetOrders);
  const [kitchenWasteLogs, setKitchenWasteLogs] = useState<KitchenWasteLog[]>(initialKitchenWasteLogs);

  // Supply Chain & Multi-Store Inventory
  const [supplyChainStores] = useState<SupplyChainStore[]>(initialSupplyChainStores);
  const [supplyChainProducts, setSupplyChainProducts] = useState<SupplyChainProduct[]>(initialSupplyChainProducts);
  const [purchaseRequisitions, setPurchaseRequisitions] = useState<PurchaseRequisition[]>(initialPurchaseRequisitions);
  const [goodsReceivedNotes, setGoodsReceivedNotes] = useState<GoodsReceivedNote[]>(initialGoodsReceivedNotes);
  const [storeTransfers, setStoreTransfers] = useState<StoreTransferRecord[]>(initialStoreTransfers);
  const [stocktakeAudits, setStocktakeAudits] = useState<StocktakeAuditRecord[]>(initialStocktakeAudits);

  // Supplier Contracts & Procurement SLAs
  const [supplierContracts, setSupplierContracts] = useState<SupplierContract[]>(initialSupplierContracts);

  // Kitchen Prep & Scaling
  const [kitchenPrepItems, setKitchenPrepItems] = useState<KitchenPrepItem[]>(initialKitchenPrepItems);

  // Maintenance Audit Trail (Assets Module)
  const [maintenanceAuditRecords, setMaintenanceAuditRecords] = useState<MaintenanceAuditRecord[]>(initialMaintenanceAuditRecords);

  // Personalized Guest 360 Preferences
  const [guestPersonalizedPreferences, setGuestPersonalizedPreferences] = useState<Record<string, GuestPersonalizedPreferences>>(initialGuestPersonalizedPreferences);

  // Core Inventory Threshold Alerts & Burn Rate System
  const [coreInventoryThresholdItems, setCoreInventoryThresholdItems] = useState<CoreInventoryThresholdItem[]>(initialCoreInventoryThresholdItems);
  const [inventoryAlertNotifications, setInventoryAlertNotifications] = useState<InventoryAlertNotification[]>(initialInventoryAlertNotifications);

  // Walk-in Registration
  const createWalkIn = useCallback(
    (input: WalkInInput): Reservation => {
      walkInSeq += 1;
      const id = `res-w${walkInSeq}`;
      const conf = `CN-W${walkInSeq}`;
      const arrival = businessDate;
      const departure = new Date(Date.parse(arrival) + input.nights * 86400000)
        .toISOString()
        .slice(0, 10);

      const guestId = `guest-w${walkInSeq}`;
      const newGuest: Guest = {
        id: guestId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email || `${input.firstName.toLowerCase()}.${input.lastName.toLowerCase()}@guest.com`,
        phone: input.phone,
        nationality: input.nationality || "Nigerian",
        company: input.company || "",
        idType: input.idType || "National ID / NIN",
        idNumber: input.idNumber || `NIN-${Math.floor(10000000 + Math.random() * 90000000)}`,
        vipTier: "Standard",
        totalStays: 1,
        lifetimeSpend: input.nights * input.rate,
      };
      setGuests((prev) => [newGuest, ...prev]);

      const reservation: Reservation = {
        id,
        confirmationNumber: conf,
        guestId,
        roomTypeId: null,
        roomId: input.roomId,
        arrivalDate: arrival,
        departureDate: departure,
        nights: input.nights,
        adults: 1,
        children: 0,
        status: "confirmed",
        source: "Walk-in",
        totalEstimate: input.nights * input.rate,
        depositPaid: 0,
        isVip: false,
        marketSegment: input.marketSegment || "FIT / Leisure",
        ratePerNight: input.rate,
      };

      setReservations((prev) => [reservation, ...prev]);
      return reservation;
    },
    [businessDate]
  );

  // Check In with Room Assignment, Key Card Encode & Folio Creation
  const checkIn = useCallback(
    (reservationId: string, options?: Partial<CheckInOptions>) => {
      setReservations((prev) =>
        prev.map((r) => {
          if (r.id !== reservationId) return r;
          const assignedRoomId = options?.assignedRoomId || r.roomId;
          return {
            ...r,
            status: "checked_in",
            roomId: assignedRoomId,
            specialRequests: options?.specialRequests || r.specialRequests,
            checkedInAt: `${businessDate} 14:00`,
            keyCardsIssued: (r.keyCardsIssued || 0) + 1,
          };
        })
      );

      setReservations((prev) => {
        const res = prev.find((r) => r.id === reservationId);
        if (!res) return prev;
        const targetRoomId = options?.assignedRoomId || res.roomId;
        if (!targetRoomId) return prev;

        const stayId = `stay-${res.id}`;
        setStays((s) => {
          if (s.some((x) => x.reservationId === reservationId)) return s;
          const next: GuestStay = {
            id: stayId,
            reservationId,
            guestId: res.guestId,
            roomId: targetRoomId,
            expectedArrival: res.arrivalDate,
            expectedDeparture: res.departureDate,
            status: "active",
            actualArrival: `${businessDate} 14:00`,
          };
          return [...s, next];
        });

        // Initialize Folio
        setFolios((f) => {
          if (f.some((x) => x.guestStayId === stayId)) return f;
          return [
            ...f,
            {
              id: `folio-${stayId}`,
              guestStayId: stayId,
              folioNumber: `F-${String(f.length + 1).padStart(4, "0")}`,
              status: "open",
              balance: 0,
              currency: "NGN",
            },
          ];
        });

        // Handle advance deposit if provided
        if (options?.depositAmount && options.depositAmount > 0) {
          folioLineSeq += 1;
          const depLine: FolioLine = {
            id: `fl-${folioLineSeq}`,
            folioId: `folio-${stayId}`,
            window: 1,
            type: "credit",
            description: `Advance Deposit (${options.depositMethod || "Credit Card"})`,
            amount: -options.depositAmount,
            subtotal: -options.depositAmount,
            taxAmount: 0,
            department: "Cashiering",
            date: businessDate,
            paymentMethod: options.depositMethod || "card",
          };
          setFolioLines((lines) => [...lines, depLine]);
          setFolios((fls) =>
            fls.map((fo) =>
              fo.id === `folio-${stayId}`
                ? { ...fo, balance: fo.balance + (options.depositAmount || 0) }
                : fo
            )
          );
        }

        // Set Room Status to Occupied Clean
        setRooms((rs) =>
          rs.map((rm) =>
            rm.id === targetRoomId
              ? { ...rm, status: "occupied_clean" as RoomStatus, housekeepingStatus: "clean" }
              : rm
          )
        );

        return prev;
      });
    },
    [businessDate]
  );

  // Check Out & Trigger Housekeeping Dirty Task
  const checkOut = useCallback(
    (reservationId: string) => {
      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservationId
            ? { ...r, status: "checked_out", checkedOutAt: `${businessDate} 11:30` }
            : r
        )
      );

      setStays((prev) => {
        const stay = prev.find((s) => s.reservationId === reservationId);
        if (!stay) return prev;

        setFolios((f) =>
          f.map((fo) => (fo.guestStayId === stay.id ? { ...fo, status: "closed" } : fo))
        );

        // Turn room to vacant_dirty
        setRooms((rs) =>
          rs.map((rm) =>
            rm.id === stay.roomId
              ? { ...rm, status: "vacant_dirty" as RoomStatus, housekeepingStatus: "dirty" }
              : rm
          )
        );

        // Revoke active key cards
        setKeyCards((kcs) =>
          kcs.map((kc) => (kc.reservationId === reservationId ? { ...kc, status: "revoked" } : kc))
        );

        // Queue Urgent Checkout Cleaning
        setTasks((ts) => {
          const roomId = stay.roomId;
          return [
            ...ts.filter((t) => !(t.roomId === roomId && t.status === "pending")),
            {
              id: `hk-out-${reservationId}`,
              roomId,
              taskType: "Checkout Cleaning & Sanitization",
              priority: "urgent" as const,
              status: "pending" as const,
              assignedTo: null,
            },
          ];
        });

        return prev.map((s) =>
          s.reservationId === reservationId
            ? { ...s, status: "departed", actualDeparture: `${businessDate} 11:30` }
            : s
        );
      });
    },
    [businessDate]
  );

  // Room Move / Transfer
  const roomMove = useCallback(
    ({ reservationId, toRoomId, reason, isComplimentary, rateAdjustment = 0 }: RoomMoveInput) => {
      let fromRoomId = "";
      setReservations((prev) =>
        prev.map((r) => {
          if (r.id !== reservationId) return r;
          fromRoomId = r.roomId || "";
          return {
            ...r,
            roomId: toRoomId,
            specialRequests: `${r.specialRequests || ""} [Room move from ${fromRoomId}: ${reason}]`.trim(),
            totalEstimate: isComplimentary ? r.totalEstimate : r.totalEstimate + rateAdjustment,
          };
        })
      );

      setStays((prev) =>
        prev.map((s) => (s.reservationId === reservationId ? { ...s, roomId: toRoomId } : s))
      );

      // Old room becomes vacant_dirty
      if (fromRoomId) {
        setRooms((rs) =>
          rs.map((rm) => {
            if (rm.id === fromRoomId) {
              return { ...rm, status: "vacant_dirty" as RoomStatus, housekeepingStatus: "dirty" };
            }
            if (rm.id === toRoomId) {
              return { ...rm, status: "occupied_clean" as RoomStatus };
            }
            return rm;
          })
        );

        // Add trace for room move
        traceSeq += 1;
        setTraces((prev) => [
          {
            id: `trc-move-${traceSeq}`,
            reservationId,
            guestName: "Room Move Transfer",
            roomNumber: toRoomId,
            department: "housekeeping",
            message: `Guest transferred from Room ${fromRoomId} to Room ${toRoomId}. Reason: ${reason}. Prior room requires touch-up clean.`,
            time: "12:00",
            status: "pending",
          },
          ...prev,
        ]);
      }
    },
    []
  );

  // Room Status & OOO/OOS Management
  const updateRoomStatus = useCallback(
    (
      roomId: string,
      status: RoomStatus,
      hkStatus?: "clean" | "dirty" | "inspected",
      oooReason?: string,
      oooReturnDate?: string
    ) => {
      setRooms((rs) =>
        rs.map((rm) => {
          if (rm.id !== roomId) return rm;
          return {
            ...rm,
            status,
            housekeepingStatus: hkStatus || rm.housekeepingStatus,
            oooReason: oooReason !== undefined ? oooReason : rm.oooReason,
            oooReturnDate: oooReturnDate !== undefined ? oooReturnDate : rm.oooReturnDate,
          };
        })
      );
    },
    []
  );

  // Assign Housekeeper
  const assignHousekeeper = useCallback((roomId: string, employeeName: string, credits: number) => {
    setRooms((rs) =>
      rs.map((rm) =>
        rm.id === roomId
          ? { ...rm, assignedHousekeeper: employeeName, cleaningCredits: credits }
          : rm
      )
    );
  }, []);

  // Encode Key Card
  const encodeKeyCard = useCallback(
    (
      reservationId: string,
      roomId: string,
      keyType: "guest" | "duplicate" | "master" | "mobile_nfc"
    ): KeyCardRecord => {
      keyCardSeq += 1;
      const res = reservations.find((r) => r.id === reservationId);
      const guest = guests.find((g) => g.id === res?.guestId);
      const room = rooms.find((rm) => rm.id === roomId);

      const record: KeyCardRecord = {
        id: `kc-${keyCardSeq}`,
        reservationId,
        roomNumber: room?.number || roomId,
        guestName: guest ? `${guest.firstName} ${guest.lastName}` : "Guest",
        keyType,
        issuedAt: `${businessDate} 14:00`,
        validUntil: res ? `${res.departureDate} 12:00` : `${businessDate} 23:59`,
        cardUid: `RFID-${Math.random().toString(16).substring(2, 6).toUpperCase()}-${Math.random().toString(16).substring(2, 6).toUpperCase()}`,
        status: "active",
      };

      setKeyCards((prev) => [record, ...prev]);
      return record;
    },
    [reservations, guests, rooms, businessDate]
  );

  // Trace Management
  const addTrace = useCallback((trace: Omit<GuestTrace, "id">) => {
    traceSeq += 1;
    setTraces((prev) => [{ ...trace, id: `trc-${traceSeq}` }, ...prev]);
  }, []);

  const resolveTrace = useCallback((traceId: string, resolvedBy = "Duty Manager") => {
    setTraces((prev) =>
      prev.map((t) => (t.id === traceId ? { ...t, status: "resolved", resolvedBy } : t))
    );
  }, []);

  // Multi-window Cashiering: Detailed Line Item Posting
  const postChargeDetailed = useCallback(
    ({ folioId, window, department, description, subtotal, taxAmount, reference }: DetailedChargeInput) => {
      folioLineSeq += 1;
      const total = subtotal + taxAmount;
      const line: FolioLine = {
        id: `fl-${folioLineSeq}`,
        folioId,
        window,
        type: "debit",
        description,
        amount: total,
        subtotal,
        taxAmount,
        department,
        date: businessDate,
        reference: reference || `REF-${folioLineSeq}`,
      };

      setFolioLines((prev) => [...prev, line]);
      setFolios((prev) =>
        prev.map((f) => (f.id === folioId ? { ...f, balance: f.balance - total } : f))
      );
    },
    [businessDate]
  );

  const postCharge = useCallback(
    (folioId: string, description: string, amount: number) => {
      postChargeDetailed({
        folioId,
        window: 1,
        department: "General",
        description,
        subtotal: Math.round((amount / (1 + VAT_RATE)) * 100) / 100,
        taxAmount: Math.round((amount - amount / (1 + VAT_RATE)) * 100) / 100,
      });
    },
    [postChargeDetailed]
  );

  const postPayment = useCallback(
    (folioId: string, amount: number) => {
      folioLineSeq += 1;
      const line: FolioLine = {
        id: `fl-${folioLineSeq}`,
        folioId,
        window: 1,
        type: "credit",
        description: "Payment received",
        amount: -amount,
        subtotal: -amount,
        taxAmount: 0,
        department: "Cashiering",
        date: businessDate,
        paymentMethod: "cash",
      };
      setFolioLines((prev) => [...prev, line]);
      setFolios((prev) =>
        prev.map((f) => (f.id === folioId ? { ...f, balance: f.balance + amount } : f))
      );
    },
    [businessDate]
  );

  // Settle specific Folio Window (e.g. Window 1, 2, or 3)
  const settleFolioWindow = useCallback(
    ({ folioId, window, paymentMethod, amount, reference }: FolioSettlementInput) => {
      folioLineSeq += 1;
      const line: FolioLine = {
        id: `fl-${folioLineSeq}`,
        folioId,
        window,
        type: "credit",
        description: `Settlement - ${paymentMethod.toUpperCase()} (${reference})`,
        amount: -amount,
        subtotal: -amount,
        taxAmount: 0,
        department: "Cashiering",
        date: businessDate,
        paymentMethod,
        reference,
      };

      setFolioLines((prev) => [...prev, line]);
      setFolios((prev) =>
        prev.map((f) => (f.id === folioId ? { ...f, balance: f.balance + amount } : f))
      );
    },
    [businessDate]
  );

  // Transfer charge to a different folio window
  const transferFolioCharge = useCallback((folioLineId: string, toWindow: number) => {
    setFolioLines((prev) =>
      prev.map((l) => (l.id === folioLineId ? { ...l, window: toWindow } : l))
    );
  }, []);

  // Night Audit Step: Post room charges, close open departures, advance business date
  const runNightAuditStep = useCallback(() => {
    let roomsCharged = 0;
    let totalPosted = 0;

    // Post nightly room charge for all in-house rooms
    const inHouse = reservations.filter((r) => r.status === "checked_in");
    inHouse.forEach((res) => {
      const stay = stays.find((s) => s.reservationId === res.id);
      if (!stay) return;
      const folio = folios.find((f) => f.guestStayId === stay.id);
      if (!folio) return;

      const room = rooms.find((rm) => rm.id === res.roomId);
      const nightlyRate =
        res.ratePerNight || (res.totalEstimate ? res.totalEstimate / Math.max(res.nights, 1) : 35000);
      const vat = Math.round(nightlyRate * VAT_RATE);
      const sc = Math.round(nightlyRate * SERVICE_CHARGE_RATE);
      const totalNightCharge = nightlyRate + vat + sc;

      folioLineSeq += 1;
      const chargeLine: FolioLine = {
        id: `fl-na-${folioLineSeq}`,
        folioId: folio.id,
        window: 1,
        type: "debit",
        description: `Night Audit Room & Tax Posting - Room ${room?.number || "Suite"}`,
        amount: totalNightCharge,
        subtotal: nightlyRate,
        taxAmount: vat + sc,
        department: "Night Audit",
        date: businessDate,
        reference: `NA-${businessDate}`,
      };

      setFolioLines((prev) => [...prev, chargeLine]);
      setFolios((prev) =>
        prev.map((f) =>
          f.id === folio.id ? { ...f, balance: f.balance - totalNightCharge } : f
        )
      );

      roomsCharged += 1;
      totalPosted += totalNightCharge;
    });

    // Mark unarrived reservations as no-show
    let noShowsHandled = 0;
    setReservations((prev) =>
      prev.map((r) => {
        if (r.status === "confirmed" && r.arrivalDate <= businessDate) {
          noShowsHandled += 1;
          return { ...r, status: "no_show" };
        }
        return r;
      })
    );

    // Advance Business Date by 1 day
    const curr = new Date(Date.parse(businessDate));
    const nextDateObj = new Date(curr.getTime() + 86400000);
    const newDateStr = nextDateObj.toISOString().slice(0, 10);
    setBusinessDate(newDateStr);

    return {
      roomsCharged,
      totalPosted,
      noShowsHandled,
      newBusinessDate: newDateStr,
    };
  }, [reservations, stays, folios, rooms, businessDate]);

  // Housekeeping task helpers
  const assignRoomToReservation = useCallback((reservationId: string, roomId: string) => {
    setReservations((prev) => prev.map((r) => (r.id === reservationId ? { ...r, roomId } : r)));
  }, []);

  const completeTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "completed" } : t)));
  }, []);

  const inspectTask = useCallback((taskId: string) => {
    setTasks((prev) => {
      const task = prev.find((t) => t.id === taskId);
      if (task) {
        setRooms((rs) =>
          rs.map((rm) =>
            rm.id === task.roomId
              ? { ...rm, housekeepingStatus: "clean", status: "vacant_clean" as RoomStatus }
              : rm
          )
        );
      }
      return prev.map((t) => (t.id === taskId ? { ...t, status: "inspected" } : t));
    });
  }, []);

  const assignTask = useCallback((taskId: string, employeeId: string) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, assignedTo: employeeId } : t)));
  }, []);

  // POS operations
  const createOrder = useCallback((outletId: string, lines: PosOrderLine[]): PosOrder => {
    orderSeq += 1;
    const subtotal = lines.reduce((acc, l) => acc + l.amount, 0);
    const tax = Math.round(subtotal * VAT_RATE * 100) / 100;
    const created: PosOrder = {
      id: `pos-w${orderSeq}`,
      outletId,
      orderNumber: `ORD-${String(1000 + orderSeq)}`,
      status: "open",
      subtotal,
      taxAmount: tax,
      discountAmount: 0,
      total: subtotal + tax,
      paymentStatus: "pending",
      createdAt: "2026-09-05 13:23:28",
    };
    setOrders((prev) => [created, ...prev]);
    setOrderLines((prev) => lines.map((l) => ({ ...l, orderId: created.id })).concat(prev));
    return created;
  }, []);

  const closeOrder = useCallback((orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "closed", paymentStatus: "paid" } : o))
    );
  }, []);

  // Shift Handover operations
  const createShiftHandover = useCallback(
    (input: Omit<ShiftHandoverRecord, "id" | "handoverNumber" | "submittedAt" | "status">): ShiftHandoverRecord => {
      const nextNum = `SHO-${businessDate.replace(/-/g, "")}-${String(shiftHandovers.length + 1).padStart(2, "0")}`;
      const newRecord: ShiftHandoverRecord = {
        ...input,
        id: `sho-${Date.now()}`,
        handoverNumber: nextNum,
        submittedAt: `${businessDate} ${new Date().toTimeString().slice(0, 8)}`,
        status: "submitted",
      };
      setShiftHandovers((prev) => [newRecord, ...prev]);
      return newRecord;
    },
    [businessDate, shiftHandovers.length]
  );

  const acknowledgeShiftHandover = useCallback((handoverId: string, staffName: string) => {
    setShiftHandovers((prev) =>
      prev.map((s) =>
        s.id === handoverId
          ? {
              ...s,
              status: "acknowledged",
              incomingStaffName: staffName,
              incomingStaffPinVerified: true,
              acknowledgedAt: new Date().toISOString().replace("T", " ").slice(0, 19),
            }
          : s
      )
    );
  }, []);

  const updateShiftHandover = useCallback((handoverId: string, updates: Partial<ShiftHandoverRecord>) => {
    setShiftHandovers((prev) => prev.map((s) => (s.id === handoverId ? { ...s, ...updates } : s)));
  }, []);

  // Preventative Maintenance operations
  const createPmSchedule = useCallback(
    (schedule: Omit<PreventativeMaintenanceSchedule, "id" | "scheduleCode">) => {
      const code = `PM-${schedule.equipmentType.slice(0, 3).toUpperCase()}-${String(pmSchedules.length + 1).padStart(2, "0")}`;
      const newSched: PreventativeMaintenanceSchedule = {
        ...schedule,
        id: `pm-${Date.now()}`,
        scheduleCode: code,
      };
      setPmSchedules((prev) => [newSched, ...prev]);
    },
    [pmSchedules.length]
  );

  const logPmInspection = useCallback(
    (log: Omit<PmInspectionLog, "id" | "inspectedAt">) => {
      const id = `pml-${Date.now()}`;
      const inspectedAt = new Date().toISOString().replace("T", " ").slice(0, 19);
      let spawnedWorkOrderId: string | undefined;

      if (log.result === "failed_repair_needed") {
        spawnedWorkOrderId = `WO-${Math.floor(1000 + Math.random() * 9000)}`;
        const targetRoom = rooms.find((r) => log.inspectedTarget.includes(r.number));
        if (targetRoom) {
          setTasks((prev) => [
            {
              id: `task-pm-${Date.now()}`,
              roomId: targetRoom.id,
              taskType: "Inspection Required",
              priority: "urgent",
              status: "pending",
              assignedTo: null,
            },
            ...prev,
          ]);
        }
      }

      const newLog: PmInspectionLog = {
        ...log,
        id,
        inspectedAt,
        spawnedWorkOrderId,
      };

      setPmLogs((prev) => [newLog, ...prev]);

      // Update PM schedule
      setPmSchedules((prev) =>
        prev.map((s) =>
          s.id === log.scheduleId
            ? {
                ...s,
                lastCompletedDate: inspectedAt.slice(0, 10),
                status: "completed",
              }
            : s
        )
      );
    },
    [rooms]
  );

  const updatePmSchedule = useCallback((scheduleId: string, updates: Partial<PreventativeMaintenanceSchedule>) => {
    setPmSchedules((prev) => prev.map((s) => (s.id === scheduleId ? { ...s, ...updates } : s)));
  }, []);

  // Yield & Revenue operations
  const applyRateRecommendation = useCallback((roomTypeId: string, newRate: number) => {
    setRateRecommendations((prev) =>
      prev.map((r) => (r.roomTypeId === roomTypeId ? { ...r, applied: true, currentBaseRate: newRate } : r))
    );
  }, []);

  const toggleYieldRule = useCallback((ruleId: string) => {
    setYieldRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, isActive: !r.isActive } : r))
    );
  }, []);

  const addYieldRule = useCallback((rule: Omit<YieldRule, "id">) => {
    setYieldRules((prev) => [{ ...rule, id: `yr-${Date.now()}` }, ...prev]);
  }, []);

  // Comprehensive Night Audit execution
  const executeComprehensiveNightAudit = useCallback(
    (auditorName = "Chidi Amadi (Night Supervisor)"): NightAuditReport => {
      const activeInHouse = reservations.filter((r) => r.status === "checked_in");
      let roomRev = 0;
      let taxRev = 0;
      let scRev = 0;

      for (const r of activeInHouse) {
        const roomCharge = r.ratePerNight ?? Math.round(r.totalEstimate / Math.max(r.nights, 1));
        const vat = Math.round(roomCharge * VAT_RATE * 100) / 100;
        const sc = Math.round(roomCharge * SERVICE_CHARGE_RATE * 100) / 100;
        roomRev += roomCharge;
        taxRev += vat;
        scRev += sc;

        // Post to folio Window 1
        const folio = folios.find((f) => f.reservationId === r.id);
        if (folio) {
          folioLineSeq += 1;
          const lineRoom: FolioLine = {
            id: `fl-${folioLineSeq}`,
            folioId: folio.id,
            windowNumber: 1,
            chargeCode: "RM-NIGHT",
            description: `Nightly Room Charge (${businessDate})`,
            amount: roomCharge,
            taxAmount: vat,
            serviceCharge: sc,
            totalAmount: roomCharge + vat + sc,
            postedAt: `${businessDate} 23:59:00`,
            postedBy: auditorName,
            status: "posted",
          };
          setFolioLines((prev) => [lineRoom, ...prev]);
          setFolios((prev) =>
            prev.map((f) =>
              f.id === folio.id ? { ...f, balance: f.balance + lineRoom.totalAmount } : f
            )
          );
        }
      }

      // 2. Mark no-shows
      let noShowsCount = 0;
      setReservations((prev) =>
        prev.map((r) => {
          if (r.arrivalDate === businessDate && r.status === "confirmed") {
            noShowsCount += 1;
            return { ...r, status: "no_show" as ReservationStatus };
          }
          return r;
        })
      );

      // 3. Roll occupied clean rooms to occupied dirty for morning housekeeping
      setRooms((prev) =>
        prev.map((r) => {
          if (r.status === "occupied_clean") {
            return { ...r, status: "occupied_dirty" as RoomStatus, housekeepingStatus: "dirty" };
          }
          return r;
        })
      );

      // 4. Roll Business Date
      const curr = new Date(Date.parse(businessDate));
      const nextDateObj = new Date(curr.getTime() + 86400000);
      const newDateStr = nextDateObj.toISOString().slice(0, 10);
      setBusinessDate(newDateStr);

      // 5. Total calculations
      const fnbRev = orders.filter((o) => o.status === "closed").reduce((a, o) => a + o.total, 0);
      const totalRev = roomRev + taxRev + scRev + fnbRev + 45000;
      const occRate = Math.round((activeInHouse.length / Math.max(rooms.length, 1)) * 100);
      const adr = activeInHouse.length > 0 ? Math.round(roomRev / activeInHouse.length) : 0;
      const revpar = Math.round(roomRev / Math.max(rooms.length, 1));

      const report: NightAuditReport = {
        id: `nar-${businessDate.replace(/-/g, "")}`,
        businessDate,
        completedAt: new Date().toISOString().replace("T", " ").slice(0, 19),
        auditorName,
        roomsCharged: activeInHouse.length,
        totalRoomRevenue: roomRev,
        totalTaxPosted: taxRev,
        totalServiceChargePosted: scRev,
        totalFnbRevenue: fnbRev,
        totalOtherRevenue: 45000,
        grandTotalRevenue: totalRev,
        totalPaymentsCollected: Math.round(totalRev * 0.92),
        cityLedgerTransfers: Math.round(totalRev * 0.08),
        cashierVariancesTotal: 0,
        noShowsCount,
        roomsOooCount: rooms.filter((r) => r.status.startsWith("out_of")).length,
        endingOccupancyRate: occRate,
        adr,
        revpar,
        trialBalanceBalanced: true,
        status: "balanced",
      };

      setAuditReports((prev) => [report, ...prev]);
      return report;
    },
    [reservations, folios, businessDate, orders, rooms]
  );

  // Guest Sentiment operations
  const createSurveyResponse = useCallback(
    (survey: Omit<GuestSurveyResponse, "id" | "submittedAt">): GuestSurveyResponse => {
      const id = `surv-${Date.now()}`;
      const submittedAt = new Date().toISOString().replace("T", " ").slice(0, 19);
      let serviceRecoveryTicketId: string | undefined;

      if (survey.overallScore <= 6) {
        serviceRecoveryTicketId = `rec-${Date.now()}`;
        const recTicket: ServiceRecoveryTicket = {
          id: serviceRecoveryTicketId,
          surveyId: id,
          guestName: survey.guestName,
          guestPhone: "+234 800 000 0000",
          guestEmail: "guest@example.com",
          roomNumber: survey.roomNumber,
          issueSummary: survey.comment || "Low satisfaction rating reported in post-stay survey.",
          department:
            survey.categories.cleanliness <= 2
              ? "Housekeeping"
              : survey.categories.dining <= 2
              ? "Food & Beverage"
              : survey.categories.frontDesk <= 2
              ? "Front Desk"
              : "Maintenance",
          priority: survey.overallScore <= 4 ? "urgent" : "high",
          status: "open",
          assignedManager: "Chidinma Ike (General Manager) & Chidi Amadi (Front Desk Manager)",
          compensationOffered: "Apology correspondence + 2,000 Bonus Loyalty Points",
          createdAt: submittedAt,
        };
        setRecoveryTickets((prev) => [recTicket, ...prev]);
      }

      const created: GuestSurveyResponse = {
        ...survey,
        id,
        submittedAt,
        serviceRecoveryTicketId,
      };
      setGuestSurveys((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  const updateRecoveryTicket = useCallback(
    (ticketId: string, updates: Partial<ServiceRecoveryTicket>) => {
      setRecoveryTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                ...updates,
                resolvedAt:
                  updates.status === "resolved"
                    ? new Date().toISOString().replace("T", " ").slice(0, 19)
                    : t.resolvedAt,
              }
            : t
        )
      );
    },
    []
  );

  // Guest Profile Flagging (M-CRM)
  const updateGuestFlags = useCallback(
    (guestId: string, flags: GuestFlag[], blacklistReason?: string, flagNotes?: string) => {
      setGuests((prev) =>
        prev.map((g) =>
          g.id === guestId
            ? {
                ...g,
                flags,
                blacklistReason: flags.includes("Blacklist")
                  ? (blacklistReason ?? g.blacklistReason ?? "Security & Financial Flag")
                  : undefined,
                flagNotes: flagNotes !== undefined ? flagNotes : g.flagNotes,
              }
            : g
        )
      );
    },
    []
  );

  const toggleGuestFlag = useCallback(
    (guestId: string, flag: GuestFlag, reason?: string) => {
      setGuests((prev) =>
        prev.map((g) => {
          if (g.id !== guestId) return g;
          const currentFlags = g.flags ?? [];
          const exists = currentFlags.includes(flag);
          const newFlags = exists
            ? currentFlags.filter((f) => f !== flag)
            : [...currentFlags, flag];
          return {
            ...g,
            flags: newFlags,
            blacklistReason: newFlags.includes("Blacklist")
              ? (reason || g.blacklistReason || "Security & Financial Flag")
              : undefined,
          };
        })
      );
    },
    []
  );

  // Lost and Found (M-HKP)
  const createLostAndFoundItem = useCallback(
    (item: Omit<LostAndFoundItem, "id" | "itemNumber">): LostAndFoundItem => {
      const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const newId = `lf-${Date.now().toString(36)}`;
      const itemNumber = `LF-${datePart}-${String(lostAndFound.length + 1).padStart(2, "0")}`;
      const newItem: LostAndFoundItem = {
        ...item,
        id: newId,
        itemNumber,
      };
      setLostAndFound((prev) => [newItem, ...prev]);
      return newItem;
    },
    [lostAndFound.length]
  );

  const updateLostAndFoundStatus = useCallback(
    (
      itemId: string,
      status: LostAndFoundStatus,
      details?: { claimedBy?: string; guestEmail?: string; returnedByStaff?: string; disposalReason?: string }
    ) => {
      const timestamp = new Date().toISOString().replace("T", " ").slice(0, 16);
      setLostAndFound((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            status,
            claimedAt: status === "claimed" || status === "returned" ? item.claimedAt || timestamp : item.claimedAt,
            claimedBy: details?.claimedBy ?? item.claimedBy,
            guestEmail: details?.guestEmail ?? item.guestEmail,
            returnedAt: status === "returned" ? timestamp : item.returnedAt,
            returnedByStaff: details?.returnedByStaff ?? item.returnedByStaff,
            disposedAt: status === "disposed" ? timestamp : item.disposedAt,
            disposalReason: details?.disposalReason ?? item.disposalReason,
          };
        })
      );
    },
    []
  );

  const sendLostAndFoundEmail = useCallback(
    (itemId: string, recipientEmail: string, _message: string) => {
      const timestamp = new Date().toISOString().replace("T", " ").slice(0, 16);
      setLostAndFound((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, emailSentAt: timestamp, guestEmail: recipientEmail }
            : item
        )
      );
      return { sent: true, sentAt: timestamp };
    },
    []
  );

  // Room Energy Telemetry & BMS (M-ENG)
  const triggerEcoKillswitch = useCallback((roomId: string) => {
    setRoomEnergyReadings((prev) =>
      prev.map((r) => {
        if (r.roomId !== roomId) return r;
        return {
          ...r,
          powerDrawKw: 0.28,
          hvacState: "eco_standby",
          lightingState: "all_off",
          targetTemp: 26,
          highConsumptionAlert: false,
          alertReason: undefined,
          ecoModeEngaged: true,
          lastTelemetryTime: "Just now (Eco Override Engaged)",
        };
      })
    );

    setSmartRoomControls((prev) => {
      const existing = prev[roomId];
      if (!existing) return prev;
      return {
        ...prev,
        [roomId]: {
          ...existing,
          hvacMode: "eco",
          targetTemperature: 26,
          lightingScene: "all_off",
          lights: {
            master: false,
            entryway: false,
            bedroom: false,
            bathroom: false,
            nightstand: false,
          },
          lastUpdated: "Just now",
        },
      };
    });
  }, []);

  const resetEnergyAlert = useCallback((roomId: string) => {
    setRoomEnergyReadings((prev) =>
      prev.map((r) =>
        r.roomId === roomId
          ? {
              ...r,
              highConsumptionAlert: false,
              alertReason: undefined,
            }
          : r
      )
    );
  }, []);

  // Smart Room Controls & Guest Portal Service Layer (M-GST)
  const updateSmartRoom = useCallback((roomId: string, updates: Partial<SmartRoomControl>) => {
    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 16);
    setSmartRoomControls((prev) => {
      const existing = prev[roomId] || {
        roomId,
        roomNumber: roomId.replace("room-", ""),
        dndActive: false,
        murActive: false,
        targetTemperature: 21,
        currentTemperature: 22,
        hvacMode: "cool",
        fanSpeed: "auto",
        lightingScene: "relax",
        lights: {
          master: true,
          entryway: false,
          bedroom: true,
          bathroom: true,
          nightstand: true,
        },
        doorLocked: true,
        privacyLatchEngaged: false,
        lastUpdated: timestamp,
      };
      return {
        ...prev,
        [roomId]: {
          ...existing,
          ...updates,
          lastUpdated: timestamp,
        },
      };
    });

    if (updates.dndActive !== undefined || updates.murActive !== undefined) {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === roomId
            ? {
                ...r,
                dndActive: updates.dndActive !== undefined ? updates.dndActive : r.dndActive,
                murActive: updates.murActive !== undefined ? updates.murActive : r.murActive,
              }
            : r
        )
      );
    }
  }, []);

  const toggleRoomDnd = useCallback((roomId: string): boolean => {
    let nextState = true;
    setSmartRoomControls((prev) => {
      const existing = prev[roomId];
      nextState = existing ? !existing.dndActive : true;
      const updated: SmartRoomControl = existing
        ? { ...existing, dndActive: nextState, murActive: nextState ? false : existing.murActive, lastUpdated: "Just now" }
        : {
            roomId,
            roomNumber: roomId.replace("room-", ""),
            dndActive: nextState,
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
      return { ...prev, [roomId]: updated };
    });

    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? { ...r, dndActive: nextState, murActive: nextState ? false : r.murActive }
          : r
      )
    );
    return nextState;
  }, []);

  const toggleRoomMur = useCallback((roomId: string): boolean => {
    let nextState = true;
    setSmartRoomControls((prev) => {
      const existing = prev[roomId];
      nextState = existing ? !existing.murActive : true;
      const updated: SmartRoomControl = existing
        ? { ...existing, murActive: nextState, dndActive: nextState ? false : existing.dndActive, lastUpdated: "Just now" }
        : {
            roomId,
            roomNumber: roomId.replace("room-", ""),
            dndActive: false,
            murActive: nextState,
            targetTemperature: 21,
            currentTemperature: 22,
            hvacMode: "cool",
            fanSpeed: "auto",
            lightingScene: "relax",
            lights: { master: true, entryway: true, bedroom: true, bathroom: true, nightstand: false },
            doorLocked: true,
            privacyLatchEngaged: false,
            lastUpdated: "Just now",
          };
      return { ...prev, [roomId]: updated };
    });

    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? { ...r, murActive: nextState, dndActive: nextState ? false : r.dndActive }
          : r
      )
    );
    return nextState;
  }, []);

  // Hospitality Finance Action Handlers
  const recordCityLedgerPayment = useCallback((accountId: string, invoiceId: string, amountPaid: number) => {
    setCityLedgerAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id !== accountId) return acc;
        const updatedInvoices = acc.invoices.map((inv) => {
          if (inv.id === invoiceId) {
            return {
              ...inv,
              status: "settled" as const,
              settledAt: "2026-09-08 10:00",
            };
          }
          return inv;
        });
        const newBalance = Math.max(0, acc.currentBalance - amountPaid);
        return {
          ...acc,
          currentBalance: newBalance,
          invoices: updatedInvoices,
        };
      })
    );
  }, []);

  const createCityLedgerInvoice = useCallback((accountId: string, invoice: Omit<CityLedgerInvoice, "id" | "daysOverdue" | "netPayable">) => {
    const net = invoice.amount - (invoice.whtAmount || 0);
    const newInv: CityLedgerInvoice = {
      ...invoice,
      id: `inv-cl-${Date.now()}`,
      daysOverdue: 0,
      netPayable: net,
    };
    setCityLedgerAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id !== accountId) return acc;
        return {
          ...acc,
          currentBalance: acc.currentBalance + invoice.amount,
          invoices: [newInv, ...acc.invoices],
        };
      })
    );
  }, []);

  const approveApInvoice = useCallback((invoiceId: string) => {
    setAccountsPayableInvoices((prev) =>
      prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: "approved" as const, threeWayMatched: true } : inv))
    );
  }, []);

  const payApInvoice = useCallback((invoiceId: string, voucherRef: string) => {
    setAccountsPayableInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId ? { ...inv, status: "paid" as const, paymentVoucherRef: voucherRef } : inv
      )
    );
  }, []);

  const remitTaxSchedule = useCallback((taxId: string, filingRef: string) => {
    setTaxSchedules((prev) =>
      prev.map((tax) =>
        tax.id === taxId ? { ...tax, status: "remitted" as const, filingRef, collectedToDate: tax.taxPayable } : tax
      )
    );
  }, []);

  // F&B Action Handlers
  const updateTableStatus = useCallback((tableId: string, status: TableStatus, guestName?: string, covers?: number) => {
    setRestaurantTables((prev) =>
      prev.map((tbl) =>
        tbl.id === tableId
          ? {
              ...tbl,
              status,
              ...(guestName !== undefined ? { guestName } : {}),
              ...(covers !== undefined ? { activeCovers: covers } : {}),
              ...(status === "available" ? { currentOrderId: undefined, currentOrderNumber: undefined, guestName: undefined, activeCovers: undefined } : {}),
            }
          : tbl
      )
    );
  }, []);

  const updateKotStatus = useCallback((ticketId: string, status: KotStatus) => {
    setKitchenTickets((prev) =>
      prev.map((k) =>
        k.id === ticketId
          ? {
              ...k,
              status,
              items: k.items.map((item) => ({
                ...item,
                status: status === "served" ? "served" : status === "ready" ? "ready" : item.status,
              })),
            }
          : k
      )
    );
  }, []);

  const createBanquetOrder = useCallback((beo: Omit<BanquetEventOrder, "id" | "beoNumber">): BanquetEventOrder => {
    const id = `beo-${Date.now()}`;
    const beoNumber = `BEO-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newBeo: BanquetEventOrder = {
      ...beo,
      id,
      beoNumber,
    };
    setBanquetOrders((prev) => [newBeo, ...prev]);
    return newBeo;
  }, []);

  const logKitchenWaste = useCallback((waste: Omit<KitchenWasteLog, "id" | "date">) => {
    const newLog: KitchenWasteLog = {
      ...waste,
      id: `kw-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
    };
    setKitchenWasteLogs((prev) => [newLog, ...prev]);
  }, []);

  // Supply Chain Action Handlers
  const createPurchaseRequisition = useCallback((req: Omit<PurchaseRequisition, "id" | "requisitionNumber" | "requestDate">): PurchaseRequisition => {
    const id = `pr-${Date.now()}`;
    const requisitionNumber = `PR-2026-${Math.floor(200 + Math.random() * 800)}`;
    const newReq: PurchaseRequisition = {
      ...req,
      id,
      requisitionNumber,
      requestDate: new Date().toISOString().slice(0, 10),
    };
    setPurchaseRequisitions((prev) => [newReq, ...prev]);
    return newReq;
  }, []);

  const approvePurchaseRequisition = useCallback((reqId: string, poNumber: string) => {
    setPurchaseRequisitions((prev) =>
      prev.map((r) =>
        r.id === reqId ? { ...r, status: "procurement_po_created" as const, poNumber } : r
      )
    );
  }, []);

  const receiveGrn = useCallback((grn: Omit<GoodsReceivedNote, "id" | "grnNumber" | "receivedDate">): GoodsReceivedNote => {
    const id = `grn-${Date.now()}`;
    const grnNumber = `GRN-${Math.floor(1000 + Math.random() * 9000)}`;
    const newGrn: GoodsReceivedNote = {
      ...grn,
      id,
      grnNumber,
      receivedDate: new Date().toISOString().slice(0, 10),
    };
    setGoodsReceivedNotes((prev) => [newGrn, ...prev]);
    setSupplyChainProducts((prev) =>
      prev.map((p) => {
        const item = grn.items.find((i) => i.productId === p.id);
        if (item) {
          const accepted = item.receivedQty - (item.rejectedQty || 0);
          return {
            ...p,
            totalQuantity: p.totalQuantity + accepted,
            totalValue: (p.totalQuantity + accepted) * p.costPrice,
            status: p.totalQuantity + accepted > p.reorderPoint ? "healthy" : "low_stock",
          };
        }
        return p;
      })
    );
    return newGrn;
  }, []);

  const createStoreTransfer = useCallback((transfer: Omit<StoreTransferRecord, "id" | "transferNumber" | "transferDate">): StoreTransferRecord => {
    const id = `trf-${Date.now()}`;
    const transferNumber = `TRF-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newTrf: StoreTransferRecord = {
      ...transfer,
      id,
      transferNumber,
      transferDate: new Date().toISOString().slice(0, 10),
    };
    setStoreTransfers((prev) => [newTrf, ...prev]);
    return newTrf;
  }, []);

  const recordStocktakeAudit = useCallback((audit: Omit<StocktakeAuditRecord, "id" | "auditNumber" | "auditDate">): StocktakeAuditRecord => {
    const id = `aud-${Date.now()}`;
    const auditNumber = `AUD-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newAud: StocktakeAuditRecord = {
      ...audit,
      id,
      auditNumber,
      auditDate: new Date().toISOString().slice(0, 10),
    };
    setStocktakeAudits((prev) => [newAud, ...prev]);
    return newAud;
  }, []);

  // Supplier Contracts callbacks
  const addSupplierContract = useCallback((contract: Omit<SupplierContract, "id" | "contractNumber">): SupplierContract => {
    const id = `ctr-${Date.now()}`;
    const contractNumber = `CTR-2026-${contract.category.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-4)}`;
    const newContract: SupplierContract = {
      ...contract,
      id,
      contractNumber,
    };
    setSupplierContracts((prev) => [newContract, ...prev]);
    return newContract;
  }, []);

  const updateSupplierContractStatus = useCallback((contractId: string, status: SupplierContractStatus) => {
    setSupplierContracts((prev) =>
      prev.map((c) => (c.id === contractId ? { ...c, status } : c))
    );
  }, []);

  const sendRenewalNotice = useCallback((contractId: string) => {
    const today = new Date().toISOString().slice(0, 10);
    setSupplierContracts((prev) =>
      prev.map((c) =>
        c.id === contractId
          ? {
              ...c,
              status: "in_renewal" as SupplierContractStatus,
              lastRenewalNoticeSent: today,
              notes: `${c.notes || ""} | Formal renewal notice dispatched on ${today}.`.trim(),
            }
          : c
      )
    );
  }, []);

  const recordSlaAudit = useCallback((contractId: string, slaUpdates: Partial<SupplierContractSla>) => {
    setSupplierContracts((prev) =>
      prev.map((c) => {
        if (c.id !== contractId) return c;
        const mergedSla: SupplierContractSla = {
          ...c.sla,
          ...slaUpdates,
          lastAuditDate: new Date().toISOString().slice(0, 10),
        };
        const score = Math.round(
          mergedSla.currentTimelinessPct * 0.4 +
          mergedSla.currentFillRatePct * 0.35 +
          mergedSla.currentQualityCompliancePct * 0.25
        );
        mergedSla.overallScore = score;
        mergedSla.grade = score >= 95 ? "A+" : score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : "F";
        return {
          ...c,
          sla: mergedSla,
        };
      })
    );
  }, []);

  // Kitchen Prep & Scaling callbacks
  const updatePrepItemStatus = useCallback((prepId: string, status: PrepItemStatus) => {
    setKitchenPrepItems((prev) =>
      prev.map((p) => (p.id === prepId ? { ...p, status } : p))
    );
  }, []);

  const assignChefToPrep = useCallback((prepId: string, chefName: string) => {
    setKitchenPrepItems((prev) =>
      prev.map((p) => (p.id === prepId ? { ...p, assignedChef: chefName } : p))
    );
  }, []);

  const scalePrepPortions = useCallback((prepId: string, targetPortions: number) => {
    setKitchenPrepItems((prev) =>
      prev.map((p) => {
        if (p.id !== prepId) return p;
        const validTarget = Math.max(1, targetPortions);
        const factor = Math.round((validTarget / p.baseYieldPortions) * 100) / 100;
        const updatedIngredients = p.ingredients.map((ing) => ({
          ...ing,
          scaledQty: Math.round(ing.baseQty * factor * 100) / 100,
          stockStatus: (ing.currentStockQty >= ing.baseQty * factor
            ? "sufficient"
            : ing.currentStockQty >= ing.baseQty * factor * 0.5
            ? "low_stock"
            : "stockout") as "sufficient" | "low_stock" | "stockout",
        }));
        return {
          ...p,
          forecastedPortions: validTarget,
          scalingFactor: factor,
          ingredients: updatedIngredients,
        };
      })
    );
  }, []);

  const bulkUpdatePrepStatus = useCallback((status: PrepItemStatus, station?: KitchenPrepStation) => {
    setKitchenPrepItems((prev) =>
      prev.map((p) => (!station || p.station === station ? { ...p, status } : p))
    );
  }, []);

  // Cash Flow Liquidity helper
  const getCashFlowForecast = useCallback(
    (scenario?: CashFlowScenario): DailyCashFlowEntry[] => {
      return generateCashFlowForecast(
        businessDate,
        reservations,
        cityLedgerAccounts,
        accountsPayableInvoices,
        seedEmployees,
        scenario
      );
    },
    [businessDate, reservations, cityLedgerAccounts, accountsPayableInvoices]
  );

  // Maintenance Audit Trail (Assets Module)
  const addMaintenanceAuditRecord = useCallback(
    (record: Omit<MaintenanceAuditRecord, "id" | "repairTicketCode">): MaintenanceAuditRecord => {
      const codeSeq = String(maintenanceAuditRecords.length + 1).padStart(3, "0");
      const newRec: MaintenanceAuditRecord = {
        ...record,
        id: `m-aud-${Date.now()}`,
        repairTicketCode: `REP-${record.assetCategory.slice(0, 4).toUpperCase()}-${codeSeq}`,
      };
      setMaintenanceAuditRecords((prev) => [newRec, ...prev]);
      return newRec;
    },
    [maintenanceAuditRecords.length]
  );

  const updateMaintenanceAuditRecord = useCallback((id: string, updates: Partial<MaintenanceAuditRecord>) => {
    setMaintenanceAuditRecords((prev) =>
      prev.map((rec) => (rec.id === id ? { ...rec, ...updates } : rec))
    );
  }, []);

  const verifyMaintenanceAuditRecord = useCallback((id: string, supervisorName: string, notes?: string) => {
    setMaintenanceAuditRecords((prev) =>
      prev.map((rec) =>
        rec.id === id
          ? {
              ...rec,
              supervisorName,
              supervisorApprovalStatus: "verified_passed",
              supervisorSignOffDate: `${businessDate} ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`,
              supervisorNotes: notes || rec.supervisorNotes || "Supervisor physical inspection verified and signed off.",
              status: "verified",
            }
          : rec
      )
    );
  }, [businessDate]);

  // Personalized Guest 360 Preferences
  const updateGuestPersonalizedPreferences = useCallback(
    (guestId: string, updates: Partial<GuestPersonalizedPreferences>) => {
      setGuestPersonalizedPreferences((prev) => {
        const cur = prev[guestId];
        if (!cur) return prev;
        return {
          ...prev,
          [guestId]: {
            ...cur,
            ...updates,
          },
        };
      });
    },
    []
  );

  const preSetRoomControlsForGuest = useCallback(
    (guestId: string, roomNumber: string) => {
      const prefs = guestPersonalizedPreferences[guestId];
      if (!prefs) {
        return { success: false, message: `No profile preferences found for guest ${guestId}`, actionsApplied: [] };
      }

      const targetRoom = rooms.find((r) => r.number === roomNumber);
      const targetRoomId = targetRoom?.id || `rm-${roomNumber}`;
      const now = `${businessDate} ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;

      // 1. Update Smart Room Controls IoT
      setSmartRoomControls((prev) => {
        const currentControl = prev[targetRoomId] || {
          roomId: targetRoomId,
          roomNumber,
          dndActive: false,
          murActive: false,
          targetTemperature: 21,
          currentTemperature: 23.5,
          hvacMode: "cool",
          fanSpeed: "auto",
          lightingScene: "relax",
          lights: { master: true, entryway: true, bedroom: true, bathroom: false, nightstand: false },
          doorLocked: true,
          privacyLatchEngaged: false,
          lastUpdated: now,
        };

        return {
          ...prev,
          [targetRoomId]: {
            ...currentControl,
            targetTemperature: prefs.preferredTemperatureCelsius,
            hvacMode: prefs.preferredAcMode,
            fanSpeed: prefs.preferredFanSpeed,
            lightingScene: "relax",
            lastUpdated: now,
          },
        };
      });

      // 2. Adjust BMS Energy Telemetry (disable eco setback for impending check-in)
      setRoomEnergyReadings((prev) =>
        prev.map((reading) =>
          reading.roomNumber === roomNumber
            ? {
                ...reading,
                targetTemp: prefs.preferredTemperatureCelsius,
                hvacState: prefs.preferredAcMode === "cool" ? "cooling" : "heating",
                ecoModeEngaged: false,
                lastTelemetryTime: now,
              }
            : reading
        )
      );

      // 3. Issue Housekeeping Task for Bedding Comfort
      const pillowTaskId = `task-pref-${Date.now().toString().slice(-4)}`;
      setTasks((prev) => [
        {
          id: pillowTaskId,
          roomId: targetRoomId,
          roomNumber,
          type: "special_request",
          status: "in_progress",
          assignedTo: "Housekeeping Floor Lead",
          priority: "high",
          description: `VIP PRE-ARRIVAL SETUP: Deliver ${prefs.pillowCount}x ${prefs.pillowType} pillows, ${prefs.mattressTopperPreference || "standard luxury"} topper, and mist ${prefs.roomFragrance || "White Tea"}.`,
          createdAt: now,
        },
        ...prev,
      ]);

      const actionsApplied = [
        `Smart HVAC thermostat pre-set to ${prefs.preferredTemperatureCelsius}°C (${prefs.preferredAcMode.toUpperCase()} mode, Fan: ${prefs.preferredFanSpeed}) in Room ${roomNumber}. Eco setback disengaged.`,
        `Housekeeping priority task dispatched: ${prefs.pillowCount}x ${prefs.pillowType} pillows, ${prefs.duvetWeight || "All-Season"} duvet.`,
        `F&B kitchen dining profile synchronized: ${prefs.dietaryRestrictions.length > 0 ? prefs.dietaryRestrictions.join(", ") : "No dietary restrictions specified"}.`,
        `Guest amenities pre-stocked: ${prefs.beveragePreference || "Chilled Spring Water"} & ${prefs.roomFragrance || "Fresh"} fragrance.`,
      ];

      // Update Guest Preference log & automation status
      setGuestPersonalizedPreferences((prev) => {
        const cur = prev[guestId];
        if (!cur) return prev;
        const newActions = actionsApplied.map((act, idx) => ({
          id: `act-${Date.now()}-${idx}`,
          timestamp: now,
          system: (idx === 0
            ? "IoT Climate Control"
            : idx === 1
            ? "Housekeeping Linen Dispatch"
            : idx === 2
            ? "F&B Kitchen Alert"
            : "VIP Welcome Amenity") as any,
          detail: act,
          status: "applied" as const,
        }));

        return {
          ...prev,
          [guestId]: {
            ...cur,
            preArrivalAutomation: {
              ...cur.preArrivalAutomation,
              assignedRoomNumber: roomNumber,
              lastDispatchedAt: now,
              status: "pre_conditioned",
              dispatchedActions: [...newActions, ...(cur.preArrivalAutomation.dispatchedActions || [])],
            },
            history: [
              {
                id: `ph-${Date.now()}`,
                timestamp: now,
                category: "climate",
                changeDescription: `Pre-set room controls prior to arrival: ${prefs.preferredTemperatureCelsius}°C in Room ${roomNumber}.`,
                source: "VIP Butler",
                staffMember: "Automated Comfort Engine",
              },
              ...cur.history,
            ],
          },
        };
      });

      return {
        success: true,
        message: `Automated comfort pre-set dispatched to Room ${roomNumber} for ${prefs.guestName}!`,
        actionsApplied,
      };
    },
    [businessDate, guestPersonalizedPreferences, rooms]
  );

  // Core Inventory Threshold Alerts & Burn Rate System
  const triggerInventoryThresholdAlert = useCallback(
    (itemId: string, channel: "email" | "push" | "both" = "both"): InventoryAlertNotification => {
      const item = coreInventoryThresholdItems.find((i) => i.id === itemId);
      if (!item) throw new Error("Item not found");

      const runway = Number((item.currentStock / Math.max(item.dailyBurnRate, 0.1)).toFixed(1));
      const severity = runway <= item.criticalStockDaysThreshold ? "critical" : "warning";
      const now = `${businessDate} ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
      const codeSeq = String(inventoryAlertNotifications.length + 1).padStart(3, "0");
      const alertCode = `ALT-2026-${codeSeq}`;

      const newAlert: InventoryAlertNotification = {
        id: `alt-${Date.now()}`,
        alertCode,
        timestamp: now,
        itemId: item.id,
        itemName: item.name,
        sku: item.sku,
        severity,
        channel,
        currentStockFormatted: `${item.currentStock} ${item.unit}`,
        dailyBurnRateFormatted: `${item.dailyBurnRate} ${item.unit} / day`,
        runwayDays: runway,
        emailSubject: `[${severity.toUpperCase()} INVENTORY ALERT] ${item.name} (${runway} Days Runway)`,
        emailBody: `Automated burn rate monitor has detected low stock par for ${item.name} (${item.sku}). Current stock is ${item.currentStock} ${item.unit} with an average burn rate of ${item.dailyBurnRate} ${item.unit}/day. Runway is ${runway} days before stockout. Supplier: ${item.primarySupplierName}. Recommended emergency replenishment: ${Math.max(1, Math.ceil(item.parTargetLevel - item.currentStock))} ${item.unit}.`,
        pushTitle: `${severity === "critical" ? "CRITICAL PAR" : "LOW STOCK"}: ${item.name}`,
        pushMessage: `${item.currentStock} ${item.unit} left (${runway} days runway). Burn: ${item.dailyBurnRate} ${item.unit}/day. Tap to generate PO.`,
        recipients: item.alertRecipientEmails,
        deliveryStatus: "delivered",
        actionStatus: "pending_reorder",
      };

      setInventoryAlertNotifications((prev) => [newAlert, ...prev]);
      setCoreInventoryThresholdItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, lastAlertSentAt: now } : i))
      );

      return newAlert;
    },
    [businessDate, coreInventoryThresholdItems, inventoryAlertNotifications.length]
  );

  const triggerBatchInventoryAlerts = useCallback((): number => {
    const candidates = coreInventoryThresholdItems.filter((i) => {
      const runway = i.currentStock / Math.max(i.dailyBurnRate, 0.1);
      return runway <= i.minStockDaysThreshold;
    });

    let count = 0;
    candidates.forEach((item) => {
      triggerInventoryThresholdAlert(item.id, "both");
      count += 1;
    });
    return count;
  }, [coreInventoryThresholdItems, triggerInventoryThresholdAlert]);

  const updateCoreInventoryThresholdItem = useCallback((itemId: string, updates: Partial<CoreInventoryThresholdItem>) => {
    setCoreInventoryThresholdItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, ...updates } : i))
    );
  }, []);

  const createEmergencyPoFromAlert = useCallback(
    (alertId: string): string => {
      const alert = inventoryAlertNotifications.find((a) => a.id === alertId);
      const item = alert ? coreInventoryThresholdItems.find((i) => i.id === alert.itemId) : null;
      if (!alert || !item) return "";

      const poSeq = String(purchaseRequisitions.length + 1).padStart(3, "0");
      const poNum = `PO-EMERG-2026-${poSeq}`;
      const neededQty = Math.max(1, Math.ceil(item.parTargetLevel - item.currentStock));

      const newReq: PurchaseRequisition = {
        id: `req-emerg-${Date.now()}`,
        requisitionNumber: `REQ-EMERG-${poSeq}`,
        department: "Food & Beverage - Kitchen",
        requestedBy: "Automated Threshold Alert Engine",
        requestDate: businessDate,
        urgency: "Emergency Rush",
        poNumber: poNum,
        status: "procurement_po_created",
        totalEstimate: neededQty * item.costPerUnit,
        items: [
          {
            productId: item.productId,
            name: item.name,
            quantity: neededQty,
            unit: item.unit,
            estimatedCost: neededQty * item.costPerUnit,
            purpose: `Critical stock replenishment due to burn rate (${item.dailyBurnRate} ${item.unit}/day). Runway: ${(item.currentStock / item.dailyBurnRate).toFixed(1)} days.`,
          },
        ],
        notes: `Emergency PO dispatched to ${item.primarySupplierName} (${item.supplierEmail}) to prevent kitchen stockout.`,
      };

      setPurchaseRequisitions((prev) => [newReq, ...prev]);

      setInventoryAlertNotifications((prev) =>
        prev.map((a) =>
          a.id === alertId
            ? { ...a, actionStatus: "po_created" as const, linkedPoNumber: poNum }
            : a
        )
      );

      setCoreInventoryThresholdItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, openPoNumber: poNum } : i))
      );

      return poNum;
    },
    [businessDate, coreInventoryThresholdItems, inventoryAlertNotifications, purchaseRequisitions.length]
  );

  const value = useMemo<PlatformState>(
    () => ({
      businessDate,
      rooms,
      guests,
      reservations,
      stays,
      folios,
      folioLines,
      tasks,
      orders,
      orderLines,
      menuItems,
      traces,
      keyCards,
      createWalkIn,
      checkIn,
      checkOut,
      assignRoomToReservation,
      roomMove,
      updateRoomStatus,
      assignHousekeeper,
      encodeKeyCard,
      addTrace,
      resolveTrace,
      completeTask,
      inspectTask,
      assignTask,
      createOrder,
      closeOrder,
      postCharge,
      postChargeDetailed,
      postPayment,
      settleFolioWindow,
      transferFolioCharge,
      runNightAuditStep,
      auditReports,
      executeComprehensiveNightAudit,
      shiftHandovers,
      createShiftHandover,
      acknowledgeShiftHandover,
      updateShiftHandover,
      pmSchedules,
      pmLogs,
      createPmSchedule,
      logPmInspection,
      updatePmSchedule,
      rateRecommendations,
      yieldRules,
      applyRateRecommendation,
      toggleYieldRule,
      addYieldRule,
      guestSurveys,
      recoveryTickets,
      createSurveyResponse,
      updateRecoveryTicket,
      updateGuestFlags,
      toggleGuestFlag,
      lostAndFound,
      createLostAndFoundItem,
      updateLostAndFoundStatus,
      sendLostAndFoundEmail,
      roomEnergyReadings,
      triggerEcoKillswitch,
      resetEnergyAlert,
      smartRoomControls,
      updateSmartRoom,
      toggleRoomDnd,
      toggleRoomMur,
      usaliStatements,
      cityLedgerAccounts,
      accountsPayableInvoices,
      taxSchedules,
      recordCityLedgerPayment,
      createCityLedgerInvoice,
      approveApInvoice,
      payApInvoice,
      remitTaxSchedule,
      restaurantTables,
      kitchenTickets,
      recipeCostings,
      banquetOrders,
      kitchenWasteLogs,
      updateTableStatus,
      updateKotStatus,
      createBanquetOrder,
      logKitchenWaste,
      supplyChainStores,
      supplyChainProducts,
      purchaseRequisitions,
      goodsReceivedNotes,
      storeTransfers,
      stocktakeAudits,
      createPurchaseRequisition,
      approvePurchaseRequisition,
      receiveGrn,
      createStoreTransfer,
      recordStocktakeAudit,
      supplierContracts,
      addSupplierContract,
      updateSupplierContractStatus,
      sendRenewalNotice,
      recordSlaAudit,
      kitchenPrepItems,
      updatePrepItemStatus,
      assignChefToPrep,
      scalePrepPortions,
      bulkUpdatePrepStatus,
      getCashFlowForecast,
      maintenanceAuditRecords,
      addMaintenanceAuditRecord,
      updateMaintenanceAuditRecord,
      verifyMaintenanceAuditRecord,
      guestPersonalizedPreferences,
      updateGuestPersonalizedPreferences,
      preSetRoomControlsForGuest,
      coreInventoryThresholdItems,
      inventoryAlertNotifications,
      triggerInventoryThresholdAlert,
      triggerBatchInventoryAlerts,
      updateCoreInventoryThresholdItem,
      createEmergencyPoFromAlert,
    }),
    [
      businessDate,
      rooms,
      guests,
      reservations,
      stays,
      folios,
      folioLines,
      tasks,
      orders,
      orderLines,
      menuItems,
      traces,
      keyCards,
      createWalkIn,
      checkIn,
      checkOut,
      assignRoomToReservation,
      roomMove,
      updateRoomStatus,
      assignHousekeeper,
      encodeKeyCard,
      addTrace,
      resolveTrace,
      completeTask,
      inspectTask,
      assignTask,
      createOrder,
      closeOrder,
      postCharge,
      postChargeDetailed,
      postPayment,
      settleFolioWindow,
      transferFolioCharge,
      runNightAuditStep,
      auditReports,
      executeComprehensiveNightAudit,
      shiftHandovers,
      createShiftHandover,
      acknowledgeShiftHandover,
      updateShiftHandover,
      pmSchedules,
      pmLogs,
      createPmSchedule,
      logPmInspection,
      updatePmSchedule,
      rateRecommendations,
      yieldRules,
      applyRateRecommendation,
      toggleYieldRule,
      addYieldRule,
      guestSurveys,
      recoveryTickets,
      createSurveyResponse,
      updateRecoveryTicket,
      updateGuestFlags,
      toggleGuestFlag,
      lostAndFound,
      createLostAndFoundItem,
      updateLostAndFoundStatus,
      sendLostAndFoundEmail,
      roomEnergyReadings,
      triggerEcoKillswitch,
      resetEnergyAlert,
      smartRoomControls,
      updateSmartRoom,
      toggleRoomDnd,
      toggleRoomMur,
      usaliStatements,
      cityLedgerAccounts,
      accountsPayableInvoices,
      taxSchedules,
      recordCityLedgerPayment,
      createCityLedgerInvoice,
      approveApInvoice,
      payApInvoice,
      remitTaxSchedule,
      restaurantTables,
      kitchenTickets,
      recipeCostings,
      banquetOrders,
      kitchenWasteLogs,
      updateTableStatus,
      updateKotStatus,
      createBanquetOrder,
      logKitchenWaste,
      supplyChainStores,
      supplyChainProducts,
      purchaseRequisitions,
      goodsReceivedNotes,
      storeTransfers,
      stocktakeAudits,
      createPurchaseRequisition,
      approvePurchaseRequisition,
      receiveGrn,
      createStoreTransfer,
      recordStocktakeAudit,
      supplierContracts,
      addSupplierContract,
      updateSupplierContractStatus,
      sendRenewalNotice,
      recordSlaAudit,
      kitchenPrepItems,
      updatePrepItemStatus,
      assignChefToPrep,
      scalePrepPortions,
      bulkUpdatePrepStatus,
      getCashFlowForecast,
      maintenanceAuditRecords,
      addMaintenanceAuditRecord,
      updateMaintenanceAuditRecord,
      verifyMaintenanceAuditRecord,
      guestPersonalizedPreferences,
      updateGuestPersonalizedPreferences,
      preSetRoomControlsForGuest,
      coreInventoryThresholdItems,
      inventoryAlertNotifications,
      triggerInventoryThresholdAlert,
      triggerBatchInventoryAlerts,
      updateCoreInventoryThresholdItem,
      createEmergencyPoFromAlert,
    ]
  );

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform(): PlatformState {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error("usePlatform must be used within PlatformProvider");
  return ctx;
}
