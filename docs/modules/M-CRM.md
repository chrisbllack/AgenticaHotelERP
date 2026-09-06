# M-CRM — Guest Experience & CRM

**Main Module Code:** M-CRM · **Tier:** ● Core · **ADR:** [ADR-0006](../ADR/0006-ModuleHierarchy.md)
**Packages:** P016 (CRM core), P004 (consent/PII platform hooks), P020 (AI guest insights).

## Purpose
Own the guest relationship across the whole journey: a single guest identity,
their stay and spend history, preferences and consent, loyalty value, targeted
campaigns, and every piece of feedback — turning one-time visitors into
repeat, direct-booking guests.

## Submodules

### `crm/guest-profiles` — ● Core
| Feature Set | Features |
|---|---|
| Guest 360 | Unified profile: stays, spends, folio history, complaints, preferences · VIP flags & trace codes · anniversaries & occasions |
| Data Quality | Duplicate detection & merge · enrichment hooks · document vault (ID, visa) with expiry alerts |
| Consent & Privacy | Marketing & channel consent records · do-not-contact lists · data-subject export/erasure workflow (GDPR/NDPR) |

### `crm/loyalty` — ◐ Differentiator
| Feature Set | Features |
|---|---|
| Program Design | Tiers & tier benefits · earning rules by stay, spend, outlet, or event · promo point multipliers |
| Ledger | Points ledger with expiry · redemption into folio (M-LOD) or outlet bills · partner earn/burn hooks |
| Governance | Downgrade & requalification · fraud watch (account sharing) · program cost accounting |

### `crm/campaigns` — ◐ Differentiator
| Feature Set | Features |
|---|---|
| Segmentation | Segments by RFM, stay behavior, preferences, geolocation · dynamic & saved segments |
| Execution | Email/SMS/WhatsApp templates (M-PLT delivery) · journey automation: pre-arrival, in-stay, post-stay, win-back · A/B testing |
| Measurement | Response & attribution tracking · conversion to direct bookings (M-DST link) · ROI per campaign |

### `crm/feedback` — ◐ Differentiator
| Feature Set | Features |
|---|---|
| Collection | Multi-channel surveys (post-stay email, in-stay QR, kiosk) · CSAT/NPS/verbatim capture |
| Resolution | Complaint-to-case workflow with SLA · service-recovery comp posting · root-cause tagging |
| Reputation | Online review aggregation (OTA & social) · sentiment summary · management response tracking |

## Events Published
`guest.created|updated|merged` · `loyalty.earned|redeemed` ·
`campaign.sent|converted` · `feedback.received|case_resolved`

## Consumed Contracts
M-LOD stay & folio facts · M-FNB/M-EVT spend facts · M-PLT notifications &
consent vault · M-BUS segmentation models · M-DST direct-booking attribution.

## Key Non-Functional Targets
Guest search < 300 ms across 1M profiles · profile merge preserves full audit
trail · consent enforcement is blocking (campaigns cannot contact non-consented guests).
