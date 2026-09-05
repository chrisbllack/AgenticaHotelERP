-- CRM / Guest Profiles
ALTER TABLE guests ADD COLUMN IF NOT EXISTS loyalty_tier VARCHAR(20) DEFAULT 'member';
ALTER TABLE guests ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS preferred_room_type VARCHAR(50);
ALTER TABLE guests ADD COLUMN IF NOT EXISTS preferred_floor VARCHAR(20);
ALTER TABLE guests ADD COLUMN IF NOT EXISTS preferred_bed VARCHAR(50);
ALTER TABLE guests ADD COLUMN IF NOT EXISTS food_preferences TEXT;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS allergies TEXT;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS special_occasions TEXT;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT FALSE;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS notes TEXT;

CREATE INDEX IF NOT EXISTS idx_guests_loyalty ON guests(loyalty_tier, loyalty_points DESC);

-- Loyalty Tiers Configuration
CREATE TABLE IF NOT EXISTS loyalty_tiers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    min_points INTEGER NOT NULL DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    benefits TEXT,
    color VARCHAR(20) DEFAULT '#6B7280',
    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Guest Feedback
CREATE TABLE IF NOT EXISTS guest_feedback (
    id SERIAL PRIMARY KEY,
    guest_id INTEGER REFERENCES guests(id),
    reservation_id INTEGER,
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    room_rating INTEGER CHECK (room_rating >= 1 AND room_rating <= 5),
    service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
    food_rating INTEGER CHECK (food_rating >= 1 AND food_rating <= 5),
    comments TEXT,
    would_recommend BOOLEAN DEFAULT TRUE,
    issues TEXT,
    status VARCHAR(20) DEFAULT 'new',
    property_id INTEGER REFERENCES properties(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_rating ON guest_feedback(overall_rating);
CREATE INDEX IF NOT EXISTS idx_feedback_property ON guest_feedback(property_id, created_at DESC);

-- Loyalty Points History
CREATE TABLE IF NOT EXISTS loyalty_points_log (
    id SERIAL PRIMARY KEY,
    guest_id INTEGER REFERENCES guests(id),
    points INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL, -- earned, redeemed, expired
    reason VARCHAR(200),
    reservation_id INTEGER,
    property_id INTEGER REFERENCES properties(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Events / Banqueting
CREATE TABLE IF NOT EXISTS venues (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    capacity INTEGER NOT NULL,
    hourly_rate DECIMAL(12,2) DEFAULT 0,
    daily_rate DECIMAL(12,2) DEFAULT 0,
    amenities TEXT,
    status VARCHAR(20) DEFAULT 'available',
    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    event_name VARCHAR(200) NOT NULL,
    client_name VARCHAR(200) NOT NULL,
    client_email VARCHAR(255),
    client_phone VARCHAR(50),
    venue_id INTEGER REFERENCES venues(id),
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    guest_count INTEGER DEFAULT 0,
    package VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'inquiry',
    total_amount DECIMAL(12,2) DEFAULT 0,
    deposit_paid DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    property_id INTEGER REFERENCES properties(id),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date, status);
CREATE INDEX IF NOT EXISTS idx_events_property ON events(property_id);

-- Night Audit Records (for audit trail)
CREATE TABLE IF NOT EXISTS night_audits (
    id SERIAL PRIMARY KEY,
    business_date DATE NOT NULL,
    room_charges_posted INTEGER DEFAULT 0,
    taxes_posted INTEGER DEFAULT 0,
    service_charges_posted INTEGER DEFAULT 0,
    revenues_calculated DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    property_id INTEGER REFERENCES properties(id),
    created_by INTEGER REFERENCES users(id),
    UNIQUE(business_date, property_id)
);
