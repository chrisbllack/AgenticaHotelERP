# Multi-Property & Group Operations (P023)

> Status: Accepted · Owner: Platform Core (M-PLT) · Related: ADR-0001, ADR-0006, `docs/Enterprise/EDITIONS.md`

INFINEON supports a single property out of the box and scales to a hotel group
without re-architecture. The unit of isolation is the **property**; the unit of
consolidation is the **group**.

## Tenancy Model

| Level | Description | Data scope |
|---|---|---|
| Property | One hotel/resort with its own rooms, outlets, stores, staff, folios | Fully isolated row-level, keyed `property_id` on every business table |
| Group | A portfolio of properties under one owner/operator | Optional parent entity; owns brand standards, rate strategy, consolidated reporting |
| Cluster | Optional cross-property staffing (e.g., one GM over two sister hotels) | Shared user identities; property-scoped permissions per role |

Rules:

1. **Row-level isolation.** Every business table carries `property_id`;
   repositories enforce it implicitly — a query cannot cross properties even
   if a bug attempts it.
2. **Per-property configuration.** Currency, VAT/service-charge rates, check-in
   times, night-audit schedule, fiscal device rules, and numbering sequences
   are property-scoped settings (see `systemSettings` scope in the data model).
3. **Per-property business date.** Each property rolls its own night audit at
   its own timezone; a group dashboard reflects mixed audit states explicitly
   ("3 of 5 properties rolled").
4. **Users are global, permissions are local.** A user authenticates once; role
   grants attach to property scope. Cross-property roles (group revenue manager)
   see an explicit property switcher with consolidated views.

## Consolidated Reporting (Flagship)

- **Close discipline.** Group KPIs are computed only from properties whose
  night audit is rolled for the business date; partial groups show a clear
  coverage indicator instead of silently mixing dates.
- **Currency consolidation.** Property ledgers are kept in local currency;
  consolidation applies group-defined FX rates as of the business date and
  preserves the original amounts for audit.
- **Standard account mapping.** Each property maps its local GL accounts to the
  group chart of accounts (USALI-aligned) so P&L lines are comparable.
- **Benchmark set.** Occupancy, ADR, RevPAR, GOP margin, labor cost ratio, and
  F&B cost percentage roll up per property with group percentile ranking.

## Deployment Topologies

| Topology | When | Isolation | Consolidation |
|---|---|---|---|
| Single-node per property | On-premise-first properties (ADR-0001), unreliable links | Physical | Async rollup to group cloud |
| Private cloud, shared DB | Group wants central ops; strong network | Row-level | Native, real-time |
| Hybrid | Flagship properties on-prem + city hotels cloud | Mixed | Nightly batch + event replay |

Offline-first (ADR-0001) applies at every topology: a property always operates
locally, and consolidation is eventually consistent by design.

## Data Residency & Exit

1. **Residency.** Guest PII stays in the property's region; group analytics
   consume aggregated, PII-free projections unless the guest has consented to
   cross-border profiling (GDPR/NDPR compliant — see COMPLIANCE.md).
2. **Property exit.** A property can be detached with a full export (schema +
   data + audit trail) and its license released; group-side projections drop
   the property without affecting its local operation.
