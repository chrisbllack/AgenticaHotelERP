package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// ============================================================
// EMPLOYEES
// ============================================================

type Employee struct {
	ID                string  `json:"id"`
	EmployeeNumber    string  `json:"employee_number"`
	FirstName         string  `json:"first_name"`
	LastName          string  `json:"last_name"`
	MiddleName        string  `json:"middle_name"`
	Email             string  `json:"email"`
	Phone             string  `json:"phone"`
	DepartmentID      *string `json:"department_id"`
	DepartmentName    string  `json:"department_name"`
	Position          string  `json:"position"`
	EmploymentDate    string  `json:"employment_date"`
	EmploymentType    string  `json:"employment_type"`
	Status            string  `json:"status"`
	Salary            float64 `json:"salary"`
	CurrencyCode      string  `json:"currency_code"`
	LeaveBalance      float64 `json:"leave_balance"`
}

type AttendanceRecord struct {
	ID              string  `json:"id"`
	EmployeeID      string  `json:"employee_id"`
	EmployeeName    string  `json:"employee_name"`
	AttendanceDate  string  `json:"attendance_date"`
	ClockIn         string  `json:"clock_in"`
	ClockOut        string  `json:"clock_out"`
	HoursWorked     float64 `json:"hours_worked"`
	OvertimeHours   float64 `json:"overtime_hours"`
	Status          string  `json:"status"`
	LateMinutes     int     `json:"late_minutes"`
}

type PayrollRun struct {
	ID             string        `json:"id"`
	RunName        string        `json:"run_name"`
	PayPeriodStart string        `json:"pay_period_start"`
	PayPeriodEnd   string        `json:"pay_period_end"`
	PaymentDate    string        `json:"payment_date"`
	TotalGross     float64       `json:"total_gross"`
	TotalDeductions float64      `json:"total_deductions"`
	TotalNet       float64       `json:"total_net"`
	Status         string        `json:"status"`
	Lines          []PayrollLine `json:"lines"`
}

type PayrollLine struct {
	ID              string  `json:"id"`
	EmployeeID      string  `json:"employee_id"`
	EmployeeName    string  `json:"employee_name"`
	BasicSalary     float64 `json:"basic_salary"`
	Allowances      float64 `json:"allowances"`
	OvertimePay     float64 `json:"overtime_pay"`
	Bonuses         float64 `json:"bonuses"`
	GrossPay        float64 `json:"gross_pay"`
	IncomeTax       float64 `json:"income_tax"`
	Pension         float64 `json:"pension"`
	HealthInsurance float64 `json:"health_insurance"`
	LoanDeduction   float64 `json:"loan_deduction"`
	OtherDeductions float64 `json:"other_deductions"`
	TotalDeductions float64 `json:"total_deductions"`
	NetPay          float64 `json:"net_pay"`
}


// ============================================================
// EMPLOYEE HANDLERS
// ============================================================

func (h *Handler) ListEmployees(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	rows, err := h.db.Query(r.Context(), `
		SELECT id, employee_number, first_name, last_name, COALESCE(middle_name,''),
		       COALESCE(email,''), COALESCE(phone,''), COALESCE(department_id,''),
		       COALESCE(position,''), COALESCE(employment_date,''),
		       COALESCE(employment_status,'active'), salary
		FROM employees WHERE property_id = $1 AND deleted_at IS NULL
		ORDER BY employee_number`, propertyID)
	if err != nil {
		SendError(w, http.StatusInternalServerError, "Failed to list employees: "+err.Error())
		return
	}
	defer rows.Close()

	var employees []Employee
	for rows.Next() {
		var e Employee
		if err := rows.Scan(&e.ID, &e.EmployeeNumber, &e.FirstName, &e.LastName, &e.MiddleName,
			&e.Email, &e.Phone, &e.DepartmentID, &e.Position,
			&e.EmploymentDate, &e.Status, &e.Salary); err != nil {
			continue
		}
		employees = append(employees, e)
	}
	if employees == nil {
		employees = []Employee{}
	}
	SendSuccess(w, employees)
}

