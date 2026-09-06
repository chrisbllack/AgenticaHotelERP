package biometric

import (
	"context"
	"crypto/sha256"
	"fmt"
	"time"
)

// DahuaProvider implements the Provider interface for Dahua biometric devices.
// In production this would use Dahua's CGI/SDK/API protocols.
// For development and demo mode, this uses a simulated device.
type DahuaProvider struct {
	connected   bool
	ip          string
	port        int
	username    string
	events      []AttendanceEvent
	users       []DeviceUser
	deviceInfo  *DeviceInfo
	clock       time.Time
}

func (d *DahuaProvider) Name() string { return "dahua" }

func (d *DahuaProvider) Connect(ctx context.Context, ip string, port int, username, password string) error {
	// In production: establish TCP connection to Dahua device
	// Use HTTP CGI API or SDK depending on device model
	d.ip = ip
	d.port = port
	d.username = username
	d.connected = true
	d.clock = time.Now()

	// Simulate device info based on Dahua ASA3223A-W
	d.deviceInfo = &DeviceInfo{
		DeviceID:     fmt.Sprintf("DAHUA-%s", ip),
		Model:        "ASA3223A-W",
		SerialNumber: "DHW20240815001",
		Firmware:     "2.820.0000000.0",
		UserCount:    0,
		Capabilities: []string{
			CapReadAttendance, CapReadUser, CapReadDeviceInfo,
			CapReadDeviceTime, CapSetDeviceTime,
		},
	}

	return nil
}

func (d *DahuaProvider) Disconnect() error {
	d.connected = false
	return nil
}

func (d *DahuaProvider) IsConnected() bool { return d.connected }

func (d *DahuaProvider) GetDeviceInfo(ctx context.Context) (*DeviceInfo, error) {
	if !d.connected {
		return nil, fmt.Errorf("device not connected")
	}
	return d.deviceInfo, nil
}

func (d *DahuaProvider) GetCapabilities() []string {
	return []string{
		CapReadAttendance, CapReadUser, CapReadDeviceInfo,
		CapReadDeviceTime, CapSetDeviceTime,
	}
}

func (d *DahuaProvider) PullAttendance(ctx context.Context, lastSync *time.Time) ([]AttendanceEvent, error) {
	if !d.connected {
		return nil, fmt.Errorf("device not connected")
	}

	// In production: HTTP GET to Dahua CGI endpoint
	// Example: http://<ip>:<port>/cgi-bin/attGetRecord.cgi
	// Parse XML/JSON response into AttendanceEvent structs

	var result []AttendanceEvent
	for _, e := range d.events {
		if lastSync == nil || e.EventTimestamp.After(*lastSync) {
			result = append(result, e)
		}
	}

	return result, nil
}

func (d *DahuaProvider) GetUsers(ctx context.Context) ([]DeviceUser, error) {
	if !d.connected {
		return nil, fmt.Errorf("device not connected")
	}
	return d.users, nil
}

func (d *DahuaProvider) PushUser(ctx context.Context, user DeviceUser) error {
	// Dahua devices with SDK support WRITE_USER capability
	for i, u := range d.users {
		if u.DeviceUserID == user.DeviceUserID {
			d.users[i] = user
			return nil
		}
	}
	d.users = append(d.users, user)
	return nil
}

func (d *DahuaProvider) RemoveUser(ctx context.Context, deviceUserID string) error {
	for i, u := range d.users {
		if u.DeviceUserID == deviceUserID {
			d.users = append(d.users[:i], d.users[i+1:]...)
			return nil
		}
	}
	return fmt.Errorf("user not found on device")
}

func (d *DahuaProvider) GetDeviceTime(ctx context.Context) (*time.Time, error) {
	if !d.connected {
		return nil, fmt.Errorf("device not connected")
	}
	now := d.clock
	return &now, nil
}

func (dahua *DahuaProvider) SetDeviceTime(ctx context.Context, t time.Time) error {
	if !dahua.connected {
		return fmt.Errorf("device not connected")
	}
	dahua.clock = t
	return nil
}

// SeedDemoEvents populates the device with simulated attendance events
// for the last 7 days — used in demo mode
func (d *DahuaProvider) SeedDemoEvents(employeeDeviceIDs []string) {
	now := time.Now()
	for day := 0; day < 7; day++ {
		date := now.AddDate(0, 0, -day)
		isWeekend := date.Weekday() == time.Saturday || date.Weekday() == time.Sunday

		for i, devUserID := range employeeDeviceIDs {
			if isWeekend && i > 8 {
				continue // some staff don't work weekends
			}

			// Check-in between 07:00 and 09:00
			inHour := 7 + (i % 3)
			inMin := (i * 17) % 50
			checkIn := time.Date(date.Year(), date.Month(), date.Day(), inHour, inMin, 0, 0, time.Local)

			d.events = append(d.events, AttendanceEvent{
				DeviceUserID:   devUserID,
				EventTimestamp: checkIn,
				EventType:      "check_in",
				Verification:   "face",
				RawPayload:     fmt.Sprintf(`{"uid":%d,"dir":0,"ver":1}`, i+1),
			})

			// Check-out between 17:00 and 20:00
			outHour := 17 + (i % 3)
			outMin := (i * 13) % 55
			checkOut := time.Date(date.Year(), date.Month(), date.Day(), outHour, outMin, 0, 0, time.Local)

			d.events = append(d.events, AttendanceEvent{
				DeviceUserID:   devUserID,
				EventTimestamp: checkOut,
				EventType:      "check_out",
				Verification:   "face",
				RawPayload:     fmt.Sprintf(`{"uid":%d,"dir":1,"ver":1}`, i+1),
			})
		}
	}
}

// MakeEventHash generates an idempotent hash for deduplication
func MakeEventHash(deviceID, deviceUserID string, ts time.Time) string {
	h := sha256.Sum256([]byte(fmt.Sprintf("%s:%s:%s", deviceID, deviceUserID, ts.Format(time.RFC3339Nano))))
	return fmt.Sprintf("%x", h)
}
