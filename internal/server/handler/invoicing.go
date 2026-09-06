package handler

import (
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// ═══════════════════════════════════════════════════════════════
// COMPREHENSIVE INVOICING MODULE
// Professional invoices, quotations, credit notes, customer mgmt,
// analytics, recurring billing, tax auto-calc, PDF export
// ═══════════════════════════════════════════════════════════════

// ── Invoice Types ──

type Invoice struct {
	ID              string        `json:"id"`
	InvoiceNumber   string        `json:"invoice_number"`
	CustomerID      string        `json:"customer_id"`
	CustomerName    string        `json:"customer_name"`
	CustomerEmail   string        `json:"customer_email"`
	Reference       string        `json:"reference"`
	Status          string        `json:"status"` // draft, sent, paid, partial, overdue, void
	Type            string        `json:"type"`   // invoice, quote, recurring
	IssueDate       string        `json:"issue_date"`
	DueDate         string        `json:"due_date"`
	Subtotal        float64       `json:"subtotal"`
	DiscountPct     float64       `json:"discount_pct"`
	DiscountAmount  float64       `json:"discount_amount"`
	TaxAmount       float64       `json:"tax_amount"`
	WHTAmount       float64       `json:"wht_amount"`
	Total           float64       `json:"total"`
	AmountPaid      float64       `json:"amount_paid"`
	BalanceDue      float64       `json:"balance_due"`
	Currency        string        `json:"currency"`
	Notes           string        `json:"notes"`
	PaymentTerms    string        `json:"payment_terms"`
	Items           []InvoiceItem `json:"items,omitempty"`
	CreatedAt       string        `json:"created_at"`
	PaidAt          string        `json:"paid_at,omitempty"`
}

type InvoiceItem struct {
	ID          string  `json:"id"`
	InvoiceID   string  `json:"invoice_id"`
	ProductID   string  `json:"product_id,omitempty"`
	Description string  `json:"description"`
	Quantity    float64 `json:"quantity"`
	UnitPrice   float64 `json:"unit_price"`
	Discount    float64 `json:"discount_pct"`
	TaxRate     float64 `json:"tax_rate"`
	WHTRate     float64 `json:"wht_rate"`
	Amount      float64 `json:"amount"`
	TaxAmount   float64 `json:"tax_amount"`
	WHTAmount   float64 `json:"wht_amount"`
	LineTotal   float64 `json:"line_total"`
}

type Customer struct {
	ID               string  `json:"id"`
	Name             string  `json:"name"`
	Email            string  `json:"email"`
	Phone            string  `json:"phone"`
	Address          string  `json:"address"`
	City             string  `json:"city"`
	Country          string  `json:"country"`
	TaxID            string  `json:"tax_id"`
	Type             string  `json:"type"` // individual, corporate, government
	TotalInvoiced    float64 `json:"total_invoiced"`
	TotalPaid        float64 `json:"total_paid"`
	OutstandingBalance float64 `json:"outstanding_balance"`
	InvoiceCount     int     `json:"invoice_count"`
	PaymentBehavior  string  `json:"payment_behavior"` // excellent, good, slow, poor
	Status           string  `json:"status"`
	CreatedAt        string  `json:"created_at"`
}

type CreditNote struct {
	ID            string  `json:"id"`
	CreditNumber  string  `json:"credit_number"`
	InvoiceID     string  `json:"invoice_id"`
	CustomerID    string  `json:"customer_id"`
	CustomerName  string  `json:"customer_name"`
	Amount        float64 `json:"amount"`
	Reason        string  `json:"reason"`
	Status        string  `json:"status"` // issued, applied, void
	IssueDate     string  `json:"issue_date"`
	AppliedDate   string  `json:"applied_date,omitempty"`
	CreatedAt     string  `json:"created_at"`
}

// ═══════════════════════════════════════════════════════════════
// 1. Create Invoice (with line items, auto tax calc)
// ═══════════════════════════════════════════════════════════════

func (h *Handler) CreateInvoiceV2(w http.ResponseWriter, r *http.Request) {
	var req struct {
		CustomerID    string        `json:"customer_id"`
		CustomerName  string        `json:"customer_name"`
		CustomerEmail string        `json:"customer_email"`
		Reference     string        `json:"reference"`
		IssueDate     string        `json:"issue_date"`
		DueDate       string        `json:"due_date"`
		DiscountPct   float64       `json:"discount_pct"`
		Notes         string        `json:"notes"`
		PaymentTerms  string        `json:"payment_terms"`
		Items         []InvoiceItem `json:"items"`
		AutoSend      bool          `json:"auto_send"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}
	if len(req.Items) == 0 {
		SendError(w, http.StatusBadRequest, "Invoice must have at least one item")
		return
	}
	if req.IssueDate == "" {
		req.IssueDate = time.Now().Format("2006-01-02")
	}
	if req.DueDate == "" {
		req.DueDate = time.Now().AddDate(0, 0, 30).Format("2006-01-02")
	}
	if req.PaymentTerms == "" {
		req.PaymentTerms = "Net 30"
	}

	pid := getPropertyID2(r)
	invoiceID := uuid.New().String()

	// Generate invoice number
	var nextNum int
	_ = h.db.QueryRow(r.Context(), `SELECT COUNT(*) FROM invoices WHERE property_id = $1`, pid).Scan(&nextNum)
	invNum := fmt.Sprintf("INV-%s-%04d", time.Now().Format("200601"), nextNum+1)

	// Calculate line items
	subtotal := 0.0
	totalTax := 0.0
	totalWHT := 0.0

	for i := range req.Items {
		item := &req.Items[i]
		lineAmount := item.Quantity * item.UnitPrice
		lineDiscount := lineAmount * (item.Discount / 100)
		taxableAmount := lineAmount - lineDiscount
		item.TaxAmount = taxableAmount * (item.TaxRate / 100)
		item.WHTAmount = taxableAmount * (item.WHTRate / 100)
		item.Amount = lineAmount - lineDiscount
		item.LineTotal = item.Amount + item.TaxAmount - item.WHTAmount

		subtotal += lineAmount - lineDiscount
		totalTax += item.TaxAmount
		totalWHT += item.WHTAmount
	}

	discountAmount := subtotal * (req.DiscountPct / 100)
	taxableAfterDiscount := subtotal - discountAmount
	totalTax = taxableAfterDiscount * (totalTax / math.Max(subtotal, 1))
	totalWHT = taxableAfterDiscount * (totalWHT / math.Max(subtotal, 1))
	total := taxableAfterDiscount + totalTax - totalWHT

	status := "draft"
	if req.AutoSend {
		status = "sent"
	}

	_, err := h.db.Exec(r.Context(), `
		INSERT INTO invoices (id, property_id, invoice_number, customer_id, customer_name,
		customer_email, reference, status, issue_date, due_date, subtotal, discount_pct,
		discount_amount, tax_amount, wht_amount, total, amount_paid, balance_due,
		currency, notes, payment_terms, created_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,'NGN',$19,$20,CURRENT_TIMESTAMP)`,
		invoiceID, pid, invNum, req.CustomerID, req.CustomerName,
		req.CustomerEmail, req.Reference, status, req.IssueDate, req.DueDate,
		subtotal, req.DiscountPct, discountAmount, totalTax, totalWHT,
		total, 0, total, req.Notes, req.PaymentTerms)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Insert line items
	for i, item := range req.Items {
		itemID := fmt.Sprintf("%s-item-%d", invoiceID, i+1)
		_, _ = h.db.Exec(r.Context(), `
			INSERT INTO invoice_items (id, invoice_id, product_id, description, quantity,
			unit_price, discount_pct, tax_rate, wht_rate, amount, tax_amount, wht_amount, line_total)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
			itemID, invoiceID, item.ProductID, item.Description, item.Quantity,
			item.UnitPrice, item.Discount, item.TaxRate, item.WHTRate,
			item.Amount, item.TaxAmount, item.WHTAmount, item.LineTotal)
	}

	SendCreated(w, map[string]interface{}{
		"id":              invoiceID,
		"invoice_number":  invNum,
		"subtotal":        subtotal,
		"discount_amount": discountAmount,
		"tax_amount":      totalTax,
		"wht_amount":      totalWHT,
		"total":           total,
		"balance_due":     total,
		"status":          status,
		"items":           len(req.Items),
	})
}

