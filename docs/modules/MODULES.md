# INFINEON Platform — Module Catalog

**Hierarchy:** Platform → **Main Module** → **Submodules** → Feature Sets → Features

- Main modules are product/licensing boundaries (M-codes below).
- Submodules are code and delivery boundaries (`internal/domain/{submodule}/`).
- **13 main modules · 62 submodules** (59 product/platform + 3 mobile-delivery).
  M-SEC specifies the security perimeter of M-PLT's four submodules and adds no
  separate code boundary.
- Status reflects the baseline assessment against `ROADMAP.md` packages P001–P024.
  ● Core = must ship for a viable hotel PMS · ◐ Differentiator · ○ Premium/enterprise tier.

---

## Assessment Summary (Baseline)

| Area | Finding |
|------|---------|
| Coverage | 40+ domains inventoried across the original 9 product suites; roughly 60% of hospitality capability was named but unowned (workflow, approvals, budgeting, contracts, spa, etc.) |
| Structure | Flat domain list, no product hierarchy; legacy suite names (IRES/IFES/IIES) cut across sprint packages |
| Duplicates | Guest Management in two suites; notifications/workflow ownerless; housekeeping & maintenance split from rooms they serve |
| Gaps for enterprise | Budgeting/forecast depth, group & event sales, contract/banquet billing, cash management, consolidated multi-property reporting, revenue optimization, staff scheduling, guest messaging |
| Resolution | 13 main modules (ADR-0006) with 62 submodules; every package P001–P024 mapped (see `ROADMAP.md`); all gaps assigned an owner |

---

## Module Dependency Map

```
                     ┌────────────────────────────────────────────┐
                     │              M-PLT  Platform Core          │
                     │ Identity · Org · Config · Workflow · Audit │
                     └────────────────────────────────────────────┘
                                        ▲ consumed by all
 ┌────────┐  events  ┌────────┐   API  ┌────────┐
 │ M-DST  │────────▶│ M-LOD  │◀───────│ M-EVT  │
 └───┬────┘         └───┬────┘        └───┬────┘
     │                  │ charges         │ catering/banquet
     ▼                  ▼                 ▼
 ┌────────┐         ┌────────┐         ┌────────┐
 │ M-CRM  │         │ M-FNB  │         │ M-INV  │
 └────────┘         └───┬────┘         └───┬────┘
                        │ posts            │ goods receipt/AP
                        ▼                  ▼
                     ┌────────────────────────────┐
                     │  M-FIN ◀── M-PRC  M-HR     │
                     └────────────────────────────┘
                                        │ facts to
                                        ▼
                     ┌────────────────────────────┐
                     │  M-BUS · M-HDW · M-MOB     │
                     └────────────────────────────┘
```

Rules (ADR-0006): modules call other modules only via published contracts and
versioned events; cross-module reads via owning API or Analytics-owned
materialized views; money always posts through M-FIN.

---

## M-LOD — Lodging & Guest Operations  ● Core

The center of gravity of the platform; the reason hotels buy INFINEON.
Spec: [M-LOD](M-LOD.md).

| Submodule | Status | Depth: Key Feature Sets |
|-----------|--------|-------------------------|
| `lodging/property-config` | ● | Property profiles & operating calendar; season definitions; bed/room-type taxonomy; room features & connectivity attributes; package/rate-plan scaffolding; floor & wing layout |
| `lodging/rooms` | ● | Room inventory & attributes; status engine (Vacant/Clean/OOS/OOO); room moves & combines (connecting/suites); amenity & view mapping; room diagrams |
| `lodging/rates-availability` | ● | Seasonal rate plans; day-of-week & length-of-stay rules; yield & closed-to-arrival/departure controls; overbooking policy per room type; availability calendar engine |
| `lodging/reservations` | ● | Multi-room & share reservations; waitlist; guarantees & deposits; group blocks; cancellation policies; optional extras & packages; modification audit trail |
| `lodging/front-desk` | ● | Arrival/in-house/departure workspaces; check-in/out; folios & routing; guest messages; wake-up calls; key encode; express checkout |
| `lodging/housekeeping` | ● | Room task boards & priorities; assignments; room status integration; laundry & lost-found; supervisor inspection; housekeeper mobile flow |
| `lodging/maintenance` | ● | Work orders; preventive schedules; asset-linked jobs; escalation; parts usage posting to inventory |
| `lodging/night-audit` | ● | Business-day close; rate variance & no-show sweeps; statistics rollups; auto-reconcile warnings; audit checklist & reversal |

Data ownership: rooms, room_status, reservations, folios, work_orders, audit_runs.
Publishes: `reservation.*`, `room.status_changed`, `folio.updated`, `audit.closed`.

---

## M-FNB — Food & Beverage  ● Core

