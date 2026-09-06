package handler

import (
	"fmt"
	"math"
	"net/http"
	"strconv"
	"time"

	"infineon/internal/response"
)

// ═══════════════════════════════════════════════════════════════
// COMPREHENSIVE REPORTS ENGINE — 25+ Reports (SQLite-compatible)
// ═══════════════════════════════════════════════════════════════

func reportMeta(name, dateRange string, rows int) map[string]interface{} {
	return map[string]interface{}{
		"report_name": name,
		"generated":   time.Now().Format(time.RFC3339),
		"date_range":  dateRange,
		"rows":        rows,
	}
}

// ── 1. Occupancy Summary ──
func (h *Handler) ReportOccupancySummary(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	days, _ := strconv.Atoi(r.URL.Query().Get("days"))
	if days <= 0 || days > 90 {
		days = 7
	}
	type DayOcc struct {
		Date       string  `json:"date"`
		TotalRooms int     `json:"total_rooms"`
		Occupied   int     `json:"occupied"`
		Available  int     `json:"available"`
		Reserved   int     `json:"reserved"`
		OOO        int     `json:"out_of_order"`
		OccRate    float64 `json:"occupancy_rate"`
	}
	var data []DayOcc
	var totalRooms int
	h.db.QueryRow(r.Context(), "SELECT COUNT(*) FROM rooms WHERE property_id=?", propertyID).Scan(&totalRooms)

	today := time.Now()
	for i := days - 1; i >= 0; i-- {
		d := today.AddDate(0, 0, -i)
		ds := d.Format("2006-01-02")
		var occ, ooo int
		h.db.QueryRow(r.Context(), `SELECT COUNT(*) FROM rooms WHERE property_id=? AND status='occupied'`, propertyID).Scan(&occ)
		h.db.QueryRow(r.Context(), `SELECT COUNT(*) FROM rooms WHERE property_id=? AND status IN ('out_of_order','out_of_service')`, propertyID).Scan(&ooo)
		avail := totalRooms - occ - ooo
		rate := 0.0
		if totalRooms > 0 {
			rate = float64(occ) / float64(totalRooms) * 100
		}
		data = append(data, DayOcc{Date: ds, TotalRooms: totalRooms, Occupied: occ, Available: avail, OOO: ooo, OccRate: math.Round(rate*100) / 100})
	}
	if data == nil {
		data = []DayOcc{}
	}
	response.RespondSuccess(w, map[string]interface{}{
		"meta":        reportMeta("Occupancy Summary", fmt.Sprintf("Last %d days", days), len(data)),
		"total_rooms": totalRooms,
		"data":        data,
	}, "Occupancy summary retrieved")
}

// ── 2. Revenue by Room Type ──
func (h *Handler) ReportRevenueByRoomType(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	type Row struct {
		Name string  `json:"room_type"`
		Res  int     `json:"reservations"`
		Rev  float64 `json:"revenue"`
		Avg  float64 `json:"avg_rate"`
	}
	var data []Row
	n := 0
	rows, err := h.db.Query(r.Context(), `SELECT rt.name, COUNT(*), COALESCE(SUM(r.total_amount),0), COALESCE(AVG(r.total_amount),0) FROM reservations r JOIN room_types rt ON r.room_type_id=rt.id WHERE r.property_id=? AND r.status IN ('checked_in','checked_out') AND r.check_in_date >= date('now','-30 days') GROUP BY rt.name ORDER BY revenue DESC`, propertyID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var d Row
			rows.Scan(&d.Name, &d.Res, &d.Rev, &d.Avg)
			data = append(data, d)
			n++
		}
	}
	if data == nil {
		data = []Row{}
	}
	response.RespondSuccess(w, map[string]interface{}{"meta": reportMeta("Revenue by Room Type", "Last 30 days", n), "data": data}, "Report retrieved")
}

// ── 3. Revenue by Source ──
func (h *Handler) ReportRevenueBySource(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	type Row struct {
		Source string  `json:"source"`
		Res    int     `json:"reservations"`
		Rev    float64 `json:"revenue"`
	}
	var data []Row
	n := 0
	rows, err := h.db.Query(r.Context(), `SELECT COALESCE(source,'Direct'), COUNT(*), COALESCE(SUM(total_amount),0) FROM reservations WHERE property_id=? AND check_in_date >= date('now','-30 days') GROUP BY source ORDER BY revenue DESC`, propertyID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var d Row
			rows.Scan(&d.Source, &d.Res, &d.Rev)
			data = append(data, d)
			n++
		}
	}
	if data == nil {
		data = []Row{}
	}
	response.RespondSuccess(w, map[string]interface{}{"meta": reportMeta("Revenue by Source", "Last 30 days", n), "data": data}, "Report retrieved")
}

