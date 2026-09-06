package handler

import (
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// ═══════════════════════════════════════════════════════════════
// EXPENSE MANAGEMENT MODULE
// 12 Categories: Salaries, Rent/Utilities, Inventory, Logistics,
// Marketing, Equipment, Training, Tax/Compliance, Travel,
// Insurance, Software, Miscellaneous
// ═══════════════════════════════════════════════════════════════

// ── Expense Category Definitions ──

type ExpenseCategory struct {
	ID          string  `json:"id"`
	Code        string  `json:"code"`
	Name        string  `json:"name"`
	Icon        string  `json:"icon"`
	Description string  `json:"description"`
	BudgetPct   float64 `json:"budget_pct"` // Average % of total expenses
	IsActive    bool    `json:"is_active"`
}

var ExpenseCategories = []ExpenseCategory{
	{ID: "exp-salary", Code: "SAL", Name: "Salaries & Wages", Icon: "💰", Description: "Staff salaries, bonuses, allowances, contractor payments — per employee or department", BudgetPct: 37.5},
	{ID: "exp-rent", Code: "RNT", Name: "Rent & Utilities", Icon: "🏢", Description: "Office rent, shop rent, electricity, water, internet, facility running costs", BudgetPct: 20.0},
	{ID: "exp-inventory", Code: "INV", Name: "Inventory & Purchases", Icon: "📦", Description: "Cost of goods purchased for resale, raw materials, stock replenishment across all branches", BudgetPct: 16.0},
	{ID: "exp-logistics", Code: "LOG", Name: "Logistics & Delivery", Icon: "🚚", Description: "Freight, dispatch riders, warehouse costs, fuel, last-mile delivery per order or period", BudgetPct: 12.0},
	{ID: "exp-marketing", Code: "MKT", Name: "Marketing & Advertising", Icon: "📣", Description: "Social media ads, billboards, influencer fees, print materials, promotional spend", BudgetPct: 8.0},
	{ID: "exp-equipment", Code: "EQP", Name: "Equipment & Maintenance", Icon: "🔧", Description: "POS machines, computers, generators, AC units — purchase, repair and maintenance costs", BudgetPct: 6.5},
	{ID: "exp-training", Code: "TRN", Name: "Training & Development", Icon: "🎓", Description: "Staff training, workshops, certifications, learning subscriptions", BudgetPct: 3.0},
	{ID: "exp-tax", Code: "TAX", Name: "Tax & Compliance", Icon: "🧾", Description: "VAT payments, PAYE remittances, professional fees, audit costs, regulatory obligations", BudgetPct: 4.5},
	{ID: "exp-travel", Code: "TRV", Name: "Travel & Entertainment", Icon: "✈️", Description: "Business travel, client entertainment, accommodation, per diem allowances per trip or event", BudgetPct: 3.0},
	{ID: "exp-insurance", Code: "INS", Name: "Insurance & Security", Icon: "🔒", Description: "Business insurance premiums, security guard costs, CCTV maintenance, fire safety", BudgetPct: 2.5},
	{ID: "exp-software", Code: "SFT", Name: "Software & Subscriptions", Icon: "💻", Description: "SaaS tools, ERP subscriptions, cloud storage, domain and hosting fees", BudgetPct: 2.0},
	{ID: "exp-misc", Code: "MSC", Name: "Miscellaneous", Icon: "📎", Description: "Any expense that does not fit a standard category — fully customizable with notes and attachments", BudgetPct: 5.0},
}

// ── Expense Record ──

type ExpenseRecord struct {
	ID           string  `json:"id"`
	CategoryID   string  `json:"category_id"`
	CategoryName string  `json:"category_name"`
	CategoryIcon string  `json:"category_icon"`
	DepartmentID string  `json:"department_id,omitempty"`
	Department   string  `json:"department,omitempty"`
	Description  string  `json:"description"`
	Amount       float64 `json:"amount"`
	Currency     string  `json:"currency"`
	Vendor       string  `json:"vendor"`
	InvoiceNo    string  `json:"invoice_no,omitempty"`
	Date         string  `json:"date"`
	PaymentMethod string `json:"payment_method,omitempty"`
	Reference    string  `json:"reference,omitempty"`
	ReceiptURL   string  `json:"receipt_url,omitempty"`
	Status       string  `json:"status"` // draft, pending_approval, approved, rejected, paid
	ApprovedBy   string  `json:"approved_by,omitempty"`
	ApprovedAt   string  `json:"approved_at,omitempty"`
	PaidAt       string  `json:"paid_at,omitempty"`
	CreatedBy    string  `json:"created_by,omitempty"`
	Notes        string  `json:"notes,omitempty"`
	CreatedAt    string  `json:"created_at"`
}

// ── Category Summary ──

type ExpenseSummary struct {
	CategoryID    string  `json:"category_id"`
	CategoryName  string  `json:"category_name"`
	CategoryIcon  string  `json:"category_icon"`
	TotalAmount   float64 `json:"total_amount"`
	Count         int     `json:"count"`
	AvgPerExpense float64 `json:"avg_per_expense"`
	PctOfTotal    float64 `json:"pct_of_total"`
	BudgetPct     float64 `json:"budget_pct"`
	Status        string  `json:"status"` // within_budget, over_budget, under_budget
}

// ═══════════════════════════════════════════════════════════════
// 1. List Expense Categories
// ═══════════════════════════════════════════════════════════════

func (h *Handler) ListExpenseCategories(w http.ResponseWriter, r *http.Request) {
	SendSuccess(w, ExpenseCategories)
}

// ═══════════════════════════════════════════════════════════════
// 2. Create Expense
// ═══════════════════════════════════════════════════════════════

func (h *Handler) CreateExpense(w http.ResponseWriter, r *http.Request) {
	var req struct {
		CategoryID    string  `json:"category_id"`
		DepartmentID  string  `json:"department_id"`
		Description   string  `json:"description"`
		Amount        float64 `json:"amount"`
		Vendor        string  `json:"vendor"`
		InvoiceNo     string  `json:"invoice_no"`
		Date          string  `json:"date"`
		PaymentMethod string  `json:"payment_method"`
		ReceiptURL    string  `json:"receipt_url"`
		Notes         string  `json:"notes"`
		AutoApprove   bool    `json:"auto_approve"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}
	if req.CategoryID == "" {
		SendError(w, http.StatusBadRequest, "category_id is required")
		return
	}
	if req.Amount <= 0 {
		SendError(w, http.StatusBadRequest, "Amount must be positive")
		return
	}
	if req.Date == "" {
		req.Date = time.Now().Format("2006-01-02")
	}

	// Find category name
	catName, catIcon := "", ""
	for _, c := range ExpenseCategories {
		if c.ID == req.CategoryID {
			catName = c.Name
			catIcon = c.Icon
			break
		}
	}

	status := "pending_approval"
	if req.AutoApprove {
		status = "approved"
	}

	expenseID := uuid.New().String()
	pid := getPropertyID2(r)
	ref := fmt.Sprintf("EXP-%s", time.Now().Format("20060102150405"))

	_, err := h.db.Exec(r.Context(), `
		INSERT INTO expenses (id, property_id, category, description, amount, vendor, reference, date, status, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)`,
		expenseID, pid, req.CategoryID, req.Description, req.Amount,
		req.Vendor, ref, req.Date, status)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}

	SendCreated(w, map[string]interface{}{
		"id":            expenseID,
		"reference":     ref,
		"category_id":   req.CategoryID,
		"category_name": catName,
		"category_icon": catIcon,
		"amount":        req.Amount,
		"status":        status,
		"message":       "Expense created successfully",
	})
}

// ═══════════════════════════════════════════════════════════════
// 3. List Expenses (with filters)
// ═══════════════════════════════════════════════════════════════

func (h *Handler) ListExpensesV2(w http.ResponseWriter, r *http.Request) {
	pid := getPropertyID2(r)
	categoryID := r.URL.Query().Get("category")
	statusFilter := r.URL.Query().Get("status")
	search := r.URL.Query().Get("q")
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	perPage, _ := strconv.Atoi(r.URL.Query().Get("per_page"))
	if page <= 0 {
		page = 1
	}
	if perPage <= 0 {
		perPage = 50
	}
	offset := (page - 1) * perPage

	query := `SELECT id, COALESCE(category,''), COALESCE(description,''), amount,
	          COALESCE(vendor,''), COALESCE(reference,''), COALESCE(date,''),
	          COALESCE(status,'draft'), COALESCE(approved_by,''), COALESCE(created_at,'')
	          FROM expenses WHERE property_id = $1`
	args := []interface{}{pid}
	argIdx := 2

	if categoryID != "" {
		query += fmt.Sprintf(" AND category = $%d", argIdx)
		args = append(args, categoryID)
		argIdx++
	}
	if statusFilter != "" {
		query += fmt.Sprintf(" AND status = $%d", argIdx)
		args = append(args, statusFilter)
		argIdx++
	}
	if search != "" {
		query += fmt.Sprintf(" AND (description LIKE $%d OR vendor LIKE $%d OR reference LIKE $%d)", argIdx, argIdx, argIdx)
		args = append(args, "%"+search+"%")
		argIdx++
	}

	// Get total count
	countQuery := "SELECT COUNT(*) FROM (" + query + ")"

	var total int
	_ = h.db.QueryRow(r.Context(), countQuery, args...).Scan(&total)

	query += fmt.Sprintf(" ORDER BY date DESC, created_at DESC LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, perPage, offset)

	rows, err := h.db.Query(r.Context(), query, args...)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	expenses := []ExpenseRecord{}
	for rows.Next() {
		var e ExpenseRecord
		rows.Scan(&e.ID, &e.CategoryID, &e.Description, &e.Amount,
			&e.Vendor, &e.Reference, &e.Date, &e.Status, &e.ApprovedBy, &e.CreatedAt)
		e.Currency = "NGN"

		// Resolve category name
		for _, c := range ExpenseCategories {
			if c.ID == e.CategoryID {
				e.CategoryName = c.Name
				e.CategoryIcon = c.Icon
				break
			}
		}
		expenses = append(expenses, e)
	}

	SendSuccess(w, map[string]interface{}{
		"expenses":   expenses,
		"total":      total,
		"page":       page,
		"per_page":   perPage,
		"total_pages": int(math.Ceil(float64(total) / float64(perPage))),
	})
}

// ═══════════════════════════════════════════════════════════════
// 4. Approve / Reject Expense
// ═══════════════════════════════════════════════════════════════

func (h *Handler) ApproveExpenseV2(w http.ResponseWriter, r *http.Request) {
	expenseID := chi.URLParam(r, "id")
	var req struct {
		Action string `json:"action"` // approve, reject
		Notes  string `json:"notes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	status := "approved"
	if req.Action == "reject" {
		status = "rejected"
	}

	_, err := h.db.Exec(r.Context(), `
		UPDATE expenses SET status = $1, approved_by = $2 WHERE id = $3`,
		status, "admin@infineon.com", expenseID)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}

	SendSuccess(w, map[string]interface{}{
		"id":     expenseID,
		"status": status,
		"action": req.Action,
	})
}

// ═══════════════════════════════════════════════════════════════
// 5. Expense Summary / Analytics
// ═══════════════════════════════════════════════════════════════

func (h *Handler) GetExpenseSummary(w http.ResponseWriter, r *http.Request) {
	pid := getPropertyID2(r)
	period := r.URL.Query().Get("period") // 2026-09, or empty for all

	query := `SELECT category, COALESCE(SUM(amount), 0), COUNT(*)
	          FROM expenses WHERE property_id = $1 AND status = 'approved'`
	args := []interface{}{pid}
	argIdx := 2

	if period != "" {
		query += fmt.Sprintf(" AND date LIKE $%d || '%%'", argIdx)
		args = append(args, period)
		argIdx++
	}
	query += " GROUP BY category ORDER BY SUM(amount) DESC"

	rows, err := h.db.Query(r.Context(), query, args...)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	summaries := []ExpenseSummary{}
	totalAmount := 0.0

	for rows.Next() {
		var s ExpenseSummary
		rows.Scan(&s.CategoryID, &s.TotalAmount, &s.Count)
		totalAmount += s.TotalAmount
		if s.Count > 0 {
			s.AvgPerExpense = math.Round(s.TotalAmount/float64(s.Count)*100) / 100
		}

		// Resolve category info
		for _, c := range ExpenseCategories {
			if c.ID == s.CategoryID {
				s.CategoryName = c.Name
				s.CategoryIcon = c.Icon
				s.BudgetPct = c.BudgetPct
				break
			}
		}
		summaries = append(summaries, s)
	}

	// Calculate percentages and status
	for i := range summaries {
		if totalAmount > 0 {
			summaries[i].PctOfTotal = math.Round(summaries[i].TotalAmount/totalAmount*10000) / 100
		}
		if summaries[i].PctOfTotal > summaries[i].BudgetPct*1.1 {
			summaries[i].Status = "over_budget"
		} else if summaries[i].PctOfTotal < summaries[i].BudgetPct*0.8 {
			summaries[i].Status = "under_budget"
		} else {
			summaries[i].Status = "within_budget"
		}
	}

	// Add zero-value categories that have no expenses yet
	existing := map[string]bool{}
	for _, s := range summaries {
		existing[s.CategoryID] = true
	}
	for _, c := range ExpenseCategories {
		if !existing[c.ID] {
			summaries = append(summaries, ExpenseSummary{
				CategoryID:   c.ID,
				CategoryName: c.Name,
				CategoryIcon: c.Icon,
				BudgetPct:    c.BudgetPct,
				Status:       "no_expenses",
			})
		}
	}

	SendSuccess(w, map[string]interface{}{
		"period":          period,
		"total_approved":  totalAmount,
		"categories":      summaries,
		"currency":        "NGN",
		"budget_guidance": "Benchmarks based on African hotel industry averages",
	})
}

// ═══════════════════════════════════════════════════════════════
// 6. Expense by Department
// ═══════════════════════════════════════════════════════════════

func (h *Handler) GetExpenseByDepartment(w http.ResponseWriter, r *http.Request) {
	pid := getPropertyID2(r)

	type DeptExpense struct {
		Department string  `json:"department"`
		Total      float64 `json:"total"`
		Count      int     `json:"count"`
	}

	// Get expenses grouped by category (as department proxy)
	rows, err := h.db.Query(r.Context(), `
		SELECT category, COALESCE(SUM(amount), 0), COUNT(*)
		FROM expenses WHERE property_id = $1 AND status = 'approved'
		GROUP BY category ORDER BY SUM(amount) DESC`, pid)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	depts := []DeptExpense{}
	for rows.Next() {
		var d DeptExpense
		rows.Scan(&d.Department, &d.Total, &d.Count)
		depts = append(depts, d)
	}

	SendSuccess(w, depts)
}

// ═══════════════════════════════════════════════════════════════
// 7. Expense Trend (Monthly)
// ═══════════════════════════════════════════════════════════════

func (h *Handler) GetExpenseTrend(w http.ResponseWriter, r *http.Request) {
	pid := getPropertyID2(r)
	months, _ := strconv.Atoi(r.URL.Query().Get("months"))
	if months <= 0 {
		months = 12
	}

	type MonthTrend struct {
		Month   string  `json:"month"`
		Total   float64 `json:"total"`
		Count   int     `json:"count"`
	}

	rows, err := h.db.Query(r.Context(), `
		SELECT substr(date, 1, 7) as month, COALESCE(SUM(amount), 0), COUNT(*)
		FROM expenses WHERE property_id = $1 AND status = 'approved'
		GROUP BY month ORDER BY month DESC LIMIT $2`, pid, months)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	trends := []MonthTrend{}
	for rows.Next() {
		var t MonthTrend
		rows.Scan(&t.Month, &t.Total, &t.Count)
		trends = append(trends, t)
	}

	SendSuccess(w, trends)
}

// ═══════════════════════════════════════════════════════════════
// 8. Bulk Create Expenses (for seed data)
// ═══════════════════════════════════════════════════════════════

func (h *Handler) BulkCreateExpenses(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Expenses []struct {
			CategoryID  string  `json:"category_id"`
			Description string  `json:"description"`
			Amount      float64 `json:"amount"`
			Vendor      string  `json:"vendor"`
			Date        string  `json:"date"`
		} `json:"expenses"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	pid := getPropertyID2(r)
	created := 0

	for _, e := range req.Expenses {
		expenseID := uuid.New().String()
		ref := fmt.Sprintf("EXP-%s-%04d", time.Now().Format("20060102"), created+1)
		if e.Date == "" {
			e.Date = time.Now().Format("2006-01-02")
		}
		_, _ = h.db.Exec(r.Context(), `
			INSERT INTO expenses (id, property_id, category, description, amount, vendor, reference, date, status, created_at)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'approved', CURRENT_TIMESTAMP)`,
			expenseID, pid, e.CategoryID, e.Description, e.Amount,
			e.Vendor, ref, e.Date)
		created++
	}

	SendCreated(w, map[string]interface{}{
		"created": created,
		"message": fmt.Sprintf("%d expenses created successfully", created),
	})
}

// ═══════════════════════════════════════════════════════════════
// 9. Delete Expense (only draft/rejected)
// ═══════════════════════════════════════════════════════════════

func (h *Handler) DeleteExpense(w http.ResponseWriter, r *http.Request) {
	expenseID := chi.URLParam(r, "id")

	// Check status
	var status string
	err := h.db.QueryRow(r.Context(), `SELECT status FROM expenses WHERE id = $1`, expenseID).Scan(&status)
	if err != nil {
		SendError(w, http.StatusNotFound, "Expense not found")
		return
	}
	if status == "approved" || status == "paid" {
		SendError(w, http.StatusBadRequest, "Cannot delete approved or paid expenses")
		return
	}

	_, _ = h.db.Exec(r.Context(), `DELETE FROM expenses WHERE id = $1`, expenseID)

	SendSuccess(w, map[string]interface{}{
		"id":      expenseID,
		"deleted": true,
	})
}