// ═══════════════════════════════════════════════════════════════
// 2. List Invoices
// ═══════════════════════════════════════════════════════════════

func (h *Handler) ListInvoicesV2(w http.ResponseWriter, r *http.Request) {
	pid := getPropertyID2(r)
	statusFilter := r.URL.Query().Get("status")
	customerID := r.URL.Query().Get("customer_id")
	search := r.URL.Query().Get("q")

	query := `SELECT id, invoice_number, COALESCE(customer_id,''), COALESCE(customer_name,''),
	          COALESCE(customer_email,''), COALESCE(reference,''), status, COALESCE(issue_date,''),
	          COALESCE(due_date,''), subtotal, discount_amount, tax_amount, wht_amount,
	          total, amount_paid, balance_due, COALESCE(notes,''), COALESCE(payment_terms,''),
	          COALESCE(created_at,'')
	          FROM invoices WHERE property_id = $1`
	args := []interface{}{pid}
	argIdx := 2

	if statusFilter != "" {
		query += fmt.Sprintf(" AND status = $%d", argIdx)
		args = append(args, statusFilter)
		argIdx++
	}
	if customerID != "" {
		query += fmt.Sprintf(" AND customer_id = $%d", argIdx)
		args = append(args, customerID)
		argIdx++
	}
	if search != "" {
		query += fmt.Sprintf(" AND (invoice_number LIKE $%d OR customer_name LIKE $%d OR reference LIKE $%d)", argIdx, argIdx, argIdx)
		args = append(args, "%"+search+"%")
		argIdx++
	}

	query += fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, 50, 0)

	rows, err := h.db.Query(r.Context(), query, args...)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	invoices := []Invoice{}
	for rows.Next() {
		var inv Invoice
		rows.Scan(&inv.ID, &inv.InvoiceNumber, &inv.CustomerID, &inv.CustomerName,
			&inv.CustomerEmail, &inv.Reference, &inv.Status, &inv.IssueDate,
			&inv.DueDate, &inv.Subtotal, &inv.DiscountAmount, &inv.TaxAmount,
			&inv.WHTAmount, &inv.Total, &inv.AmountPaid, &inv.BalanceDue,
			&inv.Notes, &inv.PaymentTerms, &inv.CreatedAt)
		inv.Currency = "NGN"
		invoices = append(invoices, inv)
	}

	SendSuccess(w, invoices)
}

