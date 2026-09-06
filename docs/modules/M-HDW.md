# M-HDW — Device Integration

**Main Module Code:** M-HDW · **Tier:** ● Core (operations-critical) · **ADR:** [ADR-0006](../ADR/0006-ModuleHierarchy.md),
[ADR-0004](../ADR/0004-HardwareAbstraction.md)
**Packages:** P019 (hardware framework & door locks), P021 (mobile peripherals).

## Purpose
Connect the hotel's physical estate — locks, printers, terminals, IPTV, PBX,
biometrics — through one vendor-neutral driver contract, so business modules
never touch vendor SDKs and devices can be swapped without code changes.

## Submodules

### `hdw/driver-sdk` — ● Core
| Feature Set | Features |
|---|---|
| Driver Contract | Vendor-neutral interface: Connect · Disconnect · Encode · Cancel · Status · Health · Diagnostics (ADR-0004) |
| Registry & Lifecycle | Driver registry with hot-config · per-device profiles · versioned driver packaging · capability negotiation |
| Simulation | Full simulator suite for every device class · chaos scripts (offline, partial failure) · CI hardware-farm hooks |

### `hdw/room-devices` — ● Core
| Feature Set | Features |
|---|---|
| Door Locks | Key card & mobile key encoding (check-in flow) · encoder health · lost-key cancellation · audit of encodes |
| IPTV | Welcome screen with guest name · folio view & express checkout · hotel info & messaging channel |
| PBX & Telephony | Name display on room phones · call posting to folio (metered pulses/tariffs) · wake-up call engine · emergency call traces |
| Room Automation | Thermostat & energy management links · in-room tablet concierge · occupancy sensors (privacy-preserving) |

### `hdw/pos-peripherals` — ● Core
| Feature Set | Features |
|---|---|
| Printing | Receipt & invoice printers (ESC/POS + A4) · KOT/KDS printers · label & wristband printers · print failover & reprint |
| Cash & Scan | Cash drawer kicks (register-aware) · barcode/QR scanners · customer-facing displays |
| Kitchen Displays | KDS screen pairing & health (M-FNB) · bump-bar handling |

### `hdw/network` — ◐ Differentiator
| Feature Set | Features |
|---|---|
| Health | Device gateway status & heartbeat · LAN topology health view · offline device alerts & last-seen |
| Fleet | Firmware inventory & update tracking · certificate expiry watch · per-device configuration history |

## Events Published
`device.registered|health_changed|offline` · `lock.encoded|cancelled` ·
`call.posted` · `print.failed`

## Consumed Contracts
Consumed by M-LOD (keys, wake-ups), M-FNB (printers/KDS), M-HR (biometrics),
M-PRC (terminals), M-BUS (telemetry). Consumes M-PLT config & audit only —
M-HDW is a leaf module: it depends on nothing product-level.

## Driver Addition Workflow
1. Implement the Driver contract against the vendor SDK in an adapter package.
2. Register capabilities in the driver manifest (device class, commands, diagnostics).
3. Add simulator support + integration tests (CI runs against simulator).
4. Ship driver config — **zero business-code changes** (verified by contract tests).

## Key Non-Functional Targets
Key encode < 1.5 s end-to-end · device heartbeat every 30 s ·
printer failover < 2 s to secondary · all device ops logged to immutable audit.
