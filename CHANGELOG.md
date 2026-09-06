# Changelog

All notable changes to the INFINEON Enterprise Platform will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- Integrated hotel booking website (M-LOD/M-DST): `/book` search with live
  availability, guest checkout, confirmation & self-service lookup/cancel —
  backed by new Convex modules `src/convex/{booking,payments,ops,lib}.ts` with
  a public HTTP API (`/public/availability`, `/public/bookings`,
  `/public/booking/:code`, `/payments/initialize`, `/payments/verify/:ref`,
  `/paystack/webhook` with HMAC-SHA512 verification)
- Paystack payment adapter over direct REST (no vendor SDK) with graceful
  "pay at front desk" demo mode when `PAYSTACK_SECRET_KEY` is not configured
- Console Reservations page now shows a live "Website bookings" panel with
  confirm and front-desk payment actions over real website bookings
- Enterprise layer documentation: [Editions & Licensing](docs/Enterprise/EDITIONS.md)
  (4 editions as module bundles with offline license grace),
  [Integration Contracts](docs/Enterprise/INTEGRATION-CONTRACTS.md)
  (named event/service contracts across all 13 modules),
  [Multi-Property & Group Operations](docs/Enterprise/MULTI-PROPERTY.md)
  (row-level isolation, consolidated reporting, deployment topologies),
  [Compliance & Trust Baseline](docs/Enterprise/COMPLIANCE.md)
  (PCI SAQ-A posture, GDPR/NDPR workflows, ISO 27001 alignment), and
  [Operations Runbook](docs/Enterprise/OPERATIONS.md)
  (SLAs, night-audit operations, backup/DR, incident severities)
- Full frontend application (React 19 + Vite + Tailwind 4): public landing
  page, role-aware auth flow, module-tree app shell and 17 authenticated
  pages — executive dashboard, front desk (check-in/out, walk-ins, folios),
  room rack, reservations, housekeeping board, maintenance, POS terminal,
  inventory & procurement, general ledger, HR & payroll, guests & loyalty,
  channel manager, payments & settlement, function diary, device health,
  reports & audit, system admin — powered by the recovered Grand Palm Hotel
  Lagos demo dataset (50 rooms, 25 reservations, live folio balances)
- Preview tooling: hosted dev script binding 0.0.0.0, favicon, document title
- ADR-0006: platform module hierarchy — all business capability grouped into
  12 main modules (M-LOD, M-FNB, M-EVT, M-CRM, M-DST, M-INV, M-FIN, M-PRC,
  M-HR, M-BUS, M-HDW, M-PLT) carrying 66 submodules
- Master module catalog `docs/modules/MODULES.md` with dependency map,
  data ownership, event contracts, and legacy product-family crosswalk
- In-depth enterprise feature specs per main module:
  `docs/modules/M-LOD.md`, `M-FNB.md`, `M-EVT.md`, `M-CRM.md`, `M-DST.md`,
  `M-INV.md`, `M-FIN.md`, `M-PRC.md`, `M-HR.md`, `M-BUS.md`, `M-HDW.md`,
  `M-MOB.md` (Mobile & Guest Apps), `M-PLT.md` (Platform Core),
  `M-SEC.md` (Security & Trust)
- Repository bootstrap with Go backend, React frontend, Flutter mobile
- Docker infrastructure
- CI/CD pipeline (GitHub Actions)
- Database migrations (0001-0006)
- Shared platform layer (middleware, API responses)
- Identity domain (users, auth, RBAC)
- Organization domain (companies, properties, departments)

### Changed
- Legacy product-family names (IRES, IFES, IIES, ICES, IMES, IAES, IBIP, IHF)
  retired as architecture; preserved as licensing bundles over submodules
- README product section and ARCHITECTURE domain map rewritten around main modules

## [0.1.0] - 2026-08-31

### Added
- Initial project setup
