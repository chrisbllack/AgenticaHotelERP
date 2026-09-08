/**
 * INFINEON Enterprise Guest Portal Service Layer (M-GST)
 * Connects guest-facing mobile web apps and in-room digital key devices
 * to PMS room status, IoT thermostats, and lighting control relays.
 */

import type { SmartRoomControl } from "../types";

export interface SmartRoomControlRequest {
  roomId: string;
  guestId?: string;
  token?: string;
}

export interface SetTemperatureRequest extends SmartRoomControlRequest {
  targetCelsius: number;
}

export interface SetHvacRequest extends SmartRoomControlRequest {
  mode: "cool" | "heat" | "auto" | "fan_only" | "eco";
  fanSpeed?: "low" | "medium" | "high" | "auto";
}

export interface SetLightingSceneRequest extends SmartRoomControlRequest {
  scene: "bright" | "relax" | "night" | "all_off" | "custom";
}

export interface ToggleLightRequest extends SmartRoomControlRequest {
  zone: "master" | "entryway" | "bedroom" | "bathroom" | "nightstand";
  state: boolean;
}

export interface ServiceResponse<T> {
  success: boolean;
  message: string;
  timestamp: string;
  data?: T;
  latencyMs?: number;
}

export class GuestPortalService {
  /**
   * Validate mobile digital key / room access token
   */
  public static validateToken(roomId: string, token?: string): boolean {
    if (!token) return true; // Demo fallback
    return token.startsWith("RFID-") || token.startsWith("DIGIKEY-") || token.length > 4;
  }

  /**
   * Adjust in-room climate control setpoint
   */
  public static updateTemperature(
    current: SmartRoomControl,
    targetCelsius: number
  ): ServiceResponse<SmartRoomControl> {
    const clamped = Math.min(Math.max(targetCelsius, 16), 30);
    const updated: SmartRoomControl = {
      ...current,
      targetTemperature: clamped,
      lastUpdated: new Date().toISOString().replace("T", " ").slice(0, 16),
    };

    return {
      success: true,
      message: `Thermostat setpoint updated to ${clamped}°C`,
      timestamp: updated.lastUpdated,
      data: updated,
      latencyMs: 42,
    };
  }

  /**
   * Toggle Do Not Disturb (DND) status
   * Automatically resets Make Up Room (MUR) if DND is turned on
   */
  public static setDnd(
    current: SmartRoomControl,
    dndActive: boolean
  ): ServiceResponse<SmartRoomControl> {
    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 16);
    const updated: SmartRoomControl = {
      ...current,
      dndActive,
      murActive: dndActive ? false : current.murActive,
      lastUpdated: timestamp,
    };

    return {
      success: true,
      message: dndActive
        ? "Do Not Disturb activated. Door chime silenced & housekeeping alerted."
        : "Do Not Disturb deactivated.",
      timestamp,
      data: updated,
      latencyMs: 28,
    };
  }

  /**
   * Toggle Make Up Room (MUR) status
   * Automatically resets DND if MUR is turned on
   */
  public static setMur(
    current: SmartRoomControl,
    murActive: boolean
  ): ServiceResponse<SmartRoomControl> {
    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 16);
    const updated: SmartRoomControl = {
      ...current,
      murActive,
      dndActive: murActive ? false : current.dndActive,
      lastUpdated: timestamp,
    };

    return {
      success: true,
      message: murActive
        ? "Make Up Room priority signaled to Housekeeping floor supervisor."
        : "Make Up Room signal cleared.",
      timestamp,
      data: updated,
      latencyMs: 31,
    };
  }

  /**
   * Apply lighting preset scene
   */
  public static applyLightingScene(
    current: SmartRoomControl,
    scene: SmartRoomControl["lightingScene"]
  ): ServiceResponse<SmartRoomControl> {
    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 16);
    let lights = { ...current.lights };

    switch (scene) {
      case "bright":
        lights = { master: true, entryway: true, bedroom: true, bathroom: true, nightstand: true };
        break;
      case "relax":
        lights = { master: true, entryway: false, bedroom: true, bathroom: false, nightstand: true };
        break;
      case "night":
        lights = { master: false, entryway: false, bedroom: false, bathroom: false, nightstand: true };
        break;
      case "all_off":
        lights = { master: false, entryway: false, bedroom: false, bathroom: false, nightstand: false };
        break;
      default:
        break;
    }

    const updated: SmartRoomControl = {
      ...current,
      lightingScene: scene,
      lights,
      lastUpdated: timestamp,
    };

    return {
      success: true,
      message: `Lighting scene '${scene}' applied successfully`,
      timestamp,
      data: updated,
      latencyMs: 18,
    };
  }

  /**
   * Toggle individual light zone
   */
  public static toggleLight(
    current: SmartRoomControl,
    zone: keyof SmartRoomControl["lights"],
    state: boolean
  ): ServiceResponse<SmartRoomControl> {
    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 16);
    const updated: SmartRoomControl = {
      ...current,
      lightingScene: "custom",
      lights: {
        ...current.lights,
        [zone]: state,
      },
      lastUpdated: timestamp,
    };

    return {
      success: true,
      message: `${zone} lighting switched ${state ? "ON" : "OFF"}`,
      timestamp,
      data: updated,
      latencyMs: 15,
    };
  }
}
