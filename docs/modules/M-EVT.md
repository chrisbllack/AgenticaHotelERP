# M-EVT — Events & Conference

**Main Module Code:** M-EVT · **Tier:** ◐ Differentiator · **ADR:** [ADR-0006](../ADR/0006-ModuleHierarchy.md)
**Packages:** P011 extension (housekeeping/setup orders), P012 (catering posts to POS/kitchen), P013 (requisitions & resources), P022 (consolidated reporting).

## Purpose
Sell, plan, execute, and bill meetings, conferences, weddings, and banquets —
from function diary to banquet event order (BEO) to catering production and
final invoicing — with venue capacity planning and resource logistics.

## Submodules

### `events/venues` — ◐ Differentiator
| Feature Set | Features |
|---|---|
| Space Management | Venue spaces & combos (dividable rooms) · capacity by layout (theater/U-shape/banquet/classroom) · setup & turnover times |
| Planning Aids | Floor-plan diagrams & setup templates · simultaneous-use calendar · place-card & seating utilities |

### `events/bookings` — ◐ Differentiator
| Feature Set | Features |
|---|---|
| Sales & Diary | Definite vs tentative bookings · function diary with conflict detection · probe/option holds · trace dates & follow-ups |
| Contracts | BEO documents with versioning & approval · event contracts & terms · cancellation ladders · deposit schedules & attrition tracking |
| Execution | Day-of event status board · change log · post-event review & rebill adjustments |

### `events/catering` — ◐ Differentiator
| Feature Set | Features |
|---|---|
| Menus & Packages | Catering menus & per-head packages · custom menus with costing · dietary/allergy handling |
| Production | Kitchen production sheets per event · requisition links to M-INV · consumption vs guarantee counts |
| Billing | Per-head, consumption, or hybrid billing · master account & sub-ledger splits · invoice to M-FIN AR |

### `events/av-resources` — ○ Premium
| Feature Set | Features |
|---|---|
| Equipment | AV & staging equipment inventory · internal vs external (vendor) resources · rental rates & damage waivers |
| Scheduling | Technician scheduling · setup/derig work orders · vendor contract links |

## Events Published
`event.created|confirmed|cancelled` · `event.billed` · `function_sheet.issued`

## Consumed Contracts
M-FNB kitchen production & menus · M-INV requisitions & equipment stock ·
M-LOD room blocks for event guests · M-FIN AR invoicing & deposits ·
M-PLT workflow (contract approvals).

## Key Non-Functional Targets
Diary conflict check < 200 ms · BEO versioning with full audit trail ·
event-day status board usable on tablets, fully offline.
