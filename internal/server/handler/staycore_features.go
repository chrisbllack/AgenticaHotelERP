package handler

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"time"

	"github.com/google/uuid"
)

// ═══════════════════════════════════════════════════════════════
// STAYCORE-INSPIRED FEATURES
// Revenue Protection, Shortlets, Verification, Pricing, Forecasting,
// Table Management, Owner Portal, Recipe Costing, Tips, Time Tracking
// ═══════════════════════════════════════════════════════════════

// ─── 1. REVENUE PROTECTION SYSTEM ────────────────────────────

// ApprovalRequest represents a request that needs manager approval
type ApprovalRequest struct {
	ID          string  `json:"id"`
	Type        string  `json:"type"` // discount, void, refund, rate_override, comp
	RequesterID string  `json:"requester_id"`
	PropertyID  string  `json:"property_id"`
	TargetType  string  `json:"target_type"` // folio_charge, reservation, pos_order
	TargetID    string  `json:"target_id"`
	Amount      float64 `json:"amount"`
	Reason      string  `json:"reason"`
	Status      string  `json:"status"` // pending, approved, rejected
	ApprovedBy  string  `json:"approved_by,omitempty"`
	AuditTrail  string  `json:"audit_trail"`
	CreatedAt   string  `json:"created_at"`
}

