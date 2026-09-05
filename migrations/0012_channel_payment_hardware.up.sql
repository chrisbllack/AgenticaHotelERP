-- Channel Manager tables
CREATE TABLE IF NOT EXISTS channels (
    id SERIAL PRIMARY KEY,
    channel_name VARCHAR(100) NOT NULL,
    channel_type VARCHAR(50) NOT NULL DEFAULT 'ota',
    api_key TEXT,
    api_secret TEXT,
    property_code VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'inactive',
    last_sync_at TIMESTAMPTZ,
    sync_settings JSONB DEFAULT '{}',
    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS channel_room_mappings (
    id SERIAL PRIMARY KEY,
    channel_id INTEGER REFERENCES channels(id) ON DELETE CASCADE,
    channel_room_code VARCHAR(100) NOT NULL,
    local_room_type_id INTEGER REFERENCES room_types(id),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(channel_id, channel_room_code)
);

CREATE TABLE IF NOT EXISTS channel_rate_mappings (
    id SERIAL PRIMARY KEY,
    channel_id INTEGER REFERENCES channels(id) ON DELETE CASCADE,
    channel_rate_code VARCHAR(100) NOT NULL,
    local_rate_plan_id INTEGER,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    rate_adjustment DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(channel_id, channel_rate_code)
);

CREATE TABLE IF NOT EXISTS channel_sync_log (
    id SERIAL PRIMARY KEY,
    channel_id INTEGER REFERENCES channels(id) ON DELETE CASCADE,
    sync_type VARCHAR(50) NOT NULL,
    direction VARCHAR(10) NOT NULL DEFAULT 'outbound',
    status VARCHAR(20) NOT NULL DEFAULT 'success',
    items_synced INTEGER DEFAULT 0,
    items_failed INTEGER DEFAULT 0,
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_channel_sync_log_channel ON channel_sync_log(channel_id, created_at DESC);

-- Payment Gateway tables
CREATE TABLE IF NOT EXISTS payment_gateways (
    id SERIAL PRIMARY KEY,
    gateway_name VARCHAR(100) NOT NULL,
    gateway_type VARCHAR(50) NOT NULL, -- paystack, flutterwave, stripe, manual
    public_key TEXT,
    secret_key_encrypted TEXT,
    webhook_secret TEXT,
    test_mode BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    payment_reference VARCHAR(100) UNIQUE NOT NULL,
    folio_id INTEGER REFERENCES folios(id),
    reservation_id INTEGER REFERENCES reservations(id),
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
    method VARCHAR(50) NOT NULL,
    gateway VARCHAR(50),
    gateway_reference VARCHAR(200),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    guest_email VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    completed_at TIMESTAMPTZ,
    property_id INTEGER REFERENCES properties(id),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_folio ON payments(folio_id);
CREATE INDEX idx_payments_reference ON payments(payment_reference);
CREATE INDEX idx_payments_status ON payments(status);

CREATE TABLE IF NOT EXISTS refunds (
    id SERIAL PRIMARY KEY,
    payment_id INTEGER REFERENCES payments(id),
    amount DECIMAL(12,2) NOT NULL,
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    gateway_reference VARCHAR(200),
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hardware Integration tables
CREATE TABLE IF NOT EXISTS hardware_devices (
    id SERIAL PRIMARY KEY,
    device_type VARCHAR(50) NOT NULL, -- pos_terminal, door_lock, printer, scanner, biometric, cctv, tv, signage
    vendor VARCHAR(100) NOT NULL,
    model VARCHAR(100),
    serial_number VARCHAR(200),
    location VARCHAR(200),
    status VARCHAR(20) NOT NULL DEFAULT 'offline',
    firmware_version VARCHAR(50),
    ip_address INET,
    port INTEGER,
    settings JSONB DEFAULT '{}',
    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
    last_heartbeat TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hardware_device_type ON hardware_devices(device_type, status);
CREATE INDEX idx_hardware_device_property ON hardware_devices(property_id);

CREATE TABLE IF NOT EXISTS hardware_logs (
    id SERIAL PRIMARY KEY,
    device_type VARCHAR(50) NOT NULL,
    device_id INTEGER REFERENCES hardware_devices(id),
    command VARCHAR(100) NOT NULL,
    room_number VARCHAR(20),
    card_number VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'success',
    metadata JSONB DEFAULT '{}',
    property_id INTEGER REFERENCES properties(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_hardware_logs_property ON hardware_logs(property_id, created_at DESC);
CREATE INDEX idx_hardware_logs_type ON hardware_logs(device_type, created_at DESC);

-- Notification Engine tables
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    notification_type VARCHAR(50) NOT NULL, -- email, sms, push, in_app
    template_code VARCHAR(100) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    body TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    property_id INTEGER REFERENCES properties(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_status ON notifications(status, created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(notification_type, status);
