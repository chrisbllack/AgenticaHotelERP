import { useState } from "react";
import type { Guest, GuestFlag } from "../types";
import { AlertOctagon, Crown, Gem, ShieldAlert } from "lucide-react";
import { cn } from "../lib/utils";

interface GuestFlagBadgeProps {
  flags?: GuestFlag[];
  blacklistReason?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  onEditClick?: () => void;
}

export default function GuestFlagBadge({
  flags,
  blacklistReason,
  className,
  size = "sm",
  onEditClick,
}: GuestFlagBadgeProps) {
  const [showBlacklistTooltip, setShowBlacklistTooltip] = useState(false);

  if (!flags || flags.length === 0) return null;

  const isSm = size === "sm";

  return (
    <div className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      {flags.includes("Blacklist") && (
        <div className="relative inline-flex items-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowBlacklistTooltip(!showBlacklistTooltip);
            }}
            onMouseEnter={() => setShowBlacklistTooltip(true)}
            onMouseLeave={() => setShowBlacklistTooltip(false)}
            className={cn(
              "inline-flex items-center gap-1 rounded-md font-bold tracking-wide transition-all shadow-sm",
              "border border-rose-500/80 bg-rose-950/90 text-rose-200 hover:bg-rose-900",
              isSm ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
            )}
          >
            <ShieldAlert size={isSm ? 12 : 14} className="text-rose-400 animate-pulse" />
            <span>BLACKLIST</span>
          </button>

          {showBlacklistTooltip && (
            <div className="absolute bottom-full left-0 z-50 mb-1.5 w-64 rounded-lg border border-rose-500/60 bg-brand-950 p-2.5 shadow-2xl text-left">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-300">
                <AlertOctagon size={13} />
                <span>Security & Finance Blacklist</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-brand-200">
                {blacklistReason || "Guest is flagged on hotel blacklist. Check-in prohibited without GM authorization."}
              </p>
              {onEditClick && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditClick();
                  }}
                  className="mt-2 text-[10px] text-rose-400 underline hover:text-rose-300"
                >
                  Edit guest profile flags
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {flags.includes("VIP") && (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md font-semibold tracking-wide border shadow-sm",
            "border-amber-400/50 bg-amber-500/20 text-amber-200",
            isSm ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
          )}
        >
          <Crown size={isSm ? 12 : 14} className="text-amber-400" />
          <span>VIP</span>
        </span>
      )}

      {flags.includes("High-Spend") && (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md font-semibold tracking-wide border shadow-sm",
            "border-emerald-400/50 bg-emerald-500/20 text-emerald-200",
            isSm ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
          )}
        >
          <Gem size={isSm ? 12 : 14} className="text-emerald-400" />
          <span>HIGH-SPEND</span>
        </span>
      )}
    </div>
  );
}

export function GuestBlacklistWarningBanner({ guest }: { guest: Guest | null | undefined }) {
  if (!guest || !guest.flags?.includes("Blacklist")) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-rose-500/60 bg-rose-950/70 p-3.5 text-rose-200 shadow-md">
      <ShieldAlert size={20} className="shrink-0 text-rose-400 mt-0.5" />
      <div className="text-xs">
        <p className="font-bold text-rose-100 uppercase tracking-wide">
          SECURITY ALERT: Guest is on Property Blacklist
        </p>
        <p className="mt-0.5 text-rose-200/90 leading-relaxed">
          {guest.blacklistReason || "Guest has active restrictions. General Manager or Security Director sign-off required before room assignment or key issuance."}
        </p>
      </div>
    </div>
  );
}
