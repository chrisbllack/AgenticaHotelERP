package handler

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"infineon/internal/response"
)

// ReservationChart returns rooms and reservations for the chart view
func (h *Handler) ReservationChart(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	startDate := r.URL.Query().Get("start")
	endDate := r.URL.Query().Get("end")

	if startDate == "" {
		startDate = time.Now().Format("2006-01-02")
	}
	if endDate == "" {
		// Default to 14 days
		endDate = time.Now().AddDate(0, 0, 14).Format("2006-01-02")
	}

	// 1. Get rooms with type info
	roomRows, err := h.db.Query(r.Context(), `
		SELECT r.id, r.number, rt.id as room_type_id, rt.name as room_type, rt.code as type_code,
			COALESCE(f.level, 0) as floor, r.status as room_status,
			r.housekeeping_status, r.is_smoking
		FROM rooms r
		JOIN room_types rt ON rt.id = r.room_type_id
		LEFT JOIN floors f ON f.id = r.floor_id
		WHERE r.property_id = $1 AND r.deleted_at IS NULL
		ORDER BY rt.sort_order, r.number
	`, propertyID)
	if err != nil {
		response.RespondError(w, "Failed to query rooms", http.StatusInternalServerError)
		return
	}
	defer roomRows.Close()

	type RoomInfo struct {
		ID        string `json:"id"`
		Number    string `json:"number"`
		RoomType  string `json:"room_type"`
		TypeCode  string `json:"type_code"`
		Floor     int    `json:"floor"`
		Status    string `json:"room_status"`
		HKStatus  string `json:"hk_status"`
		IsSmoking bool   `json:"is_smoking"`
	}

	var rooms []RoomInfo
	for roomRows.Next() {
		var rm RoomInfo
		var smoking int
		roomRows.Scan(&rm.ID, &rm.Number, &rm.RoomType, &rm.RoomType,
			&rm.TypeCode, &rm.Floor, &rm.Status, &rm.HKStatus, &smoking)
		rm.IsSmoking = smoking == 1
		rooms = append(rooms, rm)
	}

	// 2. Get reservations in date range
	resRows, err := h.db.Query(r.Context(), `
		SELECT res.id, res.guest_id, COALESCE(g.first_name || ' ' || g.last_name, 'Unknown') as guest_name,
			rm.number as room_number, rt.name as room_type,
			res.arrival_date, res.departure_date, res.status,
			res.is_vip, res.adults, res.children,
			COALESCE(res.source, '') as source,
			COALESCE(res.special_requests, '') as special_requests,
			res.total_estimate
		FROM reservations res
		JOIN guests g ON g.id = res.guest_id
		JOIN rooms rm ON rm.id = res.room_id
		JOIN room_types rt ON rt.id = rm.room_type_id
		WHERE res.property_id = $1 AND res.deleted_at IS NULL
			AND res.arrival_date <= $2 AND res.departure_date >= $3
		ORDER BY res.arrival_date, rm.number
	`, propertyID, endDate, startDate)
	if err != nil {
		response.RespondError(w, "Failed to query reservations", http.StatusInternalServerError)
		return
	}
	defer resRows.Close()

	type ResInfo struct {
		ID              string  `json:"id"`
		GuestID         string  `json:"guest_id"`
		GuestName       string  `json:"guest_name"`
		RoomNumber      string  `json:"room_number"`
		RoomType        string  `json:"room_type"`
		ArrivalDate     string  `json:"arrival_date"`
		DepartureDate   string  `json:"departure_date"`
		Status          string  `json:"status"`
		IsVIP           bool    `json:"is_vip"`
		Adults          int     `json:"adults"`
		Children        int     `json:"children"`
		Source          string  `json:"source"`
		SpecialRequests string  `json:"special_requests"`
		RatePlanID      string  `json:"rate_plan_id"`
		TotalEstimate   float64 `json:"total_estimate"`
	}

	var reservations []ResInfo
	for resRows.Next() {
		var res ResInfo
		var vip int
		var arrival, departure string
		resRows.Scan(&res.ID, &res.GuestID, &res.GuestName,
			&res.RoomNumber, &res.RoomType,
			&arrival, &departure, &res.Status,
			&vip, &res.Adults, &res.Children,
			&res.Source, &res.SpecialRequests,
			&res.TotalEstimate)
		res.ArrivalDate = arrival
		res.DepartureDate = departure
		res.IsVIP = vip == 1
		reservations = append(reservations, res)
	}

	// 3. Room status summary
	var totalRooms, occupied, available, dirty, ooo, reserved int
	h.db.QueryRow(r.Context(), `SELECT COUNT(*) FROM rooms WHERE property_id = $1 AND deleted_at IS NULL`, propertyID).Scan(&totalRooms)
	h.db.QueryRow(r.Context(), `SELECT COUNT(*) FROM rooms WHERE property_id = $1 AND status LIKE 'occupied%' AND deleted_at IS NULL`, propertyID).Scan(&occupied)
	h.db.QueryRow(r.Context(), `SELECT COUNT(*) FROM rooms WHERE property_id = $1 AND status LIKE 'vacant_clean' AND deleted_at IS NULL`, propertyID).Scan(&available)
	h.db.QueryRow(r.Context(), `SELECT COUNT(*) FROM rooms WHERE property_id = $1 AND housekeeping_status = 'dirty' AND deleted_at IS NULL`, propertyID).Scan(&dirty)
	h.db.QueryRow(r.Context(), `SELECT COUNT(*) FROM rooms WHERE property_id = $1 AND status = 'out_of_order' AND deleted_at IS NULL`, propertyID).Scan(&ooo)
	h.db.QueryRow(r.Context(), `SELECT COUNT(*) FROM rooms WHERE property_id = $1 AND status = 'reserved' AND deleted_at IS NULL`, propertyID).Scan(&reserved)

	if rooms == nil {
		rooms = []RoomInfo{}
	}
	if reservations == nil {
		reservations = []ResInfo{}
	}

	response.RespondSuccess(w, map[string]interface{}{
		"rooms":        rooms,
		"reservations": reservations,
		"date_range": map[string]interface{}{
			"start": startDate,
			"end":   endDate,
		},
		"summary": map[string]interface{}{
			"total_rooms": totalRooms,
			"occupied":    occupied,
			"available":   available,
			"dirty":       dirty,
			"out_of_order": ooo,
			"reserved":    reserved,
		},
	}, "Reservation chart data retrieved")
}

