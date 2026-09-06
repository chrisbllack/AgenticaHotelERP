package handler

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"infineon/internal/response"

	"github.com/google/uuid"
)

// ── Property Settings ──────────────────────────────────────

func (h *Handler) GetPropertySettings(w http.ResponseWriter, r *http.Request) {
	id := getPropertyID(r)

	var name, code, status, currency, timezone, country string
	var address, city, state, telephone, email *string
	var serviceChargeRate, vatRate float64

	err := h.db.QueryRow(r.Context(), `
		SELECT name, code, status, currency, timezone, COALESCE(country,'Nigeria'),
			address, city, state, telephone, email,
			COALESCE(service_charge_rate,10), COALESCE(vat_rate,7.5)
		FROM properties WHERE id = $1 AND deleted_at IS NULL
	`, id).Scan(&name, &code, &status, &currency, &timezone, &country,
		&address, &city, &state, &telephone, &email,
		&serviceChargeRate, &vatRate)

	if err != nil {
		response.RespondError(w, "Property not found", http.StatusNotFound)
		return
	}

	result := map[string]interface{}{
		"id": id, "name": name, "code": code, "status": status,
		"currency": currency, "timezone": timezone, "country": country,
		"service_charge_rate": serviceChargeRate, "vat_rate": vatRate,
	}
	if address != nil {
		result["address"] = *address
	}
	if city != nil {
		result["city"] = *city
	}
	if state != nil {
		result["state"] = *state
	}
	if telephone != nil {
		result["telephone"] = *telephone
	}
	if email != nil {
		result["email"] = *email
	}
	response.RespondSuccess(w, result, "Property settings retrieved")
}

