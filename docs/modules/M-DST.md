# M-DST — Distribution & Commerce

**Main Module Code:** M-DST · **Tier:** ◐ Differentiator · **ADR:** [ADR-0006](../ADR/0006-ModuleHierarchy.md)
**Packages:** P017 (channel manager, booking engine, payments link), P009 (rate/availability contracts), P023 (multi-property distribution).

## Purpose
Sell rooms and events beyond the front desk: push rates and availability to
OTAs and GDS, run a fast direct booking engine, and manage corporate
contracts and group business — while keeping local operation authoritative
when the internet is down.

## Submodules

### `dst/channel-manager` — ◐ Differentiator
| Feature Set | Features |
|---|---|
| Connectivity | OTA/GDS/wholesaler connectors via adapter pattern · per-channel mapping of room types & rate plans · push/pull models |
| ARI Control | Rate, availability, restriction push · stop-sell & yield alignment · per-channel parity rules & floor rates |
| Reservations | Inbound reservation import with dedupe · modification/cancellation sync · reconciliation & discrepancy report |

### `dst/booking-engine` — ◐ Differentiator
| Feature Set | Features |
|---|---|
| Shopping | Public availability search · rate shopping & best-rate display · multi-room search · multi-property search (P023) |
| Conversion | Themed booking flow · promo & corporate codes · upsell/add-on offers (airport transfer, flowers, early check-in) · cart-abandonment capture |
| Trust & Safety | PCI-safe tokenized capture (M-PRC) · bot/rate-scraping controls · accessible, mobile-first UX · cancellation-policy transparency |

### `dst/corporate-groups` — ◐ Differentiator
| Feature Set | Features |
|---|---|
| Contracts | Company profiles & negotiated rate agreements · validity & volume commitments · crew & long-stay rates · dynamic negotiated rates |
| Group Sales | RFP inbox & quote builder · group blocks with pickup (M-LOD) · meeting-space attach (M-EVT) · group considerations & cut-offs |
| Billing | Central billing accounts (CBA) · individual-bill rules · monthly consolidated invoicing (M-FIN AR) |

## Events Published
`channel.reservation_received|cancelled` · `ari.updated` ·
`booking.confirmed|abandoned` · `contract.negotiated` ·
`group.block_created|picked_up`

## Consumed Contracts
M-LOD rates & availability (authoritative source) · M-LOD reservation creation
for inbound channel/booking-engine sales · M-PRC payment capture ·
M-PLT config & notifications.

## Offline Behavior
Channel sync and the booking engine require internet; all inbound traffic
queues in the sync WAL and applies with **local-wins** conflict policy for
reservations and **cloud-wins** for rates (see [OfflineMode](../OfflineMode.md)).

## Key Non-Functional Targets
ARI push to channels < 60 s after change · booking search < 1.5 s p95 ·
zero double-booking via availability reservations with row-level locking ·
discrepancy report produced per channel per day.
