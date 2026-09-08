// Demo dataset recovered from the INFINEON demo database (Grand Palm Hotel Lagos).
// Shape mirrors migrations 0001–0014 so a Go/Convex backend can replace it 1:1.

import type {
  AuditLogEntry,
  CashierShift,
  Channel,
  Department,
  Employee,
  EventBooking,
  Folio,
  FolioLine,
  GlAccount,
  HardwareDevice,
  HousekeepingTask,
  InventoryProduct,
  JournalEntry,
  LoyaltyTier,
  MenuCategory,
  MenuItem,
  Outlet,
  PaymentMethod,
  PosOrder,
  PosOrderLine,
  PurchaseOrder,
  Reservation,
  Room,
  RoomType,
  StockLevel,
  Store,
  Supplier,
  User,
  Venue,
  GuestStay,
  Guest,
} from "../types";

export const PROPERTY = {
  id: "prop-gphl",
  name: "Grand Palm Hotel Lagos",
  code: "GPHL",
  city: "Lagos",
  country: "Nigeria",
  currency: "NGN",
  timezone: "Africa/Lagos",
  rooms: 50,
};

export const roomTypes: RoomType[] = [
  { id: "STD-TYPE", code: "STD", name: "Standard Room", baseRate: 25000, maxOccupancy: 2 },
  { id: "DLX-TYPE", code: "DLX", name: "Deluxe Room", baseRate: 40000, maxOccupancy: 2 },
  { id: "EXE-TYPE", code: "EXE", name: "Executive Suite", baseRate: 65000, maxOccupancy: 2 },
  { id: "PRM-TYPE", code: "PRM", name: "Presidential Suite", baseRate: 150000, maxOccupancy: 4 },
];

const floorOf = (n: number): string => (n <= 10 ? "floor-1" : n <= 20 ? "floor-2" : n <= 30 ? "floor-3" : n <= 40 ? "floor-4" : "floor-5");
const typeOf = (n: number): string => (n <= 40 ? "STD-TYPE" : n <= 47 ? "DLX-TYPE" : n <= 49 ? "EXE-TYPE" : "PRM-TYPE");

const roomStatuses: Record<number, Room["status"]> = {
  1: "occupied_clean", 2: "occupied_clean", 3: "vacant_clean", 4: "vacant_dirty",
  5: "occupied_clean", 6: "vacant_clean", 7: "vacant_clean", 8: "vacant_clean",
  9: "vacant_dirty", 10: "occupied_clean",
  11: "vacant_dirty", 12: "vacant_dirty", 13: "vacant_dirty", 14: "vacant_dirty",
  15: "occupied_clean", 16: "vacant_dirty", 17: "vacant_dirty", 18: "vacant_dirty",
  19: "vacant_dirty", 20: "occupied_clean",
  21: "vacant_dirty", 22: "vacant_dirty", 23: "vacant_dirty", 24: "vacant_dirty",
  25: "occupied_dirty", 26: "vacant_dirty", 27: "vacant_dirty", 28: "vacant_dirty",
  29: "vacant_dirty", 30: "vacant_clean",
  31: "vacant_clean", 32: "vacant_clean", 33: "vacant_clean", 34: "vacant_clean",
  35: "reserved", 36: "reserved", 37: "reserved", 38: "reserved", 39: "reserved",
  40: "vacant_dirty",
  41: "occupied_clean", 42: "occupied_clean", 43: "reserved", 44: "vacant_dirty",
  45: "out_of_order", 46: "out_of_order", 47: "vacant_dirty", 48: "occupied_dirty",
  49: "occupied_dirty", 50: "occupied_dirty",
};

export const rooms: Room[] = Array.from({ length: 50 }, (_, i) => {
  const n = i + 1;
  const status = roomStatuses[n];
  return {
    id: `room-${String(n).padStart(3, "0")}`,
    number: String(n).padStart(3, "0"),
    roomTypeId: typeOf(n),
    floorId: floorOf(n),
    status,
    housekeepingStatus: status.endsWith("dirty") || status === "out_of_order" ? "dirty" : "clean",
  };
});

