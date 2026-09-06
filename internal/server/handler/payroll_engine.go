package handler

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// ═══════════════════════════════════════════════════════════════
// COMPREHENSIVE PAYROLL ENGINE
// PAYE, Pension, NHF, Payslips, Bank Export, Accounting
// ═══════════════════════════════════════════════════════════════

// ── Nigerian PAYE Tax Bands (2024/2025) ──
type TaxBand struct {
	Min      float64
	Max      float64
	Rate     float64
	Relief   float64
}

var NigeriaPAYEBands = []TaxBand{
	{Min: 0, Max: 300000, Rate: 0.07, Relief: 0},
	{Min: 300000, Max: 600000, Rate: 0.11, Relief: 0},
	{Min: 600000, Max: 1100000, Rate: 0.15, Relief: 0},
	{Min: 1100000, Max: 1600000, Rate: 0.19, Relief: 0},
	{Min: 1600000, Max: 3200000, Rate: 0.21, Relief: 0},
	{Min: 3200000, Max: 1e18, Rate: 0.24, Relief: 0},
}

// Ghana PAYE Tax Bands (Monthly)
var GhanaPAYEBands = []TaxBand{
	{Min: 0, Max: 4900, Rate: 0, Relief: 0},          // First GHS 4,900 = nil
	{Min: 4900, Max: 6000, Rate: 0.05, Relief: 0},
	{Min: 6000, Max: 7300, Rate: 0.10, Relief: 0},
	{Min: 7300, Max: 32166.67, Rate: 0.175, Relief: 0},
	{Min: 32166.67, Max: 5e9, Rate: 0.25, Relief: 0},
}

// Kenya PAYE Tax Bands (Monthly)
var KenyaPAYEBands = []TaxBand{
	{Min: 0, Max: 24000, Rate: 0.10, Relief: 2400},
	{Min: 24000, Max: 32333, Rate: 0.25, Relief: 2400},
	{Min: 32333, Max: 500000, Rate: 0.30, Relief: 2400},
	{Min: 500000, Max: 800000, Rate: 0.325, Relief: 2400},
	{Min: 800000, Max: 1e18, Rate: 0.35, Relief: 2400},
}

// South Africa Tax Bands (Monthly)
var SouthAfricaPAYEBands = []TaxBand{
	{Min: 0, Max: 95750, Rate: 0.18, Relief: 0},
	{Min: 95750, Max: 226000, Rate: 0.26, Relief: 17235},
	{Min: 226000, Max: 353100, Rate: 0.31, Relief: 28560},
	{Min: 353100, Max: 488700, Rate: 0.36, Relief: 46239},
	{Min: 488700, Max: 641400, Rate: 0.39, Relief: 60591},
	{Min: 641400, Max: 1e18, Rate: 0.41, Relief: 73440},
}

// ── Structs ──

type EmployeePayrollProfile struct {
	EmployeeID       string  `json:"employee_id"`
	EmployeeNumber   string  `json:"employee_number"`
	FirstName        string  `json:"first_name"`
	LastName         string  `json:"last_name"`
	Department       string  `json:"department"`
	Position         string  `json:"position"`
	BasicSalary      float64 `json:"basic_salary"`
	HousingAllowance float64 `json:"housing_allowance"`
	TransportAllow   float64 `json:"transport_allowance"`
	MealAllowance    float64 `json:"meal_allowance"`
	OtherAllowance   float64 `json:"other_allowance"`
	TotalAllowances  float64 `json:"total_allowances"`
	OvertimeHours    float64 `json:"overtime_hours"`
	OvertimeRate     float64 `json:"overtime_rate"`
	Bonus            float64 `json:"bonus"`
	LoanDeduction    float64 `json:"loan_deduction"`
	OtherDeduction   float64 `json:"other_deduction"`
	BankName         string  `json:"bank_name"`
	BankAccount      string  `json:"bank_account"`
	IsPensionEnroll  bool    `json:"is_pension_enrolled"`
	IsNHFEnroll      bool    `json:"is_nhf_enrolled"`
}

type PayrollCalculation struct {
	EmployeeID         string  `json:"employee_id"`
	EmployeeName       string  `json:"employee_name"`
	EmployeeNumber     string  `json:"employee_number"`
	Department         string  `json:"department"`
	BasicSalary        float64 `json:"basic_salary"`
	HousingAllowance   float64 `json:"housing_allowance"`
	TransportAllowance float64 `json:"transport_allowance"`
	MealAllowance      float64 `json:"meal_allowance"`
	OtherAllowance     float64 `json:"other_allowance"`
	OvertimePay        float64 `json:"overtime_pay"`
	Bonus              float64 `json:"bonus"`
	GrossPay           float64 `json:"gross_pay"`
	// Deductions
	IncomeTax          float64 `json:"income_tax"`           // PAYE
	PensionEmployee    float64 `json:"pension_employee"`     // 8% employee
	PensionEmployer    float64 `json:"pension_employer"`     // 10% employer
	NHF                float64 `json:"nhf"`                  // 2.5% NHF (Nigeria)
	NSSIF              float64 `json:"nssif"`                // Social security
	HealthInsurance    float64 `json:"health_insurance"`     // NHIS
	LoanDeduction      float64 `json:"loan_deduction"`
	OtherDeductions    float64 `json:"other_deductions"`
	TotalDeductions    float64 `json:"total_deductions"`
	// Net
	NetPay             float64 `json:"net_pay"`
	// Employer costs
	TotalEmployerCost  float64 `json:"total_employer_cost"`
	// Country
	Country            string  `json:"country"`
	TaxBand            string  `json:"tax_band"`
}

type Payslip struct {
	ID               string             `json:"id"`
	PayrollRunID     string             `json:"payroll_run_id"`
	EmployeeID       string             `json:"employee_id"`
	EmployeeName     string             `json:"employee_name"`
	EmployeeNumber   string             `json:"employee_number"`
	Department       string             `json:"department"`
	Position         string             `json:"position"`
	PayPeriod        string             `json:"pay_period"`
	PaymentDate      string             `json:"payment_date"`
	CompanyName      string             `json:"company_name"`
	Currency         string             `json:"currency"`
	BasicSalary      float64            `json:"basic_salary"`
	Allowances       []PayslipLineItem  `json:"allowances"`
	Earnings         []PayslipLineItem  `json:"earnings"`
	Deductions       []PayslipLineItem  `json:"deductions"`
	EmployerContribs []PayslipLineItem  `json:"employer_contributions"`
	GrossPay         float64            `json:"gross_pay"`
	TotalAllowances  float64            `json:"total_allowances"`
	TotalDeductions  float64            `json:"total_deductions"`
	TotalEarnings    float64            `json:"total_earnings"`
	NetPay           float64            `json:"net_pay"`
	BankName         string             `json:"bank_name"`
	BankAccount      string             `json:"bank_account"`
	YearToDate       YearToDateSummary  `json:"year_to_date"`
}

