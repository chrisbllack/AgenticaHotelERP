package handler

import (
	"net/http"
	"time"
)

// ============================================================
// EXECUTIVE DASHBOARD
// ============================================================

type DashboardData struct {
	// Current Status
	TodayArrivals      int     `json:"today_arrivals"`
	TodayDepartures    int     `json:"today_departures"`
	InHouseGuests      int     `json:"in_house_guests"`
	TotalRooms         int     `json:"total_rooms"`
	OccupiedRooms      int     `json:"occupied_rooms"`
	OccupancyRate      float64 `json:"occupancy_rate"`
	OutstandingBalance float64 `json:"outstanding_balance"`

	// Revenue
	TodayRoomRevenue  float64 `json:"today_room_revenue"`
	TodayPOSSales     float64 `json:"today_pos_sales"`
	TodayTotalRevenue float64 `json:"today_total_revenue"`
	MonthRoomRevenue  float64 `json:"month_room_revenue"`
	MonthPOSSales     float64 `json:"month_pos_sales"`
	MonthTotalRevenue float64 `json:"month_total_revenue"`
	MonthADR          float64 `json:"month_adr"`
	MonthRevPAR       float64 `json:"month_revpar"`

	// Operational
	DirtyRooms         int `json:"dirty_rooms"`
	CleanRooms         int `json:"clean_rooms"`
	OutOfOrderRooms    int `json:"out_of_order_rooms"`
	PendingMaintenance int `json:"pending_maintenance"`

	// Recent Activity
	RecentReservations []RecentReservation `json:"recent_reservations"`
	TopRoomTypes       []RoomTypeStat      `json:"top_room_types"`
	RevenueBySource    []SourceStat        `json:"revenue_by_source"`
}

type RecentReservation struct {
	ConfirmationNo string `json:"confirmation_no"`
	GuestName      string `json:"guest_name"`
	RoomType       string `json:"room_type"`
	ArrivalDate    string `json:"arrival_date"`
	Status         string `json:"status"`
	TotalAmount    float64 `json:"total_amount"`
}

type RoomTypeStat struct {
	RoomType      string  `json:"room_type"`
	RoomsSold     int     `json:"rooms_sold"`
	Revenue       float64 `json:"revenue"`
	AverageRate   float64 `json:"average_rate"`
}

type SourceStat struct {
	Source        string  `json:"source"`
	RoomNights    int     `json:"room_nights"`
	Revenue       float64 `json:"revenue"`
}

