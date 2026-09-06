package handler

import (
	"context"
	"encoding/json"
	"math"
	"net/http"
	"time"

	"infineon/internal/response"
)

// ── Revenue Management Dashboard (Opera/Djubo-style) ──

type RevenueDashboard struct {
	TodayOccupancy    float64            `json:"today_occupancy"`
	TodayADR          float64            `json:"today_adr"`
	TodayRevPAR       float64            `json:"today_revpar"`
	TodayRoomRevenue  float64            `json:"today_room_revenue"`
	MTDOccupancy      float64            `json:"mtd_occupancy"`
	MTDADR            float64            `json:"mtd_adr"`
	MTDRevPAR         float64            `json:"mtd_revpar"`
	MTDRevenue        float64            `json:"mtd_revenue"`
	YTDOccupancy      float64            `json:"ytd_occupancy"`
	YTDADR            float64            `json:"ytd_adr"`
	YTDRevPAR         float64            `json:"ytd_revpar"`
	YTDRevenue        float64            `json:"ytd_revenue"`
	TotalRooms        int                `json:"total_rooms"`
	OccupiedRooms     int                `json:"occupied_rooms"`
	AvailableRooms    int                `json:"available_rooms"`
	Forecast7Day      []ForecastDay      `json:"forecast_7day"`
	PricingRecommend  []PricingRecommend `json:"pricing_recommendations"`
	TopRatePlans      []RatePlanPerf     `json:"top_rate_plans"`
	TopChannels       []ChannelPerf      `json:"top_channels"`
	ADRbyRoomType     []RoomTypePerf     `json:"adr_by_room_type"`
}

type ForecastDay struct {
	Date      string  `json:"date"`
	Booked    int     `json:"booked"`
	Forecast  float64 `json:"forecast_occ"`
	Expected  float64 `json:"expected_revenue"`
}

type PricingRecommend struct {
	RoomType        string  `json:"room_type"`
	CurrentRate     float64 `json:"current_rate"`
	RecommendedRate float64 `json:"recommended_rate"`
	Reason          string  `json:"reason"`
	Priority        string  `json:"priority"`
}

type RatePlanPerf struct {
	Name        string  `json:"name"`
	Reservations int    `json:"reservations"`
	Revenue     float64 `json:"revenue"`
	ADR         float64 `json:"adr"`
}

type ChannelPerf struct {
	Name        string  `json:"name"`
	Reservations int    `json:"reservations"`
	Revenue     float64 `json:"revenue"`
	Percentage  float64 `json:"percentage"`
}

type RoomTypePerf struct {
	Name        string  `json:"name"`
	RoomCount   int     `json:"room_count"`
	Occupied    int     `json:"occupied"`
	ADR         float64 `json:"adr"`
	RevPAR      float64 `json:"revpar"`
}

