-- ============================================================
-- 008_comprehensive_demo.sql — Full Demo Data for 50-Room African Hotel
-- ============================================================
-- Creates: 50 rooms across 5 room types, 20 guests, 15 reservations,
-- 3 outlets with menus, 30 inventory products, 15 employees, chart of accounts

-- ============================================================
-- ORGANIZATION & PROPERTY
-- ============================================================

-- Ensure demo organization exists
INSERT INTO organizations (id, name, code, is_active) VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Grand Palm Hotels Ltd', 'GPH', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO companies (id, name, code, organization_id) VALUES
    ('b0000000-0000-0000-0000-000000000001', 'Grand Palm Hotels Ltd', 'GPH', 'a0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO properties (id, name, code, company_id, address, city, state, country, phone, email, currency_code, timezone) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'Grand Palm Hotel Lagos', 'GPL',
     'b0000000-0000-0000-0000-000000000001',
     '12 Admiralty Way, Lekki Phase 1', 'Lagos', 'Lagos State', 'Nigeria',
     '+234 1 271 0000', 'info@grandpalmlagos.com', 'NGN', 'Africa/Lagos')
ON CONFLICT (id) DO NOTHING;

-- Departments
INSERT INTO departments (id, name, code, property_id) VALUES
    ('d0000000-0000-0000-0000-000000000001', 'Front Office', 'FO', 'c0000000-0000-0000-0000-000000000001'),
    ('d0000000-0000-0000-0000-000000000002', 'Housekeeping', 'HK', 'c0000000-0000-0000-0000-000000000001'),
    ('d0000000-0000-0000-0000-000000000003', 'Food & Beverage', 'FB', 'c0000000-0000-0000-0000-000000000001'),
    ('d0000000-0000-0000-0000-000000000004', 'Finance', 'FIN', 'c0000000-0000-0000-0000-000000000001'),
    ('d0000000-0000-0000-0000-000000000005', 'Human Resources', 'HR', 'c0000000-0000-0000-0000-000000000001'),
    ('d0000000-0000-0000-0000-000000000006', 'Engineering', 'ENG', 'c0000000-0000-0000-0000-000000000001'),
    ('d0000000-0000-0000-0000-000000000007', 'Security', 'SEC', 'c0000000-0000-0000-0000-000000000001'),
    ('d0000000-0000-0000-0000-000000000008', 'Procurement', 'PROC', 'c0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- BUILDINGS & FLOORS
-- ============================================================

INSERT INTO buildings (id, name, code, property_id) VALUES
    ('e0000000-0000-0000-0000-000000000001', 'Main Building', 'MB', 'c0000000-0000-0000-0000-000000000001'),
    ('e0000000-0000-0000-0000-000000000002', 'Annex', 'AN', 'c0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO floors (id, name, code, building_id, sort_order, property_id) VALUES
    ('f0000000-0000-0000-0000-000000000001', 'Ground Floor', 'GF', 'e0000000-0000-0000-0000-000000000001', 1, 'c0000000-0000-0000-0000-000000000001'),
    ('f0000000-0000-0000-0000-000000000002', 'First Floor', '1F', 'e0000000-0000-0000-0000-000000000001', 2, 'c0000000-0000-0000-0000-000000000001'),
    ('f0000000-0000-0000-0000-000000000003', 'Second Floor', '2F', 'e0000000-0000-0000-0000-000000000001', 3, 'c0000000-0000-0000-0000-000000000001'),
    ('f0000000-0000-0000-0000-000000000004', 'Third Floor', '3F', 'e0000000-0000-0000-0000-000000000001', 4, 'c0000000-0000-0000-0000-000000000001'),
    ('f0000000-0000-0000-0000-000000000005', 'Annex Floor', 'AF', 'e0000000-0000-0000-0000-000000000002', 1, 'c0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ROOM TYPES (5 types for a Lagos hotel)
-- ============================================================

INSERT INTO room_types (id, code, name, description, max_occupancy, adult_capacity, child_capacity, bed_configuration, base_rate, min_rate, max_rate, currency_code, property_id) VALUES
    ('rt000000-0000-0000-0000-000000000001', 'STD', 'Standard Room', 'Comfortable room with city view, perfect for business travelers', 2, 2, 1, '1 Queen Bed', 35000, 25000, 50000, 'NGN', 'c0000000-0000-0000-0000-000000000001'),
    ('rt000000-0000-0000-0000-000000000002', 'DLX', 'Deluxe Room', 'Spacious room with premium amenities and garden view', 3, 2, 1, '1 King Bed', 55000, 40000, 80000, 'NGN', 'c0000000-0000-0000-0000-000000000001'),
    ('rt000000-0000-0000-0000-000000000003', 'EXE', 'Executive Suite', 'Luxury suite with separate living area and work desk', 4, 3, 1, '1 King Bed + Sofa', 85000, 65000, 120000, 'NGN', 'c0000000-0000-0000-0000-000000000001'),
    ('rt000000-0000-0000-0000-000000000004', 'PRS', 'Presidential Suite', 'Top-floor suite with panoramic views, private kitchen, butler service', 6, 4, 2, '2 King Beds + Living Room', 250000, 180000, 400000, 'NGN', 'c0000000-0000-0000-0000-000000000001'),
    ('rt000000-0000-0000-0000-000000000005', 'TWN', 'Twin Room', 'Room with two single beds, ideal for colleagues sharing', 2, 2, 0, '2 Single Beds', 35000, 25000, 50000, 'NGN', 'c0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ROOMS (50 rooms: 20 Standard, 15 Deluxe, 8 Executive, 2 Presidential, 5 Twin)
-- ============================================================

-- Standard Rooms (101-120, Floor GF/1F)
INSERT INTO rooms (id, number, room_type_id, floor_id, building_id, status, housekeeping_status, property_id)
SELECT gen_random_uuid(), num, 'rt000000-0000-0000-0000-000000000001',
    CASE WHEN n <= 10 THEN 'f0000000-0000-0000-0000-000000000001' ELSE 'f0000000-0000-0000-0000-000000000002' END,
    'e0000000-0000-0000-0000-000000000001',
    CASE WHEN n <= 15 THEN 'vacant_clean' ELSE 'vacant_dirty' END,
    CASE WHEN n <= 12 THEN 'clean' ELSE 'dirty' END,
    'c0000000-0000-0000-0000-000000000001'
FROM generate_series(1, 20) AS n,
     LATERAL (SELECT (100 + n)::text AS num) sub
ON CONFLICT DO NOTHING;

-- Deluxe Rooms (201-215, Floor 2F)
INSERT INTO rooms (id, number, room_type_id, floor_id, building_id, status, housekeeping_status, property_id)
SELECT gen_random_uuid(), (200 + n)::text, 'rt000000-0000-0000-0000-000000000002',
    'f0000000-0000-0000-0000-000000000003',
    'e0000000-0000-0000-0000-000000000001',
    CASE WHEN n <= 3 THEN 'occupied_clean' WHEN n <= 10 THEN 'vacant_clean' ELSE 'vacant_dirty' END,
    CASE WHEN n <= 3 THEN 'occupied_dirty' WHEN n <= 10 THEN 'clean' ELSE 'dirty' END,
    'c0000000-0000-0000-0000-000000000001'
FROM generate_series(1, 15) AS n
ON CONFLICT DO NOTHING;

-- Executive Suites (301-308, Floor 3F)
INSERT INTO rooms (id, number, room_type_id, floor_id, building_id, status, housekeeping_status, property_id)
SELECT gen_random_uuid(), (300 + n)::text, 'rt000000-0000-0000-0000-000000000003',
    'f0000000-0000-0000-0000-000000000004',
    'e0000000-0000-0000-0000-000000000001',
    CASE WHEN n <= 2 THEN 'occupied_clean' WHEN n <= 6 THEN 'vacant_clean' ELSE 'out_of_order' END,
    CASE WHEN n <= 2 THEN 'occupied_dirty' WHEN n <= 6 THEN 'clean' ELSE 'maintenance' END,
    'c0000000-0000-0000-0000-000000000001'
FROM generate_series(1, 8) AS n
ON CONFLICT DO NOTHING;

-- Presidential Suites (401-402, Floor 3F)
INSERT INTO rooms (id, number, room_type_id, floor_id, building_id, status, housekeeping_status, property_id)
VALUES
    (gen_random_uuid(), '401', 'rt000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000001', 'occupied_clean', 'occupied_dirty', 'c0000000-0000-0000-0000-000000000001'),
    (gen_random_uuid(), '402', 'rt000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000001', 'vacant_clean', 'clean', 'c0000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Twin Rooms (501-505, Annex)
INSERT INTO rooms (id, number, room_type_id, floor_id, building_id, status, housekeeping_status, property_id)
SELECT gen_random_uuid(), (500 + n)::text, 'rt000000-0000-0000-0000-000000000005',
    'f0000000-0000-0000-0000-000000000005',
    'e0000000-0000-0000-0000-000000000002',
    'vacant_clean', 'clean',
    'c0000000-0000-0000-0000-000000000001'
FROM generate_series(1, 5) AS n
ON CONFLICT DO NOTHING;

-- ============================================================
-- GUESTS (20 Nigerian & African guests)
-- ============================================================

INSERT INTO guests (id, first_name, last_name, email, phone, nationality, id_type, id_number, date_of_birth, gender, address, city, country, company_name) VALUES
    ('g0000000-0000-0000-0000-000000000001', 'Chukwuemeka', 'Okonkwo', 'emeka.okonkwo@nnpcgroup.com', '+234 803 123 4567', 'Nigerian', 'passport', 'A12345678', '1985-03-15', 'male', '15 Victoria Island', 'Lagos', 'Nigeria', 'NNPC Ltd'),
    ('g0000000-0000-0000-0000-000000000002', 'Aisha', 'Abdullahi', 'aisha.a@stanbicibtc.com', '+234 802 234 5678', 'Nigerian', 'national_id', 'NGA123456', '1990-07-22', 'female', '22 Marina Road', 'Lagos', 'Nigeria', 'Stanbic IBTC'),
    ('g0000000-0000-0000-0000-000000000003', 'Kwame', 'Mensah', 'kwame.m@vodafone.com.gh', '+233 24 345 6789', 'Ghanaian', 'passport', 'GH9876543', '1988-11-03', 'male', '14 Oxford Street, Osu', 'Accra', 'Ghana', 'Vodafone Ghana'),
    ('g0000000-0000-0000-0000-000000000004', 'Fatima', 'Hassan', 'fatima.h@safaricom.co.ke', '+254 722 345 678', 'Kenyan', 'national_id', 'KEN654321', '1992-05-18', 'female', '8 Westlands Road', 'Nairobi', 'Kenya', 'Safaricom'),
    ('g0000000-0000-0000-0000-000000000005', 'Olumide', 'Adeyemi', 'olumide@ltngas.com', '+234 806 456 7890', 'Nigerian', 'drivers_license', 'DL/LA/12345', '1982-01-30', 'male', '5 GRA Ikeja', 'Lagos', 'Nigeria', 'NLNG'),
    ('g0000000-0000-0000-0000-000000000006', 'Ngozi', 'Ibrahim', 'ngozi.i@gtbank.com', '+234 809 567 8901', 'Nigerian', 'passport', 'B23456789', '1987-09-12', 'female', '33 Adeola Odeku', 'Lagos', 'Nigeria', 'GTBank'),
    ('g0000000-0000-0000-0000-000000000007', 'Ahmed', 'Bello', 'ahmed.b@shell.com.ng', '+234 805 678 9012', 'Nigerian', 'passport', 'C34567890', '1980-06-25', 'male', '10 Trans-Amadi', 'Port Harcourt', 'Nigeria', 'Shell Nigeria'),
    ('g0000000-0000-0000-0000-000000000008', 'Thandiwe', 'Dlamini', 'thandiwe.d@mtn.com', '+27 82 345 6789', 'South African', 'passport', 'ZA1234567', '1991-02-14', 'female', '20 Sandton Drive', 'Johannesburg', 'South Africa', 'MTN South Africa'),
    ('g0000000-0000-0000-0000-000000000009', 'David', 'Obi', 'david.obi@dangote.com', '+234 801 789 0123', 'Nigerian', 'national_id', 'NGA789012', '1978-12-08', 'male', '1 Lekki-Epe Expressway', 'Lagos', 'Nigeria', 'Dangote Group'),
    ('g0000000-0000-0000-0000-000000000010', 'Blessing', 'Eze', 'blessing.eze@pwc.com', '+234 807 890 1234', 'Nigerian', 'passport', 'D45678901', '1993-04-20', 'female', '14 Broad Street', 'Lagos', 'Nigeria', 'PwC Nigeria'),
    ('g0000000-0000-0000-0000-000000000011', 'Samuel', 'Kipchoge', 'samuel.k@equitybank.co.ke', '+254 733 456 789', 'Kenyan', 'national_id', 'KEN789012', '1986-08-17', 'male', '5 Kenyatta Avenue', 'Nairobi', 'Kenya', 'Equity Bank'),
    ('g0000000-0000-0000-0000-000000000012', 'Chinwe', 'Okafor', 'chinwe.o@accessbank.com', '+234 803 901 2345', 'Nigerian', 'passport', 'E56789012', '1994-10-05', 'female', '9 Marina', 'Lagos', 'Nigeria', 'Access Bank'),
    ('g0000000-0000-0000-0000-000000000013', 'Youssef', 'Benali', 'youssef.b@airtel.com', '+225 07 123 4567', 'Ivorian', 'passport', 'CI3456789', '1989-07-11', 'male', '12 Cocody Riviera', 'Abidjan', 'Côte d''Ivoire', 'Airtel Africa'),
    ('g0000000-0000-0000-0000-000000000014', 'Grace', 'Nantongo', 'grace.n@stanbic.co.ug', '+256 772 567 890', 'Ugandan', 'passport', 'UG4567890', '1991-01-28', 'female', '4 Nile Avenue', 'Kampala', 'Uganda', 'Stanbic Uganda'),
    ('g0000000-0000-0000-0000-000000000015', 'Ibrahim', 'Musa', 'ibrahim.m@jumia.com', '+234 804 012 3456', 'Nigerian', 'national_id', 'NGA345678', '1984-03-03', 'male', '27 Yaba Road', 'Lagos', 'Nigeria', 'Jumia Group'),
    ('g0000000-0000-0000-0000-000000000016', 'Amara', 'Osei', 'amara.o@absa.com', '+233 50 678 9012', 'Ghanaian', 'passport', 'GH5678901', '1995-06-14', 'female', '7 Independence Ave', 'Accra', 'Ghana', 'Absa Bank Ghana'),
    ('g0000000-0000-0000-0000-000000000017', 'Emeka', 'Uche', 'emeka.u@intels.com', '+234 806 123 4567', 'Nigerian', 'passport', 'F67890123', '1983-09-09', 'male', '20 Onne Road', 'Port Harcourt', 'Nigeria', 'Intels Nigeria'),
    ('g0000000-0000-0000-0000-000000000018', 'Zainab', 'Aliyu', 'zainab.a@fcmb.com', '+234 802 234 5679', 'Nigerian', 'national_id', 'NGA901234', '1996-12-01', 'female', '14 Marina', 'Lagos', 'Nigeria', 'FCMB'),
    ('g0000000-0000-0000-0000-000000000019', 'Patrick', 'Kamau', 'patrick.k@deloitte.com', '+254 711 678 901', 'Kenyan', 'passport', 'KE9012345', '1981-04-16', 'male', '30 Westlands', 'Nairobi', 'Kenya', 'Deloitte Kenya'),
    ('g0000000-0000-0000-0000-000000000020', 'Funke', 'Adeleke', 'funke.a@toyota.com', '+234 805 345 6789', 'Nigerian', 'passport', 'G78901234', '1990-08-22', 'female', '5 Oshodi Expressway', 'Lagos', 'Nigeria', 'Toyota Nigeria')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RESERVATIONS (15 mix of statuses)
-- ============================================================

-- Checked-in guests (today)
INSERT INTO reservations (id, confirmation_no, guest_id, room_type_id, arrival_date, departure_date, adults, children, status, rate_plan, total_amount, deposit_amount, source, payment_method, property_id, notes)
SELECT gen_random_uuid(),
    'RSH' || lpad(g::text, 5, '0'),
    (ARRAY['g0000000-0000-0000-0000-000000000001','g0000000-0000-0000-0000-000000000003',
            'g0000000-0000-0000-0000-000000000005','g0000000-0000-0000-0000-000000000008',
            'g0000000-0000-0000-0000-000000000009','g0000000-0000-0000-0000-000000000011',
            'g0000000-0000-0000-0000-000000000019'])[g],
    (ARRAY['rt000000-0000-0000-0000-000000000002','rt000000-0000-0000-0000-000000000003',
            'rt000000-0000-0000-0000-000000000001','rt000000-0000-0000-0000-000000000003',
            'rt000000-0000-0000-0000-000000000004','rt000000-0000-0000-0000-000000000002',
            'rt000000-0000-0000-0000-000000000001'])[g],
    CURRENT_DATE - (g % 2),
    CURRENT_DATE + (4 - g % 3),
    2, 0, 'checked_in',
    (ARRAY['corporate','bar','bar','executive','presidential','corporate','ota'])[g],
    (ARRAY[110000, 170000, 70000, 170000, 500000, 110000, 70000])[g],
    (ARRAY[55000, 85000, 35000, 85000, 250000, 55000, 35000])[g],
    (ARRAY['corporate','direct','ota','corporate','direct','direct','website'])[g],
    (ARRAY['card','card','cash','card','card','bank_transfer','card'])[g],
    'c0000000-0000-0000-0000-000000000001',
    (ARRAY['VIP - CEO visit','Conference attendee','Regular guest','Honeymoon suite','Presidential visit','Corporate booking','Family trip'])[g]
FROM generate_series(1, 7) AS g
ON CONFLICT DO NOTHING;

-- Confirmed arrivals (today)
INSERT INTO reservations (id, confirmation_no, guest_id, room_type_id, arrival_date, departure_date, adults, children, status, rate_plan, total_amount, deposit_amount, source, payment_method, property_id)
SELECT gen_random_uuid(),
    'RSH' || lpad((100 + g)::text, 5, '0'),
    (ARRAY['g0000000-0000-0000-0000-000000000002','g0000000-0000-0000-0000-000000000004',
            'g0000000-0000-0000-0000-000000000010','g0000000-0000-0000-0000-000000000012',
            'g0000000-0000-0000-0000-000000000015'])[g],
    (ARRAY['rt000000-0000-0000-0000-000000000001','rt000000-0000-0000-0000-000000000002',
            'rt000000-0000-0000-0000-000000000005','rt000000-0000-0000-0000-000000000001',
            'rt000000-0000-0000-0000-000000000002'])[g],
    CURRENT_DATE,
    CURRENT_DATE + 3,
    2, 0, 'confirmed',
    (ARRAY['bar','government','ota','direct','corporate'])[g],
    (ARRAY[70000, 110000, 70000, 70000, 110000])[g],
    (ARRAY[35000, 55000, 35000, 35000, 55000])[g],
    (ARRAY['telephone','government','ota','website','corporate'])[g],
    (ARRAY['card','government_po','card','card','card'])[g],
    'c0000000-0000-0000-0000-000000000001'
FROM generate_series(1, 5) AS g
ON CONFLICT DO NOTHING;

-- Departing today
INSERT INTO reservations (id, confirmation_no, guest_id, room_type_id, arrival_date, departure_date, adults, children, status, rate_plan, total_amount, deposit_amount, source, payment_method, property_id)
VALUES
    (gen_random_uuid(), 'RSH00200', 'g0000000-0000-0000-0000-000000000006', 'rt000000-0000-0000-0000-000000000001',
     CURRENT_DATE - 3, CURRENT_DATE, 1, 0, 'checked_in', 'bar', 70000, 35000, 'direct', 'card', 'c0000000-0000-0000-0000-000000000001'),
    (gen_random_uuid(), 'RSH00201', 'g0000000-0000-0000-0000-000000000007', 'rt000000-0000-0000-0000-000000000003',
     CURRENT_DATE - 2, CURRENT_DATE, 2, 0, 'checked_in', 'corporate', 170000, 85000, 'corporate', 'bank_transfer', 'c0000000-0000-0000-0000-000000000001'),
    (gen_random_uuid(), 'RSH00202', 'g0000000-0000-0000-0000-000000000013', 'rt000000-0000-0000-0000-000000000002',
     CURRENT_DATE - 1, CURRENT_DATE, 1, 0, 'checked_in', 'ota', 55000, 55000, 'ota', 'card', 'c0000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- ============================================================
-- RATE PLANS
-- ============================================================

INSERT INTO rate_plans (id, code, name, base_rate, currency_code, min_stay, max_stay, advance_booking_days, is_active, property_id) VALUES
    ('rp000000-0000-0000-0000-000000000001', 'BAR', 'Best Available Rate', 0, 'NGN', 1, 30, 0, true, 'c0000000-0000-0000-0000-000000000001'),
    ('rp000000-0000-0000-0000-000000000002', 'CORP', 'Corporate Rate', -15, 'NGN', 1, 365, 0, true, 'c0000000-0000-0000-0000-000000000001'),
    ('rp000000-0000-0000-0000-000000000003', 'GOVT', 'Government Rate', -20, 'NGN', 1, 30, 0, true, 'c0000000-0000-0000-0000-000000000001'),
    ('rp000000-0000-0000-0000-000000000004', 'WKE', 'Weekend Special', -10, 'NGN', 2, 5, 7, true, 'c0000000-0000-0000-0000-000000000001'),
    ('rp000000-0000-0000-0000-000000000005', 'PROMO', 'Promotional Rate', -25, 'NGN', 1, 14, 14, true, 'c0000000-0000-0000-0000-000000000001'),
    ('rp000000-0000-0000-0000-000000000006', 'OTA', 'OTA Rate', -5, 'NGN', 1, 30, 0, true, 'c0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RESTAURANT POS OUTLETS
-- ============================================================

INSERT INTO outlets (id, name, code, type, property_id) VALUES
    ('o0000000-0000-0000-0000-000000000001', 'The Palm Restaurant', 'TPR', 'restaurant', 'c0000000-0000-0000-0000-000000000001'),
    ('o0000000-0000-0000-0000-000000000002', 'Sky Bar & Lounge', 'SBL', 'bar', 'c0000000-0000-0000-0000-000000000001'),
    ('o0000000-0000-0000-0000-000000000003', 'Poolside Café', 'PCF', 'café', 'c0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Menu Categories
INSERT INTO menu_categories (id, name, code, outlet_id, sort_order, property_id) VALUES
    ('mc000000-0000-0000-0000-000000000001', 'Breakfast', 'BRK', 'o0000000-0000-0000-0000-000000000001', 1, 'c0000000-0000-0000-0000-000000000001'),
    ('mc000000-0000-0000-0000-000000000002', 'Lunch', 'LNC', 'o0000000-0000-0000-0000-000000000001', 2, 'c0000000-0000-0000-0000-000000000001'),
    ('mc000000-0000-0000-0000-000000000003', 'Dinner', 'DNR', 'o0000000-0000-0000-0000-000000000001', 3, 'c0000000-0000-0000-0000-000000000001'),
    ('mc000000-0000-0000-0000-000000000004', 'Nigerian Specialties', 'NGS', 'o0000000-0000-0000-0000-000000000001', 4, 'c0000000-0000-0000-0000-000000000001'),
    ('mc000000-0000-0000-0000-000000000005', 'Beverages', 'BEV', 'o0000000-0000-0000-0000-000000000002', 1, 'c0000000-0000-0000-0000-000000000001'),
    ('mc000000-0000-0000-0000-000000000006', 'Cocktails', 'CKL', 'o0000000-0000-0000-0000-000000000002', 2, 'c0000000-0000-0000-0000-000000000001'),
    ('mc000000-0000-0000-0000-000000000007', 'Light Bites', 'LBT', 'o0000000-0000-0000-0000-000000000003', 1, 'c0000000-0000-0000-0000-000000000001'),
    ('mc000000-0000-0000-0000-000000000008', 'Smoothies', 'SMH', 'o0000000-0000-0000-0000-000000000003', 2, 'c0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Menu Items — Nigerian & International
INSERT INTO menu_items (id, name, code, category_id, price, cost_price, currency_code, is_active, property_id) VALUES
    -- Breakfast
    ('mi000000-0000-0000-0000-000000000001', 'Full English Breakfast', 'FEB', 'mc000000-0000-0000-0000-000000000001', 8500, 3200, 'NGN', true, 'c0000000-0000-0000-0000-000000000001'),
    ('mi000000-0000-0000-0000-000000000002', 'Nigerian Breakfast (Ewa Agoyin)', 'NBA', 'mc000000-0000-0000-0000-000000000001', 5500, 2000, 'NGN', true, 'c0000000-0000-0000-0000-000000000001'),
    ('mi000000-0000-0000-0000-000000000003', 'Moi Moi & Akara', 'MMA', 'mc000000-0000-0000-0000-000000000001', 4500, 1500, 'NGN', true, 'c0000000-0000-0000-0000-000000000001'),
    ('mi000000-0000-0000-0000-000000000004', 'Pancakes with Honey', 'PHN', 'mc000000-0000-0000-0000-000000000001', 5000, 1800, 'NGN', true, 'c0000000-0000-0000-0000-000000000001'),
    ('mi000000-0000-0000-0000-000000000005', 'Fruit Platter', 'FPL', 'mc000000-0000-0000-0000-000000000001', 4000, 2200, 'NGN', true, 'c0000000-0000-0000-0000-000000000001'),
    -- Lunch
    ('mi000000-0000-0000-0000-000000000006', 'Jollof Rice with Chicken', 'JRC', 'mc000000-0000-0000-0000-000000000002', 7500, 2800, 'NGN', true, 'c0000000-0000-0000-0000-000000000001'),
    ('mi000000-0000-0000-0000-000000000007', 'Grilled Tilapia', 'GTL', 'mc000000-0000-0000-0000-000000000002', 12000, 5500, 'NGN', true, 'c0000000-0000-0000-0000-000000000001'),
    ('mi000000-0000-0000-0000-000000000008', 'Caesar Salad', 'CSL', 'mc000000-0000-0000-0000-000000000002', 6500, 2200, 'NGN', true, 'c0000000-0000-0000-0000-000000000001'),
    ('mi000000-0000-0000-0000-000000000009', 'Pepper Soup (Goat Meat)', 'PSG', 'mc000000-0000-0000-0000-000000000002', 9000, 4000, 'NGN', true, 'c0000000-0000-0000-0000-000000000001'),
    -- Dinner
    ('mi000000-0000-0000-0000-000000000010', 'Grilled Ribeye Steak', 'GRS', 'mc000000-0000-0000-0000-000000000003', 25000, 12000, 'NGN', true, 'c0000000-0000-0000-0000-000000000001'),
    ('mi000000-0000-0000-0000-000000000011', 'Prawns in Garlic Butter', 'PGB', 'mc000000-0000-0000-0000-000000000003', 22000, 10000, 'NGN', true, 'c0000000-0000-0000-0000-000000000001'),
    ('mi000000-0000-0000-0000-000000000012', 'Pasta Carbonara', 'PCB', 'mc000000-0000-0000-0000-000000000003', 9500, 3500, 'NGN', true, 'c0000000-0000-0000-0000-000000000001'),
    -- Nigerian Specialties
    ('mi000000-0000-0000-0000-000000000013', 'Ofada Rice & Ayamase', 'ORA', 'mc000000-0000-0000-0000-000000000004', 8000, 3000, 'NGN', true, 'c0000000-0000-0000-0000-000000000001'),
    ('mi000000-0000-0000-0000-000000000014', 'Suya Platter', 'SYP', 'mc000000-0000-0000-0000-000000000004', 7000, 2500, 'NGN', true, 'c0000000-0000-0000-0000-000000000001'),
    ('mi000000-0000-0000-0000-000000000015', 'Pounded Yam & Egusi', 'PYE', 'mc000000-0000-0000-0000-000000000004', 7500, 2800, 'NGN', true, 'c0000000-0000-0000-0000-000000000001'),
    ('mi000000-0000-0000-0000-000000000016', 'Fried Plantain (Dodo)', 'FPD', 'mc000000-0000-0000-0000-000000000004', 3000, 800, 'NGN', true, 'c0000000-0000-0000-0000-000000000001'),
    -- Beverages
    ('mi000000-0000-0000-0000-000000000017', 'Chapman', 'CHP', 'mc000000-0000-0000-0000-000000000005', 3500, 800, 'NGN', true, 'c0000000-0000-0000-0000-000000000001'),
    ('mi000000-0000-0000-0000-000000000018', 'Fresh Palm Wine', 'FPW', 'mc000000-0000-0000-0000-000000000005', 2500, 500, 'NGN', true, 'c0000000-0000-0000-0000-000000000001'),
    ('mi000000-0000-0000-0000-000000000019', 'Star Beer', 'STB', 'mc000000-0000-0000-0000-000000000005', 2000, 700, 'NGN', true, 'c0000000-0000-0000-0000-000000000001'),
    ('mi000000-0000-0000-0000-000000000020', 'Coca-Cola', 'COL', 'mc000000-0000-0000-0000-000000000005', 1500, 400, 'NGN', true, 'c0000000-0000-0000-0000-000000000001'),
    -- Cocktails
    ('mi000000-0000-0000-0000-000000000021', 'Lagos Sunset', 'LSN', 'mc000000-0000-0000-0000-000000000006', 5500, 1800, 'NGN', true, 'c0000000-0000-0000-0000-000000000001'),
    ('mi000000-0000-0000-0000-000000000022', 'Zobo Mojito', 'ZMJ', 'mc000000-0000-0000-0000-000000000006', 5000, 1500, 'NGN', true, 'c0000000-0000-0000-0000-000000000001'),
    ('mi000000-0000-0000-0000-000000000023', 'Classic Mojito', 'CMJ', 'mc000000-0000-0000-0000-000000000006', 4500, 1200, 'NGN', true, 'c0000000-0000-0000-0000-000000000001'),
    -- Poolside
    ('mi000000-0000-0000-0000-000000000024', 'Grilled Chicken Wrap', 'GCW', 'mc000000-0000-0000-0000-000000000007', 6000, 2200, 'NGN', true, 'c0000000-0000-0000-0000-000000000001'),
    ('mi000000-0000-0000-0000-000000000025', 'Fish Fingers & Chips', 'FFC', 'mc000000-0000-0000-0000-000000000007', 7000, 2800, 'NGN', true, 'c0000000-0000-0000-0000-000000000001'),
    -- Smoothies
    ('mi000000-0000-0000-0000-000000000026', 'Mango Smoothie', 'MNS', 'mc000000-0000-0000-0000-000000000008', 3000, 1000, 'NGN', true, 'c0000000-0000-0000-0000-000000000001'),
    ('mi000000-0000-0000-0000-000000000027', 'Passion Fruit Smoothie', 'PFS', 'mc000000-0000-0000-0000-000000000008', 3000, 1000, 'NGN', true, 'c0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- TABLES (The Palm Restaurant: 20, Sky Bar: 10, Poolside: 6)
-- ============================================================

INSERT INTO pos_tables (id, number, seats, outlet_id, status, property_id)
SELECT gen_random_uuid(), n::text, 4, 'o0000000-0000-0000-0000-000000000001',
    CASE WHEN n <= 5 THEN 'occupied' ELSE 'available' END,
    'c0000000-0000-0000-0000-000000000001'
FROM generate_series(1, 20) AS n
ON CONFLICT DO NOTHING;

INSERT INTO pos_tables (id, number, seats, outlet_id, status, property_id)
SELECT gen_random_uuid(), 'B' || n::text, 2, 'o0000000-0000-0000-0000-000000000002',
    CASE WHEN n <= 3 THEN 'occupied' ELSE 'available' END,
    'c0000000-0000-0000-0000-000000000001'
FROM generate_series(1, 10) AS n
ON CONFLICT DO NOTHING;

INSERT INTO pos_tables (id, number, seats, outlet_id, status, property_id)
SELECT gen_random_uuid(), 'P' || n::text, 4, 'o0000000-0000-0000-0000-000000000003',
    'available', 'c0000000-0000-0000-0000-000000000001'
FROM generate_series(1, 6) AS n
ON CONFLICT DO NOTHING;

-- ============================================================
-- INVENTORY — PRODUCTS (30 items for a hotel)
-- ============================================================

-- Product Categories
INSERT INTO product_categories (id, name, code, property_id) VALUES
    ('pc000000-0000-0000-0000-000000000001', 'Food & Beverages', 'FBG', 'c0000000-0000-0000-0000-000000000001'),
    ('pc000000-0000-0000-0000-000000000002', 'Housekeeping Supplies', 'HKS', 'c0000000-0000-0000-0000-000000000001'),
    ('pc000000-0000-0000-0000-000000000003', 'Laundry', 'LDY', 'c0000000-0000-0000-0000-000000000001'),
    ('pc000000-0000-0000-0000-000000000004', 'Beverages - Alcohol', 'BAL', 'c0000000-0000-0000-0000-000000000001'),
    ('pc000000-0000-0000-0000-000000000005', 'Stationery & Office', 'SOF', 'c0000000-0000-0000-0000-000000000001'),
    ('pc000000-0000-0000-0000-000000000006', 'Maintenance & Engineering', 'MNE', 'c0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Products
INSERT INTO products (id, sku, name, category_id, unit, cost_price, selling_price, current_stock, reorder_level, max_stock, property_id) VALUES
    -- Food
    ('pd000000-0000-0000-0000-000000000001', 'FD001', 'Jollof Rice Spice Mix', 'pc000000-0000-0000-0000-000000000001', 'kg', 2500, 0, 50, 10, 100, 'c0000000-0000-0000-0000-000000000001'),
    ('pd000000-0000-0000-0000-000000000002', 'FD002', 'Basmati Rice', 'pc000000-0000-0000-0000-000000000001', 'kg', 1800, 0, 100, 20, 200, 'c0000000-0000-0000-0000-000000000001'),
    ('pd000000-0000-0000-0000-000000000003', 'FD003', 'Chicken (Whole)', 'pc000000-0000-0000-0000-000000000001', 'kg', 3200, 0, 30, 10, 60, 'c0000000-0000-0000-0000-000000000001'),
    ('pd000000-0000-0000-0000-000000000004', 'FD004', 'Fresh Tilapia', 'pc000000-0000-0000-0000-000000000001', 'kg', 4500, 0, 20, 5, 40, 'c0000000-0000-0000-0000-000000000001'),
    ('pd000000-0000-0000-0000-000000000005', 'FD005', 'Assorted Meat', 'pc000000-0000-0000-0000-000000000001', 'kg', 5000, 0, 25, 8, 50, 'c0000000-0000-0000-0000-000000000001'),
    ('pd000000-0000-0000-0000-000000000006', 'FD006', 'Tomatoes', 'pc000000-0000-0000-0000-000000000001', 'kg', 1500, 0, 40, 15, 80, 'c0000000-0000-0000-0000-000000000001'),
    ('pd000000-0000-0000-0000-000000000007', 'FD007', 'Vegetable Oil', 'pc000000-0000-0000-0000-000000000001', 'litre', 2200, 0, 60, 15, 120, 'c0000000-0000-0000-0000-000000000001'),
    ('pd000000-0000-0000-0000-000000000008', 'FD008', 'Yam', 'pc000000-0000-0000-0000-000000000001', 'kg', 1200, 0, 80, 20, 150, 'c0000000-0000-0000-0000-000000000001'),
    ('pd000000-0000-0000-0000-000000000009', 'FD009', 'Plantain', 'pc000000-0000-0000-0000-000000000001', 'kg', 800, 0, 50, 10, 100, 'c0000000-0000-0000-0000-000000000001'),
    ('pd000000-0000-0000-0000-000000000010', 'FD010', 'Onions', 'pc000000-0000-0000-0000-000000000001', 'kg', 1000, 0, 40, 10, 80, 'c0000000-0000-0000-0000-000000000001'),
    -- Beverages
    ('pd000000-0000-0000-0000-000000000011', 'BV001', 'Star Larger Beer', 'pc000000-0000-0000-0000-000000000004', 'bottle', 700, 2000, 200, 50, 400, 'c0000000-0000-0000-0000-000000000001'),
    ('pd000000-0000-0000-0000-000000000012', 'BV002', 'Heineken Beer', 'pc000000-0000-0000-0000-000000000004', 'bottle', 900, 2500, 150, 30, 300, 'c0000000-0000-0000-0000-000000000001'),
    ('pd000000-0000-0000-0000-000000000013', 'BV003', 'Smirnoff Ice', 'pc000000-0000-0000-0000-000000000004', 'bottle', 600, 1800, 100, 20, 200, 'c0000000-0000-0000-0000-000000000001'),
    ('pd000000-0000-0000-0000-000000000014', 'BV004', 'Jameson Whiskey', 'pc000000-0000-0000-0000-000000000004', 'bottle', 15000, 45000, 20, 5, 40, 'c0000000-0000-0000-0000-000000000001'),
    ('pd000000-0000-0000-0000-000000000015', 'BV005', 'Hennessy VS', 'pc000000-0000-0000-0000-000000000004', 'bottle', 22000, 65000, 10, 3, 20, 'c0000000-0000-0000-0000-000000000001'),
    ('pd000000-0000-0000-0000-000000000016', 'BV006', 'Coca-Cola', 'pc000000-0000-0000-0000-000000000001', 'can', 400, 1500, 300, 60, 500, 'c0000000-0000-0000-0000-000000000001'),
    ('pd000000-0000-0000-0000-000000000017', 'BV007', 'Bottled Water (500ml)', 'pc000000-0000-0000-0000-000000000001', 'bottle', 150, 800, 500, 100, 1000, 'c0000000-0000-0000-0000-000000000001'),
    -- Housekeeping
    ('pd000000-0000-0000-0000-000000000020', 'HK001', 'Luxury Soap (50ml)', 'pc000000-0000-0000-0000-000000000002', 'piece', 200, 0, 200, 50, 400, 'c0000000-0000-0000-0000-000000000001'),
    ('pd000000-0000-0000-0000-000000000021', 'HK002', 'Shampoo Sachet', 'pc000000-0000-0000-0000-000000000002', 'piece', 150, 0, 300, 80, 600, 'c0000000-0000-0000-0000-000000000001'),
    ('pd000000-0000-0000-0000-000000000022', 'HK003', 'Bath Towel', 'pc000000-0000-0000-0000-000000000002', 'piece', 3500, 0, 80, 20, 150, 'c0000000-0000-0000-0000-000000000001'),
    ('pd000000-0000-0000-0000-000000000023', 'HK004', 'Bed Sheet Set', 'pc000000-0000-0000-0000-000000000002', 'set', 5000, 0, 60, 15, 120, 'c0000000-0000-0000-0000-000000000001'),
    ('pd000000-0000-0000-0000-000000000024', 'HK005', 'Toilet Paper (Roll)', 'pc000000-0000-0000-0000-000000000002', 'roll', 300, 0, 150, 40, 300, 'c0000000-0000-0000-0000-000000000001'),
    ('pd000000-0000-0000-0000-000000000025', 'HK006', 'Floor Cleaner', 'pc000000-0000-0000-0000-000000000002', 'litre', 800, 0, 30, 10, 60, 'c0000000-0000-0000-0000-000000000001'),
    -- Laundry
    ('pd000000-0000-0000-0000-000000000030', 'LD001', 'Laundry Detergent', 'pc000000-0000-0000-0000-000000000003', 'kg', 2000, 0, 40, 10, 80, 'c0000000-0000-0000-0000-000000000001'),
    ('pd000000-0000-0000-0000-000000000031', 'LD002', 'Starch', 'pc000000-0000-0000-0000-000000000003', 'kg', 1500, 0, 20, 5, 40, 'c0000000-0000-0000-0000-000000000001'),
    ('pd000000-0000-0000-0000-000000000032', 'LD003', 'Bleach', 'pc000000-0000-0000-0000-000000000003', 'litre', 800, 0, 25, 5, 50, 'c0000000-0000-0000-0000-000000000001'),
    -- Stationery
    ('pd000000-0000-0000-0000-000000000040', 'ST001', 'A4 Paper (Ream)', 'pc000000-0000-0000-0000-000000000005', 'ream', 3000, 0, 20, 5, 40, 'c0000000-0000-0000-0000-000000000001'),
    ('pd000000-0000-0000-0000-000000000041', 'ST002', 'Ballpoint Pen', 'pc000000-0000-0000-0000-000000000005', 'piece', 50, 0, 200, 50, 400, 'c0000000-0000-0000-0000-000000000001'),
    ('pd000000-0000-0000-0000-000000000042', 'ST003', 'Printer Ink Cartridge', 'pc000000-0000-0000-0000-000000000005', 'piece', 8000, 0, 5, 2, 10, 'c0000000-0000-0000-0000-000000000001'),
    -- Maintenance
    ('pd000000-0000-0000-0000-000000000050', 'MN001', 'LED Bulb (9W)', 'pc000000-0000-0000-0000-000000000006', 'piece', 2500, 0, 30, 10, 60, 'c0000000-0000-0000-0000-000000000001'),
    ('pd000000-0000-0000-0000-000000000051', 'MN002', 'AC Filter', 'pc000000-0000-0000-0000-000000000006', 'piece', 5000, 0, 15, 5, 30, 'c0000000-0000-0000-0000-000000000001'),
    ('pd000000-0000-0000-0000-000000000052', 'MN003', 'Plumbing Washer', 'pc000000-0000-0000-0000-000000000006', 'piece', 500, 0, 50, 15, 100, 'c0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STORES
-- ============================================================

INSERT INTO stores (id, name, code, type, property_id) VALUES
    ('st000000-0000-0000-0000-000000000001', 'Main Store', 'MS', 'warehouse', 'c0000000-0000-0000-0000-000000000001'),
    ('st000000-0000-0000-0000-000000000002', 'Kitchen Store', 'KS', 'store', 'c0000000-0000-0000-0000-000000000001'),
    ('st000000-0000-0000-0000-000000000003', 'Housekeeping Store', 'HK', 'store', 'c0000000-0000-0000-0000-000000000001'),
    ('st000000-0000-0000-0000-000000000004', 'Bar Store', 'BS', 'store', 'c0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SUPPLIERS
-- ============================================================

INSERT INTO suppliers (id, name, contact_person, phone, email, address, city, country, payment_terms, credit_limit, currency_code, property_id) VALUES
    ('sp000000-0000-0000-0000-000000000001', 'Chi Farms Limited', 'Emeka Chi', '+234 801 234 5678', 'sales@chifarms.com', '45 Agric Road', 'Lagos', 'Nigeria', 'net_30', 5000000, 'NGN', 'c0000000-0000-0000-0000-000000000001'),
    ('sp000000-0000-0000-0000-000000000002', 'Lagos Fish Market', 'Tunde Abiodun', '+234 802 345 6789', 'order@lagosfishmarket.com', 'Epe Fish Market', 'Lagos', 'Nigeria', 'cash_on_delivery', 0, 'NGN', 'c0000000-0000-0000-0000-000000000001'),
    ('sp000000-0000-0000-0000-000000000003', 'Nigerian Breweries', 'Adewale Johnson', '+234 803 456 7890', 'supply@nbplc.com', '9 Lagos-Ibadan Expressway', 'Ibadan', 'Nigeria', 'net_14', 10000000, 'NGN', 'c0000000-0000-0000-0000-000000000001'),
    ('sp000000-0000-0000-0000-000000000004', 'CleanPro Supplies', 'Funke Balogun', '+234 804 567 8901', 'info@cleanpro.com', '12 Matori Industrial Estate', 'Lagos', 'Nigeria', 'net_30', 2000000, 'NGN', 'c0000000-0000-0000-0000-000000000001'),
    ('sp000000-0000-0000-0000-000000000005', 'Grand Cereals Nigeria', 'Ibrahim Mohammed', '+234 805 678 9012', 'orders@grandcereals.com', '8 Zik Industrial Avenue', 'Uyo', 'Nigeria', 'net_30', 3000000, 'NGN', 'c0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- EMPLOYEES (15 staff)
-- ============================================================

INSERT INTO employees (id, employee_number, first_name, last_name, email, phone, department_id, position, employment_date, employment_type, salary, currency_code, property_id) VALUES
    ('em000000-0000-0000-0000-000000000001', 'EMP-2024-0001', 'Chinedu', 'Eze', 'chinedu.eze@grandpalm.com', '+234 810 111 1111', 'd0000000-0000-0000-0000-000000000001', 'Front Desk Manager', '2022-03-15', 'full_time', 350000, 'NGN', 'c0000000-0000-0000-0000-000000000001'),
    ('em000000-0000-0000-0000-000000000002', 'EMP-2024-0002', 'Blessing', 'Adeyemi', 'blessing.a@grandpalm.com', '+234 810 222 2222', 'd0000000-0000-0000-0000-000000000001', 'Receptionist', '2023-01-10', 'full_time', 180000, 'NGN', 'c0000000-0000-0000-0000-000000000001'),
    ('em000000-0000-0000-0000-000000000003', 'EMP-2024-0003', 'Emeka', 'Obi', 'emeka.o@grandpalm.com', '+234 810 333 3333', 'd0000000-0000-0000-0000-000000000002', 'Housekeeping Supervisor', '2021-06-01', 'full_time', 200000, 'NGN', 'c0000000-0000-0000-0000-000000000001'),
    ('em000000-0000-0000-0000-000000000004', 'EMP-2024-0004', 'Ngozi', 'Ifeoma', 'ngozi.i@grandpalm.com', '+234 810 444 4444', 'd0000000-0000-0000-0000-000000000002', 'Room Attendant', '2023-05-20', 'full_time', 120000, 'NGN', 'c0000000-0000-0000-0000-000000000001'),
    ('em000000-0000-0000-0000-000000000005', 'EMP-2024-0005', 'Yemi', 'Olawale', 'yemi.o@grandpalm.com', '+234 810 555 5555', 'd0000000-0000-0000-0000-000000000003', 'Restaurant Manager', '2022-09-01', 'full_time', 280000, 'NGN', 'c0000000-0000-0000-0000-000000000001'),
    ('em000000-0000-0000-0000-000000000006', 'EMP-2024-0006', 'Chidi', 'Nwosu', 'chidi.n@grandpalm.com', '+234 810 666 6666', 'd0000000-0000-0000-0000-000000000003', 'Head Chef', '2021-11-15', 'full_time', 320000, 'NGN', 'c0000000-0000-0000-0000-000000000001'),
    ('em000000-0000-0000-0000-000000000007', 'EMP-2024-0007', 'Tunde', 'Bakare', 'tunde.b@grandpalm.com', '+234 810 777 7777', 'd0000000-0000-0000-0000-000000000003', 'Waiter', '2023-08-01', 'full_time', 100000, 'NGN', 'c0000000-0000-0000-0000-000000000001'),
    ('em000000-0000-0000-0000-000000000008', 'EMP-2024-0008', 'Fatima', 'Bello', 'fatima.b@grandpalm.com', '+234 810 888 8888', 'd0000000-0000-0000-0000-000000000004', 'Finance Manager', '2022-01-05', 'full_time', 400000, 'NGN', 'c0000000-0000-0000-0000-000000000001'),
    ('em000000-0000-0000-0000-000000000009', 'EMP-2024-0009', 'Oluwaseun', 'Adeyemi', 'oluwaseun.a@grandpalm.com', '+234 810 999 9999', 'd0000000-0000-0000-0000-000000000004', 'Cashier', '2023-03-15', 'full_time', 150000, 'NGN', 'c0000000-0000-0000-0000-000000000001'),
    ('em000000-0000-0000-0000-000000000010', 'EMP-2024-0010', 'Kemi', 'Osagie', 'kemi.o@grandpalm.com', '+234 811 000 1111', 'd0000000-0000-0000-0000-000000000005', 'HR Manager', '2022-04-01', 'full_time', 320000, 'NGN', 'c0000000-0000-0000-0000-000000000001'),
    ('em000000-0000-0000-0000-000000000011', 'EMP-2024-0011', 'Ibrahim', 'Tanko', 'ibrahim.t@grandpalm.com', '+234 811 111 2222', 'd0000000-0000-0000-0000-000000000006', 'Chief Engineer', '2021-02-01', 'full_time', 280000, 'NGN', 'c0000000-0000-0000-0000-000000000001'),
    ('em000000-0000-0000-0000-000000000012', 'EMP-2024-0012', 'Sunday', 'Okon', 'sunday.o@grandpalm.com', '+234 811 222 3333', 'd0000000-0000-0000-0000-000000000008', 'Procurement Officer', '2022-07-15', 'full_time', 200000, 'NGN', 'c0000000-0000-0000-0000-000000000001'),
    ('em000000-0000-0000-0000-000000000013', 'EMP-2024-0013', 'Amina', 'Usman', 'amina.u@grandpalm.com', '+234 811 333 4444', 'd0000000-0000-0000-0000-000000000002', 'Room Attendant', '2023-09-01', 'full_time', 120000, 'NGN', 'c0000000-0000-0000-0000-000000000001'),
    ('em000000-0000-0000-0000-000000000014', 'EMP-2024-0014', 'Kelvin', 'Okoro', 'kelvin.o@grandpalm.com', '+234 811 444 5555', 'd0000000-0000-0000-0000-000000000003', 'Bartender', '2023-06-01', 'full_time', 130000, 'NGN', 'c0000000-0000-0000-0000-000000000001'),
    ('em000000-0000-0000-0000-000000000015', 'EMP-2024-0015', 'Patience', 'Duru', 'patience.d@grandpalm.com', '+234 811 555 6666', 'd0000000-0000-0000-0000-000000000007', 'Security Officer', '2022-08-01', 'full_time', 110000, 'NGN', 'c0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- CHART OF ACCOUNTS (Hospitality Standard)
-- ============================================================

-- Account Classes (if not already seeded)
INSERT INTO account_classes (id, code, name, description, sort_order) VALUES
    ('ac000000-0000-0000-0000-000000000001', '100', 'Assets', 'Assets owned by the business', 1),
    ('ac000000-0000-0000-0000-000000000002', '200', 'Liabilities', 'Amounts owed by the business', 2),
    ('ac000000-0000-0000-0000-000000000003', '300', 'Equity', 'Owner equity and retained earnings', 3),
    ('ac000000-0000-0000-0000-000000000004', '400', 'Revenue', 'Income from operations', 4),
    ('ac000000-0000-0000-0000-000000000005', '500', 'Cost of Sales', 'Direct costs of goods sold', 5),
    ('ac000000-0000-0000-0000-000000000006', '600', 'Operating Expenses', 'General and administrative expenses', 6)
ON CONFLICT (id) DO NOTHING;

-- Assets
INSERT INTO chart_of_accounts (id, account_code, account_name, account_class, account_type, normal_balance, property_id) VALUES
    ('coa00000-0000-0000-0000-000000000001', '1010', 'Cash on Hand', 'ac000000-0000-0000-0000-000000000001', 'detail', 'debit', 'c0000000-0000-0000-0000-000000000001'),
    ('coa00000-0000-0000-0000-000000000002', '1020', 'Petty Cash', 'ac000000-0000-0000-0000-000000000001', 'detail', 'debit', 'c0000000-0000-0000-0000-000000000001'),
    ('coa00000-0000-0000-0000-000000000003', '1030', 'Bank Account — GTBank', 'ac000000-0000-0000-0000-000000000001', 'detail', 'debit', 'c0000000-0000-0000-0000-000000000001'),
    ('coa00000-0000-0000-0000-000000000004', '1040', 'Bank Account — Access Bank', 'ac000000-0000-0000-0000-000000000001', 'detail', 'debit', 'c0000000-0000-0000-0000-000000000001'),
    ('coa00000-0000-0000-0000-000000000005', '1200', 'Accounts Receivable', 'ac000000-0000-0000-0000-000000000001', 'detail', 'debit', 'c0000000-0000-0000-0000-000000000001'),
    ('coa00000-0000-0000-0000-000000000006', '1300', 'Inventory — Food & Beverage', 'ac000000-0000-0000-0000-000000000001', 'detail', 'debit', 'c0000000-0000-0000-0000-000000000001'),
    ('coa00000-0000-0000-0000-000000000007', '1310', 'Inventory — Housekeeping', 'ac000000-0000-0000-0000-000000000001', 'detail', 'debit', 'c0000000-0000-0000-0000-000000000001'),
    ('coa00000-0000-0000-0000-000000000008', '1500', 'Fixed Assets', 'ac000000-0000-0000-0000-000000000001', 'detail', 'debit', 'c0000000-0000-0000-0000-000000000001'),
    ('coa00000-0000-0000-0000-000000000009', '1510', 'Accumulated Depreciation', 'ac000000-0000-0000-0000-000000000001', 'detail', 'credit', 'c0000000-0000-0000-0000-000000000001'),
    -- Liabilities
    ('coa00000-0000-0000-0000-000000000010', '2010', 'Accounts Payable', 'ac000000-0000-0000-0000-000000000002', 'detail', 'credit', 'c0000000-0000-0000-0000-000000000001'),
    ('coa00000-0000-0000-0000-000000000011', '2020', 'VAT Payable', 'ac000000-0000-0000-0000-000000000002', 'detail', 'credit', 'c0000000-0000-0000-0000-000000000001'),
    ('coa00000-0000-0000-0000-000000000012', '2030', 'Service Charge Payable', 'ac000000-0000-0000-0000-000000000002', 'detail', 'credit', 'c0000000-0000-0000-0000-000000000001'),
    ('coa00000-0000-0000-0000-000000000013', '2040', 'Withholding Tax Payable', 'ac000000-0000-0000-0000-000000000002', 'detail', 'credit', 'c0000000-0000-0000-0000-000000000001'),
    ('coa00000-0000-0000-0000-000000000014', '2050', 'Pension Payable', 'ac000000-0000-0000-0000-000000000002', 'detail', 'credit', 'c0000000-0000-0000-0000-000000000001'),
    -- Equity
    ('coa00000-0000-0000-0000-000000000020', '3010', 'Share Capital', 'ac000000-0000-0000-0000-000000000003', 'detail', 'credit', 'c0000000-0000-0000-0000-000000000001'),
    ('coa00000-0000-0000-0000-000000000021', '3020', 'Retained Earnings', 'ac000000-0000-0000-0000-000000000003', 'detail', 'credit', 'c0000000-0000-0000-0000-000000000001'),
    -- Revenue
    ('coa00000-0000-0000-0000-000000000030', '4010', 'Room Revenue', 'ac000000-0000-0000-0000-000000000004', 'detail', 'credit', 'c0000000-0000-0000-0000-000000000001'),
    ('coa00000-0000-0000-0000-000000000031', '4020', 'Restaurant Revenue', 'ac000000-0000-0000-0000-000000000004', 'detail', 'credit', 'c0000000-0000-0000-0000-000000000001'),
    ('coa00000-0000-0000-0000-000000000032', '4030', 'Bar Revenue', 'ac000000-0000-0000-0000-000000000004', 'detail', 'credit', 'c0000000-0000-0000-0000-000000000001'),
    ('coa00000-0000-0000-0000-000000000033', '4040', 'Laundry Revenue', 'ac000000-0000-0000-0000-000000000004', 'detail', 'credit', 'c0000000-0000-0000-0000-000000000001'),
    ('coa00000-0000-0000-0000-000000000034', '4050', 'Phone Revenue', 'ac000000-0000-0000-0000-000000000004', 'detail', 'credit', 'c0000000-0000-0000-0000-000000000001'),
    -- Cost of Sales
    ('coa00000-0000-0000-0000-000000000040', '5010', 'Cost of Food', 'ac000000-0000-0000-0000-000000000005', 'detail', 'debit', 'c0000000-0000-0000-0000-000000000001'),
    ('coa00000-0000-0000-0000-000000000041', '5020', 'Cost of Beverages', 'ac000000-0000-0000-0000-000000000005', 'detail', 'debit', 'c0000000-0000-0000-0000-000000000001'),
    ('coa00000-0000-0000-0000-000000000042', '5030', 'Other Cost of Sales', 'ac000000-0000-0000-0000-000000000005', 'detail', 'debit', 'c0000000-0000-0000-0000-000000000001'),
    -- Operating Expenses
    ('coa00000-0000-0000-0000-000000000050', '6010', 'Salaries & Wages', 'ac000000-0000-0000-0000-000000000006', 'detail', 'debit', 'c0000000-0000-0000-0000-000000000001'),
    ('coa00000-0000-0000-0000-000000000051', '6020', 'Utilities (Electricity)', 'ac000000-0000-0000-0000-000000000006', 'detail', 'debit', 'c0000000-0000-0000-0000-000000000001'),
    ('coa00000-0000-0000-0000-000000000052', '6030', 'Utilities (Water)', 'ac000000-0000-0000-0000-000000000006', 'detail', 'debit', 'c0000000-0000-0000-0000-000000000001'),
    ('coa00000-0000-0000-0000-000000000053', '6040', 'Internet & Communications', 'ac000000-0000-0000-0000-000000000006', 'detail', 'debit', 'c0000000-0000-0000-0000-000000000001'),
    ('coa00000-0000-0000-0000-000000000054', '6050', 'Maintenance & Repairs', 'ac000000-0000-0000-0000-000000000006', 'detail', 'debit', 'c0000000-0000-0000-0000-000000000001'),
    ('coa00000-0000-0000-0000-000000000055', '6060', 'Marketing & Advertising', 'ac000000-0000-0000-0000-000000000006', 'detail', 'debit', 'c0000000-0000-0000-0000-000000000001'),
    ('coa00000-0000-0000-0000-000000000056', '6070', 'Insurance', 'ac000000-0000-0000-0000-000000000006', 'detail', 'debit', 'c0000000-0000-0000-0000-000000000001'),
    ('coa00000-0000-0000-0000-000000000057', '6080', 'Professional Fees', 'ac000000-0000-0000-0000-000000000006', 'detail', 'debit', 'c0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- TAX CONFIGURATION
-- ============================================================

INSERT INTO taxes (id, name, code, rate, type, is_active, property_id) VALUES
    ('tx000000-0000-0000-0000-000000000001', 'VAT (Value Added Tax)', 'VAT', 7.5, 'percentage', true, 'c0000000-0000-0000-0000-000000000001'),
    ('tx000000-0000-0000-0000-000000000002', 'Service Charge', 'SVC', 10.0, 'percentage', true, 'c0000000-0000-0000-0000-000000000001'),
    ('tx000000-0000-0000-0000-000000000003', 'Tourism Levy', 'TLY', 1.0, 'percentage', true, 'c0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PAYMENT METHODS
-- ============================================================

INSERT INTO payment_methods (id, name, code, is_active, property_id) VALUES
    ('pm000000-0000-0000-0000-000000000001', 'Cash', 'CASH', true, 'c0000000-0000-0000-0000-000000000001'),
    ('pm000000-0000-0000-0000-000000000002', 'Debit Card', 'DCRD', true, 'c0000000-0000-0000-0000-000000000001'),
    ('pm000000-0000-0000-0000-000000000003', 'Credit Card', 'CCRD', true, 'c0000000-0000-0000-0000-000000000001'),
    ('pm000000-0000-0000-0000-000000000004', 'Bank Transfer', 'BTRF', true, 'c0000000-0000-0000-0000-000000000001'),
    ('pm000000-0000-0000-0000-000000000005', 'Mobile Money', 'MMNY', true, 'c0000000-0000-0000-0000-000000000001'),
    ('pm000000-0000-0000-0000-000000000006', 'Room Charge', 'ROOM', true, 'c0000000-0000-0000-0000-000000000001'),
    ('pm000000-0000-0000-0000-000000000007', 'Company Account', 'CRDT', true, 'c0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- BANK ACCOUNTS
-- ============================================================

INSERT INTO bank_accounts (id, account_name, bank_name, account_number, currency_code, opening_balance, current_balance, property_id) VALUES
    ('ba000000-0000-0000-0000-000000000001', 'Operating Account', 'Guaranty Trust Bank', '0123456789', 'NGN', 25000000, 32500000, 'c0000000-0000-0000-0000-000000000001'),
    ('ba000000-0000-0000-0000-000000000002', 'Savings Account', 'Access Bank', '9876543210', 'NGN', 10000000, 12000000, 'c0000000-0000-0000-0000-000000000001'),
    ('ba000000-0000-0000-0000-000000000003', 'Dollar Account', 'Stanbic IBTC', '0011223344', 'USD', 50000, 65000, 'c0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- WORK ORDERS (sample maintenance tickets)
-- ============================================================

INSERT INTO work_orders (id, title, description, room_id, priority, status, property_id) VALUES
    ('wo000000-0000-0000-0000-000000000001', 'AC not cooling in Room 301', 'Guest reports AC is blowing warm air. Temperature set to 18°C but room remains hot.', NULL, 'high', 'open', 'c0000000-0000-0000-0000-000000000001'),
    ('wo000000-0000-0000-0000-000000000002', 'Leaking faucet in Room 205', 'Bathroom faucet dripping. Water stain on ceiling below.', NULL, 'medium', 'in_progress', 'c0000000-0000-0000-0000-000000000001'),
    ('wo000000-0000-0000-0000-000000000003', 'TV remote not working', 'Guest in Room 210 reports remote control not responding. Batteries replaced, still not working.', NULL, 'low', 'completed', 'c0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;