type PayslipLineItem struct {
	Name   string  `json:"name"`
	Amount float64 `json:"amount"`
	Type   string  `json:"type"` // earning, deduction, employer
}

type YearToDateSummary struct {
	GrossPay        float64 `json:"gross_pay"`
	TotalTax        float64 `json:"total_tax"`
	TotalPension    float64 `json:"total_pension"`
	TotalDeductions float64 `json:"total_deductions"`
	NetPay          float64 `json:"net_pay"`
}

type PayrollReport struct {
	ReportType   string      `json:"report_type"`
	PayPeriod    string      `json:"pay_period"`
	GeneratedAt  string      `json:"generated_at"`
	TotalEmployees int       `json:"total_employees"`
	TotalGross   float64     `json:"total_gross"`
	TotalPAYE    float64     `json:"total_paye"`
	TotalPension float64     `json:"total_pension"`
	TotalNHF     float64     `json:"total_nhf"`
	TotalNet     float64     `json:"total_net"`
	Data         interface{} `json:"data"`
}

// ═══════════════════════════════════════════════════════════════
// 1. PAYE CALCULATION ENGINE
// ═══════════════════════════════════════════════════════════════

func calculatePAYE(country string, annualGross float64) (float64, string) {
	var bands []TaxBand
	switch country {
	case "GH", "Ghana":
		bands = GhanaPAYEBands
	case "KE", "Kenya":
		bands = KenyaPAYEBands
	case "ZA", "South Africa":
		bands = SouthAfricaPAYEBands
	default: // Nigeria
		bands = NigeriaPAYEBands
	}

	annualTax := 0.0
	taxBand := ""
	for _, band := range bands {
		if annualGross <= band.Min {
			break
		}
		taxableInBand := math.Min(annualGross, band.Max) - band.Min
		if taxableInBand > 0 {
			tax := taxableInBand * band.Rate
			annualTax += tax
			taxBand = fmt.Sprintf("%.0f%%", band.Rate*100)
		}
	}

	// Nigeria: Personal relief of ₦200,000/year
	if country == "" || country == "NG" || country == "Nigeria" {
		annualTax = math.Max(0, annualTax-200000)
	}

	return math.Round(annualTax*100) / 100, taxBand
}

func calculatePension(country string, annualGross float64) (employee, employer float64) {
	switch country {
	case "GH", "Ghana":
		// Ghana: 5.5% employee + 13% employer
		return math.Round(annualGross*0.055*100) / 100, math.Round(annualGross*0.13*100) / 100
	case "KE", "Kenya":
		// Kenya: NSSF (simplified)
		nssf := math.Min(annualGross*0.06, 2160*12) // 6% up to cap
		return nssf, nssf
	case "ZA", "South Africa":
		// South Africa: UIF 1% employee + 1% employer
		return math.Round(annualGross*0.01*100) / 100, math.Round(annualGross*0.01*100) / 100
	default: // Nigeria
		// Nigeria: 8% employee + 10% employer (min ₦3,000 employee)
		emp := math.Max(annualGross*0.08, 36000)
		er := annualGross * 0.10
		return math.Round(emp*100) / 100, math.Round(er*100) / 100
	}
}

func calculateNHF(country string, annualGross float64) float64 {
	switch country {
	case "NG", "Nigeria", "":
		// Nigeria: 2.5% of basic salary
		return math.Round(annualGross*0.025*100) / 100
	case "GH", "Ghana":
		return math.Round(annualGross*0.055*100) / 100 // SSNIT
	default:
		return 0
	}
}

func calculateHealthInsurance(country string, annualGross float64) float64 {
	switch country {
	case "NG", "Nigeria", "":
		return math.Round(annualGross*0.0175*100) / 100 // NHIS
	case "GH", "Ghana":
		return math.Round(annualGross*0.02*100) / 100
	case "KE", "Kenya":
		return math.Round(annualGross*0.02*100) / 100 // SHIF
	default:
		return 0
	}
}

// ═══════════════════════════════════════════════════════════════
// 2. RUN PAYROLL (Full Calculation)
// ═══════════════════════════════════════════════════════════════

type empData struct {
	id, empNum, firstName, lastName, dept, position, bankName, bankAccount, status string
	salary float64
}

