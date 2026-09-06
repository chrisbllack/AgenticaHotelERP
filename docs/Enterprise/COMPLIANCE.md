# Compliance & Trust Baseline

> Status: Accepted · Owner: Security & Trust (M-SEC) · Related: ADR-0001, ADR-0006, `docs/Enterprise/INTEGRATION-CONTRACTS.md`

INFINEON targets hospitality-sector compliance across its markets. This
document is the engineering baseline — the controls each module must honor —
so certification is a matter of evidence collection, not retrofitting.

## PCI-DSS (SAQ-A posture for card handling)

1. **No card data storage.** Card data never touches INFINEON storage,
   logs, or events. The platform persists gateway tokens and masked PANs
   (last 4) only; tokenization happens inside the gateway (Paystack,
   Flutterwave, Moniepoint, OPay adapters).
2. **No PAN in URLs or logs.** Log scrubbers reject patterns matching PAN
   shapes in every handler; responses never echo card fields.
3. **TLS everywhere.** All gateway traffic is TLS 1.2+; on-premise LAN
   segments for payment devices are network-isolated.
4. **Split settlement reversals** (M-PRC) are audit-linked — a reversal
   references the original settlement id, user, and reason.

## GDPR / NDPR (Nigeria Data Protection Regulation)

| Requirement | Platform control | Owning module |
|---|---|---|
| Lawful basis & consent | Consent ledger per guest (marketing, profiling, cross-border) with timestamp and channel | M-CRM |
| Right of access | One-command guest data export across modules (profile, folios, stays, POS attribution) | M-CRM + M-BUS |
| Right to erasure | Anonymization workflow: PII fields nulled, financial records retained (legal basis), folios preserved with scrubbed guest identity | M-CRM + M-FIN |
| Data minimization | Only operational fields captured; passport/ID stored encrypted and purged on policy schedule | M-LOD + M-SEC |
| Breach notification | Audit trail + SIEM export gives the 72-hour evidence chain | M-SEC |

## ISO/IEC 27001 Alignment

- **Asset inventory** — hardware fleet registry (M-HDW) doubles as the asset
  register for Annex A physical controls.
- **Access control** — RBAC with property scoping, least privilege defaults,
  session re-evaluation on role change (`user.role_assigned` event).
- **Cryptography** — Ed25519 JWT signing, AES-GCM field encryption for
  ID documents and free-text guest notes, keys in local KMS with rotation
  policy; HSM custody in Flagship edition.
- **Operations security** — append-only audit trail, 7-year retention,
  time-synced (NTP) timestamps; capacity and backup monitoring surfaced in
  M-BUS operations views.

## Retention & Residency

| Data class | Retention | Notes |
|---|---|---|
| Financial records & folios | 7 years (statutory) | Immutable after night-audit roll; corrections via reversal entries |
| Audit trail | 7 years | Append-only, exportable to SIEM |
| Guest PII | Purpose-bound | Erasure workflow honors legal holds (financial) |
| CCTV/biometric templates | 30 days default | Property-configurable, consent-gated (M-HDW biometric devices) |

Residency and cross-property transfer rules are defined in
`docs/Enterprise/MULTI-PROPERTY.md`.

## Evidence & Attestation

1. Every control above maps to named audit events — compliance reports are
   generated from the platform audit trail, not manual logs.
2. Quarterly access reviews are a built-in M-PLT report (users × roles ×
   last-login × dormant accounts).
3. Payment gateway attestation letters and penetration test summaries attach
   to the license record per property.
