package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"infineon/internal/auth"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// resolveStringUserID resolves a JWT UUID-based user_id back to the original string user_id.
// The auth handler generates: uuid.NewSHA1(uuid.NameSpaceURL, []byte("user:"+stringID))
func (h *Handler) resolveStringUserID(ctx context.Context, claims *auth.Claims) string {
	if claims == nil {
		return ""
	}
	userUUID := claims.UserID.String()
	// Get all distinct string user_ids from users table
	rows, err := h.db.Query(ctx, `SELECT id FROM users WHERE id LIKE 'usr-%' OR id LIKE '00000000%'`)
	if err != nil {
		return ""
	}
	defer rows.Close()
	for rows.Next() {
		var uid string
		rows.Scan(&uid)
		derived := uuid.NewSHA1(uuid.NameSpaceURL, []byte("user:"+uid))
		if derived.String() == userUUID {
			return uid
		}
	}
	return ""
}

// resolveEmployeeID resolves JWT claims → string user_id → employee ID
func (h *Handler) resolveEmployeeID(ctx context.Context, propertyID string, claims *auth.Claims) string {
	stringUID := h.resolveStringUserID(ctx, claims)
	if stringUID == "" {
		return ""
	}
	var empID string
	err := h.db.QueryRow(ctx, `SELECT id FROM employees WHERE property_id=? AND user_id=? LIMIT 1`, propertyID, stringUID).Scan(&empID)
	if err != nil {
		return ""
	}
	return empID
}

// ═══════════════════════════════════════════════════════════════
// EMPLOYEE SELF-SERVICE (ESS)
// ═══════════════════════════════════════════════════════════════

// MyProfile returns the current employee's full profile.
func (h *Handler) MyProfile(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()
	claims := auth.ClaimsFromContext(ctx)

	empID := h.resolveEmployeeID(ctx, propertyID, claims)
	if empID == "" {
		// Fallback: return basic info from the user record
		stringUID := h.resolveStringUserID(ctx, claims)
		var name, email, role string
		h.db.QueryRow(ctx, `SELECT name, email, role FROM users WHERE id=?`, stringUID).Scan(&name, &email, &role)
		respondJSON(w, 200, map[string]interface{}{
			"user_id":   stringUID,
			"name":      name,
			"email":     email,
			"role":      role,
			"employee":  nil,
			"profile":   nil,
			"contracts": []interface{}{},
		})
		return
	}

	// Get employee details
	var firstName, lastName, department, position, phone, status, hireDate string
	h.db.QueryRow(ctx, `SELECT first_name, last_name, COALESCE(department_id,''), COALESCE(position,''), phone, status, hire_date FROM employees WHERE id=?`, empID).Scan(&firstName, &lastName, &department, &position, &phone, &status, &hireDate)

	// Get profile
	var nationality, gender, address, emergencyContact, emergencyPhone string
	h.db.QueryRow(ctx, `SELECT COALESCE(nationality,''), COALESCE(gender,''), COALESCE(address,''), COALESCE(emergency_contact,''), COALESCE(emergency_phone,'') FROM employee_profiles WHERE employee_id=?`, empID).Scan(&nationality, &gender, &address, &emergencyContact, &emergencyPhone)

	// Get contracts
	contractRows, err := h.db.Query(ctx, `SELECT id, contract_type, start_date, end_date, salary, status FROM employee_contracts WHERE employee_id=? ORDER BY start_date DESC`, empID)
	contracts := []map[string]interface{}{}
	if err == nil {
		defer contractRows.Close()
		for contractRows.Next() {
			var id, ct, sd, ed, st string
			var salary float64
			contractRows.Scan(&id, &ct, &sd, &ed, &salary, &st)
			contracts = append(contracts, map[string]interface{}{"id": id, "type": ct, "start_date": sd, "end_date": ed, "salary": salary, "status": st})
		}
	}

	respondJSON(w, 200, map[string]interface{}{
		"employee_id": empID,
		"first_name":  firstName,
		"last_name":   lastName,
		"department":  department,
		"position":    position,
		"phone":       phone,
		"status":      status,
		"hire_date":   hireDate,
		"nationality": nationality,
		"gender":      gender,
		"address":     address,
		"emergency": map[string]string{
			"contact": emergencyContact,
			"phone":   emergencyPhone,
		},
		"contracts": contracts,
	})
}