func (h *Handler) RunPayroll(w http.ResponseWriter, r *http.Request) {
	var req struct {
		PayPeriodStart string `json:"pay_period_start"`
		PayPeriodEnd   string `json:"pay_period_end"`
		PaymentDate    string `json:"payment_date"`
		BranchID       string `json:"branch_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	pid := getPropertyID2(r)
	ctx := r.Context()

	// ── STEP 1: Read ALL employees into memory, then close rows ──
	temps := []empData{}
	rows, err := h.db.Query(ctx, `
		SELECT e.id, e.employee_number, e.first_name, e.last_name,
		       COALESCE(d.name,'') as department, COALESCE(e.position,''),
		       COALESCE(e.salary,0), COALESCE(e.bank_name,''), COALESCE(e.bank_account,''),
		       COALESCE(e.employment_status, e.status, 'active')
		FROM employees e
		LEFT JOIN departments d ON d.id = e.department_id
		WHERE e.property_id = $1 AND COALESCE(e.employment_status, e.status, 'active') = 'active'
		ORDER BY e.employee_number`, pid)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}
	for rows.Next() {
		var e empData
		if err := rows.Scan(&e.id, &e.empNum, &e.firstName, &e.lastName, &e.dept, &e.position, &e.salary, &e.bankName, &e.bankAccount, &e.status); err == nil {
			temps = append(temps, e)
		}
	}
	rows.Close() // CRITICAL: release connection before next query

	// ── STEP 2: Read country + config + overrides, each closing before next ──
	var country string
	_ = h.db.QueryRow(ctx, `SELECT COALESCE(country,'Nigeria') FROM properties WHERE id=$1`, pid).Scan(&country)

	allowanceConfig := h.getAllowanceConfig(ctx, pid)

	overrideMap := map[string]struct {
		housing, transport, meal, loan, bonus float64
		pension, nhf bool
	}{}
	orRows, _ := h.db.Query(ctx, `SELECT employee_id, COALESCE(housing_allow,0), COALESCE(transport_allow,0), COALESCE(meal_allow,0), COALESCE(loan_deduction,0), COALESCE(bonus,0), COALESCE(is_pension,1), COALESCE(is_nhf,1) FROM payroll_overrides WHERE property_id=$1`, pid)
	if orRows != nil {
		for orRows.Next() {
			var eid string
			var o struct {
				housing, transport, meal, loan, bonus float64
				pension, nhf bool
			}
			orRows.Scan(&eid, &o.housing, &o.transport, &o.meal, &o.loan, &o.bonus, &o.pension, &o.nhf)
			overrideMap[eid] = o
		}
		orRows.Close()
	}

	// ── STEP 3: Calculate all payroll lines (pure Go, no DB) ──
	calculations := []PayrollCalculation{}
	totalGross, totalPAYE, totalPension, totalNHF, totalNet := 0.0, 0.0, 0.0, 0.0, 0.0

	for _, e := range temps {
		if e.salary <= 0 { continue }

		housingAllow := e.salary * allowanceConfig.HousingPct / 100
		transportAllow := e.salary * allowanceConfig.TransportPct / 100
		mealAllow := e.salary * allowanceConfig.MealPct / 100

		isPension, isNHF := true, true
		var overrideLoan, overrideBonus float64
		if ov, ok := overrideMap[e.id]; ok {
			if ov.housing > 0 { housingAllow = ov.housing }
			if ov.transport > 0 { transportAllow = ov.transport }
			if ov.meal > 0 { mealAllow = ov.meal }
			overrideLoan = ov.loan
			overrideBonus = ov.bonus
			isPension = ov.pension
			isNHF = ov.nhf
		}

		totalAllowances := housingAllow + transportAllow + mealAllow
		annualGross := (e.salary + totalAllowances) * 12
		bonusAnnual := overrideBonus * 12

		// Calculate PAYE
		taxableIncome := annualGross + bonusAnnual
		annualPAYE, taxBand := calculatePAYE(country, taxableIncome)
		monthlyPAYE := math.Round(annualPAYE/12*100) / 100

		// Pension
		var empPension, erPension float64
		if isPension {
			empPension, erPension = calculatePension(country, annualGross)
			empPension = math.Round(empPension/12*100) / 100
			erPension = math.Round(erPension/12*100) / 100
		}

		// NHF
		var nhf float64
		if isNHF {
			nhf = calculateNHF(country, e.salary)
			nhf = math.Round(nhf*100) / 100
		}

		// Health Insurance
		healthIns := math.Round(calculateHealthInsurance(country, e.salary)*100) / 100

		// Gross
		gross := e.salary + totalAllowances + overrideBonus

		// Total deductions
		totalDed := monthlyPAYE + empPension + nhf + healthIns + overrideLoan

		// Net
		net := gross - totalDed

		calc := PayrollCalculation{
			EmployeeID:         e.id,
			EmployeeName:       fmt.Sprintf("%s %s", e.firstName, e.lastName),
			EmployeeNumber:     e.empNum,
			Department:         e.dept,
			BasicSalary:        e.salary,
			HousingAllowance:   housingAllow,
			TransportAllowance: transportAllow,
			MealAllowance:      mealAllow,
			OtherAllowance:     overrideBonus,
			OvertimePay:        0,
			Bonus:              overrideBonus,
			GrossPay:           gross,
			IncomeTax:          monthlyPAYE,
			PensionEmployee:    empPension,
			PensionEmployer:    erPension,
			NHF:                nhf,
			NSSIF:              0,
			HealthInsurance:    healthIns,
			LoanDeduction:      overrideLoan,
			OtherDeductions:    0,
			TotalDeductions:    totalDed,
			NetPay:             math.Round(net*100) / 100,
			TotalEmployerCost:  gross + erPension,
			Country:            country,
			TaxBand:            taxBand,
		}
		calculations = append(calculations, calc)

		totalGross += gross
		totalPAYE += monthlyPAYE
		totalPension += empPension
		totalNHF += nhf
		totalNet += calc.NetPay
	}

	// Create payroll run
	runID := uuid.New().String()
	runNum := fmt.Sprintf("PR-%s", time.Now().Format("200601"))
	_, err = h.db.Exec(ctx, `
		INSERT INTO payroll_runs (id, property_id, run_number, period_start, period_end, total_gross, total_deductions, total_net, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'calculated')`,
		runID, pid, runNum, req.PayPeriodStart, req.PayPeriodEnd,
		totalGross, totalPAYE+totalPension+totalNHF, totalNet)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Save individual lines
	for _, c := range calculations {
		lineID := uuid.New().String()
		_, _ = h.db.Exec(ctx, `
			INSERT INTO payroll_lines (id, run_id, employee_id, basic_salary, allowances_total,
			overtime_pay, bonus, gross_pay, income_tax, pension_employee, pension_employer,
			nhf, health_insurance, loan_deduction, other_deductions, total_deductions, net_pay, tax_band, country)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
			lineID, runID, c.EmployeeID, c.BasicSalary, c.HousingAllowance+c.TransportAllowance+c.MealAllowance+c.OtherAllowance,
			c.OvertimePay, c.Bonus, c.GrossPay, c.IncomeTax, c.PensionEmployee, c.PensionEmployer,
			c.NHF, c.HealthInsurance, c.LoanDeduction, c.OtherDeductions, c.TotalDeductions, c.NetPay, c.TaxBand, c.Country)
	}

	SendSuccess(w, map[string]interface{}{
		"run_id":          runID,
		"run_number":      runNum,
		"period":          fmt.Sprintf("%s to %s", req.PayPeriodStart, req.PayPeriodEnd),
		"total_employees": len(calculations),
		"total_gross":     math.Round(totalGross*100) / 100,
		"total_paye":      math.Round(totalPAYE*100) / 100,
		"total_pension":   math.Round(totalPension*100) / 100,
		"total_nhf":       math.Round(totalNHF*100) / 100,
		"total_net":       math.Round(totalNet*100) / 100,
		"status":          "calculated",
		"lines":           calculations,
	})
}

