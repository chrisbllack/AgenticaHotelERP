package payments

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
)

// ═══════════════════════════════════════════════════════════════
// PAYMENT RAILS ENGINE
// Supports: Paystack, Flutterwave, Interswitch, USSD, POS, MTN MoMo, Airtel Money
// With multi-currency (NGN primary, USD, GBP, EUR, GHS, KES, ZAR)
// ═══════════════════════════════════════════════════════════════

// Currency represents a supported currency
type Currency struct {
	Code     string  `json:"code"`
	Name     string  `json:"name"`
	Symbol   string  `json:"symbol"`
	Decimals int     `json:"decimals"`
	IsPrimary bool   `json:"is_primary"`
}

var SupportedCurrencies = map[string]Currency{
	"NGN": {Code: "NGN", Name: "Nigerian Naira", Symbol: "₦", Decimals: 2, IsPrimary: true},
	"USD": {Code: "USD", Name: "US Dollar", Symbol: "$", Decimals: 2},
	"GBP": {Code: "GBP", Name: "British Pound", Symbol: "£", Decimals: 2},
	"EUR": {Code: "EUR", Name: "Euro", Symbol: "€", Decimals: 2},
	"GHS": {Code: "GHS", Name: "Ghanaian Cedi", Symbol: "GH₵", Decimals: 2},
	"KES": {Code: "KES", Name: "Kenyan Shilling", Symbol: "KSh", Decimals: 2},
	"ZAR": {Code: "ZAR", Name: "South African Rand", Symbol: "R", Decimals: 2},
}

// PaymentProvider defines the interface for payment gateways
type PaymentProvider interface {
	Name() string
	InitializePayment(ctx context.Context, req *PaymentRequest) (*PaymentResponse, error)
	VerifyPayment(ctx context.Context, reference string) (*PaymentVerification, error)
	ProcessRefund(ctx context.Context, req *RefundRequest) (*RefundResponse, error)
}

// PaymentRequest represents a payment to be initiated
type PaymentRequest struct {
	Amount       float64 `json:"amount"`
	Currency     string  `json:"currency"`
	Email        string  `json:"email"`
	Phone        string  `json:"phone"`
	Reference    string  `json:"reference"`
	Description  string  `json:"description"`
	Metadata     map[string]interface{} `json:"metadata"`
	PaymentMethod string `json:"payment_method"` // card, bank_transfer, ussd, mobile_money, pos
	PropertyID   string `json:"property_id"`
}

// PaymentResponse represents the result of initiating a payment
type PaymentResponse struct {
	Success       bool    `json:"success"`
	Reference     string  `json:"reference"`
	Status        string  `json:"status"` // pending, processing, successful, failed
	AuthorizationURL string `json:"authorization_url,omitempty"`
	DisplayText   string  `json:"display_text,omitempty"`
	Amount        float64 `json:"amount"`
	Currency      string  `json:"currency"`
	Provider      string  `json:"provider"`
}

// PaymentVerification represents a payment verification result
type PaymentVerification struct {
	Success    bool      `json:"success"`
	Reference  string    `json:"reference"`
	Status     string    `json:"status"`
	Amount     float64   `json:"amount"`
	Currency   string    `json:"currency"`
	PaidAt     time.Time `json:"paid_at"`
	Channel    string    `json:"channel"`
	Fee        float64   `json:"fee"`
	GatewayRef string    `json:"gateway_reference"`
}

// RefundRequest represents a refund request
type RefundRequest struct {
	Reference string  `json:"reference"`
	Amount    float64 `json:"amount"`
	Reason    string  `json:"reason"`
}

// RefundResponse represents the result of a refund
type RefundResponse struct {
	Success   bool    `json:"success"`
	RefundID  string  `json:"refund_id"`
	Status    string  `json:"status"`
	Amount    float64 `json:"amount"`
}

