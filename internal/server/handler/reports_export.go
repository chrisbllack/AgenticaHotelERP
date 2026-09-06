package handler

import (
	"encoding/csv"
	"fmt"
	"math"
	"net/http"
	"sort"
	"time"

	"github.com/go-chi/chi/v5"
)

// ═══════════════════════════════════════════════════════════════
// REPORTS EXPORT & EXECUTIVE DASHBOARD
// ═══════════════════════════════════════════════════════════════

// ExecutiveDashboard returns a single aggregate with all KPIs for the executive summary page.
func (h *Handler) ExecutiveDashboard(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()

	// Total rooms
	var totalRooms, occupied, available, dirty, ooo, reserved int
	h.db.QueryRow(ctx, `SELECT COUNT(*) FROM rooms WHERE property_id=?`, propertyID).Scan(&totalRooms)
	h.db.QueryRow(ctx, `SELECT COUNT(*) FROM rooms WHERE property_id=? AND status='occupied'`, propertyID).Scan(&occupied)
	h.db.QueryRow(ctx, `SELECT COUNT(*) FROM rooms WHERE property_id=? AND status='available'`, propertyID).Scan(&available)
	h.db.QueryRow(ctx, `SELECT COUNT(*) FROM rooms WHERE property_id=? AND status='dirty'`, propertyID).Scan(&dirty)
	h.db.QueryRow(ctx, `SELECT COUNT(*) FROM rooms WHERE property_id=? AND status IN ('out_of_order','out_of_service')`, propertyID).Scan(&ooo)
	h.db.QueryRow(ctx, `SELECT COUNT(*) FROM rooms WHERE property_id=? AND status='reserved'`, propertyID).Scan(&reserved)

	occRate := 0.0
	if totalRooms > 0 {
		occRate = float64(occupied) / float64(totalRooms) * 100
	}

	// Today's revenue
	var todayRevenue float64
	h.db.QueryRow(ctx, `SELECT COALESCE(SUM(total_amount),0) FROM reservations WHERE property_id=? AND status IN ('checked_in','checked_out') AND date(check_in_date)=date('now')`, propertyID).Scan(&todayRevenue)

	// Month revenue
	var monthRevenue, monthRoomRev, monthPOSRev float64
	h.db.QueryRow(ctx, `SELECT COALESCE(SUM(total_amount),0) FROM reservations WHERE property_id=? AND status IN ('checked_in','checked_out') AND check_in_date >= date('now','start of month')`, propertyID).Scan(&monthRoomRev)
	h.db.QueryRow(ctx, `SELECT COALESCE(SUM(total_amount),0) FROM pos_orders WHERE property_id=? AND created_at >= date('now','start of month')`, propertyID).Scan(&monthPOSRev)
	monthRevenue = monthRoomRev + monthPOSRev

	// ADR & RevPAR
	adr := 0.0
	revpar := 0.0
	var roomsSoldMonth int
	h.db.QueryRow(ctx, `SELECT COUNT(*) FROM reservations WHERE property_id=? AND status IN ('checked_in','checked_out') AND check_in_date >= date('now','start of month')`, propertyID).Scan(&roomsSoldMonth)
	if roomsSoldMonth > 0 {
		adr = monthRoomRev / float64(roomsSoldMonth)
	}
	if totalRooms > 0 {
		revpar = monthRevenue / float64(totalRooms)
	}

	// Outstanding AR
	var outstandingAR float64
	h.db.QueryRow(ctx, `SELECT COALESCE(SUM(balance),0) FROM folios WHERE property_id=? AND balance > 0`, propertyID).Scan(&outstandingAR)

	// Guests in house
	var guestsInHouse, todayArrivals, todayDepartures int
	h.db.QueryRow(ctx, `SELECT COUNT(*) FROM reservations WHERE property_id=? AND status='checked_in'`, propertyID).Scan(&guestsInHouse)
	h.db.QueryRow(ctx, `SELECT COUNT(*) FROM reservations WHERE property_id=? AND status='confirmed' AND date(check_in_date)=date('now')`, propertyID).Scan(&todayArrivals)
	h.db.QueryRow(ctx, `SELECT COUNT(*) FROM reservations WHERE property_id=? AND status='checked_in' AND date(check_out_date)=date('now')`, propertyID).Scan(&todayDepartures)

	// Employees
	var totalEmployees, activeEmployees int
	h.db.QueryRow(ctx, `SELECT COUNT(*) FROM employees WHERE property_id=?`, propertyID).Scan(&totalEmployees)
	h.db.QueryRow(ctx, `SELECT COUNT(*) FROM employees WHERE property_id=? AND employment_status='active'`, propertyID).Scan(&activeEmployees)

	// Reservations by source (last 30 days)
	type SourceStat struct {
		Source      string  `json:"source"`
		Bookings    int     `json:"bookings"`
		Revenue     float64 `json:"revenue"`
		AverageRate float64 `json:"average_rate"`
	}
	var sourceStats []SourceStat
	rows, err := h.db.Query(ctx, `SELECT COALESCE(source,'Direct'), COUNT(*), COALESCE(SUM(total_amount),0) FROM reservations WHERE property_id=? AND check_in_date >= date('now','-30 days') GROUP BY source ORDER BY revenue DESC`, propertyID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var s SourceStat
			rows.Scan(&s.Source, &s.Bookings, &s.Revenue)
			if s.Bookings > 0 {
				s.AverageRate = s.Revenue / float64(s.Bookings)
			}
			sourceStats = append(sourceStats, s)
		}
	}
	if sourceStats == nil {
		sourceStats = []SourceStat{}
	}

	// Revenue by department (last 30 days)
	type DeptRevenue struct {
		Department string  `json:"department"`
		Revenue    float64 `json:"revenue"`
		TxnCount   int     `json:"transaction_count"`
	}
	var deptRevenue []DeptRevenue
	rows2, err := h.db.Query(ctx, `SELECT COALESCE(department,'Unallocated'), COALESCE(SUM(amount),0), COUNT(*) FROM folio_lines fl JOIN folios f ON fl.folio_id=f.id WHERE f.property_id=? AND fl.posted_at >= date('now','-30 days') GROUP BY department ORDER BY revenue DESC`, propertyID)
	if err == nil {
		defer rows2.Close()
		for rows2.Next() {
			var d DeptRevenue
			rows2.Scan(&d.Department, &d.Revenue, &d.TxnCount)
			deptRevenue = append(deptRevenue, d)
		}
	}
	if deptRevenue == nil {
		deptRevenue = []DeptRevenue{}
	}

	// Occupancy trend (last 14 days)
	type TrendDay struct {
		Date          string  `json:"date"`
		OccupancyRate float64 `json:"occupancy_rate"`
		Revenue       float64 `json:"revenue"`
	}
	var trend []TrendDay
	for i := 13; i >= 0; i-- {
		var dayOcc, dayTotal int
		var dayRev float64
		h.db.QueryRow(ctx, `SELECT COUNT(*) FROM rooms WHERE property_id=? AND status='occupied'`, propertyID).Scan(&dayOcc)
		h.db.QueryRow(ctx, `SELECT COUNT(*) FROM rooms WHERE property_id=?`, propertyID).Scan(&dayTotal)
		h.db.QueryRow(ctx, `SELECT COALESCE(SUM(total_amount),0) FROM reservations WHERE property_id=? AND status IN ('checked_in','checked_out') AND date(check_in_date)=date('now',?||' days')`, propertyID, fmt.Sprintf("-%d", i)).Scan(&dayRev)
		rate := 0.0
		if dayTotal > 0 {
			rate = float64(dayOcc) / float64(dayTotal) * 100
		}
		trend = append(trend, TrendDay{
			Date:          time.Now().AddDate(0, 0, -i).Format("2006-01-02"),
			OccupancyRate: math.Round(rate*100) / 100,
			Revenue:       dayRev,
		})
	}

	// Top 5 paying guests
	type TopGuest struct {
		GuestName   string  `json:"guest_name"`
		TotalStay   float64 `json:"total_stay_value"`
		Nights      int     `json:"nights"`
		Visits      int     `json:"visits"`
	}
	var topGuests []TopGuest
	rows3, err := h.db.Query(ctx, `SELECT g.first_name || ' ' || g.last_name, COALESCE(SUM(r.total_amount),0), COALESCE(SUM(r.nights),0), COUNT(DISTINCT r.id) FROM reservations r JOIN guests g ON r.guest_id=g.id WHERE r.property_id=? GROUP BY g.id ORDER BY total_stay_value DESC LIMIT 5`, propertyID)
	if err == nil {
		defer rows3.Close()
		for rows3.Next() {
			var tg TopGuest
			rows3.Scan(&tg.GuestName, &tg.TotalStay, &tg.Nights, &tg.Visits)
			topGuests = append(topGuests, tg)
		}
	}
	if topGuests == nil {
		topGuests = []TopGuest{}
	}

	// Pending tasks / traces
	var openTraces, urgentTraces int
	h.db.QueryRow(ctx, `SELECT COUNT(*) FROM traces WHERE property_id=? AND status != 'completed'`, propertyID).Scan(&openTraces)
	h.db.QueryRow(ctx, `SELECT COUNT(*) FROM traces WHERE property_id=? AND status != 'completed' AND priority IN ('urgent','critical')`, propertyID).Scan(&urgentTraces)

	// Channel performance
	type ChannelPerf struct {
		Name       string  `json:"name"`
		Bookings   int     `json:"bookings"`
		Revenue    float64 `json:"revenue"`
		LastSync   string  `json:"last_sync"`
		Status     string  `json:"status"`
	}
	var channelPerf []ChannelPerf
	rows4, err := h.db.Query(ctx, `SELECT c.name, COUNT(cb.id), COALESCE(SUM(cb.total_amount),0), COALESCE(c.last_sync_at,'Never'), c.status FROM channels c LEFT JOIN channel_bookings cb ON c.id=cb.channel_id WHERE c.property_id=? GROUP BY c.id ORDER BY revenue DESC`, propertyID)
	if err == nil {
		defer rows4.Close()
		for rows4.Next() {
			var cp ChannelPerf
			rows4.Scan(&cp.Name, &cp.Bookings, &cp.Revenue, &cp.LastSync, &cp.Status)
			channelPerf = append(channelPerf, cp)
		}
	}
	if channelPerf == nil {
		channelPerf = []ChannelPerf{}
	}

	jsonSuccess(w, map[string]interface{}{
		"overview": map[string]interface{}{
			"total_rooms":       totalRooms,
			"occupied":          occupied,
			"available":         available,
			"dirty":             dirty,
			"out_of_order":      ooo,
			"reserved":          reserved,
			"occupancy_rate":    math.Round(occRate*100) / 100,
			"adr":               math.Round(adr*100) / 100,
			"revpar":            math.Round(revpar*100) / 100,
			"today_revenue":     todayRevenue,
			"month_revenue":     monthRevenue,
			"month_room_revenue": monthRoomRev,
			"month_pos_revenue":  monthPOSRev,
			"outstanding_ar":    outstandingAR,
			"guests_in_house":   guestsInHouse,
			"today_arrivals":    todayArrivals,
			"today_departures":  todayDepartures,
			"total_employees":   totalEmployees,
			"active_employees":  activeEmployees,
			"open_traces":       openTraces,
			"urgent_traces":     urgentTraces,
		},
		"occupancy_trend":  trend,
		"revenue_by_source": sourceStats,
		"revenue_by_department": deptRevenue,
		"top_guests":       topGuests,
		"channels":         channelPerf,
		"generated":        time.Now().Format(time.RFC3339),
	})
}

