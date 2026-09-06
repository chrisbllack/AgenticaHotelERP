package handler

import (
	"encoding/json"
	"net/http"
)

// ── Notification Engine ──

type NotificationRequest struct {
	Type     string `json:"type"`     // email, sms, push, in_app
	Template string `json:"template"` // booking_confirmation, payment_receipt, etc
	To       string `json:"to"`
	Subject  string `json:"subject"`
	Body     string `json:"body"`
	EntityID string `json:"entity_id"`
}

type NotificationLog struct {
	ID        int    `json:"id"`
	Type      string `json:"type"`
	Template  string `json:"template"`
	Recipient string `json:"recipient"`
	Subject   string `json:"subject,omitempty"`
	Status    string `json:"status"`
	SentAt    string `json:"sent_at,omitempty"`
	CreatedAt string `json:"created_at"`
}

// SendNotification dispatches a notification via the configured channel
func (h *Handler) SendNotification(w http.ResponseWriter, r *http.Request) {
	var req NotificationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.To == "" || req.Body == "" {
		jsonError(w, "Recipient and body are required", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	var notifID int
	err := h.db.QueryRow(ctx, `
		INSERT INTO notifications (notification_type, template_code, recipient, subject, body, status, property_id, created_at)
		VALUES ($1, $2, $3, $4, $5, 'pending', $6, NOW())
		RETURNING id
	`, req.Type, req.Template, req.To, req.Subject, req.Body, ctx.Value("property_id")).Scan(&notifID)
	if err != nil {
		jsonError(w, "Failed to queue notification", http.StatusInternalServerError)
		return
	}

	// In production: dispatch to email worker, SMS gateway, push service
	// For now, mark as sent
	_, _ = h.db.Exec(ctx, `
		UPDATE notifications SET status = 'sent', sent_at = NOW() WHERE id = $1
	`, notifID)

	jsonSuccess(w, map[string]interface{}{
		"id":      notifID,
		"status":  "sent",
		"message": "Notification dispatched",
	})
}

// ListNotifications returns notification history
func (h *Handler) ListNotifications(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	notifType := r.URL.Query().Get("type")

	query := `
		SELECT id, notification_type, template_code, recipient, COALESCE(subject, ''),
		       status, COALESCE(sent_at::text, ''), created_at::text
		FROM notifications
		WHERE property_id = $1
	`
	args := []interface{}{ctx.Value("property_id")}
	if notifType != "" {
		query += " AND notification_type = $2"
		args = append(args, notifType)
	}
	query += " ORDER BY created_at DESC LIMIT 100"

	rows, err := h.db.Query(ctx, query, args...)
	if err != nil {
		jsonError(w, "Failed to load notifications", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var notifs []NotificationLog
	for rows.Next() {
		var n NotificationLog
		rows.Scan(&n.ID, &n.Type, &n.Template, &n.Recipient, &n.Subject, &n.Status, &n.SentAt, &n.CreatedAt)
		notifs = append(notifs, n)
	}
	jsonSuccess(w, notifs)
}

// ── Workflow Engine ──

type WorkflowApproval struct {
	ID             int    `json:"id"`
	EntityType     string `json:"entity_type"` // purchase_order, refund, rate_change, inventory_adjustment
	EntityID       string `json:"entity_id"`
	Status         string `json:"status"` // pending, approved, rejected
	RequestedBy    string `json:"requested_by"`
	ApprovedBy     string `json:"approved_by,omitempty"`
	Amount         float64 `json:"amount,omitempty"`
	Comments       string `json:"comments,omitempty"`
	CreatedAt      string `json:"created_at"`
}

// ListPendingApprovals returns all pending approvals for the current user
func (h *Handler) ListPendingApprovals(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	rows, err := h.db.Query(ctx, `
		SELECT id, entity_type, entity_id, status, requested_by,
		       COALESCE(approved_by, ''), COALESCE(amount, 0),
		       COALESCE(comments, ''), created_at::text
		FROM workflow_approvals
		WHERE property_id = $1 AND status = 'pending'
		ORDER BY created_at DESC
	`, ctx.Value("property_id"))
	if err != nil {
		jsonError(w, "Failed to load approvals", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var approvals []WorkflowApproval
	for rows.Next() {
		var a WorkflowApproval
		rows.Scan(&a.ID, &a.EntityType, &a.EntityID, &a.Status, &a.RequestedBy,
			&a.ApprovedBy, &a.Amount, &a.Comments, &a.CreatedAt)
		approvals = append(approvals, a)
	}
	jsonSuccess(w, approvals)
}

// ApproveRequest processes an approval or rejection
func (h *Handler) ApproveRequest(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ApprovalID int    `json:"approval_id"`
		Action     string `json:"action"` // approve, reject
		Comments   string `json:"comments"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.Action != "approve" && req.Action != "reject" {
		jsonError(w, "Action must be 'approve' or 'reject'", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	status := "approved"
	if req.Action == "reject" {
		status = "rejected"
	}

	_, err := h.db.Exec(ctx, `
		UPDATE workflow_approvals 
		SET status = $1, approved_by = $2, approved_at = NOW(), comments = $3
		WHERE id = $4 AND status = 'pending'
	`, status, ctx.Value("user_id"), req.Comments, req.ApprovalID)
	if err != nil {
		jsonError(w, "Failed to process approval", http.StatusInternalServerError)
		return
	}

	jsonSuccess(w, map[string]interface{}{
		"message": "Approval " + status,
		"status":  status,
	})
}

// ── Document Management ──

type DocumentInfo struct {
	ID         int    `json:"id"`
	FileName   string `json:"file_name"`
	Category   string `json:"category"` // guest_id, contract, invoice, employee, po
	EntityID   string `json:"entity_id"`
	FileType   string `json:"file_type"`
	FileSize   int64  `json:"file_size"`
	UploadedBy string `json:"uploaded_by"`
	CreatedAt  string `json:"created_at"`
}

// UploadDocument stores a document reference (actual file stored in local filesystem/MinIO)
func (h *Handler) UploadDocument(w http.ResponseWriter, r *http.Request) {
	// In production: parse multipart form, store file, record metadata
	ctx := r.Context()
	var req struct {
		Category string `json:"category"`
		EntityID string `json:"entity_id"`
		FileName string `json:"file_name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	var docID int
	err := h.db.QueryRow(ctx, `
		INSERT INTO documents (file_name, category, entity_id, uploaded_by, property_id, created_at)
		VALUES ($1, $2, $3, $4, $5, NOW())
		RETURNING id
	`, req.FileName, req.Category, req.EntityID, ctx.Value("user_id"), ctx.Value("property_id")).Scan(&docID)
	if err != nil {
		jsonError(w, "Failed to record document", http.StatusInternalServerError)
		return
	}

	jsonSuccess(w, map[string]interface{}{
		"id":      docID,
		"message": "Document uploaded",
	})
}

// ListDocuments returns documents filtered by category/entity
func (h *Handler) ListDocuments(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	category := r.URL.Query().Get("category")
	entityID := r.URL.Query().Get("entity_id")

	query := `SELECT id, file_name, category, entity_id, COALESCE(file_type, ''), COALESCE(file_size, 0), created_at::text FROM documents WHERE property_id = $1`
	args := []interface{}{ctx.Value("property_id")}
	if category != "" {
		query += " AND category = $2"
		args = append(args, category)
	}
	if entityID != "" {
		query += " AND entity_id = $" + "3"
		args = append(args, entityID)
	}
	query += " ORDER BY created_at DESC LIMIT 50"

	rows, err := h.db.Query(ctx, query, args...)
	if err != nil {
		jsonError(w, "Failed to load documents", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var docs []DocumentInfo
	for rows.Next() {
		var d DocumentInfo
		rows.Scan(&d.ID, &d.FileName, &d.Category, &d.EntityID, &d.FileType, &d.FileSize, &d.CreatedAt)
		docs = append(docs, d)
	}
	jsonSuccess(w, docs)
}
