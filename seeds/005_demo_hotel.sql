-- Seed demo hotel data

-- Company
INSERT INTO companies (id, name, trading_name, code, country_id, timezone, default_currency_id)
SELECT uuid_generate_v4(), 'Demo Hotels Ltd', 'Demo Hotels', 'DEMO01',
    c.id, 'Africa/Lagos', cur.id
FROM countries c, currencies cur WHERE c.code = 'NG' AND cur.code = 'NGN';

-- Property
INSERT INTO properties (id, company_id, name, trading_name, code, city, state, country_id, phone, email, timezone, default_currency_id)
SELECT uuid_generate_v4(), comp.id, 'Demo Grand Hotel', 'Grand Hotel', 'GRH01',
    'Lagos', 'Lagos', c.id, '+234 801 234 5678', 'info@demohotel.com', 'Africa/Lagos', cur.id
FROM companies comp, countries c, currencies cur WHERE comp.code = 'DEMO01' AND c.code = 'NG' AND cur.code = 'NGN';

-- Building
INSERT INTO buildings (id, property_id, name, code)
SELECT uuid_generate_v4(), p.id, 'Main Building', 'MAIN'
FROM properties p WHERE p.code = 'GRH01';

-- Floors
INSERT INTO floors (id, building_id, property_id, name, number)
SELECT uuid_generate_v4(), b.id, b.property_id, 'Ground Floor', 0
FROM buildings b WHERE b.code = 'MAIN';

INSERT INTO floors (id, building_id, property_id, name, number)
SELECT uuid_generate_v4(), b.id, b.property_id, 'Floor 1', 1
FROM buildings b WHERE b.code = 'MAIN';

INSERT INTO floors (id, building_id, property_id, name, number)
SELECT uuid_generate_v4(), b.id, b.property_id, 'Floor 2', 2
FROM buildings b WHERE b.code = 'MAIN';

-- Room Types
INSERT INTO room_types (id, property_id, code, name, max_occupancy, adult_capacity, child_capacity, bed_configuration, base_rate)
SELECT uuid_generate_v4(), p.id, 'STD', 'Standard Room', 2, 2, 1, 'queen', 50000
FROM properties p WHERE p.code = 'GRH01';

INSERT INTO room_types (id, property_id, code, name, max_occupancy, adult_capacity, child_capacity, bed_configuration, base_rate)
SELECT uuid_generate_v4(), p.id, 'DLX', 'Deluxe Room', 3, 2, 1, 'king', 75000
FROM properties p WHERE p.code = 'GRH01';

INSERT INTO room_types (id, property_id, code, name, max_occupancy, adult_capacity, child_capacity, bed_configuration, base_rate)
SELECT uuid_generate_v4(), p.id, 'STE', 'Suite', 4, 2, 2, 'king+twin', 120000
FROM properties p WHERE p.code = 'GRH01';

INSERT INTO room_types (id, property_id, code, name, max_occupancy, adult_capacity, child_capacity, bed_configuration, base_rate)
SELECT uuid_generate_v4(), p.id, 'EXS', 'Executive Suite', 4, 2, 2, 'king', 180000
FROM properties p WHERE p.code = 'GRH01';

-- Rooms (10 Standard, 6 Deluxe, 3 Suite, 1 Executive)
-- Ground Floor: rooms 101-115
INSERT INTO rooms (id, property_id, room_type_id, building_id, floor_id, number, status)
SELECT uuid_generate_v4(), p.id, rt.id, b.id, f.id, '101', 'vacant_clean'
FROM properties p, room_types rt, buildings b, floors f
WHERE p.code = 'GRH01' AND rt.code = 'STD' AND b.code = 'MAIN' AND f.number = 0;

INSERT INTO rooms (id, property_id, room_type_id, building_id, floor_id, number, status)
SELECT uuid_generate_v4(), p.id, rt.id, b.id, f.id, '102', 'vacant_clean'
FROM properties p, room_types rt, buildings b, floors f
WHERE p.code = 'GRH01' AND rt.code = 'STD' AND b.code = 'MAIN' AND f.number = 0;

INSERT INTO rooms (id, property_id, room_type_id, building_id, floor_id, number, status)
SELECT uuid_generate_v4(), p.id, rt.id, b.id, f.id, '103', 'vacant_dirty'
FROM properties p, room_types rt, buildings b, floors f
WHERE p.code = 'GRH01' AND rt.code = 'STD' AND b.code = 'MAIN' AND f.number = 0;

INSERT INTO rooms (id, property_id, room_type_id, building_id, floor_id, number, status)
SELECT uuid_generate_v4(), p.id, rt.id, b.id, f.id, '104', 'vacant_clean'
FROM properties p, room_types rt, buildings b, floors f
WHERE p.code = 'GRH01' AND rt.code = 'STD' AND b.code = 'MAIN' AND f.number = 0;

INSERT INTO rooms (id, property_id, room_type_id, building_id, floor_id, number, status)
SELECT uuid_generate_v4(), p.id, rt.id, b.id, f.id, '105', 'vacant_clean'
FROM properties p, room_types rt, buildings b, floors f
WHERE p.code = 'GRH01' AND rt.code = 'STD' AND b.code = 'MAIN' AND f.number = 0;

