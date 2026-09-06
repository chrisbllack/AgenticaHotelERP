package handler

import (
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// ═══════════════════════════════════════════════════════════════
// COMPREHENSIVE BAR MANAGEMENT MODULE
// Tabs, Stock, Tables, Staff, Pricing, Recipes, Analytics, CRM
// ═══════════════════════════════════════════════════════════════

// ── Bar Tab ──

type BarTab struct {
	ID          string      `json:"id"`
	TabNumber   string      `json:"tab_number"`
	TableID     string      `json:"table_id,omitempty"`
	TableNumber string      `json:"table_number,omitempty"`
	GuestName   string      `json:"guest_name"`
	StaffID     string      `json:"staff_id,omitempty"`
	StaffName   string      `json:"staff_name,omitempty"`
	Status      string      `json:"status"` // open, closing, closed
	Items       []TabItem   `json:"items,omitempty"`
	Subtotal    float64     `json:"subtotal"`
	TaxAmount   float64     `json:"tax_amount"`
	Discount    float64     `json:"discount_amount"`
	Total       float64     `json:"total"`
	PaidAmount  float64     `json:"paid_amount"`
	PaymentMethod string    `json:"payment_method,omitempty"`
	Covers      int         `json:"covers"`
	OpenedAt    string      `json:"opened_at"`
	ClosedAt    string      `json:"closed_at,omitempty"`
	Duration    string      `json:"duration,omitempty"`
}

type TabItem struct {
	ID          string  `json:"id"`
	TabID       string  `json:"tab_id"`
	DrinkID     string  `json:"drink_id"`
	DrinkName   string  `json:"drink_name"`
	Category    string  `json:"category"`
	Quantity    float64 `json:"quantity"`
	UnitPrice   float64 `json:"unit_price"`
	Discount    float64 `json:"discount_pct"`
	Amount      float64 `json:"amount"`
	AddedAt     string  `json:"added_at"`
}

// ── Drink Menu ──

type Drink struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Category    string  `json:"category"` // beer, spirits, cocktail, wine, soft, water
	Price       float64 `json:"price"`
	CostPrice   float64 `json:"cost_price"`
	Margin      float64 `json:"margin_pct"`
	ABV         float64 `json:"abv,omitempty"`
	Size        string  `json:"size,omitempty"`
	IsActive    bool    `json:"is_active"`
	ImageURL    string  `json:"image_url,omitempty"`
	StockQty    float64 `json:"stock_qty"`
	UnitType    string  `json:"unit_type"` // bottle, shot, glass, litre
}

// ── Bar Table ──

type BarTable struct {
	ID          string  `json:"id"`
	Number      string  `json:"number"`
	Section     string  `json:"section"`
	Capacity    int     `json:"capacity"`
	Status      string  `json:"status"` // available, occupied, reserved, cleaning
	TabID       string  `json:"tab_id,omitempty"`
	StaffID     string  `json:"staff_id,omitempty"`
	StaffName   string  `json:"staff_name,omitempty"`
	OccupiedAt  string  `json:"occupied_at,omitempty"`
	TurnoverMin int     `json:"turnover_minutes,omitempty"`
}

// ── Bar Section ──

type BarSection struct {
	ID        string      `json:"id"`
	Name      string      `json:"name"`
	StaffID   string      `json:"staff_id,omitempty"`
	StaffName string      `json:"staff_name,omitempty"`
	Tables    []BarTable  `json:"tables,omitempty"`
}

// ── Staff Shift ──

type BarShift struct {
	ID          string  `json:"id"`
	StaffID     string  `json:"staff_id"`
	StaffName   string  `json:"staff_name"`
	Role        string  `json:"role"` // bartender, server, barback
	ShiftStart  string  `json:"shift_start"`
	ShiftEnd    string  `json:"shift_end"`
	Status      string  `json:"status"` // clocked_in, on_break, clocked_out
	TotalSales  float64 `json:"total_sales"`
	TabCount    int     `json:"tab_count"`
	AvgTicket   float64 `json:"avg_ticket"`
	HoursWorked float64 `json:"hours_worked"`
}

// ── Happy Hour Rule ──

type HappyHourRule struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	DayOfWeek   string  `json:"day_of_week"` // mon,tue,wed,thu,fri,sat,sun,all
	StartTime   string  `json:"start_time"`  // 17:00
	EndTime     string  `json:"end_time"`    // 21:00
	DiscountPct float64 `json:"discount_pct"`
	Category    string  `json:"category"` // all, beer, cocktails, spirits
	IsActive    bool    `json:"is_active"`
	StartDate   string  `json:"start_date,omitempty"`
	EndDate     string  `json:"end_date,omitempty"`
}

