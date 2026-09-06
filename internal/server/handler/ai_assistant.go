package handler

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// ── AI Assistant ──

type AIRequest struct {
	Message string `json:"message"`
}

type AIResponse struct {
	Answer    string                 `json:"answer"`
	Data      map[string]interface{} `json:"data,omitempty"`
	Confidence float64               `json:"confidence"`
	Sources   []string               `json:"sources"`
}

// ChatWithAI processes natural language questions about PMS data
func (h *Handler) ChatWithAI(w http.ResponseWriter, r *http.Request) {
	var req AIRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.Message == "" {
		jsonError(w, "Message required", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	msg := strings.ToLower(req.Message)

	// Keyword-based intent detection (production would use LLM)
	switch {
	case containsAny(msg, "occupancy", "rooms available", "vacant", "how many rooms"):
		h.handleAIOccupancy(ctx, w)

	case containsAny(msg, "revenue", "sales today", "how much money", "today's income"):
		h.handleAIRevenue(ctx, w)

	case containsAny(msg, "arrivals", "expected guests", "who is checking in"):
		h.handleAIArrivals(ctx, w)

	case containsAny(msg, "departures", "checking out", "leaving today"):
		h.handleAIDepartures(ctx, w)

	case containsAny(msg, "guest", "guest name", "who is staying"):
		h.handleAIGuests(ctx, w)

	case containsAny(msg, "stock", "inventory low", "low stock", "out of stock"):
		h.handleAIStock(ctx, w)

	case containsAny(msg, "unpaid", "outstanding", "balance", "owed"):
		h.handleAIUnpaid(ctx, w)

	case containsAny(msg, "night audit", "business date", "close day"):
		h.handleAINightAudit(ctx, w)

	case containsAny(msg, "employee", "staff", "headcount"):
		h.handleAIEmployees(ctx, w)

	case containsAny(msg, "help", "what can you do", "commands"):
		h.handleAIHelp(w)

	default:
		jsonSuccess(w, AIResponse{
			Answer: "I can help you with: occupancy, revenue, arrivals, departures, guest info, stock levels, unpaid balances, night audit status, and employee info. Try asking: 'How many rooms are available?' or 'What's today's revenue?'",
			Confidence: 0.5,
			Sources: []string{"AI Assistant"},
		})
	}
}

func (h *Handler) handleAIOccupancy(ctx interface{}, w http.ResponseWriter) {
	var total, occupied, available int
	db := h.db
	_ = db.QueryRow(nil, `SELECT COUNT(*) FROM rooms WHERE property_id = $1`, ctx).Scan(&total)
	_ = db.QueryRow(nil, `SELECT COUNT(*) FROM rooms WHERE property_id = $1 AND status LIKE 'occupied%'`, ctx).Scan(&occupied)
	available = total - occupied

	occupancyRate := 0.0
	if total > 0 {
		occupancyRate = float64(occupied) / float64(total) * 100
	}

	jsonSuccess(w, AIResponse{
		Answer:    "Current occupancy: " + formatInt(occupied) + " of " + formatInt(total) + " rooms occupied (" + formatFloat(occupancyRate) + "%). " + formatInt(available) + " rooms are available.",
		Confidence: 0.95,
		Sources:   []string{"rooms table"},
		Data: map[string]interface{}{
			"total": total, "occupied": occupied, "available": available, "occupancy_rate": occupancyRate,
		},
	})
}

func (h *Handler) handleAIRevenue(ctx interface{}, w http.ResponseWriter) {
	var todayRevenue float64
	db := h.db
	_ = db.QueryRow(nil, `
		SELECT COALESCE(SUM(debit - credit), 0) FROM folio_lines fl
		JOIN folios f ON f.id = fl.folio_id
		WHERE fl.posted_at::date = CURRENT_DATE AND f.property_id = $1
	`, ctx).Scan(&todayRevenue)

	jsonSuccess(w, AIResponse{
		Answer:    "Today's revenue: ₦" + formatFloat(todayRevenue),
		Confidence: 0.9,
		Sources:   []string{"folio_lines table"},
		Data:      map[string]interface{}{"today_revenue": todayRevenue},
	})
}

func (h *Handler) handleAIArrivals(ctx interface{}, w http.ResponseWriter) {
	var count int
	db := h.db
	_ = db.QueryRow(nil, `
		SELECT COUNT(*) FROM reservations
		WHERE check_in_date = CURRENT_DATE AND status = 'confirmed' AND property_id = $1
	`, ctx).Scan(&count)

	jsonSuccess(w, AIResponse{
		Answer:    formatInt(count) + " arrivals expected today.",
		Confidence: 0.9,
		Sources:   []string{"reservations table"},
		Data:      map[string]interface{}{"arrivals": count},
	})
}

func (h *Handler) handleAIDepartures(ctx interface{}, w http.ResponseWriter) {
	var count int
	db := h.db
	_ = db.QueryRow(nil, `
		SELECT COUNT(*) FROM reservations
		WHERE check_out_date = CURRENT_DATE AND status IN ('checked_in', 'in_house') AND property_id = $1
	`, ctx).Scan(&count)

	jsonSuccess(w, AIResponse{
		Answer:    formatInt(count) + " departures expected today.",
		Confidence: 0.9,
		Sources:   []string{"reservations table"},
		Data:      map[string]interface{}{"departures": count},
	})
}

func (h *Handler) handleAIGuests(ctx interface{}, w http.ResponseWriter) {
	var count int
	db := h.db
	_ = db.QueryRow(nil, `
		SELECT COUNT(*) FROM reservations
		WHERE status IN ('checked_in', 'in_house') AND property_id = $1
	`, ctx).Scan(&count)

	jsonSuccess(w, AIResponse{
		Answer:    formatInt(count) + " guests currently in-house.",
		Confidence: 0.9,
		Sources:   []string{"reservations table"},
		Data:      map[string]interface{}{"in_house": count},
	})
}

func (h *Handler) handleAIStock(ctx interface{}, w http.ResponseWriter) {
	var lowStock int
	db := h.db
	_ = db.QueryRow(nil, `
		SELECT COUNT(*) FROM products WHERE property_id = $1
		AND reorder_level > 0 AND id IN (
			SELECT product_id FROM stock_movements
			GROUP BY product_id HAVING SUM(quantity) <= (SELECT reorder_level FROM products WHERE id = product_id)
		)
	`, ctx).Scan(&lowStock)

	jsonSuccess(w, AIResponse{
		Answer:    formatInt(lowStock) + " products are at or below reorder level.",
		Confidence: 0.8,
		Sources:   []string{"products table", "stock_movements table"},
		Data:      map[string]interface{}{"low_stock_count": lowStock},
	})
}

func (h *Handler) handleAIUnpaid(ctx interface{}, w http.ResponseWriter) {
	var total float64
	var count int
	db := h.db
	_ = db.QueryRow(nil, `
		SELECT COUNT(*), COALESCE(SUM(balance), 0) FROM folios
		WHERE balance > 0 AND status = 'open' AND property_id = $1
	`, ctx).Scan(&count, &total)

	jsonSuccess(w, AIResponse{
		Answer:    formatInt(count) + " open folios with outstanding balance totaling ₦" + formatFloat(total),
		Confidence: 0.9,
		Sources:   []string{"folios table"},
		Data:      map[string]interface{}{"open_folios": count, "total_outstanding": total},
	})
}

func (h *Handler) handleAINightAudit(ctx interface{}, w http.ResponseWriter) {
	var lastAuditDate string
	var status string
	db := h.db
	_ = db.QueryRow(nil, `
		SELECT business_date::text, status FROM night_audits
		WHERE property_id = $1 ORDER BY business_date DESC LIMIT 1
	`, ctx).Scan(&lastAuditDate, &status)

	today := time.Now().Format("2006-01-02")
	answer := "Last night audit: " + lastAuditDate + " (" + status + ")."
	if lastAuditDate == today {
		answer += " Today's audit is complete."
	} else {
		answer += " Today's audit has NOT been run yet."
	}

	jsonSuccess(w, AIResponse{
		Answer:    answer,
		Confidence: 0.95,
		Sources:   []string{"night_audits table"},
		Data:      map[string]interface{}{"last_audit": lastAuditDate, "status": status},
	})
}

func (h *Handler) handleAIEmployees(ctx interface{}, w http.ResponseWriter) {
	var total, active int
	db := h.db
	_ = db.QueryRow(nil, `SELECT COUNT(*) FROM employees WHERE property_id = $1`, ctx).Scan(&total)
	_ = db.QueryRow(nil, `SELECT COUNT(*) FROM employees WHERE property_id = $1 AND status = 'active'`, ctx).Scan(&active)

	jsonSuccess(w, AIResponse{
		Answer:    formatInt(active) + " active employees out of " + formatInt(total) + " total.",
		Confidence: 0.9,
		Sources:   []string{"employees table"},
		Data:      map[string]interface{}{"total": total, "active": active},
	})
}

func (h *Handler) handleAIHelp(w http.ResponseWriter) {
	jsonSuccess(w, AIResponse{
		Answer: `I'm your AI hotel assistant. I can answer questions about:

🏨 Occupancy: "How many rooms are occupied?"
💰 Revenue: "What's today's revenue?"
✈️ Arrivals: "How many arrivals today?"
🏠 Departures: "Who's checking out today?"
👤 Guests: "How many guests in-house?"
📦 Stock: "Any low stock items?"
💳 Payments: "What's the outstanding balance?"
🌙 Night Audit: "Has night audit been run?"
👥 Staff: "How many employees?"

Just ask in natural language!`,
		Confidence: 1.0,
		Sources:   []string{"AI Assistant"},
	})
}

// Helpers
func containsAny(s string, words ...string) bool {
	for _, w := range words {
		if strings.Contains(s, w) {
			return true
		}
	}
	return false
}

func formatInt(n int) string {
	return strconv.Itoa(n)
}

func formatFloat(f float64) string {
	return strconv.FormatFloat(f, 'f', 2, 64)
}