func (h *Handler) CreateEmployee(w http.ResponseWriter, r *http.Request) {
	var req struct {
		FirstName      string  `json:"first_name"`
		LastName       string  `json:"last_name"`
		MiddleName     string  `json:"middle_name"`
		Email          string  `json:"email"`
		Phone          string  `json:"phone"`
		DepartmentID   *string `json:"department_id"`
		Position       string  `json:"position"`
		EmploymentDate string  `json:"employment_date"`
		EmploymentType string  `json:"employment_type"`
		Salary         float64 `json:"salary"`
		CurrencyCode   string  `json:"currency_code"`
		BankName       string  `json:"bank_name"`
		BankAccount    string  `json:"bank_account"`
		TaxID          string  `json:"tax_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.FirstName == "" || req.LastName == "" || req.Position == "" || req.EmploymentDate == "" {
		SendError(w, http.StatusBadRequest, "first_name, last_name, position, and employment_date required")
		return
	}
	if req.CurrencyCode == "" {
		req.CurrencyCode = "USD"
	}
	if req.EmploymentType == "" {
		req.EmploymentType = "full_time"
	}

	propertyID := getPropertyID(r)
	empNumber := "EMP-" + time.Now().Format("2006") + "-" + fmt.Sprintf("%04d", time.Now().UnixNano()%10000)
	id := uuid.New().String()

	_, err := h.db.Exec(r.Context(), `
		INSERT INTO employees (id, property_id, employee_number, first_name, last_name, middle_name, email, phone,
		    department_id, position, employment_date, salary, bank_name, bank_account)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
		id, propertyID, empNumber, req.FirstName, req.LastName, req.MiddleName, req.Email, req.Phone,
		req.DepartmentID, req.Position, req.EmploymentDate,
		req.Salary, req.BankName, req.BankAccount)
	if err != nil {
		SendError(w, http.StatusInternalServerError, "Failed to create employee: "+err.Error())
		return
	}

	h.audit.Log(r.Context(), nil, "employees", "create", id, nil, req, r)
	SendCreated(w, map[string]string{"id": id, "employee_number": empNumber})
}

func (h *Handler) GetEmployee(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var e Employee
	err := h.db.QueryRow(r.Context(), `
		SELECT id, employee_number, first_name, last_name, COALESCE(middle_name,''),
		       COALESCE(email,''), COALESCE(phone,''), COALESCE(department_id,''),
		       COALESCE(position,''), COALESCE(employment_date,''),
		       COALESCE(employment_status,'active'), salary
		FROM employees WHERE id = $1`, id).Scan(&e.ID, &e.EmployeeNumber, &e.FirstName, &e.LastName, &e.MiddleName,
		&e.Email, &e.Phone, &e.DepartmentID, &e.Position,
		&e.EmploymentDate, &e.Status, &e.Salary)
	if err != nil {
		SendError(w, http.StatusNotFound, "Employee not found")
		return
	}
	SendSuccess(w, e)
}

