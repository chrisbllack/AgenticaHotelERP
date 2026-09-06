package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// ── Online Booking Engine ──

type BookingSearchRequest struct {
	CheckIn  string `json:"check_in"`
	CheckOut string `json:"check_out"`
	Adults   int    `json:"adults"`
	Children int    `json:"children"`
	Rooms    int    `json:"rooms"`
}

type BookingSearchResult struct {
	RoomType   string   `json:"room_type"`
	RoomName   string   `json:"room_name"`
	BaseRate   float64  `json:"base_rate"`
	TotalRate  float64  `json:"total_rate"`
	Nights     int      `json:"nights"`
	Available  int      `json:"available"`
	Amenities  []string `json:"amenities"`
	Image      string   `json:"image"`
}

// SearchAvailability returns available rooms for public booking
func (h *Handler) SearchAvailability(w http.ResponseWriter, r *http.Request) {
	var req BookingSearchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	_ = pgx.ErrNoRows

	ctx := r.Context()
	rows, err := h.db.Query(ctx, `
		SELECT rt.id, rt.name, rt.base_price, COALESCE(rt.amenities, '[]'), rt.image_url,
		       (SELECT COUNT(*) FROM rooms rm WHERE rm.room_type_id = rt.id AND rm.property_id = $1 AND rm.status IN ('available','clean'))
		FROM room_types rt
		WHERE rt.property_id = $1 AND rt.status = 'active'
		ORDER BY rt.base_price
	`, r.Context().Value("property_id"))
	if err != nil {
		jsonError(w, "Failed to search", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var results []BookingSearchResult
	for rows.Next() {
		var res BookingSearchResult
		var amenitiesStr string
		err := rows.Scan(&res.RoomType, &res.RoomName, &res.BaseRate, &amenitiesStr, &res.Image, &res.Available)
		if err != nil {
			continue
		}
		if res.Available > 0 && req.CheckIn != "" && req.CheckOut != "" {
			t1, _ := time.Parse("2006-01-02", req.CheckIn)
			t2, _ := time.Parse("2006-01-02", req.CheckOut)
			res.Nights = int(t2.Sub(t1).Hours() / 24)
			if res.Nights < 1 {
				res.Nights = 1
			}
			res.TotalRate = res.BaseRate * float64(res.Nights)
		}
		_ = amenitiesStr
		results = append(results, res)
	}

	if results == nil {
		results = []BookingSearchResult{}
	}

	jsonSuccess(w, map[string]interface{}{
		"rooms":    results,
		"check_in": req.CheckIn,
		"check_out": req.CheckOut,
	})
}

// CreateBooking creates a new direct booking
func (h *Handler) CreateBooking(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var req struct {
		GuestName  string  `json:"guest_name"`
		GuestEmail string  `json:"guest_email"`
		GuestPhone string  `json:"guest_phone"`
		RoomTypeID string  `json:"room_type_id"`
		CheckIn    string  `json:"check_in"`
		CheckOut   string  `json:"check_out"`
		Adults     int     `json:"adults"`
		TotalRate  float64 `json:"total_rate"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	propertyID := r.Context().Value("property_id")
	_ = propertyID

	var reservationID string
	err := h.db.QueryRow(ctx, `
		INSERT INTO reservations (id, property_id, guest_name, guest_email, guest_phone,
			room_type_id, check_in, check_out, adults, total_amount, status, source, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', 'direct_booking', CURRENT_TIMESTAMP)
		RETURNING id
	`, uuid.New().String(), propertyID, req.GuestName, req.GuestEmail, req.GuestPhone,
		req.RoomTypeID, req.CheckIn, req.CheckOut, req.Adults, req.TotalRate).Scan(&reservationID)

	if err != nil {
		jsonError(w, "Failed to create booking", http.StatusInternalServerError)
		return
	}

	jsonSuccess(w, map[string]interface{}{
		"reservation_id": reservationID,
		"status":         "confirmed",
		"message":        "Booking created successfully",
	})
}

// ── Payment Integration ──

func (h *Handler) InitiatePayment(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ReservationID string  `json:"reservation_id"`
		Amount        float64 `json:"amount"`
		Currency      string  `json:"currency"`
		PaymentMethod string  `json:"payment_method"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.Currency == "" {
		req.Currency = "NGN"
	}

	paymentRef := "PAY-" + time.Now().Format("20060102150405")

	// Store payment record
	ctx := r.Context()
	_, _ = h.db.Exec(ctx, `
		INSERT INTO payments (id, reservation_id, amount, currency, payment_method, reference, status, created_at)
		VALUES (?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
	`, uuid.New().String(), req.ReservationID, req.Amount, req.Currency, req.PaymentMethod, paymentRef)

	jsonSuccess(w, map[string]interface{}{
		"payment_ref": paymentRef,
		"amount":      req.Amount,
		"currency":    req.Currency,
		"status":      "pending",
		"gateway_url": "https://checkout.paystack.com/" + paymentRef,
		"message":     "Payment initiated. Redirect user to gateway_url.",
	})
}

// PaymentWebhook handles payment gateway callbacks
func (h *Handler) PaymentWebhook(w http.ResponseWriter, r *http.Request) {
	var event struct {
		Event  string `json:"event"`
		Ref    string `json:"ref"`
		Status string `json:"status"`
	}

	if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
		http.Error(w, "bad payload", http.StatusBadRequest)
		return
	}

	if event.Status == "success" || event.Event == "charge.success" {
		ctx := r.Context()
		_, _ = h.db.Exec(ctx, `
			UPDATE payments SET status = 'completed', updated_at = CURRENT_TIMESTAMP
			WHERE reference = $1
		`, event.Ref)
	}

	jsonSuccess(w, map[string]interface{}{"received": true})
}

// ProcessRefund handles refund requests
func (h *Handler) ProcessRefund(w http.ResponseWriter, r *http.Request) {
	var req struct {
		PaymentID string  `json:"payment_id"`
		Amount    float64 `json:"amount"`
		Reason    string  `json:"reason"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	ctx := r.Context()

	var currentAmount float64
	err := h.db.QueryRow(ctx, `SELECT amount FROM payments WHERE id = $1`, req.PaymentID).Scan(&currentAmount)
	if err != nil {
		jsonError(w, "Payment not found", http.StatusNotFound)
		return
	}

	if req.Amount > currentAmount {
		jsonError(w, "Refund exceeds payment amount", http.StatusBadRequest)
		return
	}

	refundRef := "REF-" + time.Now().Format("20060102150405")
	_, _ = h.db.Exec(ctx, `
		INSERT INTO payments (id, reservation_id, amount, currency, payment_method, reference, status, created_at)
		VALUES (?, (SELECT reservation_id FROM payments WHERE id = $2), $3, 'NGN', 'refund', $4, 'completed', CURRENT_TIMESTAMP)
	`, uuid.New().String(), req.PaymentID, -req.Amount, refundRef)

	jsonSuccess(w, map[string]interface{}{
		"refund_ref": refundRef,
		"amount":     req.Amount,
		"status":     "completed",
		"message":    "Refund processed",
	})
}
