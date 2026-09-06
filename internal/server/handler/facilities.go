package handler

import (
	"encoding/json"
	"math"
	"net/http"
	"time"

	"github.com/google/uuid"
)

// ═══════════════════════════════════════════════════════════════
// GENERATOR & FUEL TRACKING MODULE
// Critical for African hospitality operations — generator costs are
// a major operational expense (diesel, maintenance, run-hours)
// ═══════════════════════════════════════════════════════════════

// GeneratorLogEntry represents a single generator run entry
type GeneratorLogEntry struct {
	ID              string  `json:"id"`
	PropertyID      string  `json:"property_id"`
	GeneratorID     string  `json:"generator_id"`
	StartTime       string  `json:"start_time"`
	EndTime         string  `json:"end_time,omitempty"`
	RunHours        float64 `json:"run_hours"`
	FuelConsumed    float64 `json:"fuel_consumed_liters"`
	FuelCost        float64 `json:"fuel_cost_ngn"`
	PowerOutput     float64 `json:"power_output_kw"`
	MaintenanceNotes string `json:"maintenance_notes,omitempty"`
	RecordedBy      string  `json:"recorded_by"`
	CreatedAt       string  `json:"created_at"`
}

// FuelPurchase represents a fuel purchase record
type FuelPurchase struct {
	ID           string  `json:"id"`
	PropertyID   string  `json:"property_id"`
	GeneratorID  string  `json:"generator_id"`
	Quantity     float64 `json:"quantity_liters"`
	UnitPrice    float64 `json:"unit_price_ngn"`
	TotalCost    float64 `json:"total_cost_ngn"`
	ReceiptNo    string  `json:"receipt_number"`
	Supplier     string  `json:"supplier"`
	PurchasedBy  string  `json:"purchased_by"`
	PurchaseDate string  `json:"purchase_date"`
	CreatedAt    string  `json:"created_at"`
}

// GeneratorSummary provides the fuel/cost summary
type GeneratorSummary struct {
	TotalRunHours      float64 `json:"total_run_hours"`
	TotalFuelConsumed  float64 `json:"total_fuel_consumed_liters"`
	TotalFuelCost      float64 `json:"total_fuel_cost_ngn"`
	AvgConsumptionRate float64 `json:"avg_consumption_liters_per_hour"`
	FuelInStock        float64 `json:"fuel_in_stock_liters"`
	MonthlyCost        float64 `json:"monthly_cost_ngn"`
	DailyAverageCost   float64 `json:"daily_average_cost"`
	GeneratorCount     int     `json:"generator_count"`
	LastMaintenance    string  `json:"last_maintenance"`
}

