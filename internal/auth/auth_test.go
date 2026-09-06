package auth

import (
	"testing"

	"github.com/google/uuid"
)

// ── JWT Service Tests ──

func TestJWTServiceGenerateAndVerify(t *testing.T) {
	secret := []byte("test-secret-key-for-jwt-testing-1234")
	svc := NewJWTService(secret)

	userID := uuid.New()
	propertyID := uuid.New()
	roles := []string{"admin"}
	permissions := []string{"*"}

	token, err := svc.GenerateToken(userID, propertyID, roles, permissions)
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}

	if token == "" {
		t.Fatal("expected non-empty token")
	}

	// Verify the token
	verified, err := svc.ValidateToken(token)
	if err != nil {
		t.Fatalf("failed to verify token: %v", err)
	}

	if verified == nil {
		t.Fatal("expected non-nil claims")
	}

	if verified.UserID != userID {
		t.Errorf("expected user_id %v, got %v", userID, verified.UserID)
	}

	if verified.PropertyID != propertyID {
		t.Errorf("expected property_id %v, got %v", propertyID, verified.PropertyID)
	}

	if len(verified.Roles) != 1 || verified.Roles[0] != "admin" {
		t.Errorf("expected roles [admin], got %v", verified.Roles)
	}
}

func TestJWTServiceInvalidToken(t *testing.T) {
	secret := []byte("test-secret")
	svc := NewJWTService(secret)

	_, err := svc.ValidateToken("invalid.token.here")
	if err == nil {
		t.Error("expected error for invalid token")
	}
}

func TestJWTServiceWrongSecret(t *testing.T) {
	svc1 := NewJWTService([]byte("secret-1"))
	svc2 := NewJWTService([]byte("secret-2"))

	userID := uuid.New()
	propertyID := uuid.New()

	token, err := svc1.GenerateToken(userID, propertyID, []string{"user"}, []string{"read"})
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}

	_, err = svc2.ValidateToken(token)
	if err == nil {
		t.Error("expected error for token signed with different secret")
	}
}

// ── Password Hashing Tests ──

func TestHashPassword(t *testing.T) {
	password := "MySecurePassword123!"
	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}

	if hash == "" {
		t.Fatal("expected non-empty hash")
	}

	if hash == password {
		t.Error("hash should not equal plaintext password")
	}
}

func TestCheckPassword(t *testing.T) {
	password := "HotelPMS2026!"
	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}

	// Correct password
	if !CheckPassword(password, hash) {
		t.Error("expected correct password to match")
	}

	// Wrong password
	if CheckPassword("WrongPassword", hash) {
		t.Error("expected wrong password to not match")
	}

	// Empty password
	if CheckPassword("", hash) {
		t.Error("expected empty password to not match")
	}
}

func TestPasswordHashUniqueness(t *testing.T) {
	password := "SamePassword"
	hash1, _ := HashPassword(password)
	hash2, _ := HashPassword(password)

	// Same password should produce different hashes (salt)
	if hash1 == hash2 {
		t.Error("password hashes should be unique due to random salt")
	}

	// But both should verify correctly
	if !CheckPassword(password, hash1) {
		t.Error("first hash should verify")
	}
	if !CheckPassword(password, hash2) {
		t.Error("second hash should verify")
	}
}

// ── RBAC Tests ──

func TestRBACPermissions(t *testing.T) {
	rolePermissions := map[string][]string{
		"admin":                   {"*"},
		"general_manager":         {"dashboard.*", "rooms.*", "reservations.*", "finance.*", "hr.*", "reports.*"},
		"front_desk_manager":      {"rooms.*", "reservations.*", "front_desk.*", "guests.*"},
		"receptionist":            {"rooms.read", "reservations.read", "reservations.create", "front_desk.*", "guests.*"},
		"restaurant_manager":      {"pos.*", "inventory.read"},
		"waiter":                  {"pos.orders.*", "pos.tables.*"},
		"accountant":              {"finance.*", "reports.finance.*"},
		"housekeeping_supervisor": {"housekeeping.*", "maintenance.create"},
	}

	// Admin should have access to everything
	adminPerms := rolePermissions["admin"]
	if adminPerms[0] != "*" {
		t.Error("admin should have wildcard permission")
	}

	// Waiter should not have finance access
	waiterPerms := rolePermissions["waiter"]
	for _, p := range waiterPerms {
		if len(p) > 7 && p[:7] == "finance" {
			t.Error("waiter should not have finance permissions")
		}
	}
}

func TestPermissionMatch(t *testing.T) {
	tests := []struct {
		pattern      string
		perm         string
		shouldMatch  bool
	}{
		{"*", "anything", true},
		{"rooms.*", "rooms.read", true},
		{"rooms.*", "rooms.write", true},
		{"rooms.*", "finance.read", false},
		{"rooms.read", "rooms.read", true},
		{"rooms.read", "rooms.write", false},
	}

	for _, tt := range tests {
		match := permissionMatches(tt.pattern, tt.perm)
		if match != tt.shouldMatch {
			t.Errorf("pattern=%q, perm=%q: expected match=%v, got %v",
				tt.pattern, tt.perm, tt.shouldMatch, match)
		}
	}
}

func permissionMatches(pattern, perm string) bool {
	if pattern == "*" {
		return true
	}
	if pattern == perm {
		return true
	}
	if len(pattern) > 2 && pattern[len(pattern)-2:] == ".*" {
		prefix := pattern[:len(pattern)-2]
		return len(perm) > len(prefix) && perm[:len(prefix)+1] == prefix+"."
	}
	return false
}