-- Floor 1: rooms 201-215
INSERT INTO rooms (id, property_id, room_type_id, building_id, floor_id, number, status)
SELECT uuid_generate_v4(), p.id, rt.id, b.id, f.id, '201', 'vacant_clean'
FROM properties p, room_types rt, buildings b, floors f
WHERE p.code = 'GRH01' AND rt.code = 'STD' AND b.code = 'MAIN' AND f.number = 1;

INSERT INTO rooms (id, property_id, room_type_id, building_id, floor_id, number, status)
SELECT uuid_generate_v4(), p.id, rt.id, b.id, f.id, '202', 'occupied_clean'
FROM properties p, room_types rt, buildings b, floors f
WHERE p.code = 'GRH01' AND rt.code = 'STD' AND b.code = 'MAIN' AND f.number = 1;

INSERT INTO rooms (id, property_id, room_type_id, building_id, floor_id, number, status)
SELECT uuid_generate_v4(), p.id, rt.id, b.id, f.id, '203', 'vacant_clean'
FROM properties p, room_types rt, buildings b, floors f
WHERE p.code = 'GRH01' AND rt.code = 'DLX' AND b.code = 'MAIN' AND f.number = 1;

INSERT INTO rooms (id, property_id, room_type_id, building_id, floor_id, number, status)
SELECT uuid_generate_v4(), p.id, rt.id, b.id, f.id, '204', 'vacant_clean'
FROM properties p, room_types rt, buildings b, floors f
WHERE p.code = 'GRH01' AND rt.code = 'DLX' AND b.code = 'MAIN' AND f.number = 1;

INSERT INTO rooms (id, property_id, room_type_id, building_id, floor_id, number, status)
SELECT uuid_generate_v4(), p.id, rt.id, b.id, f.id, '205', 'out_of_order'
FROM properties p, room_types rt, buildings b, floors f
WHERE p.code = 'GRH01' AND rt.code = 'DLX' AND b.code = 'MAIN' AND f.number = 1;

-- Floor 2: rooms 301-310
INSERT INTO rooms (id, property_id, room_type_id, building_id, floor_id, number, status)
SELECT uuid_generate_v4(), p.id, rt.id, b.id, f.id, '301', 'vacant_clean'
FROM properties p, room_types rt, buildings b, floors f
WHERE p.code = 'GRH01' AND rt.code = 'DLX' AND b.code = 'MAIN' AND f.number = 2;

INSERT INTO rooms (id, property_id, room_type_id, building_id, floor_id, number, status)
SELECT uuid_generate_v4(), p.id, rt.id, b.id, f.id, '302', 'vacant_clean'
FROM properties p, room_types rt, buildings b, floors f
WHERE p.code = 'GRH01' AND rt.code = 'DLX' AND b.code = 'MAIN' AND f.number = 2;

INSERT INTO rooms (id, property_id, room_type_id, building_id, floor_id, number, status)
SELECT uuid_generate_v4(), p.id, rt.id, b.id, f.id, '303', 'occupied_dirty'
FROM properties p, room_types rt, buildings b, floors f
WHERE p.code = 'GRH01' AND rt.code = 'STE' AND b.code = 'MAIN' AND f.number = 2;

INSERT INTO rooms (id, property_id, room_type_id, building_id, floor_id, number, status)
SELECT uuid_generate_v4(), p.id, rt.id, b.id, f.id, '304', 'vacant_clean'
FROM properties p, room_types rt, buildings b, floors f
WHERE p.code = 'GRH01' AND rt.code = 'STE' AND b.code = 'MAIN' AND f.number = 2;

INSERT INTO rooms (id, property_id, room_type_id, building_id, floor_id, number, status)
SELECT uuid_generate_v4(), p.id, rt.id, b.id, f.id, '305', 'vacant_clean'
FROM properties p, room_types rt, buildings b, floors f
WHERE p.code = 'GRH01' AND rt.code = 'EXS' AND b.code = 'MAIN' AND f.number = 2;

-- Departments
INSERT INTO departments (property_id, name, code)
SELECT p.id, 'Front Office', 'FO' FROM properties p WHERE p.code = 'GRH01';

INSERT INTO departments (property_id, name, code)
SELECT p.id, 'Housekeeping', 'HK' FROM properties p WHERE p.code = 'GRH01';

INSERT INTO departments (property_id, name, code)
SELECT p.id, 'Food & Beverage', 'FNB' FROM properties p WHERE p.code = 'GRH01';

INSERT INTO departments (property_id, name, code)
SELECT p.id, 'Finance', 'FIN' FROM properties p WHERE p.code = 'GRH01';

INSERT INTO departments (property_id, name, code)
SELECT p.id, 'Maintenance', 'MNT' FROM properties p WHERE p.code = 'GRH01';

INSERT INTO departments (property_id, name, code)
SELECT p.id, 'Human Resources', 'HR' FROM properties p WHERE p.code = 'GRH01';

INSERT INTO departments (property_id, name, code)
SELECT p.id, 'Sales & Marketing', 'S&M' FROM properties p WHERE p.code = 'GRH01';

-- Admin user (password: admin123)
INSERT INTO users (id, name, email, password, status)
VALUES (uuid_generate_v4(), 'System Administrator', 'admin@demo.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'active');
