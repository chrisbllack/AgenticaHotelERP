package handler

import (
	"encoding/json"
	"log"
	"net/http"

	"infineon/internal/channelmanager"
)

// ChannelMgr is the channel manager instance (set during init)
var ChannelMgr *channelmanager.ChannelManager

// SetChannelManager sets the global channel manager instance
func SetChannelManager(cm *channelmanager.ChannelManager) {
	ChannelMgr = cm
}

// ListChannels returns all OTA channel connections
func (h *Handler) ListChannels(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()

	channels, err := ChannelMgr.ListChannels(ctx, propertyID)
	if err != nil {
		log.Printf("[CHANNEL] ListChannels error: %v (propertyID=%s)", err, propertyID)
		respondJSON(w, 500, map[string]interface{}{"error": "Failed to list channels: " + err.Error()})
		return
	}

	respondJSON(w, 200, map[string]interface{}{
		"channels": channels,
		"total":    len(channels),
	})
}

// SyncRates pushes rates to all enabled channels
func (h *Handler) SyncRates(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()

	resp, err := ChannelMgr.SyncRatesToAll(ctx, propertyID)
	if err != nil {
		respondJSON(w, 500, map[string]interface{}{"error": err.Error()})
		return
	}

	respondJSON(w, 200, resp)
}

// SyncAvailability pushes availability to all enabled channels
func (h *Handler) SyncAvailability(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()

	resp, err := ChannelMgr.SyncAvailabilityToAll(ctx, propertyID)
	if err != nil {
		respondJSON(w, 500, map[string]interface{}{"error": err.Error()})
		return
	}

	respondJSON(w, 200, resp)
}

// PullChannelBookings imports bookings from all enabled channels
func (h *Handler) PullChannelBookings(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()

	resp, err := ChannelMgr.PullBookingsFromAll(ctx, propertyID)
	if err != nil {
		respondJSON(w, 500, map[string]interface{}{"error": err.Error()})
		return
	}

	respondJSON(w, 200, resp)
}

// ChannelPerformance returns per-channel performance metrics
func (h *Handler) ChannelPerformance(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()

	perf := ChannelMgr.GetChannelPerformance(ctx, propertyID)
	respondJSON(w, 200, perf)
}

// ChannelSyncLog returns sync history for a channel
func (h *Handler) ChannelSyncLog(w http.ResponseWriter, r *http.Request) {
	channelID := r.URL.Query().Get("channel_id")
	if channelID == "" {
		respondJSON(w, 400, map[string]interface{}{"error": "channel_id required"})
		return
	}
	ctx := r.Context()

	logs := ChannelMgr.GetSyncLog(ctx, channelID, 50)
	respondJSON(w, 200, map[string]interface{}{"logs": logs})
}

// ChannelBookings returns bookings from a specific channel
func (h *Handler) ChannelBookings(w http.ResponseWriter, r *http.Request) {
	channelID := r.URL.Query().Get("channel_id")
	status := r.URL.Query().Get("status")
	ctx := r.Context()

	bookings := ChannelMgr.GetChannelBookings(ctx, channelID, status)
	respondJSON(w, 200, map[string]interface{}{"bookings": bookings})
}

// UpdateChannelSettings updates a channel's configuration
func (h *Handler) UpdateChannelSettings(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var req struct {
		ChannelID  string  `json:"channel_id"`
		Commission float64 `json:"commission"`
		Markup     float64 `json:"markup"`
		MarkupType string  `json:"markup_type"`
		MinStay    int     `json:"min_stay"`
		MaxStay    int     `json:"max_stay"`
		Enabled    bool    `json:"enabled"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, 400, map[string]interface{}{"error": "Invalid request body"})
		return
	}

	err := ChannelMgr.UpdateChannelSettings(ctx, req.ChannelID, req.Commission, req.Markup, req.MarkupType, req.MinStay, req.MaxStay, req.Enabled)
	if err != nil {
		respondJSON(w, 500, map[string]interface{}{"error": "Failed to update channel"})
		return
	}

	respondJSON(w, 200, map[string]interface{}{"message": "Channel settings updated"})
}

// ChannelDashboard returns a unified channel management dashboard
func (h *Handler) ChannelDashboard(w http.ResponseWriter, r *http.Request) {
	propertyID := getPropertyID(r)
	ctx := r.Context()

	channels, _ := ChannelMgr.ListChannels(ctx, propertyID)
	perf := ChannelMgr.GetChannelPerformance(ctx, propertyID)

	connected := 0
	for _, ch := range channels {
		if ch.Status == "connected" && ch.Enabled {
			connected++
		}
	}

	respondJSON(w, 200, map[string]interface{}{
		"summary": map[string]interface{}{
			"total_channels":      len(channels),
			"connected_channels":  connected,
			"enabled_channels":    connected,
			"total_revenue":       perf["total_revenue"],
		},
		"channels": channels,
		"performance": perf,
	})
}