// ExportReportCSV generates a CSV file from any report's data.
func (h *Handler) ExportReportCSV(w http.ResponseWriter, r *http.Request) {
	reportType := r.URL.Query().Get("type")
	if reportType == "" {
		reportType = "occupancy"
	}
	propertyID := getPropertyID(r)
	ctx := r.Context()

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s-report-%s.csv", reportType, time.Now().Format("2006-01-02")))

	writer := csv.NewWriter(w)
	defer writer.Flush()

	switch reportType {
	case "occupancy":
		writer.Write([]string{"Date", "Total Rooms", "Occupied", "Available", "Reserved", "OOO", "Occupancy %"})
		var totalRooms int
		h.db.QueryRow(ctx, `SELECT COUNT(*) FROM rooms WHERE property_id=?`, propertyID).Scan(&totalRooms)
		for i := 29; i >= 0; i-- {
			date := time.Now().AddDate(0, 0, -i).Format("2006-01-02")
			var occ, avail, res, ooo int
			h.db.QueryRow(ctx, `SELECT COUNT(*) FROM rooms WHERE property_id=? AND status='occupied'`, propertyID).Scan(&occ)
			h.db.QueryRow(ctx, `SELECT COUNT(*) FROM rooms WHERE property_id=? AND status='available'`, propertyID).Scan(&avail)
			h.db.QueryRow(ctx, `SELECT COUNT(*) FROM rooms WHERE property_id=? AND status='reserved'`, propertyID).Scan(&res)
			h.db.QueryRow(ctx, `SELECT COUNT(*) FROM rooms WHERE property_id=? AND status IN ('out_of_order','out_of_service')`, propertyID).Scan(&ooo)
			occPct := 0.0
			if totalRooms > 0 {
				occPct = float64(occ) / float64(totalRooms) * 100
			}
			writer.Write([]string{date, itoa(totalRooms), itoa(occ), itoa(avail), itoa(res), itoa(ooo), fmt.Sprintf("%.1f", occPct)})
		}

	case "revenue":
		writer.Write([]string{"Room Type", "Rooms Sold", "Revenue (NGN)", "Avg Rate", "Tax"})
		rows, err := h.db.Query(ctx, `SELECT rt.name, COUNT(r.id), COALESCE(SUM(r.total_amount),0), COALESCE(AVG(r.total_amount),0) FROM reservations r JOIN room_types rt ON r.room_type_id=rt.id WHERE r.property_id=? AND r.status IN ('checked_in','checked_out') AND r.check_in_date >= date('now','-30 days') GROUP BY rt.id ORDER BY revenue DESC`, propertyID)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var name string
				var sold int
				var rev, avg float64
				rows.Scan(&name, &sold, &rev, &avg)
				writer.Write([]string{name, itoa(sold), fmt.Sprintf("%.2f", rev), fmt.Sprintf("%.2f", avg), fmt.Sprintf("%.2f", rev*0.075)})
			}
		}

	case "pos-sales":
		writer.Write([]string{"Outlet", "Orders", "Total Sales (NGN)", "Avg Check", "Discounts"})
		rows, err := h.db.Query(ctx, `SELECT COALESCE(outlet,'Restaurant'), COUNT(*), COALESCE(SUM(total),0), COALESCE(AVG(total),0), COALESCE(SUM(discount),0) FROM pos_orders WHERE property_id=? AND created_at >= date('now','-30 days') GROUP BY outlet ORDER BY total_sales DESC`, propertyID)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var outlet string
				var orders int
				var total, avg, disc float64
				rows.Scan(&outlet, &orders, &total, &avg, &disc)
				writer.Write([]string{outlet, itoa(orders), fmt.Sprintf("%.2f", total), fmt.Sprintf("%.2f", avg), fmt.Sprintf("%.2f", disc)})
			}
		}

	case "guests":
		writer.Write([]string{"Guest Name", "Email", "Phone", "Nationality", "Total Stays", "Total Revenue"})
		rows, err := h.db.Query(ctx, `SELECT g.first_name||' '||g.last_name, g.email, g.phone, COALESCE(g.nationality,''), COUNT(r.id), COALESCE(SUM(r.total_amount),0) FROM guests g LEFT JOIN reservations r ON g.id=r.guest_id WHERE g.property_id=? GROUP BY g.id ORDER BY total_revenue DESC`, propertyID)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var name, email, phone, nat string
				var stays int
				var rev float64
				rows.Scan(&name, &email, &phone, &nat, &stays, &rev)
				writer.Write([]string{name, email, phone, nat, itoa(stays), fmt.Sprintf("%.2f", rev)})
			}
		}

	case "employees":
		writer.Write([]string{"Employee ID", "First Name", "Last Name", "Department", "Position", "Status", "Hire Date"})
		rows, err := h.db.Query(ctx, `SELECT employee_id, first_name, last_name, COALESCE(department_id,''), COALESCE(position,''), employment_status, employment_date FROM employees WHERE property_id=? ORDER BY first_name`, propertyID)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var empID, first, last, dept, pos, status, hireDate string
				rows.Scan(&empID, &first, &last, &dept, &pos, &status, &hireDate)
				writer.Write([]string{empID, first, last, dept, pos, status, hireDate})
			}
		}

	case "inventory":
		writer.Write([]string{"Item Name", "Category", "Quantity", "Unit", "Unit Cost", "Total Value", "Reorder Level"})
		rows, err := h.db.Query(ctx, `SELECT name, COALESCE(category,''), quantity, COALESCE(unit,''), unit_cost, quantity*unit_cost, COALESCE(reorder_level,0) FROM inventory_items WHERE property_id=? ORDER BY category, name`, propertyID)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var name, cat, unit string
				var qty int
				var cost, totalVal, reorder float64
				rows.Scan(&name, &cat, &qty, &unit, &cost, &totalVal, &reorder)
				writer.Write([]string{name, cat, itoa(qty), unit, fmt.Sprintf("%.2f", cost), fmt.Sprintf("%.2f", totalVal), fmt.Sprintf("%.0f", reorder)})
			}
		}

	case "financial":
		writer.Write([]string{"Account", "Type", "Debit", "Credit", "Balance"})
		rows, err := h.db.Query(ctx, `SELECT COALESCE(description,'Unknown'), COALESCE(type,'expense'), COALESCE(SUM(debit),0), COALESCE(SUM(credit),0), COALESCE(SUM(debit)-SUM(credit),0) FROM folio_lines fl JOIN folios f ON fl.folio_id=f.id WHERE f.property_id=? GROUP BY description, type ORDER BY ABS(SUM(debit)-SUM(credit)) DESC`, propertyID)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var acct, typ string
				var debit, credit, bal float64
				rows.Scan(&acct, &typ, &debit, &credit, &bal)
				writer.Write([]string{acct, typ, fmt.Sprintf("%.2f", debit), fmt.Sprintf("%.2f", credit), fmt.Sprintf("%.2f", bal)})
			}
		}

	default:
		writer.Write([]string{"Error", "Unknown report type: " + reportType})
	}
}

