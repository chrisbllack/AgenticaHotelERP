-- 006: POS Demo Data
-- Uses the demo property from 005_demo_hotel.sql

DO $$
DECLARE
    prop_id UUID;
    outlet_rest UUID;
    outlet_bar UUID;
    cat_main UUID;
    cat_starters UUID;
    cat_desserts UUID;
    cat_beverages UUID;
BEGIN
    SELECT id INTO prop_id FROM properties WHERE code = 'DEMO-HOTEL' LIMIT 1;
    IF prop_id IS NULL THEN RETURN; END IF;

    -- Outlets
    INSERT INTO outlets (id, property_id, name, code, type, status) VALUES
    (uuid_generate_v4(), prop_id, 'Main Restaurant', 'REST-01', 'restaurant', 'active')
    RETURNING id INTO outlet_rest;

    INSERT INTO outlets (id, property_id, name, code, type, status) VALUES
    (uuid_generate_v4(), prop_id, 'Pool Bar', 'BAR-01', 'bar', 'active')
    RETURNING id INTO outlet_bar;

    -- Restaurant Tables
    INSERT INTO pos_tables (property_id, outlet_id, number, capacity, section, status) VALUES
    (prop_id, outlet_rest, 'T1', 2, 'Main', 'available'),
    (prop_id, outlet_rest, 'T2', 2, 'Main', 'available'),
    (prop_id, outlet_rest, 'T3', 4, 'Main', 'available'),
    (prop_id, outlet_rest, 'T4', 4, 'Main', 'occupied'),
    (prop_id, outlet_rest, 'T5', 6, 'Main', 'available'),
    (prop_id, outlet_rest, 'T6', 6, 'Main', 'available'),
    (prop_id, outlet_rest, 'T7', 8, 'Private', 'available'),
    (prop_id, outlet_rest, 'T8', 10, 'Private', 'reserved'),
    (prop_id, outlet_rest, 'VT1', 2, 'Patio', 'available'),
    (prop_id, outlet_rest, 'VT2', 4, 'Patio', 'available');

    -- Bar Tables
    INSERT INTO pos_tables (property_id, outlet_id, number, capacity, section, status) VALUES
    (prop_id, outlet_bar, 'B1', 2, 'Bar', 'available'),
    (prop_id, outlet_bar, 'B2', 2, 'Bar', 'available'),
    (prop_id, outlet_bar, 'B3', 4, 'Lounge', 'available'),
    (prop_id, outlet_bar, 'B4', 4, 'Lounge', 'available');

    -- Menu Categories (Restaurant)
    INSERT INTO menu_categories (property_id, outlet_id, name, code, display_order) VALUES
    (prop_id, outlet_rest, 'Starters', 'START', 1) RETURNING id INTO cat_starters,
    (prop_id, outlet_rest, 'Main Course', 'MAIN', 2) RETURNING id INTO cat_main,
    (prop_id, outlet_rest, 'Desserts', 'DESS', 3) RETURNING id INTO cat_desserts;

    -- Menu Categories (Bar)
    INSERT INTO menu_categories (property_id, outlet_id, name, code, display_order) VALUES
    (prop_id, outlet_bar, 'Beverages', 'BEV', 1) RETURNING id INTO cat_beverages;

    -- Starters
    INSERT INTO menu_items (property_id, category_id, name, code, price, preparation_time) VALUES
    (prop_id, cat_starters, 'Spring Rolls', 'SPR-001', 8.50, 10),
    (prop_id, cat_starters, 'Caesar Salad', 'SAL-001', 10.00, 5),
    (prop_id, cat_starters, 'Soup of the Day', 'SOP-001', 7.00, 8),
    (prop_id, cat_starters, 'Shrimp Cocktail', 'SPR-002', 14.00, 8),
    (prop_id, cat_starters, 'Bruschetta', 'SPR-003', 9.00, 6);

    -- Main Course
    INSERT INTO menu_items (property_id, category_id, name, code, price, preparation_time) VALUES
    (prop_id, cat_main, 'Grilled Chicken', 'MAI-001', 22.00, 20),
    (prop_id, cat_main, 'Beef Steak', 'MAI-002', 35.00, 25),
    (prop_id, cat_main, 'Fish & Chips', 'MAI-003', 18.00, 15),
    (prop_id, cat_main, 'Pasta Carbonara', 'MAI-004', 16.00, 12),
    (prop_id, cat_main, 'Lamb Chops', 'MAI-005', 38.00, 25),
    (prop_id, cat_main, 'Vegetable Stir Fry', 'MAI-006', 14.00, 10),
    (prop_id, cat_main, 'Jollof Rice & Chicken', 'MAI-007', 15.00, 15),
    (prop_id, cat_main, 'Grilled Tilapia', 'MAI-008', 20.00, 20);

    -- Desserts
    INSERT INTO menu_items (property_id, category_id, name, code, price, preparation_time) VALUES
    (prop_id, cat_desserts, 'Chocolate Cake', 'DES-001', 9.00, 3),
    (prop_id, cat_desserts, 'Ice Cream Sundae', 'DES-002', 7.00, 3),
    (prop_id, cat_desserts, 'Fruit Platter', 'DES-003', 10.00, 5),
    (prop_id, cat_desserts, 'Crème Brûlée', 'DES-004', 11.00, 5);

    -- Beverages (Bar)
    INSERT INTO menu_items (property_id, category_id, name, code, price, preparation_time) VALUES
    (prop_id, cat_beverages, 'Coca Cola', 'BEV-001', 3.00, 1),
    (prop_id, cat_beverages, 'Fresh Orange Juice', 'BEV-002', 5.00, 3),
    (prop_id, cat_beverages, 'Heineken Beer', 'BEV-003', 6.00, 1),
    (prop_id, cat_beverages, 'House Wine (Red)', 'BEV-004', 8.00, 1),
    (prop_id, cat_beverages, 'House Wine (White)', 'BEV-005', 8.00, 1),
    (prop_id, cat_beverages, 'Cocktail - Mojito', 'BEV-006', 12.00, 5),
    (prop_id, cat_beverages, 'Cocktail - Margarita', 'BEV-007', 12.00, 5),
    (prop_id, cat_beverages, 'Bottled Water', 'BEV-008', 2.00, 1),
    (prop_id, cat_beverages, 'Espresso Coffee', 'BEV-009', 4.00, 3),
    (prop_id, cat_beverages, 'Green Tea', 'BEV-010', 3.00, 3);

    -- Inventory Stores
    INSERT INTO inventory_stores (id, property_id, name, code, type, status) VALUES
    (uuid_generate_v4(), prop_id, 'Main Store', 'STORE-01', 'warehouse', 'active'),
    (uuid_generate_v4(), prop_id, 'Kitchen Store', 'STORE-02', 'kitchen', 'active'),
    (uuid_generate_v4(), prop_id, 'Bar Store', 'STORE-03', 'bar', 'active'),
    (uuid_generate_v4(), prop_id, 'Housekeeping Store', 'STORE-04', 'housekeeping', 'active');

END $$;