// ═══════════════════════════════════════════════════════════════
// 3. APPROVE PAYROLL
// ═══════════════════════════════════════════════════════════════

func (h *Handler) ApprovePayroll(w http.ResponseWriter, r *http.Request) {
	runID := chi.URLParam(r, "runId")
	pid := getPropertyID2(r)

	var status string
	err := h.db.QueryRow(r.Context(), `SELECT status FROM payroll_runs WHERE id=$1 AND property_id=$2`, runID, pid).Scan(&status)
	if err != nil {
		SendError(w, http.StatusNotFound, "Payroll run not found")
		return
	}
	if status != "calculated" {
		SendError(w, http.StatusBadRequest, "Only calculated runs can be approved")
		return
	}

	_, _ = h.db.Exec(r.Context(), `UPDATE payroll_runs SET status='approved', updated_at=CURRENT_TIMESTAMP WHERE id=$1`, runID)
	SendSuccess(w, map[string]interface{}{"id": runID, "status": "approved"})
}

// ═══════════════════════════════════════════════════════════════
// 4. PROCESS PAYMENT (Mark as paid)
// ═══════════════════════════════════════════════════════════════

func (h *Handler) ProcessPayrollPayment(w http.ResponseWriter, r *http.Request) {
	runID := chi.URLParam(r, "runId")
	pid := getPropertyID2(r)

	var status string
	err := h.db.QueryRow(r.Context(), `SELECT status FROM payroll_runs WHERE id=$1 AND property_id=$2`, runID, pid).Scan(&status)
	if err != nil {
		SendError(w, http.StatusNotFound, "Payroll run not found")
		return
	}
	if status != "approved" {
		SendError(w, http.StatusBadRequest, "Only approved runs can be paid")
		return
	}

	_, _ = h.db.Exec(r.Context(), `UPDATE payroll_runs SET status='paid', updated_at=CURRENT_TIMESTAMP WHERE id=$1`, runID)
	SendSuccess(w, map[string]interface{}{"id": runID, "status": "paid"})
}

// ═══════════════════════════════════════════════════════════════
// 5. GENERATE PAYSLIPS
// ═══════════════════════════════════════════════════════════════

func (h *Handler) GeneratePayslips(w http.ResponseWriter, r *http.Request) {
	runID := chi.URLParam(r, "runId")
	pid := getPropertyID2(r)
	ctx := r.Context()

	// Get property name
	var propName, currency string
	_ = h.db.QueryRow(ctx, `SELECT name, COALESCE(currency,'NGN') FROM properties WHERE id=$1`, pid).Scan(&propName, &currency)

	// Get payroll run
	var periodStart, periodEnd string
	err := h.db.QueryRow(ctx, `SELECT period_start, period_end FROM payroll_runs WHERE id=$1 AND property_id=$2`, runID, pid).Scan(&periodStart, &periodEnd)
	if err != nil {
		SendError(w, http.StatusNotFound, "Payroll run not found")
		return
	}

	// Get all lines
	rows, err := h.db.Query(ctx, `
		SELECT pl.employee_id, pl.basic_salary, pl.allowances_total, pl.bonus, pl.gross_pay,
		       pl.income_tax, pl.pension_employee, pl.pension_employer, pl.nhf,
		       pl.health_insurance, pl.loan_deduction, pl.total_deductions, pl.net_pay, pl.tax_band,
		       e.first_name, e.last_name, e.employee_number, COALESCE(d.name,''), COALESCE(e.position,''),
		       COALESCE(e.bank_name,''), COALESCE(e.bank_account,'')
		FROM payroll_lines pl
		JOIN employees e ON e.id = pl.employee_id
		LEFT JOIN departments d ON d.id = e.department_id
		WHERE pl.run_id = $1`, runID)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	payslips := []Payslip{}
	for rows.Next() {
		var empID string
		var basicSalary, allowances, bonus, grossPay, incomeTax, empPension, erPension, nhf, healthIns, loanDed, totalDed, netPay float64
		var taxBand, firstName, lastName, empNum, dept, position, bankName, bankAcc string
		_ = rows.Scan(&empID, &basicSalary, &allowances, &bonus, &grossPay,
			&incomeTax, &empPension, &erPension, &nhf, &healthIns, &loanDed, &totalDed, &netPay, &taxBand,
			&firstName, &lastName, &empNum, &dept, &position, &bankName, &bankAcc)

		ps := Payslip{
			ID:             uuid.New().String(),
			PayrollRunID:   runID,
			EmployeeID:     empID,
			EmployeeName:   fmt.Sprintf("%s %s", firstName, lastName),
			EmployeeNumber: empNum,
			Department:     dept,
			Position:       position,
			PayPeriod:      fmt.Sprintf("%s to %s", periodStart, periodEnd),
			PaymentDate:    time.Now().Format("2006-01-02"),
			CompanyName:    propName,
			Currency:       currency,
			BasicSalary:    basicSalary,
			Allowances: []PayslipLineItem{
				{Name: "Housing Allowance", Amount: allowances * 0.4, Type: "earning"},
				{Name: "Transport Allowance", Amount: allowances * 0.3, Type: "earning"},
				{Name: "Meal Allowance", Amount: allowances * 0.3, Type: "earning"},
			},
			Earnings: []PayslipLineItem{
				{Name: "Basic Salary", Amount: basicSalary, Type: "earning"},
			},
			Deductions: []PayslipLineItem{
				{Name: "PAYE Income Tax", Amount: incomeTax, Type: "deduction"},
				{Name: "Pension (Employee)", Amount: empPension, Type: "deduction"},
				{Name: "NHF", Amount: nhf, Type: "deduction"},
				{Name: "Health Insurance", Amount: healthIns, Type: "deduction"},
			},
			EmployerContribs: []PayslipLineItem{
				{Name: "Pension (Employer)", Amount: erPension, Type: "employer"},
			},
			GrossPay:        grossPay,
			TotalAllowances: allowances,
			TotalDeductions: totalDed,
			NetPay:          netPay,
			BankName:        bankName,
			BankAccount:     bankAcc,
		}
		if loanDed > 0 {
			ps.Deductions = append(ps.Deductions, PayslipLineItem{Name: "Loan Repayment", Amount: loanDed, Type: "deduction"})
		}
		payslips = append(payslips, ps)
	}

	SendSuccess(w, map[string]interface{}{
		"payslips": payslips,
		"count":    len(payslips),
		"currency": currency,
		"company":  propName,
	})
}