// ExportReportPDF generates a simple HTML-to-print report (browser can print to PDF).
func (h *Handler) ExportReportPDF(w http.ResponseWriter, r *http.Request) {
	reportType := r.URL.Query().Get("type")
	if reportType == "" {
		reportType = "executive"
	}
	propertyID := getPropertyID(r)
	ctx := r.Context()

	var totalRooms, occupied int
	var monthRevenue, adr float64
	h.db.QueryRow(ctx, `SELECT COUNT(*) FROM rooms WHERE property_id=?`, propertyID).Scan(&totalRooms)
	h.db.QueryRow(ctx, `SELECT COUNT(*) FROM rooms WHERE property_id=? AND status='occupied'`, propertyID).Scan(&occupied)
	h.db.QueryRow(ctx, `SELECT COALESCE(SUM(total_amount),0) FROM reservations WHERE property_id=? AND status IN ('checked_in','checked_out') AND check_in_date >= date('now','start of month')`, propertyID).Scan(&monthRevenue)

	occRate := 0.0
	if totalRooms > 0 {
		occRate = float64(occupied) / float64(totalRooms) * 100
	}
	var roomsSold int
	h.db.QueryRow(ctx, `SELECT COUNT(*) FROM reservations WHERE property_id=? AND status IN ('checked_in','checked_out') AND check_in_date >= date('now','start of month')`, propertyID).Scan(&roomsSold)
	if roomsSold > 0 {
		adr = monthRevenue / float64(roomsSold)
	}

	title := "Executive Summary"
	switch reportType {
	case "occupancy":
		title = "Occupancy Report"
	case "revenue":
		title = "Revenue Report"
	case "pos-sales":
		title = "POS Sales Report"
	case "hr":
		title = "HR & Payroll Report"
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf("inline; filename=%s-%s.html", reportType, time.Now().Format("2006-01-02")))

	fmt.Fprintf(w, `<!DOCTYPE html><html><head><meta charset="utf-8"><title>%s</title>
<style>
body{font-family:Arial,sans-serif;margin:40px;color:#333}
h1{color:#1a365d;border-bottom:3px solid #2563eb;padding-bottom:8px}
h2{color:#2563eb;margin-top:24px}
.kpi{display:inline-block;background:#f0f9ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px 24px;margin:8px;text-align:center;min-width:140px}
.kpi .val{font-size:28px;font-weight:bold;color:#1e40af}
.kpi .lbl{font-size:12px;color:#64748b;margin-top:4px}
table{width:100%%;border-collapse:collapse;margin:16px 0}
th{background:#1e40af;color:white;padding:10px 12px;text-align:left;font-size:13px}
td{padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:13px}
tr:hover{background:#f8fafc}
@media print{.no-print{display:none}}
.footer{margin-top:40px;font-size:11px;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0;padding-top:12px}
</style></head><body>
<h1>🏨 INFINEON — %s</h1>
<p>Property: Grand Palm Hotel Lagos | Generated: %s | Currency: NGN (₦)</p>
<div class="no-print"><button onclick="window.print()">🖨️ Print / Save as PDF</button></div>
<h2>Key Performance Indicators</h2>
<div class="kpi"><div class="val">%d</div><div class="lbl">Total Rooms</div></div>
<div class="kpi"><div class="val">%d</div><div class="lbl">Occupied</div></div>
<div class="kpi"><div class="val">%.1f%%</div><div class="lbl">Occupancy</div></div>
<div class="kpi"><div class="val">₦%.0f</div><div class="lbl">ADR</div></div>
<div class="kpi"><div class="val">₦%.0f</div><div class="lbl">Month Revenue</div></div>
`, title, title, time.Now().Format("January 2, 2006 15:04"), totalRooms, occupied, occRate, adr, monthRevenue)

	// Add source breakdown
	fmt.Fprintf(w, `<h2>Revenue by Source (Last 30 Days)</h2><table><tr><th>Source</th><th>Bookings</th><th>Revenue</th><th>Avg Rate</th></tr>`)
	rows, err := h.db.Query(ctx, `SELECT COALESCE(source,'Direct'), COUNT(*), COALESCE(SUM(total_amount),0) FROM reservations WHERE property_id=? AND check_in_date >= date('now','-30 days') GROUP BY source ORDER BY revenue DESC`, propertyID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var src string
			var bkgs int
			var rev float64
			rows.Scan(&src, &bkgs, &rev)
			avg := 0.0
			if bkgs > 0 {
				avg = rev / float64(bkgs)
			}
			fmt.Fprintf(w, `<tr><td>%s</td><td>%d</td><td>₦%.0f</td><td>₦%.0f</td></tr>`, src, bkgs, rev, avg)
		}
	}
	fmt.Fprintf(w, `</table>`)

	// Department revenue
	fmt.Fprintf(w, `<h2>Revenue by Department</h2><table><tr><th>Department</th><th>Revenue</th><th>Transactions</th></tr>`)
	rows2, err := h.db.Query(ctx, `SELECT COALESCE(department,'Unallocated'), COALESCE(SUM(amount),0), COUNT(*) FROM folio_lines fl JOIN folios f ON fl.folio_id=f.id WHERE f.property_id=? AND fl.posted_at >= date('now','-30 days') GROUP BY department ORDER BY revenue DESC`, propertyID)
	if err == nil {
		defer rows2.Close()
		for rows2.Next() {
			var dept string
			var rev float64
			var txns int
			rows2.Scan(&dept, &rev, &txns)
			fmt.Fprintf(w, `<tr><td>%s</td><td>₦%.0f</td><td>%d</td></tr>`, dept, rev, txns)
		}
	}
	fmt.Fprintf(w, `</table>`)

	fmt.Fprintf(w, `<div class="footer">INFINEON Hospitality Enterprise Suite — Confidential | © %d Freebuff Technology</div></body></html>`, time.Now().Year())
}

