package payment

import (
	"sync"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// Idempotency Key Store
//
// Ensures that duplicate payment requests (network retries,
// client resubmission) don't create duplicate transactions.
//
// Uses in-memory TTL cache. For production, consider Redis.
//
// Flow:
// 1. Client sends request with X-Idempotency-Key header
// 2. Server checks if key exists:
//    - Yes + completed → return cached response (no new charge)
//    - Yes + in-progress → return 409 Conflict
//    - No → process, store response, return
// 3. Keys expire after 24 hours
// ═══════════════════════════════════════════════════════════════

const (
	// IdempotencyTTL is how long idempotency keys are remembered.
	IdempotencyTTL = 24 * time.Hour

	// StatusInFlight means a request with this key is being processed.
	StatusInFlight = "in_flight"

	// StatusCompleted means a request with this key was completed.
	StatusCompleted = "completed"
)

// IdempotencyEntry stores the result of a completed operation.
type IdempotencyEntry struct {
	Key         string      `json:"key"`
	Status      string      `json:"status"` // in_flight, completed
	StatusCode  int         `json:"status_code"`
	Body        interface{} `json:"body"`
	CreatedAt   time.Time   `json:"created_at"`
	ExpiresAt   time.Time   `json:"expires_at"`
}

// IdempotencyStore is a thread-safe in-memory store for idempotency keys.
type IdempotencyStore struct {
	mu      sync.RWMutex
	entries map[string]*IdempotencyEntry
}

// NewIdempotencyStore creates a new idempotency store.
func NewIdempotencyStore() *IdempotencyStore {
	store := &IdempotencyStore{
		entries: make(map[string]*IdempotencyEntry),
	}

	// Start background cleanup goroutine
	go store.cleanup()

	return store
}

// Get retrieves an idempotency entry by key.
// Returns nil if the key doesn't exist or has expired.
func (s *IdempotencyStore) Get(key string) *IdempotencyEntry {
	s.mu.RLock()
	defer s.mu.RUnlock()

	entry, ok := s.entries[key]
	if !ok {
		return nil
	}

	// Check expiry
	if time.Now().After(entry.ExpiresAt) {
		return nil
	}

	return entry
}

// SetInFlight marks a key as being processed.
// Returns false if the key is already in flight or completed.
func (s *IdempotencyStore) SetInFlight(key string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	entry, ok := s.entries[key]
	if ok && time.Now().Before(entry.ExpiresAt) {
		// Key exists and hasn't expired
		return false
	}

	s.entries[key] = &IdempotencyEntry{
		Key:       key,
		Status:    StatusInFlight,
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(IdempotencyTTL),
	}

	return true
}

// SetCompleted stores the result of a completed operation.
func (s *IdempotencyStore) SetCompleted(key string, statusCode int, body interface{}) {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.entries[key] = &IdempotencyEntry{
		Key:        key,
		Status:     StatusCompleted,
		StatusCode: statusCode,
		Body:       body,
		CreatedAt:  time.Now(),
		ExpiresAt:  time.Now().Add(IdempotencyTTL),
	}
}

// Remove deletes an idempotency key.
func (s *IdempotencyStore) Remove(key string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.entries, key)
}

// cleanup runs every hour and removes expired entries.
func (s *IdempotencyStore) cleanup() {
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	for range ticker.C {
		s.mu.Lock()
		now := time.Now()
		for key, entry := range s.entries {
			if now.After(entry.ExpiresAt) {
				delete(s.entries, key)
			}
		}
		s.mu.Unlock()
	}
}

// Stats returns the current store statistics.
func (s *IdempotencyStore) Stats() map[string]int {
	s.mu.RLock()
	defer s.mu.RUnlock()

	inFlight := 0
	completed := 0
	for _, entry := range s.entries {
		if time.Now().After(entry.ExpiresAt) {
			continue
		}
		if entry.Status == StatusInFlight {
			inFlight++
		} else {
			completed++
		}
	}

	return map[string]int{
		"total":     len(s.entries),
		"in_flight": inFlight,
		"completed": completed,
	}
}