// ── 4. POS Sales Report ──
func (h *Handler) ReportPOSSales(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	type Row struct {
		Date    string  `json:"date"`
		Outlet  string  `json:"outlet"`
		Amount  float64 `json:"amount"`
		Payment string  `json:"payment_method"`
		Status  string  `json:"status"`
	}
	var data []Row
	n := 0
	rows, err := h.db.Query(r.Context(), `SELECT date(created_at), COALESCE(outlet,'Restaurant'), COALESCE(total,0), COALESCE(payment_method,'cash'), status FROM pos_orders WHERE property_id=? AND status != 'voided' ORDER BY created_at DESC LIMIT 100`, propertyID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var d Row
			rows.Scan(&d.Date, &d.Outlet, &d.Amount, &d.Payment, &d.Status)
			data = append(data, d)
			n++
		}
	}
	var totalSales float64
	h.db.QueryRow(r.Context(), `SELECT COALESCE(SUM(total),0) FROM pos_orders WHERE property_id=? AND status != 'voided'`, propertyID).Scan(&totalSales)
	if data == nil {
		data = []Row{}
	}
	response.RespondSuccess(w, map[string]interface{}{
		"meta":        reportMeta("POS Sales Report", "Last 100 transactions", n),
		"total_sales": totalSales,
		"data":        data,
	}, "Report retrieved")
}

// ── 5. POS Sales by Outlet ──
func (h *Handler) ReportPOSSalesByOutlet(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	type Row struct {
		Outlet string  `json:"outlet"`
		Orders int     `json:"orders"`
		Rev    float64 `json:"revenue"`
		Avg    float64 `json:"avg_order"`
	}
	var data []Row
	n := 0
	rows, err := h.db.Query(r.Context(), `SELECT COALESCE(outlet,'Restaurant'), COUNT(*), COALESCE(SUM(total),0), COALESCE(AVG(total),0) FROM pos_orders WHERE property_id=? AND status != 'voided' GROUP BY outlet ORDER BY revenue DESC`, propertyID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var d Row
			rows.Scan(&d.Outlet, &d.Orders, &d.Rev, &d.Avg)
			data = append(data, d)
			n++
		}
	}
	if data == nil {
		data = []Row{}
	}
	response.RespondSuccess(w, map[string]interface{}{"meta": reportMeta("POS Sales by Outlet", "All time", n), "data": data}, "Report retrieved")
}

// ── 6. Daily Revenue ──
func (h *Handler) ReportDailyRevenue(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	days, _ := strconv.Atoi(r.URL.Query().Get("days"))
	if days <= 0 || days > 90 {
		days = 7
	}
	type DayRev struct {
		Date     string  `json:"date"`
		RoomRev  float64 `json:"room_revenue"`
		POSSales float64 `json:"pos_sales"`
		Total    float64 `json:"total"`
		ADR      float64 `json:"adr"`
		RevPAR   float64 `json:"revpar"`
	}
	var data []DayRev
	var totalRooms int
	h.db.QueryRow(r.Context(), "SELECT COUNT(*) FROM rooms WHERE property_id=?", propertyID).Scan(&totalRooms)

	today := time.Now()
	for i := days - 1; i >= 0; i-- {
		d := today.AddDate(0, 0, -i)
		ds := d.Format("2006-01-02")
		var roomRev, posSales float64
		h.db.QueryRow(r.Context(), "SELECT COALESCE(SUM(total_amount),0) FROM reservations WHERE property_id=? AND check_in_date=? AND status IN ('checked_in','checked_out')", propertyID, ds).Scan(&roomRev)
		h.db.QueryRow(r.Context(), "SELECT COALESCE(SUM(total),0) FROM pos_orders WHERE property_id=? AND date(created_at)=? AND status != 'voided'", propertyID, ds).Scan(&posSales)
		var occ int
		h.db.QueryRow(r.Context(), "SELECT COUNT(*) FROM reservations WHERE property_id=? AND status='checked_in' AND check_in_date<=? AND check_out_date>?", propertyID, ds, ds).Scan(&occ)
		adr := 0.0
		if occ > 0 {
			adr = roomRev / float64(occ)
		}
		revpar := 0.0
		if totalRooms > 0 {
			revpar = (roomRev + posSales) / float64(totalRooms)
		}
		data = append(data, DayRev{Date: ds, RoomRev: roomRev, POSSales: posSales, Total: roomRev + posSales, ADR: math.Round(adr), RevPAR: math.Round(revpar)})
	}
	if data == nil {
		data = []DayRev{}
	}
	response.RespondSuccess(w, map[string]interface{}{"meta": reportMeta("Daily Revenue", fmt.Sprintf("Last %d days", days), len(data)), "data": data}, "Report retrieved")
}

