-- INFINEON Complete Seed Data
-- Grand Palm Hotel Lagos — 50-room demo hotel

-- ── Properties ──
INSERT INTO properties (id, name, code, address, city, state, country, phone, email, website, currency, timezone, check_in_time, check_out_time, created_at)
VALUES (1, 'Grand Palm Hotel Lagos', 'GPHL', '12 Admiralty Way, Lekki Phase 1', 'Lagos', 'Lagos', 'Nigeria', '+234-1-234-5678', 'reservations@grandpalmlagos.com', 'https://grandpalmlagos.com', 'NGN', 'Africa/Lagos', '14:00', '12:00', NOW())
ON CONFLICT DO NOTHING;

-- ── Departments ──
INSERT INTO departments (id, name, code, property_id, created_at) VALUES
(1, 'Front Office', 'FRONT', 1, NOW()),
(2, 'Housekeeping', 'HOUSE', 1, NOW()),
(3, 'Food & Beverage', 'FB', 1, NOW()),
(4, 'Kitchen', 'KIT', 1, NOW()),
(5, 'Maintenance', 'MAINT', 1, NOW()),
(6, 'Accounts', 'ACCT', 1, NOW()),
(7, 'Human Resources', 'HR', 1, NOW()),
(8, 'Security', 'SEC', 1, NOW()),
(9, 'Sales & Marketing', 'SM', 1, NOW()),
(10, 'IT', 'IT', 1, NOW())
ON CONFLICT DO NOTHING;

-- ── Room Types (already partially seeded, this ensures completeness) ──
INSERT INTO room_types (id, code, name, description, max_occupancy, adult_capacity, child_capacity, bed_configuration, base_rate, min_rate, max_rate, property_id, created_at) VALUES
(1, 'STD', 'Standard Room', 'Comfortable room with city view', 2, 2, 1, '1 Queen Bed', 25000, 20000, 35000, 1, NOW()),
(2, 'DLX', 'Deluxe Room', 'Spacious room with garden view, sitting area', 3, 2, 1, '1 King Bed', 35000, 28000, 50000, 1, NOW()),
(3, 'EXS', 'Executive Suite', 'Premium suite with separate living room', 3, 2, 1, '1 King Bed + Living Room', 55000, 45000, 75000, 1, NOW()),
(4, 'PRS', 'Presidential Suite', 'Luxury suite with private dining, jacuzzi', 4, 3, 1, '1 King Bed + Living + Dining', 120000, 95000, 150000, 1, NOW())
ON CONFLICT DO NOTHING;

