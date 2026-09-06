import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { guests as seedGuests, reservations as seedReservations, rooms as seedRooms, housekeepingTasks as seedTasks, posOrders as seedOrders, posOrderLines as seedOrderLines, guestStays as seedStays, folios as seedFolios, menuItems as seedMenuItems } from "../data/demo";
import type { Folio, FolioLine, Guest, GuestStay, HousekeepingTask, MenuItem, PosOrder, PosOrderLine, Reservation, Room, RoomStatus } from "../types";

export const VAT_RATE = 0.075;
export const SERVICE_CHARGE_RATE = 0.10;

export interface WalkInInput {
  firstName: string;
  lastName: string;
  phone: string;
  roomId: string;
  nights: number;
  rate: number;
}

interface PlatformState {
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
  createWalkIn: (input: WalkInInput) => Reservation;
  checkIn: (reservationId: string) => void;
  checkOut: (reservationId: string) => void;
  assignRoomToReservation: (reservationId: string, roomId: string) => void;
  completeTask: (taskId: string) => void;
  inspectTask: (taskId: string) => void;
  assignTask: (taskId: string, employeeId: string) => void;
  createOrder: (outletId: string, lines: PosOrderLine[]) => PosOrder;
  closeOrder: (orderId: string) => void;
  postCharge: (folioId: string, description: string, amount: number) => void;
  postPayment: (folioId: string, amount: number) => void;
}

const PlatformContext = createContext<PlatformState | null>(null);