func (h *Handler) RevenueDashboard(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	if propertyID == "" {
		propertyID = "00000000-0000-0000-0000-000000000001"
	}
	today := time.Now().Format("2006-01-02")
	ctx := context.Background()

	var totalRooms int
	h.db.QueryRow(ctx, `SELECT COUNT(*) FROM rooms WHERE property_id = $1 AND deleted_at IS NULL`, propertyID).Scan(&totalRooms)
	if totalRooms == 0 {
		totalRooms = 1
	}

	var occupiedRooms int
	h.db.QueryRow(ctx, `SELECT COUNT(*) FROM rooms WHERE property_id = $1 AND status LIKE 'occupied%' AND deleted_at IS NULL`, propertyID).Scan(&occupiedRooms)

	availableRooms := totalRooms - occupiedRooms
	occupancy := float64(occupiedRooms) / float64(totalRooms) * 100

	// Today's revenue from folio lines
	var todayRevenue float64
	h.db.QueryRow(ctx, `
		SELECT COALESCE(SUM(fl.amount), 0) FROM folio_lines fl
		JOIN folios f ON fl.folio_id = f.id
		JOIN guest_stays gs ON f.guest_stay_id = gs.id
		WHERE gs.property_id = $1 AND fl.type = 'debit' AND fl.charge_code = 'ROOM'
		AND date(fl.created_at) = $2
	`, propertyID, today).Scan(&todayRevenue)

 adr := 0.0
	if occupiedRooms > 0 {
		adr = todayRevenue / float64(occupiedRooms)
	}
	revpar := todayRevenue / float64(totalRooms)

	// MTD (Month to Date)
	startOfMonth := time.Now().AddDate(0, 0, -time.Now().Day()+1).Format("2006-01-02")
	var mtdRevenue float64
	h.db.QueryRow(ctx, `
		SELECT COALESCE(SUM(fl.amount), 0) FROM folio_lines fl
		JOIN folios f ON fl.folio_id = f.id
		JOIN guest_stays gs ON f.guest_stay_id = gs.id
		WHERE gs.property_id = $1 AND fl.type = 'debit' AND fl.charge_code = 'ROOM'
		AND date(fl.created_at) >= $2
	`, propertyID, startOfMonth).Scan(&mtdRevenue)

	daysInMonth := time.Now().Day()
	mtdOccupancy := occupancy
	mtdADR := 0.0
	if daysInMonth > 0 && occupiedRooms > 0 {
		mtdADR = mtdRevenue / float64(daysInMonth*occupiedRooms)
	}
	mtdRevPAR := mtdRevenue / (float64(totalRooms) * float64(daysInMonth))

	// YTD (Year to Date)
	startOfYear := time.Now().Format("2006-01-01")
	var ytdRevenue float64
	h.db.QueryRow(ctx, `
		SELECT COALESCE(SUM(fl.amount), 0) FROM folio_lines fl
		JOIN folios f ON fl.folio_id = f.id
		JOIN guest_stays gs ON f.guest_stay_id = gs.id
		WHERE gs.property_id = $1 AND fl.type = 'debit' AND fl.charge_code = 'ROOM'
		AND date(fl.created_at) >= $2
	`, propertyID, startOfYear).Scan(&ytdRevenue)

	dayOfYear := time.Now().YearDay()
	ytdOccupancy := occupancy
	ytdADR := 0.0
	if dayOfYear > 0 {
		ytdADR = ytdRevenue / float64(dayOfYear*occupiedRooms)
	}
	ytdRevPAR := ytdRevenue / (float64(totalRooms) * float64(dayOfYear))

	// 7-day forecast
	forecast := make([]ForecastDay, 7)
	for i := 0; i < 7; i++ {
		fDate := time.Now().AddDate(0, 0, i).Format("2006-01-02")
		var booked int
		h.db.QueryRow(ctx, `
			SELECT COUNT(*) FROM reservations
			WHERE property_id = $1 AND status IN ('confirmed', 'checked_in')
			AND $2 >= arrival_date AND $2 < departure_date
		`, propertyID, fDate).Scan(&booked)

		forecastOcc := float64(booked) / float64(totalRooms) * 100
		expectedRev := float64(booked) * adr
		if forecastOcc > 80 {
			expectedRev *= 1.25
		} else if forecastOcc < 40 {
			expectedRev *= 0.85
		}
		forecast[i] = ForecastDay{
			Date:     fDate,
			Booked:   booked,
			Forecast: math.Round(forecastOcc*10) / 10,
			Expected: math.Round(expectedRev*100) / 100,
		}
	}

	// Pricing recommendations based on occupancy
	recommendations := []PricingRecommend{}
	if occupancy < 40 {
		recommendations = append(recommendations, PricingRecommend{
			RoomType: "All Room Types", CurrentRate: adr, RecommendedRate: adr * 0.85,
			Reason: "Low occupancy — discount to drive bookings", Priority: "medium",
		})
	} else if occupancy > 80 {
		recommendations = append(recommendations, PricingRecommend{
			RoomType: "All Room Types", CurrentRate: adr, RecommendedRate: adr * 1.25,
			Reason: "High occupancy — surge pricing recommended", Priority: "high",
		})
	}

	// Top rate plans
	rateRows, _ := h.db.Query(ctx, `
		SELECT rp.name, COUNT(r.id) as res_count, COALESCE(SUM(r.total_estimate), 0) as rev
		FROM rate_plans rp
		LEFT JOIN reservations r ON r.rate_plan_id = rp.id AND r.deleted_at IS NULL
		WHERE rp.property_id = $1
		GROUP BY rp.id, rp.name ORDER BY rev DESC LIMIT 5
	`, propertyID)
	defer rateRows.Close()

	var topRatePlans []RatePlanPerf
	for rateRows.Next() {
		var rp RatePlanPerf
		rateRows.Scan(&rp.Name, &rp.Reservations, &rp.Revenue)
		if rp.Reservations > 0 {
			rp.ADR = math.Round(rp.Revenue/float64(rp.Reservations)*100) / 100
		}
		topRatePlans = append(topRatePlans, rp)
	}

	// Room type performance
	rtRows, _ := h.db.Query(ctx, `
		SELECT rt.name, COUNT(DISTINCT rm.id) as total,
			COUNT(DISTINCT CASE WHEN rm.status LIKE 'occupied%' THEN rm.id END) as occupied
		FROM room_types rt
		JOIN rooms rm ON rm.room_type_id = rt.id
		WHERE rt.property_id = $1 AND rt.deleted_at IS NULL
		GROUP BY rt.id, rt.name
	`, propertyID)
	defer rtRows.Close()

	var adrByRoomType []RoomTypePerf
	for rtRows.Next() {
		var rt RoomTypePerf
		rtRows.Scan(&rt.Name, &rt.RoomCount, &rt.Occupied)
		if rt.RoomCount > 0 {
			rt.RevPAR = math.Round(float64(rt.Occupied)/float64(rt.RoomCount)*adr*100) / 100
			rt.ADR = adr
		}
		adrByRoomType = append(adrByRoomType, rt)
	}

	result := RevenueDashboard{
		TodayOccupancy:   math.Round(occupancy*10) / 10,
		TodayADR:         math.Round(adr*100) / 100,
		TodayRevPAR:      math.Round(revpar*100) / 100,
		TodayRoomRevenue: math.Round(todayRevenue*100) / 100,
		MTDOccupancy:     math.Round(mtdOccupancy*10) / 10,
		MTDADR:           math.Round(mtdADR*100) / 100,
		MTDRevPAR:        math.Round(mtdRevPAR*100) / 100,
		MTDRevenue:       math.Round(mtdRevenue*100) / 100,
		YTDOccupancy:     math.Round(ytdOccupancy*10) / 10,
		YTDADR:           math.Round(ytdADR*100) / 100,
		YTDRevPAR:        math.Round(ytdRevPAR*100) / 100,
		YTDRevenue:       math.Round(ytdRevenue*100) / 100,
		TotalRooms:       totalRooms,
		OccupiedRooms:    occupiedRooms,
		AvailableRooms:   availableRooms,
		Forecast7Day:     forecast,
		PricingRecommend: recommendations,
		TopRatePlans:     topRatePlans,
		TopChannels:      []ChannelPerf{},
		ADRbyRoomType:    adrByRoomType,
	}

	response.RespondSuccess(w, result, "Revenue management dashboard retrieved successfully")
}