// ═══════════════════════════════════════════════════════════════
// 3. Get Invoice Detail (with line items)
// ═══════════════════════════════════════════════════════════════

func (h *Handler) GetInvoiceDetail(w http.ResponseWriter, r *http.Request) {
	invoiceID := chi.URLParam(r, "id")
	pid := getPropertyID2(r)

	var inv Invoice
	err := h.db.QueryRow(r.Context(), `
		SELECT id, invoice_number, COALESCE(customer_id,''), COALESCE(customer_name,''),
		COALESCE(customer_email,''), COALESCE(reference,''), status, COALESCE(issue_date,''),
		COALESCE(due_date,''), subtotal, discount_pct, discount_amount, tax_amount, wht_amount,
		total, amount_paid, balance_due, COALESCE(notes,''), COALESCE(payment_terms,''),
		COALESCE(created_at,'')
		FROM invoices WHERE id = $1 AND property_id = $2`, invoiceID, pid).Scan(
		&inv.ID, &inv.InvoiceNumber, &inv.CustomerID, &inv.CustomerName,
		&inv.CustomerEmail, &inv.Reference, &inv.Status, &inv.IssueDate,
		&inv.DueDate, &inv.Subtotal, &inv.DiscountPct, &inv.DiscountAmount,
		&inv.TaxAmount, &inv.WHTAmount, &inv.Total, &inv.AmountPaid, &inv.BalanceDue,
		&inv.Notes, &inv.PaymentTerms, &inv.CreatedAt)
	if err != nil {
		SendError(w, http.StatusNotFound, "Invoice not found")
		return
	}
	inv.Currency = "NGN"

	// Get line items
	rows, _ := h.db.Query(r.Context(), `
		SELECT id, COALESCE(product_id,''), description, quantity, unit_price,
		discount_pct, tax_rate, wht_rate, amount, tax_amount, wht_amount, line_total
		FROM invoice_items WHERE invoice_id = $1`, invoiceID)
	defer rows.Close()

	inv.Items = []InvoiceItem{}
	for rows.Next() {
		var item InvoiceItem
		rows.Scan(&item.ID, &item.ProductID, &item.Description, &item.Quantity,
			&item.UnitPrice, &item.Discount, &item.TaxRate, &item.WHTRate,
			&item.Amount, &item.TaxAmount, &item.WHTAmount, &item.LineTotal)
		inv.Items = append(inv.Items, item)
	}

	SendSuccess(w, inv)
}