func (h *Handler) GetDashboard(w http.ResponseWriter, r *http.Request) {
	propertyID := r.Context().Value("property_id").(string)
	today := time.Now().Format("2006-01-02")
	monthStart := time.Now().Format("2006-01") + "-01"
	monthEnd := time.Now().Format("2006-01") + "-31"

	dash := DashboardData{
		RecentReservations: []RecentReservation{},
		TopRoomTypes:       []RoomTypeStat{},
		RevenueBySource:    []SourceStat{},
	}

	// Total rooms
	h.db.QueryRow(r.Context(), `
		SELECT COUNT(*) FROM rooms WHERE property_id = $1`, propertyID).Scan(&dash.TotalRooms)

	// Occupied rooms (reservations that are checked-in)
	h.db.QueryRow(r.Context(), `
		SELECT COUNT(*) FROM reservations
		WHERE property_id = $1 AND status = 'checked_in'
		AND $2::date >= arrival_date AND $2::date < departure_date`, propertyID, today).Scan(&dash.OccupiedRooms)

	// Today's arrivals
	h.db.QueryRow(r.Context(), `
		SELECT COUNT(*) FROM reservations
		WHERE property_id = $1 AND status IN ('confirmed','tentative')
		AND arrival_date = $2::date`, propertyID, today).Scan(&dash.TodayArrivals)

	// Today's departures
	h.db.QueryRow(r.Context(), `
		SELECT COUNT(*) FROM reservations
		WHERE property_id = $1 AND status = 'checked_in'
		AND departure_date = $2::date`, propertyID, today).Scan(&dash.TodayDepartures)

	// In-house guests
	h.db.QueryRow(r.Context(), `
		SELECT COUNT(*) FROM reservations
		WHERE property_id = $1 AND status = 'checked_in'
		AND $2::date >= arrival_date AND $2::date < departure_date`, propertyID, today).Scan(&dash.InHouseGuests)

	// Occupancy rate
	if dash.TotalRooms > 0 {
		dash.OccupancyRate = float64(dash.OccupiedRooms) / float64(dash.TotalRooms) * 100
	}

	// Outstanding balance (sum of folio balances)
	h.db.QueryRow(r.Context(), `
		SELECT COALESCE(SUM(f.balance), 0)
		FROM folios f
		INNER JOIN reservations r ON f.reservation_id = r.id
		WHERE r.property_id = $1 AND r.status IN ('checked_in','checked_out')
		AND f.balance > 0`, propertyID).Scan(&dash.OutstandingBalance)

	// Dirty rooms
	h.db.QueryRow(r.Context(), `
		SELECT COUNT(*) FROM rooms
		WHERE property_id = $1 AND housekeeping_status IN ('dirty','occupied_dirty')`, propertyID).Scan(&dash.DirtyRooms)

	// Clean rooms
	h.db.QueryRow(r.Context(), `
		SELECT COUNT(*) FROM rooms
		WHERE property_id = $1 AND housekeeping_status IN ('clean','inspected')
		AND status != 'out_of_order'`, propertyID).Scan(&dash.CleanRooms)

	// Out of order rooms
	h.db.QueryRow(r.Context(), `
		SELECT COUNT(*) FROM rooms
		WHERE property_id = $1 AND status = 'out_of_order'`, propertyID).Scan(&dash.OutOfOrderRooms)

	// Today's room revenue (from folio charges posted today)
	h.db.QueryRow(r.Context(), `
		SELECT COALESCE(SUM(fc.amount), 0)
		FROM folio_charges fc
		INNER JOIN folios f ON fc.folio_id = f.id
		INNER JOIN reservations r ON f.reservation_id = r.id
		WHERE r.property_id = $1 AND fc.charge_date = $2::date
		AND fc.charge_type IN ('room','extra_person')`, propertyID, today).Scan(&dash.TodayRoomRevenue)

	// Today's POS sales
	h.db.QueryRow(r.Context(), `
		SELECT COALESCE(SUM(total_amount), 0)
		FROM pos_orders
		WHERE property_id = $1 AND order_date = $2::date AND status != 'voided'`, propertyID, today).Scan(&dash.TodayPOSSales)

	dash.TodayTotalRevenue = dash.TodayRoomRevenue + dash.TodayPOSSales

	// Monthly revenue
	h.db.QueryRow(r.Context(), `
		SELECT COALESCE(SUM(fc.amount), 0)
		FROM folio_charges fc
		INNER JOIN folios f ON fc.folio_id = f.id
		INNER JOIN reservations r ON f.reservation_id = r.id
		WHERE r.property_id = $1 AND fc.charge_date BETWEEN $2::date AND $3::date
		AND fc.charge_type IN ('room','extra_person')`, propertyID, monthStart, monthEnd).Scan(&dash.MonthRoomRevenue)

	h.db.QueryRow(r.Context(), `
		SELECT COALESCE(SUM(total_amount), 0)
		FROM pos_orders
		WHERE property_id = $1 AND order_date BETWEEN $2::date AND $3::date AND status != 'voided'`,
		propertyID, monthStart, monthEnd).Scan(&dash.MonthPOSSales)

	dash.MonthTotalRevenue = dash.MonthRoomRevenue + dash.MonthPOSSales

	// ADR & RevPAR
	monthDays := time.Now().Day()
	if monthDays > 0 {
		var soldNights int
		h.db.QueryRow(r.Context(), `
			SELECT COALESCE(SUM(LEAST(departure_date, $3::date) - GREATEST(arrival_date, $2::date)), 0)
			FROM reservations
			WHERE property_id = $1 AND status IN ('checked_in','checked_out')
			AND departure_date > $2::date AND arrival_date <= $3::date`,
			propertyID, monthStart, monthEnd).Scan(&soldNights)
		if soldNights > 0 {
			dash.MonthADR = dash.MonthRoomRevenue / float64(soldNights)
		}
		if dash.TotalRooms > 0 && monthDays > 0 {
			dash.MonthRevPAR = dash.MonthRoomRevenue / float64(dash.TotalRooms*monthDays)
		}
	}

	// Pending maintenance
	h.db.QueryRow(r.Context(), `
		SELECT COUNT(*) FROM work_orders
		WHERE property_id = $1 AND status IN ('open','in_progress')`, propertyID).Scan(&dash.PendingMaintenance)

	// Recent reservations
	rows, _ := h.db.Query(r.Context(), `
		SELECT COALESCE(r.confirmation_no,''), COALESCE(g.first_name||' '||g.last_name,'Guest'),
		       COALESCE(rt.name,''), r.arrival_date::text, r.status, COALESCE(r.total_amount,0)
		FROM reservations r
		LEFT JOIN guests g ON r.guest_id = g.id
		LEFT JOIN room_types rt ON r.room_type_id = rt.id
		WHERE r.property_id = $1
		ORDER BY r.created_at DESC LIMIT 10`, propertyID)
	if rows != nil {
		defer rows.Close()
		for rows.Next() {
			var rr RecentReservation
			if err := rows.Scan(&rr.ConfirmationNo, &rr.GuestName, &rr.RoomType,
				&rr.ArrivalDate, &rr.Status, &rr.TotalAmount); err != nil {
				continue
			}
			dash.RecentReservations = append(dash.RecentReservations, rr)
		}
	}

	// Top room types by revenue
	rows2, _ := h.db.Query(r.Context(), `
		SELECT COALESCE(rt.name,'Other'), COUNT(*) as sold,
		       COALESCE(SUM(r.total_amount),0) as rev,
		       COALESCE(AVG(r.total_amount),0) as avg_rate
		FROM reservations r
		LEFT JOIN room_types rt ON r.room_type_id = rt.id
		WHERE r.property_id = $1
		AND r.created_at >= $2::date AND r.status != 'cancelled'
		GROUP BY rt.name ORDER BY rev DESC LIMIT 5`, propertyID, monthStart)
	if rows2 != nil {
		defer rows2.Close()
		for rows2.Next() {
			var s RoomTypeStat
			if err := rows2.Scan(&s.RoomType, &s.RoomsSold, &s.Revenue, &s.AverageRate); err != nil {
				continue
			}
			dash.TopRoomTypes = append(dash.TopRoomTypes, s)
		}
	}

	// Revenue by source
	rows3, _ := h.db.Query(r.Context(), `
		SELECT COALESCE(r.source,'Direct') as src, COUNT(*) as nights, COALESCE(SUM(r.total_amount),0) as rev
		FROM reservations r
		WHERE r.property_id = $1
		AND r.created_at >= $2::date AND r.status != 'cancelled'
		GROUP BY r.source ORDER BY rev DESC LIMIT 5`, propertyID, monthStart)
	if rows3 != nil {
		defer rows3.Close()
		for rows3.Next() {
			var s SourceStat
			if err := rows3.Scan(&s.Source, &s.RoomNights, &s.Revenue); err != nil {
				continue
			}
			dash.RevenueBySource = append(dash.RevenueBySource, s)
		}
	}

	SendSuccess(w, dash)
}

