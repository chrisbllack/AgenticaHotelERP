package server

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/google/uuid"
)

type APIResponse struct {
	Success   bool        `json:"success"`
	Message   string      `json:"message"`
	Data      interface{} `json:"data"`
	Meta      Meta        `json:"meta"`
	Errors    []string    `json:"errors"`
	Timestamp string      `json:"timestamp"`
}

type Meta struct {
	RequestID   string      `json:"request_id"`
	ExecutionMs int64       `json:"execution_time_ms"`
	Pagination  *Pagination `json:"pagination,omitempty"`
}

type Pagination struct {
	CurrentPage int   `json:"current_page"`
	PerPage     int   `json:"per_page"`
	Total       int64 `json:"total"`
	LastPage    int   `json:"last_page"`
}

func RespondJSON(w http.ResponseWriter, code int, resp APIResponse) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(resp)
}

func RespondSuccess(w http.ResponseWriter, data interface{}, message string, code ...int) {
	status := http.StatusOK
	if len(code) > 0 {
		status = code[0]
	}
	RespondJSON(w, status, APIResponse{
		Success:   true,
		Message:   message,
		Data:      data,
		Meta:      Meta{RequestID: uuid.New().String()},
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

func RespondError(w http.ResponseWriter, message string, code int) {
	RespondJSON(w, code, APIResponse{
		Success:   false,
		Message:   message,
		Errors:    []string{message},
		Meta:      Meta{RequestID: uuid.New().String()},
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

func RespondPaginated(w http.ResponseWriter, data interface{}, total int64, page, perPage int) {
	lastPage := int(total) / perPage
	if int(total)%perPage > 0 {
		lastPage++
	}
	RespondJSON(w, http.StatusOK, APIResponse{
		Success: true,
		Message: "Operation completed successfully",
		Data:    data,
		Meta: Meta{
			RequestID: uuid.New().String(),
			Pagination: &Pagination{
				CurrentPage: page,
				PerPage:     perPage,
				Total:       total,
				LastPage:    lastPage,
			},
		},
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}
