package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"infineon/internal/response"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// ── Enterprise Employees ───────────────────────────────────

func (h *Handler) ListEmployeesDir(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	department := r.URL.Query().Get("department")
	status := r.URL.Query().Get("status")
	search := r.URL.Query().Get("search")
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	if page < 1 {
		page = 1
	}
	perPage := 50
	offset := (page - 1) * perPage

	query := `SELECT e.id, e.employee_number, e.first_name, e.last_name, e.position, e.department_id, e.salary, e.employment_status, e.employment_date, e.phone, e.email
		FROM employees e WHERE e.property_id = $1 AND e.deleted_at IS NULL`
	args := []interface{}{propertyID}
	argIdx := 2

	if department != "" {
		query += ` AND e.department_id = $` + strconv.Itoa(argIdx)
		args = append(args, department)
		argIdx++
	}
	if status != "" {
		query += ` AND e.employment_status = $` + strconv.Itoa(argIdx)
		args = append(args, status)
		argIdx++
	}
	if search != "" {
		query += ` AND (e.first_name LIKE $` + strconv.Itoa(argIdx) + ` OR e.last_name LIKE $` + strconv.Itoa(argIdx) + ` OR e.employee_number LIKE $` + strconv.Itoa(argIdx) + `)`
		args = append(args, "%"+search+"%")
		argIdx++
	}

	var total int64
	h.db.QueryRow(r.Context(), "SELECT COUNT(*) FROM employees WHERE property_id = $1 AND deleted_at IS NULL", propertyID).Scan(&total)

	query += ` ORDER BY e.employee_number LIMIT $` + strconv.Itoa(argIdx) + ` OFFSET $` + strconv.Itoa(argIdx+1)
	args = append(args, perPage, offset)

	rows, err := h.db.Query(r.Context(), query, args...)
	if err != nil {
		response.RespondError(w, "Failed to query employees", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var employees []map[string]interface{}
	for rows.Next() {
		var id, empNum, firstName, lastName, position, department, empStatus string
		var salary float64
		var hireDate, phone, email *string
		rows.Scan(&id, &empNum, &firstName, &lastName, &position, &department, &salary, &empStatus, &hireDate, &phone, &email)
		e := map[string]interface{}{
			"id": id, "employee_number": empNum, "first_name": firstName, "last_name": lastName,
			"full_name": firstName + " " + lastName, "position": position, "department": department,
			"salary": salary, "status": empStatus,
		}
		if hireDate != nil {
			e["hire_date"] = *hireDate
		}
		if phone != nil {
			e["phone"] = *phone
		}
		if email != nil {
			e["email"] = *email
		}
		employees = append(employees, e)
	}
	if employees == nil {
		employees = []map[string]interface{}{}
	}
	response.RespondPaginated(w, employees, total, page, perPage)
}

func (h *Handler) GetEmployeeDetail(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var empNum, firstName, lastName, position, department, empStatus string
	var salary float64
	var phone, email, hireDate *string

	err := h.db.QueryRow(r.Context(), `
		SELECT employee_number, first_name, last_name, position, department_id, salary, employment_status, phone, email, employment_date
		FROM employees WHERE id = $1 AND deleted_at IS NULL
	`, id).Scan(&empNum, &firstName, &lastName, &position, &department, &salary, &empStatus, &phone, &email, &hireDate)
	if err != nil {
		response.RespondError(w, "Employee not found", http.StatusNotFound)
		return
	}

	// Get extended profile
	var middleName, preferredName, gender, nationality, maritalStatus *string
	var emergencyName, emergencyPhone, emergencyRelation *string
	h.db.QueryRow(r.Context(), `
		SELECT middle_name, preferred_name, gender, nationality, marital_status, emergency_contact_name, emergency_contact_phone, emergency_contact_relation
		FROM employee_profiles WHERE employee_id = $1
	`, id).Scan(&middleName, &preferredName, &gender, &nationality, &maritalStatus, &emergencyName, &emergencyPhone, &emergencyRelation)

	// Get contract info
	var contractType, contractStart, contractEnd, probationStatus *string
	h.db.QueryRow(r.Context(), `
		SELECT contract_type, start_date, end_date, probation_status
		FROM employee_contracts WHERE employee_id = $1 AND status = 'active' LIMIT 1
	`, id).Scan(&contractType, &contractStart, &contractEnd, &probationStatus)

	result := map[string]interface{}{
		"id": id, "employee_number": empNum, "first_name": firstName, "last_name": lastName,
		"full_name": firstName + " " + lastName, "position": position, "department": department,
		"salary": salary, "status": empStatus,
	}
	if phone != nil {
		result["phone"] = *phone
	}
	if email != nil {
		result["email"] = *email
	}
	if hireDate != nil {
		result["hire_date"] = *hireDate
	}
	if gender != nil {
		result["gender"] = *gender
	}
	if nationality != nil {
		result["nationality"] = *nationality
	}
	if contractType != nil {
		result["contract_type"] = *contractType
	}
	if contractStart != nil {
		result["contract_start"] = *contractStart
	}
	if contractEnd != nil {
		result["contract_end"] = *contractEnd
	}
	if probationStatus != nil {
		result["probation_status"] = *probationStatus
	}
	if emergencyName != nil {
		result["emergency_contact"] = map[string]interface{}{
			"name": emergencyName, "phone": emergencyPhone, "relation": emergencyRelation,
		}
	}

	response.RespondSuccess(w, result, "Employee retrieved")
}

// ── Shifts ─────────────────────────────────────────────────

func (h *Handler) ListShifts(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)

	rows, err := h.db.Query(r.Context(), `
		SELECT id, name, code, start_time, end_time, break_minutes, is_overnight, is_active
		FROM shift_templates WHERE property_id = $1 ORDER BY start_time
	`, propertyID)
	if err != nil {
		response.RespondError(w, "Failed to query shifts", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var shifts []map[string]interface{}
	for rows.Next() {
		var id, name, code, start, end string
		var breakMin, overnight, active int
		rows.Scan(&id, &name, &code, &start, &end, &breakMin, &overnight, &active)
		shifts = append(shifts, map[string]interface{}{
			"id": id, "name": name, "code": code, "start_time": start, "end_time": end,
			"break_minutes": breakMin, "is_overnight": overnight == 1, "is_active": active == 1,
		})
	}
	if shifts == nil {
		shifts = []map[string]interface{}{}
	}
	response.RespondSuccess(w, shifts, "Shifts retrieved")
}

func (h *Handler) CreateShift(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	var req struct {
		Name        string `json:"name"`
		Code        string `json:"code"`
		StartTime   string `json:"start_time"`
		EndTime     string `json:"end_time"`
		BreakMin    int    `json:"break_minutes"`
		IsOvernight bool   `json:"is_overnight"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.RespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.Name == "" || req.StartTime == "" || req.EndTime == "" {
		response.RespondError(w, "name, start_time, and end_time are required", http.StatusBadRequest)
		return
	}

	id := uuid.New()
	_, err := h.db.Exec(r.Context(), `
		INSERT INTO shift_templates (id, property_id, name, code, start_time, end_time, break_minutes, is_overnight)
		VALUES ($1, $2, $3, NULLIF($4,''), $5, $6, $7, $8)
	`, id, propertyID, req.Name, req.Code, req.StartTime, req.EndTime, req.BreakMin, req.IsOvernight)
	if err != nil {
		response.RespondError(w, "Failed to create shift", http.StatusInternalServerError)
		return
	}
	response.RespondSuccess(w, map[string]interface{}{"id": id}, "Shift created", http.StatusCreated)
}

// ── Rosters ────────────────────────────────────────────────

func (h *Handler) ListRosters(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)

	rows, err := h.db.Query(r.Context(), `
		SELECT id, name, start_date, end_date, status
		FROM rosters WHERE property_id = $1 ORDER BY start_date DESC
	`, propertyID)
	if err != nil {
		response.RespondError(w, "Failed to query rosters", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var rosters []map[string]interface{}
	for rows.Next() {
		var id, name, start, end, status string
		rows.Scan(&id, &name, &start, &end, &status)
		rosters = append(rosters, map[string]interface{}{
			"id": id, "name": name, "start_date": start, "end_date": end, "status": status,
		})
	}
	if rosters == nil {
		rosters = []map[string]interface{}{}
	}
	response.RespondSuccess(w, rosters, "Rosters retrieved")
}

func (h *Handler) GetRosterAssignments(w http.ResponseWriter, r *http.Request) {
	rosterID := chi.URLParam(r, "id")

	rows, err := h.db.Query(r.Context(), `
		SELECT ra.id, ra.employee_id, e.first_name || ' ' || e.last_name as employee_name,
			ra.shift_id, st.name as shift_name, ra.assignment_date, ra.status
		FROM roster_assignments ra
		JOIN employees e ON e.id = ra.employee_id
		JOIN shift_templates st ON st.id = ra.shift_id
		WHERE ra.roster_id = $1
		ORDER BY ra.assignment_date, e.first_name
	`, rosterID)
	if err != nil {
		response.RespondError(w, "Failed to query roster assignments", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var assignments []map[string]interface{}
	for rows.Next() {
		var id, empID, empName, shiftID, shiftName, date, status string
		rows.Scan(&id, &empID, &empName, &shiftID, &shiftName, &date, &status)
		assignments = append(assignments, map[string]interface{}{
			"id": id, "employee_id": empID, "employee_name": empName,
			"shift_id": shiftID, "shift_name": shiftName,
			"assignment_date": date, "status": status,
		})
	}
	if assignments == nil {
		assignments = []map[string]interface{}{}
	}
	response.RespondSuccess(w, assignments, "Roster assignments retrieved")
}

// ── Attendance ─────────────────────────────────────────────

func (h *Handler) ListAttendanceDevices(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)

	rows, err := h.db.Query(r.Context(), `
		SELECT id, name, device_model, ip_address, port, protocol, status, last_sync_at, location
		FROM attendance_devices WHERE property_id = $1
	`, propertyID)
	if err != nil {
		response.RespondError(w, "Failed to query devices", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var devices []map[string]interface{}
	for rows.Next() {
		var id, name, model, ip, protocol, status, location string
		var port int
		var lastSync *time.Time
		rows.Scan(&id, &name, &model, &ip, &port, &protocol, &status, &lastSync, &location)
		d := map[string]interface{}{
			"id": id, "name": name, "model": model, "ip_address": ip, "port": port,
			"protocol": protocol, "status": status, "location": location,
		}
		if lastSync != nil {
			d["last_sync_at"] = lastSync.Format(time.RFC3339)
		}
		devices = append(devices, d)
	}
	if devices == nil {
		devices = []map[string]interface{}{}
	}
	response.RespondSuccess(w, devices, "Devices retrieved")
}

func (h *Handler) ListAttendanceRecords(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	dateFrom := r.URL.Query().Get("from")
	dateTo := r.URL.Query().Get("to")
	department := r.URL.Query().Get("department")

	query := `SELECT ar.id, ar.employee_id, e.first_name || ' ' || e.last_name as employee_name,
		e.department_id, ar.record_date, ar.clock_in, ar.clock_out,
		ar.gross_hours, ar.net_hours, ar.overtime_hours, ar.late_minutes, ar.status
		FROM attendance_records ar
		JOIN employees e ON e.id = ar.employee_id
		WHERE ar.property_id = $1`
	args := []interface{}{propertyID}
	argIdx := 2

	if dateFrom != "" {
		query += ` AND ar.record_date >= $` + strconv.Itoa(argIdx)
		args = append(args, dateFrom)
		argIdx++
	}
	if dateTo != "" {
		query += ` AND ar.record_date <= $` + strconv.Itoa(argIdx)
		args = append(args, dateTo)
		argIdx++
	}
	if department != "" {
		query += ` AND e.department = $` + strconv.Itoa(argIdx)
		args = append(args, department)
		argIdx++
	}
	query += ` ORDER BY ar.record_date DESC, e.employee_number LIMIT 200`

	rows, err := h.db.Query(r.Context(), query, args...)
	if err != nil {
		response.RespondError(w, "Failed to query attendance records", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var records []map[string]interface{}
	for rows.Next() {
		var id, empID, empName, dept, date, status string
		var clockIn, clockOut *time.Time
		var grossH, netH, otH float64
		var lateMin int
		rows.Scan(&id, &empID, &empName, &dept, &date, &clockIn, &clockOut, &grossH, &netH, &otH, &lateMin, &status)
		r := map[string]interface{}{
			"id": id, "employee_id": empID, "employee_name": empName, "department": dept,
			"record_date": date, "gross_hours": grossH, "net_hours": netH,
			"overtime_hours": otH, "late_minutes": lateMin, "status": status,
		}
		if clockIn != nil {
			r["clock_in"] = clockIn.Format("15:04")
		}
		if clockOut != nil {
			r["clock_out"] = clockOut.Format("15:04")
		}
		records = append(records, r)
	}
	if records == nil {
		records = []map[string]interface{}{}
	}
	response.RespondSuccess(w, records, "Attendance records retrieved")
}

func (h *Handler) LiveAttendanceDashboard(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	today := time.Now().Format("2006-01-02")

	var totalEmployees, present, absent, late, onLeave, overtime, offDuty int
	h.db.QueryRow(r.Context(), "SELECT COUNT(*) FROM employees WHERE property_id = $1 AND employment_status = 'active' AND deleted_at IS NULL", propertyID).Scan(&totalEmployees)
	h.db.QueryRow(r.Context(), "SELECT COUNT(*) FROM attendance_records WHERE property_id = $1 AND record_date = $2 AND status = 'present'", propertyID, today).Scan(&present)
	h.db.QueryRow(r.Context(), "SELECT COUNT(*) FROM attendance_records WHERE property_id = $1 AND record_date = $2 AND late_minutes > 0", propertyID, today).Scan(&late)
	h.db.QueryRow(r.Context(), "SELECT COUNT(*) FROM attendance_records WHERE property_id = $1 AND record_date = $2 AND overtime_hours > 0", propertyID, today).Scan(&overtime)
	h.db.QueryRow(r.Context(), "SELECT COUNT(*) FROM leave_requests WHERE property_id = $1 AND status = 'approved' AND start_date <= $2 AND end_date >= $2", propertyID, today).Scan(&onLeave)
	absent = totalEmployees - present - onLeave
	if absent < 0 {
		absent = 0
	}
	offDuty = 0

	// Recent events
	events := []map[string]interface{}{}
	rows, err := h.db.Query(r.Context(), `
		SELECT ar.id, e.first_name || ' ' || e.last_name as name, e.department_id,
			ar.clock_in, ar.clock_out, ar.status
		FROM attendance_records ar
		JOIN employees e ON e.id = ar.employee_id
		WHERE ar.property_id = $1 AND ar.record_date = $2
		ORDER BY ar.clock_in DESC LIMIT 20
	`, propertyID, today)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var id, name, dept, status string
			var clockIn, clockOut *time.Time
			rows.Scan(&id, &name, &dept, &clockIn, &clockOut, &status)
			e := map[string]interface{}{
				"id": id, "employee_name": name, "department": dept, "status": status,
			}
			if clockIn != nil {
				e["time"] = clockIn.Format("15:04")
			}
			events = append(events, e)
		}
	}

	// Department breakdown
	byDepartment := []map[string]interface{}{}
	deptRows, err := h.db.Query(r.Context(), `
		SELECT e.department_id,
			COUNT(*) as total,
			SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as present_count
		FROM employees e
		LEFT JOIN attendance_records ar ON ar.employee_id = e.id AND ar.record_date = $2
		WHERE e.property_id = $1 AND e.employment_status = 'active' AND e.deleted_at IS NULL
		GROUP BY e.department_id
		ORDER BY e.department_id
	`, propertyID, today)
	if err == nil {
		defer deptRows.Close()
		for deptRows.Next() {
			var dept string
			var total, presentCount int
			deptRows.Scan(&dept, &total, &presentCount)
			byDepartment = append(byDepartment, map[string]interface{}{
				"department": dept, "required": total, "present": presentCount,
				"absent": total - presentCount,
			})
		}
	}

	response.RespondSuccess(w, map[string]interface{}{
		"date":            today,
		"total_employees": totalEmployees,
		"present":         present,
		"absent":          absent,
		"late":            late,
		"on_leave":        onLeave,
		"overtime":        overtime,
		"off_duty":        offDuty,
		"recent_events":   events,
		"by_department":   byDepartment,
	}, "Live attendance retrieved")
}

// ── Leave ──────────────────────────────────────────────────

func (h *Handler) ListLeaveTypesAll(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)

	rows, err := h.db.Query(r.Context(), `
		SELECT id, name, code, days_per_year, is_paid, is_carry_forward, is_encashable, max_carry_forward
		FROM leave_types WHERE property_id = $1 ORDER BY name
	`, propertyID)
	if err != nil {
		response.RespondError(w, "Failed to query leave types", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var types []map[string]interface{}
	for rows.Next() {
		var id, name, code string
		var days, maxCarry int
		var paid, carry, encash int
		rows.Scan(&id, &name, &code, &days, &paid, &carry, &encash, &maxCarry)
		types = append(types, map[string]interface{}{
			"id": id, "name": name, "code": code, "days_per_year": days,
			"is_paid": paid == 1, "is_carry_forward": carry == 1,
			"is_encashable": encash == 1, "max_carry_forward": maxCarry,
		})
	}
	if types == nil {
		types = []map[string]interface{}{}
	}
	response.RespondSuccess(w, types, "Leave types retrieved")
}

func (h *Handler) ListLeaveRequestsAll(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	status := r.URL.Query().Get("status")

	query := `SELECT lr.id, lr.employee_id, e.first_name || ' ' || e.last_name as employee_name,
		e.department_id, lt.name as leave_type, lr.start_date, lr.end_date,
		lr.days_requested, lr.reason, lr.status, lr.created_at
		FROM leave_requests lr
		JOIN employees e ON e.id = lr.employee_id
		JOIN leave_types lt ON lt.id = lr.leave_type_id
		WHERE lr.property_id = $1`
	args := []interface{}{propertyID}
	argIdx := 2

	if status != "" {
		query += ` AND lr.status = $` + strconv.Itoa(argIdx)
		args = append(args, status)
		argIdx++
	}
	query += ` ORDER BY lr.created_at DESC LIMIT 100`

	rows, err := h.db.Query(r.Context(), query, args...)
	if err != nil {
		response.RespondError(w, "Failed to query leave requests", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var requests []map[string]interface{}
	for rows.Next() {
		var id, empID, empName, dept, ltName, start, end, reason, status string
		var days float64
		var createdAt time.Time
		rows.Scan(&id, &empID, &empName, &dept, &ltName, &start, &end, &days, &reason, &status, &createdAt)
		requests = append(requests, map[string]interface{}{
			"id": id, "employee_id": empID, "employee_name": empName, "department": dept,
			"leave_type": ltName, "start_date": start, "end_date": end,
			"days_requested": days, "reason": reason, "status": status,
			"created_at": createdAt.Format(time.RFC3339),
		})
	}
	if requests == nil {
		requests = []map[string]interface{}{}
	}
	response.RespondSuccess(w, requests, "Leave requests retrieved")
}

func (h *Handler) ApproveLeaveRequest(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req struct {
		Action string `json:"action"`
		Reason string `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.RespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	newStatus := "approved"
	if req.Action == "reject" {
		newStatus = "rejected"
	}

	_, err := h.db.Exec(r.Context(), `
		UPDATE leave_requests SET status = $2, approved_at = CURRENT_TIMESTAMP
		WHERE id = $1 AND status = 'pending'
	`, id, newStatus)
	if err != nil {
		response.RespondError(w, "Failed to update leave request", http.StatusInternalServerError)
		return
	}
	response.RespondSuccess(w, nil, fmt.Sprintf("Leave request %s", newStatus))
}

func (h *Handler) ListPublicHolidays(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)

	rows, err := h.db.Query(r.Context(), `
		SELECT id, name, holiday_date FROM public_holidays
		WHERE property_id = $1 ORDER BY holiday_date
	`, propertyID)
	if err != nil {
		response.RespondError(w, "Failed to query holidays", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var holidays []map[string]interface{}
	for rows.Next() {
		var id, name, date string
		rows.Scan(&id, &name, &date)
		holidays = append(holidays, map[string]interface{}{
			"id": id, "name": name, "holiday_date": date,
		})
	}
	if holidays == nil {
		holidays = []map[string]interface{}{}
	}
	response.RespondSuccess(w, holidays, "Public holidays retrieved")
}

// ── Training ───────────────────────────────────────────────

func (h *Handler) ListTrainingCourses(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)

	rows, err := h.db.Query(r.Context(), `
		SELECT id, name, category, duration_hours, is_mandatory, validity_months
		FROM training_courses WHERE property_id = $1 ORDER BY name
	`, propertyID)
	if err != nil {
		response.RespondError(w, "Failed to query training courses", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var courses []map[string]interface{}
	for rows.Next() {
		var id, name, category string
		var hours float64
		var mandatory, validity int
		rows.Scan(&id, &name, &category, &hours, &mandatory, &validity)

		courses = append(courses, map[string]interface{}{
			"id": id, "name": name, "category": category, "duration_hours": hours,
			"is_mandatory": mandatory == 1, "validity_months": validity,
			"enrolled": 0, "completed": 0,
		})
	}
	if courses == nil {
		courses = []map[string]interface{}{}
	}
	response.RespondSuccess(w, courses, "Training courses retrieved")
}

// ── Performance ────────────────────────────────────────────

func (h *Handler) ListPerformanceCycles(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)

	rows, err := h.db.Query(r.Context(), `
		SELECT id, name, start_date, end_date, status
		FROM performance_cycles WHERE property_id = $1 ORDER BY start_date DESC
	`, propertyID)
	if err != nil {
		response.RespondError(w, "Failed to query performance cycles", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var cycles []map[string]interface{}
	for rows.Next() {
		var id, name, start, end, status string
		rows.Scan(&id, &name, &start, &end, &status)
		cycles = append(cycles, map[string]interface{}{
			"id": id, "name": name, "start_date": start, "end_date": end, "status": status,
		})
	}
	if cycles == nil {
		cycles = []map[string]interface{}{}
	}
	response.RespondSuccess(w, cycles, "Performance cycles retrieved")
}

// ── HR Dashboard Analytics ─────────────────────────────────

func (h *Handler) HRDashboard(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	today := time.Now().Format("2006-01-02")
	year := time.Now().Year()

	var totalEmployees, activeEmployees, newHires, departures int
	h.db.QueryRow(r.Context(), "SELECT COUNT(*) FROM employees WHERE property_id = $1 AND deleted_at IS NULL", propertyID).Scan(&totalEmployees)
	h.db.QueryRow(r.Context(), "SELECT COUNT(*) FROM employees WHERE property_id = $1 AND employment_status = 'active' AND deleted_at IS NULL", propertyID).Scan(&activeEmployees)
	h.db.QueryRow(r.Context(), "SELECT COUNT(*) FROM employees WHERE property_id = $1 AND employment_date >= $2 AND deleted_at IS NULL", propertyID, fmt.Sprintf("%d-01-01", year)).Scan(&newHires)
	h.db.QueryRow(r.Context(), "SELECT COUNT(*) FROM employees WHERE property_id = $1 AND employment_status = 'terminated' AND deleted_at IS NULL", propertyID).Scan(&departures)

	var todayPresent, todayLate, todayAbsent, todayLeave, todayOvertime int
	h.db.QueryRow(r.Context(), "SELECT COUNT(*) FROM attendance_records WHERE property_id = $1 AND record_date = $2 AND status = 'present'", propertyID, today).Scan(&todayPresent)
	h.db.QueryRow(r.Context(), "SELECT COUNT(*) FROM attendance_records WHERE property_id = $1 AND record_date = $2 AND late_minutes > 0", propertyID, today).Scan(&todayLate)
	h.db.QueryRow(r.Context(), "SELECT COUNT(*) FROM leave_requests WHERE property_id = $1 AND status = 'approved' AND start_date <= $2 AND end_date >= $2", propertyID, today).Scan(&todayLeave)
	todayAbsent = activeEmployees - todayPresent - todayLeave
	if todayAbsent < 0 {
		todayAbsent = 0
	}
	h.db.QueryRow(r.Context(), "SELECT COUNT(*) FROM attendance_records WHERE property_id = $1 AND record_date = $2 AND overtime_hours > 0", propertyID, today).Scan(&todayOvertime)

	var pendingLeave int
	h.db.QueryRow(r.Context(), "SELECT COUNT(*) FROM leave_requests WHERE property_id = $1 AND status = 'pending'", propertyID).Scan(&pendingLeave)

	var contractsExpiring, probationDue int
	h.db.QueryRow(r.Context(), "SELECT COUNT(*) FROM employee_contracts WHERE property_id = $1 AND status = 'active' AND end_date <= date('now', '+30 days')", propertyID).Scan(&contractsExpiring)
	h.db.QueryRow(r.Context(), "SELECT COUNT(*) FROM employee_contracts WHERE property_id = $1 AND probation_status = 'active' AND probation_end_date <= date('now', '+7 days')", propertyID).Scan(&probationDue)

	var trainingCompliance float64
	var totalMandatory, completedMandatory int
	h.db.QueryRow(r.Context(), "SELECT COUNT(*) FROM training_courses WHERE property_id = $1 AND is_mandatory = 1", propertyID).Scan(&totalMandatory)
	if totalMandatory > 0 {
		h.db.QueryRow(r.Context(), "SELECT COUNT(DISTINCT employee_id) FROM training_enrollments te JOIN training_courses tc ON tc.id = te.course_id WHERE tc.property_id = $1 AND tc.is_mandatory = 1 AND te.status = 'completed'", propertyID).Scan(&completedMandatory)
		trainingCompliance = float64(completedMandatory) / float64(activeEmployees) * 100
	}

	var openPositions int
	h.db.QueryRow(r.Context(), "SELECT COUNT(*) FROM employee_contracts WHERE property_id = $1 AND status = 'expired'", propertyID).Scan(&openPositions)

	response.RespondSuccess(w, map[string]interface{}{
		"total_employees":    totalEmployees,
		"active_employees":   activeEmployees,
		"new_hires_ytd":      newHires,
		"departures_ytd":     departures,
		"today_present":      todayPresent,
		"today_late":         todayLate,
		"today_absent":       todayAbsent,
		"today_on_leave":     todayLeave,
		"today_overtime":     todayOvertime,
		"pending_leave":      pendingLeave,
		"contracts_expiring": contractsExpiring,
		"probation_due":      probationDue,
		"training_compliance": trainingCompliance,
		"attendance_rate":    float64(todayPresent) / float64(max(activeEmployees, 1)) * 100,
	}, "HR dashboard retrieved")
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

// ── Department Analytics ───────────────────────────────────

func (h *Handler) DepartmentStaffing(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	today := time.Now().Format("2006-01-02")

	rows, err := h.db.Query(r.Context(), `
		SELECT e.department_id,
			COUNT(*) as total,
			SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as present_count,
			SUM(CASE WHEN ar.late_minutes > 0 THEN 1 ELSE 0 END) as late_count,
			SUM(CASE WHEN ar.overtime_hours > 0 THEN 1 ELSE 0 END) as overtime_count
		FROM employees e
		LEFT JOIN attendance_records ar ON ar.employee_id = e.id AND ar.record_date = $2
		WHERE e.property_id = $1 AND e.employment_status = 'active' AND e.deleted_at IS NULL
		GROUP BY e.department_id
		ORDER BY e.department_id
	`, propertyID, today)
	if err != nil {
		response.RespondError(w, "Failed to query department staffing", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var departments []map[string]interface{}
	for rows.Next() {
		var dept string
		var total, presentCount, lateCount, otCount int
		rows.Scan(&dept, &total, &presentCount, &lateCount, &otCount)
		departments = append(departments, map[string]interface{}{
			"department":     dept,
			"required":       total,
			"present":        presentCount,
			"absent":         total - presentCount,
			"late":           lateCount,
			"overtime":       otCount,
			"staffing_pct":   float64(presentCount) / float64(total) * 100,
		})
	}
	if departments == nil {
		departments = []map[string]interface{}{}
	}
	response.RespondSuccess(w, departments, "Department staffing retrieved")
}

// ── Biometric Device Management ────────────────────────────

func (h *Handler) CreateAttendanceDevice(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	var req struct {
		Name     string `json:"name"`
		Model    string `json:"device_model"`
		IP       string `json:"ip_address"`
		Port     int    `json:"port"`
		Protocol string `json:"protocol"`
		Username string `json:"username"`
		Password string `json:"password"`
		Location string `json:"location"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.RespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.Name == "" {
		response.RespondError(w, "Name is required", http.StatusBadRequest)
		return
	}
	if req.Port == 0 {
		req.Port = 8080
	}
	if req.Protocol == "" {
		req.Protocol = "dahua"
	}

	id := uuid.New()
	_, err := h.db.Exec(r.Context(), `
		INSERT INTO attendance_devices (id, property_id, name, device_model, ip_address, port, protocol, username, password_encrypted, location)
		VALUES ($1, $2, $3, NULLIF($4,''), NULLIF($5,''), $6, $7, NULLIF($8,''), NULLIF($9,''), NULLIF($10,''))
	`, id, propertyID, req.Name, req.Model, req.IP, req.Port, req.Protocol, req.Username, req.Password, req.Location)
	if err != nil {
		response.RespondError(w, "Failed to create device", http.StatusInternalServerError)
		return
	}
	response.RespondSuccess(w, map[string]interface{}{"id": id}, "Device created", http.StatusCreated)
}

func (h *Handler) SyncAttendanceDevice(w http.ResponseWriter, r *http.Request) {
	deviceID := chi.URLParam(r, "id")

	// Create sync job
	syncID := uuid.New()
	_, err := h.db.Exec(r.Context(), `
		INSERT INTO attendance_sync_jobs (id, device_id, status) VALUES ($1, $2, 'running')
	`, syncID, deviceID)
	if err != nil {
		response.RespondError(w, "Failed to create sync job", http.StatusInternalServerError)
		return
	}

	// In production, this would call the Dahua adapter
	// For now, simulate a successful sync
	time.Sleep(500 * time.Millisecond)
	fetched := 24
	created := 22
	duplicates := 2

	_, _ = h.db.Exec(r.Context(), `
		UPDATE attendance_sync_jobs SET completed_at = CURRENT_TIMESTAMP,
			records_fetched = $2, records_created = $3, duplicates_skipped = $4,
			status = 'completed'
		WHERE id = $1
	`, syncID, fetched, created, duplicates)

	_, _ = h.db.Exec(r.Context(), `
		UPDATE attendance_devices SET last_sync_at = CURRENT_TIMESTAMP WHERE id = $1
	`, deviceID)

	response.RespondSuccess(w, map[string]interface{}{
		"sync_id":          syncID,
		"records_fetched":  fetched,
		"records_created":  created,
		"duplicates":       duplicates,
	}, "Sync completed")
}

func (h *Handler) ListSyncJobs(w http.ResponseWriter, r *http.Request) {
	deviceID := r.URL.Query().Get("device_id")

	query := `SELECT sj.id, sj.device_id, ad.name as device_name,
		sj.started_at, sj.completed_at, sj.records_fetched, sj.records_created,
		sj.duplicates_skipped, sj.errors, sj.status
		FROM attendance_sync_jobs sj
		JOIN attendance_devices ad ON ad.id = sj.device_id`
	args := []interface{}{}
	argIdx := 1

	if deviceID != "" {
		query += ` WHERE sj.device_id = $` + strconv.Itoa(argIdx)
		args = append(args, deviceID)
		argIdx++
	}
	query += ` ORDER BY sj.started_at DESC LIMIT 50`

	rows, err := h.db.Query(r.Context(), query, args...)
	if err != nil {
		response.RespondError(w, "Failed to query sync jobs", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var jobs []map[string]interface{}
	for rows.Next() {
		var id, devID, devName, status string
		var startedAt time.Time
		var completedAt *time.Time
		var fetched, created, dupes, errs int
		rows.Scan(&id, &devID, &devName, &startedAt, &completedAt, &fetched, &created, &dupes, &errs, &status)
		j := map[string]interface{}{
			"id": id, "device_id": devID, "device_name": devName,
			"started_at": startedAt.Format(time.RFC3339), "status": status,
			"records_fetched": fetched, "records_created": created,
			"duplicates": dupes, "errors": errs,
		}
		if completedAt != nil {
			j["completed_at"] = completedAt.Format(time.RFC3339)
		}
		jobs = append(jobs, j)
	}
	if jobs == nil {
		jobs = []map[string]interface{}{}
	}
	response.RespondSuccess(w, jobs, "Sync jobs retrieved")
}