export const guests: Guest[] = [
  { id: "guest-Okonkwo", firstName: "Adaeze", lastName: "Okonkwo", email: "adaeze.okonkwo@mtngroup.com", phone: "+234-803-123-4567", nationality: "Nigerian", company: "MTN Nigeria", flags: ["VIP"], flagNotes: "Prefers high floor, extra sparkling water." },
  { id: "guest-Nwosu", firstName: "Chukwuemeka", lastName: "Nwosu", email: "emeka.nwosu@shell.com.ng", phone: "+234-806-234-5678", nationality: "Nigerian", company: "Shell Nigeria", flags: ["VIP"] },
  { id: "guest-Abubakar", firstName: "Fatima", lastName: "Abubakar", email: "fatima@npa.gov.ng", phone: "+234-809-345-6789", nationality: "Nigerian", company: "NPA" },
  { id: "guest-Adeyemi", firstName: "Oluwaseun", lastName: "Adeyemi", email: "seun@andela.com", phone: "+234-812-456-7890", nationality: "Nigerian", company: "Andela" },
  { id: "guest-Obi", firstName: "Ngozi", lastName: "Obi", email: "ngozi.obi@gtbank.com", phone: "+234-701-567-8901", nationality: "Nigerian", company: "GTBank", flags: ["VIP", "High-Spend"], flagNotes: "GTBank Executive Director. Complimentary upgrade when available." },
  { id: "guest-Mohammed", firstName: "Ibrahim", lastName: "Mohammed", email: "ibrahim@nnpc.gov.ng", phone: "+234-805-678-9012", nationality: "Nigerian", company: "NNPC" },
  { id: "guest-Eke", firstName: "Blessing", lastName: "Eke", email: "blessing.eke@jumia.com.ng", phone: "+234-816-789-0123", nationality: "Nigerian", company: "Jumia Nigeria" },
  { id: "guest-Fashola", firstName: "Tunde", lastName: "Fashola", email: "tunde@lagosstate.gov.ng", phone: "+234-807-890-1234", nationality: "Nigerian", company: "Lagos State Govt", flags: ["VIP"] },
  { id: "guest-Eze", firstName: "Amara", lastName: "Eze", email: "amara.eze@pwc.com", phone: "+234-818-901-2345", nationality: "Nigerian", company: "PwC Nigeria" },
  { id: "guest-Bello", firstName: "Yusuf", lastName: "Bello", email: "yusuf.bello@dangote.com", phone: "+234-802-012-3456", nationality: "Nigerian", company: "Dangote Group", flags: ["VIP", "High-Spend"], flagNotes: "Chairman VIP protocol. 24/7 Butler Service assigned." },
  { id: "guest-Ibrahim", firstName: "Chidinma", lastName: "Ibrahim", email: "chidinma@kuda.com", phone: "+234-908-111-2222", nationality: "Nigerian", company: "Kuda Bank" },
  { id: "guest-Sanusi", firstName: "Olumide", lastName: "Sanusi", email: "olumide.sanusi@accessbank.com", phone: "+234-909-222-3333", nationality: "Nigerian", company: "Access Bank", flags: ["High-Spend"] },
  { id: "guest-Uche", firstName: "Emeka", lastName: "Uche", email: "emeka.uche@flourmills.com", phone: "+234-906-444-5555", nationality: "Nigerian", company: "Flour Mills" },
  { id: "guest-Ogunlesi", firstName: "Sade", lastName: "Ogunlesi", email: "sade@globacom.ng", phone: "+234-808-555-6666", nationality: "Nigerian", company: "Globacom" },
  { id: "guest-Achebe", firstName: "Obinna", lastName: "Achebe", email: "obinna@lagosbiz.ng", phone: "+234-815-666-7777", nationality: "Nigerian", company: "Self-employed", flags: ["Blacklist"], blacklistReason: "Repeated non-payment of mini-bar/incidentals and unauthorized room modification. Flagged by Security & Finance." },
  { id: "guest-Adepetu", firstName: "Funke", lastName: "Adepetu", email: "funke@multichoice.co.za", phone: "+234-817-777-8888", nationality: "Nigerian", company: "MultiChoice" },
  { id: "guest-Raji", firstName: "Babatunde", lastName: "Raji", email: "babatunde@stanbicibtc.com", phone: "+234-810-888-9999", nationality: "Nigerian", company: "Stanbic IBTC" },
  { id: "guest-Adeosun", firstName: "Kemi", lastName: "Adeosun", email: "kemi@oandoplc.com", phone: "+234-811-999-0000", nationality: "Nigerian", company: "Oando Plc" },
  { id: "guest-Okpara", firstName: "Chidi", lastName: "Okpara", email: "chidi@intels.com.ng", phone: "+234-813-000-1111", nationality: "Nigerian", company: "Intels Nigeria" },
];

type ResSeed = [string, string, string | null, string, string, number, number, number, Reservation["status"], string, number, number, 0 | 1];
const resSeed: ResSeed[] = [
  ["res-010", "guest-Bello", "room-050", "2026-09-02", "2026-09-15", 13, 2, 1, "checked_in", "Direct", 1950000, 150000, 1],
  ["res-003", "guest-Abubakar", "room-005", "2026-09-03", "2026-09-12", 9, 2, 1, "checked_in", "Government", 168750, 18750, 0],
  ["res-005", "guest-Obi", "room-015", "2026-09-03", "2026-09-10", 7, 2, 0, "checked_in", "Corporate", 238000, 34000, 1],
  ["res-009", "guest-Eze", "room-042", "2026-09-03", "2026-09-12", 9, 1, 0, "checked_in", "Corporate", 306000, 34000, 0],
  ["res-001", "guest-Okonkwo", "room-001", "2026-09-04", "2026-09-10", 6, 2, 0, "checked_in", "Corporate", 204000, 34000, 1],
  ["res-002", "guest-Nwosu", "room-002", "2026-09-04", "2026-09-08", 4, 1, 0, "checked_in", "Direct", 100000, 25000, 1],
  ["res-004", "guest-Adeyemi", "room-010", "2026-09-04", "2026-09-06", 2, 1, 0, "checked_in", "Website", 50000, 25000, 0],
  ["res-006", "guest-Mohammed", "room-020", "2026-09-04", "2026-09-15", 11, 2, 0, "checked_in", "Booking.com", 247500, 22500, 0],
  ["res-008", "guest-Fashola", "room-041", "2026-09-04", "2026-09-08", 4, 2, 0, "checked_in", "Corporate", 136000, 34000, 1],
  ["res-007", "guest-Eke", "room-025", "2026-09-05", "2026-09-10", 5, 1, 0, "checked_in", "Corporate", 170000, 34000, 0],
  ["res-011", "guest-Ibrahim", "room-030", "2026-09-05", "2026-09-08", 3, 2, 0, "confirmed", "Corporate", 102000, 34000, 0],
  ["res-012", "guest-Sanusi", "room-031", "2026-09-05", "2026-09-10", 5, 1, 0, "confirmed", "Corporate", 170000, 34000, 0],
  ["res-014", "guest-Uche", "room-033", "2026-09-05", "2026-09-06", 1, 1, 0, "confirmed", "Corporate", 34000, 34000, 0],
  ["res-015", "guest-Ogunlesi", "room-034", "2026-09-05", "2026-09-08", 3, 2, 1, "confirmed", "Telephone", 75000, 25000, 0],
  ["res-016", "guest-Achebe", "room-003", "2026-09-06", "2026-09-08", 2, 1, 0, "confirmed", "Website", 40000, 20000, 0],
  ["res-017", "guest-Adepetu", "room-006", "2026-09-06", "2026-09-10", 4, 2, 0, "confirmed", "Corporate", 136000, 34000, 0],
  ["res-018", "guest-Raji", "room-007", "2026-09-06", "2026-09-08", 2, 1, 0, "confirmed", "Expedia", 45000, 22500, 0],
  ["res-019", "guest-Adeosun", "room-008", "2026-09-06", "2026-09-12", 6, 2, 0, "confirmed", "Direct", 105000, 17500, 0],
  ["res-020", "guest-Okpara", "room-043", "2026-09-06", "2026-09-08", 2, 2, 0, "confirmed", "Corporate", 68000, 34000, 0],
  ["res-021", "guest-Okonkwo", "room-035", "2026-09-08", "2026-09-10", 2, 2, 0, "confirmed", "Group", 40000, 20000, 1],
  ["res-022", "guest-Nwosu", "room-036", "2026-09-08", "2026-09-10", 2, 2, 0, "confirmed", "Group", 40000, 20000, 1],
  ["res-023", "guest-Obi", "room-037", "2026-09-08", "2026-09-10", 2, 2, 0, "confirmed", "Group", 40000, 20000, 0],
  ["res-024", "guest-Eze", "room-038", "2026-09-08", "2026-09-10", 2, 1, 0, "confirmed", "Group", 40000, 20000, 0],
  ["res-025", "guest-Raji", "room-039", "2026-09-08", "2026-09-10", 2, 2, 0, "confirmed", "Group", 40000, 20000, 0],
];

