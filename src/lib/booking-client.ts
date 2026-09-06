// Client-side helpers for the integrated booking website (Convex-backed).

import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { naira } from "./utils";

export const CONVEX_URL = import.meta.env.VITE_CONVEX_URL as string | undefined;
export const BOOKING_ENABLED = Boolean(CONVEX_URL);

/** Format an integer-kobo amount as NGN. */
export const fmtKobo = (kobo: number, compact = false): string => naira(kobo / 100, compact);

/**
 * Ensures the backend has the seeded property (idempotent).
 * Queries cannot seed, so public pages call this before subscribing.
 */
export function useEnsureSeeded(enabled: boolean): { ready: boolean } {
  const ensureSeeded = useMutation(api.booking.ensureSeeded);
  const [ready, setReady] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (!enabled || started.current) return;
    started.current = true;
    let cancelled = false;
    ensureSeeded({})
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, ensureSeeded]);

  return { ready };
}
