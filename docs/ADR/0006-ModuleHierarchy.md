# ADR-0006: Platform Module Hierarchy & Main-Module Grouping

## Status: Accepted

## Context

INFINEON has grown from a set of loosely-listed product ideas (see the original
Product Family table in `README.md`) into a concrete build plan of 24
implementation packages (P001–P024 in `ROADMAP.md`) covering more than 40
functional domains — from room assignments and KDS screens to chart-of-accounts
posting and OTA channel sync.

At this scale, a flat list of domains no longer communicates the product to
stakeholders, and it hides real structural facts from engineers:

1. **Many domains are the same capability wearing different coats.** Payroll,
   AP disbursement, POS settlement, OTA remittance, and housekeeping scheduling
   all post through the same general ledger; staff biometrics and door locks
   both ride the same hardware abstraction; loyalty pricing and corporate
   negotiated rates both resolve through the same rate engine.
2. **Implementation order and feature slicing cut across the old product
   names.** The IRES (Restaurant), IFES (Finance), and IIES (Inventory)
   "suites" were scheduled in interleaved sprints (S12–S19), which no flat
   grouping can express.
3. **Duplicated and orphaned features** surfaced in the review: "Guest
   Management" existed under both Hospitality and CRM; "Notifications" and
   "Workflow" had no home at all.

## Decision

1. **One main module is the product.** `Lodging & Guest Operations (M-LOD)`
   is the center of gravity. The platform is *sold* as a hotel system that
   happens to include finance, F&B, and CRM — not as a bundle of suites.
2. **All business capability is grouped into main modules**, each owning a
   bounded set of submodules with exclusive data ownership. Submodules are the
   unit of delivery (a P-package builds one or more submodules end to end).
   Twelve product modules carry 59 submodules; **Mobile & Guest Apps (M-MOB)**
   is the application delivery surface (3 submodules) — **13 main modules,
   62 submodules** in total. The cross-cutting **Security & Trust (M-SEC)**
   specification defines the security perimeter of M-PLT without adding a
   separate code boundary.
3. **Enabling platforms are not product modules.** Security & Trust (the M-SEC
   perimeter), Analytics & AI (M-BUS), Hardware Integration (M-HDW), Mobile
   delivery (M-MOB), and the shared Platform Core (M-PLT) are *platform*
   capabilities consumed by all product modules. They sit beside the product
   modules, not inside them.
4. **The legacy product-family names (IRES, IFES, IIES…) are retired as
   architecture.** Where a name has market value (e.g. a standalone restaurant
   SKU later), it becomes a *licensing bundle over submodules*, not a
   directory or a package boundary.
5. **Dependency rule:** a main module may depend on Platform Core, on any
   platform capability, and on *other main modules only through their
   published service contracts and domain events* — never through their
   database tables. Cross-module data reads go through the owning module's API
   or through materialized views owned by Analytics.
6. **Event contracts are versioned.** Every module publishes its domain events
   (e.g. `reservation.checked_in.v1`) and consumers subscribe by contract, so
   modules can be deployed and licensed independently.

## The Main Modules

| Code | Main Module | Submodules (summary) |
|------|-------------|----------------------|
| M-LOD | Lodging & Guest Operations | Property Config, Rooms, Rates & Availability, Reservations, Front Desk, Housekeeping, Maintenance, Night Audit |
| M-FNB | Food & Beverage | Outlets & Tables, Menu Engineering, POS, KOT/KDS, Bar & Cellar, MiniBar |
| M-EVT | Events & Conference | Venues, Event Bookings (DEF/BEO), Catering, AV & Resources |
| M-CRM | Guest Experience & CRM | Guest Profiles, Loyalty, Campaigns & Comms, Feedback & Reputation |
| M-DST | Distribution & Commerce | Channel Manager, Booking Engine, Corporate & Groups |
| M-INV | Supply Chain | Inventory, Procurement, Recipe & Costing, Assets & CAPEX |
| M-FIN | Finance & Accounting | GL, AR & Invoicing, AP & Purchasing Ledger, Cash & Banking, Fixed Assets, Tax & Compliance |
| M-PRC | Payments | Gateways, Card Present, Wallets & Mobile Money, Settlement & Reconciliation |
| M-HR | Workforce | HR Core, Time & Attendance, Payroll, Staff Scheduling |
| M-BUS | Intelligence & AI | KPIs & Dashboards, Reporting Engine, Forecasting, AI Assistant, Revenue Optimization |
| M-HDW | Device Integration | Driver SDK, Room Devices, POS Peripherals, Network |
| M-MOB | Mobile & Guest Apps | Staff Apps (HK/engineering/manager/waiter), Guest App, Kiosks & Portals |
| M-PLT | Platform Core | Identity & Access, Org & Licensing, Config & Settings, Workflow & Approvals, Notifications, Audit & Compliance, Data & Sync |

M-SEC (Security & Trust) documents the security perimeter across
`plt/identity-access`, `plt/audit-compliance`, `plt/org-licensing`, and
`plt/data-sync`; it adds no separate code boundary.

Full submodule catalog with feature depth: see `docs/modules/`.

## Consequences

- **Roadmap restructured** around modules; the P-package list is preserved and
  cross-referenced so no in-flight work is invalidated (see `ROADMAP.md`).
- **Repository layout** keeps `internal/domain/{submodule}/` (fine-grained,
  testable), while documentation, licensing, and API surface are grouped at
  main-module level. Main module = product boundary; submodule = code boundary.
- **Duplicated features merged**: Guest Management is owned by M-CRM (profiles)
  with room-stay context contributed by M-LOD; Notifications and Workflow are
  platform services under M-PLT.
- **Enterprise features that no module owned** (workflow/approvals, audit
  trails, licensing, data retention) become explicit first-class platform
  submodules.
- **Growth path**: new verticals (spa, golf, residences) enter as submodules
  under the closest main module or as new M-codes once they justify a boundary.