export const reservations: Reservation[] = resSeed.map(
  ([id, guestId, roomId, arr, dep, nights, adults, children, status, source, total, deposit, vip], i) => ({
    id,
    confirmationNumber: `CN-${String(i + 1).padStart(3, "0")}`.replace("CN-0", "CN-0"),
    guestId,
    roomTypeId: null,
    roomId,
    arrivalDate: arr,
    departureDate: dep,
    nights,
    adults,
    children,
    status,
    source,
    totalEstimate: total,
    depositPaid: deposit,
    isVip: vip === 1,
  }),
);
// Restore original confirmation numbers (order above is by arrival date)
const cnMap: Record<string, string> = {
  "res-001": "CN-001", "res-002": "CN-002", "res-003": "CN-003", "res-004": "CN-004",
  "res-005": "CN-005", "res-006": "CN-006", "res-007": "CN-007", "res-008": "CN-008",
  "res-009": "CN-009", "res-010": "CN-010", "res-011": "CN-011", "res-012": "CN-012",
  "res-014": "CN-014", "res-015": "CN-015", "res-016": "CN-016", "res-017": "CN-017",
  "res-018": "CN-018", "res-019": "CN-019", "res-020": "CN-020", "res-021": "CN-021",
  "res-022": "CN-022", "res-023": "CN-023", "res-024": "CN-024", "res-025": "CN-025",
};
reservations.forEach((r) => (r.confirmationNumber = cnMap[r.id] ?? r.confirmationNumber));

export const guestStays: GuestStay[] = reservations
  .filter((r) => r.status === "checked_in" && r.roomId)
  .map((r, i) => ({
    id: `stay-${String(i + 1).padStart(3, "0")}`,
    reservationId: r.id,
    guestId: r.guestId,
    roomId: r.roomId!,
    expectedArrival: r.arrivalDate,
    expectedDeparture: r.departureDate,
    status: "active" as const,
  }));

// Folio balances recovered from the demo DB (negative balance = amount due)
const folioBalances = [-10795, -7937.5, -5953.125, -7937.5, -10795, -7143.75, -10795, -10795, -10795, -47625];

export const folios: Folio[] = guestStays.slice(0, 10).map((s, i) => ({
  id: `folio-${String(i + 1).padStart(3, "0")}`,
  guestStayId: s.id,
  folioNumber: `F-${String(i + 1).padStart(4, "0")}`,
  status: "open" as const,
  balance: folioBalances[i],
  currency: "NGN",
}));

const folioLineSeed: Array<[string, "debit" | "credit", number]> = [
  ["Room 001", "debit", 34000], ["Service Charge (10%)", "debit", 3400], ["VAT (7.5%)", "debit", 2805], ["Deposit Paid", "credit", -51000],
  ["Room 002", "debit", 25000], ["Service Charge (10%)", "debit", 2500], ["VAT (7.5%)", "debit", 2062.5], ["Deposit Paid", "credit", -37500],
  ["Room 005", "debit", 18750], ["Service Charge (10%)", "debit", 1875], ["VAT (7.5%)", "debit", 1546.88], ["Deposit Paid", "credit", -28125],
  ["Room 010", "debit", 25000], ["Service Charge (10%)", "debit", 2500], ["VAT (7.5%)", "debit", 2062.5], ["Deposit Paid", "credit", -37500],
  ["Room 015", "debit", 34000], ["Service Charge (10%)", "debit", 3400], ["VAT (7.5%)", "debit", 2805], ["Deposit Paid", "credit", -51000],
  ["Room 020", "debit", 22500], ["Service Charge (10%)", "debit", 2250], ["VAT (7.5%)", "debit", 1856.25], ["Deposit Paid", "credit", -33750],
  ["Room 025", "debit", 34000], ["Service Charge (10%)", "debit", 3400], ["VAT (7.5%)", "debit", 2805], ["Deposit Paid", "credit", -51000],
  ["Room 041", "debit", 34000], ["Service Charge (10%)", "debit", 3400], ["VAT (7.5%)", "debit", 2805], ["Deposit Paid", "credit", -51000],
  ["Room 042", "debit", 34000], ["Service Charge (10%)", "debit", 3400], ["VAT (7.5%)", "debit", 2805], ["Deposit Paid", "credit", -51000],
  ["Suite 050 × 13 nights", "debit", 1950000], ["Service Charge (10%)", "debit", 195000], ["VAT (7.5%)", "debit", 160875], ["Deposit Paid", "credit", -2250000],
];

export const folioLines: FolioLine[] = folioLineSeed.map(([description, type, amount], i) => ({
  folioId: `folio-${String(Math.floor(i / 4) + 1).padStart(3, "0")}`,
  type,
  description,
  amount,
}));