-- ── Rooms (50 rooms across 4 floors) ──
INSERT INTO rooms (id, number, room_type_id, floor, building_id, status, housekeeping_status, property_id, created_at) VALUES
-- Floor 1: Standard (rooms 101-115)
(1, '101', 1, '1', NULL, 'vacant_clean', 'clean', 1, NOW()),
(2, '102', 1, '1', NULL, 'occupied_clean', 'clean', 1, NOW()),
(3, '103', 1, '1', NULL, 'vacant_dirty', 'dirty', 1, NOW()),
(4, '104', 1, '1', NULL, 'vacant_clean', 'clean', 1, NOW()),
(5, '105', 1, '1', NULL, 'occupied_dirty', 'dirty', 1, NOW()),
(6, '106', 1, '1', NULL, 'reserved', 'clean', 1, NOW()),
(7, '107', 1, '1', NULL, 'vacant_clean', 'clean', 1, NOW()),
(8, '108', 1, '1', NULL, 'vacant_clean', 'clean', 1, NOW()),
(9, '109', 1, '1', NULL, 'occupied_clean', 'clean', 1, NOW()),
(10, '110', 1, '1', NULL, 'vacant_dirty', 'dirty', 1, NOW()),
(11, '111', 1, '1', NULL, 'out_of_order', 'dirty', 1, NOW()),
(12, '112', 1, '1', NULL, 'vacant_clean', 'clean', 1, NOW()),
(13, '113', 1, '1', NULL, 'occupied_clean', 'clean', 1, NOW()),
(14, '114', 1, '1', NULL, 'vacant_clean', 'clean', 1, NOW()),
(15, '115', 1, '1', NULL, 'reserved', 'clean', 1, NOW()),
-- Floor 2: Deluxe (rooms 201-215)
(16, '201', 2, '2', NULL, 'occupied_clean', 'clean', 1, NOW()),
(17, '202', 2, '2', NULL, 'vacant_clean', 'clean', 1, NOW()),
(18, '203', 2, '2', NULL, 'occupied_dirty', 'dirty', 1, NOW()),
(19, '204', 2, '2', NULL, 'vacant_clean', 'clean', 1, NOW()),
(20, '205', 2, '2', NULL, 'reserved', 'clean', 1, NOW()),
(21, '206', 2, '2', NULL, 'vacant_dirty', 'dirty', 1, NOW()),
(22, '207', 2, '2', NULL, 'occupied_clean', 'clean', 1, NOW()),
(23, '208', 2, '2', NULL, 'vacant_clean', 'clean', 1, NOW()),
(24, '209', 2, '2', NULL, 'occupied_clean', 'clean', 1, NOW()),
(25, '210', 2, '2', NULL, 'vacant_clean', 'clean', 1, NOW()),
(26, '211', 2, '2', NULL, 'out_of_service', 'dirty', 1, NOW()),
(27, '212', 2, '2', NULL, 'vacant_clean', 'clean', 1, NOW()),
(28, '213', 2, '2', NULL, 'occupied_clean', 'clean', 1, NOW()),
(29, '214', 2, '2', NULL, 'due_out', 'dirty', 1, NOW()),
(30, '215', 2, '2', NULL, 'vacant_clean', 'clean', 1, NOW()),
-- Floor 3: Executive Suite (rooms 301-310)
(31, '301', 3, '3', NULL, 'occupied_clean', 'clean', 1, NOW()),
(32, '302', 3, '3', NULL, 'vacant_clean', 'clean', 1, NOW()),
(33, '303', 3, '3', NULL, 'occupied_clean', 'clean', 1, NOW()),
(34, '304', 3, '3', NULL, 'reserved', 'clean', 1, NOW()),
(35, '305', 3, '3', NULL, 'vacant_clean', 'clean', 1, NOW()),
(36, '306', 3, '3', NULL, 'occupied_dirty', 'dirty', 1, NOW()),
(37, '307', 3, '3', NULL, 'vacant_clean', 'clean', 1, NOW()),
(38, '308', 3, '3', NULL, 'due_in', 'clean', 1, NOW()),
(39, '309', 3, '3', NULL, 'vacant_clean', 'clean', 1, NOW()),
(40, '310', 3, '3', NULL, 'occupied_clean', 'clean', 1, NOW()),
-- Floor 4: Presidential Suite (rooms 401-405) + House Use
(41, '401', 4, '4', NULL, 'occupied_clean', 'clean', 1, NOW()),
(42, '402', 4, '4', NULL, 'vacant_clean', 'clean', 1, NOW()),
(43, '403', 4, '4', NULL, 'house_use', 'clean', 1, NOW()),
(44, '404', 4, '4', NULL, 'complimentary', 'clean', 1, NOW()),
(45, '405', 4, '4', NULL, 'vacant_clean', 'clean', 1, NOW()),
(46, '406', 3, '4', NULL, 'occupied_clean', 'clean', 1, NOW()),
(47, '407', 2, '4', NULL, 'vacant_clean', 'clean', 1, NOW()),
(48, '408', 1, '4', NULL, 'blocked', 'dirty', 1, NOW()),
(49, '409', 2, '4', NULL, 'occupied_clean', 'clean', 1, NOW()),
(50, '410', 1, '4', NULL, 'vacant_clean', 'clean', 1, NOW())
ON CONFLICT DO NOTHING;