// CreateApprovalRequest submits a request that needs manager approval
func (h *Handler) CreateApprovalRequest(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()

	var req struct {
		Type       string  `json:"type"`
		TargetType string  `json:"target_type"`
		TargetID   string  `json:"target_id"`
		Amount     float64 `json:"amount"`
		Reason     string  `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, 400, map[string]interface{}{"error": "Invalid request body"})
		return
	}

	id := uuid.New().String()
	auditEntry := fmt.Sprintf("[%s] %s requested %s of ₦%.2f on %s %s. Reason: %s",
		time.Now().Format("2006-01-02 15:04"), "system", req.Type, req.Amount, req.TargetType, req.TargetID, req.Reason)

	_, err := h.db.Exec(ctx, `
		INSERT INTO approval_requests (id, property_id, type, target_type, target_id, amount, reason, status, audit_trail, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
		id, propertyID, req.Type, req.TargetType, req.TargetID, req.Amount, req.Reason, auditEntry, time.Now().UTC())
	if err != nil {
		respondJSON(w, 500, map[string]interface{}{"error": "Failed to create approval request"})
		return
	}

	log.Printf("[REVENUE PROTECTION] %s requested: %s ₦%.2f on %s (reason: %s)", req.Type, req.TargetType, req.Amount, req.TargetID, req.Reason)
	respondJSON(w, 201, map[string]interface{}{
		"id": id, "status": "pending", "message": "Approval request submitted. Awaiting manager approval.",
	})
}

// ListApprovalRequests returns pending approval requests for the property
func (h *Handler) ListApprovalRequests(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()

	status := r.URL.Query().Get("status")
	if status == "" {
		status = "pending"
	}

	rows, err := h.db.Query(ctx, `
		SELECT id, type, target_type, target_id, amount, reason, status, approved_by, audit_trail, created_at
		FROM approval_requests WHERE property_id=? AND status=?
		ORDER BY created_at DESC`, propertyID, status)
	if err != nil {
		respondJSON(w, 200, map[string]interface{}{"requests": []interface{}{}})
		return
	}
	defer rows.Close()

	requests := []map[string]interface{}{}
	for rows.Next() {
		var id, typ, targetType, targetID, reason, status, approvedBy, audit, created string
		var amount float64
		rows.Scan(&id, &typ, &targetType, &targetID, &amount, &reason, &status, &approvedBy, &audit, &created)
		requests = append(requests, map[string]interface{}{
			"id": id, "type": typ, "target_type": targetType, "target_id": targetID,
			"amount": amount, "reason": reason, "status": status,
			"approved_by": approvedBy, "audit_trail": audit, "created_at": created,
		})
	}

	respondJSON(w, 200, map[string]interface{}{"requests": requests})
}

// ApproveRequest approves or rejects an approval request
func (h *Handler) ApproveRevenueRequest(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	requestID := r.URL.Query().Get("id")

	var req struct {
		Action string `json:"action"` // approve, reject
		Notes  string `json:"notes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, 400, map[string]interface{}{"error": "Invalid request body"})
		return
	}

	status := "approved"
	if req.Action == "reject" {
		status = "rejected"
	}

	auditUpdate := fmt.Sprintf(" | [%s] %s %s by manager. Notes: %s",
		time.Now().Format("2006-01-02 15:04"), req.Action, status, req.Notes)

	_, err := h.db.Exec(ctx, `
		UPDATE approval_requests SET status=?, approved_by='manager', audit_trail=audit_trail||?, approved_at=?
		WHERE id=?`,
		status, auditUpdate, time.Now().UTC(), requestID)
	if err != nil {
		respondJSON(w, 500, map[string]interface{}{"error": "Failed to process request"})
		return
	}

	log.Printf("[REVENUE PROTECTION] Request %s: %s (reason: %s)", requestID, status, req.Notes)
	respondJSON(w, 200, map[string]interface{}{
		"status": status, "message": "Request " + status,
	})
}

// ─── 2. SHORTLET MANAGEMENT ─────────────────────────────────

// ListShortlets returns all shortlet units for a property
func (h *Handler) ListShortlets(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()

	rows, err := h.db.Query(ctx, `
		SELECT id, name, unit_type, bedrooms, max_guests, base_price, status, floor, building
		FROM shortlet_units WHERE property_id=? ORDER BY building, name`, propertyID)
	if err != nil {
		// Table may not exist, return empty
		respondJSON(w, 200, map[string]interface{}{"units": []interface{}{}})
		return
	}
	defer rows.Close()

	units := []map[string]interface{}{}
	for rows.Next() {
		var id, name, unitType, status, floor, building string
		var bedrooms, maxGuests int
		var price float64
		rows.Scan(&id, &name, &unitType, &bedrooms, &maxGuests, &price, &status, &floor, &building)
		units = append(units, map[string]interface{}{
			"id": id, "name": name, "type": unitType, "bedrooms": bedrooms,
			"max_guests": maxGuests, "base_price": price, "status": status,
			"floor": floor, "building": building,
		})
	}

	respondJSON(w, 200, map[string]interface{}{"units": units})
}

// CreateShortletBooking creates a booking for a shortlet unit
func (h *Handler) CreateShortletBooking(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()

	var req struct {
		UnitID      string  `json:"unit_id"`
		GuestName   string  `json:"guest_name"`
		GuestPhone  string  `json:"guest_phone"`
		GuestEmail  string  `json:"guest_email"`
		CheckIn     string  `json:"check_in"`
		CheckOut    string  `json:"check_out"`
		TotalAmount float64 `json:"total_amount"`
		Platform    string  `json:"platform"` // direct, booking_com, airbnb
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, 400, map[string]interface{}{"error": "Invalid request body"})
		return
	}

	id := uuid.New().String()
	_, err := h.db.Exec(ctx, `
		INSERT INTO shortlet_bookings (id, property_id, unit_id, guest_name, guest_phone, guest_email,
			check_in, check_out, total_amount, platform, status, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?)`,
		id, propertyID, req.UnitID, req.GuestName, req.GuestPhone, req.GuestEmail,
		req.CheckIn, req.CheckOut, req.TotalAmount, req.Platform, time.Now().UTC())
	if err != nil {
		respondJSON(w, 500, map[string]interface{}{"error": "Failed to create booking"})
		return
	}

	respondJSON(w, 201, map[string]interface{}{
		"id": id, "status": "confirmed", "message": "Shortlet booking created",
	})
}

// ShortletOwnerPayouts calculates owner payouts for shortlet units
func (h *Handler) ShortletOwnerPayouts(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()

	// Calculate revenue per unit this month
	rows, err := h.db.Query(ctx, `
		SELECT su.id, su.name, su.owner_name, COALESCE(SUM(sb.total_amount), 0) as revenue,
			COUNT(sb.id) as bookings
		FROM shortlet_units su
		LEFT JOIN shortlet_bookings sb ON su.id = sb.unit_id AND sb.status='completed'
			AND sb.created_at >= date('now', 'start of month')
		WHERE su.property_id=?
		GROUP BY su.id ORDER BY revenue DESC`, propertyID)
	if err != nil {
		respondJSON(w, 200, map[string]interface{}{"payouts": []interface{}{}})
		return
	}
	defer rows.Close()

	payouts := []map[string]interface{}{}
	for rows.Next() {
		var id, name, owner string
		var revenue float64
		var bookings int
		rows.Scan(&id, &name, &owner, &revenue, &bookings)
		payouts = append(payouts, map[string]interface{}{
			"unit_id": id, "unit_name": name, "owner": owner,
			"revenue": revenue, "bookings": bookings,
			"owner_share": revenue * 0.80, // 80% owner, 20% platform
			"platform_fee": revenue * 0.20,
			"period": time.Now().Format("January 2006"),
		})
	}

	respondJSON(w, 200, map[string]interface{}{
		"payouts": payouts,
		"period":  time.Now().Format("January 2006"),
	})
}

// ─── 3. GUEST IDENTITY VERIFICATION ─────────────────────────

// SubmitGuestVerification records ID/NIN/selfie verification
func (h *Handler) SubmitGuestVerification(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()

	var req struct {
		GuestID         string `json:"guest_id"`
		VerificationType string `json:"type"` // nin, passport, drivers_license, national_id, selfie
		DocumentNumber  string `json:"document_number"`
		DocumentFrontURL string `json:"document_front_url"`
		DocumentBackURL string `json:"document_back_url"`
		SelfieURL       string `json:"selfie_url"`
		ExpiryDate      string `json:"expiry_date"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, 400, map[string]interface{}{"error": "Invalid request body"})
		return
	}

	id := uuid.New().String()
	_, err := h.db.Exec(ctx, `
		INSERT INTO guest_verifications (id, property_id, guest_id, verification_type,
			document_number, document_front_url, document_back_url, selfie_url, expiry_date, status, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_verification', ?)`,
		id, propertyID, req.GuestID, req.VerificationType,
		req.DocumentNumber, req.DocumentFrontURL, req.DocumentBackURL, req.SelfieURL, req.ExpiryDate, time.Now().UTC())
	if err != nil {
		respondJSON(w, 500, map[string]interface{}{"error": "Failed to submit verification"})
		return
	}

	respondJSON(w, 201, map[string]interface{}{
		"id": id, "status": "pending_verification",
		"message": "Verification submitted. Awaiting review.",
	})
}