// MyAttendance returns the current employee's attendance records.
func (h *Handler) MyAttendance(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()
	claims := auth.ClaimsFromContext(ctx)

	empID := h.resolveEmployeeID(ctx, propertyID, claims)
	if empID == "" {
		respondJSON(w, 200, map[string]interface{}{"records": []interface{}{}, "summary": map[string]interface{}{}})
		return
	}

	days := r.URL.Query().Get("days")
	if days == "" {
		days = "30"
	}
	n, _ := strconv.Atoi(days)
	if n <= 0 || n > 365 {
		n = 30
	}

	rows, err := h.db.Query(ctx, `
		SELECT date, clock_in, clock_out, status, hours_worked, overtime_hours
		FROM attendance_records WHERE employee_id=? AND date >= date('now', ?)
		ORDER BY date DESC LIMIT ?`, empID, "-"+strconv.Itoa(n)+" days", n)
	if err != nil {
		respondJSON(w, 200, map[string]interface{}{"records": []interface{}{}, "summary": map[string]interface{}{}})
		return
	}
	defer rows.Close()

	records := []map[string]interface{}{}
	totalPresent, totalLate, totalAbsent, totalOvertime := 0, 0, 0, 0.0
	for rows.Next() {
		var date, clockIn, clockOut, status string
		var hours, overtime float64
		rows.Scan(&date, &clockIn, &clockOut, &status, &hours, &overtime)
		records = append(records, map[string]interface{}{
			"date": date, "clock_in": clockIn, "clock_out": clockOut,
			"status": status, "hours_worked": hours, "overtime_hours": overtime,
		})
		switch status {
		case "present":
			totalPresent++
		case "late":
			totalLate++
		case "absent":
			totalAbsent++
		}
		totalOvertime += overtime
	}

	attendanceRate := 0.0
	if len(records) > 0 {
		attendanceRate = float64(totalPresent+totalLate) / float64(len(records)) * 100
	}

	respondJSON(w, 200, map[string]interface{}{
		"records": records,
		"summary": map[string]interface{}{
			"total_days":      len(records),
			"present":         totalPresent,
			"late":            totalLate,
			"absent":          totalAbsent,
			"overtime_hours":   totalOvertime,
			"attendance_rate": attendanceRate,
		},
	})
}

// MyLeaveRequests returns current employee's leave requests.
func (h *Handler) MyLeaveRequests(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()
	claims := auth.ClaimsFromContext(ctx)

	empID := h.resolveEmployeeID(ctx, propertyID, claims)
	if empID == "" {
		respondJSON(w, 200, map[string]interface{}{"requests": []interface{}{}})
		return
	}

	rows, err := h.db.Query(ctx, `
		SELECT lr.id, lt.name, lr.start_date, lr.end_date, lr.days_requested, lr.reason, lr.status, lr.created_at
		FROM leave_requests lr
		JOIN leave_types lt ON lr.leave_type_id = lt.id
		WHERE lr.employee_id=? ORDER BY lr.created_at DESC`, empID)
	if err != nil {
		respondJSON(w, 200, map[string]interface{}{"requests": []interface{}{}})
		return
	}
	defer rows.Close()

	requests := []map[string]interface{}{}
	for rows.Next() {
		var id, ltName, sd, ed, reason, status, created string
		var days int
		rows.Scan(&id, &ltName, &sd, &ed, &days, &reason, &status, &created)
		requests = append(requests, map[string]interface{}{
			"id": id, "leave_type": ltName, "start_date": sd, "end_date": ed,
			"days": days, "reason": reason, "status": status, "created_at": created,
		})
	}

	respondJSON(w, 200, map[string]interface{}{"requests": requests})
}