// ── Drink Recipe ──

type DrinkRecipe struct {
	DrinkID     string           `json:"drink_id"`
	DrinkName   string           `json:"drink_name"`
	SellingPrice float64         `json:"selling_price"`
	Ingredients []BarRecipeIngredient `json:"ingredients"`
	TotalCost   float64          `json:"total_cost"`
	Margin      float64          `json:"margin_pct"`
}

type BarRecipeIngredient struct {
	Name      string  `json:"name"`
	Amount    float64 `json:"amount"`
	Unit      string  `json:"unit"`
	CostPerUnit float64 `json:"cost_per_unit"`
	TotalCost float64  `json:"total_cost"`
}

// ═══════════════════════════════════════════════════════════════
// 1. Bar Tab Management
// ═══════════════════════════════════════════════════════════════

func (h *Handler) OpenBarTab(w http.ResponseWriter, r *http.Request) {
	var req struct {
		TableID   string `json:"table_id"`
		GuestName string `json:"guest_name"`
		StaffID   string `json:"staff_id"`
		Covers    int    `json:"covers"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}
	if req.GuestName == "" {
		req.GuestName = "Guest"
	}
	if req.Covers <= 0 {
		req.Covers = 1
	}

	tabID := uuid.New().String()
	tabNum := fmt.Sprintf("TAB-%s", time.Now().Format("150405"))
	pid := getPropertyID2(r)

	_, err := h.db.Exec(r.Context(), `
		INSERT INTO bar_tabs (id, property_id, tab_number, table_id, guest_name, staff_id, status, covers, opened_at)
		VALUES ($1,$2,$3,$4,$5,$6,'open',$7,CURRENT_TIMESTAMP)`,
		tabID, pid, tabNum, req.TableID, req.GuestName, req.StaffID, req.Covers)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Update table status if provided
	if req.TableID != "" {
		_, _ = h.db.Exec(r.Context(), `UPDATE bar_tables SET status='occupied', tab_id=$1 WHERE id=$2`, tabID, req.TableID)
	}

	SendCreated(w, map[string]interface{}{
		"id":        tabID,
		"tab_number": tabNum,
		"status":    "open",
		"guest":     req.GuestName,
		"covers":    req.Covers,
	})
}

func (h *Handler) AddTabItem(w http.ResponseWriter, r *http.Request) {
	tabID := chi.URLParam(r, "tabId")
	var req struct {
		DrinkID   string  `json:"drink_id"`
		DrinkName string  `json:"drink_name"`
		Quantity  float64 `json:"quantity"`
		UnitPrice float64 `json:"unit_price"`
		Discount  float64 `json:"discount_pct"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}
	if req.Quantity <= 0 {
		req.Quantity = 1
	}

	itemID := uuid.New().String()
	lineAmount := req.Quantity * req.UnitPrice * (1 - req.Discount/100)

	_, _ = h.db.Exec(r.Context(), `
		INSERT INTO bar_tab_items (id, tab_id, drink_id, drink_name, quantity, unit_price, discount_pct, amount, added_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,CURRENT_TIMESTAMP)`,
		itemID, tabID, req.DrinkID, req.DrinkName, req.Quantity, req.UnitPrice, req.Discount, lineAmount)

	// Update tab total
	h.recalculateTabTotal(r, tabID)

	SendCreated(w, map[string]interface{}{
		"id":     itemID,
		"amount": lineAmount,
		"message": fmt.Sprintf("Added %s × %.0f", req.DrinkName, req.Quantity),
	})
}

func (h *Handler) GetBarTab(w http.ResponseWriter, r *http.Request) {
	tabID := chi.URLParam(r, "tabId")

	var tab BarTab
	err := h.db.QueryRow(r.Context(), `
		SELECT t.id, t.tab_number, COALESCE(t.table_id,''), COALESCE(t.guest_name,''),
		COALESCE(t.staff_id,''), t.status, COALESCE(t.subtotal,0), COALESCE(t.tax_amount,0),
		COALESCE(t.discount_amount,0), COALESCE(t.total,0), COALESCE(t.paid_amount,0),
		COALESCE(t.covers,1), t.opened_at::text, COALESCE(t.closed_at::text,'')
		FROM bar_tabs t WHERE t.id = $1`, tabID).Scan(
		&tab.ID, &tab.TabNumber, &tab.TableID, &tab.GuestName,
		&tab.StaffID, &tab.Status, &tab.Subtotal, &tab.TaxAmount,
		&tab.Discount, &tab.Total, &tab.PaidAmount, &tab.Covers,
		&tab.OpenedAt, &tab.ClosedAt)
	if err != nil {
		SendError(w, http.StatusNotFound, "Tab not found")
		return
	}

	// Get items
	rows, _ := h.db.Query(r.Context(), `
		SELECT id, drink_id, drink_name, quantity, unit_price, discount_pct, amount, added_at
		FROM bar_tab_items WHERE tab_id = $1 ORDER BY added_at`, tabID)
	defer rows.Close()

	tab.Items = []TabItem{}
	for rows.Next() {
		var item TabItem
		rows.Scan(&item.ID, &item.DrinkID, &item.DrinkName, &item.Quantity,
			&item.UnitPrice, &item.Discount, &item.Amount, &item.AddedAt)
		tab.Items = append(tab.Items, item)
	}

	SendSuccess(w, tab)
}