// ── Pricing Rules CRUD (Djubo-style dynamic pricing) ──

func (h *Handler) ListPricingRules(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	if propertyID == "" {
		propertyID = "00000000-0000-0000-0000-000000000001"
	}
	ctx := context.Background()

	rows, err := h.db.Query(ctx, `
		SELECT id, name, rule_type, min_occupancy, max_occupancy, price_multiplier, is_active
		FROM pricing_rules WHERE property_id = $1 ORDER BY rule_type, min_occupancy
	`, propertyID)
	if err != nil {
		response.RespondError(w, "Failed to query pricing rules", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var rules []map[string]interface{}
	for rows.Next() {
		var id, name, ruleType string
		var minOcc, maxOcc, multiplier float64
		var active int
		rows.Scan(&id, &name, &ruleType, &minOcc, &maxOcc, &multiplier, &active)
		rules = append(rules, map[string]interface{}{
			"id": id, "name": name, "rule_type": ruleType,
			"min_occupancy": minOcc, "max_occupancy": maxOcc,
			"price_multiplier": multiplier, "is_active": active == 1,
		})
	}
	if rules == nil {
		rules = []map[string]interface{}{}
	}
	response.RespondSuccess(w, rules, "Pricing rules retrieved successfully")
}

func (h *Handler) CreatePricingRule(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	var req struct {
		Name            string  `json:"name"`
		RuleType        string  `json:"rule_type"`
		MinOccupancy    float64 `json:"min_occupancy"`
		MaxOccupancy    float64 `json:"max_occupancy"`
		PriceMultiplier float64 `json:"price_multiplier"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.RespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.Name == "" {
		response.RespondError(w, "Name is required", http.StatusBadRequest)
		return
	}

	id := generateID()
	_, err := h.db.Exec(context.Background(), `
		INSERT INTO pricing_rules (id, property_id, name, rule_type, min_occupancy, max_occupancy, price_multiplier)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, id, propertyID, req.Name, req.RuleType, req.MinOccupancy, req.MaxOccupancy, req.PriceMultiplier)
	if err != nil {
		response.RespondError(w, "Failed to create pricing rule", http.StatusInternalServerError)
		return
	}
	response.RespondSuccess(w, map[string]interface{}{"id": id}, "Pricing rule created successfully")
}

// ── Revenue Forecast ──

func (h *Handler) GetRevenueForecast(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	if propertyID == "" {
		propertyID = "00000000-0000-0000-0000-000000000001"
	}
	ctx := context.Background()

	var totalRooms int
	h.db.QueryRow(ctx, `SELECT COUNT(*) FROM rooms WHERE property_id = $1 AND deleted_at IS NULL`, propertyID).Scan(&totalRooms)
	if totalRooms == 0 {
		totalRooms = 1
	}

	// 30-day forecast
	forecast := make([]map[string]interface{}, 30)
	for i := 0; i < 30; i++ {
		fDate := time.Now().AddDate(0, 0, i)
		fDateStr := fDate.Format("2006-01-02")
		var booked int
		h.db.QueryRow(ctx, `
			SELECT COUNT(*) FROM reservations
			WHERE property_id = $1 AND status IN ('confirmed', 'checked_in')
			AND $2 >= arrival_date AND $2 < departure_date
		`, propertyID, fDateStr).Scan(&booked)

		occRate := float64(booked) / float64(totalRooms) * 100
		multiplier := 1.0
		if occRate > 90 {
			multiplier = 1.5
		} else if occRate > 70 {
			multiplier = 1.25
		} else if occRate < 30 {
			multiplier = 0.75
		}

		// Weekend premium
		if fDate.Weekday() == time.Friday || fDate.Weekday() == time.Saturday {
			multiplier *= 1.15
		}

		forecast[i] = map[string]interface{}{
			"date":            fDateStr,
			"day_of_week":     fDate.Weekday().String(),
			"booked_rooms":    booked,
			"occupancy_rate":  math.Round(occRate*10) / 10,
			"price_multiplier": math.Round(multiplier*100) / 100,
			"estimated_revenue": math.Round(float64(booked)*25000*multiplier*100) / 100,
		}
	}

	response.RespondSuccess(w, forecast, "30-day revenue forecast retrieved successfully")
}