export const outlets: Outlet[] = [
  { id: "outlet-rest", name: "Palm Restaurant", code: "REST", type: "restaurant", status: "active" },
  { id: "outlet-bar", name: "Poolside Bar", code: "BAR", type: "bar", status: "active" },
  { id: "outlet-room", name: "Room Service", code: "ROOM", type: "room_service", status: "active" },
];

export const menuCategories: MenuCategory[] = [
  { id: "cat-1", name: "Nigerian Mains", outletId: "outlet-rest" },
  { id: "cat-2", name: "Continental", outletId: "outlet-rest" },
  { id: "cat-3", name: "Snacks", outletId: "outlet-rest" },
  { id: "cat-4", name: "Breakfast", outletId: "outlet-rest" },
  { id: "cat-5", name: "Beverages", outletId: "outlet-rest" },
  { id: "cat-6", name: "Desserts", outletId: "outlet-rest" },
  { id: "cat-7", name: "Wine & Spirits", outletId: "outlet-rest" },
];

type ItemSeed = [string, string, number];
const itemSeed: Array<[string, string, ItemSeed[]]> = [
  ["cat-1", "Nigerian Mains", [["item-JOL-RIC", "Jollof Rice & Chicken", 4500], ["item-PEP-GMT", "Pepper Soup (Goat Meat)", 5500], ["item-SUY-PLT", "Suya Platter", 6000], ["item-EGU-PY", "Egusi Soup & Pounded Yam", 4000], ["item-FRI-RIC", "Fried Rice & Plantain", 3500], ["item-BAN-STR", "Banga Soup & Starch", 4500]]],
  ["cat-2", "Continental", [["item-GRA-TIL", "Grilled Tilapia", 7000], ["item-STE-CHI", "Steak & Chips", 8500], ["item-CAE-SAL", "Caesar Salad", 3500]]],
  ["cat-3", "Snacks", [["item-PUF-SAU", "Puff Puff & Sauce", 1500], ["item-MOI-MOI", "Moi Moi", 1200], ["item-SPR-ROL", "Spring Rolls (6 pcs)", 2000]]],
  ["cat-4", "Breakfast", [["item-FUL-BRK", "Full English Breakfast", 5000], ["item-NIG-BRK", "Nigerian Breakfast (Yam & Eggs)", 3500], ["item-FRU-PLT", "Fresh Fruit Platter", 2500]]],
  ["cat-5", "Beverages", [["item-CHA-COK", "Chapman Cocktail", 2000], ["item-PNA-JCE", "Fresh Pineapple Juice", 1500], ["item-ZOB-DRK", "Zobo Drink", 1000], ["item-STA-LAG", "Star Lager (Bottle)", 1500], ["item-GUI-STO", "Guinness Stout (Bottle)", 1500]]],
  ["cat-6", "Desserts", [["item-PAW-ICE", "Pawpaw Ice Cream", 2000], ["item-CHN-PLT", "Chin Chin Platter", 1500]]],
  ["cat-7", "Wine & Spirits", [["item-HSE-RED", "House Red Wine", 8000], ["item-HSE-WHT", "House White Wine", 8000], ["item-HEN-XO", "Hennessy XO", 45000], ["item-CHI-12", "Chivas Regal 12", 25000], ["item-HEI-BOT", "Heineken (Bottle)", 1200]]],
];

export const menuItems: MenuItem[] = itemSeed.flatMap(([categoryId]) =>
  itemSeed.find(([c]) => c === categoryId)![2].map(([id, name, price]) => ({
    id,
    categoryId,
    name,
    code: id.replace("item-", ""),
    price,
    isAvailable: true,
    preparationTime: 15,
  })),
);

type OrderSeed = [string, string, number, number, number, "paid" | "pending"];
const orderSeed: OrderSeed[] = [
  ["pos-order-001", "outlet-rest", 9500, 712.5, 10212.5, "paid"],
  ["pos-order-002", "outlet-bar", 14500, 1087.5, 15587.5, "paid"],
  ["pos-order-003", "outlet-rest", 12000, 900, 12900, "paid"],
  ["pos-order-004", "outlet-room", 53000, 3975, 56975, "paid"],
  ["pos-order-005", "outlet-rest", 7500, 562.5, 8062.5, "paid"],
  ["pos-order-006", "outlet-room", 8500, 637.5, 9137.5, "pending"],
];

export const posOrders: PosOrder[] = orderSeed.map(([id, outletId, subtotal, tax, total, pay], i) => ({
  id,
  outletId,
  orderNumber: `ORD-${String(i + 1).padStart(4, "0")}`,
  status: "open" as const,
  subtotal,
  taxAmount: tax,
  discountAmount: 0,
  total,
  paymentStatus: pay,
  createdAt: "2026-09-05 13:23:28",
}));

type LineSeed = [string, string, number, number];
const lineSeed: LineSeed[] = [
  ["pos-order-001", "item-JOL-RIC", 1, 4500], ["pos-order-001", "item-CHA-COK", 2, 2000],
  ["pos-order-002", "item-SUY-PLT", 1, 6000], ["pos-order-002", "item-HEI-BOT", 3, 1200], ["pos-order-002", "item-PUF-SAU", 1, 1500],
  ["pos-order-003", "item-GRA-TIL", 1, 7000], ["pos-order-003", "item-PNA-JCE", 2, 1500], ["pos-order-003", "item-PAW-ICE", 1, 2000],
  ["pos-order-004", "item-STE-CHI", 1, 8500], ["pos-order-004", "item-HEN-XO", 1, 45000],
  ["pos-order-005", "item-EGU-PY", 1, 4000], ["pos-order-005", "item-STA-LAG", 2, 1500],
  ["pos-order-006", "item-FUL-BRK", 1, 5000], ["pos-order-006", "item-FRU-PLT", 1, 2500], ["pos-order-006", "item-ZOB-DRK", 1, 1000],
];

export const posOrderLines: PosOrderLine[] = lineSeed.map(([orderId, menuItemId, quantity, unitPrice]) => ({
  orderId,
  menuItemId,
  quantity,
  unitPrice,
  amount: quantity * unitPrice,
  status: "completed" as const,
}));