Spec: [M-FNB](M-FNB.md).

| Submodule | Status | Depth: Key Feature Sets |
|-----------|--------|-------------------------|
| `fnb/outlets-tables` | ● | Multi-outlet config (restaurant, bar, pool, room service); table management & merges; floor plans; shifts; covers counting |
| `fnb/menu-engineering` | ● | Menus per outlet/period; modifiers & combos; price tiers (dine-in/room/inclusive); recipe links to inventory; popularity & margin matrix |
| `fnb/pos` | ● | Order lifecycle; split/merge bills; discounts & comps; covers & courses; tax profiles; offline-first operation |
| `fnb/kot-kds` | ● | KOT routing per station; KDS screens with timings; recall & reprint; production warnings |
| `fnb/bar-cellar` | ◐ | Beverage lists; spirit variance & measured pours; cellar vintage tracking; happy-hour pricing |
| `fnb/minibar` | ◐ | In-room posted consumption; barcode scan posting; auto-charge to folio; restock lists |

Data ownership: outlets, tables, menus, orders, kots, beverage_items.
Publishes: `order.closed`, `kot.fired`, `menu.updated`.

---

## M-EVT — Events & Conference  ◐ Differentiator

Spec: [M-EVT](M-EVT.md).

| Submodule | Status | Depth: Key Feature Sets |
|-----------|--------|-------------------------|
| `events/venues` | ◐ | Venue spaces; capacity layouts (theater/U-shape/banquet); setup diagrams; simultaneous-use calendar |
| `events/bookings` | ◐ | Definite & tentative bookings; function diary & conflict detection; BEO (banquet event orders); contracts & versioning; deposit & attrition tracking |
| `events/catering` | ◐ | Catering menus & packages; per-head & consumption billing; kitchen production sheets |
| `events/av-resources` | ○ | AV & equipment inventory; internal/external vendor resources; technician scheduling |

Data ownership: venues, event_bookings, beos, catering_menus, function_sheets.
Publishes: `event.confirmed`, `event.billed`.

---

## M-CRM — Guest Experience & CRM  ● Core

Spec: [M-CRM](M-CRM.md).

| Submodule | Status | Depth: Key Feature Sets |
|-----------|--------|-------------------------|
| `crm/guest-profiles` | ● | Unified guest 360 (stays, spends, preferences); VIP flags & trace codes; do-not-contact; document & consent vault; merge/deduplicate |
| `crm/loyalty` | ◐ | Tiers & earning rules (stay/spend/event); points ledger; redemption into folio; partner earn/burn; expiry & downgrade |
| `crm/campaigns` | ◐ | Segments (RFM & stay-behavior); email/SMS/WhatsApp templates; journey automation (pre-arrival, post-stay); A/B & response tracking |
| `crm/feedback` | ◐ | Multi-channel surveys; CSAT/NPS scoring; complaint-to-case workflow; online reputation aggregation |

Data ownership: guest_profiles, loyalty_ledger, segments, campaigns, feedback.
Publishes: `guest.created`, `loyalty.earned`, `feedback.received`.

---

## M-DST — Distribution & Commerce  ◐ Differentiator

Spec: [M-DST](M-DST.md).

| Submodule | Status | Depth: Key Feature Sets |
|-----------|--------|-------------------------|
| `dst/channel-manager` | ◐ | OTA connectors (adapter pattern); ARI push/pull & mapping; restrictions sync; stop-sell; reservation import with reconciliation |
| `dst/booking-engine` | ◐ | Public availability & rate shopping; themed booking flow; promo & corporate codes; upsells; PCI-safe tokenized capture |
| `dst/corporate-groups` | ◐ | Company contracts & negotiated rates; group blocks with pickup; crew & long-stay rates; RFP inbox |

Data ownership: channels, channel_mappings, booking_sessions, corporate_accounts, group_blocks.
Publishes: `channel.reservation_received`, `booking.confirmed`.

---

## M-INV — Supply Chain  ● Core

Spec: [M-INV](M-INV.md).

| Submodule | Status | Depth: Key Feature Sets |
|-----------|--------|-------------------------|
| `inv/inventory` | ● | Multi-store stock; stock counts & variance; transfers & requisitions; expiry & batch tracking; reorder levels |
| `inv/procurement` | ● | Requisitions → RFQ → PO workflow; supplier quotes & contracts; goods receipt & 3-way match; supplier scorecards |
| `inv/recipe-costing` | ◐ | BOM recipes per menu item; theoretical vs actual consumption; yield & shrinkage; menu margin alerts |
| `inv/assets-capex` | ◐ | Fixed asset register handoff to finance; asset maintenance link; CAPEX requests & approvals |

