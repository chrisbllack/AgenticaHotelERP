# M-PRC — Payments

**Main Module Code:** M-PRC · **Tier:** ● Core · **ADR:** [ADR-0006](../ADR/0006-ModuleHierarchy.md)
**Packages:** P017 (gateway & booking payments), P010 (folio payment flows), P022 (settlement reporting).

## Purpose
Take money safely in every way guests and corporates pay — card, mobile money,
bank transfer, cash — through vendor-neutral gateway and terminal adapters,
with tokenization, settlement tracking, and reconciliation back to the ledgers
in M-FIN and folios in M-LOD.

## Submodules

### `prc/gateways` — ● Core
| Feature Set | Features |
|---|---|
| Gateway Abstraction | Provider adapter contract (Paystack, Flutterwave, Stripe, adyen…) · sandbox/live profiles · failover routing |
| Payment Flows | Hosted checkout · server-to-server charge · payment links & QR · recurring & MOTO |
| Tokens & Webhooks | Card tokenization vault (PCI scope containment) · webhook ingestion with signature verification & replay protection · idempotency keys |

### `prc/card-present` — ◐ Differentiator
| Feature Set | Features |
|---|---|
| Terminals | Terminal pairing & registry · cloud & local (LAN) terminal modes · terminal health monitoring |
| EMV Flows | Pre-auth & incremental auth (incidentals) · capture & partial capture · tips · voids & refunds on terminal |
| Resilience | Offline auth queue with rules (floor limits, expiry) · forced capture on reconnect · reconciliation of queued vs settled |

### `prc/wallets-momo` — ◐ Differentiator
| Feature Set | Features |
|---|---|
| Mobile Money | MTN MoMo, Airtel Money, M-Pesa adapters · collection & disbursement APIs · name-check (KYC) validation |
| Alternative Methods | Bank transfer with reference matching · USSD flows · QR presentment (generic + provider schemes) |

### `prc/settlement-recon` — ◐ Differentiator
| Feature Set | Features |
|---|---|
| Settlement | Batch settlement tracking · processor fee ledger · payout schedule & expectations |
| Reconciliation | Gateway vs ledger vs bank reconciliation · break/exception queue · auto-match rules with manual override |
| Disputes | Chargeback lifecycle & evidence upload · representment tracking · loss reporting |

## Events Published
`payment.initiated|captured|failed|refunded` · `payout.expected|received` ·
`settlement.reconciled` · `dispute.opened|resolved`

## Consumed Contracts
M-LOD folio settlement · M-FNB/M-EVT direct payments · M-DST booking deposits ·
M-FIN cash/bank posting & reconciliation targets · M-PLT audit & secrets.

## Security & Compliance Notes
- No PAN storage — tokens only; vault isolated from application schema.
- Webhooks verified (HMAC), deduplicated, and stored for replay/audit.
- Refunds restricted by role + workflow approval above threshold (M-PLT).
- Card-present offline rules are property-configurable with hard ceiling caps.

## Key Non-Functional Targets
Payment initiation < 2 s p95 (online) · webhook processing < 1 s ·
reconciliation auto-match ≥ 95% of transactions · 100% of refund actions audited.
