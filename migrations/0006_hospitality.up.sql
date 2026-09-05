-- 0006 Hospitality: Room Types, Rooms, Amenities, Seasons, Rates, Guests, Reservations, Stays, Folios

CREATE TABLE room_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    max_occupancy SMALLINT NOT NULL DEFAULT 2,
    adult_capacity SMALLINT NOT NULL DEFAULT 2,
    child_capacity SMALLINT NOT NULL DEFAULT 1,
    bed_configuration VARCHAR(50),
    room_size NUMERIC(8,2),
    view VARCHAR(50),
    base_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
    min_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
    max_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_rate_id UUID,
    images JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    sort_order SMALLINT DEFAULT 0,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    UNIQUE(property_id, code)
);

CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    room_type_id UUID NOT NULL REFERENCES room_types(id),
    building_id UUID REFERENCES buildings(id),
    floor_id UUID REFERENCES floors(id),
    number VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'vacant_dirty',
    housekeeping_status VARCHAR(30) NOT NULL DEFAULT 'dirty',
    maintenance_status VARCHAR(30) NOT NULL DEFAULT 'operational',
    is_smoking BOOLEAN NOT NULL DEFAULT FALSE,
    amenities JSONB,
    interconnecting_room_id UUID REFERENCES rooms(id),
    status_changed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    UNIQUE(property_id, number)
);

CREATE INDEX idx_rooms_property ON rooms(property_id);
CREATE INDEX idx_rooms_type ON rooms(room_type_id);
CREATE INDEX idx_rooms_status ON rooms(status);

CREATE TABLE amenities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    category VARCHAR(50),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE TABLE room_amenities (
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    amenity_id UUID REFERENCES amenities(id) ON DELETE CASCADE,
    PRIMARY KEY (room_id, amenity_id)
);

CREATE TABLE room_type_amenities (
    room_type_id UUID REFERENCES room_types(id) ON DELETE CASCADE,
    amenity_id UUID REFERENCES amenities(id) ON DELETE CASCADE,
    PRIMARY KEY (room_type_id, amenity_id)
);

CREATE TABLE seasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    priority SMALLINT NOT NULL DEFAULT 0,
    color VARCHAR(20),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    CHECK (end_date >= start_date)
);

CREATE TABLE rate_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'bar',
    base_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    extra_adult_charge NUMERIC(12,2) NOT NULL DEFAULT 0,
    extra_child_charge NUMERIC(12,2) NOT NULL DEFAULT 0,
    meal_plan VARCHAR(50),
    tax_rate_id UUID,
    service_charge_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    cancellation_policy_id UUID,
    min_stay SMALLINT DEFAULT 1,
    max_stay SMALLINT,
    advance_booking_days SMALLINT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order SMALLINT DEFAULT 0,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    UNIQUE(property_id, code)
);

CREATE TABLE rate_plan_room_types (
    rate_plan_id UUID REFERENCES rate_plans(id) ON DELETE CASCADE,
    room_type_id UUID REFERENCES room_types(id) ON DELETE CASCADE,
    override_price NUMERIC(12,2),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (rate_plan_id, room_type_id)
);

CREATE TABLE rate_plan_dates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rate_plan_id UUID NOT NULL REFERENCES rate_plans(id) ON DELETE CASCADE,
    room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    availability SMALLINT NOT NULL DEFAULT -1,
    min_stay SMALLINT,
    max_stay SMALLINT,
    closed_to_arrival BOOLEAN NOT NULL DEFAULT FALSE,
    closed_to_departure BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    UNIQUE(rate_plan_id, room_type_id, date)
);

CREATE TABLE blackout_dates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    rate_plan_id UUID REFERENCES rate_plans(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE TABLE market_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    UNIQUE(property_id, code)
);

CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    type VARCHAR(50) NOT NULL,
    commission_rate NUMERIC(5,2) DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    UNIQUE(property_id, code)
);

CREATE TABLE corporate_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    credit_limit NUMERIC(15,2) DEFAULT 0,
    payment_terms_days SMALLINT DEFAULT 30,
    tax_id VARCHAR(100),
    rate_plan_id UUID REFERENCES rate_plans(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    UNIQUE(property_id, code)
);

CREATE TABLE travel_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    commission_rate NUMERIC(5,2) DEFAULT 0,
    credit_limit NUMERIC(15,2) DEFAULT 0,
    payment_terms_days SMALLINT DEFAULT 30,
    rate_plan_id UUID REFERENCES rate_plans(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    UNIQUE(property_id, code)
);

CREATE TABLE guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    nationality VARCHAR(100),
    country_id UUID REFERENCES countries(id),
    id_type VARCHAR(50),
    id_number VARCHAR(100),
    id_expiry DATE,
    date_of_birth DATE,
    gender VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    company VARCHAR(255),
    notes TEXT,
    marketing_consent BOOLEAN NOT NULL DEFAULT FALSE,
    blacklisted BOOLEAN NOT NULL DEFAULT FALSE,
    blacklist_reason TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_guests_email ON guests(email);
CREATE INDEX idx_guests_phone ON guests(phone);
CREATE INDEX idx_guests_name ON guests(last_name, first_name);

CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    confirmation_number VARCHAR(20) NOT NULL UNIQUE,
    guest_id UUID NOT NULL REFERENCES guests(id),
    rate_plan_id UUID NOT NULL REFERENCES rate_plans(id),
    room_type_id UUID NOT NULL REFERENCES room_types(id),
    room_id UUID REFERENCES rooms(id),
    arrival_date DATE NOT NULL,
    departure_date DATE NOT NULL,
    nights SMALLINT NOT NULL,
    adults SMALLINT NOT NULL DEFAULT 1,
    children SMALLINT NOT NULL DEFAULT 0,
    room_count SMALLINT NOT NULL DEFAULT 1,
    source VARCHAR(50) NOT NULL,
    market_segment_id UUID REFERENCES market_segments(id),
    channel_id UUID REFERENCES channels(id),
    corporate_account_id UUID REFERENCES corporate_accounts(id),
    travel_agent_id UUID REFERENCES travel_agents(id),
    status VARCHAR(30) NOT NULL DEFAULT 'inquiry',
    deposit_amount NUMERIC(12,2) DEFAULT 0,
    deposit_paid NUMERIC(12,2) DEFAULT 0,
    total_estimated NUMERIC(12,2) DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    exchange_rate NUMERIC(15,6) NOT NULL DEFAULT 1,
    special_requests TEXT,
    internal_notes TEXT,
    is_vip BOOLEAN NOT NULL DEFAULT FALSE,
    vip_level VARCHAR(20),
    is_complimentary BOOLEAN NOT NULL DEFAULT FALSE,
    is_house_use BOOLEAN NOT NULL DEFAULT FALSE,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES users(id),
    no_show BOOLEAN NOT NULL DEFAULT FALSE,
    no_show_at TIMESTAMPTZ,
    parent_reservation_id UUID REFERENCES reservations(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    CHECK (departure_date > arrival_date),
    CHECK (nights > 0),
    CHECK (adults > 0)
);

CREATE INDEX idx_reservations_property ON reservations(property_id);
CREATE INDEX idx_reservations_guest ON reservations(guest_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_dates ON reservations(arrival_date, departure_date);
CREATE INDEX idx_reservations_room ON reservations(room_id);
CREATE INDEX idx_reservations_confirmation ON reservations(confirmation_number);

CREATE TABLE reservation_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,
    reason TEXT,
    changed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE reservation_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE TABLE guest_stays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID NOT NULL REFERENCES reservations(id),
    property_id UUID NOT NULL REFERENCES properties(id),
    guest_id UUID NOT NULL REFERENCES guests(id),
    room_id UUID NOT NULL REFERENCES rooms(id),
    actual_arrival TIMESTAMPTZ,
    actual_departure TIMESTAMPTZ,
    expected_departure DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'reserved',
    is_vip BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE INDEX idx_guest_stays_property ON guest_stays(property_id);
CREATE INDEX idx_guest_stays_room ON guest_stays(room_id);
CREATE INDEX idx_guest_stays_status ON guest_stays(status);

CREATE TABLE folios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_stay_id UUID NOT NULL REFERENCES guest_stays(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id),
    folio_number VARCHAR(20) NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'main',
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    balance NUMERIC(15,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    UNIQUE(property_id, folio_number)
);

CREATE TABLE folio_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    folio_id UUID NOT NULL REFERENCES folios(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id),
    type VARCHAR(20) NOT NULL,
    charge_code VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    quantity NUMERIC(8,2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    amount NUMERIC(12,2) NOT NULL,
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_rate_id UUID,
    reference_type VARCHAR(255),
    reference_id UUID,
    business_date DATE NOT NULL,
    posted_by UUID REFERENCES users(id),
    is_voided BOOLEAN NOT NULL DEFAULT FALSE,
    voided_by UUID REFERENCES users(id),
    voided_at TIMESTAMPTZ,
    void_reason TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);

CREATE INDEX idx_folio_lines_folio ON folio_lines(folio_id);
CREATE INDEX idx_folio_lines_business_date ON folio_lines(business_date);

-- Auto-update folio balance on line changes
CREATE OR REPLACE FUNCTION update_folio_balance()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE folios SET balance = (
        SELECT COALESCE(SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END), 0)
             - COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0)
        FROM folio_lines
        WHERE folio_id = COALESCE(NEW.folio_id, OLD.folio_id)
        AND is_voided = FALSE
    ), updated_at = NOW()
    WHERE id = COALESCE(NEW.folio_id, OLD.folio_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_folio_balance
    AFTER INSERT OR UPDATE OR DELETE ON folio_lines
    FOR EACH ROW
    EXECUTE FUNCTION update_folio_balance();

CREATE TABLE registration_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_stay_id UUID NOT NULL REFERENCES guest_stays(id) ON DELETE CASCADE,
    signature_data TEXT,
    id_type VARCHAR(50),
    id_number VARCHAR(100),
    id_expiry DATE,
    id_document_path VARCHAR(255),
    signed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
);

CREATE TABLE key_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_stay_id UUID NOT NULL REFERENCES guest_stays(id),
    room_id UUID NOT NULL REFERENCES rooms(id),
    card_number VARCHAR(100),
    encoded_at TIMESTAMPTZ,
    expiry_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    encoded_by UUID REFERENCES users(id),
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
);

CREATE INDEX idx_key_cards_guest_stay ON key_cards(guest_stay_id);
CREATE INDEX idx_key_cards_room ON key_cards(room_id);