// DepartmentReport generates reports filtered by department.
func (h *Handler) DepartmentReport(w http.ResponseWriter, r *http.Request) {
	department := chi.URLParam(r, "department")
	propertyID := getPropertyID(r)
	ctx := r.Context()

	result := map[string]interface{}{
		"department":    department,
		"property_id":   propertyID,
		"generated":     time.Now().Format(time.RFC3339),
		"date_range":    "Last 30 days",
	}

	// Staff in department
	type StaffMember struct {
		EmployeeID string `json:"employee_id"`
		FirstName  string `json:"first_name"`
		LastName   string `json:"last_name"`
		Position   string `json:"position"`
		Status     string `json:"status"`
	}
	var staff []StaffMember
	rows, err := h.db.Query(ctx, `SELECT employee_id, first_name, last_name, COALESCE(position,''), employment_status FROM employees WHERE property_id=? AND department_id=? ORDER BY first_name`, propertyID, department)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var sm StaffMember
			rows.Scan(&sm.EmployeeID, &sm.FirstName, &sm.LastName, &sm.Position, &sm.Status)
			staff = append(staff, sm)
		}
	}
	if staff == nil {
		staff = []StaffMember{}
	}
	result["staff"] = staff
	result["headcount"] = len(staff)

	// Department folio charges
	type DeptCharge struct {
		Date        string  `json:"date"`
		Description string  `json:"description"`
		Amount      float64 `json:"amount"`
		Guest       string  `json:"guest_name"`
	}
	var charges []DeptCharge
	rows2, err := h.db.Query(ctx, `SELECT date(fl.posted_at), fl.description, fl.amount, COALESCE(g.first_name||' '||g.last_name,'') FROM folio_lines fl JOIN folios f ON fl.folio_id=f.id LEFT JOIN guests g ON f.guest_id=g.id WHERE f.property_id=? AND fl.department=? AND fl.posted_at >= date('now','-30 days') ORDER BY fl.posted_at DESC LIMIT 50`, propertyID, department)
	if err == nil {
		defer rows2.Close()
		for rows2.Next() {
			var dc DeptCharge
			rows2.Scan(&dc.Date, &dc.Description, &dc.Amount, &dc.Guest)
			charges = append(charges, dc)
		}
	}
	if charges == nil {
		charges = []DeptCharge{}
	}
	result["charges"] = charges

	// Department revenue total
	var deptRevenue float64
	h.db.QueryRow(ctx, `SELECT COALESCE(SUM(fl.amount),0) FROM folio_lines fl JOIN folios f ON fl.folio_id=f.id WHERE f.property_id=? AND fl.department=? AND fl.posted_at >= date('now','-30 days')`, propertyID, department).Scan(&deptRevenue)
	result["total_revenue"] = deptRevenue

	jsonSuccess(w, result)
}