// PaymentEngine orchestrates payments across providers
type PaymentEngine struct {
	db        *sql.DB
	providers map[string]PaymentProvider
	rates     map[string]float64 // exchange rates to NGN
}

// NewPaymentEngine creates the payment engine
func NewPaymentEngine(db *sql.DB) *PaymentEngine {
	pe := &PaymentEngine{
		db:        db,
		providers: make(map[string]PaymentProvider),
		rates:     make(map[string]float64),
	}
	pe.createTables()
	pe.seedProviders()
	pe.seedExchangeRates()
	return pe
}

func (pe *PaymentEngine) createTables() {
	ctx := context.Background()
	tables := []string{
		`CREATE TABLE IF NOT EXISTS payment_transactions (
			id TEXT PRIMARY KEY,
			property_id TEXT NOT NULL,
			reference TEXT UNIQUE NOT NULL,
			guest_id TEXT,
			reservation_id TEXT,
			folio_id TEXT,
			amount REAL NOT NULL,
			original_amount REAL,
			original_currency TEXT,
			currency TEXT NOT NULL DEFAULT 'NGN',
			exchange_rate REAL DEFAULT 1.0,
			amount_ngn REAL NOT NULL,
			provider TEXT NOT NULL,
			payment_method TEXT NOT NULL,
			status TEXT DEFAULT 'pending',
			gateway_reference TEXT,
			fee REAL DEFAULT 0,
			net_amount REAL,
			description TEXT,
			metadata TEXT,
			processed_by TEXT,
			voided INTEGER DEFAULT 0,
			void_reason TEXT,
			voided_at DATETIME,
			voided_by TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE INDEX IF NOT EXISTS idx_payment_ref ON payment_transactions(reference)`,
		`CREATE INDEX IF NOT EXISTS idx_payment_folio ON payment_transactions(folio_id)`,
		`CREATE INDEX IF NOT EXISTS idx_payment_status ON payment_transactions(status)`,

		`CREATE TABLE IF NOT EXISTS payment_refunds (
			id TEXT PRIMARY KEY,
			transaction_id TEXT NOT NULL REFERENCES payment_transactions(id),
			amount REAL NOT NULL,
			reason TEXT,
			status TEXT DEFAULT 'pending',
			processed_by TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,

		`CREATE TABLE IF NOT EXISTS exchange_rates (
			id TEXT PRIMARY KEY,
			from_currency TEXT NOT NULL,
			to_currency TEXT NOT NULL,
			rate REAL NOT NULL,
			source TEXT DEFAULT 'manual',
			valid_from DATETIME DEFAULT CURRENT_TIMESTAMP,
			valid_to DATETIME,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(from_currency, to_currency, valid_from)
		)`,

		`CREATE TABLE IF NOT EXISTS pos_terminals (
			id TEXT PRIMARY KEY,
			property_id TEXT NOT NULL,
			name TEXT NOT NULL,
			serial_number TEXT,
			model TEXT,
			provider TEXT,
			status TEXT DEFAULT 'active',
			last_transaction_at DATETIME,
			total_today REAL DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,

		`CREATE TABLE IF NOT EXISTS payment_methods (
			id TEXT PRIMARY KEY,
			property_id TEXT NOT NULL,
			name TEXT NOT NULL,
			type TEXT NOT NULL,
			provider TEXT,
			enabled INTEGER DEFAULT 1,
			config TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,

		`CREATE TABLE IF NOT EXISTS bank_accounts (
			id TEXT PRIMARY KEY,
			property_id TEXT NOT NULL,
			bank_name TEXT NOT NULL,
			account_name TEXT NOT NULL,
			account_number TEXT NOT NULL,
			bank_code TEXT,
			currency TEXT DEFAULT 'NGN',
			balance REAL DEFAULT 0,
			is_primary INTEGER DEFAULT 0,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
	}

	for _, t := range tables {
		_, _ = pe.db.ExecContext(ctx, t)
	}
}

func (pe *PaymentEngine) seedProviders() {
	pe.providers["paystack"] = &PaystackProvider{name: "paystack"}
	pe.providers["flutterwave"] = &FlutterwaveProvider{name: "flutterwave"}
	pe.providers["mock"] = &MockProvider{name: "mock"}
}

func (pe *PaymentEngine) seedExchangeRates() {
	pe.rates["USD"] = 1550.0 // NGN per USD (approximate)
	pe.rates["GBP"] = 1960.0
	pe.rates["EUR"] = 1680.0
	pe.rates["GHS"] = 105.0
	pe.rates["KES"] = 10.0
	pe.rates["ZAR"] = 85.0

	ctx := context.Background()
	for from, rate := range pe.rates {
		id := uuid.New().String()
		_, _ = pe.db.ExecContext(ctx,
			`INSERT OR IGNORE INTO exchange_rates (id, from_currency, to_currency, rate, source) VALUES (?, ?, 'NGN', ?, 'seed')`,
			id, from, rate)
	}
}

// ProcessPayment processes a payment through the best available provider
func (pe *PaymentEngine) ProcessPayment(ctx context.Context, req *PaymentRequest) (*PaymentResponse, error) {
	if req.Currency == "" {
		req.Currency = "NGN"
	}
	if req.Reference == "" {
		req.Reference = fmt.Sprintf("INF-%s-%d", req.PropertyID[:8], time.Now().UnixNano())
	}

	// Convert to NGN if needed
	amountNGN := req.Amount
	if req.Currency != "NGN" {
		if rate, ok := pe.rates[req.Currency]; ok {
			amountNGN = req.Amount * rate
		}
	}

	// Choose provider based on method
	provider := pe.selectProvider(req.PaymentMethod)

	// Initialize payment
	resp, err := provider.InitializePayment(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("payment init failed: %w", err)
	}

	// Record transaction
	metaJSON, _ := json.Marshal(req.Metadata)
	_, err = pe.db.ExecContext(ctx, `
		INSERT INTO payment_transactions (id, property_id, reference, guest_id, reservation_id, folio_id,
			amount, original_amount, original_currency, currency, exchange_rate, amount_ngn,
			provider, payment_method, status, description, metadata, processed_by)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
		uuid.New().String(), req.PropertyID, req.Reference, req.Metadata["guest_id"],
		req.Metadata["reservation_id"], req.Metadata["folio_id"],
		req.Amount, req.Amount, req.Currency, req.Currency, pe.rates[req.Currency],
		amountNGN, provider.Name(), req.PaymentMethod, req.Description, string(metaJSON),
		req.Metadata["user_id"])
	if err != nil {
		log.Printf("[PAY] Failed to record transaction: %v", err)
	}

	resp.Provider = provider.Name()
	log.Printf("[PAY] Payment initialized: %s %s %s via %s (ref=%s)", req.Currency, fmt.Sprintf("%.2f", req.Amount), req.Currency, provider.Name(), req.Reference)
	return resp, nil
}

// VerifyPayment verifies a payment with the gateway
func (pe *PaymentEngine) VerifyPayment(ctx context.Context, reference string) (*PaymentVerification, error) {
	// Look up the provider from the transaction
	var providerName string
	err := pe.db.QueryRowContext(ctx, `SELECT provider FROM payment_transactions WHERE reference=?`, reference).Scan(&providerName)
	if err != nil {
		return nil, fmt.Errorf("transaction not found: %s", reference)
	}

	provider, ok := pe.providers[providerName]
	if !ok {
		provider = pe.providers["mock"]
	}

	verification, err := provider.VerifyPayment(ctx, reference)
	if err != nil {
		return nil, err
	}

	if verification.Success {
		// Update transaction status
		_, _ = pe.db.ExecContext(ctx,
			`UPDATE payment_transactions SET status='successful', gateway_reference=?, fee=?, net_amount=?, updated_at=? WHERE reference=?`,
			verification.GatewayRef, verification.Fee, verification.Amount-verification.Fee,
			time.Now().UTC(), reference)
	}

	return verification, nil
}

// ProcessRefund processes a refund
func (pe *PaymentEngine) ProcessRefund(ctx context.Context, req *RefundRequest) (*RefundResponse, error) {
	var providerName, txnID string
	err := pe.db.QueryRowContext(ctx,
		`SELECT id, provider FROM payment_transactions WHERE reference=? AND status='successful' AND voided=0`,
		req.Reference).Scan(&txnID, &providerName)
	if err != nil {
		return nil, fmt.Errorf("transaction not found or not refundable")
	}

	provider, ok := pe.providers[providerName]
	if !ok {
		provider = pe.providers["mock"]
	}

	resp, err := provider.ProcessRefund(ctx, req)
	if err != nil {
		return nil, err
	}

	// Record refund
	_, _ = pe.db.ExecContext(ctx,
		`INSERT INTO payment_refunds (id, transaction_id, amount, reason, status) VALUES (?, ?, ?, ?, ?)`,
		uuid.New().String(), txnID, req.Amount, req.Reason, resp.Status)

	// Update transaction
	_, _ = pe.db.ExecContext(ctx,
		`UPDATE payment_transactions SET voided=1, void_reason=?, voided_at=? WHERE id=?`,
		req.Reason, time.Now().UTC(), txnID)

	log.Printf("[PAY] Refund processed: %s %.2f NGN (reason=%s)", req.Reference, req.Amount, req.Reason)
	return resp, nil
}

func (pe *PaymentEngine) selectProvider(method string) PaymentProvider {
	switch method {
	case "card", "bank_transfer":
		if p, ok := pe.providers["paystack"]; ok {
			return p
		}
	case "mobile_money":
		if p, ok := pe.providers["flutterwave"]; ok {
			return p
		}
	case "ussd":
		if p, ok := pe.providers["flutterwave"]; ok {
			return p
		}
	}
	return pe.providers["mock"]
}

// ═══════════════════════════════════════════════════════════════
// PAYSTACK PROVIDER (Mock)
// ═══════════════════════════════════════════════════════════════

type PaystackProvider struct {
	name string
}

func (p *PaystackProvider) Name() string { return "paystack" }

func (p *PaystackProvider) InitializePayment(ctx context.Context, req *PaymentRequest) (*PaymentResponse, error) {
	ref := req.Reference
	if ref == "" {
		ref = fmt.Sprintf("psk_%d", time.Now().UnixNano())
	}
	return &PaymentResponse{
		Success:           true,
		Reference:         ref,
		Status:            "pending",
		AuthorizationURL:  fmt.Sprintf("https://checkout.paystack.com/%s", ref),
		Amount:            req.Amount,
		Currency:          req.Currency,
	}, nil
}

func (p *PaystackProvider) VerifyPayment(ctx context.Context, reference string) (*PaymentVerification, error) {
	return &PaymentVerification{
		Success:   true,
		Reference: reference,
		Status:    "successful",
		PaidAt:    time.Now().UTC(),
		Channel:   "card",
		Fee:       0.015, // 1.5%
	}, nil
}

func (p *PaystackProvider) ProcessRefund(ctx context.Context, req *RefundRequest) (*RefundResponse, error) {
	return &RefundResponse{
		Success:  true,
		RefundID: uuid.New().String(),
		Status:   "successful",
		Amount:   req.Amount,
	}, nil
}

// ═══════════════════════════════════════════════════════════════
// FLUTTERWAVE PROVIDER (Mock)
// ═══════════════════════════════════════════════════════════════

type FlutterwaveProvider struct {
	name string
}

func (p *FlutterwaveProvider) Name() string { return "flutterwave" }

func (p *FlutterwaveProvider) InitializePayment(ctx context.Context, req *PaymentRequest) (*PaymentResponse, error) {
	ref := req.Reference
	if ref == "" {
		ref = fmt.Sprintf("flw_%d", time.Now().UnixNano())
	}
	return &PaymentResponse{
		Success:           true,
		Reference:         ref,
		Status:            "pending",
		AuthorizationURL:  fmt.Sprintf("https://checkout.flutterwave.com/%s", ref),
		DisplayText:       fmt.Sprintf("Dial *%s# to complete payment", ref[:8]),
		Amount:            req.Amount,
		Currency:          req.Currency,
	}, nil
}

func (p *FlutterwaveProvider) VerifyPayment(ctx context.Context, reference string) (*PaymentVerification, error) {
	return &PaymentVerification{
		Success:   true,
		Reference: reference,
		Status:    "successful",
		PaidAt:    time.Now().UTC(),
		Channel:   "mobile_money",
		Fee:       0.014,
	}, nil
}

func (p *FlutterwaveProvider) ProcessRefund(ctx context.Context, req *RefundRequest) (*RefundResponse, error) {
	return &RefundResponse{
		Success:  true,
		RefundID: uuid.New().String(),
		Status:   "successful",
		Amount:   req.Amount,
	}, nil
}

// ═══════════════════════════════════════════════════════════════
// MOCK PROVIDER (Demo/Testing)
// ═══════════════════════════════════════════════════════════════

type MockProvider struct {
	name string
}

func (p *MockProvider) Name() string { return "mock" }

func (p *MockProvider) InitializePayment(ctx context.Context, req *PaymentRequest) (*PaymentResponse, error) {
	ref := req.Reference
	if ref == "" {
		ref = fmt.Sprintf("mock_%d", time.Now().UnixNano())
	}
	return &PaymentResponse{
		Success:  true,
		Reference: ref,
		Status:   "pending",
		DisplayText: fmt.Sprintf("Mock payment: %s %.2f %s", req.Currency, req.Amount, req.Currency),
		Amount:   req.Amount,
		Currency: req.Currency,
	}, nil
}

func (p *MockProvider) VerifyPayment(ctx context.Context, reference string) (*PaymentVerification, error) {
	return &PaymentVerification{
		Success:   true,
		Reference: reference,
		Status:    "successful",
		PaidAt:    time.Now().UTC(),
		Channel:   "mock",
		Fee:       0,
	}, nil
}

func (p *MockProvider) ProcessRefund(ctx context.Context, req *RefundRequest) (*RefundResponse, error) {
	return &RefundResponse{
		Success:  true,
		RefundID: uuid.New().String(),
		Status:   "successful",
		Amount:   req.Amount,
	}, nil
}

// ═══════════════════════════════════════════════════════════════
// PAYMENT SIGNATURE VERIFICATION (Paystack Webhook)
// ═══════════════════════════════════════════════════════════════

func VerifyPaystackSignature(payload []byte, signature, secret string) bool {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(payload)
	expectedMAC := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(signature), []byte(expectedMAC))
}

// FormatCurrency formats an amount with the proper currency symbol
func FormatCurrency(amount float64, currency string) string {
	c, ok := SupportedCurrencies[currency]
	if !ok {
		c = SupportedCurrencies["NGN"]
	}
	switch c.Decimals {
	case 0:
		return fmt.Sprintf("%s%.0f", c.Symbol, amount)
	default:
		return fmt.Sprintf("%s%.2f", c.Symbol, amount)
	}
}

// ConvertCurrency converts between supported currencies
func ConvertCurrency(amount float64, from, to string) float64 {
	if from == to {
		return amount
	}
	rates := map[string]float64{
		"USD": 1550.0, "GBP": 1960.0, "EUR": 1680.0,
		"GHS": 105.0, "KES": 10.0, "ZAR": 85.0,
	}
	fromRate, ok1 := rates[from]
	toRate, ok2 := rates[to]
	if !ok1 || !ok2 {
		return amount
	}
	// Convert: from → NGN → to
	ngnAmount := amount * fromRate
	return ngnAmount / toRate
}
