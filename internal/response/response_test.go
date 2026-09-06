package response

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRespondSuccess(t *testing.T) {
	w := httptest.NewRecorder()

	RespondSuccess(w, map[string]string{"id": "123"}, "Created", http.StatusCreated)

	if w.Code != http.StatusCreated {
		t.Errorf("expected status 201, got %d", w.Code)
	}

	var resp APIResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if !resp.Success {
		t.Error("expected success=true")
	}
	if resp.Message != "Created" {
		t.Errorf("expected message 'Created', got %q", resp.Message)
	}
	if resp.Timestamp == "" {
		t.Error("expected non-empty timestamp")
	}
	if resp.Meta.RequestID == "" {
		t.Error("expected non-empty request ID")
	}
}

func TestRespondError(t *testing.T) {
	w := httptest.NewRecorder()

	RespondError(w, "Not found", http.StatusNotFound)

	if w.Code != http.StatusNotFound {
		t.Errorf("expected status 404, got %d", w.Code)
	}

	var resp APIResponse
	json.NewDecoder(w.Body).Decode(&resp)

	if resp.Success {
		t.Error("expected success=false")
	}
	if len(resp.Errors) != 1 || resp.Errors[0] != "Not found" {
		t.Errorf("expected errors ['Not found'], got %v", resp.Errors)
	}
}

func TestRespondPaginated(t *testing.T) {
	w := httptest.NewRecorder()

	data := []map[string]string{{"name": "test"}}
	RespondPaginated(w, data, 25, 2, 10)

	var resp APIResponse
	json.NewDecoder(w.Body).Decode(&resp)

	if !resp.Success {
		t.Error("expected success=true")
	}
	if resp.Meta.Pagination == nil {
		t.Fatal("expected pagination metadata")
	}
	if resp.Meta.Pagination.CurrentPage != 2 {
		t.Errorf("expected page 2, got %d", resp.Meta.Pagination.CurrentPage)
	}
	if resp.Meta.Pagination.Total != 25 {
		t.Errorf("expected total 25, got %d", resp.Meta.Pagination.Total)
	}
	if resp.Meta.Pagination.LastPage != 3 {
		t.Errorf("expected last page 3, got %d", resp.Meta.Pagination.LastPage)
	}
}

func TestRespondPaginatedExact(t *testing.T) {
	w := httptest.NewRecorder()

	RespondPaginated(w, []int{}, 20, 1, 10)

	var resp APIResponse
	json.NewDecoder(w.Body).Decode(&resp)

	if resp.Meta.Pagination.LastPage != 2 {
		t.Errorf("expected last page 2 for 20 items at 10/page, got %d", resp.Meta.Pagination.LastPage)
	}
}

func TestJSONContentType(t *testing.T) {
	w := httptest.NewRecorder()
	RespondSuccess(w, nil, "ok")

	if ct := w.Header().Get("Content-Type"); ct != "application/json; charset=utf-8" {
		t.Errorf("expected JSON content type, got %q", ct)
	}
}

func TestRequestID(t *testing.T) {
	w := httptest.NewRecorder()
	RespondSuccess(w, nil, "ok")

	requestID := w.Header().Get("X-Request-ID")
	if requestID == "" {
		t.Error("expected X-Request-ID header")
	}
}