export const housekeepingTasks: HousekeepingTask[] = [
  ["hk-001", "room-011", "Daily Cleaning", "normal"], ["hk-002", "room-012", "Daily Cleaning", "normal"],
  ["hk-003", "room-013", "Daily Cleaning", "normal"], ["hk-004", "room-014", "Daily Cleaning", "normal"],
  ["hk-005", "room-016", "Daily Cleaning", "normal"], ["hk-006", "room-017", "Daily Cleaning", "normal"],
  ["hk-007", "room-018", "Daily Cleaning", "normal"], ["hk-008", "room-019", "Daily Cleaning", "normal"],
  ["hk-009", "room-021", "Deep Cleaning", "high"], ["hk-010", "room-022", "Checkout Cleaning", "urgent"],
  ["hk-011", "room-023", "Daily Cleaning", "normal"], ["hk-012", "room-024", "Inspection Required", "high"],
  ["hk-013", "room-044", "Maintenance + Cleaning", "urgent"],
].map(([id, roomId, taskType, priority]) => ({
  id: id as string,
  roomId: roomId as string,
  taskType: taskType as string,
  priority: priority as HousekeepingTask["priority"],
  status: "pending" as const,
  assignedTo: null,
}));

export const departments: Department[] = [
  { id: "dept-front", name: "Front Office", code: "FO" },
  { id: "dept-house", name: "Housekeeping", code: "HK" },
  { id: "dept-food", name: "Food & Beverage", code: "FNB" },
  { id: "dept-kitchen", name: "Kitchen", code: "KIT" },
  { id: "dept-bar", name: "Bar & Lounge", code: "BAR" },
  { id: "dept-spa", name: "Spa & Wellness", code: "SPA" },
  { id: "dept-acc", name: "Accounts & Finance", code: "ACC" },
  { id: "dept-hr", name: "Human Resources", code: "HR" },
  { id: "dept-eng", name: "Engineering & Maintenance", code: "ENG" },
  { id: "dept-store", name: "Stores & Procurement", code: "STR" },
  { id: "dept-sales", name: "Sales & Marketing", code: "SMK" },
  { id: "dept-security", name: "Security", code: "SEC" },
  { id: "dept-ict", name: "ICT & Systems", code: "ICT" },
  { id: "dept-events", name: "Events & Banqueting", code: "EVT" },
];

type EmpSeed = [string, string, string, string, string, number];
const empSeed: EmpSeed[] = [
  ["EMP-001", "Chidi", "Amadi", "dept-front", "Front Desk Manager", 350000],
  ["EMP-002", "Blessing", "Effiong", "dept-front", "Receptionist", 150000],
  ["EMP-003", "Tunde", "Bakare", "dept-food", "Restaurant Manager", 300000],
  ["EMP-004", "Adaeze", "Igwe", "dept-food", "Head Chef", 280000],
  ["EMP-005", "Kunle", "Ogundele", "dept-food", "Waiter", 120000],
  ["EMP-006", "Funmi", "Adeyinka", "dept-bar", "Bartender", 120000],
  ["EMP-007", "Ibrahim", "Suleiman", "dept-house", "Executive Housekeeper", 280000],
  ["EMP-008", "Ngozi", "Okafor", "dept-house", "Room Attendant", 100000],
  ["EMP-009", "Emeka", "Chukwu", "dept-eng", "Chief Engineer", 320000],
  ["EMP-010", "Yusuf", "Abdullahi", "dept-eng", "Maintenance Technician", 150000],
  ["EMP-011", "Halima", "Bello", "dept-acc", "Finance Manager", 400000],
  ["EMP-012", "Olumide", "Sanusi", "dept-acc", "Accountant", 200000],
  ["EMP-013", "Sade", "Ogunlesi", "dept-hr", "HR Manager", 350000],
  ["EMP-014", "Babatunde", "Raji", "dept-security", "Security Chief", 180000],
  ["EMP-015", "Chidinma", "Ike", "dept-sales", "General Manager", 600000],
];

