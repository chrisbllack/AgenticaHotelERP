# Editions & Licensing Matrix

> Status: Accepted · Owner: Platform Core (M-PLT) · Related: ADR-0001 (on-premise first), ADR-0006 (module hierarchy)

INFINEON is licensed per property, per edition. Editions are **bundles over the
13 main modules** — they never fork code. A capability exists in exactly one
module; an edition either includes that module or it does not.

## Edition Matrix

| Capability area | Essential | Professional | Enterprise | Flagship |
|---|---|---|---|---|
| Lodging & Guest Ops (M-LOD) | ✔ front desk, rack, reservations | ✔ + housekeeping, maintenance | ✔ full | ✔ full |
| Food & Beverage (M-FNB) | — | ✔ POS + menu | ✔ + KDS, room service | ✔ + menu engineering |
| Finance (M-FIN) | ✔ folios, cashiering | ✔ + GL, night audit | ✔ + AP/AR, fixed assets | ✔ + multi-currency consolidation |
| Supply Chain (M-INV) | — | ✔ stores & stock | ✔ + purchasing, approvals | ✔ + recipe costing |
| Workforce (M-HR) | — | ✔ employees, shifts | ✔ + payroll, attendance | ✔ + talent & training |
| Guest Experience (M-CRM) | — | ✔ profiles, history | ✔ + loyalty tiers | ✔ + campaigns, journeys |
| Events & Banqueting (M-EVT) | — | — | ✔ diary, venues, BEOs | ✔ + catering costing |
| Distribution (M-DST) | — | ✔ 2 channels | ✔ unlimited + GDS | ✔ + rate shopping |
| Payments (M-PRC) | ✔ basic tender | ✔ + gateways | ✔ + settlement & recon | ✔ + split settlement |
| Intelligence (M-BUS) | ✔ daily KPIs | ✔ + report library | ✔ + analytics warehouse | ✔ + forecasting |
| Devices (M-HDW) | ✔ locks, printer | ✔ + POS terminals | ✔ full fleet | ✔ + predictive health |
| Platform (M-PLT) | ✔ 1 property | ✔ 1 property | ✔ multi-property | ✔ group/consolidated |
| Security & Trust (M-SEC) | ✔ RBAC, audit | ✔ + field encryption | ✔ + SSO, SIEM export | ✔ + HSM key custody |

## Licensing Rules

1. **Per-property keys.** Each property holds a signed license file binding
   edition, module set, room count, and expiry. Keys are hardware-bound on
   premise (ADR-0001) and validated locally on boot.
2. **Offline grace.** A property keeps full function for `license.grace_days`
   (default 14) without license-server contact; a visible countdown appears in
   the admin header. Read-only mode follows grace expiry — never a lockout of
   folio settlement.
3. **Upgrade path.** Moving between editions adds or removes module licenses
   only. Data is never migrated, discarded, or re-keyed; disabled modules
   retain their data and reappear intact on upgrade.
4. **Room-count bands.** Licensing bands (≤50, ≤150, ≤400, unlimited) govern
   rate; exceeding a band triggers a license renewal, not a functional stop.
5. **Legacy bundles.** Retired product families (IRES, IFES, IIES, ICES, IMES,
   IAES, IBIP, IHF) map to named module bundles for contract continuity —
   see `docs/modules/MODULES.md` crosswalk.
