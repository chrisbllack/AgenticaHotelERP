# M-LOD — Lodging & Guest Operations

**Main Module Code:** M-LOD · **Tier:** ● Core · **ADR:** [ADR-0006](../ADR/0006-ModuleHierarchy.md)
**Packages:** P008, P009, P010, P011 · **Owns the product's center of gravity.**

## Purpose
Operate the rooms business end to end: configure the property, price and sell
inventory, take and manage reservations, run the front desk, turn rooms around
with housekeeping, keep assets running, and close each business day with a
reconciled night audit.

## Submodules

### `lodging/property-config` — ● Core
| Feature Set | Features |
|---|---|
| Property Setup | Property profile & legal entity · operating calendar & business dates · timezone & locale per property |
| Room Taxonomy | Room types · bed types · connecting/suite structures · accessibility attributes |
| Attributes & Views | Room features (balcony, ocean view…) · amenity codes · floor/wing layout |
| Rate Scaffolding | Rate plan definitions · package scaffolding · season calendar seeding |

### `lodging/rooms` — ● Core
| Feature Set | Features |
|---|---|
| Room Inventory | Room CRUD with attributes · room diagrams · maintenance flags |
| Status Engine | Vacant clean/dirty · occupied · out-of-order (OOS) · out-of-service (OOO) · status history |
| Room Moves & Combines | Move guest between rooms · combine/split connecting rooms · suite derivation |

### `lodging/rates-availability` — ● Core
| Feature Set | Features |
|---|---|
| Rate Plans | Seasonal & day-of-week rates · length-of-stay pricing · package pricing · currency per plan |
| Availability Controls | Closed to arrival/departure · min/max stay · stop-sell · daily availability calendar |
| Yield & Overbooking | Occupancy-based yield rules · overbooking limits per room type · demand notes |

### `lodging/reservations` — ● Core
| Feature Set | Features |
|---|---|
| Reservation Lifecycle | Create → confirm → modify → cancel · multi-room reservations · share reservations · waitlist |
| Guarantees & Deposits | Guarantee types (card/corporate/advance) · deposit schedules & reminders · forfeiture rules |
| Groups & Blocks | Group blocks with rooming lists · block pickup tracking · cut-off dates · attrition |
| Policies | Cancellation & no-show policies · child/extra-bed rules · rate-change audit trail |

### `lodging/front-desk` — ● Core
| Feature Set | Features |
|---|---|
| Workspaces | Arrivals / In-house / Departures queues · expected & actual vs forecast |
| Check-in/out | ID scan & registration card · room & key assignment · group check-in · express checkout · folio settlement at departure |
| Folios | Master/individual folios · routing rules (company pays X, guest pays Y) · splits & transfers · charges from POS/minibar/PBX |
| Desk Services | Guest messages · wake-up calls · lost & found · trace codes · shift handover notes |

### `lodging/housekeeping` — ● Core
| Feature Set | Features |
|---|---|
| Task Management | Auto-generated room tasks · priorities (departure, VIP) · assignment boards per attendant |
| Execution | Room status updates from mobile · DND/service flags · supervisor inspection & scoring |
| Support | Laundry lists & charges · minibar restock list · lost & found workflow · productivity reports |

### `lodging/maintenance` — ● Core
| Feature Set | Features |
|---|---|
| Work Orders | Reactive WOs from any screen · asset-linked jobs · priority & SLA escalation |
| Preventive | Scheduled maintenance plans · meter-based triggers · checklists |
| Integration | Parts consumption posts to M-INV · OOS/OOO sync with room status · cost capture to GL |

### `lodging/night-audit` — ● Core
| Feature Set | Features |
|---|---|
| Business Day Close | Roll the business date · rate/post variance checks · no-show & expiration sweeps |
| Reconciliation | Revenue vs POS vs payments cross-checks · open-folio warnings · corrections journal |
| Statistics | Daily occupancy/ADR/RevPAR rollups → M-BUS summary tables · audit checklist & report · reversal/re-run |

## Events Published
`reservation.created|confirmed|modified|cancelled|checked_in|checked_out|no_show` (v1) ·
`room.status_changed` · `folio.updated` · `audit.closed`

## Consumed Contracts
M-CRM guest identity · M-PRC payment capture · M-HDW key encoding ·
M-FIN folio posting · M-PLT workflow (approvals) & notifications.

## Key Non-Functional Targets
Check-in < 3 s · availability search < 500 ms · night audit (150 rooms) < 2 min ·
100% offline-capable (see [OfflineMode](../OfflineMode.md)).