Data ownership: products, stock_levels, movements, purchase_orders, suppliers, recipes.
Publishes: `stock.low`, `po.received`, `po.approved`.

---

## M-FIN — Finance & Accounting  ● Core

Spec: [M-FIN](M-FIN.md).

| Submodule | Status | Depth: Key Feature Sets |
|-----------|--------|-------------------------|
| `fin/general-ledger` | ● | Chart of accounts; double-entry posting engine; journals & recurring entries; period close & lock; allocation rules |
| `fin/ar-invoicing` | ● | Guest ledger & city ledger; invoice designer; statements & aging; deposits & advance handling; dunning |
| `fin/ap-purchasing` | ● | Supplier invoices & credit notes; payment scheduling; approvals tie-in; 3-way match linkage |
| `fin/cash-banking` | ◐ | Cash draws & float; bank accounts & reconciliation; multi-currency with revaluation; petty cash |
| `fin/fixed-assets` | ○ | Asset categories & depreciation methods; capitalized improvements; disposal & revaluation |
| `fin/tax-compliance` | ◐ | Tax codes & inclusive/exclusive; VAT/WHT returns; tax exemptions; e-invoicing hooks |

Data ownership: accounts, journal_entries, invoices, payments_in_out, bank_accounts, tax_codes.
Publishes: `journal.posted`, `invoice.issued`, `period.closed`.

---

## M-PRC — Payments  ● Core

Spec: [M-PRC](M-PRC.md).

| Submodule | Status | Depth: Key Feature Sets |
|-----------|--------|-------------------------|
| `prc/gateways` | ● | Gateway abstraction (adapter per provider); hosted & server-to-server flows; tokenization vault; webhooks |
| `prc/card-present` | ◐ | Terminal pairing; EMV flow; tips & pre-auth/capture for incidentals; offline queueing rules |
| `prc/wallets-momo` | ◐ | Mobile money (MTN/Airtel/etc.); QR & link payments; wallet settlement posting |
| `prc/settlement-recon` | ◐ | Batch settlement & fee tracking; gateway vs ledger reconciliation; chargebacks & disputes; refunds & reversals |

Data ownership: payment_methods, transactions, settlement_batches, disputes.
Publishes: `payment.captured`, `payment.failed`, `settlement.reconciled`.

---

## M-HR — Workforce  ● Core

Spec: [M-HR](M-HR.md).

| Submodule | Status | Depth: Key Feature Sets |
|-----------|--------|-------------------------|
| `hr/core` | ● | Employee master; org chart & positions; contracts & documents; onboarding/offboarding checklists |
| `hr/time-attendance` | ● | Shifts & rosters; clock-in/out (incl. biometric device); overtime & absence codes; leave accrual & workflow |
| `hr/payroll` | ● | Pay structures & deductions; payroll runs with preview→approve→pay; statutory tables; payslips; GL posting |
| `hr/scheduling` | ◐ | Demand-based staff scheduling from occupancy & covers forecasts; labor cost vs budget; swap & approval flows |

Data ownership: employees, shifts, attendance, leave, payroll_runs.
Publishes: `payroll.approved`, `attendance.anomaly`.

---

## M-BUS — Intelligence & AI  ◐ Differentiator

Spec: [M-BUS](M-BUS.md).

| Submodule | Status | Depth: Key Feature Sets |
|-----------|--------|-------------------------|
| `bus/kpi-dashboards` | ● | Executive, front-desk, F&B and owner dashboards; real-time occupancy & RevPAR; departmental scorecards; multi-property rollup |
| `bus/reporting` | ● | Report catalog (100+ ops & financial reports); scheduler & distribution; export to PDF/Excel/CSV; row-level security on data scopes |
| `bus/forecasting` | ◐ | Occupancy & ADR forecasts; demand calendars; cash-flow projection; labor demand forecast |
| `bus/ai-assistant` | ○ | NL query over hotel data; copilot for front desk & managers; anomaly detection & alerts; AI pricing suggestions (guard-railed) |
| `bus/revenue-opt` | ○ | Rate recommendations; length-of-stay controls; channel mix & displacement analysis; competitor rate capture |

Data ownership: materialized views, summary tables, forecasts, insight models.
Consumes: facts from all modules; **never** writes into product modules.

---

## M-HDW — Device Integration  ● Core (ops-critical)

Spec: [M-HDW](M-HDW.md).

| Submodule | Status | Depth: Key Feature Sets |
|-----------|--------|-------------------------|
| `hdw/driver-sdk` | ● | Vendor-neutral Driver contract (Connect/Encode/Status/Health/Diagnostics); simulator suite; driver registry & hot-config |
| `hdw/room-devices` | ● | Door locks & key encoding; IPTV welcome & folio view; PBX call posting & name display; in-room tablets; thermostats & energy mgmt |
| `hdw/pos-peripherals` | ● | Receipt & KOT printers; cash drawers; barcode scanners; kitchen displays; customer-facing displays |
| `hdw/network` | ◐ | Device gateway status; LAN topology health; printer/lock offline alerts; peripheral firmware inventory |

