package handler

import (
	"encoding/json"
	"net/http"
	"math"

	"github.com/go-chi/chi/v5"
)

// ── Bank Reconciliation ──

type BankReconciliation struct {
	ID              int     `json:"id"`
	BankAccountID   int     `json:"bank_account_id"`
	AccountName     string  `json:"account_name"`
	StatementDate   string  `json:"statement_date"`
	StatementBalance float64 `json:"statement_balance"`
	SystemBalance   float64 `json:"system_balance"`
	Difference      float64 `json:"difference"`
	Status          string  `json:"status"` // pending, reconciled, discrepancy
	MatchedItems    int     `json:"matched_items"`
	UnmatchedItems  int     `json:"unmatched_items"`
}

type BankTransaction struct {
	ID            int     `json:"id"`
	Date          string  `json:"date"`
	Description   string  `json:"description"`
	Debit         float64 `json:"debit"`
	Credit        float64 `json:"credit"`
	Balance       float64 `json:"balance"`
	Reference     string  `json:"reference"`
	Matched       bool    `json:"matched"`
	SystemEntryID int     `json:"system_entry_id,omitempty"`
}

// ListBankReconciliations returns reconciliation history
func (h *Handler) ListBankReconciliations(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	rows, err := h.db.Query(ctx, `
		SELECT br.id, br.bank_account_id, COALESCE(ba.account_name, ''),
		       br.statement_date::text, br.statement_balance, br.system_balance,
		       br.statement_balance - br.system_balance, br.status,
		       COALESCE(br.matched_items, 0), COALESCE(br.unmatched_items, 0)
		FROM bank_reconciliations br
		LEFT JOIN bank_accounts ba ON ba.id = br.bank_account_id
		WHERE br.property_id = $1
		ORDER BY br.statement_date DESC LIMIT 20
	`, ctx.Value("property_id"))
	if err != nil {
		jsonError(w, "Failed to load reconciliations", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var recs []BankReconciliation
	for rows.Next() {
		var br BankReconciliation
		rows.Scan(&br.ID, &br.BankAccountID, &br.AccountName, &br.StatementDate,
			&br.StatementBalance, &br.SystemBalance, &br.Difference,
			&br.Status, &br.MatchedItems, &br.UnmatchedItems)
		recs = append(recs, br)
	}
	jsonSuccess(w, recs)
}

// CreateBankReconciliation starts a new reconciliation
func (h *Handler) CreateBankReconciliation(w http.ResponseWriter, r *http.Request) {
	var req struct {
		BankAccountID    int     `json:"bank_account_id"`
		StatementDate    string  `json:"statement_date"`
		StatementBalance float64 `json:"statement_balance"`
		Transactions     []BankTransaction `json:"transactions"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	// Get system balance
	var systemBalance float64
	_ = h.db.QueryRow(ctx, `
		SELECT COALESCE(SUM(debit - credit), 0) FROM journal_entries
		WHERE account_id = $1 AND posted = true
	`, req.BankAccountID).Scan(&systemBalance)

	difference := req.StatementBalance - systemBalance
	status := "reconciled"
	if math.Abs(difference) > 0.01 {
		status = "discrepancy"
	}

	_, err := h.db.Exec(ctx, `
		INSERT INTO bank_reconciliations (
			bank_account_id, statement_date, statement_balance, system_balance,
			status, matched_items, unmatched_items, property_id, created_by, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
	`, req.BankAccountID, req.StatementDate, req.StatementBalance, systemBalance,
		status, len(req.Transactions), 0, ctx.Value("property_id"), ctx.Value("user_id"))
	if err != nil {
		jsonError(w, "Failed to create reconciliation", http.StatusInternalServerError)
		return
	}

	jsonSuccess(w, map[string]interface{}{
		"message":         "Reconciliation created",
		"status":          status,
		"difference":      difference,
		"system_balance":  systemBalance,
		"statement_balance": req.StatementBalance,
	})
}

// ── Fixed Assets ──

type FixedAsset struct {
	ID              int     `json:"id"`
	AssetCode       string  `json:"asset_code"`
	Name            string  `json:"name"`
	Category        string  `json:"category"`
	Location        string  `json:"location"`
	Department      string  `json:"department"`
	PurchaseDate    string  `json:"purchase_date"`
	PurchaseCost    float64 `json:"purchase_cost"`
	DepreciationMethod string `json:"depreciation_method"` // straight_line, declining_balance
	UsefulLife      int     `json:"useful_life_months"`
	DepreciationPerMonth float64 `json:"depreciation_per_month"`
	AccumulatedDep  float64 `json:"accumulated_depreciation"`
	CurrentValue    float64 `json:"current_value"`
	Status          string  `json:"status"` // active, disposed, fully_depreciated
}

// ListFixedAssets returns all fixed assets
func (h *Handler) ListFixedAssets(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	rows, err := h.db.Query(ctx, `
		SELECT id, asset_code, name, category, COALESCE(location, ''),
		       COALESCE(department, ''), purchase_date::text, purchase_cost,
		       COALESCE(depreciation_method, 'straight_line'),
		       COALESCE(useful_life_months, 60),
		       COALESCE(depreciation_per_month, 0),
		       COALESCE(accumulated_depreciation, 0),
		       purchase_cost - COALESCE(accumulated_depreciation, 0),
		       status
		FROM fixed_assets
		WHERE property_id = $1
		ORDER BY category, name
	`, ctx.Value("property_id"))
	if err != nil {
		jsonError(w, "Failed to load assets", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var assets []FixedAsset
	for rows.Next() {
		var a FixedAsset
		rows.Scan(&a.ID, &a.AssetCode, &a.Name, &a.Category, &a.Location,
			&a.Department, &a.PurchaseDate, &a.PurchaseCost,
			&a.DepreciationMethod, &a.UsefulLife, &a.DepreciationPerMonth,
			&a.AccumulatedDep, &a.CurrentValue, &a.Status)
		assets = append(assets, a)
	}
	jsonSuccess(w, assets)
}

// CreateFixedAsset adds a new asset
func (h *Handler) CreateFixedAsset(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name            string  `json:"name"`
		Category        string  `json:"category"`
		Location        string  `json:"location"`
		Department      string  `json:"department"`
		PurchaseDate    string  `json:"purchase_date"`
		PurchaseCost    float64 `json:"purchase_cost"`
		DepreciationMethod string `json:"depreciation_method"`
		UsefulLife      int     `json:"useful_life_months"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.UsefulLife <= 0 { req.UsefulLife = 60 }
	depPerMonth := req.PurchaseCost / float64(req.UsefulLife)

	ctx := r.Context()
	var assetID int
	err := h.db.QueryRow(ctx, `
		INSERT INTO fixed_assets (
			asset_code, name, category, location, department, purchase_date,
			purchase_cost, depreciation_method, useful_life_months,
			depreciation_per_month, status, property_id, created_at
		) VALUES (
			'AST-' || LPAD(COALESCE((SELECT MAX(id) FROM fixed_assets WHERE property_id = $1), 0) + 1, 4, '0'),
			$2, $3, $4, $5, $6, $7, $8, $9, $10, 'active', $1, NOW()
		) RETURNING id
	`, ctx.Value("property_id"), req.Name, req.Category, req.Location,
		req.Department, req.PurchaseDate, req.PurchaseCost,
		req.DepreciationMethod, req.UsefulLife, depPerMonth).Scan(&assetID)
	if err != nil {
		jsonError(w, "Failed to create asset", http.StatusInternalServerError)
		return
	}

	jsonSuccess(w, map[string]interface{}{
		"id":      assetID,
		"message": "Asset created",
	})
}

// RunDepreciation calculates and posts depreciation for all active assets
func (h *Handler) RunDepreciation(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tx, err := h.db.Begin(ctx)
	if err != nil {
		jsonError(w, "Transaction failed", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(ctx)

	// Get all active assets
	rows, err := tx.Query(ctx, `
		SELECT id, name, depreciation_per_month, accumulated_depreciation, purchase_cost
		FROM fixed_assets
		WHERE property_id = $1 AND status = 'active'
	`, ctx.Value("property_id"))
	if err != nil {
		jsonError(w, "Failed to query assets", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	posted := 0
	for rows.Next() {
		var id int
		var name string
		var depMonth, accumDep, purchaseCost float64
		rows.Scan(&id, &name, &depMonth, &accumDep, &purchaseCost)

		newAccum := accumDep + depMonth
		if newAccum > purchaseCost {
			newAccum = purchaseCost
			depMonth = purchaseCost - accumDep
		}

		if depMonth <= 0 {
			// Fully depreciated
			_, _ = tx.Exec(ctx, `UPDATE fixed_assets SET status = 'fully_depreciated' WHERE id = $1`, id)
			continue
		}

		// Update accumulated depreciation
		_, _ = tx.Exec(ctx, `
			UPDATE fixed_assets SET accumulated_depreciation = $1 WHERE id = $2
		`, newAccum, id)

		// Post depreciation journal entry
		_, _ = tx.Exec(ctx, `
			INSERT INTO journal_entries (entry_date, description, debit_account_id, credit_account_id, amount, status, property_id, created_by, created_at)
			VALUES (CURRENT_DATE, 'Depreciation: ' || $1, 62, 10, $2, 'posted', $3, $4, NOW())
		`, name, depMonth, ctx.Value("property_id"), ctx.Value("user_id"))

		posted++
	}

	if err := tx.Commit(ctx); err != nil {
		jsonError(w, "Failed to post depreciation", http.StatusInternalServerError)
		return
	}

	jsonSuccess(w, map[string]interface{}{
		"message": "Depreciation posted",
		"assets_processed": posted,
	})
}

// ── Expense Management ──

type ExpenseClaim struct {
	ID          int     `json:"id"`
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Category    string  `json:"category"`
	Amount      float64 `json:"amount"`
	Currency    string  `json:"currency"`
	Status      string  `json:"status"` // draft, submitted, approved, paid, rejected
	SubmittedBy string  `json:"submitted_by"`
	ApprovedBy  string  `json:"approved_by,omitempty"`
	Date        string  `json:"date"`
	ReceiptURL  string  `json:"receipt_url,omitempty"`
}

// ListExpenseClaims returns expense claims
func (h *Handler) ListExpenseClaims(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	rows, err := h.db.Query(ctx, `
		SELECT ec.id, ec.title, COALESCE(ec.description, ''), ec.category,
		       ec.amount, COALESCE(ec.currency, 'NGN'), ec.status,
		       COALESCE(u1.name, ''), COALESCE(u2.name, ''),
		       ec.created_at::text, COALESCE(ec.receipt_url, '')
		FROM expense_claims ec
		LEFT JOIN users u1 ON u1.id = ec.submitted_by
		LEFT JOIN users u2 ON u2.id = ec.approved_by
		WHERE ec.property_id = $1
		ORDER BY ec.created_at DESC LIMIT 50
	`, ctx.Value("property_id"))
	if err != nil {
		jsonError(w, "Failed to load expenses", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var claims []ExpenseClaim
	for rows.Next() {
		var e ExpenseClaim
		rows.Scan(&e.ID, &e.Title, &e.Description, &e.Category, &e.Amount,
			&e.Currency, &e.Status, &e.SubmittedBy, &e.ApprovedBy, &e.Date, &e.ReceiptURL)
		claims = append(claims, e)
	}
	jsonSuccess(w, claims)
}

// CreateExpenseClaim submits a new expense claim
func (h *Handler) CreateExpenseClaim(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Title       string  `json:"title"`
		Description string  `json:"description"`
		Category    string  `json:"category"`
		Amount      float64 `json:"amount"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	var claimID int
	err := h.db.QueryRow(ctx, `
		INSERT INTO expense_claims (title, description, category, amount, status, submitted_by, property_id, created_at)
		VALUES ($1, $2, $3, $4, 'submitted', $5, $6, NOW())
		RETURNING id
	`, req.Title, req.Description, req.Category, req.Amount,
		ctx.Value("user_id"), ctx.Value("property_id")).Scan(&claimID)
	if err != nil {
		jsonError(w, "Failed to create expense", http.StatusInternalServerError)
		return
	}

	jsonSuccess(w, map[string]interface{}{
		"id":      claimID,
		"message": "Expense claim submitted",
		"status":  "submitted",
	})
}

// ApproveExpense approves or rejects an expense claim
func (h *Handler) ApproveExpense(w http.ResponseWriter, r *http.Request) {
	claimID := chi.URLParam(r, "id")
	var req struct {
		Action string `json:"action"` // approve, reject
		Notes  string `json:"notes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	status := "approved"
	if req.Action == "reject" {
		status = "rejected"
	}

	ctx := r.Context()
	_, err := h.db.Exec(ctx, `
		UPDATE expense_claims SET status = $1, approved_by = $2, approved_at = NOW() WHERE id = $3
	`, status, ctx.Value("user_id"), claimID)
	if err != nil {
		jsonError(w, "Failed to update expense", http.StatusInternalServerError)
		return
	}

	jsonSuccess(w, map[string]interface{}{
		"message": "Expense " + status,
		"status":  status,
	})
}
