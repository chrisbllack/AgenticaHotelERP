-- ============================================================
-- 0011_reports.up.sql — Reports & Analytics Module
-- ============================================================

-- ============================================================
-- REPORT SCHEDULES
-- ============================================================

CREATE TABLE IF NOT EXISTS report_schedules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_name     VARCHAR(200) NOT NULL,
    report_type     VARCHAR(50) NOT NULL, -- daily_sales, occupancy, revenue, financial, inventory, hr
    frequency       VARCHAR(20) NOT NULL, -- daily, weekly, monthly, quarterly
    day_of_week     INTEGER, -- 0=Sun, 6=Sat
    day_of_month    INTEGER,
    recipients      JSONB DEFAULT '[]'::jsonb,
    format          VARCHAR(10) DEFAULT 'pdf', -- pdf, excel, csv
    is_active       BOOLEAN DEFAULT TRUE,
    last_run_at     TIMESTAMPTZ,
    property_id     UUID NOT NULL REFERENCES properties(id),
    created_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SAVED REPORTS / FAVORITES
-- ============================================================

CREATE TABLE IF NOT EXISTS saved_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_name     VARCHAR(200) NOT NULL,
    report_type     VARCHAR(50) NOT NULL,
    parameters      JSONB DEFAULT '{}'::jsonb,
    user_id         UUID NOT NULL REFERENCES users(id),
    property_id     UUID NOT NULL REFERENCES properties(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DAILY REVENUE SUMMARY (Night Audit Output)
-- ============================================================

CREATE TABLE IF NOT EXISTS daily_revenue_summary (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_date   DATE NOT NULL,
    property_id     UUID NOT NULL REFERENCES properties(id),
    
    -- Room Revenue
    rooms_available INTEGER DEFAULT 0,
    rooms_occupied  INTEGER DEFAULT 0,
    rooms_complimentary INTEGER DEFAULT 0,
    rooms_house_use INTEGER DEFAULT 0,
    rooms_out_of_order INTEGER DEFAULT 0,
    occupancy_pct   DECIMAL(8,4) DEFAULT 0,
    adr             DECIMAL(15,4) DEFAULT 0, -- Average Daily Rate
    revpar          DECIMAL(15,4) DEFAULT 0, -- Revenue Per Available Room
    room_revenue    DECIMAL(15,4) DEFAULT 0,
    extra_person_charges DECIMAL(15,4) DEFAULT 0,
    room_tax        DECIMAL(15,4) DEFAULT 0,
    
    -- F&B Revenue
    restaurant_revenue DECIMAL(15,4) DEFAULT 0,
    bar_revenue     DECIMAL(15,4) DEFAULT 0,
    minibar_revenue DECIMAL(15,4) DEFAULT 0,
    fb_revenue      DECIMAL(15,4) DEFAULT 0,
    
    -- Other Revenue
    laundry_revenue DECIMAL(15,4) DEFAULT 0,
    spa_revenue     DECIMAL(15,4) DEFAULT 0,
    phone_revenue   DECIMAL(15,4) DEFAULT 0,
    transport_revenue DECIMAL(15,4) DEFAULT 0,
    other_revenue   DECIMAL(15,4) DEFAULT 0,
    
    -- Totals
    total_revenue   DECIMAL(15,4) DEFAULT 0,
    total_tax       DECIMAL(15,4) DEFAULT 0,
    total_service_charge DECIMAL(15,4) DEFAULT 0,
    
    -- Payments
    cash_received   DECIMAL(15,4) DEFAULT 0,
    card_received   DECIMAL(15,4) DEFAULT 0,
    bank_transfer   DECIMAL(15,4) DEFAULT 0,
    room_charge     DECIMAL(15,4) DEFAULT 0,
    credit_received DECIMAL(15,4) DEFAULT 0,
    total_received  DECIMAL(15,4) DEFAULT 0,
    
    -- AR
    ar_charges      DECIMAL(15,4) DEFAULT 0,
    ar_payments     DECIMAL(15,4) DEFAULT 0,
    
    -- Market Segments
    corporate_room_nights INTEGER DEFAULT 0,
    corporate_revenue DECIMAL(15,4) DEFAULT 0,
    ota_room_nights  INTEGER DEFAULT 0,
    ota_revenue     DECIMAL(15,4) DEFAULT 0,
    direct_room_nights INTEGER DEFAULT 0,
    direct_revenue  DECIMAL(15,4) DEFAULT 0,
    walk_in_room_nights INTEGER DEFAULT 0,
    walk_in_revenue DECIMAL(15,4) DEFAULT 0,
    
    -- Guest Metrics
    arrivals        INTEGER DEFAULT 0,
    departures      INTEGER DEFAULT 0,
    no_shows        INTEGER DEFAULT 0,
    cancellations   INTEGER DEFAULT 0,
    walk_ins        INTEGER DEFAULT 0,
    in_house_guests INTEGER DEFAULT 0,
    
    -- Audit
    audited         BOOLEAN DEFAULT FALSE,
    audited_by      UUID REFERENCES users(id),
    audited_at      TIMESTAMPTZ,
    
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_date, property_id)
);

CREATE INDEX IF NOT EXISTS idx_daily_revenue_date ON daily_revenue_summary(business_date);

-- ============================================================
-- AUDIT TRIGGERS (ensure immutable audit log)
-- ============================================================

CREATE OR REPLACE FUNCTION prevent_audit_update()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable and cannot be modified';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_immutable
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_update();

-- ============================================================
-- AUTO-UPDATE TIMESTAMPS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$
DECLARE
    t RECORD;
BEGIN
    FOR t IN
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
        AND table_name NOT LIKE 'audit_%'
        AND table_name != 'audit_logs'
    LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
            t.table_name, t.table_name
        );
    END LOOP;
END;
$$;
