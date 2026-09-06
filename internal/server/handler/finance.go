package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// ============================================================
// CHART OF ACCOUNTS
// ============================================================

type ChartOfAccount struct {
	ID            string  `json:"id"`
	AccountCode   string  `json:"account_code"`
	AccountName   string  `json:"account_name"`
	AccountClass  string  `json:"account_class"`
	AccountClassN string  `json:"account_class_name"`
	AccountType   string  `json:"account_type"`
	Description   string  `json:"description"`
	IsActive      bool    `json:"is_active"`
}

type JournalEntry struct {
	ID            string        `json:"id"`
	EntryNumber   string        `json:"entry_number"`
	EntryDate     string        `json:"entry_date"`
	Description   string        `json:"description"`
	Status        string        `json:"status"`
	PostedBy      *string       `json:"posted_by"`
	PostedAt      *string       `json:"posted_at"`
	Lines         []JournalLine `json:"lines"`
}

type JournalLine struct {
	ID            string  `json:"id"`
	AccountID     string  `json:"account_id"`
	Description   string  `json:"description"`
	Debit         float64 `json:"debit"`
	Credit        float64 `json:"credit"`
}

// ============================================================
// CHART OF ACCOUNTS HANDLERS
// ============================================================

func (h *Handler) ListAccountClasses(w http.ResponseWriter, r *http.Request) {
	classes := []map[string]string{
		{"code": "A", "name": "Assets"},
		{"code": "L", "name": "Liabilities"},
		{"code": "E", "name": "Equity"},
		{"code": "R", "name": "Revenue"},
		{"code": "C", "name": "Cost of Sales"},
		{"code": "X", "name": "Operating Expenses"},
	}
	SendSuccess(w, classes)
}

func (h *Handler) ListAccounts(w http.ResponseWriter, r *http.Request) {
	propertyID := r.Header.Get("X-Property-ID")
	if propertyID == "" {
		SendError(w, http.StatusBadRequest, "Property ID required")
		return
	}

	rows, err := h.db.Query(r.Context(), `
		SELECT id, account_code, account_name, account_class, COALESCE(account_type,''),
		       COALESCE(description,''), is_active
		FROM chart_of_accounts WHERE property_id = $1 AND deleted_at IS NULL
		ORDER BY account_code`, propertyID)
	if err != nil {
		SendError(w, http.StatusInternalServerError, "Failed to list accounts: "+err.Error())
		return
	}
	defer rows.Close()

	var accounts []ChartOfAccount
	for rows.Next() {
		var a ChartOfAccount
		if err := rows.Scan(&a.ID, &a.AccountCode, &a.AccountName, &a.AccountClass,
			&a.AccountType, &a.Description, &a.IsActive); err != nil {
			continue
		}
		accounts = append(accounts, a)
	}
	if accounts == nil {
		accounts = []ChartOfAccount{}
	}
	SendSuccess(w, accounts)
}

func (h *Handler) CreateAccount(w http.ResponseWriter, r *http.Request) {
	var req struct {
		AccountCode  string `json:"account_code"`
		AccountName  string `json:"account_name"`
		AccountClass string `json:"account_class"`
		AccountType  string `json:"account_type"`
		Description  string `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.AccountCode == "" || req.AccountName == "" || req.AccountClass == "" {
		SendError(w, http.StatusBadRequest, "account_code, account_name, and account_class are required")
		return
	}

	propertyID := r.Header.Get("X-Property-ID")
	id := uuid.New().String()

	_, err := h.db.Exec(r.Context(), `
		INSERT INTO chart_of_accounts (id, property_id, account_code, account_name, account_class, account_type, description)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		id, propertyID, req.AccountCode, req.AccountName, req.AccountClass, req.AccountType, req.Description)
	if err != nil {
		SendError(w, http.StatusInternalServerError, "Failed to create account: "+err.Error())
		return
	}

	h.audit.Log(r.Context(), nil, "chart_of_accounts", "create", id, nil, req, r)
	SendCreated(w, map[string]string{"id": id})
}

func (h *Handler) GetAccount(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var a ChartOfAccount
	err := h.db.QueryRow(r.Context(), `
		SELECT id, account_code, account_name, account_class, COALESCE(account_type,''),
		       COALESCE(description,''), is_active
		FROM chart_of_accounts WHERE id = $1`, id).Scan(&a.ID, &a.AccountCode, &a.AccountName,
		&a.AccountClass, &a.AccountType, &a.Description, &a.IsActive)
	if err != nil {
		SendError(w, http.StatusNotFound, "Account not found")
		return
	}
	SendSuccess(w, a)
}

// ============================================================
// JOURNAL ENTRIES
// ============================================================

func (h *Handler) ListJournalEntries(w http.ResponseWriter, r *http.Request) {
	propertyID := r.Header.Get("X-Property-ID")
	rows, err := h.db.Query(r.Context(), `
		SELECT id, entry_number, entry_date, COALESCE(description,''), status
		FROM journal_entries WHERE property_id = $1
		ORDER BY entry_date DESC LIMIT 100`, propertyID)
	if err != nil {
		SendError(w, http.StatusInternalServerError, "Failed to list journal entries")
		return
	}
	defer rows.Close()

	var entries []JournalEntry
	for rows.Next() {
		var e JournalEntry
		if err := rows.Scan(&e.ID, &e.EntryNumber, &e.EntryDate, &e.Description, &e.Status); err != nil {
			continue
		}
		e.Lines = []JournalLine{}
		entries = append(entries, e)
	}
	if entries == nil {
		entries = []JournalEntry{}
	}
	SendSuccess(w, entries)
}

