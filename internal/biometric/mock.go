package biometric

import (
	"context"
	"fmt"
	"math/rand"
	"time"
)

// MockProvider simulates a biometric device for development and demo
type MockProvider struct {
	connected  bool
	events     []AttendanceEvent
	users      []DeviceUser
	deviceInfo *DeviceInfo
	clock      time.Time
}

// NewMockProvider creates a new mock device
func NewMockProvider() *MockProvider {
	return &MockProvider{
		clock: time.Now(),
		deviceInfo: &DeviceInfo{
			DeviceID:     "MOCK-001",
			Model:        "Mock Face Terminal",
			SerialNumber: "MOCK-SN-2024",
			Firmware:     "1.0.0-mock",
			UserCount:    0,
			Capabilities: []string{
				CapReadAttendance, CapWriteUser, CapReadUser,
				CapDeleteUser, CapSyncUser,
				CapReadDeviceInfo, CapReadDeviceTime, CapSetDeviceTime,
			},
		},
	}
}

func (m *MockProvider) Name() string { return "mock" }

func (m *MockProvider) Connect(ctx context.Context, ip string, port int, username, password string) error {
	m.connected = true
	m.clock = time.Now()
	return nil
}

func (m *MockProvider) Disconnect() error {
	m.connected = false
	return nil
}

func (m *MockProvider) IsConnected() bool { return m.connected }

func (m *MockProvider) GetDeviceInfo(ctx context.Context) (*DeviceInfo, error) {
	if !m.connected {
		return nil, fmt.Errorf("device not connected")
	}
	m.deviceInfo.UserCount = len(m.users)
	return m.deviceInfo, nil
}

func (m *MockProvider) GetCapabilities() []string {
	return m.deviceInfo.Capabilities
}

func (m *MockProvider) PullAttendance(ctx context.Context, lastSync *time.Time) ([]AttendanceEvent, error) {
	if !m.connected {
		return nil, fmt.Errorf("device not connected")
	}

	var result []AttendanceEvent
	for _, e := range m.events {
		if lastSync == nil || e.EventTimestamp.After(*lastSync) {
			result = append(result, e)
		}
	}

	// Simulate generating new events occasionally
	if rand.Intn(3) == 0 {
		now := time.Now()
		m.events = append(m.events, AttendanceEvent{
			DeviceUserID:   fmt.Sprintf("EMP-%03d", rand.Intn(15)+1),
			EventTimestamp: now,
			EventType:      "check_in",
			Verification:   "face",
			RawPayload:     `{"mock":true}`,
		})
	}

	return result, nil
}

func (m *MockProvider) GetUsers(ctx context.Context) ([]DeviceUser, error) {
	if !m.connected {
		return nil, fmt.Errorf("device not connected")
	}
	return m.users, nil
}

func (m *MockProvider) PushUser(ctx context.Context, user DeviceUser) error {
	for i, u := range m.users {
		if u.DeviceUserID == user.DeviceUserID {
			m.users[i] = user
			return nil
		}
	}
	m.users = append(m.users, user)
	return nil
}

func (m *MockProvider) RemoveUser(ctx context.Context, deviceUserID string) error {
	for i, u := range m.users {
		if u.DeviceUserID == deviceUserID {
			m.users = append(m.users[:i], m.users[i+1:]...)
			return nil
		}
	}
	return fmt.Errorf("user not found")
}

func (m *MockProvider) GetDeviceTime(ctx context.Context) (*time.Time, error) {
	if !m.connected {
		return nil, fmt.Errorf("device not connected")
	}
	now := m.clock
	return &now, nil
}

func (m *MockProvider) SetDeviceTime(ctx context.Context, t time.Time) error {
	if !m.connected {
		return fmt.Errorf("device not connected")
	}
	m.clock = t
	return nil
}

// SeedUsers populates the mock device with employee users
func (m *MockProvider) SeedUsers(employees []struct{ ID, Name, DeviceUserID string }) {
	for _, e := range employees {
		m.users = append(m.users, DeviceUser{
			DeviceUserID: e.DeviceUserID,
			Name:         e.Name,
			EmployeeID:   e.ID,
			Active:       true,
		})
	}
}