export const employees: Employee[] = empSeed.map(([num, firstName, lastName, departmentId, position, salary], i) => ({
  id: `emp-${num}`,
  employeeNumber: num,
  firstName,
  lastName,
  email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@grandpalmlagos.com`,
  phone: `+234-80${i}-000-${1000 + i}`,
  departmentId,
  position,
  salary,
  status: "active" as const,
}));

const glSeed: Array<Omit<GlAccount, "id">> = [
  { accountCode: "1000", accountName: "Cash on Hand", accountClass: "asset", accountType: "current_asset" },
  { accountCode: "1010", accountName: "Bank — GTBank Current", accountClass: "asset", accountType: "current_asset" },
  { accountCode: "1100", accountName: "Guest Ledger Receivable", accountClass: "asset", accountType: "current_asset" },
  { accountCode: "1110", accountName: "City Ledger Receivable", accountClass: "asset", accountType: "current_asset" },
  { accountCode: "1200", accountName: "Advance Deposits", accountClass: "liability", accountType: "current_liability" },
  { accountCode: "1300", accountName: "Inventory — F&B", accountClass: "asset", accountType: "current_asset" },
  { accountCode: "1400", accountName: "Furniture & Equipment", accountClass: "asset", accountType: "fixed_asset" },
  { accountCode: "1500", accountName: "Accumulated Depreciation", accountClass: "asset", accountType: "fixed_asset" },
  { accountCode: "2000", accountName: "Accounts Payable", accountClass: "liability", accountType: "current_liability" },
  { accountCode: "2100", accountName: "VAT Payable", accountClass: "liability", accountType: "current_liability" },
  { accountCode: "2200", accountName: "Accrued Payroll", accountClass: "liability", accountType: "current_liability" },
  { accountCode: "3000", accountName: "Share Capital", accountClass: "equity", accountType: "equity" },
  { accountCode: "3100", accountName: "Retained Earnings", accountClass: "equity", accountType: "equity" },
  { accountCode: "4000", accountName: "Room Revenue", accountClass: "revenue", accountType: "operating_revenue" },
  { accountCode: "4100", accountName: "F&B Revenue", accountClass: "revenue", accountType: "operating_revenue" },
  { accountCode: "4200", accountName: "Other Operated Dept Revenue", accountClass: "revenue", accountType: "operating_revenue" },
  { accountCode: "5000", accountName: "Rooms Payroll & Related", accountClass: "expense", accountType: "operating_expense" },
  { accountCode: "5100", accountName: "F&B Cost of Sales", accountClass: "expense", accountType: "cost_of_sales" },
  { accountCode: "5200", accountName: "Utilities", accountClass: "expense", accountType: "operating_expense" },
  { accountCode: "5300", accountName: "Repairs & Maintenance", accountClass: "expense", accountType: "operating_expense" },
  { accountCode: "5400", accountName: "Marketing & Distribution", accountClass: "expense", accountType: "operating_expense" },
  { accountCode: "5900", accountName: "Management Fees", accountClass: "expense", accountType: "operating_expense" },
];

export const glAccounts: GlAccount[] = glSeed.map((a, i) => ({ id: `gl-${a.accountCode}-${i}`, ...a }));

const journalDescriptions = [
  "Daily room revenue accrual — business date 2026-09-05",
  "POS Z-report close — Palm Restaurant shift 2",
  "Guest ledger cash receipt batch — front desk",
  "F&B cost of goods sold — kitchen stores issue",
  "Utilities accrual — September power & diesel",
  "Payroll journal — August salaries (15 staff)",
  "Advance deposit received — group block CN-021…025",
  "Night audit revenue rollup — 2026-09-04",
];

export const journalEntries: JournalEntry[] = journalDescriptions.map((description, i) => ({
  id: `je-${String(i + 1).padStart(3, "0")}`,
  entryNumber: `JE-2026-0${String(i + 1).padStart(4, "0")}`,
  entryDate: `2026-09-0${(i % 5) + 1}`,
  description,
  status: i < 6 ? "posted" : "draft",
}));

export const cashierShifts: CashierShift[] = [
  { id: "cs-001", shiftNumber: "AM-1", openingFloat: 50000, closingFloat: 212300, totalSales: 162300, totalRefunds: 0, status: "closed" },
  { id: "cs-002", shiftNumber: "PM-1", openingFloat: 50000, closingFloat: null, totalSales: 95400, totalRefunds: 5000, status: "open" },
];

export const loyaltyTiers: LoyaltyTier[] = [
  { id: "tier-member", name: "Member", code: "MEMBER", minPoints: 0, discountPercent: 5, benefits: "Welcome drink, 5% F&B discount", status: "active" },
  { id: "tier-silver", name: "Silver", code: "SILVER", minPoints: 5000, discountPercent: 10, benefits: "Late checkout, 10% discount, room upgrade", status: "active" },
  { id: "tier-gold", name: "Gold", code: "GOLD", minPoints: 15000, discountPercent: 15, benefits: "Free breakfast, 15% discount, priority booking", status: "active" },
  { id: "tier-platinum", name: "Platinum", code: "PLATINUM", minPoints: 30000, discountPercent: 20, benefits: "Suite upgrade, spa credit, airport transfer", status: "active" },
  { id: "tier-vip", name: "VIP", code: "VIP", minPoints: 50000, discountPercent: 25, benefits: "Personal concierge, complimentary minibar, VIP lounge", status: "active" },
];

export const paymentMethods: PaymentMethod[] = [
  { name: "Cash", code: "CASH", type: "cash", isActive: true },
  { name: "POS Card Terminal", code: "POS", type: "card", isActive: true },
  { name: "Bank Transfer / USSD", code: "USSD", type: "transfer", isActive: true },
  { name: "Paystack", code: "PAYSK", type: "online", isActive: true },
  { name: "Flutterwave", code: "FLW", type: "online", isActive: true },
  { name: "OPay", code: "OPAY", type: "mobile", isActive: true },
  { name: "Room Charge / Credit", code: "CREDIT", type: "credit", isActive: true },
  { name: "Complimentary", code: "COMP", type: "complimentary", isActive: true },
];

export const channels: Channel[] = [
  { id: "ch-booking", name: "Booking.com", code: "BDC", type: "ota", status: "connected", lastSyncAt: "2026-09-05T13:00:00Z" },
  { id: "ch-expedia", name: "Expedia", code: "EXP", type: "ota", status: "connected", lastSyncAt: "2026-09-05T12:30:00Z" },
  { id: "ch-jovago", name: "Jovago", code: "JVG", type: "ota", status: "error", lastSyncAt: "2026-09-04T22:10:00Z" },
  { id: "ch-amadeus", name: "Amadeus GDS", code: "AMA", type: "gds", status: "disconnected", lastSyncAt: null },
];

export const hardwareDevices: HardwareDevice[] = [
  { id: "dev-lock-01", deviceType: "door_lock", vendor: "Oracode", model: "Oracode 660", serialNumber: "LK-660-00121", location: "Front Desk — Encoder 1", status: "online", lastHealthCheck: "2026-09-05T13:30:00Z" },
  { id: "dev-print-01", deviceType: "printer", vendor: "Epson", model: "TM-T88VII", serialNumber: "PR-T88-44310", location: "Front Desk — Folio Printer", status: "online", lastHealthCheck: "2026-09-05T13:29:41Z" },
  { id: "dev-print-02", deviceType: "printer", vendor: "Epson", model: "TM-M30III", serialNumber: "PR-M30-11208", location: "Kitchen — KOT Station", status: "error", lastHealthCheck: "2026-09-05T11:58:12Z" },
  { id: "dev-term-01", deviceType: "pos_terminal", vendor: "Moniepoint", model: "M10", serialNumber: "MP-M10-77342", location: "Front Desk — Cashier", status: "online", lastHealthCheck: "2026-09-05T13:31:02Z" },
  { id: "dev-kds-01", deviceType: "kds", vendor: "INFINEON", model: "KDS-27", serialNumber: "KDS-2700013", location: "Kitchen Line — Hot", status: "online", lastHealthCheck: "2026-09-05T13:28:55Z" },
  { id: "dev-bio-01", deviceType: "biometric", vendor: "ZKTeco", model: "SpeedFace-V5L", serialNumber: "ZK-V5L-00918", location: "Staff Entrance", status: "offline", lastHealthCheck: "2026-09-05T08:02:33Z" },
  { id: "dev-iptv-01", deviceType: "iptv", vendor: "Samsung", model: "HG55AT690", serialNumber: "TV-HG55-00261", location: "Room 041 — Presidential Wing", status: "online", lastHealthCheck: "2026-09-05T13:15:00Z" },
];

export const inventoryProducts: InventoryProduct[] = [
  { id: "p-1", sku: "BEV-001", name: "Heineken Beer 60cl", category: "Beverages", unit: "bottle", costPrice: 900, reorderLevel: 48 },
  { id: "p-2", sku: "BEV-002", name: "Coca-Cola 35cl", category: "Beverages", unit: "bottle", costPrice: 250, reorderLevel: 96 },
  { id: "p-3", sku: "BEV-003", name: "Fresh Orange Juice", category: "Beverages", unit: "litre", costPrice: 1200, reorderLevel: 20 },
  { id: "p-4", sku: "BEV-005", name: "Hennessy VS", category: "Beverages", unit: "bottle", costPrice: 42000, reorderLevel: 6 },
  { id: "p-5", sku: "FOOD-001", name: "Chicken (Whole)", category: "Food", unit: "kg", costPrice: 4200, reorderLevel: 25 },
  { id: "p-6", sku: "FOOD-002", name: "Long Grain Rice", category: "Food", unit: "kg", costPrice: 1450, reorderLevel: 50 },
  { id: "p-7", sku: "FOOD-003", name: "Fresh Tilapia", category: "Food", unit: "kg", costPrice: 5200, reorderLevel: 12 },
  { id: "p-8", sku: "FOOD-004", name: "Goat Meat", category: "Food", unit: "kg", costPrice: 4800, reorderLevel: 15 },
  { id: "p-9", sku: "FOOD-005", name: "Beef Sirloin", category: "Food", unit: "kg", costPrice: 6500, reorderLevel: 15 },
  { id: "p-10", sku: "FOOD-010", name: "Cooking Oil (5L)", category: "Food", unit: "jerrican", costPrice: 12500, reorderLevel: 8 },
  { id: "p-11", sku: "HK-001", name: "Disinfectant 5L", category: "Housekeeping", unit: "bottle", costPrice: 3800, reorderLevel: 15 },
  { id: "p-12", sku: "HK-002", name: "Bath Towels (White)", category: "Housekeeping", unit: "piece", costPrice: 3200, reorderLevel: 60 },
  { id: "p-13", sku: "HK-004", name: "Guest Amenities Kit", category: "Housekeeping", unit: "piece", costPrice: 650, reorderLevel: 200 },
  { id: "p-14", sku: "PROP-002", name: "Diesel (AGO)", category: "Property", unit: "litre", costPrice: 1100, reorderLevel: 400 },
  { id: "p-15", sku: "PROP-003", name: "Water Treatment Chemical", category: "Property", unit: "litre", costPrice: 3600, reorderLevel: 10 },
];

export const stores: Store[] = [
  { id: "store-main", name: "Main Store", type: "main" },
  { id: "store-kitchen", name: "Kitchen Store", type: "kitchen" },
  { id: "store-bar", name: "Bar Store", type: "bar" },
  { id: "store-hk", name: "Housekeeping Store", type: "housekeeping" },
];

const stockSeed: Array<[string, string, number]> = [
  ["store-main", "p-1", 96], ["store-bar", "p-1", 42], ["store-main", "p-2", 180], ["store-bar", "p-2", 55],
  ["store-kitchen", "p-3", 12], ["store-main", "p-4", 4], ["store-bar", "p-4", 2],
  ["store-main", "p-5", 40], ["store-kitchen", "p-5", 14], ["store-main", "p-6", 120], ["store-kitchen", "p-6", 35],
  ["store-kitchen", "p-7", 6], ["store-kitchen", "p-8", 9], ["store-kitchen", "p-9", 11],
  ["store-kitchen", "p-10", 5], ["store-hk", "p-11", 9], ["store-hk", "p-12", 84],
  ["store-hk", "p-13", 150], ["store-main", "p-14", 320], ["store-main", "p-15", 4],
];

export const stockLevels: StockLevel[] = stockSeed.map(([storeId, productId, quantity]) => ({ storeId, productId, quantity }));

export const suppliers: Supplier[] = [
  { id: "sup-1", name: "Nigerian Breweries PLC", contactPerson: "Sales Department", email: "orders@nbplc.com", phone: "+234-1-271-2515", paymentTerms: "Net 30" },
  { id: "sup-2", name: "Chi Limited", contactPerson: "Trade Sales", email: "orders@chilimited.com", phone: "+234-1-461-0500", paymentTerms: "Net 30" },
  { id: "sup-3", name: "Makoko Fresh Fish Market", contactPerson: "Musa Danjuma", email: "musa@makokofresh.ng", phone: "+234-802-345-6789", paymentTerms: "Cash on Delivery" },
  { id: "sup-4", name: "Julius Berger Facilities", contactPerson: "Projects Desk", email: "services@jberger.com", phone: "+234-1-280-0100", paymentTerms: "Net 60" },
  { id: "sup-5", name: "CleanPro Supplies Ltd", contactPerson: "Grace Adamu", email: "grace@cleanpro.ng", phone: "+234-803-456-7890", paymentTerms: "Net 30" },
];

export const purchaseOrders: PurchaseOrder[] = [
  { id: "po-001", poNumber: "PO-2026-0011", supplierId: "sup-1", orderDate: "2026-09-01", status: "received", total: 486000 },
  { id: "po-002", poNumber: "PO-2026-0012", supplierId: "sup-3", orderDate: "2026-09-03", status: "approved", total: 172400 },
  { id: "po-003", poNumber: "PO-2026-0013", supplierId: "sup-5", orderDate: "2026-09-04", status: "pending_approval", total: 96500 },
  { id: "po-004", poNumber: "PO-2026-0014", supplierId: "sup-2", orderDate: "2026-09-05", status: "draft", total: 154000 },
  { id: "po-005", poNumber: "PO-2026-0015", supplierId: "sup-1", orderDate: "2026-09-05", status: "approved", total: 89750 },
];

export const venues: Venue[] = [
  { id: "venue-1", name: "Grand Ballroom", capacity: 400, hourlyRate: 450000, status: "available" },
  { id: "venue-2", name: "Palm Conference Room A", capacity: 60, hourlyRate: 90000, status: "available" },
  { id: "venue-3", name: "Palm Conference Room B", capacity: 40, hourlyRate: 70000, status: "available" },
  { id: "venue-4", name: "Poolside Terrace", capacity: 150, hourlyRate: 200000, status: "maintenance" },
  { id: "venue-5", name: "Boardroom", capacity: 16, hourlyRate: 50000, status: "available" },
];

type EvtSeed = [string, string, string, string, string, string, string, number, string, number, EventBooking["status"]];
const evtSeed: EvtSeed[] = [
  ["evt-001", "NNPC Q3 Strategy Retreat", "conference", "NNPC", "venue-1", "2026-09-08", "09:00", 180, "Conference Package A", 2700000, "confirmed"],
  ["evt-002", "Okonkwo & Adeyemi Wedding", "wedding", "Okonkwo Family", "venue-4", "2026-09-12", "16:00", 320, "Wedding Platinum", 6500000, "confirmed"],
  ["evt-003", "GTBank Product Launch", "corporate", "GTBank", "venue-2", "2026-09-15", "11:00", 55, "Corporate Half-Day", 850000, "tentative"],
  ["evt-004", "Andela Dev Meetup", "meetup", "Andela", "venue-5", "2026-09-18", "17:30", 16, "Boardroom Evening", 180000, "inquiry"],
  ["evt-005", "Shell HSE Training Week", "training", "Shell Nigeria", "venue-3", "2026-09-21", "08:30", 38, "Training Room Weekly", 1900000, "confirmed"],
  ["evt-006", "MultiChoice Dealer Forum", "banquet", "MultiChoice", "venue-1", "2026-09-27", "18:00", 250, "Gala Dinner", 4200000, "tentative"],
];

export const eventBookings: EventBooking[] = evtSeed.map(([id, name, eventType, clientName, venueId, date, start, guests, pkg, amount, status]) => ({
  id,
  name,
  eventType,
  clientName,
  venueId,
  eventDate: date,
  startTime: start,
  endTime: "22:00",
  guestCount: guests,
  packageName: pkg,
  totalAmount: amount,
  status,
}));

export const users: User[] = [
  { id: "usr-admin", name: "System Administrator", email: "admin@infineon.com", role: "admin", status: "active" },
  { id: "usr-gm", name: "Oluwaseun Adeyemi", email: "gm@infineon.com", role: "general_manager", status: "active" },
  { id: "usr-reception", name: "Chioma Okoro", email: "receptionist@infineon.com", role: "front_desk", status: "active" },
  { id: "usr-cashier", name: "Emeka Nwosu", email: "cashier@infineon.com", role: "cashier", status: "active" },
  { id: "usr-housekeep", name: "Fatima Bello", email: "housekeeping@infineon.com", role: "housekeeping", status: "active" },
  { id: "usr-kitchen", name: "Ibrahim Tanko", email: "kitchen@infineon.com", role: "fnb", status: "active" },
  { id: "usr-account", name: "Aisha Abdullahi", email: "accountant@infineon.com", role: "accountant", status: "active" },
  { id: "usr-hr", name: "Blessing Eze", email: "hr@infineon.com", role: "hr", status: "active" },
];

export const auditLog: AuditLogEntry[] = [
  { id: "log-1", userId: "usr-reception", userName: "Chioma Okoro", module: "lodging/front-desk", action: "check_in", entityId: "res-007", createdAt: "2026-09-05T09:14:00Z" },
  { id: "log-2", userId: "usr-cashier", userName: "Emeka Nwosu", module: "fin/cash-banking", action: "folio_payment", entityId: "folio-004", createdAt: "2026-09-05T09:41:00Z" },
  { id: "log-3", userId: "usr-admin", userName: "System Administrator", module: "plt/config-settings", action: "config_updated", entityId: "tax.vat_rate", createdAt: "2026-09-05T08:02:00Z" },
  { id: "log-4", userId: "usr-kitchen", userName: "Ibrahim Tanko", module: "fnb/pos", action: "order_closed", entityId: "pos-order-005", createdAt: "2026-09-05T12:58:00Z" },
  { id: "log-5", userId: "usr-housekeep", userName: "Fatima Bello", module: "lodging/housekeeping", action: "room_status_changed", entityId: "room-030", createdAt: "2026-09-05T13:05:00Z" },
  { id: "log-6", userId: "usr-gm", userName: "Oluwaseun Adeyemi", module: "plt/workflow-approvals", action: "approval_granted", entityId: "po-002", createdAt: "2026-09-05T10:22:00Z" },
];

export const systemSettings: Array<{ key: string; value: string; scope: string }> = [
  { key: "tax.vat_rate", value: "7.5", scope: "property" },
  { key: "tax.service_charge", value: "10", scope: "property" },
  { key: "folio.currency", value: "NGN", scope: "property" },
  { key: "front_desk.check_in_time", value: "14:00", scope: "property" },
  { key: "front_desk.check_out_time", value: "12:00", scope: "property" },
  { key: "night_audit.auto_run", value: "02:00", scope: "property" },
  { key: "channel.sync_interval_minutes", value: "15", scope: "system" },
  { key: "backup.full_schedule", value: "02:00", scope: "system" },
  { key: "backup.incremental_interval_hours", value: "4", scope: "system" },
  { key: "license.grace_days", value: "14", scope: "system" },
];
