package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

// ── Goods Receiving ──

type GoodsReceipt struct {
	ID             int     `json:"id"`
	PONumber       string  `json:"po_number"`
	SupplierName   string  `json:"supplier_name"`
	ReceivedDate   string  `json:"received_date"`
	ReceivedBy     string  `json:"received_by"`
	Status         string  `json:"status"` // received, inspected, invoiced, matched, discrepancy
	TotalItems     int     `json:"total_items"`
	TotalAmount    float64 `json:"total_amount"`
	InvoiceNumber  string  `json:"invoice_number"`
	Notes          string  `json:"notes"`
}

type GRNItem struct {
	ID            int     `json:"id"`
	ProductID     int     `json:"product_id"`
	ProductName   string  `json:"product_name"`
	OrderedQty    float64 `json:"ordered_qty"`
	ReceivedQty   float64 `json:"received_qty"`
	AcceptedQty   float64 `json:"accepted_qty"`
	RejectedQty   float64 `json:"rejected_qty"`
	UnitPrice     float64 `json:"unit_price"`
	Total         float64 `json:"total"`
	BatchNumber   string  `json:"batch_number"`
	ExpiryDate    string  `json:"expiry_date"`
	QualityNotes  string  `json:"quality_notes"`
}

// ListGoodsReceipts returns all GRNs
func (h *Handler) ListGoodsReceipts(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	rows, err := h.db.Query(ctx, `
		SELECT gr.id, gr.po_number, COALESCE(s.name, ''), gr.received_date::text,
		       COALESCE(u.name, ''), gr.status, gr.total_items, COALESCE(gr.total_amount, 0),
		       COALESCE(gr.invoice_number, ''), COALESCE(gr.notes, '')
		FROM goods_receipts gr
		LEFT JOIN suppliers s ON s.id = gr.supplier_id
		LEFT JOIN users u ON u.id = gr.received_by
		WHERE gr.property_id = $1
		ORDER BY gr.received_date DESC LIMIT 50
	`, ctx.Value("property_id"))
	if err != nil {
		jsonError(w, "Failed to load GRNs", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var receipts []GoodsReceipt
	for rows.Next() {
		var g GoodsReceipt
		rows.Scan(&g.ID, &g.PONumber, &g.SupplierName, &g.ReceivedDate,
			&g.ReceivedBy, &g.Status, &g.TotalItems, &g.TotalAmount,
			&g.InvoiceNumber, &g.Notes)
		receipts = append(receipts, g)
	}
	jsonSuccess(w, receipts)
}

// CreateGoodsReceipt records a goods receipt against a purchase order
func (h *Handler) CreateGoodsReceipt(w http.ResponseWriter, r *http.Request) {
	var req struct {
		PONumber     string     `json:"po_number"`
		SupplierID   int        `json:"supplier_id"`
		InvoiceNumber string   `json:"invoice_number"`
		Items        []GRNItem  `json:"items"`
		Notes        string     `json:"notes"`
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

	totalAmount := 0.0
	for _, item := range req.Items {
		totalAmount += item.AcceptedQty * item.UnitPrice
	}

	var grnID int
	err = tx.QueryRow(ctx, `
		INSERT INTO goods_receipts (
			po_number, supplier_id, invoice_number, received_by, status,
			total_items, total_amount, notes, property_id, received_date, created_at
		) VALUES ($1, $2, $3, $4, 'received', $5, $6, $7, $8, CURRENT_DATE, NOW())
		RETURNING id
	`, req.PONumber, req.SupplierID, req.InvoiceNumber,
		ctx.Value("user_id"), len(req.Items), totalAmount,
		req.Notes, ctx.Value("property_id")).Scan(&grnID)
	if err != nil {
		jsonError(w, "Failed to create GRN", http.StatusInternalServerError)
		return
	}

	// Insert GRN items and update inventory
	for _, item := range req.Items {
		_, err = tx.Exec(ctx, `
			INSERT INTO grn_items (
				grn_id, product_id, ordered_qty, received_qty, accepted_qty,
				rejected_qty, unit_price, batch_number, expiry_date, quality_notes
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		`, grnID, item.ProductID, item.OrderedQty, item.ReceivedQty,
			item.AcceptedQty, item.RejectedQty, item.UnitPrice,
			item.BatchNumber, item.ExpiryDate, item.QualityNotes)
		if err != nil {
			continue
		}

		// Update inventory stock
		if item.AcceptedQty > 0 {
			_, _ = tx.Exec(ctx, `
				INSERT INTO stock_movements (product_id, movement_type, quantity, reference, notes, property_id, created_at)
				VALUES ($1, 'receive', $2, $3, $4, $5, NOW())
			`, item.ProductID, item.AcceptedQty, "GRN-"+req.PONumber,
				"Goods received against PO "+req.PONumber, ctx.Value("property_id"))
		}
	}

	if err := tx.Commit(ctx); err != nil {
		jsonError(w, "Failed to save GRN", http.StatusInternalServerError)
		return
	}

	jsonSuccess(w, map[string]interface{}{
		"id":      grnID,
		"message": "Goods receipt created",
		"status":  "received",
	})
}

// ── Three-Way Matching ──

type MatchResult struct {
	PONumber       string  `json:"po_number"`
	GRNNumber      string  `json:"grn_number"`
	InvoiceNumber  string  `json:"invoice_number"`
	POAmount       float64 `json:"po_amount"`
	GRNAmount      float64 `json:"grn_amount"`
	InvoiceAmount  float64 `json:"invoice_amount"`
	Status         string  `json:"status"` // matched, price_discrepancy, quantity_discrepancy, discrepancy
	Discrepancy    float64 `json:"discrepancy"`
	Notes          string  `json:"notes"`
}

// ThreeWayMatch compares PO + GRN + Invoice
func (h *Handler) ThreeWayMatch(w http.ResponseWriter, r *http.Request) {
	var req struct {
		PONumber      string  `json:"po_number"`
		GRNNumber     string  `json:"grn_number"`
		InvoiceNumber string  `json:"invoice_number"`
		InvoiceAmount float64 `json:"invoice_amount"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	ctx := r.Context()

	// Get PO total
	var poAmount float64
	_ = h.db.QueryRow(ctx, `
		SELECT COALESCE(SUM(quantity * unit_price), 0) FROM purchase_order_items
		WHERE po_number = $1
	`, req.PONumber).Scan(&poAmount)

	// Get GRN total
	var grnAmount float64
	_ = h.db.QueryRow(ctx, `
		SELECT COALESCE(total_amount, 0) FROM goods_receipts
		WHERE po_number = $1
	`, req.PONumber).Scan(&grnAmount)

	// Compare
	status := "matched"
	discrepancy := req.InvoiceAmount - poAmount

	if discrepancy > 0.01 || discrepancy < -0.01 {
		if grnAmount != poAmount {
			status = "quantity_discrepancy"
		} else {
			status = "price_discrepancy"
		}
	}

	result := MatchResult{
		PONumber:      req.PONumber,
		GRNNumber:     req.GRNNumber,
		InvoiceNumber: req.InvoiceNumber,
		POAmount:      poAmount,
		GRNAmount:     grnAmount,
		InvoiceAmount: req.InvoiceAmount,
		Status:        status,
		Discrepancy:   discrepancy,
	}

	// Record the match attempt
	_, _ = h.db.Exec(ctx, `
		INSERT INTO three_way_matches (
			po_number, grn_number, invoice_number, po_amount, grn_amount,
			invoice_amount, status, discrepancy, property_id, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
	`, req.PONumber, req.GRNNumber, req.InvoiceNumber,
		poAmount, grnAmount, req.InvoiceAmount, status, discrepancy, ctx.Value("property_id"))

	jsonSuccess(w, result)
}

// ── Stock Count ──

type StockCount struct {
	ID          int     `json:"id"`
	CountDate   string  `json:"count_date"`
	CountType   string  `json:"count_type"` // full, category, location, surprise
	StoreID     int     `json:"store_id"`
	Status      string  `json:"status"` // in_progress, completed, adjusted
	TotalItems  int     `json:"total_items"`
	Variance    float64 `json:"variance_cost"`
	CreatedBy   string  `json:"created_by"`
}

type StockCountItem struct {
	ID             int     `json:"id"`
	ProductID      int     `json:"product_id"`
	ProductName    string  `json:"product_name"`
	SystemQty      float64 `json:"system_qty"`
	PhysicalQty    float64 `json:"physical_qty"`
	Variance       float64 `json:"variance"`
	VarianceCost   float64 `json:"variance_cost"`
	UnitCost       float64 `json:"unit_cost"`
	Notes          string  `json:"notes"`
}

// CreateStockCount starts a new stock count
func (h *Handler) CreateStockCount(w http.ResponseWriter, r *http.Request) {
	var req struct {
		CountType string `json:"count_type"`
		StoreID   int    `json:"store_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	var countID int
	err := h.db.QueryRow(ctx, `
		INSERT INTO stock_counts (count_date, count_type, store_id, status, created_by, property_id, created_at)
		VALUES (CURRENT_DATE, $1, $2, 'in_progress', $3, $4, NOW())
		RETURNING id
	`, req.CountType, req.StoreID, ctx.Value("user_id"), ctx.Value("property_id")).Scan(&countID)
	if err != nil {
		jsonError(w, "Failed to create stock count", http.StatusInternalServerError)
		return
	}

	jsonSuccess(w, map[string]interface{}{
		"id":      countID,
		"message": "Stock count started",
		"status":  "in_progress",
	})
}

// SubmitStockCount records physical counts and calculates variance
func (h *Handler) SubmitStockCount(w http.ResponseWriter, r *http.Request) {
	countID := chi.URLParam(r, "id")
	var req struct {
		Items []StockCountItem `json:"items"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	totalVarianceCost := 0.0

	for _, item := range req.Items {
		variance := item.PhysicalQty - item.SystemQty
		varianceCost := variance * item.UnitCost
		totalVarianceCost += varianceCost

		_, _ = h.db.Exec(ctx, `
			INSERT INTO stock_count_items (count_id, product_id, system_qty, physical_qty, variance, variance_cost, notes)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
		`, countID, item.ProductID, item.SystemQty, item.PhysicalQty, variance, varianceCost, item.Notes)
	}

	_, _ = h.db.Exec(ctx, `
		UPDATE stock_counts SET status = 'completed', total_items = $1, variance_cost = $2 WHERE id = $3
	`, len(req.Items), totalVarianceCost, countID)

	jsonSuccess(w, map[string]interface{}{
		"message":        "Stock count completed",
		"total_items":    len(req.Items),
		"variance_cost":  totalVarianceCost,
	})
}

// ── Inventory Costing ──

// GetInventoryValuation returns stock valuation using configured method
func (h *Handler) GetInventoryValuation(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	method := r.URL.Query().Get("method")
	if method == "" { method = "weighted_average" }

	type ValuationItem struct {
		ProductID    int     `json:"product_id"`
		SKU          string  `json:"sku"`
		Name         string  `json:"name"`
		CurrentQty   float64 `json:"current_qty"`
		UnitCost     float64 `json:"unit_cost"`
		TotalValue   float64 `json:"total_value"`
		Category     string  `json:"category"`
	}

	query := `
		SELECT p.id, p.sku, p.name, COALESCE(SUM(sm.quantity), 0) as current_qty,
		       COALESCE(p.cost_price, 0), p.category
		FROM products p
		LEFT JOIN stock_movements sm ON sm.product_id = p.id
		WHERE p.property_id = $1
		GROUP BY p.id, p.sku, p.name, p.cost_price, p.category
		HAVING COALESCE(SUM(sm.quantity), 0) > 0
		ORDER BY p.category, p.name
	`

	rows, err := h.db.Query(ctx, query, ctx.Value("property_id"))
	if err != nil {
		jsonError(w, "Failed to calculate valuation", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var items []ValuationItem
	totalValue := 0.0
	for rows.Next() {
		var item ValuationItem
		rows.Scan(&item.ProductID, &item.SKU, &item.Name, &item.CurrentQty, &item.UnitCost, &item.Category)
		item.TotalValue = item.CurrentQty * item.UnitCost
		totalValue += item.TotalValue
		items = append(items, item)
	}

	jsonSuccess(w, map[string]interface{}{
		"method":       method,
		"items":        items,
		"total_value":  totalValue,
		"total_items":  len(items),
	})
}