// ============================================================
// OCCUPANCY REPORT
// ============================================================

type OccupancyRow struct {
	Date          string  `json:"date"`
	Available     int     `json:"available"`
	Occupied      int     `json:"occupied"`
	Complimentary int     `json:"complimentary"`
	HouseUse      int     `json:"house_use"`
	OutOfOrder    int     `json:"out_of_order"`
	OccupancyPct  float64 `json:"occupancy_pct"`
	Arrivals      int     `json:"arrivals"`
	Departures    int     `json:"departures"`
}

func (h *Handler) GetOccupancyReport(w http.ResponseWriter, r *http.Request) {
	propertyID := r.Context().Value("property_id").(string)
	dateFrom := r.URL.Query().Get("from")
	dateTo := r.URL.Query().Get("to")

	if dateFrom == "" {
		dateFrom = time.Now().Format("2006-01-02")
	}
	if dateTo == "" {
		dateTo = time.Now().AddDate(0, 0, 7).Format("2006-01-02")
	}

	var totalRooms int
	h.db.QueryRow(r.Context(), `SELECT COUNT(*) FROM rooms WHERE property_id = $1 AND status != 'out_of_order'`, propertyID).Scan(&totalRooms)

	type DateStat struct {
		Date       string
		Occupied   int
		Arrivals   int
		Departures int
		OOO        int
	}

	// Generate date range and fill occupancy
	startDate, _ := time.Parse("2006-01-02", dateFrom)
	endDate, _ := time.Parse("2006-01-02", dateTo)
	var report []OccupancyRow

	for d := startDate; !d.After(endDate); d = d.AddDate(0, 0, 1) {
		ds := d.Format("2006-01-02")
		var occ int
		var arr int
		var dep int
		var ooo int

		h.db.QueryRow(r.Context(), `
			SELECT COUNT(*) FROM reservations
			WHERE property_id = $1 AND status IN ('checked_in','checked_out')
			AND $2::date >= arrival_date AND $2::date < departure_date`, propertyID, ds).Scan(&occ)

		h.db.QueryRow(r.Context(), `
			SELECT COUNT(*) FROM reservations
			WHERE property_id = $1 AND status IN ('confirmed','tentative')
			AND arrival_date = $2::date`, propertyID, ds).Scan(&arr)

		h.db.QueryRow(r.Context(), `
			SELECT COUNT(*) FROM reservations
			WHERE property_id = $1 AND status = 'checked_in'
			AND departure_date = $2::date`, propertyID, ds).Scan(&dep)

		h.db.QueryRow(r.Context(), `
			SELECT COUNT(*) FROM rooms WHERE property_id = $1 AND status = 'out_of_order'`, propertyID).Scan(&ooo)

		avail := totalRooms - ooo
		pct := 0.0
		if avail > 0 {
			pct = float64(occ) / float64(avail) * 100
		}

		report = append(report, OccupancyRow{
			Date:         ds,
			Available:    avail,
			Occupied:     occ,
			OccupancyPct: pct,
			Arrivals:     arr,
			Departures:   dep,
			OutOfOrder:   ooo,
		})
	}

	if report == nil {
		report = []OccupancyRow{}
	}
	SendSuccess(w, report)
}