// ── 7. Guest Demographics ──
func (h *Handler) ReportGuestDemographics(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	type NameCount struct {
		Name  string `json:"name"`
		Count int    `json:"count"`
	}
	var byNationality, byCompany, byGender []NameCount

	rows, _ := h.db.Query(r.Context(), `SELECT COALESCE(nationality,'Unknown'), COUNT(*) FROM guests WHERE property_id=? GROUP BY nationality ORDER BY COUNT(*) DESC LIMIT 20`, propertyID)
	if rows != nil {
		defer rows.Close()
		for rows.Next() {
			var d NameCount
			rows.Scan(&d.Name, &d.Count)
			byNationality = append(byNationality, d)
		}
	}
	rows2, _ := h.db.Query(r.Context(), `SELECT COALESCE(company,'Individual'), COUNT(*) FROM guests WHERE property_id=? GROUP BY company ORDER BY COUNT(*) DESC LIMIT 15`, propertyID)
	if rows2 != nil {
		defer rows2.Close()
		for rows2.Next() {
			var d NameCount
			rows2.Scan(&d.Name, &d.Count)
			byCompany = append(byCompany, d)
		}
	}
	rows3, _ := h.db.Query(r.Context(), `SELECT COALESCE(gender,'Unknown'), COUNT(*) FROM guests WHERE property_id=? GROUP BY gender`, propertyID)
	if rows3 != nil {
		defer rows3.Close()
		for rows3.Next() {
			var d NameCount
			rows3.Scan(&d.Name, &d.Count)
			byGender = append(byGender, d)
		}
	}
	if byNationality == nil {
		byNationality = []NameCount{}
	}
	if byCompany == nil {
		byCompany = []NameCount{}
	}
	if byGender == nil {
		byGender = []NameCount{}
	}
	response.RespondSuccess(w, map[string]interface{}{
		"meta":            reportMeta("Guest Demographics", "All time", len(byNationality)),
		"by_nationality":  byNationality,
		"by_company":      byCompany,
		"by_gender":       byGender,
	}, "Report retrieved")
}

// ── 8. Reservations by Source ──
func (h *Handler) ReportReservationsBySource(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	type Row struct {
		Source string  `json:"source"`
		Count  int     `json:"count"`
		Rev    float64 `json:"revenue"`
	}
	var data []Row
	n := 0
	rows, err := h.db.Query(r.Context(), `SELECT COALESCE(source,'Direct'), COUNT(*), COALESCE(SUM(total_amount),0) FROM reservations WHERE property_id=? AND check_in_date >= date('now','-30 days') GROUP BY source ORDER BY count DESC`, propertyID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var d Row
			rows.Scan(&d.Source, &d.Count, &d.Rev)
			data = append(data, d)
			n++
		}
	}
	if data == nil {
		data = []Row{}
	}
	response.RespondSuccess(w, map[string]interface{}{"meta": reportMeta("Reservations by Source", "Last 30 days", n), "data": data}, "Report retrieved")
}

// ── 9. Housekeeping Status ──
func (h *Handler) ReportHousekeepingStatus(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	type Row struct {
		Status string `json:"status"`
		Count  int    `json:"count"`
	}
	var data []Row
	n := 0
	rows, err := h.db.Query(r.Context(), `SELECT status, COUNT(*) FROM rooms WHERE property_id=? GROUP BY status ORDER BY COUNT(*) DESC`, propertyID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var d Row
			rows.Scan(&d.Status, &d.Count)
			data = append(data, d)
			n++
		}
	}
	if data == nil {
		data = []Row{}
	}
	response.RespondSuccess(w, map[string]interface{}{"meta": reportMeta("Housekeeping Status", "Current", n), "data": data}, "Report retrieved")
}

