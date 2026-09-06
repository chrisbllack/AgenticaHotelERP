# M-FIN — Finance & Accounting

**Main Module Code:** M-FIN · **Tier:** ● Core · **ADR:** [ADR-0006](../ADR/0006-ModuleHierarchy.md)
**Packages:** P014 (GL, AR, AP, banking, tax), P022 (multi-property consolidation).

## Purpose
Be the single source of financial truth. Every charge, payment, purchase, and
payroll result in the hotel ultimately posts here as double-entry journal
activity. Provides guest/city ledgers, payable control, cash and bank
management, fixed assets, and statutory tax compliance — with period integrity
and multi-currency support.

## Submodules

### `fin/general-ledger` — ● Core
| Feature Set | Features |
|---|---|
| Chart of Accounts | Account classes & hierarchy · property/account dimensions · account control (postable, cash-flow class) |
| Posting Engine | Double-entry validation (balanced batches only) · journal entry UI & import · recurring & reversing journals · allocation rules |
| Period Control | Accounting periods & soft-close checks · hard lock after close · year-end close & carry-forward |

### `fin/ar-invoicing` — ● Core
| Feature Set | Features |
|---|---|
| Ledgers | Guest ledger (per-folio) · city ledger (AR accounts) · deposits & advance deposits |
| Invoicing | Invoice designer & templates · credit notes · batch billing for groups/CBA · statements & aging (30/60/90) |
| Collections | Dunning letters & reminders · collector worklists · receipt allocation · bad-debt workflow |

### `fin/ap-purchasing` — ● Core
| Feature Set | Features |
|---|---|
| Supplier Invoices | Invoice entry against PO/GRN · credit notes & debits · approval routing (M-PLT) |
| Payments | Payment scheduling & runs · payment priority & holds · partial payments · supplier remittance advice |
| Control | AP aging & cash-requirement forecasts · duplicate-invoice detection · accruals & prepayments |

### `fin/cash-banking` — ◐ Differentiator
| Feature Set | Features |
|---|---|
| Cash Management | Cash draws & floats · cashier banks per shift · paid-outs · cash-up variance workflow |
| Banking | Bank account registry · manual & statement-based reconciliation · inter-account transfers |
| FX | Multi-currency transactions · revaluation & unrealized gain/loss · currency rounding rules |

### `fin/fixed-assets` — ○ Premium
| Feature Set | Features |
|---|---|
| Register | Asset categories & depreciation books · capitalization rules · component assets |
| Lifecycle | Depreciation runs (SL/DB/units) · revaluation & impairment · transfers & disposals with gain/loss |

### `fin/tax-compliance` — ◐ Differentiator
| Feature Set | Features |
|---|---|
| Tax Engine | Tax codes (VAT/WHT/service levy) · inclusive vs exclusive pricing · exemption certificates |
| Filing | Tax return workpapers & reports · withholding certificates · e-invoicing & fiscal-report hooks (per country adapter) |

## Events Published
`journal.posted` · `invoice.issued|paid` · `ap.invoice_approved|paid` ·
`bank.reconciled` · `period.closed` · `fx.revalued`

## Consumed Contracts
M-LOD folios (guest ledger posting) · M-FNB/M-EVT/M-DST revenue & cash ·
M-INV AP invoices & GRNs · M-PRC settlement batches · M-HR payroll GL posting ·
M-PLT workflow approvals & audit.

## Key Non-Functional Targets
All money as PostgreSQL NUMERIC — no float, ever · posting throughput ≥ 200
journal lines/s · period close checklist + audit trail · 7-year financial data
retention (M-PLT compliance).