// ═══════════════════════════════════════════════════════════════
// 4. Record Payment on Invoice
// ═══════════════════════════════════════════════════════════════

func (h *Handler) RecordInvoicePayment(w http.ResponseWriter, r *http.Request) {
	invoiceID := chi.URLParam(r, "id")
	var req struct {
		Amount        float64 `json:"amount"`
		PaymentMethod string  `json:"payment_method"`
		Reference     string  `json:"reference"`
		Date          string  `json:"date"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}
	if req.Amount <= 0 {
		SendError(w, http.StatusBadRequest, "Amount must be positive")
		return
	}

	var currentPaid, total float64
	_ = h.db.QueryRow(r.Context(), `SELECT amount_paid, total FROM invoices WHERE id = $1`, invoiceID).Scan(&currentPaid, &total)

	newPaid := currentPaid + req.Amount
	if newPaid > total {
		SendError(w, http.StatusBadRequest, "Payment exceeds invoice total")
		return
	}

	newStatus := "paid"
	if newPaid < total {
		newStatus = "partial"
	}

	_, _ = h.db.Exec(r.Context(), `
		UPDATE invoices SET amount_paid = $1, balance_due = $2, status = $3,
		paid_at = CASE WHEN $3 = 'paid' THEN CURRENT_TIMESTAMP ELSE paid_at END
		WHERE id = $4`, newPaid, total-newPaid, newStatus, invoiceID)

	SendSuccess(w, map[string]interface{}{
		"invoice_id":  invoiceID,
		"amount":      req.Amount,
		"total_paid":  newPaid,
		"balance_due": total - newPaid,
		"status":      newStatus,
	})
}

// ═══════════════════════════════════════════════════════════════
// 5. Customer Management
// ═══════════════════════════════════════════════════════════════

func (h *Handler) ListInvoiceCustomers(w http.ResponseWriter, r *http.Request) {
	pid := getPropertyID2(r)

	rows, err := h.db.Query(r.Context(), `
		SELECT c.id, COALESCE(c.name,''), COALESCE(c.email,''), COALESCE(c.phone,''),
		COALESCE(c.address,''), COALESCE(c.city,''), COALESCE(c.country,''),
		COALESCE(c.tax_id,''), COALESCE(c.type,'individual'), COALESCE(c.status,'active'), COALESCE(c.created_at,'')
		FROM invoice_customers c WHERE c.property_id = $1 ORDER BY c.name`, pid)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	customers := []Customer{}
	for rows.Next() {
		var c Customer
		rows.Scan(&c.ID, &c.Name, &c.Email, &c.Phone, &c.Address, &c.City,
			&c.Country, &c.TaxID, &c.Type, &c.Status, &c.CreatedAt)
		customers = append(customers, c)
	}

	SendSuccess(w, customers)
}

func (h *Handler) CreateInvoiceCustomer(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name    string `json:"name"`
		Email   string `json:"email"`
		Phone   string `json:"phone"`
		Address string `json:"address"`
		City    string `json:"city"`
		Country string `json:"country"`
		TaxID   string `json:"tax_id"`
		Type    string `json:"type"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}
	if req.Name == "" {
		SendError(w, http.StatusBadRequest, "Name is required")
		return
	}
	if req.Type == "" {
		req.Type = "individual"
	}
	if req.Country == "" {
		req.Country = "Nigeria"
	}

	custID := uuid.New().String()
	pid := getPropertyID2(r)

	_, err := h.db.Exec(r.Context(), `
		INSERT INTO invoice_customers (id, property_id, name, email, phone, address, city, country, tax_id, type, status, created_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'active',CURRENT_TIMESTAMP)`,
		custID, pid, req.Name, req.Email, req.Phone, req.Address, req.City, req.Country, req.TaxID, req.Type)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}

	SendCreated(w, map[string]interface{}{
		"id":      custID,
		"name":    req.Name,
		"message": "Customer created successfully",
	})
}

// ═══════════════════════════════════════════════════════════════
// 6. Quotations & Estimates
// ═══════════════════════════════════════════════════════════════

