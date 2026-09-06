package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"

	"infineon/internal/response"
)

// ── Group Bookings (Opera-style group management) ──

func (h *Handler) ListGroupBookings(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	if propertyID == "" {
		propertyID = "00000000-0000-0000-0000-000000000001"
	}
	ctx := context.Background()

	statusFilter := r.URL.Query().Get("status")
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	perPage, _ := strconv.Atoi(r.URL.Query().Get("per_page"))
	if perPage < 1 || perPage > 100 {
		perPage = 50
	}

	query := `SELECT id, group_name, company, contact_name, contact_email, 
		arrival_date, departure_date, room_count, rate_per_room, total_estimated, status, created_at
		FROM group_bookings WHERE property_id = $1`
	args := []interface{}{propertyID}
	argIdx := 2

	if statusFilter != "" {
		query += ` AND status = $` + strconv.Itoa(argIdx)
		args = append(args, statusFilter)
		argIdx++
	}

	var total int
	h.db.QueryRow(ctx, `SELECT COUNT(*) FROM group_bookings WHERE property_id = $1`, propertyID).Scan(&total)

	query += ` ORDER BY created_at DESC LIMIT $` + strconv.Itoa(argIdx) + ` OFFSET $` + strconv.Itoa(argIdx+1)
	args = append(args, perPage, (page-1)*perPage)

	rows, err := h.db.Query(ctx, query, args...)
	if err != nil {
		response.RespondError(w, "Failed to query group bookings", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var groups []map[string]interface{}
	for rows.Next() {
		var id, groupName, company, contactName, contactEmail, arrivalDate, departureDate, status, createdAt string
		var roomCount int
		var ratePerRoom, totalEstimated float64
		rows.Scan(&id, &groupName, &company, &contactName, &contactEmail,
			&arrivalDate, &departureDate, &roomCount, &ratePerRoom, &totalEstimated, &status, &createdAt)
		groups = append(groups, map[string]interface{}{
			"id": id, "group_name": groupName, "company": company,
			"contact_name": contactName, "contact_email": contactEmail,
			"arrival_date": arrivalDate, "departure_date": departureDate,
			"room_count": roomCount, "rate_per_room": ratePerRoom,
			"total_estimated": totalEstimated, "status": status, "created_at": createdAt,
		})
	}
	if groups == nil {
		groups = []map[string]interface{}{}
	}
	response.RespondPaginated(w, groups, int64(total), page, perPage)
}

func (h *Handler) GetGroupBooking(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	id := r.PathValue("id")
	ctx := context.Background()

	var groupName, company, contactName, contactEmail, contactPhone, arrivalDate, departureDate, status, notes string
	var roomCount int
	var ratePerRoom, totalEstimated float64

	err := h.db.QueryRow(ctx, `
		SELECT group_name, company, contact_name, contact_email, COALESCE(contact_phone,''),
			arrival_date, departure_date, room_count, rate_per_room, total_estimated, status, COALESCE(notes,'')
		FROM group_bookings WHERE id = $1 AND property_id = $2
	`, id, propertyID).Scan(&groupName, &company, &contactName, &contactEmail, &contactPhone,
		&arrivalDate, &departureDate, &roomCount, &ratePerRoom, &totalEstimated, &status, &notes)
	if err != nil {
		response.RespondError(w, "Group booking not found", http.StatusNotFound)
		return
	}

	// Get individual reservations in this group
	resRows, _ := h.db.Query(ctx, `
		SELECT r.id, r.guest_id, g.first_name || ' ' || g.last_name as guest_name,
			rm.number as room_number, r.status, r.headline_rate
		FROM reservations r
		JOIN guests g ON r.guest_id = g.id
		LEFT JOIN rooms rm ON r.room_id = rm.id
		WHERE r.property_id = $1 AND r.special_requests LIKE '%Board Meeting%'
		AND r.status IN ('confirmed', 'checked_in')
	`, propertyID)
	defer resRows.Close()

	var reservations []map[string]interface{}
	for resRows.Next() {
		var resID, guestID, guestName, roomNum, resStatus string
		var rate float64
		resRows.Scan(&resID, &guestID, &guestName, &roomNum, &resStatus, &rate)
		reservations = append(reservations, map[string]interface{}{
			"id": resID, "guest_id": guestID, "guest_name": guestName,
			"room_number": roomNum, "status": resStatus, "rate": rate,
		})
	}
	if reservations == nil {
		reservations = []map[string]interface{}{}
	}

	response.RespondSuccess(w, map[string]interface{}{
		"id": id, "group_name": groupName, "company": company,
		"contact_name": contactName, "contact_email": contactEmail, "contact_phone": contactPhone,
		"arrival_date": arrivalDate, "departure_date": departureDate,
		"room_count": roomCount, "rate_per_room": ratePerRoom,
		"total_estimated": totalEstimated, "status": status, "notes": notes,
		"reservations": reservations,
	}, "Group booking retrieved successfully")
}

func (h *Handler) CreateGroupBooking(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	if propertyID == "" {
		propertyID = "00000000-0000-0000-0000-000000000001"
	}

	var req struct {
		GroupName    string  `json:"group_name"`
		Company      string  `json:"company"`
		ContactName  string  `json:"contact_name"`
		ContactEmail string  `json:"contact_email"`
		ContactPhone string  `json:"contact_phone"`
		ArrivalDate  string  `json:"arrival_date"`
		DepartureDate string `json:"departure_date"`
		RoomCount    int     `json:"room_count"`
		RatePerRoom  float64 `json:"rate_per_room"`
		Notes        string  `json:"notes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.RespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.GroupName == "" || req.RoomCount < 1 {
		response.RespondError(w, "Group name and room count are required", http.StatusBadRequest)
		return
	}

	id := generateID()
	totalEstimated := float64(req.RoomCount) * req.RatePerRoom

	_, err := h.db.Exec(context.Background(), `
		INSERT INTO group_bookings (id, property_id, group_name, company, contact_name, contact_email,
			contact_phone, arrival_date, departure_date, room_count, rate_per_room, total_estimated, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'tentative')
	`, id, propertyID, req.GroupName, req.Company, req.ContactName, req.ContactEmail,
		req.ContactPhone, req.ArrivalDate, req.DepartureDate, req.RoomCount, req.RatePerRoom, totalEstimated)
	if err != nil {
		response.RespondError(w, "Failed to create group booking", http.StatusInternalServerError)
		return
	}

	auditLog(h, r, "group_bookings", "create", id, "Created group booking: "+req.GroupName)
	response.RespondSuccess(w, map[string]interface{}{
		"id": id, "total_estimated": totalEstimated,
	}, "Group booking created successfully")
}

func (h *Handler) UpdateGroupBookingStatus(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	id := r.PathValue("id")

	var req struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.RespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	validStatuses := map[string]bool{"tentative": true, "confirmed": true, "cancelled": true, "completed": true}
	if !validStatuses[req.Status] {
		response.RespondError(w, "Invalid status", http.StatusBadRequest)
		return
	}

	_, err := h.db.Exec(context.Background(), `
		UPDATE group_bookings SET status = $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2 AND property_id = $3
	`, req.Status, id, propertyID)
	if err != nil {
		response.RespondError(w, "Failed to update group booking", http.StatusInternalServerError)
		return
	}

	auditLog(h, r, "group_bookings", "update_status", id, "Status changed to "+req.Status)
	response.RespondSuccess(w, nil, "Group booking status updated successfully")
}