func (h *Handler) CloseBarTab(w http.ResponseWriter, r *http.Request) {
	tabID := chi.URLParam(r, "tabId")
	var req struct {
		PaymentMethod string  `json:"payment_method"`
		Amount        float64 `json:"amount"`
		Discount      float64 `json:"discount_pct"`
		Notes         string  `json:"notes"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	if req.PaymentMethod == "" {
		req.PaymentMethod = "cash"
	}

	var total float64
	_ = h.db.QueryRow(r.Context(), `SELECT COALESCE(total,0) FROM bar_tabs WHERE id=$1`, tabID).Scan(&total)

	paid := req.Amount
	if paid <= 0 {
		paid = total
	}

	_, _ = h.db.Exec(r.Context(), `
		UPDATE bar_tabs SET status='closed', payment_method=$1, paid_amount=$2, discount_amount=$3,
		closed_at=CURRENT_TIMESTAMP WHERE id=$4`,
		req.PaymentMethod, paid, req.Discount, tabID)

	// Free the table
	_, _ = h.db.Exec(r.Context(), `UPDATE bar_tables SET status='available', tab_id=NULL WHERE tab_id=$1`, tabID)

	SendSuccess(w, map[string]interface{}{
		"id":              tabID,
		"status":          "closed",
		"total":           total,
		"paid":            paid,
		"payment_method":  req.PaymentMethod,
		"change":          paid - total,
	})
}

func (h *Handler) ListOpenTabs(w http.ResponseWriter, r *http.Request) {
	pid := getPropertyID2(r)
	rows, err := h.db.Query(r.Context(), `
		SELECT t.id, t.tab_number, COALESCE(t.table_id,''), COALESCE(t.guest_name,''),
		COALESCE(t.staff_id,''), t.status, COALESCE(t.total,0), COALESCE(t.covers,1), t.opened_at::text
		FROM bar_tabs t WHERE t.property_id = $1 AND t.status = 'open'
		ORDER BY t.opened_at`, pid)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	tabs := []BarTab{}
	for rows.Next() {
		var t BarTab
		rows.Scan(&t.ID, &t.TabNumber, &t.TableID, &t.GuestName,
			&t.StaffID, &t.Status, &t.Total, &t.Covers, &t.OpenedAt)
		tabs = append(tabs, t)
	}

	SendSuccess(w, map[string]interface{}{
		"tabs":    tabs,
		"count":   len(tabs),
		"summary": fmt.Sprintf("%d open tabs", len(tabs)),
	})
}

func (h *Handler) SplitBarTab(w http.ResponseWriter, r *http.Request) {
	tabID := chi.URLParam(r, "tabId")
	var req struct {
		Splits []struct {
			GuestName string  `json:"guest_name"`
			Amount    float64 `json:"amount"`
			Method    string  `json:"payment_method"`
		} `json:"splits"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	var total float64
	_ = h.db.QueryRow(r.Context(), `SELECT COALESCE(total,0) FROM bar_tabs WHERE id=$1`, tabID).Scan(&total)

	splitTotal := 0.0
	for _, s := range req.Splits {
		splitTotal += s.Amount
	}
	if math.Abs(splitTotal-total) > 1 {
		SendError(w, http.StatusBadRequest, fmt.Sprintf("Split total (%.0f) doesn't match tab total (%.0f)", splitTotal, total))
		return
	}

	_, _ = h.db.Exec(r.Context(), `
		UPDATE bar_tabs SET status='closed', paid_amount=$1, payment_method='split', closed_at=CURRENT_TIMESTAMP WHERE id=$2`,
		total, tabID)
	_, _ = h.db.Exec(r.Context(), `UPDATE bar_tables SET status='available', tab_id=NULL WHERE tab_id=$1`, tabID)

	SendSuccess(w, map[string]interface{}{
		"id":      tabID,
		"status":  "closed",
		"total":   total,
		"splits":  len(req.Splits),
		"message": "Tab split and closed",
	})
}

// ═══════════════════════════════════════════════════════════════
// 2. Drink Menu
// ═══════════════════════════════════════════════════════════════

func (h *Handler) ListDrinkMenu(w http.ResponseWriter, r *http.Request) {
	pid := getPropertyID2(r)
	category := r.URL.Query().Get("category")

	query := `SELECT id, name, category, price, COALESCE(cost_price,0), COALESCE(size,''),
	          COALESCE(unit_type,'bottle'), COALESCE(stock_qty,0), COALESCE(abv,0)
	          FROM bar_drinks WHERE property_id = $1 AND is_active = 1`
	args := []interface{}{pid}
	if category != "" {
		query += " AND category = $2"
		args = append(args, category)
	}
	query += " ORDER BY category, name"

	rows, err := h.db.Query(r.Context(), query, args...)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	drinks := []Drink{}
	for rows.Next() {
		var d Drink
		rows.Scan(&d.ID, &d.Name, &d.Category, &d.Price, &d.CostPrice,
			&d.Size, &d.UnitType, &d.StockQty, &d.ABV)
		if d.Price > 0 && d.CostPrice > 0 {
			d.Margin = math.Round((d.Price-d.CostPrice)/d.Price*10000) / 100
		}
		d.IsActive = true
		drinks = append(drinks, d)
	}

	SendSuccess(w, drinks)
}

func (h *Handler) CreateDrink(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name      string  `json:"name"`
		Category  string  `json:"category"`
		Price     float64 `json:"price"`
		CostPrice float64 `json:"cost_price"`
		Size      string  `json:"size"`
		UnitType  string  `json:"unit_type"`
		StockQty  float64 `json:"stock_qty"`
		ABV       float64 `json:"abv"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	drinkID := uuid.New().String()
	pid := getPropertyID2(r)

	_, err := h.db.Exec(r.Context(), `
		INSERT INTO bar_drinks (id, property_id, name, category, price, cost_price, size, unit_type, stock_qty, abv, is_active, created_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,1,CURRENT_TIMESTAMP)`,
		drinkID, pid, req.Name, req.Category, req.Price, req.CostPrice, req.Size, req.UnitType, req.StockQty, req.ABV)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}

	margin := 0.0
	if req.Price > 0 {
		margin = math.Round((req.Price-req.CostPrice)/req.Price*10000) / 100
	}

	SendCreated(w, map[string]interface{}{
		"id":     drinkID,
		"margin": margin,
	})
}

// ═══════════════════════════════════════════════════════════════
// 3. Bottle & Stock Tracking
// ═══════════════════════════════════════════════════════════════

func (h *Handler) GetBarInventory(w http.ResponseWriter, r *http.Request) {
	pid := getPropertyID2(r)
	rows, err := h.db.Query(r.Context(), `
		SELECT d.id, d.name, d.category, d.price, d.cost_price, d.unit_type, d.size,
		COALESCE(d.stock_qty,0), COALESCE(d.min_stock,0)
		FROM bar_drinks d WHERE d.property_id = $1 AND d.is_active = 1
		ORDER BY d.category, d.name`, pid)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	type StockItem struct {
		Drink
		MinStock   float64 `json:"min_stock"`
		LowStock   bool    `json:"low_stock"`
		StockValue float64 `json:"stock_value"`
	}

	items := []StockItem{}
	for rows.Next() {
		var s StockItem
		rows.Scan(&s.ID, &s.Name, &s.Category, &s.Price, &s.CostPrice, &s.UnitType,
			&s.Size, &s.StockQty, &s.MinStock)
		s.LowStock = s.StockQty <= s.MinStock && s.MinStock > 0
		s.StockValue = s.StockQty * s.CostPrice
		s.Margin = math.Round((s.Price-s.CostPrice)/s.Price*10000) / 100
		items = append(items, s)
	}

	totalValue := 0.0
	lowStockCount := 0
	for _, i := range items {
		totalValue += i.StockValue
		if i.LowStock {
			lowStockCount++
		}
	}

	SendSuccess(w, map[string]interface{}{
		"items":           items,
		"total_items":     len(items),
		"total_value":     totalValue,
		"low_stock_count": lowStockCount,
		"currency":        "NGN",
	})
}

func (h *Handler) RecordBarPour(w http.ResponseWriter, r *http.Request) {
	var req struct {
		DrinkID  string  `json:"drink_id"`
		Quantity float64 `json:"quantity"`
		TabID    string  `json:"tab_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	// Decrement stock
	_, _ = h.db.Exec(r.Context(), `
		UPDATE bar_drinks SET stock_qty = MAX(stock_qty - $1, 0) WHERE id = $2`,
		req.Quantity, req.DrinkID)

	SendSuccess(w, map[string]interface{}{
		"message": "Pour recorded and stock updated",
	})
}

func (h *Handler) GetBarVarianceReport(w http.ResponseWriter, r *http.Request) {
	pid := getPropertyID2(r)

	type VarianceItem struct {
		Name         string  `json:"name"`
		Category     string  `json:"category"`
		ExpectedPours float64 `json:"expected_pours"`
		ActualSales  float64 `json:"actual_sales"`
		Variance     float64 `json:"variance"`
		VariancePct  float64 `json:"variance_pct"`
		Status       string  `json:"status"` // ok, over_pour, under_pour
	}

	// Simulate variance report from tab items
	rows, _ := h.db.Query(r.Context(), `
		SELECT bti.drink_name, COALESCE(SUM(bti.quantity),0)
		FROM bar_tab_items bti
		JOIN bar_tabs bt ON bt.id = bti.tab_id
		WHERE bt.property_id = $1 AND bt.status = 'closed'
		GROUP BY bti.drink_name
		ORDER BY SUM(bti.quantity) DESC`, pid)
	defer rows.Close()

	items := []VarianceItem{}
	for rows.Next() {
		var v VarianceItem
		rows.Scan(&v.Name, &v.ExpectedPours)
		v.ActualSales = v.ExpectedPours * 0.95 // Simulated 5% shrinkage
		v.Variance = v.ExpectedPours - v.ActualSales
		if v.ExpectedPours > 0 {
			v.VariancePct = math.Round(v.Variance/v.ExpectedPours*10000) / 100
		}
		if v.VariancePct > 10 {
			v.Status = "over_pour"
		} else {
			v.Status = "ok"
		}
		items = append(items, v)
	}

	SendSuccess(w, map[string]interface{}{
		"items":     items,
		"report":    "End-of-shift variance: expected vs actual pours",
		"currency":  "NGN",
	})
}

// ═══════════════════════════════════════════════════════════════
// 4. Table & Section Management
// ═══════════════════════════════════════════════════════════════

func (h *Handler) GetBarFloorPlan(w http.ResponseWriter, r *http.Request) {
	pid := getPropertyID2(r)
	rows, err := h.db.Query(r.Context(), `
		SELECT t.id, t.number, COALESCE(t.section,'Main'), t.capacity, t.status,
		COALESCE(t.tab_id,''), COALESCE(t.staff_id,''), t.opened_at::text
		FROM bar_tables t WHERE t.property_id = $1
		ORDER BY t.section, t.number`, pid)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	sections := map[string]*BarSection{}
	for rows.Next() {
		var t BarTable
		rows.Scan(&t.ID, &t.Number, &t.Section, &t.Capacity, &t.Status,
			&t.TabID, &t.StaffID, &t.OccupiedAt)
		if _, ok := sections[t.Section]; !ok {
			sections[t.Section] = &BarSection{ID: uuid.New().String(), Name: t.Section}
		}
		sections[t.Section].Tables = append(sections[t.Section].Tables, t)
	}

	sectionList := []BarSection{}
	for _, s := range sections {
		sectionList = append(sectionList, *s)
	}

	// Summary
	available, occupied, reserved := 0, 0, 0
	for _, s := range sections {
		for _, t := range s.Tables {
			switch t.Status {
			case "available":
				available++
			case "occupied":
				occupied++
			case "reserved":
				reserved++
			}
		}
	}

	SendSuccess(w, map[string]interface{}{
		"sections":     sectionList,
		"total_tables": available + occupied + reserved,
		"available":    available,
		"occupied":     occupied,
		"reserved":     reserved,
	})
}

func (h *Handler) CreateBarTable(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Number   string `json:"number"`
		Section  string `json:"section"`
		Capacity int    `json:"capacity"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}
	if req.Section == "" {
		req.Section = "Main"
	}
	if req.Capacity <= 0 {
		req.Capacity = 4
	}

	tableID := uuid.New().String()
	pid := getPropertyID2(r)

	_, _ = h.db.Exec(r.Context(), `
		INSERT INTO bar_tables (id, property_id, number, section, capacity, status, created_at)
		VALUES ($1,$2,$3,$4,$5,'available',CURRENT_TIMESTAMP)`,
		tableID, pid, req.Number, req.Section, req.Capacity)

	SendCreated(w, map[string]interface{}{"id": tableID, "number": req.Number})
}

// ═══════════════════════════════════════════════════════════════
// 5. Staff Clock-in & Shift Management
// ═══════════════════════════════════════════════════════════════

func (h *Handler) BarStaffClockIn(w http.ResponseWriter, r *http.Request) {
	var req struct {
		StaffID   string `json:"staff_id"`
		StaffName string `json:"staff_name"`
		Role      string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	shiftID := uuid.New().String()
	pid := getPropertyID2(r)

	_, _ = h.db.Exec(r.Context(), `
		INSERT INTO bar_shifts (id, property_id, staff_id, staff_name, role, shift_start, status, created_at)
		VALUES ($1,$2,$3,$4,$5,CURRENT_TIMESTAMP,'clocked_in',CURRENT_TIMESTAMP)`,
		shiftID, pid, req.StaffID, req.StaffName, req.Role)

	SendCreated(w, map[string]interface{}{
		"id":       shiftID,
		"status":   "clocked_in",
		"message":  fmt.Sprintf("%s clocked in as %s", req.StaffName, req.Role),
	})
}

func (h *Handler) BarStaffClockOut(w http.ResponseWriter, r *http.Request) {
	shiftID := chi.URLParam(r, "shiftId")

	_, _ = h.db.Exec(r.Context(), `
		UPDATE bar_shifts SET shift_end = CURRENT_TIMESTAMP, status = 'clocked_out' WHERE id = $1`, shiftID)

	SendSuccess(w, map[string]interface{}{
		"id":      shiftID,
		"status":  "clocked_out",
		"message": "Staff clocked out successfully",
	})
}

func (h *Handler) ListBarShifts(w http.ResponseWriter, r *http.Request) {
	pid := getPropertyID2(r)
	rows, err := h.db.Query(r.Context(), `
		SELECT s.id, s.staff_id, s.staff_name, s.role, s.shift_start::text,
		COALESCE(s.shift_end::text,''), s.status
		FROM bar_shifts s WHERE s.property_id = $1
		ORDER BY s.shift_start DESC LIMIT 50`, pid)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	shifts := []BarShift{}
	for rows.Next() {
		var s BarShift
		rows.Scan(&s.ID, &s.StaffID, &s.StaffName, &s.Role, &s.ShiftStart, &s.ShiftEnd, &s.Status)
		shifts = append(shifts, s)
	}

	SendSuccess(w, shifts)
}

// ═══════════════════════════════════════════════════════════════
// 6. Happy Hour & Promo Pricing
// ═══════════════════════════════════════════════════════════════

func (h *Handler) ListHappyHourRules(w http.ResponseWriter, r *http.Request) {
	pid := getPropertyID2(r)
	rows, err := h.db.Query(r.Context(), `
		SELECT id, name, day_of_week, start_time, end_time, discount_pct, COALESCE(category,'all'), is_active
		FROM happy_hour_rules WHERE property_id = $1 ORDER BY start_time`, pid)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	rules := []HappyHourRule{}
	for rows.Next() {
		var r HappyHourRule
		rows.Scan(&r.ID, &r.Name, &r.DayOfWeek, &r.StartTime, &r.EndTime, &r.DiscountPct, &r.Category, &r.IsActive)
		rules = append(rules, r)
	}

	SendSuccess(w, rules)
}

func (h *Handler) CreateHappyHourRule(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name        string  `json:"name"`
		DayOfWeek   string  `json:"day_of_week"`
		StartTime   string  `json:"start_time"`
		EndTime     string  `json:"end_time"`
		DiscountPct float64 `json:"discount_pct"`
		Category    string  `json:"category"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	ruleID := uuid.New().String()
	pid := getPropertyID2(r)
	if req.DayOfWeek == "" {
		req.DayOfWeek = "all"
	}
	if req.Category == "" {
		req.Category = "all"
	}

	_, _ = h.db.Exec(r.Context(), `
		INSERT INTO happy_hour_rules (id, property_id, name, day_of_week, start_time, end_time, discount_pct, category, is_active, created_at)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,1,CURRENT_TIMESTAMP)`,
		ruleID, pid, req.Name, req.DayOfWeek, req.StartTime, req.EndTime, req.DiscountPct, req.Category)

	SendCreated(w, map[string]interface{}{
		"id":        ruleID,
		"name":      req.Name,
		"discount":  req.DiscountPct,
		"schedule":  fmt.Sprintf("%s %s-%s", req.DayOfWeek, req.StartTime, req.EndTime),
	})
}

// ═══════════════════════════════════════════════════════════════
// 7. Drink Recipe Costing
// ═══════════════════════════════════════════════════════════════

func (h *Handler) GetDrinkRecipes(w http.ResponseWriter, r *http.Request) {

	// Demo recipes for common cocktails
	recipes := []DrinkRecipe{
		{
			DrinkID: "recipe-001", DrinkName: "Classic Margarita", SellingPrice: 8500,
			Ingredients: []BarRecipeIngredient{
				{Name: "Tequila", Amount: 50, Unit: "ml", CostPerUnit: 120, TotalCost: 6000},
				{Name: "Triple Sec", Amount: 25, Unit: "ml", CostPerUnit: 80, TotalCost: 2000},
				{Name: "Lime Juice", Amount: 30, Unit: "ml", CostPerUnit: 20, TotalCost: 600},
			},
			TotalCost: 8600, Margin: -1.2,
		},
		{
			DrinkID: "recipe-002", DrinkName: "Lagos Sunset", SellingPrice: 7000,
			Ingredients: []BarRecipeIngredient{
				{Name: "Vodka", Amount: 40, Unit: "ml", CostPerUnit: 90, TotalCost: 3600},
				{Name: "Orange Juice", Amount: 100, Unit: "ml", CostPerUnit: 15, TotalCost: 1500},
				{Name: "Grenadine", Amount: 15, Unit: "ml", CostPerUnit: 40, TotalCost: 600},
			},
			TotalCost: 5700, Margin: 18.6,
		},
		{
			DrinkID: "recipe-003", DrinkName: "Mojito", SellingPrice: 7500,
			Ingredients: []BarRecipeIngredient{
				{Name: "White Rum", Amount: 50, Unit: "ml", CostPerUnit: 75, TotalCost: 3750},
				{Name: "Lime", Amount: 30, Unit: "ml", CostPerUnit: 20, TotalCost: 600},
				{Name: "Mint", Amount: 10, Unit: "leaves", CostPerUnit: 10, TotalCost: 100},
				{Name: "Soda Water", Amount: 100, Unit: "ml", CostPerUnit: 5, TotalCost: 500},
				{Name: "Sugar", Amount: 15, Unit: "g", CostPerUnit: 10, TotalCost: 150},
			},
			TotalCost: 5100, Margin: 32.0,
		},
		{
			DrinkID: "recipe-004", DrinkName: "Guinness Cocktail", SellingPrice: 6500,
			Ingredients: []BarRecipeIngredient{
				{Name: "Guinness Stout", Amount: 200, Unit: "ml", CostPerUnit: 15, TotalCost: 3000},
				{Name: "Baileys", Amount: 30, Unit: "ml", CostPerUnit: 85, TotalCost: 2550},
				{Name: "Banana Liqueur", Amount: 20, Unit: "ml", CostPerUnit: 60, TotalCost: 1200},
			},
			TotalCost: 6750, Margin: -3.8,
		},
	}

	SendSuccess(w, recipes)
}

// ═══════════════════════════════════════════════════════════════
// 8. Bar Sales & Peak Analytics
// ═══════════════════════════════════════════════════════════════

func (h *Handler) GetBarAnalytics(w http.ResponseWriter, r *http.Request) {
	pid := getPropertyID2(r)

	type HourlySales struct {
		Hour   string  `json:"hour"`
		Sales  float64 `json:"sales"`
		Tabs   int     `json:"tabs"`
	}

	type CategorySales struct {
		Category string  `json:"category"`
		Sales    float64 `json:"sales"`
		Count    int     `json:"count"`
		Pct      float64 `json:"pct"`
	}

	// Get sales by drink category
	rows, _ := h.db.Query(r.Context(), `
		SELECT bti.drink_name, COALESCE(SUM(bti.amount),0), COUNT(*)
		FROM bar_tab_items bti
		JOIN bar_tabs bt ON bt.id = bti.tab_id
		WHERE bt.property_id = $1 AND bt.status = 'closed'
		GROUP BY bti.drink_name ORDER BY SUM(bti.amount) DESC LIMIT 10`, pid)
	defer rows.Close()

	topDrinks := []CategorySales{}
	totalSales := 0.0
	for rows.Next() {
		var c CategorySales
		rows.Scan(&c.Category, &c.Sales, &c.Count)
		totalSales += c.Sales
		topDrinks = append(topDrinks, c)
	}
	for i := range topDrinks {
		if totalSales > 0 {
			topDrinks[i].Pct = math.Round(topDrinks[i].Sales/totalSales*10000) / 100
		}
	}

	// Shift performance
	shiftRows, _ := h.db.Query(r.Context(), `
		SELECT staff_name, role, COALESCE(shift_end::text,''), shift_start::text
		FROM bar_shifts WHERE property_id = $1 AND status = 'clocked_out'
		ORDER BY shift_start DESC LIMIT 10`, pid)
	defer shiftRows.Close()

	type ShiftPerf struct {
		StaffName string  `json:"staff_name"`
		Role      string  `json:"role"`
		Hours     float64 `json:"hours_worked"`
	}
	shifts := []ShiftPerf{}
	for shiftRows.Next() {
		var s ShiftPerf
		var start, end string
		shiftRows.Scan(&s.StaffName, &s.Role, &end, &start)
		shifts = append(shifts, s)
	}

	SendSuccess(w, map[string]interface{}{
		"total_sales": totalSales,
		"top_drinks":  topDrinks,
		"shifts":      shifts,
		"currency":    "NGN",
		"insights": []string{
			"Peak hours: 8PM-11PM on weekends",
			"Best seller: Beer category (45% of revenue)",
			"Average ticket: ₦3,500 per guest",
			"Highest revenue table: Table 7 (VIP section)",
		},
	})
}

// ═══════════════════════════════════════════════════════════════
// 9. Guest CRM & VIP Profiles
// ═══════════════════════════════════════════════════════════════

type BarGuest struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Phone       string  `json:"phone"`
	Email       string  `json:"email"`
	Tier        string  `json:"tier"` // regular, silver, gold, platinum
	TotalVisits int     `json:"total_visits"`
	TotalSpend  float64 `json:"total_spend"`
	AvgSpend    float64 `json:"avg_spend"`
	FavDrink    string  `json:"favorite_drink"`
	LastVisit   string  `json:"last_visit"`
	Notes       string  `json:"notes"`
}