func (h *Handler) ConvertQuoteToInvoice(w http.ResponseWriter, r *http.Request) {
	quoteID := chi.URLParam(r, "id")
	pid := getPropertyID2(r)

	// Get quote
	var quote Invoice
	err := h.db.QueryRow(r.Context(), `
		SELECT id, invoice_number, COALESCE(customer_id,''), COALESCE(customer_name,''),
		COALESCE(customer_email,''), COALESCE(reference,''), status, COALESCE(issue_date,''),
		COALESCE(due_date,''), subtotal, discount_pct, discount_amount, tax_amount, wht_amount,
		total, COALESCE(notes,''), COALESCE(payment_terms,'')
		FROM invoices WHERE id = $1 AND property_id = $2 AND status = 'draft'`, quoteID, pid).Scan(
		&quote.ID, &quote.InvoiceNumber, &quote.CustomerID, &quote.CustomerName,
		&quote.CustomerEmail, &quote.Reference, &quote.Status, &quote.IssueDate,
		&quote.DueDate, &quote.Subtotal, &quote.DiscountPct, &quote.DiscountAmount,
		&quote.TaxAmount, &quote.WHTAmount, &quote.Total, &quote.Notes, &quote.PaymentTerms)
	if err != nil {
		SendError(w, http.StatusNotFound, "Quotation not found or already converted")
		return
	}

	// Mark quote as converted
	_, _ = h.db.Exec(r.Context(), `UPDATE invoices SET status = 'void' WHERE id = $1`, quoteID)

	// Create new invoice from quote
	var nextNum int
	_ = h.db.QueryRow(r.Context(), `SELECT COUNT(*) FROM invoices WHERE property_id = $1`, pid).Scan(&nextNum)
	invNum := fmt.Sprintf("INV-%s-%04d", time.Now().Format("200601"), nextNum+1)
	invoiceID := uuid.New().String()

	_, _ = h.db.Exec(r.Context(), `
		INSERT INTO invoices (id, property_id, invoice_number, customer_id, customer_name,
		customer_email, reference, status, issue_date, due_date, subtotal, discount_pct,
		discount_amount, tax_amount, wht_amount, total, amount_paid, balance_due,
		currency, notes, payment_terms, created_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,'sent',$8,$9,$10,$11,$12,$13,$14,$15,$15,'NGN',$16,$17,CURRENT_TIMESTAMP)`,
		invoiceID, pid, invNum, quote.CustomerID, quote.CustomerName,
		quote.CustomerEmail, quote.Reference, time.Now().Format("2006-01-02"),
		time.Now().AddDate(0, 0, 30).Format("2006-01-02"),
		quote.Subtotal, quote.DiscountPct, quote.DiscountAmount, quote.TaxAmount,
		quote.WHTAmount, quote.Total, quote.Notes, quote.PaymentTerms)

	// Copy line items
	_, _ = h.db.Exec(r.Context(), `
		INSERT INTO invoice_items (id, invoice_id, product_id, description, quantity,
		unit_price, discount_pct, tax_rate, wht_rate, amount, tax_amount, wht_amount, line_total)
		SELECT replace(id, $1, $2), $2, product_id, description, quantity,
		unit_price, discount_pct, tax_rate, wht_rate, amount, tax_amount, wht_amount, line_total
		FROM invoice_items WHERE invoice_id = $1`, quoteID, invoiceID)

	SendCreated(w, map[string]interface{}{
		"quote_id":         quoteID,
		"invoice_id":       invoiceID,
		"invoice_number":   invNum,
		"total":            quote.Total,
		"status":           "sent",
		"message":          "Quotation converted to invoice successfully",
	})
}

// ═══════════════════════════════════════════════════════════════
// 7. Credit Notes
// ═══════════════════════════════════════════════════════════════