// ListGuestVerifications returns verification records for a property
func (h *Handler) ListGuestVerifications(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()

	rows, err := h.db.Query(ctx, `
		SELECT gv.id, gv.guest_id, COALESCE(g.first_name || ' ' || g.last_name, 'Unknown') as guest_name,
			gv.verification_type, gv.document_number, gv.status, gv.created_at
		FROM guest_verifications gv
		LEFT JOIN guests g ON gv.guest_id = g.id
		WHERE gv.property_id=?
		ORDER BY gv.created_at DESC LIMIT 50`, propertyID)
	if err != nil {
		respondJSON(w, 200, map[string]interface{}{"verifications": []interface{}{}})
		return
	}
	defer rows.Close()

	verifications := []map[string]interface{}{}
	for rows.Next() {
		var id, guestID, guestName, vType, docNum, status, created string
		rows.Scan(&id, &guestID, &guestName, &vType, &docNum, &status, &created)
		verifications = append(verifications, map[string]interface{}{
			"id": id, "guest_id": guestID, "guest_name": guestName,
			"type": vType, "document_number": docNum, "status": status, "created_at": created,
		})
	}

	respondJSON(w, 200, map[string]interface{}{"verifications": verifications})
}

// ─── 4. DYNAMIC PRICING / REVENUE AUTOMATION ─────────────────

// PricingRule represents a dynamic pricing rule
type PricingRule struct {
	ID            string  `json:"id"`
	RoomTypeID    string  `json:"room_type_id"`
	Name          string  `json:"name"`
	MinOccupancy  float64 `json:"min_occupancy"`
	MaxOccupancy  float64 `json:"max_occupancy"`
	PriceAdjust   float64 `json:"price_adjust_percent"` // -20 to +50
	DayOfWeek     string  `json:"day_of_week"` // all, weekday, weekend
	StartDate     string  `json:"start_date,omitempty"`
	EndDate       string  `json:"end_date,omitempty"`
	Enabled       bool    `json:"enabled"`
}

// GetDynamicRate returns the current rate for a room type based on occupancy and rules
func (h *Handler) GetDynamicRate(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()
	roomTypeID := r.URL.Query().Get("room_type_id")
	checkIn := r.URL.Query().Get("check_in")
	checkOut := r.URL.Query().Get("check_out")

	// Get base price
	var basePrice float64
	err := h.db.QueryRow(ctx, `SELECT base_price FROM room_types WHERE id=? AND property_id=?`, roomTypeID, propertyID).Scan(&basePrice)
	if err != nil {
		respondJSON(w, 404, map[string]interface{}{"error": "Room type not found"})
		return
	}

	// Get current occupancy rate
	var totalRooms, occupiedRooms int
	_ = h.db.QueryRow(ctx, `SELECT COUNT(*) FROM rooms WHERE property_id=? AND room_type_id=?`, propertyID, roomTypeID).Scan(&totalRooms)
	_ = h.db.QueryRow(ctx, `SELECT COUNT(*) FROM rooms WHERE property_id=? AND room_type_id=? AND status='occupied'`, propertyID, roomTypeID).Scan(&occupiedRooms)

	occupancyRate := 0.0
	if totalRooms > 0 {
		occupancyRate = float64(occupiedRooms) / float64(totalRooms) * 100
	}

	// Find applicable pricing rule
	var adjustment float64
	_ = h.db.QueryRow(ctx, `
		SELECT COALESCE(price_adjust, 0) FROM pricing_rules
		WHERE property_id=? AND room_type_id=? AND enabled=1
		AND min_occupancy <= ? AND max_occupancy >= ?
		ORDER BY min_occupancy DESC LIMIT 1`,
		propertyID, roomTypeID, occupancyRate, occupancyRate).Scan(&adjustment)

	dynamicPrice := basePrice * (1 + adjustment/100)

	// Seasonal/event adjustments
	checkInDate, _ := time.Parse("2006-01-02", checkIn)
	dayOfWeek := checkInDate.Weekday().String()

	if dayOfWeek == "Saturday" || dayOfWeek == "Friday" {
		dynamicPrice *= 1.15 // Weekend premium
	}

	respondJSON(w, 200, map[string]interface{}{
		"room_type_id":   roomTypeID,
		"base_price":     basePrice,
		"occupancy_rate": occupancyRate,
		"adjustment_pct": adjustment,
		"dynamic_price":  math.Round(dynamicPrice*100) / 100,
		"day_of_week":    dayOfWeek,
		"check_in":       checkIn,
		"check_out":      checkOut,
	})
}

