package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"

	"infineon/internal/response"
)

// ── Loyalty Tiers ──

func (h *Handler) ListLoyaltyTiers(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	if propertyID == "" {
		propertyID = "00000000-0000-0000-0000-000000000001"
	}

	rows, err := h.db.Query(context.Background(), `
		SELECT id, name, code, min_points, discount_percent, benefits, status
		FROM loyalty_tiers WHERE property_id = $1 ORDER BY min_points ASC
	`, propertyID)
	if err != nil {
		response.RespondError(w, "Failed to query loyalty tiers", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var tiers []map[string]interface{}
	for rows.Next() {
		var id, name, code, benefits, status string
		var minPoints int
		var discountPct float64
		rows.Scan(&id, &name, &code, &minPoints, &discountPct, &benefits, &status)
		tiers = append(tiers, map[string]interface{}{
			"id": id, "name": name, "code": code,
			"min_points": minPoints, "discount_percent": discountPct,
			"benefits": benefits, "status": status,
		})
	}
	if tiers == nil {
		tiers = []map[string]interface{}{}
	}
	response.RespondSuccess(w, tiers, "Loyalty tiers retrieved successfully")
}

// ── Loyalty Members ──

func (h *Handler) ListLoyaltyMembers(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	if propertyID == "" {
		propertyID = "00000000-0000-0000-0000-000000000001"
	}
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	perPage, _ := strconv.Atoi(r.URL.Query().Get("per_page"))
	if perPage < 1 || perPage > 100 {
		perPage = 50
	}

	tierFilter := r.URL.Query().Get("tier")
	query := `SELECT lm.id, lm.member_number, g.first_name || ' ' || g.last_name as guest_name,
		g.email, lt.name as tier_name, lm.total_points, lm.lifetime_points, lm.enrolled_at
		FROM loyalty_members lm
		JOIN guests g ON lm.guest_id = g.id
		LEFT JOIN loyalty_tiers lt ON lm.tier_id = lt.id
		WHERE lm.property_id = $1`
	args := []interface{}{propertyID}
	argIdx := 2

	if tierFilter != "" {
		query += ` AND lt.name = $` + strconv.Itoa(argIdx)
		args = append(args, tierFilter)
		argIdx++
	}

	var total int
	h.db.QueryRow(context.Background(), `SELECT COUNT(*) FROM loyalty_members WHERE property_id = $1`, propertyID).Scan(&total)

	query += ` ORDER BY lm.total_points DESC LIMIT $` + strconv.Itoa(argIdx) + ` OFFSET $` + strconv.Itoa(argIdx+1)
	args = append(args, perPage, (page-1)*perPage)

	rows, err := h.db.Query(context.Background(), query, args...)
	if err != nil {
		response.RespondError(w, "Failed to query loyalty members", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var members []map[string]interface{}
	for rows.Next() {
		var id, memberNum, guestName, email, tierName, enrolledAt string
		var totalPts, lifetimePts int
		rows.Scan(&id, &memberNum, &guestName, &email, &tierName, &totalPts, &lifetimePts, &enrolledAt)
		members = append(members, map[string]interface{}{
			"id": id, "member_number": memberNum, "guest_name": guestName,
			"email": email, "tier_name": tierName,
			"total_points": totalPts, "lifetime_points": lifetimePts, "enrolled_at": enrolledAt,
		})
	}
	if members == nil {
		members = []map[string]interface{}{}
	}
	response.RespondPaginated(w, members, int64(total), page, perPage)
}

func (h *Handler) EnrollLoyaltyMember(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	if propertyID == "" {
		propertyID = "00000000-0000-0000-0000-000000000001"
	}

	var req struct {
		GuestID string `json:"guest_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.RespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.GuestID == "" {
		response.RespondError(w, "Guest ID is required", http.StatusBadRequest)
		return
	}

	id := generateID()
	memberNum := "LM-" + id[:8]

	// Get the default tier
	var tierID string
	h.db.QueryRow(context.Background(), `
		SELECT id FROM loyalty_tiers WHERE property_id = $1 ORDER BY min_points ASC LIMIT 1
	`, propertyID).Scan(&tierID)

	_, err := h.db.Exec(context.Background(), `
		INSERT INTO loyalty_members (id, property_id, guest_id, member_number, tier_id, total_points, lifetime_points)
		VALUES ($1, $2, $3, $4, $5, 0, 0)
	`, id, propertyID, req.GuestID, memberNum, tierID)
	if err != nil {
		response.RespondError(w, "Failed to enroll member (may already be enrolled)", http.StatusConflict)
		return
	}

	auditLog(h, r, "loyalty_members", "create", id, "Enrolled member: "+memberNum)
	response.RespondSuccess(w, map[string]interface{}{
		"id": id, "member_number": memberNum,
	}, "Loyalty member enrolled successfully")
}

func (h *Handler) AddLoyaltyPoints(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	memberID := r.PathValue("id")

	var req struct {
		Points      int    `json:"points"`
		Description string `json:"description"`
		Type        string `json:"type"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.RespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.Points <= 0 {
		response.RespondError(w, "Points must be positive", http.StatusBadRequest)
		return
	}
	if req.Type == "" {
		req.Type = "earn"
	}

	// Add points
	_, err := h.db.Exec(context.Background(), `
		UPDATE loyalty_members
		SET total_points = total_points + $1, lifetime_points = lifetime_points + $1, last_activity = CURRENT_TIMESTAMP
		WHERE id = $2 AND property_id = $3
	`, req.Points, memberID, propertyID)
	if err != nil {
		response.RespondError(w, "Failed to add points", http.StatusInternalServerError)
		return
	}

	// Record transaction
	txID := generateID()
	h.db.Exec(context.Background(), `
		INSERT INTO loyalty_transactions (id, member_id, type, points, description)
		VALUES ($1, $2, $3, $4, $5)
	`, txID, memberID, req.Type, req.Points, req.Description)

	// Check for tier upgrade
	var totalPts int
	h.db.QueryRow(context.Background(), `
		SELECT total_points FROM loyalty_members WHERE id = $1
	`, memberID).Scan(&totalPts)

	var newTierID string
	h.db.QueryRow(context.Background(), `
		SELECT id FROM loyalty_tiers WHERE property_id = $1 AND min_points <= $2
		ORDER BY min_points DESC LIMIT 1
	`, propertyID, totalPts).Scan(&newTierID)

	if newTierID != "" {
		h.db.Exec(context.Background(), `
			UPDATE loyalty_members SET tier_id = $1 WHERE id = $2
		`, newTierID, memberID)
	}

	auditLog(h, r, "loyalty_transactions", "create", txID, "Added "+strconv.Itoa(req.Points)+" points")
	response.RespondSuccess(w, map[string]interface{}{
		"new_total": totalPts, "points_added": req.Points,
	}, "Loyalty points added successfully")
}

// ── Loyalty Dashboard ──

func (h *Handler) LoyaltyDashboard(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	if propertyID == "" {
		propertyID = "00000000-0000-0000-0000-000000000001"
	}
	ctx := context.Background()

	var totalMembers int
	h.db.QueryRow(ctx, `SELECT COUNT(*) FROM loyalty_members WHERE property_id = $1`, propertyID).Scan(&totalMembers)

	var totalPointsIssued int
	h.db.QueryRow(ctx, `SELECT COALESCE(SUM(lifetime_points), 0) FROM loyalty_members WHERE property_id = $1`, propertyID).Scan(&totalPointsIssued)

	// Tier breakdown
	tierRows, _ := h.db.Query(ctx, `
		SELECT lt.name, COUNT(lm.id) as member_count, COALESCE(SUM(lm.total_points), 0) as total_pts
		FROM loyalty_tiers lt
		LEFT JOIN loyalty_members lm ON lm.tier_id = lt.id AND lm.property_id = $1
		WHERE lt.property_id = $1
		GROUP BY lt.id, lt.name ORDER BY lt.min_points
	`, propertyID)
	defer tierRows.Close()

	type TierBreakdown struct {
		Name    string `json:"name"`
		Members int    `json:"members"`
		Points  int    `json:"points"`
	}
	var tierBreakdown []TierBreakdown
	for tierRows.Next() {
		var tb TierBreakdown
		tierRows.Scan(&tb.Name, &tb.Members, &tb.Points)
		tierBreakdown = append(tierBreakdown, tb)
	}

	// Recent transactions
	txRows, _ := h.db.Query(ctx, `
		SELECT lt.type, lt.points, lt.description, lt.created_at
		FROM loyalty_transactions lt
		JOIN loyalty_members lm ON lt.member_id = lm.id
		WHERE lm.property_id = $1
		ORDER BY lt.created_at DESC LIMIT 10
	`, propertyID)
	defer txRows.Close()

	var recentTx []map[string]interface{}
	for txRows.Next() {
		var txType, description, createdAt string
		var points int
		txRows.Scan(&txType, &points, &description, &createdAt)
		recentTx = append(recentTx, map[string]interface{}{
			"type": txType, "points": points, "description": description, "created_at": createdAt,
		})
	}
	if recentTx == nil {
		recentTx = []map[string]interface{}{}
	}

	response.RespondSuccess(w, map[string]interface{}{
		"total_members": totalMembers,
		"total_points_issued": totalPointsIssued,
		"tier_breakdown": tierBreakdown,
		"recent_transactions": recentTx,
	}, "Loyalty dashboard retrieved successfully")
}