// ============================================================
// ROOM REVENUE REPORT
// ============================================================

type RoomRevenueRow struct {
	RoomType      string  `json:"room_type"`
	RoomsSold     int     `json:"rooms_sold"`
	RoomNights    int     `json:"room_nights"`
	Revenue       float64 `json:"revenue"`
	AverageRate   float64 `json:"average_rate"`
	TaxAmount     float64 `json:"tax_amount"`
	NetRevenue    float64 `json:"net_revenue"`
}

func (h *Handler) GetRoomRevenueReport(w http.ResponseWriter, r *http.Request) {
	propertyID := r.Context().Value("property_id").(string)
	dateFrom := r.URL.Query().Get("from")
	dateTo := r.URL.Query().Get("to")

	if dateFrom == "" {
		dateFrom = time.Now().Format("2006-01") + "-01"
	}
	if dateTo == "" {
		dateTo = time.Now().Format("2006-01-02")
	}

	rows, err := h.db.Query(r.Context(), `
		SELECT COALESCE(rt.name, 'Other') as room_type,
		       COUNT(DISTINCT r.id) as rooms_sold,
		       COALESCE(SUM(LEAST(r.departure_date, $3::date) - GREATEST(r.arrival_date, $2::date)), 0) as nights,
		       COALESCE(SUM(r.total_amount), 0) as revenue,
		       COALESCE(AVG(r.total_amount), 0) as avg_rate,
		       COALESCE(SUM(r.tax_amount), 0) as tax
		FROM reservations r
		LEFT JOIN room_types rt ON r.room_type_id = rt.id
		WHERE r.property_id = $1
		AND r.status != 'cancelled'
		AND r.departure_date > $2::date AND r.arrival_date <= $3::date
		GROUP BY rt.name ORDER BY revenue DESC`, propertyID, dateFrom, dateTo)
	if err != nil {
		SendError(w, http.StatusInternalServerError, "Failed to generate report")
		return
	}
	defer rows.Close()

	var report []RoomRevenueRow
	for rows.Next() {
		var rr RoomRevenueRow
		if err := rows.Scan(&rr.RoomType, &rr.RoomsSold, &rr.RoomNights,
			&rr.Revenue, &rr.AverageRate, &rr.TaxAmount); err != nil {
			continue
		}
		rr.NetRevenue = rr.Revenue - rr.TaxAmount
		report = append(report, rr)
	}
	if report == nil {
		report = []RoomRevenueRow{}
	}
	SendSuccess(w, report)
}