Data ownership: devices, device_logs, driver_configs.
Publishes: `device.health`, `lock.encoded`, `call.posted`.

---

## M-MOB — Mobile & Guest Apps  ◐ Differentiator

One Flutter codebase, role-flavored: staff apps keep working through outages;
guest apps and kiosks reduce front-desk load. Spec: [M-MOB](M-MOB.md).

| Submodule | Status | Depth: Key Feature Sets |
|-----------|--------|-------------------------|
| `mob/staff-apps` | ◐ | Housekeeping app · Engineering app · Manager approvals & flash KPIs · Waiter handheld ordering with at-table payment |
| `mob/guest-app` | ◐ | Direct booking · online check-in & digital reg card · mobile key (where supported) · in-stay ordering & chat · loyalty card |
| `mob/kiosks-portals` | ○ | Lobby self check-in/out kiosk with key dispense · owner portal · corporate client portal |

Data ownership: device registrations, push tokens, kiosk sessions.
Publishes: `mobile.device_registered`, `guest.service_requested`.

---

## M-PLT — Platform Core  ● Core (mandatory)

Spec: [M-PLT](M-PLT.md). Security perimeter: [M-SEC](M-SEC.md).

| Submodule | Status | Depth: Key Feature Sets |
|-----------|--------|-------------------------|
| `plt/identity-access` | ● | Users & service accounts; RBAC (module/screen/action/data scope); SSO-ready OIDC hooks; password & MFA policy; session & device management |
| `plt/org-licensing` | ● | Companies → properties → departments; license verification & feature flags; property-level enablement; usage metering |
| `plt/config-settings` | ● | System & property settings; UI theming per property; code tables; feature toggles; env & secret management surface |
| `plt/workflow-approvals` | ◐ | Declarative approval workflows (PO, payroll, discounts, rate overrides); delegation & out-of-office; SLA timers; approval history |
| `plt/notifications` | ◐ | Template registry (email/SMS/WhatsApp/push/in-app); preference center; queue with retry; delivery receipts |
| `plt/audit-compliance` | ● | Immutable audit log; data retention policies; PII vault & masking; GDPR/NDPR subject export; legal hold |
| `plt/data-sync` | ● | Offline WAL queue; inbound/outbound sync engine; conflict rules; cloud backup & restore; import/export & bulk ops |

Data ownership: users, roles, org tree, licenses, settings, workflows, notifications, audit_log, sync_wal.

---

## Cross-Cutting Concerns

| Concern | Owner | Notes |
|---------|-------|-------|
| Money & postings | M-FIN | All modules post charges via `fin.posting` contract; no direct ledger writes |
| Guest identity | M-CRM | M-LOD references guest IDs, never re-registers guests |
| Files & media | M-PLT | Storage service (local disk, S3-compatible when cloud-enabled) |
| Search | M-PLT | PostgreSQL FTS in V1; interface allows external engine later |
| Localization | M-PLT | Currencies, tax regimes, translations; property-scoped |
| Secrets | M-PLT | Never in code; vault surface via config module |

---

## Enterprise Layer

Cross-cutting platform documentation that builds on this catalog:

- [Editions & Licensing Matrix](../Enterprise/EDITIONS.md) — the 4 commercial editions as module bundles
- [Cross-Module Integration Contracts](../Enterprise/INTEGRATION-CONTRACTS.md) — the event & service contract catalog
- [Multi-Property & Group Operations](../Enterprise/MULTI-PROPERTY.md) — isolation, consolidation, topologies
- [Compliance & Trust Baseline](../Enterprise/COMPLIANCE.md) — PCI, GDPR/NDPR, ISO 27001 controls
- [Operations Runbook & Service Levels](../Enterprise/OPERATIONS.md) — SLAs, night-audit ops, DR

---

## Legacy Product-Family Crosswalk

| Legacy Suite | Becomes |
|--------------|---------|
| IHES (Hospitality) | M-LOD + M-FNB + M-EVT (the core product) |
| IRES (Restaurant) | M-FNB (licensable bundle: `fnb/*`) |
| IFES (Finance) | M-FIN |
| IIES (Inventory) | M-INV |
| ICES (CRM) | M-CRM + M-DST |
| IMES (Maintenance) | `lodging/maintenance` (moved into Lodging) |
| IAES (AI) | M-BUS |
| IBIP (BI) | `bus/kpi-dashboards` + `bus/reporting` |
| IHF (Hardware Framework) | M-HDW |
