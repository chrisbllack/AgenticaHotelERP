package handler

import (
	"context"
	"encoding/json"
	"net/http"

	"infineon/internal/auth"
	"infineon/internal/response"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

func (h *Handler) ListUsers(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(context.Background(),
		"SELECT id, name, email, status, created_at FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 100")
	if err != nil {
		response.RespondError(w, "Failed to query users", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var users []map[string]interface{}
	for rows.Next() {
		var id uuid.UUID
		var name, email, status string
		var createdAt interface{}
		if err := rows.Scan(&id, &name, &email, &status, &createdAt); err != nil {
			continue
		}
		users = append(users, map[string]interface{}{
			"id": id, "name": name, "email": email, "status": status, "created_at": createdAt,
		})
	}

	response.RespondSuccess(w, users, "Users retrieved successfully")
}

type CreateUserRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Phone    string `json:"phone"`
}

func (h *Handler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req CreateUserRequest
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
		"INSERT INTO users (id, name, email, password, phone, status) VALUES ($1, $2, $3, $4, $5, 'active')",
		id, req.Name, req.Email, hash, req.Phone)

	if err != nil {
		response.RespondError(w, "Failed to create user", http.StatusConflict)
		return
	}

	response.RespondSuccess(w, map[string]interface{}{
		"id": id, "name": req.Name, "email": req.Email,
	}, "User created successfully", http.StatusCreated)
}

func (h *Handler) GetUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var name, email, status string
	var createdAt interface{}
	err := h.db.QueryRow(context.Background(),
		"SELECT name, email, status, created_at FROM users WHERE id = $1 AND deleted_at IS NULL", id,
	).Scan(&name, &email, &status, &createdAt)

	if err != nil {
		response.RespondError(w, "User not found", http.StatusNotFound)
		return
	}

	response.RespondSuccess(w, map[string]interface{}{
		"id": id, "name": name, "email": email, "status": status, "created_at": createdAt,
	}, "User retrieved successfully")
}

func (h *Handler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req struct {
		Name  string `json:"name"`
		Email string `json:"email"`
		Phone string `json:"phone"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.RespondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	_, err := h.db.Exec(context.Background(),
		"UPDATE users SET name = COALESCE(NULLIF($2, ''), name), email = COALESCE(NULLIF($3, ''), email), phone = COALESCE(NULLIF($4, ''), phone), updated_at = NOW() WHERE id = $1",
		id, req.Name, req.Email, req.Phone)
	if err != nil {
		response.RespondError(w, "Failed to update user", http.StatusInternalServerError)
		return
	}

	response.RespondSuccess(w, map[string]interface{}{"id": id}, "User updated successfully")
}

func (h *Handler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	_, err := h.db.Exec(context.Background(),
		"UPDATE users SET deleted_at = NOW() WHERE id = $1", id)
	if err != nil {
		response.RespondError(w, "Failed to delete user", http.StatusInternalServerError)
		return
	}

	response.RespondSuccess(w, nil, "User deleted successfully")
}