// ============================================================
// POS SALES REPORT
// ============================================================

type POSSalesRow struct {
	Outlet        string  `json:"outlet"`
	OrderCount    int     `json:"order_count"`
	TotalSales    float64 `json:"total_sales"`
	AvgCheck      float64 `json:"avg_check"`
	Discounts     float64 `json:"discounts"`
	Comps         float64 `json:"comps"`
	NetSales      float64 `json:"net_sales"`
}

func (h *Handler) GetPOSSalesReport(w http.ResponseWriter, r *http.Request) {
	propertyID := r.Context().Value("property_id").(string)
	dateFrom := r.URL.Query().Get("from")
	dateTo := r.URL.Query().Get("to")

	if dateFrom == "" {
		dateFrom = time.Now().Format("2006-01-02")
	}
	if dateTo == "" {
		dateTo = dateFrom
	}

	rows, err := h.db.Query(r.Context(), `
		SELECT COALESCE(o.name, 'Unknown') as outlet_name,
		       COUNT(po.id) as orders,
		       COALESCE(SUM(po.subtotal), 0) as sales,
		       COALESCE(AVG(po.subtotal), 0) as avg_check,
		       COALESCE(SUM(po.discount_amount), 0) as discounts,
		       COALESCE(SUM(po.comp_amount), 0) as comps
		FROM pos_orders po
		LEFT JOIN outlets o ON po.outlet_id = o.id
		WHERE po.property_id = $1 AND po.order_date BETWEEN $2::date AND $3::date
		AND po.status != 'voided'
		GROUP BY o.name ORDER BY sales DESC`, propertyID, dateFrom, dateTo)
	if err != nil {
		SendError(w, http.StatusInternalServerError, "Failed to generate POS report")
		return
	}
	defer rows.Close()

	var report []POSSalesRow
	for rows.Next() {
		var ps POSSalesRow
		if err := rows.Scan(&ps.Outlet, &ps.OrderCount, &ps.TotalSales,
			&ps.AvgCheck, &ps.Discounts, &ps.Comps); err != nil {
			continue
		}
		ps.NetSales = ps.TotalSales - ps.Discounts - ps.Comps
		report = append(report, ps)
	}
	if report == nil {
		report = []POSSalesRow{}
	}
	SendSuccess(w, report)
}

// ============================================================
// INVENTORY SUMMARY REPORT
// ============================================================

type InventorySummaryRow struct {
	Category      string  `json:"category"`
	ProductCount  int     `json:"product_count"`
	StockValue    float64 `json:"stock_value"`
	LowStockItems int     `json:"low_stock_items"`
	ExpiringSoon  int     `json:"expiring_soon"`
}

func (h *Handler) GetInventorySummaryReport(w http.ResponseWriter, r *http.Request) {
	propertyID := r.Context().Value("property_id").(string)

	rows, err := h.db.Query(r.Context(), `
		SELECT COALESCE(pc.name, 'Uncategorized') as category,
		       COUNT(p.id) as products,
		       COALESCE(SUM(p.current_stock * p.cost_price), 0) as stock_value,
		       COUNT(CASE WHEN p.current_stock <= p.reorder_level THEN 1 END) as low_stock,
		       COUNT(CASE WHEN p.expiry_date IS NOT NULL AND p.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as expiring
		FROM products p
		LEFT JOIN product_categories pc ON p.category_id = pc.id
		WHERE p.property_id = $1
		GROUP BY pc.name ORDER BY stock_value DESC`, propertyID)
	if err != nil {
		SendError(w, http.StatusInternalServerError, "Failed to generate inventory report")
		return
	}
	defer rows.Close()

	var report []InventorySummaryRow
	for rows.Next() {
		var ir InventorySummaryRow
		if err := rows.Scan(&ir.Category, &ir.ProductCount, &ir.StockValue,
			&ir.LowStockItems, &ir.ExpiringSoon); err != nil {
			continue
		}
		report = append(report, ir)
	}
	if report == nil {
		report = []InventorySummaryRow{}
	}
	SendSuccess(w, report)
}
