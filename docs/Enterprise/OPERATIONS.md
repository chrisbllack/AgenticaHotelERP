# Operations Runbook & Service Levels

> Status: Accepted · Owner: Platform Core (M-PLT) · Related: ADR-0001, ADR-0002, `docs/Enterprise/EDITIONS.md`

The operating promise of INFINEON is simple: **the front desk never stops**.
Everything in this runbook protects that promise.

## Service-Level Targets

| Metric | Target | Measured by |
|---|---|---|
| Front-desk availability (local) | 99.95% during guest-facing hours | Health probe + local audit log |
| POS availability | 99.9% service hours | Outlet heartbeat (M-HDW) |
| Night audit completion | 100% by 04:00 local | Audit run log (M-FIN) |
| Channel sync freshness | ≤ 15 min for connected OTAs | M-DST sync ledger |
| Check-in latency (local) | < 500 ms p95 | Request timing (M-BUS) |
| RPO / RTO | 15 min / 1 h | DR drill records |

## Night Audit Operations

1. **Pre-audit checks (auto)**: unclosed POS shifts, pending departures,
   unassigned arrived reservations, devices with stale heartbeats.
2. **Roll**: rate postings, service charge and VAT, revenue rollup to GL,
   business-date advance, snapshot to M-BUS (`night_audit.rolled`).
3. **Exceptions**: the audit never silently skips — every skipped item
   lands in the morning exception report with owner and reason.
4. **Manual re-run**: supported with operator reason; a re-run appends a
   reversal-and-repost journal pair, never overwrites.

## Backup & Disaster Recovery

- **Backups**: full nightly 02:00 local + incremental every 4 h
  (matches `systemSettings` defaults); WAL shipping for PostgreSQL sites.
- **Restore drill**: quarterly, timed against RTO; drill log is part of the
  compliance evidence pack.
- **DR topology**: follows the multi-property deployment table
  (MULTI-PROPERTY.md) — on-premise sites hold a warm spare node; cloud sites
  use provider-native replication.
- **Demo/staging**: the demo SQLite dataset (Grand Palm Hotel Lagos) is
  reproducible from `migrations/` + `seeds/` for staging parity.

## Monitoring & Alerts

| Signal | Source | Route |
|---|---|---|
| Device offline/error | M-HDW heartbeats | Dashboard alert strip + ops log |
| Channel sync failure | M-DST ledger | Channel manager banner + email |
| Pending PO approvals > SLA | M-PLT workflow timers | GM approval inbox |
| Folio balance anomalies | M-FIN reconciliation report | Night auditor morning pack |
| License grace countdown | M-PLT | Admin header (visible early) |

## Routine Runbook

| Task | Cadence | Owner |
|---|---|---|
| Cashier shift close (Z-report) | Per shift | Cashier |
| Night audit verify | Daily | Night auditor / MOD |
| Backup verification | Weekly | ICT |
| Access review (dormant accounts) | Quarterly | Admin + M-SEC |
| Restore drill | Quarterly | ICT |
| License & certificate renewal | Annual | Admin |

## Incident Severity

- **S1** — front desk or POS cannot operate: immediate, follow the
  offline-first guarantee (work locally, sync later); incident review within 48 h.
- **S2** — module degraded (e.g., channel sync down, one device class failing):
  same-business-day response.
- **S3** — reporting/cosmetic: scheduled fix.

Every incident ends with an audit-linked post-mortem entry; recurring
incidents become platform backlog items, not tribal knowledge.
