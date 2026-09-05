-- Seed currencies
INSERT INTO currencies (code, name, symbol, decimal_places, is_base) VALUES
('USD', 'US Dollar', '$', 2, TRUE),
('NGN', 'Nigerian Naira', '₦', 2, FALSE),
('GHS', 'Ghanaian Cedi', '₵', 2, FALSE),
('KES', 'Kenyan Shilling', 'KSh', 2, FALSE),
('ZAR', 'South African Rand', 'R', 2, FALSE),
('AED', 'UAE Dirham', 'د.إ', 2, FALSE),
('GBP', 'British Pound', '£', 2, FALSE),
('EUR', 'Euro', '€', 2, FALSE);
