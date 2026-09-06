package handler

import (
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"time"

	"infineon/internal/response"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// ═══════════════════════════════════════════════════════════════
// GUEST 360 — Complete Guest Lifecycle View
// ═══════════════════════════════════════════════════════════════

func (h *Handler) GetGuest360(w http.ResponseWriter, r *http.Request) {
	guestID := chi.URLParam(r, "id")
	propertyID := getPropertyID(r)

	// 1. Basic guest info
	var firstName, lastName string
	var email, phone, nationality, company, notes *string
	var idType, idNumber *string
	var blacklisted int
	var createdAt time.Time
	err := h.db.QueryRow(r.Context(), `
		SELECT first_name, last_name, email, phone, nationality, company, notes,
			id_type, id_number, blacklisted, created_at
		FROM guests WHERE id = $1 AND deleted_at IS NULL
	`, guestID).Scan(&firstName, &lastName, &email, &phone, &nationality, &company, &notes,
		&idType, &idNumber, &blacklisted, &createdAt)
	if err != nil {
		response.RespondError(w, "Guest not found", http.StatusNotFound)
		return
	}

	// 2. Stay history
	stayRows, _ := h.db.Query(r.Context(), `
		SELECT id, room_number, room_type, arrival_date, departure_date, nights, total_spend, source
		FROM guest_stay_history WHERE guest_id = $1 ORDER BY arrival_date DESC LIMIT 20
	`, guestID)
	var stays []map[string]interface{}
	if stayRows != nil {
		defer stayRows.Close()
		for stayRows.Next() {
			var id, roomNum, roomType, arrival, dep string
			var nights int
			var spend float64
			var source *string
			stayRows.Scan(&id, &roomNum, &roomType, &arrival, &dep, &nights, &spend, &source)
			s := map[string]interface{}{
				"id": id, "room_number": roomNum, "room_type": roomType,
				"arrival_date": arrival, "departure_date": dep, "nights": nights, "total_spend": spend,
			}
			if source != nil {
				s["source"] = *source
			}
			stays = append(stays, s)
		}
	}
	if stays == nil {
		stays = []map[string]interface{}{}
	}

	// 3. Current reservation
	var currRes *string
	var currRoom, currStatus, currArrival, currDeparture *string
	h.db.QueryRow(r.Context(), `
		SELECT r.id, rm.number, r.status, r.arrival_date, r.departure_date
		FROM reservations r
		LEFT JOIN rooms rm ON rm.id = r.room_id
		WHERE r.guest_id = $1 AND r.property_id = $2
			AND r.status IN ('confirmed','checked_in','in_house')
			AND r.deleted_at IS NULL
		ORDER BY r.arrival_date DESC LIMIT 1
	`, guestID, propertyID).Scan(&currRes, &currRoom, &currStatus, &currArrival, &currDeparture)

	// 4. Total spend
	var totalNights int
	var totalSpend float64
	h.db.QueryRow(r.Context(), `
		SELECT COALESCE(SUM(nights),0), COALESCE(SUM(total_spend),0)
		FROM guest_stay_history WHERE guest_id = $1
	`, guestID).Scan(&totalNights, &totalSpend)

	// 5. Preferences
	prefRows, _ := h.db.Query(r.Context(), `
		SELECT preference_type, preference_value FROM guest_preferences WHERE guest_id = $1
	`, guestID)
	var preferences []map[string]string
	if prefRows != nil {
		defer prefRows.Close()
		for prefRows.Next() {
			var pType, pValue string
			prefRows.Scan(&pType, &pValue)
			preferences = append(preferences, map[string]string{"type": pType, "value": pValue})
		}
	}
	if preferences == nil {
		preferences = []map[string]string{}
	}

	// 6. Service requests
	reqRows, _ := h.db.Query(r.Context(), `
		SELECT id, request_type, description, priority, status, department, created_at
		FROM guest_service_requests WHERE guest_id = $1 ORDER BY created_at DESC LIMIT 10
	`, guestID)
	var requests []map[string]interface{}
	if reqRows != nil {
		defer reqRows.Close()
		for reqRows.Next() {
			var id, reqType, desc, pri, stat, dept string
			var createdAt time.Time
			reqRows.Scan(&id, &reqType, &desc, &pri, &stat, &dept, &createdAt)
			requests = append(requests, map[string]interface{}{
				"id": id, "type": reqType, "description": desc, "priority": pri,
				"status": stat, "department": dept, "created_at": createdAt.Format(time.RFC3339),
			})
		}
	}
	if requests == nil {
		requests = []map[string]interface{}{}
	}

	// 7. Interactions timeline
	intRows, _ := h.db.Query(r.Context(), `
		SELECT id, interaction_type, channel, subject, message, staff_name, created_at
		FROM guest_interactions WHERE guest_id = $1 ORDER BY created_at DESC LIMIT 15
	`, guestID)
	var interactions []map[string]interface{}
	if intRows != nil {
		defer intRows.Close()
		for intRows.Next() {
			var id, intType, channel, subject, message, staff string
			var createdAt time.Time
			intRows.Scan(&id, &intType, &channel, &subject, &message, &staff, &createdAt)
			interactions = append(interactions, map[string]interface{}{
				"id": id, "type": intType, "channel": channel, "subject": subject,
				"message": message, "staff": staff, "created_at": createdAt.Format(time.RFC3339),
			})
		}
	}
	if interactions == nil {
		interactions = []map[string]interface{}{}
	}

	// 8. Loyalty info
	var loyaltyTier *string
	var pointsBalance int
	h.db.QueryRow(r.Context(), `
		SELECT lt.name, la.points_balance
		FROM loyalty_accounts la
		JOIN loyalty_tiers lt ON lt.id = la.tier_id
		WHERE la.guest_id = $1 AND la.status = 'active'
	`, guestID).Scan(&loyaltyTier, &pointsBalance)

	// 9. Complaints count
	var complaints int
	h.db.QueryRow(r.Context(), `
		SELECT COUNT(*) FROM guest_service_requests
		WHERE guest_id = $1 AND request_type IN ('complaint','maintenance') AND status != 'resolved'
	`, guestID).Scan(&complaints)

	result := map[string]interface{}{
		"guest": map[string]interface{}{
			"id": guestID, "first_name": firstName, "last_name": lastName,
			"full_name": firstName + " " + lastName,
			"email": email, "phone": phone, "nationality": nationality,
			"company": company, "notes": notes,
			"id_type": idType, "id_number": idNumber,
			"blacklisted": blacklisted == 1,
			"created_at": createdAt.Format(time.RFC3339),
		},
		"summary": map[string]interface{}{
			"total_stays":     len(stays),
			"total_nights":    totalNights,
			"total_spend":     totalSpend,
			"loyalty_tier":    loyaltyTier,
			"points_balance":  pointsBalance,
			"open_complaints": complaints,
		},
		"current_stay": map[string]interface{}{
			"reservation_id": currRes,
			"room":           currRoom,
			"status":         currStatus,
			"arrival":        currArrival,
			"departure":      currDeparture,
		},
		"stay_history":     stays,
		"preferences":      preferences,
		"service_requests": requests,
		"interactions":     interactions,
	}
	response.RespondSuccess(w, result, "Guest 360 profile retrieved")
}

// ═══════════════════════════════════════════════════════════════
// TRACES / TASKS
// ═══════════════════════════════════════════════════════════════

func (h *Handler) ListTraces(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	status := r.URL.Query().Get("status")
	dept := r.URL.Query().Get("department")

	query := `SELECT t.id, t.trace_type, t.title, t.description, t.department,
		t.priority, t.status, t.assigned_to, t.due_date, t.due_time,
		COALESCE(g.first_name || ' ' || g.last_name, '') as guest_name,
		COALESCE(rm.number, '') as room_number,
		t.created_at, t.completed_at
		FROM traces t
		LEFT JOIN guests g ON g.id = t.guest_id
		LEFT JOIN rooms rm ON rm.id = t.room_id
		WHERE t.property_id = $1`
	args := []interface{}{propertyID}
	argIdx := 2

	if status != "" {
		query += ` AND t.status = $` + strconv.Itoa(argIdx)
		args = append(args, status)
		argIdx++
	}
	if dept != "" {
		query += ` AND t.department = $` + strconv.Itoa(argIdx)
		args = append(args, dept)
		argIdx++
	}
	query += ` ORDER BY CASE t.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END, t.due_date ASC LIMIT 100`

	rows, err := h.db.Query(r.Context(), query, args...)
	if err != nil {
		response.RespondError(w, "Failed to query traces", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var traces []map[string]interface{}
	for rows.Next() {
		var id, traceType, title, department, priority, status string
		var description, assignedTo, dueDate, dueTime, guestName, roomNumber *string
		var createdAt time.Time
		var completedAt *time.Time
		rows.Scan(&id, &traceType, &title, &description, &department,
			&priority, &status, &assignedTo, &dueDate, &dueTime,
			&guestName, &roomNumber, &createdAt, &completedAt)
		t := map[string]interface{}{
			"id": id, "type": traceType, "title": title, "department": department,
			"priority": priority, "status": status, "created_at": createdAt.Format(time.RFC3339),
		}
		if description != nil {
			t["description"] = *description
		}
		if assignedTo != nil {
			t["assigned_to"] = *assignedTo
		}
		if dueDate != nil {
			t["due_date"] = *dueDate
		}
		if dueTime != nil {
			t["due_time"] = *dueTime
		}
		if guestName != nil && *guestName != "" {
			t["guest_name"] = *guestName
		}
		if roomNumber != nil && *roomNumber != "" {
			t["room_number"] = *roomNumber
		}
		if completedAt != nil {
			t["completed_at"] = completedAt.Format(time.RFC3339)
		}
		traces = append(traces, t)
	}
	if traces == nil {
		traces = []map[string]interface{}{}
	}
	response.RespondSuccess(w, traces, "Traces retrieved")
}

func (h *Handler) CreateTrace(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	var req struct {
		GuestID       *string `json:"guest_id"`
		ReservationID *string `json:"reservation_id"`
		RoomID        *string `json:"room_id"`
		TraceType     string  `json:"trace_type"`
		Title         string  `json:"title"`
		Description   string  `json:"description"`
		Department    string  `json:"department"`
		Priority      string  `json:"priority"`
		AssignedTo    string  `json:"assigned_to"`
		DueDate       string  `json:"due_date"`
		DueTime       string  `json:"due_time"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.RespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.Title == "" || req.Department == "" {
		response.RespondError(w, "Title and department are required", http.StatusBadRequest)
		return
	}
	if req.Priority == "" {
		req.Priority = "normal"
	}

	id := uuid.New().String()
	_, err := h.db.Exec(r.Context(), `
		INSERT INTO traces (id, property_id, guest_id, reservation_id, room_id,
			trace_type, title, description, department, priority, assigned_to,
			due_date, due_time, created_by)
		VALUES ($1, $2, NULLIF($3,''), NULLIF($4,''), NULLIF($5,''),
			$6, $7, NULLIF($8,''), $9, $10, NULLIF($11,''),
			NULLIF($12,''), NULLIF($13,''), 'System')
	`, id, propertyID, derefStr(req.GuestID), derefStr(req.ReservationID), derefStr(req.RoomID),
		req.TraceType, req.Title, req.Description, req.Department, req.Priority, req.AssignedTo,
		req.DueDate, req.DueTime)
	if err != nil {
		response.RespondError(w, "Failed to create trace", http.StatusInternalServerError)
		return
	}
	response.RespondSuccess(w, map[string]interface{}{"id": id}, "Trace created", http.StatusCreated)
}

func (h *Handler) UpdateTraceStatus(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req struct {
		Status string `json:"status"`
		Note   string `json:"note"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.RespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.Status == "" {
		req.Status = "completed"
	}

	updateSQL := `UPDATE traces SET status = $2, updated_at = CURRENT_TIMESTAMP`
	if req.Status == "completed" {
		updateSQL += `, completed_at = CURRENT_TIMESTAMP, completed_by = 'System'`
	} else if req.Status == "verified" {
		updateSQL += `, verified_at = CURRENT_TIMESTAMP, verified_by = 'System'`
	}
	updateSQL += ` WHERE id = $1`

	_, err := h.db.Exec(r.Context(), updateSQL, id, req.Status)
	if err != nil {
		response.RespondError(w, "Failed to update trace", http.StatusInternalServerError)
		return
	}

	// Add note if provided
	if req.Note != "" {
		noteID := uuid.New().String()
		h.db.Exec(r.Context(), `
			INSERT INTO trace_notes (id, trace_id, note, author) VALUES ($1, $2, $3, 'System')
		`, noteID, id, req.Note)
	}

	response.RespondSuccess(w, nil, fmt.Sprintf("Trace %s", req.Status))
}

// ═══════════════════════════════════════════════════════════════
// INTELLIGENT ROOM ASSIGNMENT
// ═══════════════════════════════════════════════════════════════

type roomCandidate struct {
	RoomID       string
	RoomNumber   string
	RoomType     string
	Floor        int
	Status       string
	HKStatus     string
	Score        float64
	Reasons      []string
	IsUpgrade    bool
}

func (h *Handler) SuggestRoomAssignment(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	reservationID := chi.URLParam(r, "id")

	// 1. Get reservation details
	var guestID, roomID *string
	var adults, children int
	var isVIP int
	var specialRequests *string
	err := h.db.QueryRow(r.Context(), `
		SELECT guest_id, room_id, adults, children, is_vip, special_requests
		FROM reservations WHERE id = $1 AND property_id = $2 AND deleted_at IS NULL
	`, reservationID, propertyID).Scan(&guestID, &roomID, &adults, &children, &isVIP, &specialRequests)
	if err != nil {
		response.RespondError(w, "Reservation not found", http.StatusNotFound)
		return
	}
	if guestID == nil {
		response.RespondError(w, "No guest associated", http.StatusBadRequest)
		return
	}

	// Get room type from assigned room or reservation's rate plan
	var roomTypeID string
	if roomID != nil && *roomID != "" {
		h.db.QueryRow(r.Context(), `SELECT room_type_id FROM rooms WHERE id = $1`, *roomID).Scan(&roomTypeID)
	}
	if roomTypeID == "" {
		response.RespondError(w, "Cannot determine room type for assignment", http.StatusBadRequest)
		return
	}

	// 2. Get assignment rules
	var wPref, wReady, wType, wFloor, wHK, wUpgrade float64
	h.db.QueryRow(r.Context(), `
		SELECT weight_guest_preference, weight_room_readiness, weight_room_type,
			weight_floor_preference, weight_housekeeping, weight_upgrade
		FROM room_assignment_rules WHERE property_id = $1 AND is_active = 1
		ORDER BY created_at ASC LIMIT 1
	`, propertyID).Scan(&wPref, &wReady, &wType, &wFloor, &wHK, &wUpgrade)

	// Default weights if none configured
	if wPref+wReady+wType+wFloor+wHK+wUpgrade == 0 {
		wPref, wReady, wType, wFloor, wHK, wUpgrade = 0.30, 0.20, 0.20, 0.10, 0.10, 0.10
	}

	// 3. Get guest preferences
	var prefFloor, prefBed, prefView *string
	if guestID != nil {
		h.db.QueryRow(r.Context(), `
			SELECT preference_value FROM guest_preferences
			WHERE guest_id = $1 AND preference_type = 'floor'
		`, *guestID).Scan(&prefFloor)
		h.db.QueryRow(r.Context(), `
			SELECT preference_value FROM guest_preferences
			WHERE guest_id = $1 AND preference_type = 'bed_type'
		`, *guestID).Scan(&prefBed)
		h.db.QueryRow(r.Context(), `
			SELECT preference_value FROM guest_preferences
			WHERE guest_id = $1 AND preference_type = 'view'
		`, *guestID).Scan(&prefView)
	}

	// 4. Get available rooms matching type
	rows, err := h.db.Query(r.Context(), `
		SELECT r.id, r.number, rt.name as room_type,
			COALESCE(f.level, 0) as floor,
			r.status, r.housekeeping_status
		FROM rooms r
		JOIN room_types rt ON rt.id = r.room_type_id
		LEFT JOIN floors f ON f.id = r.floor_id
		WHERE r.property_id = $1 AND r.room_type_id = $2
			AND r.status LIKE 'vacant%'
			AND r.deleted_at IS NULL
		ORDER BY r.number
	`, propertyID, roomTypeID)
	if err != nil {
		response.RespondError(w, "Failed to query rooms", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var candidates []map[string]interface{}
	for rows.Next() {
		var rmID, rmNum, rmType string
		var floor int
		var rmStatus, hkStatus string
		rows.Scan(&rmID, &rmNum, &rmType, &floor, &rmStatus, &hkStatus)

		score := 0.0
		reasons := []string{}

		// Room type match: always 100% since we filter by type
		score += wType * 100
		reasons = append(reasons, "Room type matched")

		// Room readiness (clean = 100, dirty = 0)
		if hkStatus == "clean" {
			score += wReady * 100
			reasons = append(reasons, "Room ready")
		}

		// Guest floor preference
		if prefFloor != nil && *prefFloor != "" {
			prefFloorNum, _ := strconv.Atoi(*prefFloor)
			if prefFloorNum > 0 {
				if floor == prefFloorNum {
					score += wPref * 100
					reasons = append(reasons, fmt.Sprintf("Floor %d preference matched", floor))
				} else {
					score += wPref * 30
				}
			}
		} else {
			score += wPref * 50 // No preference = neutral
		}

		// Housekeeping optimization (lower floor = easier access for HK)
		if floor <= 3 {
			score += wHK * 80
		} else {
			score += wHK * 60
		}

		// Upgrade opportunity (assign slightly better room if available)
		score += wUpgrade * 70 // Neutral by default

		// VIP bonus for higher floors
		if isVIP == 1 && floor >= 4 {
			score += 5
			reasons = append(reasons, "VIP floor bonus")
		}

		candidate := map[string]interface{}{
			"room_id":     rmID,
			"room_number": rmNum,
			"room_type":   rmType,
			"floor":       floor,
			"status":      rmStatus,
			"hk_status":   hkStatus,
			"score":       math.Round(score*10) / 10,
			"reasons":     reasons,
			"is_upgrade":  false,
		}
		candidates = append(candidates, candidate)
	}
	if candidates == nil {
		candidates = []map[string]interface{}{}
	}

	// Also check upgrade opportunities
	upgradeRows, _ := h.db.Query(r.Context(), `
		SELECT r.id, r.number, rt.name as room_type,
			COALESCE(f.level, 0) as floor,
			r.status, r.housekeeping_status
		FROM rooms r
		JOIN room_types rt ON rt.id = r.room_type_id
		LEFT JOIN floors f ON f.id = r.floor_id
		WHERE r.property_id = $1
			AND rt.sort_order > (SELECT rt2.sort_order FROM room_types rt2 WHERE rt2.id = $2)
			AND r.status LIKE 'vacant%'
			AND r.deleted_at IS NULL
		ORDER BY rt.sort_order, r.number
		LIMIT 5
	`, propertyID, roomTypeID)
	if upgradeRows != nil {
		defer upgradeRows.Close()
		for upgradeRows.Next() {
			var rmID, rmNum, rmType string
			var floor int
			var rmStatus, hkStatus string
			upgradeRows.Scan(&rmID, &rmNum, &rmType, &floor, &rmStatus, &hkStatus)

			score := 60.0 + wUpgrade*40
			reasons := []string{"Upgrade opportunity", "Higher room category available"}

			candidates = append(candidates, map[string]interface{}{
				"room_id":     rmID,
				"room_number": rmNum,
				"room_type":   rmType,
				"floor":       floor,
				"status":      rmStatus,
				"hk_status":   hkStatus,
				"score":       math.Round(score*10) / 10,
				"reasons":     reasons,
				"is_upgrade":  true,
			})
		}
	}

	response.RespondSuccess(w, map[string]interface{}{
		"reservation_id": reservationID,
		"weights": map[string]interface{}{
			"guest_preference": wPref,
			"room_readiness":   wReady,
			"room_type":        wType,
			"floor_preference": wFloor,
			"housekeeping":     wHK,
			"upgrade":          wUpgrade,
		},
		"candidates": candidates,
	}, "Room assignment suggestions retrieved")
}

func (h *Handler) AssignRoom(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	var req struct {
		ReservationID string `json:"reservation_id"`
		RoomID        string `json:"room_id"`
		IsUpgrade     bool   `json:"is_upgrade"`
		IsManual      bool   `json:"is_manual"`
		Score         float64 `json:"score"`
		Reasons       string  `json:"reasons"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.RespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Update reservation with room
	_, err := h.db.Exec(r.Context(), `
		UPDATE reservations SET room_id = $2, updated_at = CURRENT_TIMESTAMP
		WHERE id = $1 AND property_id = $3 AND deleted_at IS NULL
	`, req.ReservationID, req.RoomID, propertyID)
	if err != nil {
		response.RespondError(w, "Failed to update reservation", http.StatusInternalServerError)
		return
	}

	// Update room status to reserved
	h.db.Exec(r.Context(), `
		UPDATE rooms SET status = 'reserved' WHERE id = $1
	`, req.RoomID)

	// Record assignment
	assignID := uuid.New().String()
	h.db.Exec(r.Context(), `
		INSERT INTO room_assignments (id, reservation_id, room_id, property_id, assigned_by,
			assignment_score, assignment_reasons, is_upgrade, is_manual)
		VALUES ($1, $2, $3, $4, 'System', $5, NULLIF($6,''), $7, $8)
	`, assignID, req.ReservationID, req.RoomID, propertyID, req.Score, req.Reasons, req.IsUpgrade, req.IsManual)

	// Remove from queue if present
	h.db.Exec(r.Context(), `
		UPDATE room_queue SET status = 'assigned'
		WHERE reservation_id = $1 AND property_id = $2 AND status = 'waiting'
	`, req.ReservationID, propertyID)

	var roomNumber string
	h.db.QueryRow(r.Context(), `SELECT number FROM rooms WHERE id = $1`, req.RoomID).Scan(&roomNumber)

	response.RespondSuccess(w, map[string]interface{}{
		"assignment_id": assignID,
		"room_number":   roomNumber,
	}, "Room assigned successfully")
}

// ═══════════════════════════════════════════════════════════════
// ROOM QUEUE
// ═══════════════════════════════════════════════════════════════

func (h *Handler) ListRoomQueue(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)

	rows, err := h.db.Query(r.Context(), `
		SELECT rq.id, rq.reservation_id, rq.priority, rq.status, rq.estimated_ready, rq.notes,
			g.first_name || ' ' || g.last_name as guest_name,
			rm.number as room_number,
			r.arrival_date, r.departure_date, r.status as res_status
		FROM room_queue rq
		JOIN reservations r ON r.id = rq.reservation_id
		JOIN guests g ON g.id = r.guest_id
		LEFT JOIN rooms rm ON rm.id = r.room_id
		WHERE rq.property_id = $1 AND rq.status = 'waiting'
		ORDER BY rq.priority DESC, rq.created_at ASC
	`, propertyID)
	if err != nil {
		response.RespondError(w, "Failed to query room queue", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var queue []map[string]interface{}
	for rows.Next() {
		var id, resID, status string
		var priority int
		var estReady, notes, guestName, roomNum, arrival, departure, resStatus *string
		rows.Scan(&id, &resID, &priority, &status, &estReady, &notes,
			&guestName, &roomNum, &arrival, &departure, &resStatus)
		q := map[string]interface{}{
			"id": id, "reservation_id": resID, "priority": priority, "status": status,
		}
		if estReady != nil {
			q["estimated_ready"] = *estReady
		}
		if guestName != nil {
			q["guest_name"] = *guestName
		}
		if roomNum != nil {
			q["room_number"] = *roomNum
		}
		if arrival != nil {
			q["arrival_date"] = *arrival
		}
		if resStatus != nil {
			q["reservation_status"] = *resStatus
		}
		queue = append(queue, q)
	}
	if queue == nil {
		queue = []map[string]interface{}{}
	}
	response.RespondSuccess(w, queue, "Room queue retrieved")
}

func (h *Handler) AddToRoomQueue(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	var req struct {
		ReservationID string `json:"reservation_id"`
		Priority      int    `json:"priority"`
		Notes         string `json:"notes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.RespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	id := uuid.New().String()
	_, err := h.db.Exec(r.Context(), `
		INSERT INTO room_queue (id, reservation_id, property_id, priority, notes)
		VALUES ($1, $2, $3, $4, NULLIF($5,''))
	`, id, req.ReservationID, propertyID, req.Priority, req.Notes)
	if err != nil {
		response.RespondError(w, "Failed to add to queue", http.StatusInternalServerError)
		return
	}
	response.RespondSuccess(w, map[string]interface{}{"id": id}, "Added to room queue", http.StatusCreated)
}

// ═══════════════════════════════════════════════════════════════
// FRONT DESK INTELLIGENCE DASHBOARD
// ═══════════════════════════════════════════════════════════════

func (h *Handler) FrontDeskIntelligence(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	today := time.Now().Format("2006-01-02")

	// 1. Arrivals today
	var arrivalsToday int
	h.db.QueryRow(r.Context(), `
		SELECT COUNT(*) FROM reservations
		WHERE property_id = $1 AND arrival_date = $2 AND status IN ('confirmed','tentative') AND deleted_at IS NULL
	`, propertyID, today).Scan(&arrivalsToday)

	// 2. Departures today
	var departuresToday int
	h.db.QueryRow(r.Context(), `
		SELECT COUNT(*) FROM reservations
		WHERE property_id = $1 AND departure_date = $2 AND status IN ('checked_in','in_house') AND deleted_at IS NULL
	`, propertyID, today).Scan(&departuresToday)

	// 3. VIP arrivals today
	var vipArrivals int
	h.db.QueryRow(r.Context(), `
		SELECT COUNT(*) FROM reservations
		WHERE property_id = $1 AND arrival_date = $2 AND is_vip = 1 AND status IN ('confirmed','tentative') AND deleted_at IS NULL
	`, propertyID, today).Scan(&vipArrivals)

	// 4. Room readiness
	var vacantClean, vacantDirty, occupiedClean, occupiedDirty, outOfOrder, reserved int
	h.db.QueryRow(r.Context(), `SELECT COUNT(*) FROM rooms WHERE property_id = $1 AND status = 'vacant_clean' AND deleted_at IS NULL`, propertyID).Scan(&vacantClean)
	h.db.QueryRow(r.Context(), `SELECT COUNT(*) FROM rooms WHERE property_id = $1 AND status = 'vacant_dirty' AND deleted_at IS NULL`, propertyID).Scan(&vacantDirty)
	h.db.QueryRow(r.Context(), `SELECT COUNT(*) FROM rooms WHERE property_id = $1 AND status = 'occupied_clean' AND deleted_at IS NULL`, propertyID).Scan(&occupiedClean)
	h.db.QueryRow(r.Context(), `SELECT COUNT(*) FROM rooms WHERE property_id = $1 AND status = 'occupied_dirty' AND deleted_at IS NULL`, propertyID).Scan(&occupiedDirty)
	h.db.QueryRow(r.Context(), `SELECT COUNT(*) FROM rooms WHERE property_id = $1 AND status = 'out_of_order' AND deleted_at IS NULL`, propertyID).Scan(&outOfOrder)
	h.db.QueryRow(r.Context(), `SELECT COUNT(*) FROM rooms WHERE property_id = $1 AND status = 'reserved' AND deleted_at IS NULL`, propertyID).Scan(&reserved)

	// 5. Open traces
	var openTraces int
	h.db.QueryRow(r.Context(), `
		SELECT COUNT(*) FROM traces WHERE property_id = $1 AND status IN ('pending','in_progress')
	`, propertyID).Scan(&openTraces)

	// 6. Urgent traces
	var urgentTraces int
	h.db.QueryRow(r.Context(), `
		SELECT COUNT(*) FROM traces WHERE property_id = $1 AND status IN ('pending','in_progress') AND priority = 'urgent'
	`, propertyID).Scan(&urgentTraces)

	// 7. Room queue count
	var queueCount int
	h.db.QueryRow(r.Context(), `
		SELECT COUNT(*) FROM room_queue WHERE property_id = $1 AND status = 'waiting'
	`, propertyID).Scan(&queueCount)

	// 8. Pending service requests
	var pendingRequests int
	h.db.QueryRow(r.Context(), `
		SELECT COUNT(*) FROM guest_service_requests WHERE property_id = $1 AND status IN ('open','pending')
	`, propertyID).Scan(&pendingRequests)

	// 9. Overdue checkouts
	var overdueCheckouts int
	h.db.QueryRow(r.Context(), `
		SELECT COUNT(*) FROM reservations
		WHERE property_id = $1 AND departure_date < $2 AND status IN ('checked_in','in_house') AND deleted_at IS NULL
	`, propertyID, today).Scan(&overdueCheckouts)

	response.RespondSuccess(w, map[string]interface{}{
		"date": today,
		"arrivals_today":     arrivalsToday,
		"departures_today":   departuresToday,
		"vip_arrivals":       vipArrivals,
		"room_readiness": map[string]interface{}{
			"vacant_clean":   vacantClean,
			"vacant_dirty":   vacantDirty,
			"occupied_clean": occupiedClean,
			"occupied_dirty": occupiedDirty,
			"out_of_order":   outOfOrder,
			"reserved":       reserved,
		},
		"open_traces":        openTraces,
		"urgent_traces":      urgentTraces,
		"room_queue":         queueCount,
		"pending_requests":   pendingRequests,
		"overdue_checkouts":  overdueCheckouts,
	}, "Front desk intelligence retrieved")
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

func derefStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}





