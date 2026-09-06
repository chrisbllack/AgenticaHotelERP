package handler

import (
	"encoding/json"
	"net/http"
	"os"
	"os/exec"
	"time"
)

// ── Backup & Restore ──

type BackupInfo struct {
	ID        int    `json:"id"`
	Filename  string `json:"filename"`
	Size      int64  `json:"size_bytes"`
	Status    string `json:"status"`
	CreatedAt string `json:"created_at"`
	CreatedBy string `json:"created_by"`
}

// CreateBackup runs pg_dump and stores the backup locally
func (h *Handler) CreateBackup(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Generate filename
	timestamp := time.Now().Format("20060102_150405")
	filename := "infineon_backup_" + timestamp + ".sql"
	backupDir := "/var/lib/infineon/backups"

	// Ensure backup directory exists
	os.MkdirAll(backupDir, 0755)

	backupPath := backupDir + "/" + filename

	// Run pg_dump
	cmd := exec.Command("pg_dump", "-Fc", "-f", backupPath, "infineon")
	output, err := cmd.CombinedOutput()
	if err != nil {
		// Fallback: try with connection string
		cmd = exec.Command("pg_dump", "-Fc", "-f", backupPath)
		cmd.Env = append(os.Environ(), "PGHOST=localhost", "PGDATABASE=infineon", "PGUSER=infineon")
		output, err = cmd.CombinedOutput()
		if err != nil {
			jsonError(w, "Backup failed: "+string(output), http.StatusInternalServerError)
			return
		}
	}

	// Get file size
	stat, _ := os.Stat(backupPath)
	size := int64(0)
	if stat != nil {
		size = stat.Size()
	}

	// Record backup
	var backupID int
	_ = h.db.QueryRow(ctx, `
		INSERT INTO backups (filename, file_path, size_bytes, status, created_by, property_id, created_at)
		VALUES ($1, $2, $3, 'completed', $4, $5, NOW())
		RETURNING id
	`, filename, backupPath, size, ctx.Value("user_id"), ctx.Value("property_id")).Scan(&backupID)

	jsonSuccess(w, map[string]interface{}{
		"message":  "Backup created successfully",
		"filename": filename,
		"size":     size,
		"path":     backupPath,
	})
}

// ListBackups returns all backup records
func (h *Handler) ListBackups(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	rows, err := h.db.Query(ctx, `
		SELECT id, filename, COALESCE(size_bytes, 0), status, created_at::text
		FROM backups
		WHERE property_id = $1
		ORDER BY created_at DESC LIMIT 20
	`, ctx.Value("property_id"))
	if err != nil {
		jsonError(w, "Failed to list backups", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var backups []BackupInfo
	for rows.Next() {
		var b BackupInfo
		rows.Scan(&b.ID, &b.Filename, &b.Size, &b.Status, &b.CreatedAt)
		backups = append(backups, b)
	}
	jsonSuccess(w, backups)
}

// ExportData exports all data as JSON for migration/transfer
func (h *Handler) ExportData(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	// Export key tables
	export := map[string]interface{}{}

	// Rooms
	roomRows, _ := h.db.Query(ctx, `SELECT id, number, status FROM rooms WHERE property_id = $1`, ctx.Value("property_id"))
	if roomRows != nil {
		var rooms []map[string]interface{}
		for roomRows.Next() {
			var id int
			var number, status string
			roomRows.Scan(&id, &number, &status)
			rooms = append(rooms, map[string]interface{}{"id": id, "number": number, "status": status})
		}
		roomRows.Close()
		export["rooms"] = rooms
	}

	// Guests
	guestRows, _ := h.db.Query(ctx, `SELECT id, first_name, last_name, email, phone FROM guests WHERE property_id = $1 LIMIT 1000`, ctx.Value("property_id"))
	if guestRows != nil {
		var guests []map[string]interface{}
		for guestRows.Next() {
			var id int
			var first, last, email, phone string
			guestRows.Scan(&id, &first, &last, &email, &phone)
			guests = append(guests, map[string]interface{}{"id": id, "first_name": first, "last_name": last, "email": email, "phone": phone})
		}
		guestRows.Close()
		export["guests"] = guests
	}

	// Set response headers for download
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Content-Disposition", "attachment; filename=infineon_export_"+time.Now().Format("20060102")+".json")
	json.NewEncoder(w).Encode(export)
}

// RestoreBackup restores from a pg_restore file
func (h *Handler) RestoreBackup(w http.ResponseWriter, r *http.Request) {
	var req struct {
		BackupID int `json:"backup_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	var filePath string
	err := h.db.QueryRow(ctx, `
		SELECT file_path FROM backups WHERE id = $1 AND property_id = $2
	`, req.BackupID, ctx.Value("property_id")).Scan(&filePath)
	if err != nil {
		jsonError(w, "Backup not found", http.StatusNotFound)
		return
	}

	// Run pg_restore
	cmd := exec.Command("pg_restore", "-d", "infineon", "--clean", "--if-exists", filePath)
	output, err := cmd.CombinedOutput()
	if err != nil {
		jsonError(w, "Restore failed: "+string(output), http.StatusInternalServerError)
		return
	}

	jsonSuccess(w, map[string]interface{}{
		"message": "Backup restored successfully",
		"backup_id": req.BackupID,
	})
}
