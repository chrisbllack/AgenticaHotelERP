-- 007: Demo Users
-- Password for all demo users: password
-- Bcrypt hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

DO $$
DECLARE
    prop_id UUID;
    user_id UUID;
BEGIN
    SELECT id INTO prop_id FROM properties WHERE code = 'DEMO-HOTEL' LIMIT 1;
    IF prop_id IS NULL THEN RETURN; END IF;

    -- System Administrator
    INSERT INTO users (id, name, email, password, status, phone) VALUES
    (uuid_generate_v4(), 'System Admin', 'admin@infineon.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'active', '+234-800-000-0001')
    RETURNING id INTO user_id;

    -- Assign user to property
    INSERT INTO user_property (user_id, property_id, is_primary) VALUES (user_id, prop_id, TRUE);

    -- General Manager
    INSERT INTO users (id, name, email, password, status, phone) VALUES
    (uuid_generate_v4(), 'James Okonkwo', 'gm@demo-hotel.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'active', '+234-801-000-0002')
    RETURNING id INTO user_id;
    INSERT INTO user_property (user_id, property_id, is_primary) VALUES (user_id, prop_id, FALSE);

    -- Front Office Manager
    INSERT INTO users (id, name, email, password, status, phone) VALUES
    (uuid_generate_v4(), 'Amina Bello', 'fom@demo-hotel.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'active', '+234-802-000-0003')
    RETURNING id INTO user_id;
    INSERT INTO user_property (user_id, property_id, is_primary) VALUES (user_id, prop_id, FALSE);

    -- Receptionist
    INSERT INTO users (id, name, email, password, status, phone) VALUES
    (uuid_generate_v4(), 'Chidinma Eze', 'reception@demo-hotel.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'active', '+234-803-000-0004')
    RETURNING id INTO user_id;
    INSERT INTO user_property (user_id, property_id, is_primary) VALUES (user_id, prop_id, FALSE);

    -- Restaurant Manager
    INSERT INTO users (id, name, email, password, status, phone) VALUES
    (uuid_generate_v4(), 'Emeka Nwosu', 'restmgr@demo-hotel.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'active', '+234-804-000-0005')
    RETURNING id INTO user_id;
    INSERT INTO user_property (user_id, property_id, is_primary) VALUES (user_id, prop_id, FALSE);

    -- Demo Guests
    INSERT INTO guests (id, first_name, last_name, email, phone, nationality, id_type, id_number, gender, company) VALUES
    (uuid_generate_v4(), 'Oluwaseun', 'Adeyemi', 'seun@email.com', '+234-901-234-5678', 'Nigerian', 'passport', 'A12345678', 'male', 'TechCorp Nigeria'),
    (uuid_generate_v4(), 'Fatima', 'Abdullahi', 'fatima@email.com', '+234-902-345-6789', 'Nigerian', 'national_id', 'NG-9876543', 'female', NULL),
    (uuid_generate_v4(), 'John', 'Smith', 'john@globaltravel.com', '+44-7911-123456', 'British', 'passport', 'GB9876543', 'male', 'Global Travel Inc'),
    (uuid_generate_v4(), 'Aisha', 'Mohammed', 'aisha@email.com', '+233-24-567-8901', 'Ghanaian', 'passport', 'GH5678901', 'female', NULL),
    (uuid_generate_v4(), 'David', 'Kimani', 'david@hospitality.co.ke', '+254-722-345-678', 'Kenyan', 'national_id', 'KE-1234567', 'male', 'Hospitality Kenya'),
    (uuid_generate_v4(), 'Fatou', 'Diallo', 'fatou@email.com', '+221-77-654-3210', 'Senegalese', 'passport', 'SN4321098', 'female', 'West Africa Tours');

    -- Demo Rate Plans
    INSERT INTO rate_plans (id, property_id, code, name, type, base_price, extra_adult_charge, extra_child_charge, is_active) VALUES
    (uuid_generate_v4(), prop_id, 'BAR', 'Best Available Rate', 'bar', 150.00, 25.00, 0.00, TRUE),
    (uuid_generate_v4(), prop_id, 'CORP', 'Corporate Rate', 'corporate', 120.00, 20.00, 0.00, TRUE),
    (uuid_generate_v4(), prop_id, 'GOVT', 'Government Rate', 'government', 100.00, 15.00, 0.00, TRUE),
    (uuid_generate_v4(), prop_id, 'WEEKEND', 'Weekend Special', 'promotional', 130.00, 20.00, 0.00, TRUE),
    (uuid_generate_v4(), prop_id, 'STAFF', 'Staff Rate', 'staff', 50.00, 0.00, 0.00, TRUE);

    -- Demo Market Segments
    INSERT INTO market_segments (property_id, name, code, is_active) VALUES
    (prop_id, 'Business', 'BIZ', TRUE),
    (prop_id, 'Leisure', 'LEIS', TRUE),
    (prop_id, 'Group', 'GRP', TRUE),
    (prop_id, 'Government', 'GOV', TRUE),
    (prop_id, 'OTA', 'OTA', TRUE);

    -- Demo Channels
    INSERT INTO channels (property_id, name, code, type, is_active) VALUES
    (prop_id, 'Direct', 'DIRECT', 'direct', TRUE),
    (prop_id, 'Booking.com', 'BOOKING', 'ota', TRUE),
    (prop_id, 'Expedia', 'EXPEDIA', 'ota', TRUE),
    (prop_id, 'Website', 'WEBSITE', 'booking_engine', TRUE),
    (prop_id, 'Walk-in', 'WALKIN', 'walk_in', TRUE);

END $$;
