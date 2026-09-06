package handler

import (
	"fmt"
	"math/rand"
	"net/http"

	"infineon/internal/response"
)

// jsonSuccess writes a success response.
func jsonSuccess(w http.ResponseWriter, data interface{}) {
	response.RespondSuccess(w, data, "Operation completed successfully")
}

// jsonError writes an error response.
func jsonError(w http.ResponseWriter, message string, code int) {
	response.RespondError(w, message, code)
}

// jsonPaginated writes a paginated response.
func jsonPaginated(w http.ResponseWriter, data interface{}, page, perPage, total int) {
	response.RespondPaginated(w, data, int64(total), page, perPage)
}

// SendError writes an error response (note: code comes before message in this variant).
func SendError(w http.ResponseWriter, code int, message string) {
	response.RespondError(w, message, code)
}

// SendSuccess writes a success response.
func SendSuccess(w http.ResponseWriter, data interface{}) {
	response.RespondSuccess(w, data, "Operation completed successfully")
}

// SendCreated writes a 201 Created success response.
func SendCreated(w http.ResponseWriter, data interface{}) {
	response.RespondSuccess(w, data, "Created successfully", http.StatusCreated)
}

// generateID creates a simple unique ID.
func generateID() string {
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x",
		rand.Int31(), rand.Int31n(0xffff), rand.Int31n(0xffff),
		rand.Int31n(0xffff), rand.Int63n(0xffffffffffff))
}

// auditLog records an audit trail entry.
// auditLog records an audit trail entry.
func auditLog(h *Handler, r *http.Request, module, action, ref, detail string) {
	if h.audit != nil {
		h.audit.Log(r.Context(), nil, module, action, ref, nil, detail, r)
	}
}
