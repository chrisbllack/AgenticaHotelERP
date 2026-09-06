# Cross-Module Integration Contracts

> Status: Accepted · Owner: Architecture · Related: ADR-0003 (domain architecture), ADR-0006 (module hierarchy)

Every cross-module interaction is a **named contract** with an owning module
(the data owner), consumers, and a delivery guarantee. Modules never read
another module's tables directly; they consume events or call the owner's
service API. This is the catalog the enterprise feature specs reference.

## Event Contracts

Events are published on the platform event bus and are at-least-once with
idempotent consumers (key = event id + entity id + version).

| Contract | Producer | Key payload | Committed consumers |
|---|---|---|---|
| `reservation.created` | M-LOD Reservations | res id, room type, dates, source, VIP flag | M-DST (push to channel), M-BUS (forecast), M-CRM (profile timeline) |
| `reservation.checked_in` | M-LOD Front Desk | res id, room, stay id | M-LOD Housekeeping (room state), M-FIN (open folio), M-HDW (encode key) |
| `room.status_changed` | M-LOD Room Rack | room id, old/new status, reason | M-DST (availability), M-BUS (occupancy KPIs) |
| `room.out_of_order` | M-LOD Maintenance | room id, from, to | M-DST (pull from sale), M-BUS (OOO loss report) |
| `hk.task_completed` | M-LOD Housekeeping | task id, room, attendant | M-LOD Rack (vacant clean), M-HR (productivity) |
| `pos.order_closed` | M-FNB POS | order id, outlet, totals, tender | M-FIN (revenue posting), M-INV (recipe depletion), M-BUS (mix) |
| `stock.issued` / `stock.received` | M-INV Stores | product, store, qty, cost | M-FIN (cost of sales), M-BUS (valuation) |
| `po.approval_required` / `po.approved` | M-INV Purchasing | PO id, supplier, total | M-PLT (approval inbox), M-BUS (commitments) |
| `folio.charge_posted` / `folio.payment` | M-FIN Folios | folio id, type, amount, dept code | M-FIN GL (journal), M-BUS (AR aging) |
| `night_audit.rolled` | M-FIN Night Audit | business date, rollup totals | All revenue modules (day close), M-BUS (daily snapshot) |
| `channel.reservation_received` | M-DST Channel Mgr | channel, payload, mapping result | M-LOD Reservations (create/update) |
| `event.booking_confirmed` | M-EVT Diary | event id, venue, dates, covers | M-FNB (banquet catering), M-LOD (room block) |
| `payment.settled` | M-PRC Settlement | batch id, tender, gateway ref | M-FIN (recon), M-BUS (cash position) |
| `device.health_changed` | M-HDW Health | device id, status, diagnosis | M-BUS (alerts), M-PLT (ops log) |
| `loyalty.tier_changed` | M-CRM Loyalty | guest id, old/new tier | M-FIN (rate discounting), M-LOD (upgrade priority) |
| `user.role_assigned` | M-PLT IAM | user id, role, scope | M-SEC (session re-eval), M-BUS (audit) |

## Service Contracts (Synchronous)

| Contract | Owner | Called by | Guarantee |
|---|---|---|---|
| `FolioService.postCharge` | M-FIN | M-FNB (room charge), M-LOD (extras) | Transactional; emits folio event |
| `RateService.quote` | M-LOD | M-DST, M-EVT, M-CRM | Read-only, cacheable 60s |
| `InventoryService.reserve` | M-LOD | M-DST (hold), M-EVT (room block) | Pessimistic hold with TTL |
| `StockService.issue` | M-INV | M-FNB (kitchen/bar) | Transactional; batches allowed |
| `ApprovalService.submit` | M-PLT | M-INV (PO), M-FIN (journal > limit), M-HR (leave) | Workflow with SLA timers |
| `GuestProfileService.upsert` | M-CRM | M-LOD, M-DST, M-FNB | Dedupe on email/phone + fuzzy name |
| `LedgerService.settle` | M-PRC | M-FIN, M-FNB | Idempotent by gateway reference |

## Contract Rules

1. **One owner.** Each entity has exactly one owning module; all writes go
   through the owner, all notifications through its events.
2. **No shared tables.** Consumers project event payloads into their own
   read models; they never join across module schemas.
3. **Money is exact.** Every amount crossing a contract is decimal
   (NUMERIC/strings), never float — enforced by generated API types.
4. **Offline queueing.** Contracts consumed by the front desk, POS, and
   housekeeping must be durable-queued on the edge and replayed on
   reconnect, preserving the offline-first guarantee (ADR-0001).
5. **Versioned payloads.** Event schemas are versioned; consumers must
   tolerate unknown fields and versions one step behind.
