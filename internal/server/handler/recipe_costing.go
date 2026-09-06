package handler

import (
	"encoding/json"
	"net/http"
)

// ── Recipe / Menu Costing ──

type Recipe struct {
	ID            int             `json:"id"`
	MenuItemID    int             `json:"menu_item_id"`
	MenuItemName  string          `json:"menu_item_name"`
	SellingPrice  float64         `json:"selling_price"`
	RecipeCost    float64         `json:"recipe_cost"`
	GrossMargin   float64         `json:"gross_margin"`
	MarginPercent float64         `json:"margin_percent"`
	Ingredients   []RecipeIngredient `json:"ingredients"`
}

type RecipeIngredient struct {
	ID          int     `json:"id"`
	ProductID   int     `json:"product_id"`
	ProductName string  `json:"product_name"`
	Quantity    float64 `json:"quantity"`
	Unit        string  `json:"unit"`
	UnitCost    float64 `json:"unit_cost"`
	TotalCost   float64 `json:"total_cost"`
}

// ListRecipes returns all menu items with their recipe costs
func (h *Handler) ListRecipes(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	rows, err := h.db.Query(ctx, `
		SELECT mi.id, mi.name, mi.price,
		       COALESCE(SUM(ri.quantity * p.cost_price), 0) as recipe_cost
		FROM menu_items mi
		LEFT JOIN recipe_ingredients ri ON ri.menu_item_id = mi.id
		LEFT JOIN products p ON p.id = ri.product_id
		WHERE mi.property_id = $1
		GROUP BY mi.id, mi.name, mi.price
		ORDER BY mi.name
	`, ctx.Value("property_id"))
	if err != nil {
		jsonError(w, "Failed to load recipes", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var recipes []Recipe
	for rows.Next() {
		var r Recipe
		rows.Scan(&r.MenuItemID, &r.MenuItemName, &r.SellingPrice, &r.RecipeCost)
		r.GrossMargin = r.SellingPrice - r.RecipeCost
		if r.SellingPrice > 0 {
			r.MarginPercent = (r.GrossMargin / r.SellingPrice) * 100
		}
		recipes = append(recipes, r)
	}
	jsonSuccess(w, recipes)
}

// GetRecipe returns full recipe with ingredients for a menu item
func (h *Handler) GetRecipe(w http.ResponseWriter, r *http.Request) {
	menuItemID := r.URL.Query().Get("menu_item_id")
	ctx := r.Context()

	rows, err := h.db.Query(ctx, `
		SELECT ri.id, ri.product_id, COALESCE(p.name, ''), ri.quantity,
		       COALESCE(p.unit, ''), COALESCE(p.cost_price, 0),
		       ri.quantity * COALESCE(p.cost_price, 0)
		FROM recipe_ingredients ri
		LEFT JOIN products p ON p.id = ri.product_id
		WHERE ri.menu_item_id = $1
		ORDER BY p.name
	`, menuItemID)
	if err != nil {
		jsonError(w, "Failed to load recipe", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var ingredients []RecipeIngredient
	for rows.Next() {
		var i RecipeIngredient
		rows.Scan(&i.ID, &i.ProductID, &i.ProductName, &i.Quantity,
			&i.Unit, &i.UnitCost, &i.TotalCost)
		ingredients = append(ingredients, i)
	}
	jsonSuccess(w, ingredients)
}

// SaveRecipe upserts recipe ingredients for a menu item
func (h *Handler) SaveRecipe(w http.ResponseWriter, r *http.Request) {
	var req struct {
		MenuItemID  int                 `json:"menu_item_id"`
		Ingredients []RecipeIngredient  `json:"ingredients"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	tx, err := h.db.Begin(ctx)
	if err != nil {
		jsonError(w, "Transaction failed", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback(ctx)

	// Delete existing ingredients
	_, _ = tx.Exec(ctx, `DELETE FROM recipe_ingredients WHERE menu_item_id = $1`, req.MenuItemID)

	// Insert new ingredients
	for _, ing := range req.Ingredients {
		_, _ = tx.Exec(ctx, `
			INSERT INTO recipe_ingredients (menu_item_id, product_id, quantity)
			VALUES ($1, $2, $3)
		`, req.MenuItemID, ing.ProductID, ing.Quantity)
	}

	if err := tx.Commit(ctx); err != nil {
		jsonError(w, "Failed to save recipe", http.StatusInternalServerError)
		return
	}

	jsonSuccess(w, map[string]interface{}{"message": "Recipe saved"})
}

// GetMenuCostingReport returns profitability analysis for all menu items
func (h *Handler) GetMenuCostingReport(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	rows, err := h.db.Query(ctx, `
		SELECT mi.name, mi.price as selling_price,
		       COALESCE(SUM(ri.quantity * p.cost_price), 0) as recipe_cost,
		       COALESCE(poi.total_sold, 0)
		FROM menu_items mi
		LEFT JOIN recipe_ingredients ri ON ri.menu_item_id = mi.id
		LEFT JOIN products p ON p.id = ri.product_id
		LEFT JOIN (
			SELECT menu_item_id, SUM(quantity) as total_sold
			FROM pos_order_items
			GROUP BY menu_item_id
		) poi ON poi.menu_item_id = mi.id
		WHERE mi.property_id = $1
		GROUP BY mi.id, mi.name, mi.price, poi.total_sold
		ORDER BY (mi.price - COALESCE(SUM(ri.quantity * p.cost_price), 0)) DESC
	`, ctx.Value("property_id"))
	if err != nil {
		jsonError(w, "Failed to load costing report", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type CostingRow struct {
		Name           string  `json:"name"`
		SellingPrice   float64 `json:"selling_price"`
		RecipeCost     float64 `json:"recipe_cost"`
		GrossMargin    float64 `json:"gross_margin"`
		MarginPercent  float64 `json:"margin_percent"`
		UnitsSold      int     `json:"units_sold"`
		TotalProfit    float64 `json:"total_profit"`
	}

	var report []CostingRow
	for rows.Next() {
		var row CostingRow
		rows.Scan(&row.Name, &row.SellingPrice, &row.RecipeCost, &row.UnitsSold)
		row.GrossMargin = row.SellingPrice - row.RecipeCost
		if row.SellingPrice > 0 {
			row.MarginPercent = (row.GrossMargin / row.SellingPrice) * 100
		}
		row.TotalProfit = row.GrossMargin * float64(row.UnitsSold)
		report = append(report, row)
	}
	jsonSuccess(w, report)
}

// ── Wastage Management ──

type WastageRecord struct {
	ID          int     `json:"id"`
	ProductID   int     `json:"product_id"`
	ProductName string  `json:"product_name"`
	Quantity    float64 `json:"quantity"`
	Unit        string  `json:"unit"`
	UnitCost    float64 `json:"unit_cost"`
	TotalCost   float64 `json:"total_cost"`
	Reason      string  `json:"reason"` // expired, damaged, spoiled, burnt, preparation, breakage, theft, complimentary
	Department  string  `json:"department"`
	Employee    string  `json:"employee"`
	Date        string  `json:"date"`
	Status      string  `json:"status"` // pending, approved, rejected
	ApprovedBy  string  `json:"approved_by,omitempty"`
	Notes       string  `json:"notes"`
}

// ListWastage returns wastage records
func (h *Handler) ListWastage(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	rows, err := h.db.Query(ctx, `
		SELECT w.id, w.product_id, COALESCE(p.name, ''), w.quantity, COALESCE(p.unit, ''),
		       COALESCE(p.cost_price, 0), w.quantity * COALESCE(p.cost_price, 0),
		       w.reason, COALESCE(w.department, ''), COALESCE(w.employee_name, ''),
		       w.waste_date::text, w.status, COALESCE(u.name, ''), COALESCE(w.notes, '')
		FROM wastage w
		LEFT JOIN products p ON p.id = w.product_id
		LEFT JOIN users u ON u.id = w.approved_by
		WHERE w.property_id = $1
		ORDER BY w.waste_date DESC LIMIT 50
	`, ctx.Value("property_id"))
	if err != nil {
		jsonError(w, "Failed to load wastage", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var records []WastageRecord
	for rows.Next() {
		var wr WastageRecord
		rows.Scan(&wr.ID, &wr.ProductID, &wr.ProductName, &wr.Quantity, &wr.Unit,
			&wr.UnitCost, &wr.TotalCost, &wr.Reason, &wr.Department, &wr.Employee,
			&wr.Date, &wr.Status, &wr.ApprovedBy, &wr.Notes)
		records = append(records, wr)
	}
	jsonSuccess(w, records)
}

// RecordWastage creates a new wastage record
func (h *Handler) RecordWastage(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ProductID  int     `json:"product_id"`
		Quantity   float64 `json:"quantity"`
		Reason     string  `json:"reason"`
		Department string  `json:"department"`
		Employee   string  `json:"employee_name"`
		Notes      string  `json:"notes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	_, err := h.db.Exec(ctx, `
		INSERT INTO wastage (product_id, quantity, reason, department, employee_name, notes, waste_date, status, property_id, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, 'pending', $7, NOW())
	`, req.ProductID, req.Quantity, req.Reason, req.Department, req.Employee, req.Notes, ctx.Value("property_id"))
	if err != nil {
		jsonError(w, "Failed to record wastage", http.StatusInternalServerError)
		return
	}

	jsonSuccess(w, map[string]interface{}{"message": "Wastage recorded"})
}

// ── Kitchen Display System ──

type KDSOrder struct {
	ID          int        `json:"id"`
	OrderNumber string     `json:"order_number"`
	TableNumber string     `json:"table_number"`
	RoomNumber  string     `json:"room_number"`
	Items       []KDSItem  `json:"items"`
	Status      string     `json:"status"` // received, preparing, ready, served, cancelled
	Priority    string     `json:"priority"`
	OrderTime   string     `json:"order_time"`
	Station     string     `json:"station"` // hot_kitchen, cold_kitchen, grill, bakery, bar
}

type KDSItem struct {
	Name     string `json:"name"`
	Quantity int    `json:"quantity"`
	Station  string `json:"station"`
	Notes    string `json:"notes"`
	Status   string `json:"status"`
}

// GetKDSOrders returns orders for a specific kitchen station
func (h *Handler) GetKDSOrders(w http.ResponseWriter, r *http.Request) {
	station := r.URL.Query().Get("station")
	if station == "" { station = "all" }

	ctx := r.Context()
	query := `
		SELECT po.id, po.order_number, COALESCE(t.number, ''), COALESCE(r.number, ''),
		       po.status, COALESCE(po.priority, 'normal'), po.created_at::text
		FROM pos_orders po
		LEFT JOIN tables t ON t.id = po.table_id
		LEFT JOIN rooms r ON r.id = po.room_id
		WHERE po.property_id = $1 AND po.status IN ('sent', 'preparing')
		ORDER BY po.priority DESC, po.created_at ASC
	`
	rows, err := h.db.Query(ctx, query, ctx.Value("property_id"))
	if err != nil {
		jsonError(w, "Failed to load KDS orders", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var orders []KDSOrder
	for rows.Next() {
		var o KDSOrder
		rows.Scan(&o.ID, &o.OrderNumber, &o.TableNumber, &o.RoomNumber,
			&o.Status, &o.Priority, &o.OrderTime)
		o.Station = station
		orders = append(orders, o)
	}
	jsonSuccess(w, orders)
}

// UpdateKDSOrderStatus updates order status (preparing → ready → served)
func (h *Handler) UpdateKDSOrderStatus(w http.ResponseWriter, r *http.Request) {
	orderID := r.URL.Query().Get("id")
	var req struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	_, err := h.db.Exec(ctx, `
		UPDATE pos_orders SET status = $1, updated_at = NOW() WHERE id = $2
	`, req.Status, orderID)
	if err != nil {
		jsonError(w, "Failed to update order", http.StatusInternalServerError)
		return
	}

	jsonSuccess(w, map[string]interface{}{"status": req.Status})
}