func (h *Handler) UpdatePropertySettings(w http.ResponseWriter, r *http.Request) {
	id := getPropertyID(r)

	var req struct {
		Name              string  `json:"name"`
		Address           string  `json:"address"`
		City              string  `json:"city"`
		State             string  `json:"state"`
		Country           string  `json:"country"`
		Telephone         string  `json:"telephone"`
		Email             string  `json:"email"`
		Currency          string  `json:"currency"`
		Timezone          string  `json:"timezone"`
		ServiceChargeRate float64 `json:"service_charge_rate"`
		VatRate           float64 `json:"vat_rate"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.RespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	_, err := h.db.Exec(r.Context(), `
		UPDATE properties SET
			name = COALESCE(NULLIF($2, ''), name),
			address = NULLIF($3, ''),
			city = NULLIF($4, ''),
			state = NULLIF($5, ''),
			country = COALESCE(NULLIF($6, ''), country),
			telephone = NULLIF($7, ''),
			email = NULLIF($8, ''),
			currency = COALESCE(NULLIF($9, ''), currency),
			timezone = COALESCE(NULLIF($10, ''), timezone),
			service_charge_rate = CASE WHEN $11 > 0 THEN $11 ELSE service_charge_rate END,
			vat_rate = CASE WHEN $12 > 0 THEN $12 ELSE vat_rate END,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $1 AND deleted_at IS NULL
	`, id, req.Name, req.Address, req.City, req.State, req.Country,
		req.Telephone, req.Email, req.Currency, req.Timezone,
		req.ServiceChargeRate, req.VatRate)

	if err != nil {
		response.RespondError(w, "Failed to update property", http.StatusInternalServerError)
		return
	}
	response.RespondSuccess(w, map[string]interface{}{"id": id}, "Property settings updated")
}

// ── Tax Rates ──────────────────────────────────────────────

func (h *Handler) ListTaxRates(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)

	rows, err := h.db.Query(r.Context(), `
		SELECT id, name, code, rate, type, applies_to, is_compound, is_active
		FROM tax_rates WHERE property_id = $1
		ORDER BY name
	`, propertyID)
	if err != nil {
		response.RespondError(w, "Failed to query tax rates", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var rates []map[string]interface{}
	for rows.Next() {
		var id, name, mtype, appliesTo string
		var code *string
		var rate float64
		var isCompound, isActive int
		rows.Scan(&id, &name, &code, &rate, &mtype, &appliesTo, &isCompound, &isActive)
		rates = append(rates, map[string]interface{}{
			"id": id, "name": name, "rate": rate, "type": mtype,
			"applies_to": appliesTo, "is_compound": isCompound == 1, "is_active": isActive == 1,
		})
	}
	if rates == nil {
		rates = []map[string]interface{}{}
	}
	response.RespondSuccess(w, rates, "Tax rates retrieved")
}

func (h *Handler) CreateTaxRate(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	var req struct {
		Name       string  `json:"name"`
		Code       string  `json:"code"`
		Rate       float64 `json:"rate"`
		Type       string  `json:"type"`
		AppliesTo  string  `json:"applies_to"`
		IsCompound bool    `json:"is_compound"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.RespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.Name == "" {
		response.RespondError(w, "Name is required", http.StatusBadRequest)
		return
	}
	if req.Type == "" {
		req.Type = "percentage"
	}
	if req.AppliesTo == "" {
		req.AppliesTo = "all"
	}

	id := uuid.New()
	_, err := h.db.Exec(r.Context(), `
		INSERT INTO tax_rates (id, property_id, name, code, rate, type, applies_to, is_compound)
		VALUES ($1, $2, $3, NULLIF($4,''), $5, $6, $7, $8)
	`, id, propertyID, req.Name, req.Code, req.Rate, req.Type, req.AppliesTo, req.IsCompound)
	if err != nil {
		response.RespondError(w, "Failed to create tax rate", http.StatusInternalServerError)
		return
	}
	response.RespondSuccess(w, map[string]interface{}{"id": id}, "Tax rate created", http.StatusCreated)
}

func (h *Handler) UpdateTaxRate(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req struct {
		Name       string  `json:"name"`
		Rate       float64 `json:"rate"`
		AppliesTo  string  `json:"applies_to"`
		IsCompound bool    `json:"is_compound"`
		IsActive   bool    `json:"is_active"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.RespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	_, err := h.db.Exec(r.Context(), `
		UPDATE tax_rates SET
			name = COALESCE(NULLIF($2,''), name),
			rate = CASE WHEN $3 >= 0 THEN $3 ELSE rate END,
			applies_to = COALESCE(NULLIF($4,''), applies_to),
			is_compound = $5, is_active = $6,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
	`, id, req.Name, req.Rate, req.AppliesTo, req.IsCompound, req.IsActive)
	if err != nil {
		response.RespondError(w, "Failed to update tax rate", http.StatusInternalServerError)
		return
	}
	response.RespondSuccess(w, map[string]interface{}{"id": id}, "Tax rate updated")
}

func (h *Handler) DeleteTaxRate(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	_, err := h.db.Exec(r.Context(), "DELETE FROM tax_rates WHERE id = $1", id)
	if err != nil {
		response.RespondError(w, "Failed to delete tax rate", http.StatusInternalServerError)
		return
	}
	response.RespondSuccess(w, nil, "Tax rate deleted")
}

// ── Payment Methods ────────────────────────────────────────

func (h *Handler) ListPaymentMethods(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)

	rows, err := h.db.Query(r.Context(), `
		SELECT id, name, code, type, is_active, sort_order, requires_reference
		FROM payment_methods WHERE property_id = $1
		ORDER BY sort_order
	`, propertyID)
	if err != nil {
		response.RespondError(w, "Failed to query payment methods", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var methods []map[string]interface{}
	for rows.Next() {
		var id, name, mtype string
		var code *string
		var isActive, sortOrder, requiresRef int
		rows.Scan(&id, &name, &code, &mtype, &isActive, &sortOrder, &requiresRef)
		methods = append(methods, map[string]interface{}{
			"id": id, "name": name, "code": code, "type": mtype,
			"is_active": isActive == 1, "sort_order": sortOrder, "requires_reference": requiresRef == 1,
		})
	}
	if methods == nil {
		methods = []map[string]interface{}{}
	}
	response.RespondSuccess(w, methods, "Payment methods retrieved")
}

func (h *Handler) CreatePaymentMethod(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	var req struct {
		Name            string `json:"name"`
		Code            string `json:"code"`
		Type            string `json:"type"`
		RequiresRef     bool   `json:"requires_reference"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.RespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.Name == "" {
		response.RespondError(w, "Name is required", http.StatusBadRequest)
		return
	}

	id := uuid.New()
	_, err := h.db.Exec(r.Context(), `
		INSERT INTO payment_methods (id, property_id, name, code, type, requires_reference, sort_order)
		VALUES ($1, $2, $3, NULLIF($4,''), $5, $6, 99)
	`, id, propertyID, req.Name, req.Code, req.Type, req.RequiresRef)
	if err != nil {
		response.RespondError(w, "Failed to create payment method", http.StatusInternalServerError)
		return
	}
	response.RespondSuccess(w, map[string]interface{}{"id": id}, "Payment method created", http.StatusCreated)
}

func (h *Handler) UpdatePaymentMethod(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req struct {
		Name        string `json:"name"`
		Type        string `json:"type"`
		IsActive    bool   `json:"is_active"`
		SortOrder   int    `json:"sort_order"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.RespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	_, err := h.db.Exec(r.Context(), `
		UPDATE payment_methods SET
			name = COALESCE(NULLIF($2,''), name),
			type = COALESCE(NULLIF($3,''), type),
			is_active = $4, sort_order = CASE WHEN $5 > 0 THEN $5 ELSE sort_order END,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
	`, id, req.Name, req.Type, req.IsActive, req.SortOrder)
	if err != nil {
		response.RespondError(w, "Failed to update payment method", http.StatusInternalServerError)
		return
	}
	response.RespondSuccess(w, map[string]interface{}{"id": id}, "Payment method updated")
}

func (h *Handler) DeletePaymentMethod(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	_, err := h.db.Exec(r.Context(), "DELETE FROM payment_methods WHERE id = $1", id)
	if err != nil {
		response.RespondError(w, "Failed to delete payment method", http.StatusInternalServerError)
		return
	}
	response.RespondSuccess(w, nil, "Payment method deleted")
}

// ── Departments ────────────────────────────────────────────

func (h *Handler) ListDepartments(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)

	rows, err := h.db.Query(r.Context(), `
		SELECT id, name, code, manager, email, phone, is_active, sort_order
		FROM departments WHERE property_id = $1
		ORDER BY sort_order
	`, propertyID)
	if err != nil {
		response.RespondError(w, "Failed to query departments", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var departments []map[string]interface{}
	for rows.Next() {
		var id, name string
		var code, manager, email, phone *string
		var isActive, sortOrder int
		rows.Scan(&id, &name, &code, &manager, &email, &phone, &isActive, &sortOrder)
		departments = append(departments, map[string]interface{}{
			"id": id, "name": name, "code": code, "manager": manager,
			"email": email, "phone": phone, "is_active": isActive == 1, "sort_order": sortOrder,
		})
	}
	if departments == nil {
		departments = []map[string]interface{}{}
	}
	response.RespondSuccess(w, departments, "Departments retrieved")
}

func (h *Handler) CreateDepartment(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	var req struct {
		Name    string `json:"name"`
		Code    string `json:"code"`
		Manager string `json:"manager"`
		Email   string `json:"email"`
		Phone   string `json:"phone"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.RespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if req.Name == "" {
		response.RespondError(w, "Name is required", http.StatusBadRequest)
		return
	}

	id := uuid.New()
	_, err := h.db.Exec(r.Context(), `
		INSERT INTO departments (id, property_id, name, code, manager, email, phone)
		VALUES ($1, $2, $3, NULLIF($4,''), NULLIF($5,''), NULLIF($6,''), NULLIF($7,''))
	`, id, propertyID, req.Name, req.Code, req.Manager, req.Email, req.Phone)
	if err != nil {
		response.RespondError(w, "Failed to create department", http.StatusInternalServerError)
		return
	}
	response.RespondSuccess(w, map[string]interface{}{"id": id}, "Department created", http.StatusCreated)
}

func (h *Handler) UpdateDepartment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req struct {
		Name     string `json:"name"`
		Manager  string `json:"manager"`
		Email    string `json:"email"`
		Phone    string `json:"phone"`
		IsActive bool   `json:"is_active"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.RespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	_, err := h.db.Exec(r.Context(), `
		UPDATE departments SET
			name = COALESCE(NULLIF($2,''), name),
			manager = NULLIF($3,''), email = NULLIF($4,''),
			phone = NULLIF($5,''), is_active = $6,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
	`, id, req.Name, req.Manager, req.Email, req.Phone, req.IsActive)
	if err != nil {
		response.RespondError(w, "Failed to update department", http.StatusInternalServerError)
		return
	}
	response.RespondSuccess(w, map[string]interface{}{"id": id}, "Department updated")
}

func (h *Handler) DeleteDepartment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	_, err := h.db.Exec(r.Context(), "DELETE FROM departments WHERE id = $1", id)
	if err != nil {
		response.RespondError(w, "Failed to delete department", http.StatusInternalServerError)
		return
	}
	response.RespondSuccess(w, nil, "Department deleted")
}

// ── Numbering Sequences ────────────────────────────────────

func (h *Handler) ListNumberingSequences(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)

	rows, err := h.db.Query(r.Context(), `
		SELECT id, name, prefix, suffix, next_number, padding, format
		FROM numbering_sequences WHERE property_id = $1
		ORDER BY name
	`, propertyID)
	if err != nil {
		response.RespondError(w, "Failed to query numbering sequences", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var seqs []map[string]interface{}
	for rows.Next() {
		var id, name, fmt string
		var prefix, suffix *string
		var nextNum, padding int
		rows.Scan(&id, &name, &prefix, &suffix, &nextNum, &padding, &fmt)
		seqs = append(seqs, map[string]interface{}{
			"id": id, "name": name, "prefix": prefix, "suffix": suffix,
			"next_number": nextNum, "padding": padding, "format": fmt,
		})
	}
	if seqs == nil {
		seqs = []map[string]interface{}{}
	}
	response.RespondSuccess(w, seqs, "Numbering sequences retrieved")
}

func (h *Handler) UpdateNumberingSequence(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req struct {
		Prefix    string `json:"prefix"`
		NextNum   int    `json:"next_number"`
		Padding   int    `json:"padding"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.RespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	_, err := h.db.Exec(r.Context(), `
		UPDATE numbering_sequences SET
			prefix = COALESCE(NULLIF($2,''), prefix),
			next_number = CASE WHEN $3 > 0 THEN $3 ELSE next_number END,
			padding = CASE WHEN $4 > 0 THEN $4 ELSE padding END,
			updated_at = CURRENT_TIMESTAMP
		WHERE id = $1
	`, id, req.Prefix, req.NextNum, req.Padding)
	if err != nil {
		response.RespondError(w, "Failed to update numbering sequence", http.StatusInternalServerError)
		return
	}
	response.RespondSuccess(w, map[string]interface{}{"id": id}, "Numbering sequence updated")
}

// ── System Settings ────────────────────────────────────────

func (h *Handler) ListSystemSettings(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	category := r.URL.Query().Get("category")

	query := `SELECT id, category, key, value, data_type, description
		FROM system_settings WHERE property_id = $1`
	args := []interface{}{propertyID}
	argIdx := 2

	if category != "" {
		query += ` AND category = $` + strconv.Itoa(argIdx)
		args = append(args, category)
		argIdx++
	}
	query += ` ORDER BY category, key`

	rows, err := h.db.Query(r.Context(), query, args...)
	if err != nil {
		response.RespondError(w, "Failed to query system settings", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var settings []map[string]interface{}
	for rows.Next() {
		var id, cat, key, dataType string
		var value, description *string
		rows.Scan(&id, &cat, &key, &value, &dataType, &description)
		settings = append(settings, map[string]interface{}{
			"id": id, "category": cat, "key": key, "value": value,
			"data_type": dataType, "description": description,
		})
	}
	if settings == nil {
		settings = []map[string]interface{}{}
	}
	response.RespondSuccess(w, settings, "System settings retrieved")
}

func (h *Handler) UpdateSystemSettings(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)

	var req struct {
		Settings []struct {
			Key   string `json:"key"`
			Value string `json:"value"`
		} `json:"settings"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.RespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	updated := 0
	for _, s := range req.Settings {
		if s.Key == "" {
			continue
		}
		_, err := h.db.Exec(r.Context(), `
			UPDATE system_settings SET value = $3, updated_at = CURRENT_TIMESTAMP
			WHERE property_id = $1 AND key = $2
		`, propertyID, s.Key, s.Value)
		if err == nil {
			updated++
		}
	}

	response.RespondSuccess(w, map[string]interface{}{"updated": updated}, "System settings updated")
}

// ── Users Management ──────────────────────────────────────

func (h *Handler) ListAllUsers(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(r.Context(), `
		SELECT id, name, email, status, last_login_at, created_at
		FROM users WHERE deleted_at IS NULL
		ORDER BY name
	`)
	if err != nil {
		response.RespondError(w, "Failed to query users", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var users []map[string]interface{}
	for rows.Next() {
		var id, name, email, status string
		var lastLogin, createdAt *time.Time
		rows.Scan(&id, &name, &email, &status, &lastLogin, &createdAt)
		u := map[string]interface{}{
			"id": id, "name": name, "email": email, "status": status,
		}
		if lastLogin != nil {
			u["last_login_at"] = lastLogin.Format(time.RFC3339)
		}
		if createdAt != nil {
			u["created_at"] = createdAt.Format(time.RFC3339)
		}
		users = append(users, u)
	}
	if users == nil {
		users = []map[string]interface{}{}
	}
	response.RespondSuccess(w, users, "Users retrieved")
}

// ── System Info ───────────────────────────────────────────

func (h *Handler) GetSystemInfo(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)

	var roomCount, guestCount, reservationCount, employeeCount int
	h.db.QueryRow(r.Context(), "SELECT COUNT(*) FROM rooms WHERE property_id = $1 AND deleted_at IS NULL", propertyID).Scan(&roomCount)
	h.db.QueryRow(r.Context(), "SELECT COUNT(*) FROM guests").Scan(&guestCount)
	h.db.QueryRow(r.Context(), "SELECT COUNT(*) FROM reservations WHERE property_id = $1 AND deleted_at IS NULL", propertyID).Scan(&reservationCount)
	h.db.QueryRow(r.Context(), "SELECT COUNT(*) FROM employees WHERE property_id = $1 AND deleted_at IS NULL", propertyID).Scan(&employeeCount)

	response.RespondSuccess(w, map[string]interface{}{
		"version":          "1.0.0",
		"edition":          "Enterprise",
		"mode":             "on-premise",
		"database":         "SQLite (Demo Mode)",
		"deployment":       "Single Binary + Embedded DB",
		"rooms":            roomCount,
		"guests":           guestCount,
		"reservations":     reservationCount,
		"employees":        employeeCount,
		"offline_support":  true,
		"multi_property":   false,
		"api_version":      "v1",
	}, "System info retrieved")
}

// ── Database Management ───────────────────────────────────

func (h *Handler) GetDatabaseStats(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)

	type tableInfo struct {
		Name  string `json:"name"`
		Count int    `json:"count"`
	}

	tables := []struct {
		name  string
		query string
	}{
		{"properties", "SELECT COUNT(*) FROM properties WHERE deleted_at IS NULL"},
		{"rooms", "SELECT COUNT(*) FROM rooms WHERE property_id = $1 AND deleted_at IS NULL"},
		{"guests", "SELECT COUNT(*) FROM guests"},
		{"reservations", "SELECT COUNT(*) FROM reservations WHERE property_id = $1 AND deleted_at IS NULL"},
		{"folios", "SELECT COUNT(*) FROM folios WHERE property_id = $1"},
		{"pos_orders", "SELECT COUNT(*) FROM pos_orders WHERE property_id = $1"},
		{"inventory_products", "SELECT COUNT(*) FROM inventory_products WHERE property_id = $1"},
		{"employees", "SELECT COUNT(*) FROM employees WHERE property_id = $1 AND deleted_at IS NULL"},
		{"suppliers", "SELECT COUNT(*) FROM suppliers WHERE property_id = $1"},
		{"audit_logs", "SELECT COUNT(*) FROM audit_logs WHERE property_id = $1"},
		{"tax_rates", "SELECT COUNT(*) FROM tax_rates WHERE property_id = $1"},
		{"payment_methods", "SELECT COUNT(*) FROM payment_methods WHERE property_id = $1"},
		{"departments", "SELECT COUNT(*) FROM departments WHERE property_id = $1"},
	}

	var result []tableInfo
	for _, t := range tables {
		var count int
		if t.name == "properties" || t.name == "guests" {
			h.db.QueryRow(r.Context(), t.query).Scan(&count)
		} else {
			h.db.QueryRow(r.Context(), t.query, propertyID).Scan(&count)
		}
		result = append(result, tableInfo{Name: t.name, Count: count})
	}
	response.RespondSuccess(w, result, "Database stats retrieved")
}