func (h *Handler) UpdateEmployee(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req struct {
		FirstName    *string  `json:"first_name"`
		LastName     *string  `json:"last_name"`
		DepartmentID *string  `json:"department_id"`
		Position     *string  `json:"position"`
		Status       *string  `json:"status"`
		Salary       *float64 `json:"salary"`
		Phone        *string  `json:"phone"`
		Email        *string  `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Build dynamic update
	setClauses := []string{}
	args := []any{}
	argIdx := 1

	if req.FirstName != nil {
		setClauses = append(setClauses, "first_name = $"+itoa(argIdx))
		args = append(args, *req.FirstName)
		argIdx++
	}
	if req.LastName != nil {
		setClauses = append(setClauses, "last_name = $"+itoa(argIdx))
		args = append(args, *req.LastName)
		argIdx++
	}
	if req.DepartmentID != nil {
		setClauses = append(setClauses, "department_id = $"+itoa(argIdx))
		args = append(args, *req.DepartmentID)
		argIdx++
	}
	if req.Position != nil {
		setClauses = append(setClauses, "position = $"+itoa(argIdx))
		args = append(args, *req.Position)
		argIdx++
	}
	if req.Status != nil {
		setClauses = append(setClauses, "status = $"+itoa(argIdx))
		args = append(args, *req.Status)
		argIdx++
	}
	if req.Salary != nil {
		setClauses = append(setClauses, "salary = $"+itoa(argIdx))
		args = append(args, *req.Salary)
		argIdx++
	}
	if req.Phone != nil {
		setClauses = append(setClauses, "phone = $"+itoa(argIdx))
		args = append(args, *req.Phone)
		argIdx++
	}
	if req.Email != nil {
		setClauses = append(setClauses, "email = $"+itoa(argIdx))
		args = append(args, *req.Email)
		argIdx++
	}

	if len(setClauses) == 0 {
		SendError(w, http.StatusBadRequest, "No fields to update")
		return
	}

	args = append(args, id)
	query := "UPDATE employees SET "
	for i, s := range setClauses {
		if i > 0 {
			query += ", "
		}
		query += s
	}
	query += " WHERE id = $" + itoa(argIdx)

	result, err := h.db.Exec(r.Context(), query, args...)
	if err != nil {
		SendError(w, http.StatusInternalServerError, "Failed to update employee")
		return
	}
	if result.RowsAffected() == 0 {
		SendError(w, http.StatusNotFound, "Employee not found")
		return
	}
	h.audit.Log(r.Context(), nil, "employees", "update", id, nil, req, r)
	SendSuccess(w, map[string]string{"status": "updated"})
}

// ============================================================
// ATTENDANCE
// ============================================================

func (h *Handler) ListAttendance(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	rows, err := h.db.Query(r.Context(), `
		SELECT a.id, a.employee_id, COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,''),
		       a.date, COALESCE(a.clock_in,''), COALESCE(a.clock_out,''),
		       COALESCE(a.hours_worked,0), COALESCE(a.overtime_hours,0), a.status
		FROM attendance a
		LEFT JOIN employees e ON a.employee_id = e.id
		WHERE a.property_id = $1
		ORDER BY a.date DESC`, propertyID)
	if err != nil {
		SendError(w, http.StatusInternalServerError, "Failed to list attendance: "+err.Error())
		return
	}
	defer rows.Close()

	var records []AttendanceRecord
	for rows.Next() {
		var a AttendanceRecord
		if err := rows.Scan(&a.ID, &a.EmployeeID, &a.EmployeeName, &a.AttendanceDate,
			&a.ClockIn, &a.ClockOut, &a.HoursWorked, &a.OvertimeHours, &a.Status); err != nil {
			continue
		}
		records = append(records, a)
	}
	if records == nil {
		records = []AttendanceRecord{}
	}
	SendSuccess(w, records)
}

func (h *Handler) ClockIn(w http.ResponseWriter, r *http.Request) {
	var req struct {
		EmployeeID string `json:"employee_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.EmployeeID == "" {
		SendError(w, http.StatusBadRequest, "employee_id required")
		return
	}

	propertyID := getPropertyID(r)
	today := time.Now().Format("2006-01-02")
	now := time.Now().Format("15:04:05")
	id := uuid.New().String()

	_, err := h.db.Exec(r.Context(), `
		INSERT INTO attendance (id, employee_id, date, clock_in, status, property_id)
		VALUES ($1, $2, $3, $4, 'present', $5)`, id, req.EmployeeID, today, now, propertyID)
	if err != nil {
		SendError(w, http.StatusInternalServerError, "Failed to clock in: "+err.Error())
		return
	}
	SendSuccess(w, map[string]string{"id": id, "status": "clocked_in", "time": time.Now().Format(time.RFC3339)})
}