// ── 10. VIP Guests ──
func (h *Handler) ReportVIPGuests(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	type Row struct {
		Name        string  `json:"name"`
		Company     string  `json:"company"`
		Nationality string  `json:"nationality"`
		Stays       int     `json:"stays"`
		Spend       float64 `json:"total_spend"`
	}
	var data []Row
	n := 0
	rows, err := h.db.Query(r.Context(), `SELECT g.first_name||' '||g.last_name, COALESCE(g.company,''), COALESCE(g.nationality,''), COUNT(DISTINCT r.id), COALESCE(SUM(r.total_amount),0) FROM guests g JOIN reservations r ON r.guest_id=g.id WHERE r.property_id=? AND r.is_vip=1 GROUP BY g.id ORDER BY total_spend DESC LIMIT 50`, propertyID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var d Row
			rows.Scan(&d.Name, &d.Company, &d.Nationality, &d.Stays, &d.Spend)
			data = append(data, d)
			n++
		}
	}
	if data == nil {
		data = []Row{}
	}
	response.RespondSuccess(w, map[string]interface{}{"meta": reportMeta("VIP Guest Report", "All time", n), "data": data}, "Report retrieved")
}

// ── 11. Housekeeping Tasks ──
func (h *Handler) ReportHousekeepingTasks(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	type Row struct {
		Type   string `json:"task_type"`
		Status string `json:"status"`
		Count  int    `json:"count"`
	}
	var data []Row
	n := 0
	rows, err := h.db.Query(r.Context(), `SELECT task_type, status, COUNT(*) FROM housekeeping_tasks WHERE property_id=? GROUP BY task_type, status`, propertyID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var d Row
			rows.Scan(&d.Type, &d.Status, &d.Count)
			data = append(data, d)
			n++
		}
	}
	if data == nil {
		data = []Row{}
	}
	response.RespondSuccess(w, map[string]interface{}{"meta": reportMeta("Housekeeping Tasks", "Current", n), "data": data}, "Report retrieved")
}

// ── 12. No-Shows ──
func (h *Handler) ReportNoShows(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	type Row struct {
		Name    string  `json:"guest_name"`
		Date    string  `json:"arrival_date"`
		Source  string  `json:"source"`
		Amount  float64 `json:"estimated_revenue"`
	}
	var data []Row
	n := 0
	rows, err := h.db.Query(r.Context(), `SELECT g.first_name||' '||g.last_name, r.check_in_date, COALESCE(r.source,'Direct'), r.total_amount FROM reservations r JOIN guests g ON g.id=r.guest_id WHERE r.property_id=? AND r.status='no_show' ORDER BY r.check_in_date DESC`, propertyID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var d Row
			rows.Scan(&d.Name, &d.Date, &d.Source, &d.Amount)
			data = append(data, d)
			n++
		}
	}
	if data == nil {
		data = []Row{}
	}
	response.RespondSuccess(w, map[string]interface{}{"meta": reportMeta("No-Show Report", "All time", n), "data": data}, "Report retrieved")
}

// ── 13. Cancellations ──
func (h *Handler) ReportCancellations(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	var total, cancelled int
	h.db.QueryRow(r.Context(), "SELECT COUNT(*) FROM reservations WHERE property_id=?", propertyID).Scan(&total)
	h.db.QueryRow(r.Context(), "SELECT COUNT(*) FROM reservations WHERE property_id=? AND status='cancelled'", propertyID).Scan(&cancelled)
	rate := 0.0
	if total > 0 {
		rate = float64(cancelled) / float64(total) * 100
	}
	response.RespondSuccess(w, map[string]interface{}{
		"meta":                reportMeta("Cancellation Report", "All time", 1),
		"total_reservations":  total,
		"cancelled":           cancelled,
		"cancellation_rate":   math.Round(rate*100) / 100,
	}, "Report retrieved")
}