-- ── Guests (20 Nigerian/African guests) ──
INSERT INTO guests (id, first_name, last_name, email, phone, nationality, gender, loyalty_tier, loyalty_points, property_id, created_at) VALUES
(1, 'Adebayo', 'Johnson', 'adebayo.j@gmail.com', '+2348034567890', 'Nigerian', 'male', 'gold', 1800, 1, NOW()),
(2, 'Fatima', 'Abubakar', 'fatima.a@yahoo.com', '+2348056789012', 'Nigerian', 'female', 'platinum', 5500, 1, NOW()),
(3, 'Chen', 'Wei', 'chen.wei@company.cn', '+2348067890123', 'Chinese', 'male', 'member', 200, 1, NOW()),
(4, 'Grace', 'Okafor', 'grace.o@outlook.com', '+2348078901234', 'Nigerian', 'female', 'vip', 12000, 1, NOW()),
(5, 'Mohammed', 'Ali', 'mohammed.ali@gmail.com', '+2348089012345', 'Kenyan', 'male', 'silver', 750, 1, NOW()),
(6, 'Ngozi', 'Eze', 'ngozi.eze@company.ng', '+2348090123456', 'Nigerian', 'female', 'gold', 2200, 1, NOW()),
(7, 'Kwame', 'Asante', 'kwame.a@gmail.com', '+233201234567', 'Ghanaian', 'male', 'member', 150, 1, NOW()),
(8, 'Amara', 'Okonkwo', 'amara.o@company.ng', '+2348123456789', 'Nigerian', 'female', 'silver', 600, 1, NOW()),
(9, 'James', 'Mwangi', 'james.m@tourism.co.ke', '+254722123456', 'Kenyan', 'male', 'gold', 1900, 1, NOW()),
(10, 'Aisha', 'Bello', 'aisha.bello@gmail.com', '+2348134567890', 'Nigerian', 'female', 'member', 300, 1, NOW()),
(11, 'Thabo', 'Mokoena', 'thabo.m@business.co.za', '+27821234567', 'South African', 'male', 'platinum', 6000, 1, NOW()),
(12, 'Chidinma', 'Adeyemi', 'chidinma.a@company.ng', '+2348145678901', 'Nigerian', 'female', 'silver', 850, 1, NOW()),
(13, 'Oluwaseun', 'Adesanya', 'seun.a@gmail.com', '+2348156789012', 'Nigerian', 'male', 'member', 100, 1, NOW()),
(14, 'Linda', 'Mensah', 'linda.m@company.gh', '+233245678901', 'Ghanaian', 'female', 'gold', 2500, 1, NOW()),
(15, 'Emeka', 'Nwankwo', 'emeka.n@company.ng', '+2348167890123', 'Nigerian', 'male', 'silver', 550, 1, NOW()),
(16, 'Wanjiku', 'Kamau', 'wanjiku.k@tourism.co.ke', '+254723456789', 'Kenyan', 'female', 'member', 250, 1, NOW()),
(17, 'Yemi', 'Osunbiyi', 'yemi.o@gmail.com', '+2348178901234', 'Nigerian', 'male', 'platinum', 7500, 1, NOW()),
(18, 'Folake', 'Shonibare', 'folake.s@company.ng', '+2348189012345', 'Nigerian', 'female', 'gold', 1600, 1, NOW()),
(19, 'David', 'Ochieng', 'david.o@travel.co.ke', '+254724567890', 'Kenyan', 'male', 'member', 400, 1, NOW()),
(20, 'Blessing', 'Okoro', 'blessing.o@gmail.com', '+2348190123456', 'Nigerian', 'female', 'silver', 700, 1, NOW())
ON CONFLICT DO NOTHING;

