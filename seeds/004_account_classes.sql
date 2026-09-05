-- Seed account classes for double-entry accounting
INSERT INTO account_classes (name, code, type, normal_balance, sort_order) VALUES
('Assets', '1000', 'asset', 'debit', 1),
('Liabilities', '2000', 'liability', 'credit', 2),
('Equity', '3000', 'equity', 'credit', 3),
('Revenue', '4000', 'revenue', 'credit', 4),
('Cost of Sales', '5000', 'cost_of_sales', 'debit', 5),
('Operating Expenses', '6000', 'operating_expense', 'debit', 6);