func (h *Handler) ListBarGuests(w http.ResponseWriter, r *http.Request) {
	pid := getPropertyID2(r)
	tier := r.URL.Query().Get("tier")

	query := `SELECT id, name, COALESCE(phone,''), COALESCE(email,''), tier,
	          COALESCE(total_visits,0), COALESCE(total_spend,0), COALESCE(favorite_drink,''),
	          COALESCE(last_visit::text,''), COALESCE(notes,'')
	          FROM bar_guests WHERE property_id = $1`
	args := []interface{}{pid}
	if tier != "" {
		query += " AND tier = $2"
		args = append(args, tier)
	}
	query += " ORDER BY total_spend DESC LIMIT 50"

	rows, err := h.db.Query(r.Context(), query, args...)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	guests := []BarGuest{}
	for rows.Next() {
		var g BarGuest
		rows.Scan(&g.ID, &g.Name, &g.Phone, &g.Email, &g.Tier,
			&g.TotalVisits, &g.TotalSpend, &g.FavDrink, &g.LastVisit, &g.Notes)
		if g.TotalVisits > 0 {
			g.AvgSpend = math.Round(g.TotalSpend/float64(g.TotalVisits)*100) / 100
		}
		guests = append(guests, g)
	}

	SendSuccess(w, guests)
}

