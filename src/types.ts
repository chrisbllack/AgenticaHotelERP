// Shared domain types — mirror the platform data model (ADR-0006 submodules)

export type RoomStatus =
  | "occupied_clean"
  | "occupied_dirty"
  | "vacant_clean"
  | "vacant_dirty"
  | "reserved"
  | "out_of_order"
  | "out_of_service";

export interface Room {
  id: string;
  number: string;
  roomTypeId: string;
  floorId: string;
  status: RoomStatus;
  housekeepingStatus: "clean" | "dirty" | "inspected";
}

export interface RoomType {
  id: string;
  code: string;
  name: string;
  baseRate: number;
  maxOccupancy: number;
}

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
  company: string;
}

export type ReservationStatus =
  | "confirmed"
  | "tentative"
  | "checked_in"
  | "checked_out"
  | "cancelled"
  | "no_show";

export interface Reservation {
  id: string;
  confirmationNumber: string;
  guestId: string;
  roomTypeId: string | null;
  roomId: string | null;
  arrivalDate: string;
  departureDate: string;
  nights: number;
  adults: number;
  children: number;
  status: ReservationStatus;
  source: string;
  totalEstimate: number;
  depositPaid: number;
  isVip: boolean;
}

export interface GuestStay {
  id: string;
  reservationId: string;
  guestId: string;
  roomId: string;
  expectedArrival: string;
  expectedDeparture: string;
  status: "active" | "departed";
}

export interface Folio {
  id: string;
  guestStayId: string;
  folioNumber: string;
  status: "open" | "closed";
  balance: number; // negative = guest owes (debits exceed credits)
  currency: string;
}

export interface FolioLine {
  folioId: string;
  type: "debit" | "credit";
  description: string;
  amount: number;
}

export interface NightAudit {
  id: string;
  businessDate: string;
  totalRooms: number;
  occupiedRooms: number;
  arrivals: number;
  departures: number;
  noShows: number;
  totalRoomCharges: number;
  totalTax: number;
  totalPayments: number;
  status: "completed" | "pending";
}

export interface Outlet {
  id: string;
  name: string;
  code: string;
  type: "restaurant" | "bar" | "room_service";
  status: "active" | "inactive";
}

export interface MenuCategory {
  id: string;
  name: string;
  outletId: string;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  code: string;
  price: number;
  isAvailable: boolean;
  preparationTime: number;
}

export interface PosOrder {
  id: string;
  outletId: string;
  orderNumber: string;
  status: "open" | "closed" | "voided";
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  paymentStatus: "paid" | "pending" | "voided";
  createdAt: string;
}

export interface PosOrderLine {
  orderId: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  status: "completed" | "pending" | "voided";
}

export type HkTaskStatus = "pending" | "in_progress" | "completed" | "inspected";
export type HkPriority = "normal" | "high" | "urgent";

export interface HousekeepingTask {
  id: string;
  roomId: string;
  taskType: string;
  priority: HkPriority;
  status: HkTaskStatus;
  assignedTo: string | null;
}

export interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  departmentId: string;
  position: string;
  salary: number;
  status: "active" | "on_leave" | "terminated";
}

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface GlAccount {
  id: string;
  accountCode: string;
  accountName: string;
  accountClass: "asset" | "liability" | "equity" | "revenue" | "expense";
  accountType: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  entryDate: string;
  description: string;
  status: "draft" | "posted" | "reversed";
}

export interface CashierShift {
  id: string;
  shiftNumber: string;
  openingFloat: number;
  closingFloat: number | null;
  totalSales: number;
  totalRefunds: number;
  status: "open" | "closed";
}

export interface LoyaltyTier {
  id: string;
  name: string;
  code: string;
  minPoints: number;
  discountPercent: number;
  benefits: string;
  status: "active" | "inactive";
}

export interface PaymentMethod {
  name: string;
  code: string;
  type: "cash" | "card" | "transfer" | "online" | "mobile" | "credit" | "complimentary";
  isActive: boolean;
}

export interface EventBooking {
  id: string;
  name: string;
  eventType: string;
  clientName: string;
  venueId: string | null;
  eventDate: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  packageName: string;
  totalAmount: number;
  status: "inquiry" | "tentative" | "confirmed" | "completed" | "cancelled";
}

export interface Venue {
  id: string;
  name: string;
  capacity: number;
  hourlyRate: number;
  status: "available" | "maintenance";
}

export interface Channel {
  id: string;
  name: string;
  code: string;
  type: "ota" | "gds" | "direct" | "wholesaler";
  status: "connected" | "disconnected" | "error";
  lastSyncAt: string | null;
}

export interface HardwareDevice {
  id: string;
  deviceType: "door_lock" | "printer" | "pos_terminal" | "kds" | "scanner" | "iptv" | "biometric";
  vendor: string;
  model: string;
  serialNumber: string;
  location: string;
  status: "online" | "offline" | "error";
  lastHealthCheck: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "active" | "suspended";
}

export type Role =
  | "admin"
  | "general_manager"
  | "front_desk"
  | "cashier"
  | "housekeeping"
  | "fnb"
  | "accountant"
  | "hr";

export const ROLE_LABELS: Record<Role, string> = {
  admin: "System Administrator",
  general_manager: "General Manager",
  front_desk: "Front Desk",
  cashier: "Cashier",
  housekeeping: "Housekeeping",
  fnb: "Food & Beverage",
  accountant: "Accountant",
  hr: "Human Resources",
};

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  module: string;
  action: string;
  entityId: string;
  createdAt: string;
}

export interface InventoryProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  costPrice: number;
  reorderLevel: number;
}

export interface StockLevel {
  productId: string;
  storeId: string;
  quantity: number;
}

export interface Store {
  id: string;
  name: string;
  type: "main" | "kitchen" | "bar" | "housekeeping";
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  paymentTerms: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  orderDate: string;
  status: "draft" | "pending_approval" | "approved" | "received" | "cancelled";
  total: number;
}