func (h *Handler) CreateCreditNote(w http.ResponseWriter, r *http.Request) {
	var req struct {
		InvoiceID   string  `json:"invoice_id"`
		CustomerID  string  `json:"customer_id"`
		CustomerName string `json:"customer_name"`
		Amount      float64 `json:"amount"`
		Reason      string  `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}
	if req.Amount <= 0 {
		SendError(w, http.StatusBadRequest, "Amount must be positive")
		return
	}

	creditID := uuid.New().String()
	creditNum := fmt.Sprintf("CN-%s-%04d", time.Now().Format("200601"), time.Now().UnixNano()%10000)
	pid := getPropertyID2(r)

	_, err := h.db.Exec(r.Context(), `
		INSERT INTO credit_notes (id, property_id, credit_number, invoice_id, customer_id,
		customer_name, amount, reason, status, issue_date, created_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'issued',CURRENT_DATE,CURRENT_TIMESTAMP)`,
		creditID, pid, creditNum, req.InvoiceID, req.CustomerID,
		req.CustomerName, req.Amount, req.Reason)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// If linked to invoice, update balance
	if req.InvoiceID != "" {
		_, _ = h.db.Exec(r.Context(), `
			UPDATE invoices SET amount_paid = amount_paid + $1, balance_due = balance_due - $1
			WHERE id = $2`, req.Amount, req.InvoiceID)
	}

	SendCreated(w, map[string]interface{}{
		"id":            creditID,
		"credit_number": creditNum,
		"amount":        req.Amount,
		"status":        "issued",
	})
}

func (h *Handler) ListCreditNotes(w http.ResponseWriter, r *http.Request) {
	pid := getPropertyID2(r)

	rows, err := h.db.Query(r.Context(), `
		SELECT id, credit_number, COALESCE(invoice_id,''), COALESCE(customer_id,''),
		COALESCE(customer_name,''), amount, COALESCE(reason,''), status,
		COALESCE(issue_date,''), COALESCE(created_at,'')
		FROM credit_notes WHERE property_id = $1 ORDER BY created_at DESC`, pid)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	notes := []CreditNote{}
	for rows.Next() {
		var cn CreditNote
		rows.Scan(&cn.ID, &cn.CreditNumber, &cn.InvoiceID, &cn.CustomerID,
			&cn.CustomerName, &cn.Amount, &cn.Reason, &cn.Status, &cn.IssueDate, &cn.CreatedAt)
		notes = append(notes, cn)
	}

	SendSuccess(w, notes)
}

// ═══════════════════════════════════════════════════════════════
// 8. Invoice Analytics
// ═══════════════════════════════════════════════════════════════

func (h *Handler) GetInvoiceAnalytics(w http.ResponseWriter, r *http.Request) {
	pid := getPropertyID2(r)

	type StatusSummary struct {
		Status string  `json:"status"`
		Count  int     `json:"count"`
		Total  float64 `json:"total"`
	}

	// By status
	rows, _ := h.db.Query(r.Context(), `
		SELECT status, COUNT(*), COALESCE(SUM(total), 0)
		FROM invoices WHERE property_id = $1
		GROUP BY status`, pid)
	defer rows.Close()

	statuses := []StatusSummary{}
	totalInvoiced, totalPaid, totalOutstanding := 0.0, 0.0, 0.0
	for rows.Next() {
		var s StatusSummary
		rows.Scan(&s.Status, &s.Count, &s.Total)
		statuses = append(statuses, s)
		totalInvoiced += s.Total
		if s.Status == "paid" {
			totalPaid += s.Total
		}
		if s.Status == "sent" || s.Status == "overdue" || s.Status == "partial" {
			totalOutstanding += s.Total
		}
	}

	// Top customers
	topRows, _ := h.db.Query(r.Context(), `
		SELECT COALESCE(customer_name,''), SUM(total), COUNT(*)
		FROM invoices WHERE property_id = $1 AND status != 'void'
		GROUP BY customer_name ORDER BY SUM(total) DESC LIMIT 5`, pid)
	defer topRows.Close()

	type TopCustomer struct {
		Name   string  `json:"name"`
		Total  float64 `json:"total"`
		Count  int     `json:"count"`
	}
	topCustomers := []TopCustomer{}
	for topRows.Next() {
		var tc TopCustomer
		topRows.Scan(&tc.Name, &tc.Total, &tc.Count)
		topCustomers = append(topCustomers, tc)
	}

	// Collection rate
	collectionRate := 0.0
	if totalInvoiced > 0 {
		collectionRate = math.Round(totalPaid/totalInvoiced*10000) / 100
	}

	SendSuccess(w, map[string]interface{}{
		"total_invoiced":   totalInvoiced,
		"total_paid":       totalPaid,
		"total_outstanding": totalOutstanding,
		"collection_rate":  collectionRate,
		"currency":         "NGN",
		"by_status":        statuses,
		"top_customers":    topCustomers,
	})
}

// ═══════════════════════════════════════════════════════════════
// 9. PDF Export (generates HTML-ready invoice data)
// ═══════════════════════════════════════════════════════════════

func (h *Handler) ExportInvoicePDF(w http.ResponseWriter, r *http.Request) {
	invoiceID := chi.URLParam(r, "id")
	pid := getPropertyID2(r)

	var inv Invoice
	err := h.db.QueryRow(r.Context(), `
		SELECT id, invoice_number, COALESCE(customer_name,''), COALESCE(customer_email,''),
		COALESCE(reference,''), status, COALESCE(issue_date,''), COALESCE(due_date,''),
		subtotal, discount_amount, tax_amount, wht_amount, total, amount_paid, balance_due,
		COALESCE(notes,''), COALESCE(payment_terms,'')
		FROM invoices WHERE id = $1 AND property_id = $2`, invoiceID, pid).Scan(
		&inv.ID, &inv.InvoiceNumber, &inv.CustomerName, &inv.CustomerEmail,
		&inv.Reference, &inv.Status, &inv.IssueDate, &inv.DueDate,
		&inv.Subtotal, &inv.DiscountAmount, &inv.TaxAmount, &inv.WHTAmount,
		&inv.Total, &inv.AmountPaid, &inv.BalanceDue, &inv.Notes, &inv.PaymentTerms)
	if err != nil {
		SendError(w, http.StatusNotFound, "Invoice not found")
		return
	}
	inv.Currency = "NGN"

	// Get items
	rows, _ := h.db.Query(r.Context(), `
		SELECT description, quantity, unit_price, discount_pct, tax_rate, amount, tax_amount, line_total
		FROM invoice_items WHERE invoice_id = $1`, invoiceID)
	defer rows.Close()

	type PDFItem struct {
		Description string  `json:"description"`
		Quantity    float64 `json:"quantity"`
		UnitPrice   float64 `json:"unit_price"`
		Discount    float64 `json:"discount_pct"`
		TaxRate     float64 `json:"tax_rate"`
		Amount      float64 `json:"amount"`
		TaxAmount   float64 `json:"tax_amount"`
		LineTotal   float64 `json:"line_total"`
	}

	items := []PDFItem{}
	for rows.Next() {
		var item PDFItem
		rows.Scan(&item.Description, &item.Quantity, &item.UnitPrice, &item.Discount,
			&item.TaxRate, &item.Amount, &item.TaxAmount, &item.LineTotal)
		items = append(items, item)
	}

	// Get company info
	var companyName, companyAddress, companyPhone, companyEmail string
	_ = h.db.QueryRow(r.Context(), `
		SELECT COALESCE(name,''), COALESCE(address,''), COALESCE(phone,''), COALESCE(email,'')
		FROM company_profiles WHERE property_id = $1 LIMIT 1`, pid).Scan(
		&companyName, &companyAddress, &companyPhone, &companyEmail)

	SendSuccess(w, map[string]interface{}{
		"invoice": inv,
		"items":   items,
		"company": map[string]string{
			"name":    companyName,
			"address": companyAddress,
			"phone":   companyPhone,
			"email":   companyEmail,
		},
		"format": "PDF-ready JSON data — render with a PDF library (wkhtmltopdf, puppeteer, etc.)",
	})
}

// ═══════════════════════════════════════════════════════════════
// 10. Void Invoice
// ═══════════════════════════════════════════════════════════════

func (h *Handler) VoidInvoice(w http.ResponseWriter, r *http.Request) {
	invoiceID := chi.URLParam(r, "id")

	var status string
	_ = h.db.QueryRow(r.Context(), `SELECT status FROM invoices WHERE id = $1`, invoiceID).Scan(&status)
	if status == "paid" {
		SendError(w, http.StatusBadRequest, "Cannot void a paid invoice")
		return
	}

	_, _ = h.db.Exec(r.Context(), `UPDATE invoices SET status = 'void' WHERE id = $1`, invoiceID)

	SendSuccess(w, map[string]interface{}{
		"id":     invoiceID,
		"status": "void",
	})
}

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

func invAtoi(s string) int {
	n, _ := strconv.Atoi(s)
	return n
}

// Ensure unused imports are consumed
var _ = strings.TrimSpace
