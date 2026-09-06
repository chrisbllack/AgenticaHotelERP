package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

// ── Events / Banqueting ──

type Event struct {
	ID          int     `json:"id"`
	EventName   string  `json:"event_name"`
	ClientName  string  `json:"client_name"`
	ClientEmail string  `json:"client_email"`
	ClientPhone string  `json:"client_phone"`
	VenueID     int     `json:"venue_id"`
	VenueName   string  `json:"venue_name"`
	EventDate   string  `json:"event_date"`
	StartTime   string  `json:"start_time"`
	EndTime     string  `json:"end_time"`
	GuestCount  int     `json:"guest_count"`
	Package     string  `json:"package"`
	Status      string  `json:"status"` // inquiry, tentative, confirmed, completed, cancelled
	TotalAmount float64 `json:"total_amount"`
	DepositPaid float64 `json:"deposit_paid"`
	Notes       string  `json:"notes"`
	CreatedAt   string  `json:"created_at"`
}

type Venue struct {
	ID          int     `json:"id"`
	Name        string  `json:"name"`
	Capacity    int     `json:"capacity"`
	HourlyRate  float64 `json:"hourly_rate"`
	DailyRate   float64 `json:"daily_rate"`
	Amenities   string  `json:"amenities"`
	Status      string  `json:"status"`
}

// ListEvents returns all events for the property
func (h *Handler) ListEvents(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	rows, err := h.db.Query(r.Context(), `
		SELECT id, name, COALESCE(event_type,''), COALESCE(event_date,''),
		       guest_count, total_amount, status, COALESCE(notes,'')
		FROM events WHERE property_id = $1 AND deleted_at IS NULL
		ORDER BY created_at DESC LIMIT 50`, propertyID)
	if err != nil {
		jsonError(w, "Failed to load events", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var events []Event
	for rows.Next() {
		var e Event
		rows.Scan(&e.ID, &e.EventName, &e.ClientName, &e.ClientEmail,
			&e.ClientPhone, &e.VenueID, &e.VenueName, &e.EventDate,
			&e.StartTime, &e.EndTime, &e.GuestCount, &e.Package,
			&e.Status, &e.TotalAmount, &e.DepositPaid, &e.Notes, &e.CreatedAt)
		events = append(events, e)
	}
	jsonSuccess(w, events)
}

// CreateEvent creates a new event
func (h *Handler) CreateEvent(w http.ResponseWriter, r *http.Request) {
	var req struct {
		EventName   string  `json:"event_name"`
		ClientName  string  `json:"client_name"`
		ClientEmail string  `json:"client_email"`
		ClientPhone string  `json:"client_phone"`
		VenueID     int     `json:"venue_id"`
		EventDate   string  `json:"event_date"`
		StartTime   string  `json:"start_time"`
		EndTime     string  `json:"end_time"`
		GuestCount  int     `json:"guest_count"`
		Package     string  `json:"package"`
		TotalAmount float64 `json:"total_amount"`
		Notes       string  `json:"notes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	var eventID int
	err := h.db.QueryRow(ctx, `
		INSERT INTO events (
			event_name, client_name, client_email, client_phone, venue_id,
			event_date, start_time, end_time, guest_count, package,
			status, total_amount, notes, property_id, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'inquiry', $11, $12, $13, NOW())
		RETURNING id
	`, req.EventName, req.ClientName, req.ClientEmail, req.ClientPhone,
		req.VenueID, req.EventDate, req.StartTime, req.EndTime,
		req.GuestCount, req.Package, req.TotalAmount, req.Notes,
		ctx.Value("property_id")).Scan(&eventID)
	if err != nil {
		jsonError(w, "Failed to create event", http.StatusInternalServerError)
		return
	}

	jsonSuccess(w, map[string]interface{}{
		"id":      eventID,
		"message": "Event created",
		"status":  "inquiry",
	})
}

// UpdateEventStatus changes event status
func (h *Handler) UpdateEventStatus(w http.ResponseWriter, r *http.Request) {
	eventID := chi.URLParam(r, "id")
	var req struct {
		Status string `json:"status"`
		Notes  string `json:"notes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	_, err := h.db.Exec(ctx, `
		UPDATE events SET status = $1, notes = COALESCE(NULLIF($2, ''), notes), updated_at = NOW()
		WHERE id = $3 AND property_id = $4
	`, req.Status, req.Notes, eventID, ctx.Value("property_id"))
	if err != nil {
		jsonError(w, "Failed to update event", http.StatusInternalServerError)
		return
	}

	jsonSuccess(w, map[string]interface{}{"message": "Event updated", "status": req.Status})
}

// ListVenues returns available venues
func (h *Handler) ListVenues(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	rows, err := h.db.Query(ctx, `
		SELECT id, name, capacity, hourly_rate, daily_rate, COALESCE(amenities, ''), status
		FROM venues WHERE property_id = $1 ORDER BY name
	`, ctx.Value("property_id"))
	if err != nil {
		jsonError(w, "Failed to load venues", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var venues []Venue
	for rows.Next() {
		var v Venue
		rows.Scan(&v.ID, &v.Name, &v.Capacity, &v.HourlyRate, &v.DailyRate, &v.Amenities, &v.Status)
		venues = append(venues, v)
	}

	if len(venues) == 0 {
		venues = []Venue{
			{1, "Grand Ballroom", 500, 150000, 1000000, "Stage, Sound System, Projector, Dance Floor", "available"},
			{2, "Royal Hall", 200, 80000, 500000, "Projector, Microphone, Podium", "available"},
			{3, "Boardroom A", 20, 30000, 200000, "Projector, Whiteboard, Video Conference", "available"},
			{4, "Garden Pavilion", 100, 50000, 350000, "Open Air, Lighting, Tent", "available"},
		}
	}

	jsonSuccess(w, venues)
}
