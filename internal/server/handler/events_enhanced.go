package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"infineon/internal/response"
)

// ── Event Venues (Opera Sales & Catering style) ──

func (h *Handler) ListEventVenues(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	if propertyID == "" {
		propertyID = "00000000-0000-0000-0000-000000000001"
	}

	rows, err := h.db.Query(context.Background(), `
		SELECT id, name, capacity, hourly_rate, daily_rate, amenities, status
		FROM event_venues WHERE property_id = $1 ORDER BY capacity
	`, propertyID)
	if err != nil {
		response.RespondError(w, "Failed to query venues", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var venues []map[string]interface{}
	for rows.Next() {
		var id, name, amenities, status string
		var cap int
		var hourlyRate, dailyRate float64
		rows.Scan(&id, &name, &cap, &hourlyRate, &dailyRate, &amenities, &status)
		venues = append(venues, map[string]interface{}{
			"id": id, "name": name, "capacity": cap,
			"hourly_rate": hourlyRate, "daily_rate": dailyRate,
			"amenities": amenities, "status": status,
		})
	}
	if venues == nil {
		venues = []map[string]interface{}{}
	}
	response.RespondSuccess(w, venues, "Event venues retrieved successfully")
}

// ── Event Bookings ──

func (h *Handler) ListEventBookings(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	if propertyID == "" {
		propertyID = "00000000-0000-0000-0000-000000000001"
	}

	statusFilter := r.URL.Query().Get("status")
	query := `SELECT eb.id, eb.event_name, eb.event_type, eb.client_name, eb.client_email,
		ev.name as venue_name, eb.start_date, eb.end_date, eb.guest_count,
		eb.package_name, eb.total_amount, eb.deposit_paid, eb.status
		FROM event_bookings eb
		LEFT JOIN event_venues ev ON eb.venue_id = ev.id
		WHERE eb.property_id = $1`
	args := []interface{}{propertyID}
	argIdx := 2

	if statusFilter != "" {
		query += ` AND eb.status = $` + strconv.Itoa(argIdx)
		args = append(args, statusFilter)
		argIdx++
	}
	query += ` ORDER BY eb.start_date DESC`

	rows, err := h.db.Query(context.Background(), query, args...)
	if err != nil {
		response.RespondError(w, "Failed to query event bookings", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var events []map[string]interface{}
	for rows.Next() {
		var id, eventName, eventType, clientName, clientEmail, venueName string
		var startDate, endDate, packageName, status string
		var guestCount int
		var totalAmount, depositPaid float64
		rows.Scan(&id, &eventName, &eventType, &clientName, &clientEmail, &venueName,
			&startDate, &endDate, &guestCount, &packageName, &totalAmount, &depositPaid, &status)
		events = append(events, map[string]interface{}{
			"id": id, "event_name": eventName, "event_type": eventType,
			"client_name": clientName, "client_email": clientEmail,
			"venue_name": venueName, "start_date": startDate, "end_date": endDate,
			"guest_count": guestCount, "package_name": packageName,
			"total_amount": totalAmount, "deposit_paid": depositPaid, "status": status,
		})
	}
	if events == nil {
		events = []map[string]interface{}{}
	}
	response.RespondSuccess(w, events, "Event bookings retrieved successfully")
}

func (h *Handler) CreateEventBooking(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	if propertyID == "" {
		propertyID = "00000000-0000-0000-0000-000000000001"
	}

	var req struct {
		VenueID         string  `json:"venue_id"`
		ClientName      string  `json:"client_name"`
		ClientEmail     string  `json:"client_email"`
		ClientPhone     string  `json:"client_phone"`
		EventName       string  `json:"event_name"`
		EventType       string  `json:"event_type"`
		StartDate       string  `json:"start_date"`
		EndDate         string  `json:"end_date"`
		GuestCount      int     `json:"guest_count"`
		PackageName     string  `json:"package_name"`
		TotalAmount     float64 `json:"total_amount"`
		DepositPaid     float64 `json:"deposit_paid"`
		Notes           string  `json:"notes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.RespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.ClientName == "" || req.EventName == "" {
		response.RespondError(w, "Client name and event name are required", http.StatusBadRequest)
		return
	}

	id := generateID()
	_, err := h.db.Exec(context.Background(), `
		INSERT INTO event_bookings (id, property_id, venue_id, client_name, client_email, client_phone,
			event_name, event_type, start_date, end_date, guest_count, package_name,
			total_amount, deposit_paid, status, notes)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'inquiry', $15)
	`, id, propertyID, req.VenueID, req.ClientName, req.ClientEmail, req.ClientPhone,
		req.EventName, req.EventType, req.StartDate, req.EndDate, req.GuestCount,
		req.PackageName, req.TotalAmount, req.DepositPaid, req.Notes)
	if err != nil {
		response.RespondError(w, "Failed to create event booking", http.StatusInternalServerError)
		return
	}

	auditLog(h, r, "event_bookings", "create", id, "Created event: "+req.EventName)
	response.RespondSuccess(w, map[string]interface{}{"id": id}, "Event booking created successfully")
}

func (h *Handler) UpdateEventBookingStatus(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	id := r.PathValue("id")

	var req struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.RespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	validStatuses := map[string]bool{"inquiry": true, "tentative": true, "confirmed": true, "cancelled": true, "completed": true}
	if !validStatuses[req.Status] {
		response.RespondError(w, "Invalid status", http.StatusBadRequest)
		return
	}

	_, err := h.db.Exec(context.Background(), `
		UPDATE event_bookings SET status = $1, updated_at = CURRENT_TIMESTAMP
		WHERE id = $2 AND property_id = $3
	`, req.Status, id, propertyID)
	if err != nil {
		response.RespondError(w, "Failed to update event booking", http.StatusInternalServerError)
		return
	}

	auditLog(h, r, "event_bookings", "update_status", id, "Status changed to "+req.Status)
	response.RespondSuccess(w, nil, "Event booking status updated successfully")
}

// ── Service Requests (Guest Self-Service) ──

func (h *Handler) ListServiceRequests(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	if propertyID == "" {
		propertyID = "00000000-0000-0000-0000-000000000001"
	}

	statusFilter := r.URL.Query().Get("status")
	query := `SELECT id, category, description, priority, status, assigned_to, requested_at, completed_at, notes
		FROM service_requests WHERE property_id = $1`
	args := []interface{}{propertyID}
	argIdx := 2

	if statusFilter != "" {
		query += ` AND status = $` + strconv.Itoa(argIdx)
		args = append(args, statusFilter)
		argIdx++
	}
	query += ` ORDER BY requested_at DESC`

	rows, err := h.db.Query(context.Background(), query, args...)
	if err != nil {
		response.RespondError(w, "Failed to query service requests", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var requests []map[string]interface{}
	for rows.Next() {
		var id, category, description, priority, status, assignedTo, requestedAt, completedAt, notes string
		rows.Scan(&id, &category, &description, &priority, &status, &assignedTo, &requestedAt, &completedAt, &notes)
		requests = append(requests, map[string]interface{}{
			"id": id, "category": category, "description": description,
			"priority": priority, "status": status, "assigned_to": assignedTo,
			"requested_at": requestedAt, "completed_at": completedAt, "notes": notes,
		})
	}
	if requests == nil {
		requests = []map[string]interface{}{}
	}
	response.RespondSuccess(w, requests, "Service requests retrieved successfully")
}

func (h *Handler) CreateServiceRequest(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	if propertyID == "" {
		propertyID = "00000000-0000-0000-0000-000000000001"
	}

	var req struct {
		GuestStayID string `json:"guest_stay_id"`
		Category    string `json:"category"`
		Description string `json:"description"`
		Priority    string `json:"priority"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.RespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.Category == "" {
		response.RespondError(w, "Category is required", http.StatusBadRequest)
		return
	}
	if req.Priority == "" {
		req.Priority = "normal"
	}

	id := generateID()
	_, err := h.db.Exec(context.Background(), `
		INSERT INTO service_requests (id, property_id, guest_stay_id, category, description, priority, status)
		VALUES ($1, $2, $3, $4, $5, $6, 'open')
	`, id, propertyID, req.GuestStayID, req.Category, req.Description, req.Priority)
	if err != nil {
		response.RespondError(w, "Failed to create service request", http.StatusInternalServerError)
		return
	}

	response.RespondSuccess(w, map[string]interface{}{"id": id}, "Service request created successfully")
}

func (h *Handler) UpdateServiceRequest(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	id := r.PathValue("id")

	var req struct {
		Status     string `json:"status"`
		AssignedTo string `json:"assigned_to"`
		Notes      string `json:"notes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.RespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Status == "completed" {
		_, err := h.db.Exec(context.Background(), `
			UPDATE service_requests SET status = $1, assigned_to = COALESCE(NULLIF($2,''), assigned_to),
				notes = COALESCE(NULLIF($3,''), notes), completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
			WHERE id = $4 AND property_id = $5
		`, req.Status, req.AssignedTo, req.Notes, id, propertyID)
		if err != nil {
			response.RespondError(w, "Failed to update service request", http.StatusInternalServerError)
			return
		}
	} else {
		_, err := h.db.Exec(context.Background(), `
			UPDATE service_requests SET status = $1, assigned_to = COALESCE(NULLIF($2,''), assigned_to),
				notes = COALESCE(NULLIF($3,''), notes), updated_at = CURRENT_TIMESTAMP
			WHERE id = $4 AND property_id = $5
		`, req.Status, req.AssignedTo, req.Notes, id, propertyID)
		if err != nil {
			response.RespondError(w, "Failed to update service request", http.StatusInternalServerError)
			return
		}
	}

	response.RespondSuccess(w, nil, "Service request updated successfully")
}

// ── Shift Handover (Opera-style shift management) ──

func (h *Handler) ListShiftHandovers(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	if propertyID == "" {
		propertyID = "00000000-0000-0000-0000-000000000001"
	}

	rows, err := h.db.Query(context.Background(), `
		SELECT id, shift_date, shift_name, outgoing_staff, incoming_staff, summary, created_at
		FROM shift_handovers WHERE property_id = $1 ORDER BY created_at DESC LIMIT 20
	`, propertyID)
	if err != nil {
		response.RespondError(w, "Failed to query shift handovers", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var handovers []map[string]interface{}
	for rows.Next() {
		var id, shiftDate, shiftName, outgoing, incoming, summary, createdAt string
		rows.Scan(&id, &shiftDate, &shiftName, &outgoing, &incoming, &summary, &createdAt)
		handovers = append(handovers, map[string]interface{}{
			"id": id, "shift_date": shiftDate, "shift_name": shiftName,
			"outgoing_staff": outgoing, "incoming_staff": incoming,
			"summary": summary, "created_at": createdAt,
		})
	}
	if handovers == nil {
		handovers = []map[string]interface{}{}
	}
	response.RespondSuccess(w, handovers, "Shift handovers retrieved successfully")
}

func (h *Handler) CreateShiftHandover(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	if propertyID == "" {
		propertyID = "00000000-0000-0000-0000-000000000001"
	}

	var req struct {
		ShiftName     string `json:"shift_name"`
		OutgoingStaff string `json:"outgoing_staff"`
		IncomingStaff string `json:"incoming_staff"`
		Summary       string `json:"summary"`
		OpenIssues    string `json:"open_issues"`
		VIPNotes      string `json:"vip_notes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.RespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	id := generateID()
	today := time.Now().Format("2006-01-02")
	_, err := h.db.Exec(context.Background(), `
		INSERT INTO shift_handovers (id, property_id, shift_date, shift_name, outgoing_staff, incoming_staff, summary)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, id, propertyID, today, req.ShiftName, req.OutgoingStaff, req.IncomingStaff, req.Summary)
	if err != nil {
		response.RespondError(w, "Failed to create shift handover", http.StatusInternalServerError)
		return
	}

	auditLog(h, r, "shift_handovers", "create", id, "Shift handover created")
	response.RespondSuccess(w, map[string]interface{}{"id": id}, "Shift handover created successfully")
}
