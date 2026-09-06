# M-SEC — Security & Trust

**Main Module Code:** M-SEC (platform capability; code lives in `plt/identity-access`,
`plt/audit-compliance`, `plt/org-licensing`, `plt/data-sync` under M-PLT) ·
**ADR:** [ADR-0006](../ADR/0006-ModuleHierarchy.md)
**Packages:** P003, P004, P006, P007 (platform), P022 (hardening), P023 (multi-property isolation).

## Purpose
Guarantee that the right people do the right things to the right data — on a
server sitting in the hotel. Identity, authorization, licensing, audit,
privacy, and recovery are the trust contract with hotel owners; this document
specifies them as one security perimeter.

## Submodules

### `plt/identity-access` — ● Core
| Feature Set | Features |
|---|---|
| Identity | Users & service accounts · password policy & MFA (TOTP) · session & device management · SSO-ready OIDC hooks |
| Authorization | RBAC: module → screen → action → data scope · role templates per hotel department · property-scoped roles (multi-property) · segregation-of-duties rules |
| Access Governance | Access reviews & recertification · break-glass admin with time-boxed elevation · joiner/mover/leaver sync from M-HR |

### `plt/audit-compliance` — ● Core
| Feature Set | Features |
|---|---|
| Audit Log | Immutable, hash-chained audit of every state-changing action · before/after values · who/when/where/why (reason codes) |
| Privacy | PII vault & field masking · consent registry (M-CRM source of truth) · data-subject export & erasure workflow (GDPR/NDPR) · retention schedules per data class |
| Integrity | Audit export for external review · legal hold · tamper-evidence verification command |

### `plt/org-licensing` — ● Core
| Feature Set | Features |
|---|---|
| Org Model | Companies → properties → departments · property-level module enablement · usage metering (users, rooms, outlets) |
| Licensing | Ed25519-signed license files · feature flags per license tier · offline grace period (14 days) · self-update channel (ADR-0002) |

### `plt/data-sync` — ● Core
| Feature Set | Features |
|---|---|
| Backup | Nightly full + 4-hour incremental (`pg_dump -Fc`) · local rotation 30 days · encrypted cloud copy (when online) · USB export |
| Recovery | `infineon restore` with pre-restore backup · factory reset with confirmation · DR runbook & restore drill target (< 1 h RTO for 150-room property) |
| Sync Integrity | Sync WAL with idempotency keys · conflict rules (local-wins reservations, cloud-wins rates) · sync health dashboard |

## Security Model Summary

| Layer | Control |
|---|---|
| Network | On-prem LAN-first; remote access via VPN/Tunnel only — never direct DB exposure (ADR-0001) |
| Application | Thin handlers; domain services enforce authorization; validation at API + UI |
| Data | PostgreSQL RLS for multi-tenancy; NUMERIC money; immutable audit |
| Payments | PAN never stored; token vault separate (M-PRC) |
| Operations | Least-privilege roles; 4-eyes approvals above thresholds; rate limiting on auth |

## Threat Notes (On-Prem Specifics)
- **Insider risk** is the primary threat: every privileged action requires
  reason code + audit; admin actions are alertable.
- **Power/uptime**: UPS guidance + graceful shutdown; audit survives crash via
  WAL sync commit policy.
- **License tamper**: license check occurs at startup and every 24 h; failure
  enters read-only grace mode, never data loss.

## Key Non-Functional Targets
100% of state-changing endpoints audited (CI-enforced) · role change takes
effect on next request without restart · restore drill monthly in CI with
fixture database · zero secrets in code or migrations (lint-enforced).