func (h *Handler) CreateJournalEntry(w http.ResponseWriter, r *http.Request) {
	var req struct {
		EntryDate   string        `json:"entry_date"`
		Description string        `json:"description"`
		Lines       []JournalLine `json:"lines"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if len(req.Lines) < 2 {
		SendError(w, http.StatusBadRequest, "Journal entry must have at least 2 lines")
		return
	}

	totalDebit := 0.0
	totalCredit := 0.0
	for _, l := range req.Lines {
		totalDebit += l.Debit
		totalCredit += l.Credit
	}
	if totalDebit != totalCredit {
		SendError(w, http.StatusBadRequest, "Total debits must equal total credits")
		return
	}

	propertyID := r.Header.Get("X-Property-ID")
	entryID := uuid.New().String()
	entryNumber := fmt.Sprintf("JE-%s-%06d", time.Now().Format("20060102"), time.Now().UnixNano()%1000000)

	tx, err := h.db.Begin(r.Context())
	if err != nil {
		SendError(w, http.StatusInternalServerError, "Failed to start transaction")
		return
	}
	defer tx.Rollback(r.Context())

	_, err = tx.Exec(r.Context(), `
		INSERT INTO journal_entries (id, property_id, entry_number, entry_date, description, status)
		VALUES ($1, $2, $3, $4, $5, 'draft')`,
		entryID, propertyID, entryNumber, req.EntryDate, req.Description)
	if err != nil {
		SendError(w, http.StatusInternalServerError, "Failed to create journal entry: "+err.Error())
		return
	}

	for _, line := range req.Lines {
		lineID := uuid.New().String()
		_, err := tx.Exec(r.Context(), `
			INSERT INTO journal_lines (id, entry_id, account_id, description, debit, credit)
			VALUES ($1, $2, $3, $4, $5, $6)`,
			lineID, entryID, line.AccountID, line.Description, line.Debit, line.Credit)
		if err != nil {
			SendError(w, http.StatusInternalServerError, "Failed to create journal line")
			return
		}
	}

	if err := tx.Commit(r.Context()); err != nil {
		SendError(w, http.StatusInternalServerError, "Failed to commit journal entry")
		return
	}

	h.audit.Log(r.Context(), nil, "journal_entries", "create", entryID, nil, req, r)
	SendCreated(w, map[string]string{"id": entryID, "entry_number": entryNumber})
}

func (h *Handler) GetJournalEntry(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var e JournalEntry
	err := h.db.QueryRow(r.Context(), `
		SELECT id, entry_number, entry_date, COALESCE(description,''), status
		FROM journal_entries WHERE id = $1`, id).Scan(&e.ID, &e.EntryNumber, &e.EntryDate,
		&e.Description, &e.Status)
	if err != nil {
		SendError(w, http.StatusNotFound, "Journal entry not found")
		return
	}

	rows, _ := h.db.Query(r.Context(), `
		SELECT id, account_id, COALESCE(description,''), debit, credit
		FROM journal_lines WHERE entry_id = $1`, id)
	if rows != nil {
		defer rows.Close()
		for rows.Next() {
			var l JournalLine
			if err := rows.Scan(&l.ID, &l.AccountID, &l.Description, &l.Debit, &l.Credit); err != nil {
				continue
			}
			e.Lines = append(e.Lines, l)
		}
	}
	if e.Lines == nil {
		e.Lines = []JournalLine{}
	}
	SendSuccess(w, e)
}

func (h *Handler) PostJournalEntry(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	now := time.Now().Format(time.RFC3339)
	result, err := h.db.Exec(r.Context(), `
		UPDATE journal_entries SET status = 'posted', posted_at = $1
		WHERE id = $2 AND status = 'draft'`, now, id)
	if err != nil {
		SendError(w, http.StatusInternalServerError, "Failed to post journal entry")
		return
	}
	if result.RowsAffected() == 0 {
		SendError(w, http.StatusBadRequest, "Journal entry not found or not in draft status")
		return
	}
	h.audit.Log(r.Context(), nil, "journal_entries", "post", id, "draft", "posted", r)
	SendSuccess(w, map[string]string{"status": "posted"})
}

// ============================================================
// AR / AP / BANK / BUDGETS — return empty for demo
// ============================================================

func (h *Handler) ListARInvoices(w http.ResponseWriter, r *http.Request) {
	SendSuccess(w, []interface{}{})
}

func (h *Handler) CreateARInvoice(w http.ResponseWriter, r *http.Request) {
	SendCreated(w, map[string]string{"id": uuid.New().String()})
}

func (h *Handler) ListAPInvoices(w http.ResponseWriter, r *http.Request) {
	SendSuccess(w, []interface{}{})
}

func (h *Handler) CreateAPInvoice(w http.ResponseWriter, r *http.Request) {
	SendCreated(w, map[string]string{"id": uuid.New().String()})
}

func (h *Handler) ListBankAccounts(w http.ResponseWriter, r *http.Request) {
	SendSuccess(w, []interface{}{})
}

func (h *Handler) CreateBankAccount(w http.ResponseWriter, r *http.Request) {
	SendCreated(w, map[string]string{"id": uuid.New().String()})
}

func (h *Handler) ListBudgets(w http.ResponseWriter, r *http.Request) {
	SendSuccess(w, []interface{}{})
}

func (h *Handler) CreateBudget(w http.ResponseWriter, r *http.Request) {
	SendCreated(w, map[string]string{"id": uuid.New().String()})
}

func (h *Handler) GetProfitLoss(w http.ResponseWriter, r *http.Request) {
	SendSuccess(w, map[string]interface{}{
		"revenue":      []interface{}{},
		"cost_of_sales": []interface{}{},
		"expenses":      []interface{}{},
		"total_revenue": 0,
		"total_cost_of_sales": 0,
		"gross_profit":  0,
		"total_expenses": 0,
		"net_income":    0,
	})
}