-- ── Reservations (15 active reservations) ──
INSERT INTO reservations (id, reservation_number, guest_id, room_type_id, room_id, property_id, check_in_date, check_out_date, adults, children, status, channel, source, deposit_amount, total_estimated, created_at) VALUES
(1, 'BB-A1B2C3D4', 1, 3, 31, 1, CURRENT_DATE - 2, CURRENT_DATE + 2, 2, 0, 'checked_in', 'direct', 'website', 55000, 220000, NOW() - INTERVAL '7 days'),
(2, 'BB-E5F6G7H8', 2, 4, 41, 1, CURRENT_DATE - 1, CURRENT_DATE + 3, 2, 1, 'checked_in', 'direct', 'telephone', 120000, 480000, NOW() - INTERVAL '5 days'),
(3, 'BB-I9J0K1L2', 3, 1, NULL, 1, CURRENT_DATE + 1, CURRENT_DATE + 4, 1, 0, 'confirmed', 'booking_engine', 'website', 25000, 75000, NOW() - INTERVAL '3 days'),
(4, 'BB-M3N4O5P6', 4, 4, NULL, 1, CURRENT_DATE + 2, CURRENT_DATE + 5, 2, 0, 'confirmed', 'direct', 'telephone', 120000, 360000, NOW() - INTERVAL '2 days'),
(5, 'BB-Q7R8S9T0', 5, 2, 16, 1, CURRENT_DATE - 3, CURRENT_DATE + 1, 2, 0, 'checked_in', 'ota', 'booking_com', 35000, 140000, NOW() - INTERVAL '10 days'),
(6, 'BB-U1V2W3X4', 6, 2, 27, 1, CURRENT_DATE, CURRENT_DATE + 3, 2, 1, 'confirmed', 'corporate', 'email', 35000, 105000, NOW() - INTERVAL '4 days'),
(7, 'BB-Y5Z6A7B8', 7, 1, NULL, 1, CURRENT_DATE + 3, CURRENT_DATE + 5, 1, 0, 'tentative', 'ota', 'expedia', 0, 50000, NOW() - INTERVAL '1 day'),
(8, 'BB-C9D0E1F2', 8, 1, 102, 1, CURRENT_DATE - 2, CURRENT_DATE, 1, 0, 'checked_in', 'direct', 'walk_in', 25000, 50000, NOW() - INTERVAL '3 days'),
(9, 'BB-G3H4I5J6', 9, 2, 28, 1, CURRENT_DATE - 1, CURRENT_DATE + 2, 2, 0, 'checked_in', 'ota', 'booking_com', 35000, 105000, NOW() - INTERVAL '6 days'),
(10, 'BB-K7L8M9N0', 10, 1, NULL, 1, CURRENT_DATE + 1, CURRENT_DATE + 2, 1, 0, 'confirmed', 'direct', 'telephone', 25000, 25000, NOW() - INTERVAL '1 day'),
(11, 'BB-O1P2Q3R4', 11, 4, NULL, 1, CURRENT_DATE + 5, CURRENT_DATE + 8, 2, 1, 'confirmed', 'direct', 'email', 120000, 360000, NOW() - INTERVAL '8 days'),
(12, 'BB-S5T6U7V8', 12, 1, 113, 1, CURRENT_DATE - 4, CURRENT_DATE + 1, 1, 0, 'checked_in', 'direct', 'website', 25000, 125000, NOW() - INTERVAL '12 days'),
(13, 'BB-W9X0Y1Z2', 13, 1, NULL, 1, CURRENT_DATE + 7, CURRENT_DATE + 9, 1, 0, 'tentative', 'ota', 'hotels_ng', 0, 50000, NOW()),
(14, 'BB-A3B4C5D6', 14, 2, NULL, 1, CURRENT_DATE + 4, CURRENT_DATE + 7, 2, 0, 'confirmed', 'corporate', 'email', 35000, 105000, NOW() - INTERVAL '5 days'),
(15, 'BB-E7F8G9H0', 15, 1, NULL, 1, CURRENT_DATE + 1, CURRENT_DATE + 3, 2, 1, 'confirmed', 'direct', 'telephone', 25000, 50000, NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- ── POS Outlets ──
INSERT INTO outlets (id, name, type, property_id, created_at) VALUES
(1, 'Palm Restaurant', 'restaurant', 1, NOW()),
(2, 'Pool Bar', 'bar', 1, NOW()),
(3, 'Room Service', 'room_service', 1, NOW())
ON CONFLICT DO NOTHING;

-- ── Menu Categories ──
INSERT INTO menu_categories (id, name, outlet_id, property_id, created_at) VALUES
(1, 'Nigerian Main', 1, 1, NOW()),
(2, 'Continental', 1, 1, NOW()),
(3, 'Soups & Swallows', 1, 1, NOW()),
(4, 'Grills', 1, 1, NOW()),
(5, 'Sides', 1, 1, NOW()),
(6, 'Cocktails', 2, 1, NOW()),
(7, 'Spirits & Beer', 2, 1, NOW()),
(8, 'Soft Drinks', 2, 1, NOW()),
(9, 'Breakfast', 3, 1, NOW()),
(10, 'Snacks', 3, 1, NOW())
ON CONFLICT DO NOTHING;

-- ── Menu Items ──
INSERT INTO menu_items (id, name, category_id, price, outlet_id, property_id, is_available, created_at) VALUES
(1, 'Jollof Rice & Chicken', 1, 3500, 1, 1, true, NOW()),
(2, 'Fried Rice & Fish', 1, 3000, 1, 1, true, NOW()),
(3, 'Ofada Rice & Ayamase', 1, 4000, 1, 1, true, NOW()),
(4, 'Grilled Tilapia', 4, 4500, 1, 1, true, NOW()),
(5, 'Suya Platter', 4, 2500, 1, 1, true, NOW()),
(6, 'Egusi Soup & Pounded Yam', 3, 2800, 1, 1, true, NOW()),
(7, 'Pepper Soup (Goat)', 3, 2500, 1, 1, true, NOW()),
(8, 'Catfish Pepper Soup', 3, 3500, 1, 1, true, NOW()),
(9, 'Steak & Fries', 2, 8000, 1, 1, true, NOW()),
(10, 'Caesar Salad', 2, 2500, 1, 1, true, NOW()),
(11, 'Fried Plantain', 5, 700, 1, 1, true, NOW()),
(12, 'Coleslaw', 5, 500, 1, 1, true, NOW()),
(13, 'Garri Soaking', 5, 500, 1, 1, true, NOW()),
(14, 'Chapman Cocktail', 6, 1500, 2, 1, true, NOW()),
(15, 'Margarita', 6, 2000, 2, 1, true, NOW()),
(16, 'Pina Colada', 6, 2500, 2, 1, true, NOW()),
(17, 'Long Island Iced Tea', 6, 2500, 2, 1, true, NOW()),
(18, 'Heineken', 7, 800, 2, 1, true, NOW()),
(19, 'Star Lager', 7, 600, 2, 1, true, NOW()),
(20, 'Hennessy VS', 7, 5000, 2, 1, true, NOW()),
(21, 'Johnny Walker Black', 7, 4500, 2, 1, true, NOW()),
(22, 'Fresh Orange Juice', 8, 800, 2, 1, true, NOW()),
(23, 'Malt Drink', 8, 600, 2, 1, true, NOW()),
(24, 'Coca-Cola', 8, 400, 2, 1, true, NOW()),
(25, 'Bottle Water', 8, 300, 2, 1, true, NOW()),
(26, 'Full English Breakfast', 9, 5500, 3, 1, true, NOW()),
(27, 'Nigerian Breakfast', 9, 4500, 3, 1, true, NOW()),
(28, 'Puff Puff (6 pcs)', 10, 800, 3, 1, true, NOW()),
(29, 'Chin Chin', 10, 500, 3, 1, true, NOW()),
(30, 'Meat Pie', 10, 600, 3, 1, true, NOW())
ON CONFLICT DO NOTHING;

-- ── Inventory Products ──
INSERT INTO products (id, sku, name, category, unit, cost_price, selling_price, reorder_level, property_id, created_at) VALUES
(1, 'BEV-001', 'Heineken Beer', 'Beverages', 'bottle', 500, 800, 50, 1, NOW()),
(2, 'BEV-002', 'Coca-Cola', 'Beverages', 'bottle', 200, 400, 100, 1, NOW()),
(3, 'BEV-003', 'Fresh Orange Juice', 'Beverages', 'litre', 300, 800, 30, 1, NOW()),
(4, 'BEV-004', 'Malt Drink', 'Beverages', 'bottle', 350, 600, 50, 1, NOW()),
(5, 'BEV-005', 'Hennessy VS', 'Beverages', 'bottle', 2500, 5000, 10, 1, NOW()),
(6, 'FOOD-001', 'Chicken (Whole)', 'Food', 'kg', 1500, 0, 20, 1, NOW()),
(7, 'FOOD-002', 'Rice (Jollof grade)', 'Food', 'kg', 800, 0, 50, 1, NOW()),
(8, 'FOOD-003', 'Tilapia (Fresh)', 'Food', 'kg', 2000, 0, 15, 1, NOW()),
(9, 'FOOD-004', 'Goat Meat', 'Food', 'kg', 2500, 0, 10, 1, NOW()),
(10, 'FOOD-005', 'Beef (Sirloin)', 'Food', 'kg', 3000, 0, 15, 1, NOW()),
(11, 'HK-001', 'Lysol Disinfectant', 'Housekeeping', 'litre', 800, 0, 20, 1, NOW()),
(12, 'HK-002', 'Bed Sheets (King)', 'Housekeeping', 'piece', 3000, 0, 30, 1, NOW()),
(13, 'HK-003', 'Towels (Bath)', 'Housekeeping', 'piece', 1500, 0, 50, 1, NOW()),
(14, 'HK-004', 'Shampoo (Mini)', 'Housekeeping', 'piece', 150, 0, 200, 1, NOW()),
(15, 'HK-005', 'Toilet Rolls', 'Housekeeping', 'roll', 200, 0, 100, 1, NOW()),
(16, 'PROP-001', 'Laundry Detergent', 'Property', 'kg', 1200, 0, 25, 1, NOW()),
(17, 'PROP-002', 'Generator Diesel', 'Property', 'litre', 700, 0, 200, 1, NOW()),
(18, 'PROP-003', 'Water Treatment Chemical', 'Property', 'litre', 2000, 0, 10, 1, NOW())
ON CONFLICT DO NOTHING;

-- ── Suppliers ──
INSERT INTO suppliers (id, name, contact_person, email, phone, payment_terms, property_id, created_at) VALUES
(1, 'Nigerian Breweries', 'Sales Dept', 'orders@nbplc.com', '+2341-271-2515', 'Net 30', 1, NOW()),
(2, 'Chi Limited', 'Sales', 'orders@chilimited.com', '+2341-461-0500', 'Net 30', 1, NOW()),
(3, 'Lagos Fish Market', 'Musa', 'musa@lagosfishmarket.com', '+2348023456789', 'COD', 1, NOW()),
(4, 'Mega Lifesciences', 'Distributor', 'orders@megalife.com', '+2341-295-0100', 'Net 60', 1, NOW()),
(5, 'CleanPro Supplies', 'Grace', 'grace@cleanpro.ng', '+2348034567890', 'Net 30', 1, NOW())
ON CONFLICT DO NOTHING;

-- ── Users ──
INSERT INTO users (id, email, password_hash, name, role, status, property_id, created_at) VALUES
(1, 'admin@infineon.com', '$2a$10$dummyhashadmin123', 'System Administrator', 'admin', 'active', 1, NOW()),
(2, 'gm@grandpalmlagos.com', '$2a$10$dummyhashgm1234', 'Fatima Abubakar', 'general_manager', 'active', 1, NOW()),
(3, 'fom@grandpalmlagos.com', '$2a$10$dummyhashfom12', 'Adebayo Johnson', 'front_desk_manager', 'active', 1, NOW()),
(4, 'receptionist@grandpalmlagos.com', '$2a$10$dummyhashrec12', 'Chioma Eze', 'receptionist', 'active', 1, NOW()),
(5, 'cashier@grandpalmlagos.com', '$2a$10$dummyhashcsh12', 'Ifeoma Nwosu', 'cashier', 'active', 1, NOW()),
(6, 'hkm@grandpalmlagos.com', '$2a$10$dummyhashhkm12', 'Amina Bello', 'housekeeping_supervisor', 'active', 1, NOW()),
(7, 'accountant@grandpalmlagos.com', '$2a$10$dummyhashact12', 'Emeka Okafor', 'accountant', 'active', 1, NOW()),
(8, 'restaurant@grandpalmlagos.com', '$2a$10$dummyhashrst12', 'Kwame Asante', 'restaurant_manager', 'active', 1, NOW())
ON CONFLICT DO NOTHING;

-- ── Employees ──
INSERT INTO employees (id, employee_number, first_name, last_name, email, phone, department_id, position, employment_date, employment_type, salary, currency_code, property_id, status, created_at) VALUES
(1, 'EMP-001', 'Fatima', 'Abubakar', 'fatima.a@grandpalmlagos.com', '+2348056789012', 1, 'General Manager', '2020-01-15', 'full_time', 800000, 'NGN', 1, 'active', NOW()),
(2, 'EMP-002', 'Adebayo', 'Johnson', 'adebayo.j@grandpalmlagos.com', '+2348034567890', 1, 'Front Office Manager', '2020-03-01', 'full_time', 500000, 'NGN', 1, 'active', NOW()),
(3, 'EMP-003', 'Chioma', 'Eze', 'chioma.e@grandpalmlagos.com', '+2348045678901', 1, 'Senior Receptionist', '2021-06-15', 'full_time', 250000, 'NGN', 1, 'active', NOW()),
(4, 'EMP-004', 'Ifeoma', 'Nwosu', 'ifeoma.n@grandpalmlagos.com', '+2348056789012', 6, 'Cashier', '2022-01-10', 'full_time', 180000, 'NGN', 1, 'active', NOW()),
(5, 'EMP-005', 'Amina', 'Bello', 'amina.b@grandpalmlagos.com', '+2348067890123', 2, 'Housekeeping Supervisor', '2020-05-01', 'full_time', 200000, 'NGN', 1, 'active', NOW()),
(6, 'EMP-006', 'Emeka', 'Okafor', 'emeka.o@grandpalmlagos.com', '+2348078901234', 6, 'Chief Accountant', '2019-09-01', 'full_time', 450000, 'NGN', 1, 'active', NOW()),
(7, 'EMP-007', 'Kwame', 'Asante', 'kwame.a@grandpalmlagos.com', '+233201234567', 3, 'Restaurant Manager', '2021-02-15', 'full_time', 350000, 'NGN', 1, 'active', NOW()),
(8, 'EMP-008', 'Blessing', 'Okoro', 'blessing.o@grandpalmlagos.com', '+2348190123456', 4, 'Head Chef', '2020-08-01', 'full_time', 400000, 'NGN', 1, 'active', NOW()),
(9, 'EMP-009', 'Tunde', 'Adesanya', 'tunde.a@grandpalmlagos.com', '+2348101234567', 5, 'Maintenance Engineer', '2021-11-01', 'full_time', 220000, 'NGN', 1, 'active', NOW()),
(10, 'EMP-010', 'Ngozi', 'Eze', 'ngozi.e@grandpalmlagos.com', '+2348112345678', 7, 'HR Officer', '2022-04-01', 'full_time', 280000, 'NGN', 1, 'active', NOW())
ON CONFLICT DO NOTHING;

-- ── Hardware Devices ──
INSERT INTO hardware_devices (device_type, vendor, model, location, status, firmware_version, property_id, created_at) VALUES
('pos_terminal', 'PAX', 'A920', 'Palm Restaurant', 'online', 'v3.1.2', 1, NOW()),
('pos_terminal', 'PAX', 'A920', 'Pool Bar', 'online', 'v3.1.2', 1, NOW()),
('door_lock', 'JCSMARTS', 'JC-600', 'Floor 1', 'online', 'v2.0.1', 1, NOW()),
('door_lock', 'JCSMARTS', 'JC-600', 'Floor 2', 'online', 'v2.0.1', 1, NOW()),
('door_lock', 'JCSMARTS', 'JC-600', 'Floor 3', 'online', 'v2.0.1', 1, NOW()),
('door_lock', 'JCSMARTS', 'JC-600', 'Floor 4', 'offline', 'v2.0.1', 1, NOW()),
('printer', 'Epson', 'TM-T88VII', 'Palm Restaurant Kitchen', 'online', 'v1.0', 1, NOW()),
('printer', 'Epson', 'TM-T88VII', 'Pool Bar', 'online', 'v1.0', 1, NOW()),
('printer', 'Epson', 'TM-T88VII', 'Front Desk', 'online', 'v1.0', 1, NOW())
ON CONFLICT DO NOTHING;

-- ── Chart of Accounts (Nigerian chart) ──
INSERT INTO chart_of_accounts (id, code, name, class, type, subtype, property_id, created_at) VALUES
(1, '1001', 'Cash on Hand', 'asset', 'balance_sheet', 'current_asset', 1, NOW()),
(2, '1002', 'Petty Cash', 'asset', 'balance_sheet', 'current_asset', 1, NOW()),
(3, '1101', 'Bank - GTBank', 'asset', 'balance_sheet', 'current_asset', 1, NOW()),
(4, '1102', 'Bank - Zenith', 'asset', 'balance_sheet', 'current_asset', 1, NOW()),
(5, '1201', 'Accounts Receivable - Guests', 'asset', 'balance_sheet', 'current_asset', 1, NOW()),
(6, '1202', 'Accounts Receivable - Corporate', 'asset', 'balance_sheet', 'current_asset', 1, NOW()),
(7, '1301', 'Inventory - Food & Beverage', 'asset', 'balance_sheet', 'current_asset', 1, NOW()),
(8, '1302', 'Inventory - Supplies', 'asset', 'balance_sheet', 'current_asset', 1, NOW()),
(9, '1501', 'Property & Equipment', 'asset', 'balance_sheet', 'fixed_asset', 1, NOW()),
(10, '1502', 'Accumulated Depreciation', 'asset', 'balance_sheet', 'fixed_asset', 1, NOW()),
(20, '2001', 'Accounts Payable - Suppliers', 'liability', 'balance_sheet', 'current_liability', 1, NOW()),
(21, '2002', 'VAT Payable', 'liability', 'balance_sheet', 'current_liability', 1, NOW()),
(22, '2003', 'Withholding Tax Payable', 'liability', 'balance_sheet', 'current_liability', 1, NOW()),
(23, '2004', 'Staff Salary Payable', 'liability', 'balance_sheet', 'current_liability', 1, NOW()),
(24, '2005', 'Guest Deposits', 'liability', 'balance_sheet', 'current_liability', 1, NOW()),
(30, '3001', 'Owner Equity', 'equity', 'balance_sheet', 'equity', 1, NOW()),
(31, '3002', 'Retained Earnings', 'equity', 'balance_sheet', 'equity', 1, NOW()),
(40, '4001', 'Room Revenue', 'revenue', 'income', 'operating', 1, NOW()),
(41, '4002', 'Restaurant Revenue', 'revenue', 'income', 'operating', 1, NOW()),
(42, '4003', 'Bar Revenue', 'revenue', 'income', 'operating', 1, NOW()),
(43, '4004', 'Laundry Revenue', 'revenue', 'income', 'operating', 1, NOW()),
(44, '4005', 'Spa Revenue', 'revenue', 'income', 'operating', 1, NOW()),
(45, '4006', 'Other Income', 'revenue', 'income', 'non_operating', 1, NOW()),
(50, '5001', 'Cost of Food', 'expense', 'cost_of_sales', 'food_beverage', 1, NOW()),
(51, '5002', 'Cost of Beverages', 'expense', 'cost_of_sales', 'food_beverage', 1, NOW()),
(52, '5003', 'Cost of Supplies', 'expense', 'cost_of_sales', 'supplies', 1, NOW()),
(60, '6001', 'Staff Salaries', 'expense', 'operating_expense', 'personnel', 1, NOW()),
(61, '6002', 'Staff Benefits', 'expense', 'operating_expense', 'personnel', 1, NOW()),
(62, '6003', 'Electricity', 'expense', 'operating_expense', 'utilities', 1, NOW()),
(63, '6004', 'Water & Sewage', 'expense', 'operating_expense', 'utilities', 1, NOW()),
(64, '6005', 'Internet & Phone', 'expense', 'operating_expense', 'utilities', 1, NOW()),
(65, '6006', 'Maintenance & Repairs', 'expense', 'operating_expense', 'maintenance', 1, NOW()),
(66, '6007', 'Marketing & Advertising', 'expense', 'operating_expense', 'marketing', 1, NOW()),
(67, '6008', 'Insurance', 'expense', 'operating_expense', 'insurance', 1, NOW()),
(68, '6009', 'Generator Fuel', 'expense', 'operating_expense', 'utilities', 1, NOW())
ON CONFLICT DO NOTHING;

-- ── Folios for checked-in guests ──
INSERT INTO folios (id, guest_id, stay_id, folio_number, balance, currency, status, property_id, created_at)
SELECT gs.id, gs.guest_id, gs.id, 'F-' || gs.id, 0, 'NGN', 'open', 1, NOW()
FROM guest_stays gs
ON CONFLICT DO NOTHING;

-- ── Some sample folio charges ──
-- (Would be posted by night audit and POS in production)