let walkInSeq = 100;
let orderSeq = 100;

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [rooms, setRooms] = useState<Room[]>(seedRooms);
  const [guests, setGuests] = useState<Guest[]>(seedGuests);
  const [reservations, setReservations] = useState<Reservation[]>(seedReservations);
  const [stays, setStays] = useState<GuestStay[]>(seedStays);
  const [folios, setFolios] = useState<Folio[]>(seedFolios);
  const [folioLines, setFolioLines] = useState<FolioLine[]>([]);
  const [tasks, setTasks] = useState<HousekeepingTask[]>(seedTasks);
  const [orders, setOrders] = useState<PosOrder[]>(seedOrders);
  const [orderLines, setOrderLines] = useState<PosOrderLine[]>(seedOrderLines);
  const [menuItems] = useState<MenuItem[]>(seedMenuItems);

  const nextFolioNo = useMemo(
    () => `F-${String(folios.length + 1).padStart(4, "0")}`,
    [folios.length],
  );

  const createWalkIn = useCallback(
    (input: WalkInInput): Reservation => {
      walkInSeq += 1;
      const id = `res-w${walkInSeq}`;
      const reservation: Reservation = {
        id,
        confirmationNumber: `CN-${walkInSeq}`,
        guestId: "",
        roomTypeId: null,
        roomId: input.roomId,
        arrivalDate: "2026-09-05",
        departureDate: new Date(Date.parse("2026-09-05") + input.nights * 86400000).toISOString().slice(0, 10),
        nights: input.nights,
        adults: 1,
        children: 0,
        status: "confirmed",
        source: "Walk-in",
        totalEstimate: input.nights * input.rate,
        depositPaid: 0,
        isVip: false,
      };
      const guestId = `guest-w${walkInSeq}`;
      setGuests((prev) => [
        ...prev,
        { id: guestId, firstName: input.firstName, lastName: input.lastName, email: "", phone: input.phone, nationality: "", company: "" },
      ]);
      reservation.guestId = guestId;
      setReservations((prev) => [reservation, ...prev]);
      return reservation;
    },
    [],
  );

  const checkIn = useCallback((reservationId: string) => {
    setReservations((prev) => prev.map((r) => (r.id === reservationId ? { ...r, status: "checked_in" } : r)));
    setReservations((prev) => {
      const res = prev.find((r) => r.id === reservationId);
      if (!res || !res.roomId) return prev;
      const stayId = `stay-w${res.id}`;
      setStays((s) => {
        if (s.some((x) => x.reservationId === reservationId)) return s;
        const next: GuestStay = {
          id: stayId,
          reservationId,
          guestId: res.guestId,
          roomId: res.roomId!,
          expectedArrival: res.arrivalDate,
          expectedDeparture: res.departureDate,
          status: "active",
        };
        return [...s, next];
      });
      setFolios((f) => {
        if (f.some((x) => x.guestStayId === stayId)) return f;
        return [
          ...f,
          { id: `folio-${stayId}`, guestStayId: stayId, folioNumber: nextFolioNo, status: "open", balance: 0, currency: "NGN" },
        ];
      });
      setRooms((rs) => rs.map((rm) => (rm.id === res.roomId ? { ...rm, status: "occupied_clean" as RoomStatus } : rm)));
      return prev;
    });
  }, [nextFolioNo]);

  const checkOut = useCallback((reservationId: string) => {
    setReservations((prev) => prev.map((r) => (r.id === reservationId ? { ...r, status: "checked_out" } : r)));
    setStays((prev) => {
      const stay = prev.find((s) => s.reservationId === reservationId);
      if (!stay) return prev;
      setFolios((f) => f.map((fo) => (fo.guestStayId === stay.id ? { ...fo, status: "closed" as const } : fo)));
      setRooms((rs) => rs.map((rm) => (rm.id === stay.roomId ? { ...rm, status: "vacant_dirty" as RoomStatus, housekeepingStatus: "dirty" as const } : rm)));
      setTasks((ts) => {
        const roomId = stay.roomId;
        if (ts.some((t) => t.roomId === roomId && t.status === "pending")) return ts;
        return [
          ...ts,
          { id: `hk-w-${reservationId}`, roomId, taskType: "Checkout Cleaning", priority: "urgent" as const, status: "pending" as const, assignedTo: null },
        ];
      });
      return prev;
    });
  }, []);

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
        setRooms((rs) => rs.map((rm) => (rm.id === task.roomId ? { ...rm, housekeepingStatus: "clean", status: "vacant_clean" as RoomStatus } : rm)));
      }
      return prev.map((t) => (t.id === taskId ? { ...t, status: "inspected" } : t));
    });
  }, []);

  const assignTask = useCallback((taskId: string, employeeId: string) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, assignedTo: employeeId } : t)));
  }, []);

  const createOrder = useCallback(
    (outletId: string, lines: PosOrderLine[]): PosOrder => {
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
    },
    [],
  );

  const closeOrder = useCallback((orderId: string) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: "closed", paymentStatus: "paid" } : o)));
  }, []);

  const postCharge = useCallback((folioId: string, description: string, amount: number) => {
    setFolioLines((prev) => [...prev, { folioId, type: "debit", description, amount }]);
    setFolios((prev) => prev.map((f) => (f.id === folioId ? { ...f, balance: f.balance - amount } : f)));
  }, []);

  const postPayment = useCallback((folioId: string, amount: number) => {
    setFolioLines((prev) => [...prev, { folioId, type: "credit", description: "Payment received", amount: -amount }]);
    setFolios((prev) => prev.map((f) => (f.id === folioId ? { ...f, balance: f.balance + amount } : f)));
  }, []);

  const value = useMemo<PlatformState>(
    () => ({
      rooms, guests, reservations, stays, folios, folioLines, tasks, orders, orderLines, menuItems,
      createWalkIn, checkIn, checkOut, assignRoomToReservation, completeTask, inspectTask, assignTask, createOrder, closeOrder, postCharge, postPayment,
    }),
    [rooms, guests, reservations, stays, folios, folioLines, tasks, orders, orderLines, menuItems, createWalkIn, checkIn, checkOut, assignRoomToReservation, completeTask, inspectTask, assignTask, createOrder, closeOrder, postCharge, postPayment],
  );

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform(): PlatformState {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error("usePlatform must be used within PlatformProvider");
  return ctx;
}
