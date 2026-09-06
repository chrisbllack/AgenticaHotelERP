package handler

import (
	"context"
	"encoding/json"
	"net/http"

	"infineon/internal/auth"
	"infineon/internal/response"

	"github.com/google/uuid"
)

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string      `json:"token"`
	User  interface{} `json:"user"`
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.RespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.Password == "" {
		response.RespondError(w, "Email and password are required", http.StatusBadRequest)
		return
	}

	// Query user from database
	var id string
	var name, email, passwordHash string
	var status string

	err := h.db.QueryRow(context.Background(),
		"SELECT id, name, email, password, status FROM users WHERE email = ? AND deleted_at IS NULL",
		req.Email,
	).Scan(&id, &name, &email, &passwordHash, &status)

	if err != nil {
		response.RespondError(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	if status != "active" {
		response.RespondError(w, "Account is not active", http.StatusForbidden)
		return
	}

	if !auth.CheckPassword(req.Password, passwordHash) {
		response.RespondError(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	// Look up user's property and roles
	var propertyID string
	var roles []string
	err = h.db.QueryRow(context.Background(),
		"SELECT property_id FROM user_property_roles WHERE user_id = ? LIMIT 1",
		id,
	).Scan(&propertyID)
	if err != nil || propertyID == "" {
		// Fallback: try to find any property
		_ = h.db.QueryRow(context.Background(),
			"SELECT id FROM properties LIMIT 1",
		).Scan(&propertyID)
	}

	// Look up actual roles and permissions from user_property_roles
	var role string
	var permissionsJSON string
	err = h.db.QueryRow(context.Background(),
		"SELECT role, permissions FROM user_property_roles WHERE user_id = ? LIMIT 1",
		id,
	).Scan(&role, &permissionsJSON)
	if err != nil || role == "" {
		roles = []string{"admin"}
		permissionsJSON = `["*"]`
	} else {
		roles = []string{role}
	}

	// Parse permissions from JSON string
	var permissions []string
	if permissionsJSON != "" {
		_ = json.Unmarshal([]byte(permissionsJSON), &permissions)
	}
	if len(permissions) == 0 {
		permissions = []string{"*"}
	}

	userID, errUID := uuid.Parse(id)
	if errUID != nil {
		userID = uuid.NewSHA1(uuid.NameSpaceURL, []byte("user:"+id))
	}
	propID, errPID := uuid.Parse(propertyID)
	if errPID != nil {
		propID = uuid.NewSHA1(uuid.NameSpaceURL, []byte("property:"+propertyID))
	}
	token, err := h.jwt.GenerateToken(userID, propID, roles, permissions)
	if err != nil {
		response.RespondError(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	// Update last login
	_, _ = h.db.Exec(context.Background(),
		"UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1", id)

	response.RespondSuccess(w, LoginResponse{
		Token: token,
		User: map[string]interface{}{
			"id":         id,
			"name":       name,
			"email":      email,
			"property_id": propertyID,
			"role":       roles[0],
			"permissions": permissions,
		},
	}, "Login successful")
}

type RegisterRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.RespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Name == "" || req.Email == "" || req.Password == "" {
		response.RespondError(w, "Name, email, and password are required", http.StatusBadRequest)
		return
	}

	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		response.RespondError(w, "Failed to process password", http.StatusInternalServerError)
		return
	}

	id := uuid.New()
	_, err = h.db.Exec(context.Background(),
		"INSERT INTO users (id, name, email, password, status) VALUES ($1, $2, $3, $4, 'active')",
		id, req.Name, req.Email, hash)

	if err != nil {
		response.RespondError(w, "Failed to create user (email may already exist)", http.StatusConflict)
		return
	}

	response.RespondSuccess(w, map[string]interface{}{
		"id":    id,
		"name":  req.Name,
		"email": req.Email,
	}, "User registered successfully", http.StatusCreated)
}