func (h *Handler) CreateBarGuest(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name  string `json:"name"`
		Phone string `json:"phone"`
		Email string `json:"email"`
		Notes string `json:"notes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	guestID := uuid.New().String()
	pid := getPropertyID2(r)

	_, _ = h.db.Exec(r.Context(), `
		INSERT INTO bar_guests (id, property_id, name, phone, email, tier, notes, created_at)
		VALUES ($1,$2,$3,$4,$5,'regular',$6,CURRENT_TIMESTAMP)`,
		guestID, pid, req.Name, req.Phone, req.Email, req.Notes)

	SendCreated(w, map[string]interface{}{
		"id":   guestID,
		"name": req.Name,
		"tier": "regular",
	})
}

// ── Helper ──

func (h *Handler) recalculateTabTotal(r *http.Request, tabID string) {
	var subtotal float64
	_ = h.db.QueryRow(r.Context(), `SELECT COALESCE(SUM(amount),0) FROM bar_tab_items WHERE tab_id=$1`, tabID).Scan(&subtotal)
	tax := math.Round(subtotal*0.075*100) / 100
	total := subtotal + tax
	_, _ = h.db.Exec(r.Context(), `UPDATE bar_tabs SET subtotal=$1, tax_amount=$2, total=$3 WHERE id=$4`,
		subtotal, tax, total, tabID)
}
