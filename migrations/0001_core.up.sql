-- 0001 Core: Extensions, Currencies, Countries, Sequences

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE currencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(3) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    decimal_places SMALLINT NOT NULL DEFAULT 2,
    exchange_rate NUMERIC(15,6) NOT NULL DEFAULT 1.0,
    is_base BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE countries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(2) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    phone_code VARCHAR(10),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE TABLE numbering_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    prefix VARCHAR(20) NOT NULL DEFAULT '',
    suffix VARCHAR(20) NOT NULL DEFAULT '',
    next_value INTEGER NOT NULL DEFAULT 1,
    padding_length SMALLINT NOT NULL DEFAULT 6,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    UNIQUE(property_id, entity_type)
);

-- Sync WAL for offline/online synchronization
CREATE TABLE sync_wal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    operation VARCHAR(20) NOT NULL,
    payload JSONB NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    property_id UUID NOT NULL,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    synced BOOLEAN NOT NULL DEFAULT FALSE,
    synced_at TIMESTAMPTZ,
    sync_attempts INTEGER NOT NULL DEFAULT 0,
    last_sync_error TEXT,
    cloud_conflict BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_sync_wal_unsynced ON sync_wal(synced, created_at) WHERE synced = FALSE;
CREATE INDEX idx_sync_wal_entity ON sync_wal(entity_type, entity_id);

CREATE TABLE sync_watermarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL UNIQUE,
    last_synced_wal_id UUID,
    last_synced_at TIMESTAMPTZ,
    total_synced BIGINT NOT NULL DEFAULT 0,
    total_conflicts BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
