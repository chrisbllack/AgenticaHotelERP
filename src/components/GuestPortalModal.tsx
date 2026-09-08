import { useState } from "react";
import { usePlatform } from "../store/platform";
import { GuestPortalService } from "../services/guestPortalService";
import type { SmartRoomControl } from "../types";
import {
  BellOff,
  Flame,
  KeyRound,
  Lightbulb,
  Lock,
  Moon,
  Power,
  RotateCcw,
  Snowflake,
  Sparkles,
  Sun,
  X,
  Zap,
} from "lucide-react";
import { cn } from "../lib/utils";

interface GuestPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRoomId?: string;
}

export default function GuestPortalModal({
  isOpen,
  onClose,
  defaultRoomId = "room-101",
}: GuestPortalModalProps) {
  const { rooms, stays, smartRoomControls, updateSmartRoom, toggleRoomDnd, toggleRoomMur } =
    usePlatform();

  const [selectedRoomId, setSelectedRoomId] = useState<string>(defaultRoomId);
  const [activeTab, setActiveTab] = useState<"climate" | "lighting" | "privacy">("climate");
  const [feedbackMsg, setFeedbackMsg] = useState<string>("");

  if (!isOpen) return null;

  // Selected room data
  const currentControl: SmartRoomControl = smartRoomControls[selectedRoomId] || {
    roomId: selectedRoomId,
    roomNumber: selectedRoomId.replace("room-", ""),
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
    lastUpdated: "Just now",
  };

  const currentStay = stays.find((s) => s.roomId === selectedRoomId);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(""), 3000);
  };

  // Handlers using GuestPortalService
  const handleTempAdjust = (delta: number) => {
    const next = currentControl.targetTemperature + delta;
    const res = GuestPortalService.updateTemperature(currentControl, next);
    if (res.data) {
      updateSmartRoom(selectedRoomId, res.data);
      showFeedback(res.message);
    }
  };

  const handleHvacMode = (mode: SmartRoomControl["hvacMode"]) => {
    const updated = { ...currentControl, hvacMode: mode };
    updateSmartRoom(selectedRoomId, updated);
    showFeedback(`HVAC switched to ${mode.toUpperCase()} mode`);
  };

  const handleFanSpeed = (speed: SmartRoomControl["fanSpeed"]) => {
    const updated = { ...currentControl, fanSpeed: speed };
    updateSmartRoom(selectedRoomId, updated);
    showFeedback(`Fan speed set to ${speed.toUpperCase()}`);
  };

  const handleLightingScene = (scene: SmartRoomControl["lightingScene"]) => {
    const res = GuestPortalService.applyLightingScene(currentControl, scene);
    if (res.data) {
      updateSmartRoom(selectedRoomId, res.data);
      showFeedback(res.message);
    }
  };

  const handleToggleLight = (zone: keyof SmartRoomControl["lights"]) => {
    const res = GuestPortalService.toggleLight(
      currentControl,
      zone,
      !currentControl.lights[zone]
    );
    if (res.data) {
      updateSmartRoom(selectedRoomId, res.data);
      showFeedback(res.message);
    }
  };

  const handleToggleDnd = () => {
    const newDnd = toggleRoomDnd(selectedRoomId);
    showFeedback(
      newDnd
        ? "Do Not Disturb turned ON. Housekeeping & Door Chime silenced."
        : "Do Not Disturb turned OFF."
    );
  };

  const handleToggleMur = () => {
    const newMur = toggleRoomMur(selectedRoomId);
    showFeedback(
      newMur
        ? "Make Up Room priority sent to Housekeeping floor supervisor."
        : "Make Up Room priority cleared."
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] border-[6px] border-stone-800 bg-stone-950 shadow-2xl">
        {/* Mobile Phone Top Notch / Dynamic Island */}
        <div className="relative z-10 flex h-6 w-full items-center justify-center bg-stone-950 pt-2">
          <div className="h-4 w-28 rounded-full bg-stone-800" />
        </div>

        {/* Modal Close Button overlay */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-30 rounded-full bg-stone-800/80 p-1.5 text-stone-300 hover:bg-stone-700 hover:text-white"
        >
          <X size={16} />
        </button>

        {/* Phone Content Container */}
        <div className="max-h-[78vh] overflow-y-auto px-5 pb-6 pt-2 text-stone-100">
          {/* Header & Room Selector */}
          <div className="text-center pt-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-gold-500/20 px-3 py-1 text-[11px] font-semibold text-gold-300">
              <Sparkles size={12} />
              <span>Grand Palm Lagos · Guest Portal</span>
            </div>

            <div className="mt-2 flex items-center justify-center gap-2">
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="rounded-lg border border-stone-700 bg-stone-900 px-3 py-1 text-xs font-semibold text-stone-100 focus:border-gold-500 focus:outline-none"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    Room {r.number} ({r.roomTypeId.split("-")[0]})
                  </option>
                ))}
              </select>
            </div>

            <p className="mt-1 text-xs text-stone-400">
              Welcome, <span className="text-stone-200 font-medium">{currentStay?.guestName || "Chief Adebayo Alade"}</span>
            </p>
          </div>

          {/* Feedback Toast */}
          {feedbackMsg && (
            <div className="mt-3 rounded-lg border border-emerald-500/50 bg-emerald-950/80 p-2 text-center text-[11px] font-medium text-emerald-200 shadow animate-in fade-in">
              {feedbackMsg}
            </div>
          )}

          {/* Quick Privacy / DND Strip */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleToggleDnd}
              className={cn(
                "flex flex-col items-center justify-center rounded-2xl border p-3 transition-all",
                currentControl.dndActive
                  ? "border-rose-500/80 bg-rose-950/80 text-rose-200 shadow-md shadow-rose-900/30"
                  : "border-stone-800 bg-stone-900/70 text-stone-400 hover:border-stone-700"
              )}
            >
              <BellOff size={22} className={currentControl.dndActive ? "text-rose-400 animate-pulse" : ""} />
              <span className="mt-1.5 text-xs font-bold">Do Not Disturb</span>
              <span className="text-[10px] opacity-75">
                {currentControl.dndActive ? "ACTIVE (Silenced)" : "Off"}
              </span>
            </button>

            <button
              type="button"
              onClick={handleToggleMur}
              className={cn(
                "flex flex-col items-center justify-center rounded-2xl border p-3 transition-all",
                currentControl.murActive
                  ? "border-sky-500/80 bg-sky-950/80 text-sky-200 shadow-md shadow-sky-900/30"
                  : "border-stone-800 bg-stone-900/70 text-stone-400 hover:border-stone-700"
              )}
            >
              <Sparkles size={22} className={currentControl.murActive ? "text-sky-400" : ""} />
              <span className="mt-1.5 text-xs font-bold">Make Up Room</span>
              <span className="text-[10px] opacity-75">
                {currentControl.murActive ? "PRIORITY SIGNALED" : "Off"}
              </span>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="mt-4 flex rounded-xl border border-stone-800 bg-stone-900/60 p-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("climate")}
              className={cn(
                "flex-1 rounded-lg py-1.5 font-medium transition-all text-center",
                activeTab === "climate" ? "bg-stone-800 text-stone-100 shadow" : "text-stone-400 hover:text-stone-200"
              )}
            >
              Climate
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("lighting")}
              className={cn(
                "flex-1 rounded-lg py-1.5 font-medium transition-all text-center",
                activeTab === "lighting" ? "bg-stone-800 text-stone-100 shadow" : "text-stone-400 hover:text-stone-200"
              )}
            >
              Lighting
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("privacy")}
              className={cn(
                "flex-1 rounded-lg py-1.5 font-medium transition-all text-center",
                activeTab === "privacy" ? "bg-stone-800 text-stone-100 shadow" : "text-stone-400 hover:text-stone-200"
              )}
            >
              Key & Locks
            </button>
          </div>

          {/* TAB 1: CLIMATE & THERMOSTAT */}
          {activeTab === "climate" && (
            <div className="mt-4 space-y-4 animate-in fade-in">
              {/* Thermostat Dial Ring */}
              <div className="flex flex-col items-center justify-center rounded-3xl border border-stone-800 bg-stone-900/40 p-6">
                <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-4 border-sky-500/40 bg-stone-950 shadow-inner">
                  <div className="text-center">
                    <span className="text-4xl font-black text-white">
                      {currentControl.targetTemperature}°
                    </span>
                    <span className="block text-[10px] text-stone-400 font-medium tracking-wide">
                      AMBIENT: {currentControl.currentTemperature}°C
                    </span>
                  </div>
                </div>

                {/* Adjust buttons */}
                <div className="mt-4 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => handleTempAdjust(-1)}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-700 bg-stone-800 text-xl font-bold text-sky-400 hover:bg-stone-700 active:scale-95"
                  >
                    -
                  </button>
                  <span className="text-xs font-semibold text-stone-300">Set Temp</span>
                  <button
                    type="button"
                    onClick={() => handleTempAdjust(1)}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-700 bg-stone-800 text-xl font-bold text-amber-400 hover:bg-stone-700 active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* HVAC Mode */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                  Climate Mode
                </label>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {[
                    { id: "cool", label: "Cool", icon: Snowflake, color: "text-sky-400" },
                    { id: "heat", label: "Heat", icon: Flame, color: "text-amber-400" },
                    { id: "eco", label: "Eco", icon: Zap, color: "text-emerald-400" },
                    { id: "auto", label: "Auto", icon: RotateCcw, color: "text-indigo-400" },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = currentControl.hvacMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleHvacMode(m.id as SmartRoomControl["hvacMode"])}
                        className={cn(
                          "flex flex-col items-center justify-center rounded-xl border p-2 transition-all",
                          isSelected
                            ? "border-stone-500 bg-stone-800 text-white font-semibold shadow"
                            : "border-stone-800 bg-stone-900/40 text-stone-400 hover:border-stone-700"
                        )}
                      >
                        <Icon size={16} className={m.color} />
                        <span className="mt-1 text-[11px]">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fan Speed */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                  Fan Speed
                </label>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {(["low", "medium", "high", "auto"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleFanSpeed(s)}
                      className={cn(
                        "rounded-lg border py-1.5 text-center text-[11px] font-medium uppercase transition-all",
                        currentControl.fanSpeed === s
                          ? "border-sky-500/50 bg-sky-500/20 text-sky-200"
                          : "border-stone-800 bg-stone-900/30 text-stone-400 hover:border-stone-700"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIGHTING SETTINGS */}
          {activeTab === "lighting" && (
            <div className="mt-4 space-y-4 animate-in fade-in">
              {/* Presets */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                  Lighting Atmosphere Scenes
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: "bright", label: "Daylight Bright", icon: Sun },
                    { id: "relax", label: "Cozy Relax", icon: Sparkles },
                    { id: "night", label: "Night Glow", icon: Moon },
                    { id: "all_off", label: "All Lights Off", icon: Power },
                  ].map((s) => {
                    const Icon = s.icon;
                    const isSelected = currentControl.lightingScene === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleLightingScene(s.id as SmartRoomControl["lightingScene"])}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all",
                          isSelected
                            ? "border-amber-400/60 bg-amber-500/20 text-amber-200 font-semibold shadow"
                            : "border-stone-800 bg-stone-900/40 text-stone-400 hover:border-stone-700"
                        )}
                      >
                        <Icon size={16} className={isSelected ? "text-amber-300" : "text-stone-500"} />
                        <span className="text-[11px]">{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Individual Light Zones */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                  In-Room Light Zones
                </label>
                <div className="space-y-1.5">
                  {(
                    [
                      { key: "master", label: "Master Suite Overhead" },
                      { key: "bedroom", label: "Bed Headboard & Sconces" },
                      { key: "nightstand", label: "Reading Lamps" },
                      { key: "bathroom", label: "Vanity & Shower" },
                      { key: "entryway", label: "Entry Foyer" },
                    ] as const
                  ).map((zone) => {
                    const isOn = currentControl.lights[zone.key];
                    return (
                      <div
                        key={zone.key}
                        className="flex items-center justify-between rounded-xl border border-stone-800 bg-stone-900/40 p-2.5 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Lightbulb
                            size={16}
                            className={isOn ? "text-amber-400 drop-shadow" : "text-stone-600"}
                          />
                          <span className={isOn ? "text-stone-100 font-medium" : "text-stone-400"}>
                            {zone.label}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleLight(zone.key)}
                          className={cn(
                            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                            isOn ? "bg-amber-500" : "bg-stone-700"
                          )}
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                              isOn ? "translate-x-4" : "translate-x-0"
                            )}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: KEY & PRIVACY */}
          {activeTab === "privacy" && (
            <div className="mt-4 space-y-4 animate-in fade-in text-xs">
              <div className="rounded-2xl border border-stone-800 bg-stone-900/50 p-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <KeyRound size={26} />
                </div>
                <h4 className="mt-2 text-sm font-bold text-stone-100">Digital Mobile Key Active</h4>
                <p className="mt-0.5 text-[11px] text-stone-400">
                  Hold smartphone near room door lock RFID pad to unlock.
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-stone-700 bg-stone-950 px-2.5 py-1 font-mono text-[10px] text-stone-300">
                  <span>RFID-4A-82-FE-01</span>
                </div>
              </div>

              <div className="rounded-xl border border-stone-800 bg-stone-900/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock size={16} className="text-emerald-400" />
                    <span className="font-semibold text-stone-200">Electronic Deadbolt Status</span>
                  </div>
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    SECURED
                  </span>
                </div>
                <p className="text-[11px] text-stone-400">
                  Door deadbolt engaged. Automatically disengages upon phone NFC touch or authorized master keycard.
                </p>
              </div>
            </div>
          )}

          {/* Footer note */}
          <div className="mt-6 border-t border-stone-800/80 pt-3 text-center text-[10px] text-stone-500">
            Connected via Grand Palm In-Room IoT Mesh Gateway · Room {currentControl.roomNumber}
          </div>
        </div>

        {/* Mobile Phone Bottom Bar */}
        <div className="flex h-5 w-full items-center justify-center bg-stone-950 pb-2">
          <div className="h-1 w-28 rounded-full bg-stone-700" />
        </div>
      </div>
    </div>
  );
}