// ── 14. Departures ──
func (h *Handler) ReportDepartures(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	today := time.Now().Format("2006-01-02")
	type Row struct {
		Name      string  `json:"guest_name"`
		Room      string  `json:"room"`
		Departure string  `json:"departure"`
		Amount    float64 `json:"total_amount"`
		Balance   float64 `json:"balance"`
	}
	var data []Row
	n := 0
	rows, err := h.db.Query(r.Context(), `SELECT g.first_name||' '||g.last_name, COALESCE(r.room_id,''), r.check_out_date, r.total_amount, COALESCE(f.balance,0) FROM reservations r JOIN guests g ON g.id=r.guest_id LEFT JOIN folios f ON f.reservation_id=r.id WHERE r.property_id=? AND r.check_out_date=? AND r.status='checked_in'`, propertyID, today)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var d Row
			rows.Scan(&d.Name, &d.Room, &d.Departure, &d.Amount, &d.Balance)
			data = append(data, d)
			n++
		}
	}
	if data == nil {
		data = []Row{}
	}
	response.RespondSuccess(w, map[string]interface{}{"meta": reportMeta("Departure Report", today, n), "data": data}, "Report retrieved")
}

// ── 15. Arrivals ──
func (h *Handler) ReportArrivals(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	today := time.Now().Format("2006-01-02")
	type Row struct {
		Name   string  `json:"guest_name"`
		Room   string  `json:"room"`
		Arrival string `json:"arrival"`
		Amount float64 `json:"total_amount"`
		VIP    bool    `json:"is_vip"`
	}
	var data []Row
	n := 0
	rows, err := h.db.Query(r.Context(), `SELECT g.first_name||' '||g.last_name, COALESCE(r.room_id,''), r.check_in_date, r.total_amount, r.is_vip FROM reservations r JOIN guests g ON g.id=r.guest_id WHERE r.property_id=? AND r.check_in_date=? AND r.status IN ('confirmed','tentative')`, propertyID, today)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var d Row
			var vip int
			rows.Scan(&d.Name, &d.Room, &d.Arrival, &d.Amount, &vip)
			d.VIP = vip == 1
			data = append(data, d)
			n++
		}
	}
	if data == nil {
		data = []Row{}
	}
	response.RespondSuccess(w, map[string]interface{}{"meta": reportMeta("Arrival Report", today, n), "data": data}, "Report retrieved")
}

// ── 16. Guest Ledger / AR Aging ──
func (h *Handler) ReportGuestLedger(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	type Row struct {
		Name      string  `json:"guest_name"`
		ResID     string  `json:"reservation_id"`
		Room      string  `json:"room"`
		Balance   float64 `json:"balance"`
		Departure string  `json:"departure_date"`
	}
	var data []Row
	n := 0
	var totalBalance float64
	rows, err := h.db.Query(r.Context(), `SELECT g.first_name||' '||g.last_name, r.id, COALESCE(r.room_id,''), COALESCE(f.balance,0), r.check_out_date FROM reservations r JOIN guests g ON g.id=r.guest_id LEFT JOIN folios f ON f.reservation_id=r.id WHERE r.property_id=? AND COALESCE(f.balance,0) > 0 ORDER BY r.check_out_date`, propertyID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var d Row
			rows.Scan(&d.Name, &d.ResID, &d.Room, &d.Balance, &d.Departure)
			data = append(data, d)
			totalBalance += d.Balance
			n++
		}
	}
	if data == nil {
		data = []Row{}
	}
	response.RespondSuccess(w, map[string]interface{}{
		"meta":               reportMeta("Guest Ledger / AR Aging", "Outstanding", n),
		"total_outstanding":  totalBalance,
		"data":               data,
	}, "Report retrieved")
}

// ── 17. Inventory Summary ──
func (h *Handler) ReportInventorySummary(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	type Row struct {
		Name     string  `json:"name"`
		Category string  `json:"category"`
		Stock    float64 `json:"current_stock"`
		Unit     string  `json:"unit"`
		Cost     float64 `json:"cost_per_unit"`
		Value    float64 `json:"stock_value"`
	}
	var data []Row
	n := 0
	var totalValue float64
	rows, err := h.db.Query(r.Context(), `SELECT name, COALESCE(category,''), COALESCE(quantity,0), COALESCE(unit,''), unit_cost, quantity*unit_cost FROM inventory_items WHERE property_id=? ORDER BY category, name`, propertyID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var d Row
			rows.Scan(&d.Name, &d.Category, &d.Stock, &d.Unit, &d.Cost, &d.Value)
			data = append(data, d)
			totalValue += d.Value
			n++
		}
	}
	if data == nil {
		data = []Row{}
	}
	response.RespondSuccess(w, map[string]interface{}{
		"meta":              reportMeta("Inventory Summary", "Current", n),
		"total_stock_value": totalValue,
		"data":              data,
	}, "Report retrieved")
}