// ═══════════════════════════════════════════════════════════════
// 6. SINGLE PAYSLIP (for PDF export)
// ═══════════════════════════════════════════════════════════════

func (h *Handler) GetPayslip(w http.ResponseWriter, r *http.Request) {
	runID := chi.URLParam(r, "runId")
	empID := chi.URLParam(r, "empId")
	pid := getPropertyID2(r)
	ctx := r.Context()

	var propName, currency string
	_ = h.db.QueryRow(ctx, `SELECT name, COALESCE(currency,'NGN') FROM properties WHERE id=$1`, pid).Scan(&propName, &currency)

	var periodStart, periodEnd string
	_ = h.db.QueryRow(ctx, `SELECT period_start, period_end FROM payroll_runs WHERE id=$1`, runID).Scan(&periodStart, &periodEnd)

	var basicSalary, allowances, bonus, grossPay, incomeTax, empPension, erPension, nhf, healthIns, loanDed, totalDed, netPay float64
	var taxBand, firstName, lastName, empNum, dept, position, bankName, bankAcc string
	err := h.db.QueryRow(ctx, `
		SELECT pl.basic_salary, pl.allowances_total, pl.bonus, pl.gross_pay,
		       pl.income_tax, pl.pension_employee, pl.pension_employer, pl.nhf,
		       pl.health_insurance, pl.loan_deduction, pl.total_deductions, pl.net_pay, pl.tax_band,
		       e.first_name, e.last_name, e.employee_number, COALESCE(d.name,''), COALESCE(e.position,''),
		       COALESCE(e.bank_name,''), COALESCE(e.bank_account,'')
		FROM payroll_lines pl
		JOIN employees e ON e.id = pl.employee_id
		LEFT JOIN departments d ON d.id = e.department_id
		WHERE pl.run_id=$1 AND pl.employee_id=$2`, runID, empID).Scan(
		&basicSalary, &allowances, &bonus, &grossPay,
		&incomeTax, &empPension, &erPension, &nhf, &healthIns, &loanDed, &totalDed, &netPay, &taxBand,
		&firstName, &lastName, &empNum, &dept, &position, &bankName, &bankAcc)
	if err != nil {
		SendError(w, http.StatusNotFound, "Payslip not found")
		return
	}

	ps := Payslip{
		ID:             uuid.New().String(),
		PayrollRunID:   runID,
		EmployeeID:     empID,
		EmployeeName:   fmt.Sprintf("%s %s", firstName, lastName),
		EmployeeNumber: empNum,
		Department:     dept,
		Position:       position,
		PayPeriod:      fmt.Sprintf("%s to %s", periodStart, periodEnd),
		PaymentDate:    time.Now().Format("2006-01-02"),
		CompanyName:    propName,
		Currency:       currency,
		BasicSalary:    basicSalary,
		Allowances: []PayslipLineItem{
			{Name: "Housing Allowance", Amount: allowances * 0.4, Type: "earning"},
			{Name: "Transport Allowance", Amount: allowances * 0.3, Type: "earning"},
			{Name: "Meal Allowance", Amount: allowances * 0.3, Type: "earning"},
		},
		Earnings: []PayslipLineItem{
			{Name: "Basic Salary", Amount: basicSalary, Type: "earning"},
		},
		Deductions: []PayslipLineItem{
			{Name: "PAYE Income Tax", Amount: incomeTax, Type: "deduction"},
			{Name: "Pension (Employee)", Amount: empPension, Type: "deduction"},
			{Name: "NHF", Amount: nhf, Type: "deduction"},
			{Name: "Health Insurance", Amount: healthIns, Type: "deduction"},
		},
		EmployerContribs: []PayslipLineItem{
			{Name: "Pension (Employer)", Amount: erPension, Type: "employer"},
		},
		GrossPay:        grossPay,
		TotalAllowances: allowances,
		TotalDeductions: totalDed,
		NetPay:          netPay,
		BankName:        bankName,
		BankAccount:     bankAcc,
	}
	if loanDed > 0 {
		ps.Deductions = append(ps.Deductions, PayslipLineItem{Name: "Loan Repayment", Amount: loanDed, Type: "deduction"})
	}

	SendSuccess(w, ps)
}

// ═══════════════════════════════════════════════════════════════
// 7. BANK PAYMENT FILE EXPORT (NIP/NEFT CSV)
// ═══════════════════════════════════════════════════════════════

func (h *Handler) ExportBankPaymentFile(w http.ResponseWriter, r *http.Request) {
	runID := chi.URLParam(r, "runId")
	ctx := r.Context()

	rows, err := h.db.Query(ctx, `
		SELECT e.first_name, e.last_name, e.bank_name, e.bank_account, pl.net_pay
		FROM payroll_lines pl
		JOIN employees e ON e.id = pl.employee_id
		WHERE pl.run_id=$1 AND pl.net_pay > 0
		ORDER BY e.last_name`, runID)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	// Generate CSV
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=payroll_%s.csv", runID[:8]))

	writer := csv.NewWriter(w)
	writer.Write([]string{"Beneficiary Name", "Bank Name", "Account Number", "Amount", "Narration"})

	totalAmount := 0.0
	count := 0
	for rows.Next() {
		var fName, lName, bankName, account string
		var amount float64
		_ = rows.Scan(&fName, &lName, &bankName, &account, &amount)
		writer.Write([]string{
			fmt.Sprintf("%s %s", fName, lName),
			bankName,
			account,
			fmt.Sprintf("%.2f", amount),
			fmt.Sprintf("Salary %s", time.Now().Format("Jan 2006")),
		})
		totalAmount += amount
		count++
	}
	writer.Flush()

	// Send summary after CSV (client can parse)
	_ = count
	_ = totalAmount
}

// ═══════════════════════════════════════════════════════════════
// 8. PAYROLL REPORTS
// ═══════════════════════════════════════════════════════════════

