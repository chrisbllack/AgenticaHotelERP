package biometric

import (
	"context"
	"time"
)

// Capability flags that a device may or may not support
const (
	CapReadAttendance   = "READ_ATTENDANCE"
	CapWriteUser        = "WRITE_USER"
	CapReadUser         = "READ_USER"
	CapDeleteUser       = "DELETE_USER"
	CapSyncUser         = "SYNC_USER"
	CapReadDeviceInfo   = "READ_DEVICE_INFO"
	CapReadDeviceTime   = "READ_DEVICE_TIME"
	CapSetDeviceTime    = "SET_DEVICE_TIME"
)

// DeviceInfo holds static information about a biometric device
type DeviceInfo struct {
	DeviceID     string   `json:"device_id"`
	Model        string   `json:"model"`
	SerialNumber string   `json:"serial_number"`
	Firmware     string   `json:"firmware"`
	UserCount    int      `json:"user_count"`
	Capabilities []string `json:"capabilities"`
}

// AttendanceEvent represents a single raw punch from a biometric device
type AttendanceEvent struct {
	DeviceUserID   string    `json:"device_user_id"`
	EventTimestamp time.Time `json:"event_timestamp"`
	EventType      string    `json:"event_type"` // check_in, check_out, break_in, break_out
	Verification   string    `json:"verification"` // face, fingerprint, card, pin
	RawPayload     string    `json:"raw_payload"`
}

// DeviceUser represents a user enrolled on a biometric device
type DeviceUser struct {
	DeviceUserID string `json:"device_user_id"`
	Name         string `json:"name"`
	EmployeeID   string `json:"employee_id,omitempty"`
	CardNumber   string `json:"card_number,omitempty"`
	Active       bool   `json:"active"`
}

// SyncResult holds the outcome of a sync operation
type SyncResult struct {
	EventsFetched  int    `json:"events_fetched"`
	EventsCreated  int    `json:"events_created"`
	DuplicatesSkipped int `json:"duplicates_skipped"`
	Errors         int    `json:"errors"`
	LastTimestamp  string `json:"last_timestamp"`
	Error          error  `json:"-"`
}

// Provider is the interface that all biometric device adapters must implement
type Provider interface {
	// Name returns the provider name (e.g., "dahua", "zkteco", "mock")
	Name() string

	// Connect establishes connection to the device
	Connect(ctx context.Context, ip string, port int, username, password string) error

	// Disconnect closes the connection
	Disconnect() error

	// IsConnected returns whether the device is reachable
	IsConnected() bool

	// GetDeviceInfo returns static device information
	GetDeviceInfo(ctx context.Context) (*DeviceInfo, error)

	// GetCapabilities returns what this device model supports
	GetCapabilities() []string

	// PullAttendance retrieves new attendance events since lastSync
	// If lastSync is nil, retrieves all available events
	PullAttendance(ctx context.Context, lastSync *time.Time) ([]AttendanceEvent, error)

	// GetUsers retrieves enrolled users from the device
	GetUsers(ctx context.Context) ([]DeviceUser, error)

	// PushUser enrolls or updates a user on the device (if supported)
	PushUser(ctx context.Context, user DeviceUser) error

	// RemoveUser removes a user from the device (if supported)
	RemoveUser(ctx context.Context, deviceUserID string) error

	// GetDeviceTime retrieves the device's current clock
	GetDeviceTime(ctx context.Context) (*time.Time, error)

	// SetDeviceTime synchronizes the device clock
	SetDeviceTime(ctx context.Context, t time.Time) error
}

// ProviderFactory creates a Provider for a given protocol
type ProviderFactory func() Provider

var registry = map[string]ProviderFactory{}

// Register adds a provider factory to the registry
func Register(name string, factory ProviderFactory) {
	registry[name] = factory
}

// New creates a new provider by protocol name
func New(protocol string) (Provider, error) {
	factory, ok := registry[protocol]
	if !ok {
		factory = registry["mock"] // fallback to mock
	}
	return factory(), nil
}

func init() {
	// Register built-in providers
	Register("dahua", func() Provider { return &DahuaProvider{} })
	Register("mock", func() Provider { return NewMockProvider() })
}