// ── 18. Low Stock ──
func (h *Handler) ReportLowStock(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	type Row struct {
		Name     string  `json:"name"`
		Category string  `json:"category"`
		Stock    float64 `json:"current_stock"`
		Unit     string  `json:"unit"`
		Reorder  float64 `json:"reorder_level"`
	}
	var data []Row
	n := 0
	rows, err := h.db.Query(r.Context(), `SELECT name, COALESCE(category,''), COALESCE(quantity,0), COALESCE(unit,''), COALESCE(reorder_level,0) FROM inventory_items WHERE property_id=? AND quantity <= reorder_level ORDER BY category, name`, propertyID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var d Row
			rows.Scan(&d.Name, &d.Category, &d.Stock, &d.Unit, &d.Reorder)
			data = append(data, d)
			n++
		}
	}
	if data == nil {
		data = []Row{}
	}
	response.RespondSuccess(w, map[string]interface{}{"meta": reportMeta("Low Stock Alert", "Current", n), "data": data}, "Report retrieved")
}

// ── 19. Employee Headcount ──
func (h *Handler) ReportEmployeeHeadcount(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	type Row struct {
		Dept   string `json:"department"`
		Status string `json:"status"`
		Count  int    `json:"count"`
	}
	var data []Row
	n := 0
	rows, err := h.db.Query(r.Context(), `SELECT COALESCE(department_id,'Unassigned'), employment_status, COUNT(*) FROM employees WHERE property_id=? GROUP BY department_id, employment_status ORDER BY department_id`, propertyID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var d Row
			rows.Scan(&d.Dept, &d.Status, &d.Count)
			data = append(data, d)
			n++
		}
	}
	if data == nil {
		data = []Row{}
	}
	response.RespondSuccess(w, map[string]interface{}{"meta": reportMeta("Employee Headcount", "Current", n), "data": data}, "Report retrieved")
}

// ── 20. Payroll Summary ──
func (h *Handler) ReportPayrollSummary(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	type Row struct {
		Dept  string  `json:"department"`
		Count int     `json:"headcount"`
		Total float64 `json:"total_salary"`
		Avg   float64 `json:"avg_salary"`
	}
	var data []Row
	n := 0
	var grandTotal float64
	rows, err := h.db.Query(r.Context(), `SELECT COALESCE(department_id,'Unassigned'), COUNT(*), COALESCE(SUM(salary),0), COALESCE(AVG(salary),0) FROM employees WHERE property_id=? AND employment_status='active' GROUP BY department_id ORDER BY total_salary DESC`, propertyID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var d Row
			rows.Scan(&d.Dept, &d.Count, &d.Total, &d.Avg)
			data = append(data, d)
			grandTotal += d.Total
			n++
		}
	}
	if data == nil {
		data = []Row{}
	}
	response.RespondSuccess(w, map[string]interface{}{
		"meta":                reportMeta("Payroll Summary", "Active employees", n),
		"grand_total_salary": grandTotal,
		"data":                data,
	}, "Report retrieved")
}

// ── 21. Attendance ──
func (h *Handler) ReportAttendance(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	type Row struct {
		Date    string `json:"date"`
		Total   int    `json:"total"`
		Present int    `json:"present"`
		Late    int    `json:"late"`
		Absent  int    `json:"absent"`
	}
	var data []Row
	n := 0
	rows, err := h.db.Query(r.Context(), `SELECT record_date, COUNT(*), SUM(CASE WHEN status='present' THEN 1 ELSE 0 END), SUM(CASE WHEN status='late' THEN 1 ELSE 0 END), SUM(CASE WHEN status='absent' THEN 1 ELSE 0 END) FROM attendance_records WHERE property_id=? GROUP BY record_date ORDER BY record_date DESC LIMIT 30`, propertyID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var d Row
			rows.Scan(&d.Date, &d.Total, &d.Present, &d.Late, &d.Absent)
			data = append(data, d)
			n++
		}
	}
	if data == nil {
		data = []Row{}
	}
	response.RespondSuccess(w, map[string]interface{}{"meta": reportMeta("Attendance Report", "Last 30 days", n), "data": data}, "Report retrieved")
}