func (h *Handler) PayrollSummaryReport(w http.ResponseWriter, r *http.Request) {
	runID := chi.URLParam(r, "runId")
	ctx := r.Context()

	var periodStart, periodEnd, status string
	var totalGross, totalNet float64
	err := h.db.QueryRow(ctx, `SELECT period_start, period_end, status, total_gross, total_net FROM payroll_runs WHERE id=$1`, runID).Scan(
		&periodStart, &periodEnd, &status, &totalGross, &totalNet)
	if err != nil {
		SendError(w, http.StatusNotFound, "Payroll run not found")
		return
	}

	// Department breakdown
	deptRows, _ := h.db.Query(ctx, `
		SELECT COALESCE(d.name,'Unassigned') as dept, COUNT(*),
		       SUM(pl.gross_pay), SUM(pl.income_tax), SUM(pl.pension_employee), SUM(pl.nhf), SUM(pl.net_pay)
		FROM payroll_lines pl
		JOIN employees e ON e.id = pl.employee_id
		LEFT JOIN departments d ON d.id = e.department_id
		WHERE pl.run_id=$1
		GROUP BY d.name ORDER BY SUM(pl.gross_pay) DESC`, runID)
	defer deptRows.Close()

	type DeptBreakdown struct {
		Department string  `json:"department"`
		Count      int     `json:"employee_count"`
		GrossPay   float64 `json:"gross_pay"`
		PAYE       float64 `json:"paye"`
		Pension    float64 `json:"pension"`
		NHF        float64 `json:"nhf"`
		NetPay     float64 `json:"net_pay"`
	}
	depts := []DeptBreakdown{}
	for deptRows.Next() {
		var d DeptBreakdown
		deptRows.Scan(&d.Department, &d.Count, &d.GrossPay, &d.PAYE, &d.Pension, &d.NHF, &d.NetPay)
		depts = append(depts, d)
	}

	// PAYE schedule
	payeRows, _ := h.db.Query(ctx, `
		SELECT e.employee_number, e.first_name, e.last_name, pl.gross_pay, pl.income_tax, pl.tax_band
		FROM payroll_lines pl JOIN employees e ON e.id = pl.employee_id
		WHERE pl.run_id=$1 AND pl.income_tax > 0 ORDER BY pl.income_tax DESC`, runID)
	defer payeRows.Close()

	type PayeSchedule struct {
		EmpNum string  `json:"employee_number"`
		Name   string  `json:"name"`
		Gross  float64 `json:"gross_pay"`
		Tax    float64 `json:"paye"`
		Band   string  `json:"tax_band"`
	}
	payeSchedule := []PayeSchedule{}
	for payeRows.Next() {
		var p PayeSchedule
		payeRows.Scan(&p.EmpNum, &p.Name, &p.Gross, &p.Tax, &p.Band)
		payeSchedule = append(payeSchedule, p)
	}

	// Pension schedule
	pensionRows, _ := h.db.Query(ctx, `
		SELECT e.employee_number, e.first_name, e.last_name, pl.gross_pay, pl.pension_employee, pl.pension_employer
		FROM payroll_lines pl JOIN employees e ON e.id = pl.employee_id
		WHERE pl.run_id=$1 AND pl.pension_employee > 0 ORDER BY pl.pension_employee DESC`, runID)
	defer pensionRows.Close()

	type PensionSchedule struct {
		EmpNum     string  `json:"employee_number"`
		Name       string  `json:"name"`
		Employee   float64 `json:"employee_contribution"`
		Employer   float64 `json:"employer_contribution"`
		Total      float64 `json:"total_remittance"`
	}
	pensionSchedule := []PensionSchedule{}
	for pensionRows.Next() {
		var p PensionSchedule
		pensionRows.Scan(&p.EmpNum, &p.Name, &p.Employee, &p.Employer)
		p.Total = p.Employee + p.Employer
		pensionSchedule = append(pensionSchedule, p)
	}

	SendSuccess(w, map[string]interface{}{
		"report_type":   "payroll_summary",
		"pay_period":    fmt.Sprintf("%s to %s", periodStart, periodEnd),
		"status":        status,
		"total_gross":   totalGross,
		"total_net":     totalNet,
		"department_breakdown": depts,
		"paye_schedule": payeSchedule,
		"pension_schedule": pensionSchedule,
	})
}

func (h *Handler) CostByDepartmentReport(w http.ResponseWriter, r *http.Request) {
	runID := chi.URLParam(r, "runId")
	ctx := r.Context()

	rows, _ := h.db.Query(ctx, `
		SELECT COALESCE(d.name,'Unassigned') as dept, COUNT(*),
		       SUM(pl.gross_pay), SUM(pl.total_deductions), SUM(pl.net_pay),
		       SUM(pl.pension_employer) as employer_cost
		FROM payroll_lines pl
		JOIN employees e ON e.id = pl.employee_id
		LEFT JOIN departments d ON d.id = e.department_id
		WHERE pl.run_id=$1
		GROUP BY d.name ORDER BY SUM(pl.gross_pay) DESC`, runID)
	defer rows.Close()

	type DeptCost struct {
		Department    string  `json:"department"`
		Headcount     int     `json:"headcount"`
		AvgSalary     float64 `json:"avg_salary"`
		TotalGross    float64 `json:"total_gross"`
		TotalDeductions float64 `json:"total_deductions"`
		TotalNet      float64 `json:"total_net"`
		EmployerCost  float64 `json:"employer_cost"`
		PctOfTotal    float64 `json:"pct_of_total"`
	}
	costs := []DeptCost{}
	totalGross := 0.0
	for rows.Next() {
		var c DeptCost
		rows.Scan(&c.Department, &c.Headcount, &c.TotalGross, &c.TotalDeductions, &c.TotalNet, &c.EmployerCost)
		if c.Headcount > 0 {
			c.AvgSalary = math.Round(c.TotalGross/float64(c.Headcount)*100) / 100
		}
		totalGross += c.TotalGross
		costs = append(costs, c)
	}
	for i := range costs {
		if totalGross > 0 {
			costs[i].PctOfTotal = math.Round(costs[i].TotalGross/totalGross*10000) / 100
		}
	}

	SendSuccess(w, map[string]interface{}{
		"report_type": "cost_by_department",
		"departments": costs,
		"total_gross": totalGross,
	})
}

// ═══════════════════════════════════════════════════════════════
// 9. ACCOUNTING INTEGRATION (Post to Ledger)
// ═══════════════════════════════════════════════════════════════