// DragDropMoveReservation moves a reservation to a new room via drag-and-drop
func (h *Handler) DragDropMoveReservation(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	var req struct {
		ReservationID string `json:"reservation_id"`
		NewRoomID     string `json:"new_room_id"`
		NewArrival    string `json:"new_arrival,omitempty"`
		NewDeparture  string `json:"new_departure,omitempty"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.RespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Verify reservation exists
	var oldRoomID string
	err := h.db.QueryRow(r.Context(), `
		SELECT room_id FROM reservations WHERE id = $1 AND property_id = $2 AND deleted_at IS NULL
	`, req.ReservationID, propertyID).Scan(&oldRoomID)
	if err != nil {
		response.RespondError(w, "Reservation not found", http.StatusNotFound)
		return
	}

	// Check room availability (exclude current reservation)
	if oldRoomID != req.NewRoomID {
		var conflict int
		h.db.QueryRow(r.Context(), `
			SELECT COUNT(*) FROM reservations
			WHERE room_id = $1 AND property_id = $2 AND id != $3
				AND status NOT IN ('cancelled','no_show') AND deleted_at IS NULL
				AND arrival_date < COALESCE($5, departure_date) AND departure_date > COALESCE($4, arrival_date)
		`, req.NewRoomID, propertyID, req.ReservationID, req.NewArrival, req.NewDeparture).Scan(&conflict)
		if conflict > 0 {
			response.RespondError(w, "Room is not available for the requested dates", http.StatusConflict)
			return
		}
	}

	// Move reservation
	updateSQL := `UPDATE reservations SET room_id = $2, updated_at = CURRENT_TIMESTAMP`
	args := []interface{}{req.ReservationID, req.NewRoomID}
	argIdx := 3

	if req.NewArrival != "" {
		updateSQL += `, arrival_date = $` + strconv.Itoa(argIdx)
		args = append(args, req.NewArrival)
		argIdx++
	}
	if req.NewDeparture != "" {
		updateSQL += `, departure_date = $` + strconv.Itoa(argIdx)
		args = append(args, req.NewDeparture)
		argIdx++
	}
	updateSQL += ` WHERE id = $1 AND property_id = $` + strconv.Itoa(argIdx)
	args = append(args, propertyID)

	_, err = h.db.Exec(r.Context(), updateSQL, args...)
	if err != nil {
		response.RespondError(w, "Failed to move reservation", http.StatusInternalServerError)
		return
	}

	// Free old room
	if oldRoomID != "" && oldRoomID != req.NewRoomID {
		h.db.Exec(r.Context(), `
			UPDATE rooms SET status = 'vacant_dirty' WHERE id = $1 AND status = 'reserved'
		`, oldRoomID)
	}

	// Mark new room as reserved
	h.db.Exec(r.Context(), `
		UPDATE rooms SET status = 'reserved' WHERE id = $1
	`, req.NewRoomID)

	var newRoomNumber string
	h.db.QueryRow(r.Context(), `SELECT number FROM rooms WHERE id = $1`, req.NewRoomID).Scan(&newRoomNumber)

	response.RespondSuccess(w, map[string]interface{}{
		"reservation_id": req.ReservationID,
		"new_room":       newRoomNumber,
	}, "Reservation moved successfully")
}
