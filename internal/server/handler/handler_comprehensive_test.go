package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"infineon/internal/auth"
)

func setupTestHandler(t *testing.T) *Handler {
	t.Helper()
	jwt := auth.NewJWTService([]byte("test-secret-key-1234"))
	return New(nil, jwt) // nil DB for unit tests that don't query
}

func makeRequest(method, path string, body interface{}) (*httptest.ResponseRecorder, *http.Request) {
	var buf bytes.Buffer
	if body != nil {
		json.NewEncoder(&buf).Encode(body)
	}
	req := httptest.NewRequest(method, path, &buf)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Property-ID", "00000000-0000-0000-0000-000000000001")
	return httptest.NewRecorder(), req
}

func parseBody(t *testing.T, w *httptest.ResponseRecorder) map[string]interface{} {
	t.Helper()
	var result map[string]interface{}
	if err := json.NewDecoder(w.Body).Decode(&result); err != nil {
		t.Fatalf("failed to parse response body: %v\nBody: %s", err, w.Body.String())
	}
	return result
}

// ── Auth Handler Tests ───────────────────────────────────

func TestLogin_MissingFields(t *testing.T) {
	h := setupTestHandler(t)

	w, r := makeRequest("POST", "/api/v1/auth/login", map[string]string{})
	h.Login(w, r)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
	resp := parseBody(t, w)
	if resp["success"] != false {
		t.Error("expected success=false")
	}
}

func TestRegister_MissingFields(t *testing.T) {
	h := setupTestHandler(t)

	w, r := makeRequest("POST", "/api/v1/auth/register", map[string]string{
		"name": "Test User",
	})
	h.Register(w, r)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestLogin_InvalidJSON(t *testing.T) {
	h := setupTestHandler(t)

	req := httptest.NewRequest("POST", "/api/v1/auth/login", bytes.NewBufferString("not json"))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	h.Login(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestRegister_InvalidJSON(t *testing.T) {
	h := setupTestHandler(t)

	req := httptest.NewRequest("POST", "/api/v1/auth/register", bytes.NewBufferString("{invalid"))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	h.Register(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

// ── Health Handler Tests ─────────────────────────────────

func TestHealth_NilDB(t *testing.T) {
	h := setupTestHandler(t)

	w, r := makeRequest("GET", "/api/v1/health", nil)
	h.Health(w, r)

	// With nil DB, should return 503
	if w.Code != http.StatusServiceUnavailable {
		t.Errorf("expected 503, got %d", w.Code)
	}
}

// ── Room Status Validation Tests ─────────────────────────

func TestStatusOrDefault(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"active", "active"},
		{"", "default_value"},
		{"vacant_dirty", "vacant_dirty"},
	}

	for _, tt := range tests {
		result := statusOrDefault(tt.input, "default_value")
		if result != tt.expected {
			t.Errorf("statusOrDefault(%q) = %q, want %q", tt.input, result, tt.expected)
		}
	}
}

// ── Reservation Status Machine Tests ─────────────────────

func TestCanTransition(t *testing.T) {
	tests := []struct {
		from     string
		to       string
		expected bool
	}{
		{"inquiry", "tentative", true},
		{"tentative", "confirmed", true},
		{"confirmed", "checked_in", true},
		{"checked_in", "in_house", true},
		{"in_house", "checked_out", true},
		{"tentative", "cancelled", true},
		{"confirmed", "cancelled", true},
		{"confirmed", "no_show", true},
		{"tentative", "expired", true},
		{"cancelled", "confirmed", false},
		{"checked_out", "confirmed", false},
		{"inquiry", "checked_in", false},
	}

	for _, tt := range tests {
		result := canTransition(tt.from, tt.to)
		if result != tt.expected {
			t.Errorf("canTransition(%q, %q) = %v, want %v", tt.from, tt.to, result, tt.expected)
		}
	}
}

// ── UUID Helper Tests ────────────────────────────────────

func TestUuidOrEmpty_Empty(t *testing.T) {
	result := uuidOrEmpty("")
	if result != nil {
		t.Errorf("expected nil for empty string, got %v", result)
	}
}

func TestUuidOrEmpty_NonEmpty(t *testing.T) {
	result := uuidOrEmpty("550e8400-e29b-41d4-a716-446655440000")
	if result == nil {
		t.Error("expected non-nil for valid UUID")
	}
}

func TestNullString_Empty(t *testing.T) {
	result := nullString("")
	if result != nil {
		t.Errorf("expected nil for empty string, got %v", result)
	}
}

func TestNullString_NonEmpty(t *testing.T) {
	result := nullString("hello")
	if result == nil {
		t.Error("expected non-nil for non-empty string")
	}
	if str, ok := result.(*string); ok {
		if *str != "hello" {
			t.Errorf("expected 'hello', got %q", *str)
		}
	}
}

// ── Helper Response Tests ────────────────────────────────

func TestJsonSuccess(t *testing.T) {
	w := httptest.NewRecorder()
	jsonSuccess(w, map[string]string{"key": "value"})

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	if resp["success"] != true {
		t.Error("expected success=true")
	}
}

func TestJsonError(t *testing.T) {
	w := httptest.NewRecorder()
	jsonError(w, "something went wrong", http.StatusBadRequest)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestJsonPaginated(t *testing.T) {
	w := httptest.NewRecorder()
	items := []map[string]string{{"id": "1"}, {"id": "2"}}
	jsonPaginated(w, items, 1, 10, 25)

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}

	var resp map[string]interface{}
	json.NewDecoder(w.Body).Decode(&resp)
	if resp["success"] != true {
		t.Error("expected success=true")
	}
	meta, ok := resp["meta"].(map[string]interface{})
	if !ok {
		t.Fatal("expected meta in response")
	}
	pagination, ok := meta["pagination"].(map[string]interface{})
	if !ok {
		t.Fatal("expected pagination in meta")
	}
	if pagination["total"].(float64) != 25 {
		t.Errorf("expected total 25, got %v", pagination["total"])
	}
}

func TestSendError(t *testing.T) {
	w := httptest.NewRecorder()
	SendError(w, http.StatusForbidden, "access denied")

	if w.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d", w.Code)
	}
}

func TestSendSuccess(t *testing.T) {
	w := httptest.NewRecorder()
	SendSuccess(w, map[string]bool{"ok": true})

	if w.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", w.Code)
	}
}

func TestSendCreated(t *testing.T) {
	w := httptest.NewRecorder()
	SendCreated(w, map[string]string{"id": "new-id"})

	if w.Code != http.StatusCreated {
		t.Errorf("expected 201, got %d", w.Code)
	}
}

// ── Handler Construction Tests ───────────────────────────

func TestNewHandler(t *testing.T) {
	jwt := auth.NewJWTService([]byte("test"))
	h := New(nil, jwt)

	if h == nil {
		t.Fatal("expected non-nil handler")
	}
	if h.db != nil {
		t.Error("expected nil db")
	}
	if h.jwt == nil {
		t.Error("expected non-nil jwt")
	}
	if h.audit == nil {
		t.Error("expected non-nil audit logger")
	}
}