// ListDepartmentsOverview returns all departments with their stats.
func (h *Handler) ListDepartmentsOverview(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()

	type DeptOverview struct {
		Name      string  `json:"name"`
		Headcount int     `json:"headcount"`
		Revenue   float64 `json:"revenue_30d"`
		Tasks     int     `json:"open_tasks"`
	}
	var depts []DeptOverview

	// Get unique departments from employees
	seen := map[string]bool{}
	rows, err := h.db.Query(ctx, `SELECT DISTINCT department_id FROM employees WHERE property_id=? AND department_id != ''`, propertyID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var dept string
			rows.Scan(&dept)
			if dept != "" && !seen[dept] {
				seen[dept] = true
				var do DeptOverview
				do.Name = dept
				h.db.QueryRow(ctx, `SELECT COUNT(*) FROM employees WHERE property_id=? AND department_id=?`, propertyID, dept).Scan(&do.Headcount)
				h.db.QueryRow(ctx, `SELECT COALESCE(SUM(fl.amount),0) FROM folio_lines fl JOIN folios f ON fl.folio_id=f.id WHERE f.property_id=? AND fl.department=? AND fl.posted_at >= date('now','-30 days')`, propertyID, dept).Scan(&do.Revenue)
				h.db.QueryRow(ctx, `SELECT COUNT(*) FROM traces WHERE property_id=? AND department=? AND status != 'completed'`, propertyID, dept).Scan(&do.Tasks)
				depts = append(depts, do)
			}
		}
	}
	if depts == nil {
		depts = []DeptOverview{}
	}
	sort.Slice(depts, func(i, j int) bool { return depts[i].Revenue > depts[j].Revenue })
	jsonSuccess(w, depts)
}


