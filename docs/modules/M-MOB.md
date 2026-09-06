# M-MOB — Mobile & Guest Apps

**Main Module Code:** M-MOB · **Tier:** ◐ Differentiator · **ADR:** [ADR-0006](../ADR/0006-ModuleHierarchy.md)
**Packages:** P021 (mobile applications & offline workflows), P010 (guest self-service hooks).

## Purpose
Put INFINEON in every pocket: staff apps that keep working through network
outages, and guest apps/self-service that reduce front-desk load — both built
on Flutter against the same versioned API contracts.

## Submodules

### `mob/staff-apps` — ◐ Differentiator
| Feature Set | Features |
|---|---|
| Housekeeping App | Room task lists · status updates with photos · minibar posting · lost & found capture · offline queue |
| Engineering App | Work-order inbox · asset scan & history · parts consumption · completion notes offline-first |
| Manager App | Approvals (PO, discounts, leave, rate overrides) · flash KPIs · shift handover · push alerts |
| F&B Apps | Waiter handheld ordering (M-FNB) · table & course timing · payment-at-table via terminal (M-PRC) |

### `mob/guest-app` — ◐ Differentiator
| Feature Set | Features |
|---|---|
| Booking & Stay | Direct booking (M-DST engine) · check-in online & digital reg card · mobile key (where locks support) · express checkout & folio view |
| In-Stay Services | Room service & outlet ordering · spa/amenity bookings (M-EVT) · chat & service requests · wake-up & housekeeping preferences |
| Personalization | Loyalty card & points · offer notifications (consent-gated via M-CRM) · multilingual UI |

### `mob/kiosks-portals` — ○ Premium
| Feature Set | Features |
|---|---|
| Kiosk | Lobby self check-in/out kiosk · key dispense integration (M-HDW) · payment terminal link |
| Portals | Owner portal (statement of account, performance of owned property) · corporate client portal (rate agreements, booking volume) |

## Platform Architecture
| Concern | Decision |
|---|---|
| Client | Flutter 3.x (Android + iOS), single codebase, per-role app flavors |
| API | Same `/api/v1` contracts; offline-first sync via sync WAL + client queue |
| Auth | Same JWT/Ed25519 identity (M-PLT); device registration & push tokens |
| Offline | SQLite on device; operation queue with idempotency keys; conflict rules match server policy |
| Push | Provider-neutral push adapter; in-app inbox fallback (M-PLT notifications) |

## Events Published
`mobile.device_registered` · `kiosk.session_completed` · `guest.service_requested`

## Consumed Contracts
All product modules via API contracts only (no direct DB) · M-PLT identity,
notifications, sync · M-HDW for key dispense & peripherals.

## Key Non-Functional Targets
Cold app start < 2 s · task action sync on reconnect in < 10 s ·
guest ordering round-trip < 3 s online, queued offline · 99% crash-free sessions.