// ── 22. Leave Summary ──
func (h *Handler) ReportLeaveSummary(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	type Row struct {
		Status string  `json:"status"`
		Count  int     `json:"count"`
		Days   float64 `json:"total_days"`
	}
	var data []Row
	n := 0
	rows, err := h.db.Query(r.Context(), `SELECT status, COUNT(*), COALESCE(SUM(days_requested),0) FROM leave_requests WHERE property_id=? GROUP BY status`, propertyID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var d Row
			rows.Scan(&d.Status, &d.Count, &d.Days)
			data = append(data, d)
			n++
		}
	}
	if data == nil {
		data = []Row{}
	}
	response.RespondSuccess(w, map[string]interface{}{"meta": reportMeta("Leave Summary", "Current", n), "data": data}, "Report retrieved")
}

// ── 23. Loyalty ──
func (h *Handler) ReportLoyalty(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	type Row struct {
		Tier    string  `json:"tier"`
		Members int     `json:"members"`
		Points  float64 `json:"total_points"`
	}
	var data []Row
	n := 0
	rows, err := h.db.Query(r.Context(), `SELECT COALESCE(tier,'Bronze'), COUNT(*), COALESCE(SUM(points_balance),0) FROM loyalty_accounts WHERE property_id=? GROUP BY tier ORDER BY total_points DESC`, propertyID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var d Row
			rows.Scan(&d.Tier, &d.Members, &d.Points)
			data = append(data, d)
			n++
		}
	}
	if data == nil {
		data = []Row{}
	}
	response.RespondSuccess(w, map[string]interface{}{"meta": reportMeta("Loyalty Program", "Current", n), "data": data}, "Report retrieved")
}

// ── 24. Event Revenue ──
func (h *Handler) ReportEventRevenue(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	type Row struct {
		Name   string  `json:"name"`
		Type   string  `json:"event_type"`
		Date   string  `json:"start_date"`
		Amount float64 `json:"amount"`
		Status string  `json:"status"`
	}
	var data []Row
	n := 0
	rows, err := h.db.Query(r.Context(), `SELECT name, COALESCE(event_type,''), COALESCE(start_date,''), COALESCE(total_amount,0), COALESCE(status,'planned') FROM events WHERE property_id=? ORDER BY start_date DESC LIMIT 50`, propertyID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var d Row
			rows.Scan(&d.Name, &d.Type, &d.Date, &d.Amount, &d.Status)
			data = append(data, d)
			n++
		}
	}
	if data == nil {
		data = []Row{}
	}
	response.RespondSuccess(w, map[string]interface{}{"meta": reportMeta("Event Revenue", "All time", n), "data": data}, "Report retrieved")
}

// ── 25. Occupancy Forecast ──
func (h *Handler) ReportOccupancyForecast(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	var totalRooms int
	h.db.QueryRow(r.Context(), "SELECT COUNT(*) FROM rooms WHERE property_id=?", propertyID).Scan(&totalRooms)

	type ForecastDay struct {
		Date    string  `json:"date"`
		Booked  int     `json:"booked"`
		OccRate float64 `json:"forecast_occupancy"`
		Revenue float64 `json:"expected_revenue"`
	}
	var data []ForecastDay
	today := time.Now()
	for i := 0; i < 30; i++ {
		d := today.AddDate(0, 0, i)
		ds := d.Format("2006-01-02")
		var booked int
		var rev float64
		h.db.QueryRow(r.Context(), "SELECT COUNT(*) FROM reservations WHERE property_id=? AND check_in_date<=? AND check_out_date>? AND status IN ('confirmed','checked_in')", propertyID, ds, ds).Scan(&booked)
		h.db.QueryRow(r.Context(), "SELECT COALESCE(SUM(total_amount),0) FROM reservations WHERE property_id=? AND check_in_date<=? AND check_out_date>? AND status IN ('confirmed','checked_in')", propertyID, ds, ds).Scan(&rev)
		rate := 0.0
		if totalRooms > 0 {
			rate = float64(booked) / float64(totalRooms) * 100
		}
		data = append(data, ForecastDay{Date: ds, Booked: booked, OccRate: math.Round(rate*100) / 100, Revenue: rev})
	}
	if data == nil {
		data = []ForecastDay{}
	}
	response.RespondSuccess(w, map[string]interface{}{
		"meta":        reportMeta("Occupancy Forecast", "Next 30 days", len(data)),
		"total_rooms": totalRooms,
		"data":        data,
	}, "Report retrieved")
}
