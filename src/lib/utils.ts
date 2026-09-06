import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const naira = (n: number, compact = false): string =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: compact && Math.abs(n) >= 1000 ? 0 : 2,
    notation: compact && Math.abs(n) >= 1_000_000 ? "compact" : "standard",
  }).format(n);

export const num = (n: number): string => new Intl.NumberFormat("en-NG").format(n);

export const fmtDate = (iso: string): string => {
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });
};

export const fmtDateTime = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleString("en-NG", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

export const todayISO = "2026-09-05";

export type RoomStatusMeta = { label: string; short: string; chip: string; dot: string };

export const ROOM_STATUS: Record<string, RoomStatusMeta> = {
  occupied_clean: { label: "Occupied — Clean", short: "OC", chip: "bg-brand-600/25 text-brand-100 border-brand-400/40", dot: "bg-brand-300" },
  occupied_dirty: { label: "Occupied — Dirty", short: "OD", chip: "bg-amber-500/15 text-amber-200 border-amber-400/40", dot: "bg-amber-400" },
  vacant_clean: { label: "Vacant — Clean", short: "VC", chip: "bg-emerald-500/15 text-emerald-200 border-emerald-400/40", dot: "bg-emerald-400" },
  vacant_dirty: { label: "Vacant — Dirty", short: "VD", chip: "bg-stone-500/15 text-stone-300 border-stone-400/40", dot: "bg-stone-400" },
  reserved: { label: "Reserved", short: "RS", chip: "bg-sky-500/15 text-sky-200 border-sky-400/40", dot: "bg-sky-400" },
  out_of_order: { label: "Out of Order", short: "OO", chip: "bg-rose-500/15 text-rose-200 border-rose-400/40", dot: "bg-rose-400" },
  out_of_service: { label: "Out of Service", short: "OS", chip: "bg-rose-500/15 text-rose-200 border-rose-400/40", dot: "bg-rose-400" },
};

export const TASK_PRIORITY: Record<string, string> = {
  normal: "bg-brand-600/20 text-brand-100 border-brand-400/30",
  high: "bg-amber-500/15 text-amber-200 border-amber-400/40",
  urgent: "bg-rose-500/15 text-rose-200 border-rose-400/40",
};

export const initials = (first: string, last: string) => `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
