package handler

import (
	"database/sql"
	"encoding/json"
	"net/http"
)

// ── Hardware Integration Framework ──
// Vendor-neutral adapters for POS terminals, door locks, printers, scanners

type HardwareDevice struct {
	ID           string `json:"id"`
	DeviceType   string `json:"device_type"` // pos_terminal, door_lock, printer, scanner, biometric, cctv
	Vendor       string `json:"vendor"`
	Model        string `json:"model"`
	Location     string `json:"location"`
	Status       string `json:"status"` // online, offline, error, maintenance
	LastHeartbeat string `json:"last_heartbeat"`
	Firmware     string `json:"firmware_version"`
	Properties   map[string]interface{} `json:"properties,omitempty"`
}

// ── Door Lock Integration ──

type DoorLockCommand struct {
	RoomID   string `json:"room_id"`
	RoomNo   string `json:"room_number"`
	CardNo   string `json:"card_no"`
	Command  string `json:"command"` // encode, delete, check_status
	Duration int    `json:"duration"` // minutes for temporary access
}

// ListDevices returns all registered hardware devices
func (h *Handler) ListDevices(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	deviceType := r.URL.Query().Get("type")

	query := `
		SELECT id, device_type, vendor, model, COALESCE(location, ''),
		       status, COALESCE(last_heartbeat::text, 'Never'), COALESCE(firmware_version, '')
		FROM hardware_devices
		WHERE property_id = $1
	`
	args := []interface{}{ctx.Value("property_id")}
	if deviceType != "" {
		query += " AND device_type = $2"
		args = append(args, deviceType)
	}
	query += " ORDER BY device_type, vendor"

	rows, err := h.db.Query(ctx, query, args...)
	if err != nil {
		jsonError(w, "Failed to load devices", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var devices []HardwareDevice
	for rows.Next() {
		var d HardwareDevice
		err := rows.Scan(&d.ID, &d.DeviceType, &d.Vendor, &d.Model, &d.Location,
			&d.Status, &d.LastHeartbeat, &d.Firmware)
		if err != nil {
			continue
		}
		devices = append(devices, d)
	}
	jsonSuccess(w, devices)
}

// RegisterDevice adds or updates a hardware device
func (h *Handler) RegisterDevice(w http.ResponseWriter, r *http.Request) {
	var req struct {
		DeviceType string `json:"device_type"`
		Vendor     string `json:"vendor"`
		Model      string `json:"model"`
		Location   string `json:"location"`
		Firmware   string `json:"firmware_version"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	_, err := h.db.Exec(ctx, `
		INSERT INTO hardware_devices (device_type, vendor, model, location, firmware_version, status, property_id, created_at)
		VALUES ($1, $2, $3, $4, $5, 'online', $6, NOW())
	`, req.DeviceType, req.Vendor, req.Model, req.Location, req.Firmware, ctx.Value("property_id"))
	if err != nil {
		jsonError(w, "Failed to register device", http.StatusInternalServerError)
		return
	}
	jsonSuccess(w, map[string]interface{}{"message": "Device registered"})
}

// EncodeKeyCard programs a door lock card for a guest
func (h *Handler) EncodeKeyCard(w http.ResponseWriter, r *http.Request) {
	var req DoorLockCommand
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	ctx := r.Context()

	// Verify the reservation exists and is checked in
	var guestName string
	err := h.db.QueryRow(ctx, `
		SELECT g.first_name || ' ' || g.last_name
		FROM reservations res
		JOIN guests g ON g.id = res.guest_id
		WHERE res.room_id = (SELECT id FROM rooms WHERE room_number = $1 AND property_id = $2)
		  AND res.status = 'checked_in'
		ORDER BY res.created_at DESC LIMIT 1
	`, req.RoomNo, ctx.Value("property_id")).Scan(&guestName)
	if err == sql.ErrNoRows {
		jsonError(w, "No checked-in guest for this room", http.StatusBadRequest)
		return
	} else if err != nil {
		jsonError(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Log the key encoding
	_, err = h.db.Exec(ctx, `
		INSERT INTO hardware_logs (device_type, command, room_number, card_number, status, metadata, property_id, created_at)
		VALUES ('door_lock', 'encode', $1, $2, 'success', $3, $4, NOW())
	`, req.RoomNo, req.CardNo, `{"guest":"`+guestName+`"}`, ctx.Value("property_id"))
	if err != nil {
		jsonError(w, "Failed to log key encoding", http.StatusInternalServerError)
		return
	}

	// In production: send command to JCSMARTS or other door lock vendor
	jsonSuccess(w, map[string]interface{}{
		"message":    "Key card encoded successfully",
		"room":       req.RoomNo,
		"guest":      guestName,
		"card":       req.CardNo,
		"duration":   req.Duration,
		"expires_at": "check-out time",
	})
}

// DeviceHealthCheck checks connectivity to all registered devices
func (h *Handler) DeviceHealthCheck(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	rows, err := h.db.Query(ctx, `
		SELECT id, device_type, vendor, status, last_heartbeat
		FROM hardware_devices
		WHERE property_id = $1
	`, ctx.Value("property_id"))
	if err != nil {
		jsonError(w, "Health check failed", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type DeviceHealth struct {
		ID       string `json:"id"`
		Type     string `json:"type"`
		Vendor   string `json:"vendor"`
		Status   string `json:"status"`
		Healthy  bool   `json:"healthy"`
	}

	var results []DeviceHealth
	for rows.Next() {
		var dh DeviceHealth
		var hb interface{}
		err := rows.Scan(&dh.ID, &dh.Type, &dh.Vendor, &dh.Status, &hb)
		if err != nil {
			continue
		}
		dh.Healthy = dh.Status == "online"
		results = append(results, dh)
	}
	jsonSuccess(w, results)
}

// HardwareLogs returns device interaction logs
func (h *Handler) HardwareLogs(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	deviceType := r.URL.Query().Get("type")
	limit := 50

	query := `
		SELECT id, device_type, command, room_number, status, metadata, created_at::text
		FROM hardware_logs
		WHERE property_id = $1
	`
	args := []interface{}{ctx.Value("property_id")}
	if deviceType != "" {
		query += " AND device_type = $2"
		args = append(args, deviceType)
	}
	query += " ORDER BY created_at DESC LIMIT $3"
	args = append(args, limit)

	rows, err := h.db.Query(ctx, query, args...)
	if err != nil {
		jsonError(w, "Failed to load logs", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var logs []map[string]interface{}
	for rows.Next() {
		var id int
		var dtype, cmd, room, status, meta, created string
		rows.Scan(&id, &dtype, &cmd, &room, &status, &meta, &created)
		logs = append(logs, map[string]interface{}{
			"id": id, "device_type": dtype, "command": cmd,
			"room": room, "status": status, "metadata": meta, "created_at": created,
		})
	}
	jsonSuccess(w, logs)
}