func (h *Handler) PostPayrollToLedger(w http.ResponseWriter, r *http.Request) {
	runID := chi.URLParam(r, "runId")
	pid := getPropertyID2(r)
	ctx := r.Context()

	var status string
	_ = h.db.QueryRow(ctx, `SELECT status FROM payroll_runs WHERE id=$1 AND property_id=$2`, runID, pid).Scan(&status)
	if status != "approved" && status != "paid" {
		SendError(w, http.StatusBadRequest, "Payroll must be approved before posting to ledger")
		return
	}

	// Get totals
	var totalGross, totalPAYE, totalPensionEmp, totalNHF, totalNet float64
	_ = h.db.QueryRow(ctx, `
		SELECT SUM(gross_pay), SUM(income_tax), SUM(pension_employee), SUM(nhf), SUM(net_pay)
		FROM payroll_lines WHERE run_id=$1`, runID).Scan(
		&totalGross, &totalPAYE, &totalPensionEmp, &totalNHF, &totalNet)

	// Create journal entries
	// 1. Salary Expense (debit)
	journalID := uuid.New().String()
	_, _ = h.db.Exec(ctx, `
		INSERT INTO journal_entries (id, property_id, entry_date, narration, reference, status)
		VALUES ($1, $2, CURRENT_TIMESTAMP, 'Monthly Payroll - Salary Expense', $3, 'posted')`,
		journalID, pid, runID)

	// Salary expense line
	_, _ = h.db.Exec(ctx, `
		INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, description, debit, credit)
		VALUES (?, ?, 'acc-salary-expense', 'Salary expense for payroll period', ?, 0)`,
		uuid.New().String(), journalID, totalGross)

	// PAYE payable (credit)
	if totalPAYE > 0 {
		_, _ = h.db.Exec(ctx, `
			INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, description, debit, credit)
			VALUES (?, ?, 'acc-paye-payable', 'PAYE tax payable to FIRS', 0, ?)`,
			uuid.New().String(), journalID, totalPAYE)
	}

	// Pension payable (credit)
	if totalPensionEmp > 0 {
		_, _ = h.db.Exec(ctx, `
			INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, description, debit, credit)
			VALUES (?, ?, 'acc-pension-payable', 'Pension contribution payable to PenCom', 0, ?)`,
			uuid.New().String(), journalID, totalPensionEmp)
	}

	// NHF payable (credit)
	if totalNHF > 0 {
		_, _ = h.db.Exec(ctx, `
			INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, description, debit, credit)
			VALUES (?, ?, 'acc-nhf-payable', 'NHF deduction payable to NHF Board', 0, ?)`,
			uuid.New().String(), journalID, totalNHF)
	}

	// Net pay payable (credit)
	if totalNet > 0 {
		_, _ = h.db.Exec(ctx, `
			INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, description, debit, credit)
			VALUES (?, ?, 'acc-salary-payable', 'Net salary payable to employees', 0, ?)`,
			uuid.New().String(), journalID, totalNet)
	}

	SendSuccess(w, map[string]interface{}{
		"journal_id":  journalID,
		"total_debit": totalGross,
		"total_credit": totalPAYE + totalPensionEmp + totalNHF + totalNet,
		"message":     "Payroll posted to general ledger successfully",
	})
}

// ═══════════════════════════════════════════════════════════════
// 10. EMPLOYEE SELF-SERVICE
// ═══════════════════════════════════════════════════════════════

func (h *Handler) GetMyPayslips(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	// Get employee from JWT
	claims := r.Context().Value("claims").(interface{ GetUserID() string })
	empUserID := claims.GetUserID()

	pid := getPropertyID2(r)
	rows, _ := h.db.Query(ctx, `
		SELECT pl.run_id, pr.period_start, pr.period_end, pr.status,
		       pl.basic_salary, pl.gross_pay, pl.income_tax, pl.pension_employee,
		       pl.nhf, pl.total_deductions, pl.net_pay
		FROM payroll_lines pl
		JOIN employees e ON e.id = pl.employee_id
		JOIN payroll_runs pr ON pr.id = pl.run_id
		WHERE e.user_id=$1 AND e.property_id=$2
		ORDER BY pr.period_start DESC LIMIT 12`, empUserID, pid)
	if rows == nil {
		SendSuccess(w, []interface{}{})
		return
	}
	defer rows.Close()

	type MyPayslip struct {
		RunID         string  `json:"run_id"`
		Period        string  `json:"period"`
		Status        string  `json:"status"`
		GrossPay      float64 `json:"gross_pay"`
		Tax           float64 `json:"paye"`
		Pension       float64 `json:"pension"`
		NHF           float64 `json:"nhf"`
		TotalDeductions float64 `json:"total_deductions"`
		NetPay        float64 `json:"net_pay"`
	}
	payslips := []MyPayslip{}
	for rows.Next() {
		var p MyPayslip
		var start, end string
		rows.Scan(&p.RunID, &start, &end, &p.Status,
			&p.GrossPay, &p.GrossPay, &p.Tax, &p.Pension,
			&p.NHF, &p.TotalDeductions, &p.NetPay)
		p.Period = fmt.Sprintf("%s to %s", start, end)
		payslips = append(payslips, p)
	}
	SendSuccess(w, payslips)
}

func (h *Handler) GetMyAttendance(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	claims := r.Context().Value("claims").(interface{ GetUserID() string })
	empUserID := claims.GetUserID()
	pid := getPropertyID2(r)

	rows, _ := h.db.Query(ctx, `
		SELECT a.date, a.clock_in, a.clock_out, a.hours_worked, a.overtime_hours, a.status
		FROM attendance_records a
		JOIN employees e ON e.id = a.employee_id
		WHERE e.user_id=$1 AND e.property_id=$2
		ORDER BY a.date DESC LIMIT 30`, empUserID, pid)
	if rows == nil {
		SendSuccess(w, []interface{}{})
		return
	}
	defer rows.Close()

	type AttendanceEntry struct {
		Date      string  `json:"date"`
		ClockIn   string  `json:"clock_in"`
		ClockOut  string  `json:"clock_out"`
		Hours     float64 `json:"hours_worked"`
		Overtime  float64 `json:"overtime_hours"`
		Status    string  `json:"status"`
	}
	entries := []AttendanceEntry{}
	for rows.Next() {
		var e AttendanceEntry
		rows.Scan(&e.Date, &e.ClockIn, &e.ClockOut, &e.Hours, &e.Overtime, &e.Status)
		entries = append(entries, e)
	}
	SendSuccess(w, entries)
}