// CreateGeneratorLog creates a new generator run log entry
func (h *Handler) CreateGeneratorLog(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()

	var req struct {
		GeneratorID      string  `json:"generator_id"`
		StartTime        string  `json:"start_time"`
		EndTime          string  `json:"end_time"`
		FuelConsumed     float64 `json:"fuel_consumed_liters"`
		FuelCost         float64 `json:"fuel_cost_ngn"`
		PowerOutput      float64 `json:"power_output_kw"`
		MaintenanceNotes string  `json:"maintenance_notes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, 400, map[string]interface{}{"error": "Invalid request body"})
		return
	}

	// Calculate run hours
	startTime, _ := time.Parse("2006-01-02T15:04", req.StartTime)
	endTime, _ := time.Parse("2006-01-02T15:04", req.EndTime)
	runHours := endTime.Sub(startTime).Hours()
	if runHours < 0 {
		runHours = 0
	}

	id := uuid.New().String()
	_, err := h.db.Exec(ctx, `
		INSERT INTO generator_logs (id, property_id, generator_id, start_time, end_time, run_hours,
			fuel_consumed, fuel_cost, power_output, maintenance_notes, recorded_by, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		id, propertyID, req.GeneratorID, req.StartTime, req.EndTime, runHours,
		req.FuelConsumed, req.FuelCost, req.PowerOutput, req.MaintenanceNotes, "system", time.Now().UTC().Format(time.RFC3339))
	if err != nil {
		respondJSON(w, 500, map[string]interface{}{"error": "Failed to create generator log"})
		return
	}

	respondJSON(w, 201, map[string]interface{}{
		"id":         id,
		"run_hours":  runHours,
		"message":    "Generator log recorded successfully",
	})
}

// ListGeneratorLogs returns generator log history
func (h *Handler) ListGeneratorLogs(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()

	rows, err := h.db.Query(ctx, `
		SELECT gl.id, gl.generator_id, COALESCE(g.name, gl.generator_id) as gen_name,
			gl.start_time, gl.end_time, gl.run_hours, gl.fuel_consumed, gl.fuel_cost,
			gl.power_output, gl.maintenance_notes, gl.created_at
		FROM generator_logs gl
		LEFT JOIN generators g ON gl.generator_id = g.id
		WHERE gl.property_id=?
		ORDER BY gl.created_at DESC LIMIT 100`, propertyID)
	if err != nil {
		respondJSON(w, 200, map[string]interface{}{"logs": []interface{}{}})
		return
	}
	defer rows.Close()

	logs := []map[string]interface{}{}
	for rows.Next() {
		var id, genID, genName, startTime, endTime, notes, created string
		var runHours, fuel, cost, power float64
		rows.Scan(&id, &genID, &genName, &startTime, &endTime, &runHours, &fuel, &cost, &power, &notes, &created)
		logs = append(logs, map[string]interface{}{
			"id": id, "generator_id": genID, "generator_name": genName,
			"start_time": startTime, "end_time": endTime, "run_hours": runHours,
			"fuel_consumed": fuel, "fuel_cost": cost, "power_output_kw": power,
			"maintenance_notes": notes, "created_at": created,
		})
	}

	respondJSON(w, 200, map[string]interface{}{"logs": logs})
}

// CreateFuelPurchase records a fuel purchase
func (h *Handler) CreateFuelPurchase(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()

	var req struct {
		GeneratorID  string  `json:"generator_id"`
		Quantity     float64 `json:"quantity_liters"`
		UnitPrice    float64 `json:"unit_price_ngn"`
		ReceiptNo    string  `json:"receipt_number"`
		Supplier     string  `json:"supplier"`
		PurchaseDate string  `json:"purchase_date"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, 400, map[string]interface{}{"error": "Invalid request body"})
		return
	}

	totalCost := req.Quantity * req.UnitPrice
	id := uuid.New().String()

	_, err := h.db.Exec(ctx, `
		INSERT INTO fuel_purchases (id, property_id, generator_id, quantity, unit_price, total_cost,
			receipt_no, supplier, purchased_by, purchase_date, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		id, propertyID, req.GeneratorID, req.Quantity, req.UnitPrice, totalCost,
		req.ReceiptNo, req.Supplier, "system", req.PurchaseDate, time.Now().UTC().Format(time.RFC3339))
	if err != nil {
		respondJSON(w, 500, map[string]interface{}{"error": "Failed to record fuel purchase"})
		return
	}

	respondJSON(w, 201, map[string]interface{}{
		"id":         id,
		"total_cost": totalCost,
		"message":    "Fuel purchase recorded successfully",
	})
}

// GeneratorFuelSummary returns the fuel/cost summary for the property
func (h *Handler) GeneratorFuelSummary(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()

	summary := GeneratorSummary{}

	h.db.QueryRow(ctx, `SELECT COUNT(DISTINCT id) FROM generators WHERE property_id=?`, propertyID).Scan(&summary.GeneratorCount)

	// This month's stats
	h.db.QueryRow(ctx, `
		SELECT COALESCE(SUM(run_hours), 0), COALESCE(SUM(fuel_consumed), 0), COALESCE(SUM(fuel_cost), 0)
		FROM generator_logs WHERE property_id=? AND created_at >= date('now', 'start of month')`,
		propertyID).Scan(&summary.TotalRunHours, &summary.TotalFuelConsumed, &summary.TotalFuelCost)

	// Fuel in stock
	h.db.QueryRow(ctx, `
		SELECT COALESCE(SUM(quantity), 0) - COALESCE((SELECT SUM(fuel_consumed) FROM generator_logs WHERE property_id=? AND created_at >= date('now', 'start of month')), 0)
		FROM fuel_purchases WHERE property_id=? AND created_at >= date('now', 'start of month')`,
		propertyID, propertyID).Scan(&summary.FuelInStock)

	if summary.TotalRunHours > 0 {
		summary.AvgConsumptionRate = summary.TotalFuelConsumed / summary.TotalRunHours
	}

	// Daily average
	dayOfMonth := time.Now().Day()
	if dayOfMonth > 0 {
		summary.DailyAverageCost = summary.TotalFuelCost / float64(dayOfMonth)
	}
	summary.MonthlyCost = summary.TotalFuelCost

	respondJSON(w, 200, summary)
}

// ═══════════════════════════════════════════════════════════════
// SERVICE CHARGE DISTRIBUTION
// Common in African hotels — pooled service charge split among staff
// ═══════════════════════════════════════════════════════════════

// ServiceChargePool manages the monthly service charge distribution
func (h *Handler) ServiceChargePool(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()

	// Calculate total service charge collected this month
	var totalPool float64
	h.db.QueryRow(ctx, `
		SELECT COALESCE(SUM(fc.amount), 0)
		FROM folio_charges fc
		JOIN folios f ON fc.folio_id = f.id
		WHERE f.property_id=? AND fc.type='service_charge'
		AND fc.date >= date('now', 'start of month')`,
		propertyID).Scan(&totalPool)

	// Also add POS service charges
	var posServiceCharge float64
	h.db.QueryRow(ctx, `
		SELECT COALESCE(SUM(total_amount * 0.10), 0)
		FROM pos_orders WHERE property_id=? AND DATE(created_at) >= date('now', 'start of month') AND status='closed'`,
		propertyID).Scan(&posServiceCharge)

	totalPool += posServiceCharge

	// Get staff eligible for distribution
	rows, err := h.db.Query(ctx, `
		SELECT e.id, e.first_name || ' ' || e.last_name, e.position, COALESCE(e.salary, 0)
		FROM employees e
		WHERE e.property_id=? AND e.status='active'
		ORDER BY e.first_name`, propertyID)
	if err != nil {
		respondJSON(w, 200, map[string]interface{}{"pool": totalPool, "distribution": []interface{}{}})
		return
	}
	defer rows.Close()

	distribution := []map[string]interface{}{}
	totalShares := 0.0
	eligibleStaff := []struct{ id, name, position string; salary float64 }{}

	for rows.Next() {
		var id, name, position string
		var salary float64
		rows.Scan(&id, &name, &position, &salary)
		eligibleStaff = append(eligibleStaff, struct{ id, name, position string; salary float64 }{id, name, position, salary})

		// Weight: base 1, managers get 1.5x, supervisors 1.25x
		weight := 1.0
		switch {
		case contains(position, "Manager") || contains(position, "Chief"):
			weight = 1.5
		case contains(position, "Supervisor"):
			weight = 1.25
		}
		totalShares += weight
	}

	for _, staff := range eligibleStaff {
		weight := 1.0
		switch {
		case contains(staff.position, "Manager") || contains(staff.position, "Chief"):
			weight = 1.5
		case contains(staff.position, "Supervisor"):
			weight = 1.25
		}

		share := (weight / totalShares) * totalPool
		distribution = append(distribution, map[string]interface{}{
			"employee_id":   staff.id,
			"name":          staff.name,
			"position":      staff.position,
			"weight":        weight,
			"share_amount":  math.Round(share*100) / 100,
			"share_percent": math.Round(weight/totalShares*10000) / 100,
		})
	}

	respondJSON(w, 200, map[string]interface{}{
		"pool_total":    totalPool,
		"room_service":  totalPool - posServiceCharge,
		"pos_service":   posServiceCharge,
		"total_shares":  totalShares,
		"eligible_staff": len(distribution),
		"distribution":  distribution,
		"period":        time.Now().Format("January 2006"),
	})
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > 0 && (s[0:len(substr)] == substr || containsAt(s, substr)))
}

func containsAt(s, substr string) bool {
	for i := 0; i+len(substr) <= len(s); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
