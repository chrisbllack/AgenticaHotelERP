package biometric

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"
)

// SyncPipeline orchestrates pulling events from biometric devices
// and processing them into attendance records
type SyncPipeline struct {
	db *sql.DB
}

// NewSyncPipeline creates a new pipeline with a database connection
func NewSyncPipeline(db *sql.DB) *SyncPipeline {
	return &SyncPipeline{db: db}
}

// SyncDevice pulls events from a device and processes them
func (s *SyncPipeline) SyncDevice(ctx context.Context, deviceID string, provider Provider) (*SyncResult, error) {
	result := &SyncResult{}

	// 1. Get last successful sync timestamp
	var lastSync *time.Time
	err := s.db.QueryRowContext(ctx,
		`SELECT last_event_timestamp FROM attendance_sync_jobs
		WHERE device_id = $1 AND status = 'completed'
		ORDER BY completed_at DESC LIMIT 1`, deviceID).Scan(&lastSync)
	if err == sql.ErrNoRows {
		lastSync = nil // First sync — get all events
	} else if err != nil {
		lastSync = nil // Error reading — get all events
	}

	// 2. Create sync job record
	syncID := fmt.Sprintf("sync-%d", time.Now().UnixNano())
	_, err = s.db.ExecContext(ctx,
		`INSERT INTO attendance_sync_jobs (id, device_id, status) VALUES ($1, $2, 'running')`,
		syncID, deviceID)
	if err != nil {
		return nil, fmt.Errorf("failed to create sync job: %w", err)
	}

	// 3. Pull events from device
	events, err := provider.PullAttendance(ctx, lastSync)
	if err != nil {
		s.db.ExecContext(ctx,
			`UPDATE attendance_sync_jobs SET status = 'failed', error_message = $2,
			completed_at = CURRENT_TIMESTAMP WHERE id = $1`,
			syncID, err.Error())
		return nil, fmt.Errorf("failed to pull attendance: %w", err)
	}

	result.EventsFetched = len(events)

	// 4. Process each event
	for _, event := range events {
		eventHash := MakeEventHash(deviceID, event.DeviceUserID, event.EventTimestamp)

		// Check for duplicate
		var exists int
		s.db.QueryRowContext(ctx,
			`SELECT COUNT(*) FROM attendance_raw_events WHERE event_hash = $1`,
			eventHash).Scan(&exists)
		if exists > 0 {
			result.DuplicatesSkipped++
			continue
		}

		// Look up employee by device_user_id mapping
		var employeeID string
		s.db.QueryRowContext(ctx,
			`SELECT employee_id FROM attendance_device_users
			WHERE device_id = $1 AND device_user_id = $2`,
			deviceID, event.DeviceUserID).Scan(&employeeID)

		// Get property_id from device
		var propertyID string
		s.db.QueryRowContext(ctx,
			`SELECT property_id FROM attendance_devices WHERE id = $1`,
			deviceID).Scan(&propertyID)

		// Insert raw event
		_, err := s.db.ExecContext(ctx, `
			INSERT OR IGNORE INTO attendance_raw_events
			(id, provider, device_id, device_user_id, employee_id,
			 event_timestamp, event_type, verification_type, source_payload,
			 event_hash, processed, processing_status)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'pending')
		`,
			fmt.Sprintf("raw-%d", time.Now().UnixNano()),
			provider.Name(), deviceID, event.DeviceUserID,
			sql.NullString{String: employeeID, Valid: employeeID != ""},
			event.EventTimestamp.Format(time.RFC3339),
			event.EventType, event.Verification, event.RawPayload, eventHash)

		if err != nil {
			result.Errors++
			log.Printf("[biometric] Failed to insert raw event: %v", err)
			continue
		}

		result.EventsCreated++

		// 5. If employee is mapped, create/update attendance record
		if employeeID != "" {
			s.processEvent(ctx, employeeID, propertyID, event)
		}
	}

	// 6. Update sync job
	s.db.ExecContext(ctx, `
		UPDATE attendance_sync_jobs SET
			status = 'completed',
			completed_at = CURRENT_TIMESTAMP,
			records_fetched = $2,
			records_created = $3,
			duplicates_skipped = $4,
			errors = $5,
			last_event_timestamp = $6
		WHERE id = $1
	`, syncID, result.EventsFetched, result.EventsCreated,
		result.DuplicatesSkipped, result.Errors,
		time.Now().Format(time.RFC3339))

	// Mark raw events as processed
	s.db.ExecContext(ctx, `
		UPDATE attendance_raw_events SET processed = 1, processing_status = 'completed'
		WHERE device_id = $1 AND processed = 0
	`, deviceID)

	// Update device last sync
	s.db.ExecContext(ctx, `
		UPDATE attendance_devices SET last_sync_at = CURRENT_TIMESTAMP, last_sync_error = NULL
		WHERE id = $1
	`, deviceID)

	log.Printf("[biometric] Sync complete for %s: %d fetched, %d created, %d dupes, %d errors",
		deviceID, result.EventsFetched, result.EventsCreated, result.DuplicatesSkipped, result.Errors)

	return result, nil
}

// processEvent transforms a single raw event into an attendance record
func (s *SyncPipeline) processEvent(ctx context.Context, employeeID, propertyID string, event AttendanceEvent) {
	date := event.EventTimestamp.Format("2006-01-02")
	timeStr := event.EventTimestamp.Format("15:04:05")

	// Find or create attendance record for this employee+date
	var attID string
	err := s.db.QueryRowContext(ctx,
		`SELECT id FROM attendance_records
		WHERE employee_id = $1 AND record_date = $2 AND property_id = $3`,
		employeeID, date, propertyID).Scan(&attID)

	if err == sql.ErrNoRows {
		// Create new record
		attID = fmt.Sprintf("att-%s-%s", employeeID, date)
		s.db.ExecContext(ctx, `
			INSERT INTO attendance_records
			(id, employee_id, property_id, record_date, clock_in, status, source)
			VALUES (?, ?, ?, ?, ?, 'present', 'biometric')
		`, attID, employeeID, propertyID, date, timeStr)
		return
	}

	// Update existing record based on event type
	switch event.EventType {
	case "check_in":
		s.db.ExecContext(ctx, `
			UPDATE attendance_records SET clock_in = ?, status = 'present', source = 'biometric'
			WHERE id = ? AND (clock_in IS NULL OR ? < clock_in)
		`, timeStr, attID, timeStr)

	case "check_out":
		s.db.ExecContext(ctx, `
			UPDATE attendance_records SET clock_out = ?, source = 'biometric'
			WHERE id = ?
		`, timeStr, attID)

	case "break_in", "break_out":
		// Update break times if the schema supports them
		s.db.ExecContext(ctx, `
			UPDATE attendance_records SET source = 'biometric' WHERE id = ?
		`, attID)
	}
}