func (h *Handler) GetMyLeaveBalance(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	claims := r.Context().Value("claims").(interface{ GetUserID() string })
	empUserID := claims.GetUserID()
	pid := getPropertyID2(r)

	rows, _ := h.db.Query(ctx, `
		SELECT lt.name, COALESCE(lb.total_entitled, lt.days_per_year), COALESCE(lb.taken, 0),
		       COALESCE(lb.total_entitled, lt.days_per_year) - COALESCE(lb.taken, 0) as remaining
		FROM leave_types lt
		LEFT JOIN leave_balances lb ON lb.leave_type_id = lt.id AND lb.employee_id = (
			SELECT id FROM employees WHERE user_id=$1 AND property_id=$2 LIMIT 1
		)
		WHERE lt.property_id=$2 AND lt.status='active'`, empUserID, pid)
	if rows == nil {
		SendSuccess(w, []interface{}{})
		return
	}
	defer rows.Close()

	type LeaveBalance struct {
		Type      string  `json:"type"`
		Entitled  int     `json:"entitled_days"`
		Taken     int     `json:"days_taken"`
		Remaining int     `json:"days_remaining"`
	}
	balances := []LeaveBalance{}
	for rows.Next() {
		var b LeaveBalance
		rows.Scan(&b.Type, &b.Entitled, &b.Taken, &b.Remaining)
		balances = append(balances, b)
	}
	SendSuccess(w, balances)
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

type AllowanceConfig struct {
	HousingPct   float64
	TransportPct float64
	MealPct      float64
}

func (h *Handler) getAllowanceConfig(ctx context.Context, pid string) AllowanceConfig {
	config := AllowanceConfig{HousingPct: 20, TransportPct: 10, MealPct: 5} // defaults
	rows, _ := h.db.Query(ctx, `SELECT key, value FROM system_settings WHERE property_id=$1 AND category='payroll'`, pid)
	if rows == nil {
		return config
	}
	defer rows.Close()
	for rows.Next() {
		var key, value string
		rows.Scan(&key, &value)
		switch key {
		case "housing_pct":
			config.HousingPct, _ = strconv.ParseFloat(value, 64)
		case "transport_pct":
			config.TransportPct, _ = strconv.ParseFloat(value, 64)
		case "meal_pct":
			config.MealPct, _ = strconv.ParseFloat(value, 64)
		}
	}
	return config
}

// GetAllowanceConfigHandler returns current payroll config
func (h *Handler) GetPayrollConfig(w http.ResponseWriter, r *http.Request) {
	pid := getPropertyID2(r)
	config := h.getAllowanceConfig(r.Context(), pid)
	SendSuccess(w, config)
}

// UpdatePayrollConfig saves payroll config
func (h *Handler) UpdatePayrollConfig(w http.ResponseWriter, r *http.Request) {
	pid := getPropertyID2(r)
	var req AllowanceConfig
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}

	ctx := r.Context()
	for k, v := range map[string]float64{
		"housing_pct":   req.HousingPct,
		"transport_pct": req.TransportPct,
		"meal_pct":      req.MealPct,
	} {
		_, _ = h.db.Exec(ctx, `
			INSERT INTO system_settings (property_id, category, key, value)
			VALUES ($1, 'payroll', $2, $3)
			ON CONFLICT(property_id, category, key) DO UPDATE SET value=$3`, pid, k, fmt.Sprintf("%.2f", v))
	}

	SendSuccess(w, map[string]string{"message": "Payroll config updated"})
}

// ListPayrollRunsEnhanced returns payroll runs with summary
func (h *Handler) ListPayrollRunsEnhanced(w http.ResponseWriter, r *http.Request) {
	pid := getPropertyID2(r)
	rows, err := h.db.Query(r.Context(), `
		SELECT id, run_number, COALESCE(period_start,''), COALESCE(period_end,''),
		       total_gross, total_deductions, total_net, status, created_at::text
		FROM payroll_runs WHERE property_id=$1
		ORDER BY created_at DESC LIMIT 20`, pid)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	type RunSummary struct {
		ID              string  `json:"id"`
		RunNumber       string  `json:"run_number"`
		PeriodStart     string  `json:"period_start"`
		PeriodEnd       string  `json:"period_end"`
		TotalGross      float64 `json:"total_gross"`
		TotalDeductions float64 `json:"total_deductions"`
		TotalNet        float64 `json:"total_net"`
		Status          string  `json:"status"`
		CreatedAt       string  `json:"created_at"`
	}
	runs := []RunSummary{}
	for rows.Next() {
		var run RunSummary
		rows.Scan(&run.ID, &run.RunNumber, &run.PeriodStart, &run.PeriodEnd,
			&run.TotalGross, &run.TotalDeductions, &run.TotalNet, &run.Status, &run.CreatedAt)
		runs = append(runs, run)
	}
	SendSuccess(w, runs)
}

// MultiBranchPayrollSummary shows consolidated payroll across branches
func (h *Handler) MultiBranchPayrollSummary(w http.ResponseWriter, r *http.Request) {
	runID := chi.URLParam(r, "runId")
	ctx := r.Context()

	rows, _ := h.db.Query(ctx, `
		SELECT pr.run_number, pr.period_start, pr.period_end, pr.status, pr.total_gross, pr.total_net
		FROM payroll_runs pr
		WHERE pr.id=$1 OR (pr.period_start = (SELECT period_start FROM payroll_runs WHERE id=$1)
		              AND pr.period_end = (SELECT period_end FROM payroll_runs WHERE id=$1))
		ORDER BY pr.property_id`, runID)
	if rows == nil {
		SendSuccess(w, []interface{}{})
		return
	}
	defer rows.Close()

	type BranchPayroll struct {
		RunNumber string  `json:"run_number"`
		Period    string  `json:"period"`
		Status    string  `json:"status"`
		Gross     float64 `json:"gross_pay"`
		Net       float64 `json:"net_pay"`
	}
	branches := []BranchPayroll{}
	totalGross := 0.0
	for rows.Next() {
		var b BranchPayroll
		var start, end string
		rows.Scan(&b.RunNumber, &start, &end, &b.Status, &b.Gross, &b.Net)
		b.Period = fmt.Sprintf("%s to %s", start, end)
		totalGross += b.Gross
		branches = append(branches, b)
	}

	SendSuccess(w, map[string]interface{}{
		"branches":       branches,
		"total_gross":    totalGross,
		"branch_count":   len(branches),
	})
}

// Ensure unused imports are consumed
var _ = strings.TrimSpace
