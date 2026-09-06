# M-PLT — Platform Core

**Main Module Code:** M-PLT · **Tier:** ● Core (mandatory in every deployment) · **ADR:** [ADR-0006](../ADR/0006-ModuleHierarchy.md)
**Packages:** P003 (shared platform), P004 (identity), P005 (organization), P006 (configuration), P007 (audit/workflow/notifications/licensing).

## Purpose
The foundation every product module stands on: who you are (identity), what
you may do (authorization), what the hotel looks like (org & configuration),
how things get approved (workflow), how people are told (notifications), what
happened (audit), and how data moves and survives (sync & backup).

Security-specific depth (RBAC matrix, privacy, licensing, DR) is specified in
[M-SEC](M-SEC.md); this document covers the platform services' surface.

## Submodules

### `plt/identity-access` — ● Core
| Feature Set | Features |
|---|---|
| Users | User CRUD & profiles · service accounts with scoped tokens · password & MFA policy |
| Sessions | JWT (Ed25519) issuance & refresh · session/device listing & revocation · concurrent-login rules |

### `plt/org-licensing` — ● Core
| Feature Set | Features |
|---|---|
| Organization | Companies → properties → departments tree · cost centers · property switching UX |
| Licensing | License verification (offline-capable) · feature flags & module enablement per property · seat & usage metering |

### `plt/config-settings` — ● Core
| Feature Set | Features |
|---|---|
| Settings | System & property settings hierarchy (system → property → override) · typed config with validation · change history |
| Operational Data | Code tables (titles, ID types, cancellation reasons…) · UI theming per property · feature toggles |

### `plt/workflow-approvals` — ◐ Differentiator
| Feature Set | Features |
|---|---|
| Workflow Engine | Declarative workflows (PO, discount, rate override, payroll, leave) · multi-step & conditional routing · delegation & out-of-office |
| Control | SLA timers & escalation · bulk approve/reject with reason codes · full approval history on the entity |

### `plt/notifications` — ◐ Differentiator
| Feature Set | Features |
|---|---|
| Channels | Email (SMTP) · SMS · WhatsApp · push · in-app inbox — via adapter pattern |
| Templates & Prefs | Template registry with variables & localization · guest/staff preference center · quiet hours |
| Delivery | Queue with retry & backoff · delivery receipts · dead-letter inspection · offline queuing |

### `plt/audit-compliance` — ● Core
| Feature Set | Features |
|---|---|
| Audit | Middleware-captured audit trail (every write) · admin UI with filters & export · retention policies |
| Compliance | PII masking rules · subject export/erasure workflows · legal hold |

### `plt/data-sync` — ● Core
| Feature Set | Features |
|---|---|
| Sync | Outbound WAL queue & inbound poll engine (per [OfflineMode](../OfflineMode.md)) · conflict rules · sync health dashboard |
| Data Ops | Import/export (CSV/XLSX) & bulk operations · backup/restore orchestration · environment promotion (dev → property) |

## Events Published
`user.authenticated` · `role.changed` · `approval.requested|decided|escalated` ·
`notification.queued|delivered|failed` · `license.state_changed` ·
`config.updated` · `sync.state_changed`

## Consumed By
Every module. Platform Core consumes only infrastructure (PostgreSQL, SMTP
relay, SMS/WhatsApp gateway adapters) and nothing product-level.

## Key Non-Functional Targets
Auth decision overhead < 5 ms (cached) · workflow engine executes 100%
of approval paths offline · notification retry with exponential backoff &
dead-letter after 24 h · audit write is synchronous-with-commit (never sampled).