func (h *Handler) ClockOut(w http.ResponseWriter, r *http.Request) {
	var req struct {
		EmployeeID string `json:"employee_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	today := time.Now().Format("2006-01-02")
	now := time.Now().Format("15:04:05")
	result, err := h.db.Exec(r.Context(), `
		UPDATE attendance SET clock_out = $1
		WHERE employee_id = $2 AND date = $3 AND clock_out IS NULL`,
		now, req.EmployeeID, today)
	if err != nil {
		SendError(w, http.StatusInternalServerError, "Failed to clock out")
		return
	}
	if result.RowsAffected() == 0 {
		SendError(w, http.StatusBadRequest, "No active clock-in found for today")
		return
	}
	SendSuccess(w, map[string]string{"status": "clocked_out", "time": time.Now().Format(time.RFC3339)})
}

// ============================================================
// LEAVE REQUESTS
// ============================================================

func (h *Handler) ListLeaveTypes(w http.ResponseWriter, r *http.Request) {
	pid := getPropertyID(r)
	rows, err := h.db.Query(r.Context(), `SELECT id, name, days_per_year FROM leave_types WHERE property_id = $1 ORDER BY name`, pid)
	if err != nil {
		SendError(w, http.StatusInternalServerError, "Failed to list leave types")
		return
	}
	defer rows.Close()

	type LT struct {
		ID          string `json:"id"`
		Name        string `json:"name"`
		DaysPerYear int    `json:"days_per_year"`
	}
	var types []LT
	for rows.Next() {
		var lt LT
		if err := rows.Scan(&lt.ID, &lt.Name, &lt.DaysPerYear); err != nil {
			continue
		}
		types = append(types, lt)
	}
	if types == nil {
		types = []LT{}
	}
	SendSuccess(w, types)
}

func (h *Handler) ListLeaveRequests(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	rows, err := h.db.Query(r.Context(), `
		SELECT lr.id, lr.employee_id, COALESCE(e.first_name,'') || ' ' || COALESCE(e.last_name,''),
		       lr.start_date, lr.end_date, lr.days_requested,
		       COALESCE(lr.reason,''), lr.status
		FROM leave_requests lr
		LEFT JOIN employees e ON lr.employee_id = e.id
		WHERE lr.property_id = $1
		ORDER BY lr.created_at DESC LIMIT 100`, propertyID)
	if err != nil {
		SendError(w, http.StatusInternalServerError, "Failed to list leave requests")
		return
	}
	defer rows.Close()

	type LR struct {
		ID           string `json:"id"`
		EmployeeID   string `json:"employee_id"`
		EmployeeName string `json:"employee_name"`
		LeaveType    string `json:"leave_type"`
		StartDate    string `json:"start_date"`
		EndDate      string `json:"end_date"`
		DaysRequested int   `json:"days_requested"`
		Reason       string `json:"reason"`
		Status       string `json:"status"`
	}
	var requests []LR
	for rows.Next() {
		var lr LR
		if err := rows.Scan(&lr.ID, &lr.EmployeeID, &lr.EmployeeName,
			&lr.StartDate, &lr.EndDate, &lr.DaysRequested, &lr.Reason, &lr.Status); err != nil {
			continue
		}
		requests = append(requests, lr)
	}
	if requests == nil {
		requests = []LR{}
	}
	SendSuccess(w, requests)
}

func (h *Handler) CreateLeaveRequest(w http.ResponseWriter, r *http.Request) {
	var req struct {
		EmployeeID   string `json:"employee_id"`
		LeaveTypeID  string `json:"leave_type_id"`
		StartDate    string `json:"start_date"`
		EndDate      string `json:"end_date"`
		DaysRequested int   `json:"days_requested"`
		Reason       string `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	if req.EmployeeID == "" || req.LeaveTypeID == "" || req.StartDate == "" || req.EndDate == "" {
		SendError(w, http.StatusBadRequest, "employee_id, leave_type_id, start_date, and end_date required")
		return
	}

	propertyID := getPropertyID(r)
	id := uuid.New().String()
	_, err := h.db.Exec(r.Context(), `
		INSERT INTO leave_requests (id, employee_id, leave_type_id, start_date, end_date, days_requested, reason, property_id)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
		id, req.EmployeeID, req.LeaveTypeID, req.StartDate, req.EndDate, req.DaysRequested, req.Reason, propertyID)
	if err != nil {
		SendError(w, http.StatusInternalServerError, "Failed to create leave request")
		return
	}
	h.audit.Log(r.Context(), nil, "leave_requests", "create", id, nil, req, r)
	SendCreated(w, map[string]string{"id": id})
}

// ============================================================
// PAYROLL
// ============================================================

func (h *Handler) ListPayrollRuns(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	rows, err := h.db.Query(r.Context(), `
		SELECT id, run_number, COALESCE(period_start,''), COALESCE(period_end,''),
		       total_gross, total_deductions, total_net, status
		FROM payroll_runs WHERE property_id = $1
		ORDER BY created_at DESC LIMIT 50`, propertyID)
	if err != nil {
		SendError(w, http.StatusInternalServerError, "Failed to list payroll runs")
		return
	}
	defer rows.Close()

	var runs []PayrollRun
	for rows.Next() {
		var pr PayrollRun
		if err := rows.Scan(&pr.ID, &pr.RunName, &pr.PayPeriodStart, &pr.PayPeriodEnd,
			&pr.TotalGross, &pr.TotalDeductions, &pr.TotalNet, &pr.Status); err != nil {
			continue
		}
		pr.Lines = []PayrollLine{}
		runs = append(runs, pr)
	}
	if runs == nil {
		runs = []PayrollRun{}
	}
	SendSuccess(w, runs)
}

func (h *Handler) CreatePayrollRun(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RunName        string `json:"run_name"`
		PayPeriodStart string `json:"pay_period_start"`
		PayPeriodEnd   string `json:"pay_period_end"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	propertyID := getPropertyID(r)
	id := uuid.New().String()
	runNumber := "PR-" + time.Now().Format("200601") + "-" + fmt.Sprintf("%03d", time.Now().UnixNano()%1000)

	_, err := h.db.Exec(r.Context(), `
		INSERT INTO payroll_runs (id, property_id, run_number, period_start, period_end, status)
		VALUES ($1, $2, $3, $4, $5, 'draft')`,
		id, propertyID, runNumber, req.PayPeriodStart, req.PayPeriodEnd)
	if err != nil {
		SendError(w, http.StatusInternalServerError, "Failed to create payroll run: "+err.Error())
		return
	}

	h.audit.Log(r.Context(), nil, "payroll_runs", "create", id, nil, req, r)
	SendCreated(w, map[string]string{"id": id, "run_number": runNumber})
}

func (h *Handler) GetPayrollRun(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var pr PayrollRun
	err := h.db.QueryRow(r.Context(), `
		SELECT id, run_number, COALESCE(period_start,''), COALESCE(period_end,''),
		       total_gross, total_deductions, total_net, status
		FROM payroll_runs WHERE id = $1`, id).Scan(&pr.ID, &pr.RunName, &pr.PayPeriodStart,
		&pr.PayPeriodEnd, &pr.TotalGross, &pr.TotalDeductions, &pr.TotalNet, &pr.Status)
	if err != nil {
		SendError(w, http.StatusNotFound, "Payroll run not found")
		return
	}
	pr.Lines = []PayrollLine{}
	SendSuccess(w, pr)
}


// ============================================================
// HELPER
// ============================================================

func itoa(i int) string {
	return strconv.Itoa(i)
}

// getPropertyID extracts property ID from the X-Property-ID header (set by middleware).
func getPropertyID(r *http.Request) string {
	return r.Header.Get("X-Property-ID")
}
