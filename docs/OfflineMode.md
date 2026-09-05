# INFINEON — Offline Mode & Resilience

## Overview

INFINEON is designed for environments with **unstable internet connectivity** — particularly hotels across Africa. The system provides:

- **100% offline operation** for all core hotel functions
- **Automatic sync** when connectivity returns
- **Zero data loss** during network outages
- **Idempotent operations** to prevent duplicates

## Architecture

```
┌──────────────────────────────────────────┐
│         INFINEON (Local Server)          │
│                                          │
│   Go Binary (Single Executable)          │
│   ├── Serves React UI over HTTP          │
│   ├── Handles all API requests           │
│   ├── Embedded SQLite for offline queue  │
│   └── PostgreSQL for primary storage     │
│                                          │
│   ┌──────────────────────────────────┐   │
│   │ PostgreSQL (Primary Database)    │   │
│   │ All transactions happen locally  │   │
│   │ No internet required for CRUD    │   │
│   └──────────────────────────────────┘   │
│                                          │
│   ┌──────────────────────────────────┐   │
│   │ Sync Queue (SQLite WAL)          │   │
│   │ Outbound: POS orders to cloud    │   │
│   │ Inbound: OTA reservations        │   │
│   │ Resolves conflicts automatically │   │
│   └──────────────────────────────────┘   │
└──────────────────┬───────────────────────┘
                   │ (When Internet Returns)
                   ▼
┌──────────────────────────────────────────┐
│         INFINEON Cloud (Optional)        │
│   ├── License verification              │
│   ├── OTA reservation sync              │
│   ├── Channel manager updates           │
│   ├── Backup uploads                    │
│   └── Analytics aggregation             │
└──────────────────────────────────────────┘
```

## What Works Offline

| Feature | Offline? | Notes |
|---------|----------|-------|
| Check-in / Check-out | ✅ Full | All guest operations run locally |
| POS Orders | ✅ Full | Restaurant, bar, poolside — all work |
| Room Charges to Folio | ✅ Full | Charges post to local PostgreSQL |
| Night Audit | ✅ Full | Closes business day locally |
| Reservations (Direct) | ✅ Full | Created and managed locally |
| Guest Management | ✅ Full | Full CRUD on guest profiles |
| Housekeeping | ✅ Full | Room status, assignments |
| Inventory | ✅ Full | Stock, receiving, transfers |
| Finance & Accounting | ✅ Full | GL, AR/AP, P&L, budgets |
| HR & Payroll | ✅ Full | Employees, attendance, payroll |
| Reports | ✅ Full | All reports from local data |
| **OTA Reservations** | ⚠️ Queue | Queued; synced when online |
| **Channel Manager** | ⚠️ Queue | Rate/availability updates queued |
| **Email/SMS** | ⚠️ Queue | Queued; sent when online |
| **Cloud Backup** | ⚠️ Queue | Uploaded when online |
| **Payment Gateway** | ❌ Online | Card payments need connectivity |

## Sync Protocol

### Outbound Sync (Local → Cloud)

1. **Queue**: When a sync-relevant action occurs, a record is written to the `sync_wal` table
2. **Retry**: Background goroutine attempts sync every 30 seconds when online
3. **Confirm**: Cloud acknowledges receipt with a sync timestamp
4. **Acknowledge**: Local record marked as synced

### Inbound Sync (Cloud → Local)

1. **Poll**: When online, local server polls cloud every 5 minutes for new data
2. **Download**: Receives new OTA reservations, rate updates, channel messages
3. **Apply**: Data is applied to local PostgreSQL with conflict detection
4. **Acknowledge**: Cloud marks data as delivered

### Conflict Resolution

| Conflict Type | Resolution |
|---------------|------------|
| Same reservation modified locally and on OTA | **Local wins** (hotel operations priority) |
| Rate change from channel manager | **Cloud wins** (latest rate) |
| Guest profile updated both places | **Merge** (most recent field wins) |
| POS transaction | **No conflict** (always local) |

## Licensing

### Offline License Model

1. **On Activation**: Hotel receives a cryptographically signed license file
2. **License Contents**: Expiration date, seat count, property ID, feature flags
3. **Verification**: Go binary verifies Ed25519 signature using embedded public key
4. **Grace Period**: 14 days without internet before license re-verification required
5. **No Internet Ever**: System continues operating indefinitely with valid license

### License File Format

```json
{
  "license_id": "LIC-2024-XXXX",
  "property_id": "GPL",
  "property_name": "Grand Palm Hotel Lagos",
  "issued_at": "2024-01-15T00:00:00Z",
  "expires_at": "2025-01-15T00:00:00Z",
  "max_users": 50,
  "features": ["pms", "pos", "inventory", "finance", "hr", "crm"],
  "grace_days": 14,
  "signature": "base64-encoded-ed25519-signature"
}
```

## Backup & Recovery

### Automatic Backups

- **Full backup**: Every night at 2:00 AM (local time)
- **Incremental backup**: Every 4 hours
- **Retention**: 30 days local, 90 days cloud
- **Format**: PostgreSQL custom format (`pg_dump -Fc`)

### Backup Storage

1. **Local**: `/var/lib/infineon/backups/`
2. **Cloud** (when online): Encrypted upload to S3-compatible storage
3. **USB Export**: `infineon backup --export /mnt/usb/`

### Recovery

```bash
# Restore from backup
infineon restore /var/lib/infineon/backups/infineon_20240115_020000.dump

# Factory reset (creates backup first)
infineon reset --confirm

# Export backup to USB
infineon backup --export /media/usb/
```

## Performance

| Metric | Target | Notes |
|--------|--------|-------|
| Check-in time | < 3 seconds | Room assignment + folio creation |
| POS order creation | < 1 second | Including KOT generation |
| Night audit (50 rooms) | < 2 minutes | Full reconciliation |
| Report generation | < 5 seconds | Executive dashboard |
| Sync queue processing | Background | Non-blocking, prioritized |

## Hardware Requirements

### Minimum (50 rooms)
- **CPU**: 2 cores, 2 GHz
- **RAM**: 4 GB
- **Storage**: 50 GB SSD
- **Network**: None required (LAN only)
- **OS**: Ubuntu 22.04+, Debian 12+, Windows 10+ (WSL)

### Recommended (100+ rooms)
- **CPU**: 4 cores, 3 GHz
- **RAM**: 8 GB
- **Storage**: 200 GB SSD
- **Network**: LAN + 4G backup
- **UPS**: Recommended for power stability