// CreatePricingRule creates a dynamic pricing rule
func (h *Handler) CreateDynamicPricingRule(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()

	var req struct {
		RoomTypeID   string  `json:"room_type_id"`
		Name         string  `json:"name"`
		MinOccupancy float64 `json:"min_occupancy"`
		MaxOccupancy float64 `json:"max_occupancy"`
		PriceAdjust  float64 `json:"price_adjust_percent"`
		DayOfWeek    string  `json:"day_of_week"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, 400, map[string]interface{}{"error": "Invalid request body"})
		return
	}

	id := uuid.New().String()
	_, err := h.db.Exec(ctx, `
		INSERT INTO pricing_rules (id, property_id, room_type_id, name, min_occupancy, max_occupancy, price_adjust, day_of_week, enabled, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
		id, propertyID, req.RoomTypeID, req.Name, req.MinOccupancy, req.MaxOccupancy, req.PriceAdjust, req.DayOfWeek, time.Now().UTC())
	if err != nil {
		respondJSON(w, 500, map[string]interface{}{"error": "Failed to create pricing rule"})
		return
	}

	respondJSON(w, 201, map[string]interface{}{"id": id, "message": "Pricing rule created"})
}

// ─── 5. FORECASTING ENGINE ──────────────────────────────────

// RevenueForecast returns predicted revenue based on historical data
func (h *Handler) RevenueForecast(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()

	var totalRooms int
	_ = h.db.QueryRow(ctx, `SELECT COUNT(*) FROM rooms WHERE property_id=?`, propertyID).Scan(&totalRooms)

	// Get last 30 days of revenue data
	rows, err := h.db.Query(ctx, `
		SELECT date, COALESCE(total_revenue, 0) as revenue, COALESCE(room_revenue, 0) as room_rev,
			(SELECT COUNT(*) FROM rooms WHERE property_id=? AND status='occupied') as occupied
		FROM daily_revenue WHERE property_id=? AND date >= date('now', '-30 days')
		ORDER BY date`, propertyID, propertyID)
	if err != nil {
		respondJSON(w, 200, map[string]interface{}{"forecast": map[string]interface{}{}, "data": []interface{}{}})
		return
	}
	defer rows.Close()

	type DayData struct {
		Date     string  `json:"date"`
		Revenue  float64 `json:"revenue"`
		RoomRev  float64 `json:"room_revenue"`
		Occupied int     `json:"occupied"`
	}

	var historical []DayData
	for rows.Next() {
		var d DayData
		rows.Scan(&d.Date, &d.Revenue, &d.RoomRev, &d.Occupied)
		historical = append(historical, d)
	}

	// Simple moving average forecast for next 14 days
	avgRevenue := 0.0
	avgOccupancy := 0.0
	avgRate := 0.0
	if len(historical) > 0 {
		for _, d := range historical {
			avgRevenue += d.Revenue
			avgOccupancy += float64(d.Occupied)
		}
		avgRevenue /= float64(len(historical))
		avgOccupancy /= float64(len(historical))
		if totalRooms > 0 {
			avgRate = avgOccupancy / float64(totalRooms) * 100
		}
	}

	type ForecastDay struct {
		Date             string  `json:"date"`
		PredictedRevenue float64 `json:"predicted_revenue"`
		PredictedOcc     float64 `json:"predicted_occupancy"`
		Confidence       string  `json:"confidence"`
	}

	forecast := []ForecastDay{}
	for i := 1; i <= 14; i++ {
		fDate := time.Now().AddDate(0, 0, i)
		dow := fDate.Weekday()

		// Adjust for weekday/weekend patterns
		multiplier := 1.0
		if dow == time.Friday || dow == time.Saturday {
			multiplier = 1.25
		} else if dow == time.Sunday {
			multiplier = 1.10
		} else if dow == time.Tuesday || dow == time.Wednesday {
			multiplier = 0.85
		}

		predicted := avgRevenue * multiplier
		predictedOcc := avgRate * multiplier
		if predictedOcc > 100 {
			predictedOcc = 100
		}

		forecast = append(forecast, ForecastDay{
			Date:             fDate.Format("2006-01-02"),
			PredictedRevenue: math.Round(predicted*100) / 100,
			PredictedOcc:     math.Round(predictedOcc*10) / 10,
			Confidence:       "medium",
		})
	}

	respondJSON(w, 200, map[string]interface{}{
		"forecast":    forecast,
		"historical":  historical,
		"avg_revenue": math.Round(avgRevenue*100) / 100,
		"avg_occupancy": math.Round(avgRate*10) / 10,
		"total_rooms": totalRooms,
		"period":      "Next 14 days",
	})
}

// ─── 6. RESTAURANT TABLE MANAGEMENT ─────────────────────────

// ListTables returns all restaurant tables with status
func (h *Handler) ListRestaurantTables(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()

	rows, err := h.db.Query(ctx, `
		SELECT id, number, capacity, section, status, current_order_id, server_name, seated_at
		FROM restaurant_tables WHERE property_id=? ORDER BY section, number`, propertyID)
	if err != nil {
		respondJSON(w, 200, map[string]interface{}{"tables": []interface{}{}})
		return
	}
	defer rows.Close()

	tables := []map[string]interface{}{}
	for rows.Next() {
		var id, number, section, status, orderID, server, seatedAt string
		var capacity int
		rows.Scan(&id, &number, &capacity, &section, &status, &orderID, &server, &seatedAt)
		tables = append(tables, map[string]interface{}{
			"id": id, "number": number, "capacity": capacity, "section": section,
			"status": status, "current_order_id": orderID, "server": server, "seated_at": seatedAt,
		})
	}

	respondJSON(w, 200, map[string]interface{}{"tables": tables})
}

// UpdateTableStatus updates a table's status (available, occupied, reserved, cleaning)
func (h *Handler) UpdateTableStatus(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var req struct {
		TableID string `json:"table_id"`
		Status  string `json:"status"`
		Server  string `json:"server,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, 400, map[string]interface{}{"error": "Invalid request body"})
		return
	}

	var seatedAt *string
	if req.Status == "occupied" {
		now := time.Now().Format(time.RFC3339)
		seatedAt = &now
	}

	_, err := h.db.Exec(ctx,
		`UPDATE restaurant_tables SET status=?, server_name=?, seated_at=? WHERE id=?`,
		req.Status, req.Server, seatedAt, req.TableID)
	if err != nil {
		respondJSON(w, 500, map[string]interface{}{"error": "Failed to update table"})
		return
	}

	respondJSON(w, 200, map[string]interface{}{"status": req.Status, "message": "Table status updated"})
}

// ─── 7. OWNER PORTAL ────────────────────────────────────────

// OwnerDashboard returns owner-specific KPIs and reports
func (h *Handler) OwnerDashboard(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()

	// This month's key metrics
	var totalRevenue, roomRevenue, posRevenue, totalExpenses, netIncome float64
	var totalRooms, occupiedRooms, staffCount int

	_ = h.db.QueryRow(ctx, `SELECT COUNT(*) FROM rooms WHERE property_id=?`, propertyID).Scan(&totalRooms)
	_ = h.db.QueryRow(ctx, `SELECT COUNT(*) FROM rooms WHERE property_id=? AND status='occupied'`, propertyID).Scan(&occupiedRooms)
	_ = h.db.QueryRow(ctx, `SELECT COUNT(*) FROM employees WHERE property_id=? AND status='active'`, propertyID).Scan(&staffCount)
	_ = h.db.QueryRow(ctx, `SELECT COALESCE(SUM(total_revenue), 0) FROM daily_revenue WHERE property_id=? AND date >= date('now', 'start of month')`, propertyID).Scan(&totalRevenue)
	_ = h.db.QueryRow(ctx, `SELECT COALESCE(SUM(room_revenue), 0) FROM daily_revenue WHERE property_id=? AND date >= date('now', 'start of month')`, propertyID).Scan(&roomRevenue)
	_ = h.db.QueryRow(ctx, `SELECT COALESCE(SUM(pos_sales), 0) FROM daily_revenue WHERE property_id=? AND date >= date('now', 'start of month')`, propertyID).Scan(&posRevenue)
	_ = h.db.QueryRow(ctx, `SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE property_id=? AND date >= date('now', 'start of month')`, propertyID).Scan(&totalExpenses)

	netIncome = totalRevenue - totalExpenses
	occRate := 0.0
	if totalRooms > 0 {
		occRate = float64(occupiedRooms) / float64(totalRooms) * 100
	}
	adr := 0.0
	if occupiedRooms > 0 {
		adr = roomRevenue / float64(occupiedRooms)
	}

	respondJSON(w, 200, map[string]interface{}{
		"period":           time.Now().Format("January 2006"),
		"total_revenue":    totalRevenue,
		"room_revenue":     roomRevenue,
		"pos_revenue":      posRevenue,
		"total_expenses":   totalExpenses,
		"net_income":       netIncome,
		"occupancy_rate":   math.Round(occRate*10) / 10,
		"adr":              math.Round(adr*100) / 100,
		"total_rooms":      totalRooms,
		"occupied_rooms":   occupiedRooms,
		"available_rooms":  totalRooms - occupiedRooms,
		"staff_count":      staffCount,
		"revenue_per_room": math.Round(totalRevenue/float64(totalRooms)*100) / 100,
		"expense_ratio":    math.Round(totalExpenses/totalRevenue*100*10) / 10,
	})
}

// OwnerStatement generates a monthly owner statement
func (h *Handler) OwnerStatement(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()

	month := r.URL.Query().Get("month")
	if month == "" {
		month = time.Now().Format("2006-01")
	}

	// Get daily revenue breakdown
	rows, err := h.db.Query(ctx, `
		SELECT date, room_revenue, pos_sales, tax_revenue, total_revenue
		FROM daily_revenue WHERE property_id=? AND date LIKE ?
		ORDER BY date`, propertyID, month+"%")
	if err != nil {
		respondJSON(w, 200, map[string]interface{}{"statement": map[string]interface{}{}})
		return
	}
	defer rows.Close()

	dailyRev := []map[string]interface{}{}
	totalRev := 0.0
	for rows.Next() {
		var date string
		var rr, pr, tr, tot float64
		rows.Scan(&date, &rr, &pr, &tr, &tot)
		dailyRev = append(dailyRev, map[string]interface{}{
			"date": date, "room_revenue": rr, "pos_sales": pr, "tax_revenue": tr, "total": tot,
		})
		totalRev += tot
	}

	// Get expenses
	var totalExp float64
	_ = h.db.QueryRow(ctx,
		`SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE property_id=? AND date LIKE ?`,
		propertyID, month+"%").Scan(&totalExp)

	// Get payroll
	var totalPayroll float64
	_ = h.db.QueryRow(ctx,
		`SELECT COALESCE(SUM(net_pay), 0) FROM payroll_runs WHERE property_id=? AND pay_period_start LIKE ?`,
		propertyID, month+"%").Scan(&totalPayroll)

	respondJSON(w, 200, map[string]interface{}{
		"month":          month,
		"daily_revenue":  dailyRev,
		"total_revenue":  totalRev,
		"total_expenses": totalExp,
		"total_payroll":  totalPayroll,
		"net_to_owner":   totalRev - totalExp - totalPayroll,
		"management_fee": totalRev * 0.15, // 15% management fee
	})
}

// ─── 8. RECIPE COSTING & VARIANCE ───────────────────────────

// RecipeCostReport returns food cost analysis
func (h *Handler) RecipeCostReport(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()

	// Get menu items with cost data
	rows, err := h.db.Query(ctx, `
		SELECT mi.id, mi.name, mi.category, mi.price, COALESCE(mi.cost_price, 0) as cost,
			COALESCE(mi.recipe_cost, 0) as recipe_cost
		FROM menu_items mi
		WHERE mi.property_id=? AND mi.price > 0
		ORDER BY mi.category, mi.name`, propertyID)
	if err != nil {
		respondJSON(w, 200, map[string]interface{}{"items": []interface{}{}})
		return
	}
	defer rows.Close()

	items := []map[string]interface{}{}
	for rows.Next() {
		var id, name, category string
		var price, cost, recipeCost float64
		rows.Scan(&id, &name, &category, &price, &cost, &recipeCost)
		if recipeCost == 0 {
			recipeCost = cost
		}

		gpMargin := 0.0
		if price > 0 {
			gpMargin = (price - recipeCost) / price * 100
		}

		items = append(items, map[string]interface{}{
			"id": id, "name": name, "category": category,
			"selling_price": price, "recipe_cost": recipeCost,
			"food_cost_pct": math.Round(recipeCost/price*10000) / 100,
			"gp_margin": math.Round(gpMargin*100) / 100,
			"profit": math.Round((price-recipeCost)*100) / 100,
		})
	}

	// Summary
	var totalSold, totalCost float64
	_ = h.db.QueryRow(ctx, `
		SELECT COALESCE(SUM(poi.quantity * mi.price), 0),
			COALESCE(SUM(poi.quantity * COALESCE(mi.recipe_cost, mi.cost_price, 0)), 0)
		FROM pos_order_items poi
		JOIN menu_items mi ON poi.menu_item_id = mi.id
		JOIN pos_orders po ON poi.order_id = po.id
		WHERE po.property_id=? AND po.status='closed'
			AND po.created_at >= date('now', 'start of month')`,
		propertyID).Scan(&totalSold, &totalCost)

	respondJSON(w, 200, map[string]interface{}{
		"items":              items,
		"total_f&B_revenue":  totalSold,
		"total_food_cost":    totalCost,
		"avg_food_cost_pct":  math.Round(totalCost/totalSold*10000) / 100,
		"period":             time.Now().Format("January 2006"),
	})
}

// ─── 9. TIP POOL & STAFF SCORECARDS ─────────────────────────

// TipPoolReport returns tip pool distribution
func (h *Handler) TipPoolReport(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()

	// Total tips collected this month (typically included in POS as "service charge")
	var totalTips float64
	_ = h.db.QueryRow(ctx,
		`SELECT COALESCE(SUM(amount), 0) FROM folio_charges fc JOIN folios f ON fc.folio_id=f.id
		WHERE f.property_id=? AND fc.type='service_charge' AND fc.date >= date('now', 'start of month')`,
		propertyID).Scan(&totalTips)

	// Get staff with weights (front-of-house gets more)
	rows, err := h.db.Query(ctx, `
		SELECT e.id, e.first_name || ' ' || e.last_name, e.position
		FROM employees e WHERE e.property_id=? AND e.status='active'
		ORDER BY e.position`, propertyID)
	if err != nil {
		respondJSON(w, 200, map[string]interface{}{"pool_total": totalTips, "distribution": []interface{}{}})
		return
	}
	defer rows.Close()

	type StaffWeight struct {
		id, name, position string
		weight             float64
	}

	var staff []StaffWeight
	totalWeights := 0.0
	for rows.Next() {
		var s StaffWeight
		rows.Scan(&s.id, &s.name, &s.position)
		// Front-of-house: 1.5x, Kitchen: 1.25x, Other: 1.0x
		switch {
		case containsString(s.position, "Waiter") || containsString(s.position, "Receptionist") || containsString(s.position, "Bartender"):
			s.weight = 1.5
		case containsString(s.position, "Chef") || containsString(s.position, "Kitchen"):
			s.weight = 1.25
		default:
			s.weight = 1.0
		}
		totalWeights += s.weight
		staff = append(staff, s)
	}

	distribution := []map[string]interface{}{}
	for _, s := range staff {
		share := (s.weight / totalWeights) * totalTips
		distribution = append(distribution, map[string]interface{}{
			"employee_id": s.id, "name": s.name, "position": s.position,
			"weight": s.weight, "share": math.Round(share*100) / 100,
			"percent": math.Round(s.weight/totalWeights*10000) / 100,
		})
	}

	respondJSON(w, 200, map[string]interface{}{
		"pool_total":   totalTips,
		"total_staff":  len(staff),
		"distribution": distribution,
		"period":       time.Now().Format("January 2006"),
	})
}

// StaffScorecard returns individual staff performance metrics
func (h *Handler) StaffScorecard(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()

	rows, err := h.db.Query(ctx, `
		SELECT e.id, e.first_name || ' ' || e.last_name, e.position, e.department_id,
			COALESCE((SELECT COUNT(*) FROM attendance_records WHERE employee_id=e.id AND status='present' AND date >= date('now', 'start of month')), 0) as days_present,
			COALESCE((SELECT COUNT(*) FROM attendance_records WHERE employee_id=e.id AND status='late' AND date >= date('now', 'start of month')), 0) as days_late,
			COALESCE((SELECT COUNT(*) FROM attendance_records WHERE employee_id=e.id AND status='absent' AND date >= date('now', 'start of month')), 0) as days_absent
		FROM employees e WHERE e.property_id=? AND e.status='active'
		ORDER BY e.first_name`, propertyID)
	if err != nil {
		respondJSON(w, 200, map[string]interface{}{"scorecards": []interface{}{}})
		return
	}
	defer rows.Close()

	scorecards := []map[string]interface{}{}
	for rows.Next() {
		var id, name, pos, dept string
		var present, late, absent int
		rows.Scan(&id, &name, &pos, &dept, &present, &late, &absent)

		total := present + late + absent
		attendanceRate := 0.0
		if total > 0 {
			attendanceRate = float64(present) / float64(total) * 100
		}

		// Score: 100 base, -2 for late, -5 for absent
		score := 100.0 - float64(late)*2 - float64(absent)*5
		if score < 0 {
			score = 0
		}

		grade := "A"
		switch {
		case score >= 90:
			grade = "A"
		case score >= 80:
			grade = "B"
		case score >= 70:
			grade = "C"
		case score >= 60:
			grade = "D"
		default:
			grade = "F"
		}

		scorecards = append(scorecards, map[string]interface{}{
			"employee_id": id, "name": name, "position": pos, "department": dept,
			"days_present": present, "days_late": late, "days_absent": absent,
			"attendance_rate": math.Round(attendanceRate*10) / 10,
			"score": score, "grade": grade,
		})
	}

	respondJSON(w, 200, map[string]interface{}{
		"scorecards": scorecards,
		"period":     time.Now().Format("January 2006"),
	})
}

// ─── 10. EMPLOYEE TIME TRACKING ─────────────────────────────

// ClockInOut records employee clock-in or clock-out
func (h *Handler) ClockInOut(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()

	var req struct {
		EmployeeID string `json:"employee_id"`
		Action     string `json:"action"` // clock_in, clock_out
		Method     string `json:"method"` // biometric, mobile, manual
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, 400, map[string]interface{}{"error": "Invalid request body"})
		return
	}

	now := time.Now()
	today := now.Format("2006-01-02")
	timeStr := now.Format("15:04:05")

	if req.Action == "clock_in" {
		// Check if already clocked in today
		var existingID string
		err := h.db.QueryRow(ctx,
			`SELECT id FROM time_entries WHERE employee_id=? AND date=? AND clock_out IS NULL`,
			req.EmployeeID, today).Scan(&existingID)
		if err == nil {
			respondJSON(w, 400, map[string]interface{}{"error": "Already clocked in today"})
			return
		}

		_, err = h.db.Exec(ctx, `
			INSERT INTO time_entries (id, employee_id, property_id, date, clock_in, method, created_at)
			VALUES (?, ?, ?, ?, ?, ?, ?)`,
			uuid.New().String(), req.EmployeeID, propertyID, today, timeStr, req.Method, now.UTC())
		if err != nil {
			respondJSON(w, 500, map[string]interface{}{"error": "Failed to record clock-in"})
			return
		}

		respondJSON(w, 201, map[string]interface{}{
			"action": "clock_in", "time": timeStr, "message": "Clocked in successfully",
		})
	} else {
		// Clock out
		var entryID string
		err := h.db.QueryRow(ctx,
			`SELECT id FROM time_entries WHERE employee_id=? AND date=? AND clock_out IS NULL`,
			req.EmployeeID, today).Scan(&entryID)
		if err != nil {
			respondJSON(w, 400, map[string]interface{}{"error": "No active clock-in found"})
			return
		}

		_, err = h.db.Exec(ctx,
			`UPDATE time_entries SET clock_out=? WHERE id=?`, timeStr, entryID)
		if err != nil {
			respondJSON(w, 500, map[string]interface{}{"error": "Failed to record clock-out"})
			return
		}

		respondJSON(w, 200, map[string]interface{}{
			"action": "clock_out", "time": timeStr, "message": "Clocked out successfully",
		})
	}
}

// Timesheet returns timesheet for an employee
func (h *Handler) Timesheet(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()

	employeeID := r.URL.Query().Get("employee_id")
	period := r.URL.Query().Get("period")
	if period == "" {
		period = time.Now().Format("2006-01")
	}

	rows, err := h.db.Query(ctx, `
		SELECT date, clock_in, clock_out, method,
			CASE WHEN clock_out IS NOT NULL THEN
				CAST((julianday(date || ' ' || clock_out) - julianday(date || ' ' || clock_in)) * 24 AS REAL)
			ELSE 0 END as hours_worked
		FROM time_entries
		WHERE employee_id=? AND property_id=? AND date LIKE ?
		ORDER BY date`, employeeID, propertyID, period+"%")
	if err != nil {
		respondJSON(w, 200, map[string]interface{}{"entries": []interface{}{}, "total_hours": 0})
		return
	}
	defer rows.Close()

	entries := []map[string]interface{}{}
	totalHours := 0.0
	for rows.Next() {
		var date, clockIn, clockOut, method string
		var hours float64
		rows.Scan(&date, &clockIn, &clockOut, &method, &hours)
		entries = append(entries, map[string]interface{}{
			"date": date, "clock_in": clockIn, "clock_out": clockOut,
			"method": method, "hours": math.Round(hours*100) / 100,
		})
		totalHours += hours
	}

	// Calculate regular and overtime (40hrs/week = ~173.33hrs/month)
	regularHours := totalHours
	overtimeHours := 0.0
	if totalHours > 173.33 {
		regularHours = 173.33
		overtimeHours = totalHours - 173.33
	}

	respondJSON(w, 200, map[string]interface{}{
		"entries":        entries,
		"total_hours":    math.Round(totalHours*100) / 100,
		"regular_hours":  math.Round(regularHours*100) / 100,
		"overtime_hours": math.Round(overtimeHours*100) / 100,
		"period":         period,
	})
}

// ─── HELPERS ─────────────────────────────────────────────────

func containsString(s, substr string) bool {
	for i := 0; i+len(substr) <= len(s); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
