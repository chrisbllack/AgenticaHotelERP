import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:8080/api/v1';

test.describe('Room Management API', () => {
  test('GET /rooms should return room list', async ({ request }) => {
    const response = await request.get(`${API_BASE}/rooms/`, {
      headers: { 'X-Property-ID': '1' },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.success).toBeTruthy();
    expect(Array.isArray(body.data)).toBeTruthy();
  });

  test('GET /room-types should return room types', async ({ request }) => {
    const response = await request.get(`${API_BASE}/room-types/`);
    expect(response.ok()).toBeTruthy();
  });

  test('GET /availability/check should validate dates', async ({ request }) => {
    const response = await request.get(`${API_BASE}/availability/check?check_in=2026-09-01&check_out=2026-09-05&rooms=1`);
    expect(response.ok()).toBeTruthy();
  });
});

test.describe('Guest Management API', () => {
  test('GET /guests should return guest list', async ({ request }) => {
    const response = await request.get(`${API_BASE}/guests/`);
    expect(response.ok()).toBeTruthy();
  });

  test('POST /guests should create guest', async ({ request }) => {
    const response = await request.post(`${API_BASE}/guests/`, {
      data: {
        first_name: 'Test',
        last_name: 'Guest',
        email: `test${Date.now()}@example.com`,
        phone: '+2348012345678',
      },
    });
    expect(response.ok()).toBeTruthy();
  });
});

test.describe('Reservation API', () => {
  test('GET /reservations should return list', async ({ request }) => {
    const response = await request.get(`${API_BASE}/reservations/`);
    expect(response.ok()).toBeTruthy();
  });
});

test.describe('POS API', () => {
  test('GET /pos/outlets should return outlets', async ({ request }) => {
    const response = await request.get(`${API_BASE}/pos/outlets/`);
    expect(response.ok()).toBeTruthy();
  });

  test('GET /pos/menu/items should return menu', async ({ request }) => {
    const response = await request.get(`${API_BASE}/pos/menu/items`);
    expect(response.ok()).toBeTruthy();
  });
});

test.describe('Finance API', () => {
  test('GET /finance/accounts should return chart of accounts', async ({ request }) => {
    const response = await request.get(`${API_BASE}/finance/accounts/`);
    expect(response.ok()).toBeTruthy();
  });

  test('GET /finance/profit-loss should return P&L', async ({ request }) => {
    const response = await request.get(`${API_BASE}/finance/profit-loss`);
    expect(response.ok()).toBeTruthy();
  });
});

test.describe('Reports API', () => {
  test('GET /reports/dashboard should return KPIs', async ({ request }) => {
    const response = await request.get(`${API_BASE}/reports/dashboard`);
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.data).toBeDefined();
  });

  test('GET /reports/occupancy should return occupancy data', async ({ request }) => {
    const response = await request.get(`${API_BASE}/reports/occupancy`);
    expect(response.ok()).toBeTruthy();
  });
});

test.describe('Hardware API', () => {
  test('GET /hardware/devices should return device list', async ({ request }) => {
    const response = await request.get(`${API_BASE}/hardware/devices`);
    expect(response.ok()).toBeTruthy();
  });

  test('GET /hardware/health should return health status', async ({ request }) => {
    const response = await request.get(`${API_BASE}/hardware/health`);
    expect(response.ok()).toBeTruthy();
  });
});

test.describe('Channel Manager API', () => {
  test('GET /channels should return channel list', async ({ request }) => {
    const response = await request.get(`${API_BASE}/channels/`);
    expect(response.ok()).toBeTruthy();
  });
});

test.describe('Notifications API', () => {
  test('GET /notifications should return notification list', async ({ request }) => {
    const response = await request.get(`${API_BASE}/notifications/`);
    expect(response.ok()).toBeTruthy();
  });
});

test.describe('Workflow API', () => {
  test('GET /workflow/approvals should return pending approvals', async ({ request }) => {
    const response = await request.get(`${API_BASE}/workflow/approvals`);
    expect(response.ok()).toBeTruthy();
  });
});