// SubmitLeaveRequest creates a new leave request for the current employee.
func (h *Handler) SubmitLeaveRequest(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()
	claims := auth.ClaimsFromContext(ctx)

	empID := h.resolveEmployeeID(ctx, propertyID, claims)
	if empID == "" {
		respondJSON(w, 400, map[string]interface{}{"error": "No employee record found"})
		return
	}

	var req struct {
		LeaveTypeID string `json:"leave_type_id"`
		StartDate   string `json:"start_date"`
		EndDate     string `json:"end_date"`
		Days        int    `json:"days"`
		Reason      string `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, 400, map[string]interface{}{"error": "Invalid request body"})
		return
	}

	id := uuid.New().String()
	_, err := h.db.Exec(ctx, `
		INSERT INTO leave_requests (id, employee_id, leave_type_id, start_date, end_date, days_requested, reason, status, property_id, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
		id, empID, req.LeaveTypeID, req.StartDate, req.EndDate, req.Days, req.Reason, propertyID, time.Now().UTC().Format(time.RFC3339))
	if err != nil {
		respondJSON(w, 500, map[string]interface{}{"error": "Failed to submit leave request"})
		return
	}

	respondJSON(w, 201, map[string]interface{}{
		"id":      id,
		"status":  "pending",
		"message": "Leave request submitted successfully",
	})
}

// MyPayslips returns payslips for the current employee.
func (h *Handler) MyPayslips(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()
	claims := auth.ClaimsFromContext(ctx)

	empID := h.resolveEmployeeID(ctx, propertyID, claims)
	if empID == "" {
		respondJSON(w, 200, map[string]interface{}{"payslips": []interface{}{}})
		return
	}

	rows, err := h.db.Query(ctx, `
		SELECT id, pay_period_start, pay_period_end, basic_salary, allowances, deductions, net_pay, status, payment_date
		FROM payroll_runs WHERE employee_id=? ORDER BY pay_period_start DESC LIMIT 12`, empID)
	if err != nil {
		respondJSON(w, 200, map[string]interface{}{"payslips": []interface{}{}})
		return
	}
	defer rows.Close()

	payslips := []map[string]interface{}{}
	for rows.Next() {
		var id, pps, ppe, status, pd string
		var basic, allowances, deductions, netPay float64
		rows.Scan(&id, &pps, &ppe, &basic, &allowances, &deductions, &netPay, &status, &pd)
		payslips = append(payslips, map[string]interface{}{
			"id": id, "period_start": pps, "period_end": ppe,
			"basic_salary": basic, "allowances": allowances, "deductions": deductions,
			"net_pay": netPay, "status": status, "payment_date": pd,
		})
	}

	respondJSON(w, 200, map[string]interface{}{"payslips": payslips})
}

// ═══════════════════════════════════════════════════════════════
// MANAGER SELF-SERVICE (MSS)
// ═══════════════════════════════════════════════════════════════

// MyTeam returns the manager's direct reports.
func (h *Handler) MyTeam(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()
	claims := auth.ClaimsFromContext(ctx)

	mgrID := h.resolveEmployeeID(ctx, propertyID, claims)
	if mgrID == "" {
		respondJSON(w, 200, map[string]interface{}{"team": []interface{}{}})
		return
	}

	rows, err := h.db.Query(ctx, `
		SELECT e.id, e.first_name, e.last_name, COALESCE(d.name,'') as department, COALESCE(e.position,''), e.status, e.phone,
			COALESCE((SELECT status FROM attendance_records WHERE employee_id=e.id AND date=date('now')), 'no_record') as today_status
		FROM employees e
		LEFT JOIN departments d ON e.department_id = d.id
		WHERE e.reporting_manager=? AND e.property_id=?
		ORDER BY e.first_name`, mgrID, propertyID)
	if err != nil {
		respondJSON(w, 200, map[string]interface{}{"team": []interface{}{}})
		return
	}
	defer rows.Close()

	team := []map[string]interface{}{}
	for rows.Next() {
		var id, fn, ln, dept, pos, status, phone, todayStatus string
		rows.Scan(&id, &fn, &ln, &dept, &pos, &status, &phone, &todayStatus)
		team = append(team, map[string]interface{}{
			"id": id, "name": fn + " " + ln, "department": dept,
			"position": pos, "status": status, "phone": phone,
			"today_status": todayStatus,
		})
	}

	respondJSON(w, 200, map[string]interface{}{"team": team})
}

// PendingLeaveApprovals returns pending leave requests for the manager's team.
func (h *Handler) PendingLeaveApprovals(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()
	claims := auth.ClaimsFromContext(ctx)

	mgrID := h.resolveEmployeeID(ctx, propertyID, claims)
	if mgrID == "" {
		respondJSON(w, 200, map[string]interface{}{"pending": []interface{}{}})
		return
	}

	rows, err := h.db.Query(ctx, `
		SELECT lr.id, e.first_name || ' ' || e.last_name, lt.name, lr.start_date, lr.end_date, lr.days_requested, lr.reason, lr.created_at
		FROM leave_requests lr
		JOIN employees e ON lr.employee_id = e.id
		JOIN leave_types lt ON lr.leave_type_id = lt.id
		WHERE lr.status='pending' AND e.reporting_manager=? AND e.property_id=?
		ORDER BY lr.created_at DESC`, mgrID, propertyID)
	if err != nil {
		respondJSON(w, 200, map[string]interface{}{"pending": []interface{}{}})
		return
	}
	defer rows.Close()

	pending := []map[string]interface{}{}
	for rows.Next() {
		var id, empName, ltName, sd, ed, reason, created string
		var days int
		rows.Scan(&id, &empName, &ltName, &sd, &ed, &days, &reason, &created)
		pending = append(pending, map[string]interface{}{
			"id": id, "employee": empName, "leave_type": ltName,
			"start_date": sd, "end_date": ed, "days": days,
			"reason": reason, "created_at": created,
		})
	}

	respondJSON(w, 200, map[string]interface{}{"pending": pending})
}

// ApproveLeave approves or rejects a leave request.
func (h *Handler) ApproveLeave(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	leaveID := chi.URLParam(r, "id")

	var req struct {
		Action string `json:"action"`
		Notes  string `json:"notes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, 400, map[string]interface{}{"error": "Invalid request body"})
		return
	}

	status := "approved"
	if req.Action == "reject" {
		status = "rejected"
	}

	_, err := h.db.Exec(ctx, `UPDATE leave_requests SET status=?, approved_at=? WHERE id=?`,
		status, time.Now().UTC().Format(time.RFC3339), leaveID)
	if err != nil {
		respondJSON(w, 500, map[string]interface{}{"error": "Failed to update leave request"})
		return
	}

	respondJSON(w, 200, map[string]interface{}{
		"status":  status,
		"message": "Leave request " + status,
	})
}

// MyTeamAttendance returns today's attendance for the manager's team.
func (h *Handler) MyTeamAttendance(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()
	claims := auth.ClaimsFromContext(ctx)

	mgrID := h.resolveEmployeeID(ctx, propertyID, claims)
	if mgrID == "" {
		respondJSON(w, 200, map[string]interface{}{"team": []interface{}{}, "summary": map[string]interface{}{}})
		return
	}

	rows, err := h.db.Query(ctx, `
		SELECT e.id, e.first_name || ' ' || e.last_name, COALESCE(d.name,'') as dept,
			COALESCE(ar.clock_in,'--') as clock_in, COALESCE(ar.clock_out,'--') as clock_out,
			COALESCE(ar.status,'absent') as status, COALESCE(ar.hours_worked,0) as hours
		FROM employees e
		LEFT JOIN departments d ON e.department_id = d.id
		LEFT JOIN attendance_records ar ON ar.employee_id = e.id AND ar.date = date('now')
		WHERE e.reporting_manager=? AND e.property_id=?
		ORDER BY e.first_name`, mgrID, propertyID)
	if err != nil {
		respondJSON(w, 200, map[string]interface{}{"team": []interface{}{}, "summary": map[string]interface{}{}})
		return
	}
	defer rows.Close()

	team := []map[string]interface{}{}
	present, late, absent := 0, 0, 0
	for rows.Next() {
		var id, name, dept, ci, co, status string
		var hours float64
		rows.Scan(&id, &name, &dept, &ci, &co, &status, &hours)
		team = append(team, map[string]interface{}{
			"id": id, "name": name, "department": dept,
			"clock_in": ci, "clock_out": co, "status": status, "hours": hours,
		})
		switch status {
		case "present":
			present++
		case "late":
			late++
		default:
			absent++
		}
	}

	respondJSON(w, 200, map[string]interface{}{
		"team": team,
		"summary": map[string]interface{}{
			"total": len(team), "present": present, "late": late, "absent": absent,
		},
	})
}

func respondJSON(w http.ResponseWriter, code int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(data)
}
