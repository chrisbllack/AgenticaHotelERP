import { test as base, expect, type Page } from '@playwright/test';

// ═══════════════════════════════════════════════════════════════
// INFINEON E2E Test Fixtures
// Auth helpers, API utilities, and shared test data
// ═══════════════════════════════════════════════════════════════

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:8080';

export const CREDENTIALS = {
  admin: { email: 'admin@infineon.com', password: 'admin123' },
  receptionist: { email: 'receptionist@infineon.com', password: 'admin123' },
  cashier: { email: 'cashier@infineon.com', password: 'admin123' },
  housekeeper: { email: 'housekeeper@infineon.com', password: 'admin123' },
  waiter: { email: 'waiter@infineon.com', password: 'admin123' },
};

// ═══════════════════════════════════════════════════════════════
// Auth Helpers
// ═══════════════════════════════════════════════════════════════

/**
 * Login via the UI — navigates to /login, fills form, submits.
 * Returns after dashboard is visible.
 */
export async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto('/login', { waitUntil: 'networkidle' });

  // Fill email and password
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);

  // Click Sign In button
  await page.click('button[type="submit"]');

  // Wait for navigation away from login (to dashboard)
  await page.waitForURL('**/dashboard', { timeout: 15_000 });
}

/**
 * Login via API — faster, skips UI. Returns JWT token.
 */
export async function loginViaAPI(email: string, password: string): Promise<string> {
  const response = await fetch(`${API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  return data.data?.token || '';
}

/**
 * Set auth token in localStorage (for API-preauthenticated sessions).
 */
export async function setAuthToken(page: Page, token: string) {
  await page.evaluate((t) => {
    localStorage.setItem('token', t);
    localStorage.setItem('authToken', t);
    localStorage.setItem('infineon_token', t);
  }, token);
}

/**
 * Login via API + set token in browser, then navigate to dashboard.
 */
export async function loginFast(page: Page, role: keyof typeof CREDENTIALS = 'admin') {
  const creds = CREDENTIALS[role];
  const token = await loginViaAPI(creds.email, creds.password);

  // Navigate to any page to set localStorage origin
  await page.goto('/login', { waitUntil: 'domcontentloaded' });

  // Set token
  await setAuthToken(page, token);

  // Navigate to dashboard
  await page.goto('/dashboard', { waitUntil: 'networkidle' });
}

// ═══════════════════════════════════════════════════════════════
// API Helpers — direct backend calls for test setup/teardown
// ═══════════════════════════════════════════════════════════════

let _adminToken: string = '';

async function getAdminToken(): Promise<string> {
  if (_adminToken) return _adminToken;
  _adminToken = await loginViaAPI(CREDENTIALS.admin.email, CREDENTIALS.admin.password);
  return _adminToken;
}

async function apiRequest(method: string, path: string, body?: any): Promise<any> {
  const token = await getAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
  const opts: RequestInit = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_URL}/api/v1${path}`, opts);
  return { status: res.status, data: await res.json() };
}

/** Create a reservation via API and return the reservation ID */
export async function createReservationAPI(data: {
  guest_name: string;
  guest_email: string;
  room_type_id: string;
  arrival_date: string;
  departure_date: string;
  adults?: number;
}): Promise<string> {
  const res = await apiRequest('POST', '/reservations', {
    ...data,
    adults: data.adults || 2,
  });
  return res.data?.data?.id || '';
}

/** Check-in a reservation via API */
export async function checkInAPI(reservationId: string): Promise<any> {
  return apiRequest('POST', `/reservations/${reservationId}/check-in`, {
    room_id: 'room-101',
    key_card: 'KEY-001',
  });
}

/** Check-out a reservation via API */
export async function checkOutAPI(reservationId: string): Promise<any> {
  return apiRequest('POST', `/reservations/${reservationId}/check-out`, {
    payment_method: 'cash',
  });
}

/** Get front desk dashboard */
export async function getFrontDeskDashboard(): Promise<any> {
  const res = await apiRequest('GET', '/front-desk/dashboard');
  return res.data?.data;
}

/** Get rooms list */
export async function getRooms(): Promise<any[]> {
  const res = await apiRequest('GET', '/rooms?per_page=200');
  return res.data?.data || [];
}

/** Get reservations list */
export async function getReservations(status?: string): Promise<any[]> {
  const path = status ? `/reservations?status=${status}` : '/reservations';
  const res = await apiRequest('GET', path);
  return res.data?.data || [];
}

// ═══════════════════════════════════════════════════════════════
// Navigation Helpers
// ═══════════════════════════════════════════════════════════════

export async function navigateTo(page: Page, module: string) {
  await page.goto(`/${module}`, { waitUntil: 'networkidle' });
}

/** Wait for the page to render and show content */
export async function waitForContent(page: Page, timeout = 10_000) {
  await page.waitForSelector('h1, h2, [class*="font-bold"]', { timeout });
}

// ═══════════════════════════════════════════════════════════════
// Custom Test Fixture
// ═══════════════════════════════════════════════════════════════

type InfineonFixtures = {
  adminPage: Page;
  token: string;
};

export const test = base.extend<InfineonFixtures>({
  adminPage: async ({ browser }, use) => {
    const page = await browser.newPage();
    const token = await loginViaAPI(CREDENTIALS.admin.email, CREDENTIALS.admin.password);
    await page.goto('/login');
    await setAuthToken(page, token);
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await use(page);
    await page.close();
  },
  token: async ({}, use) => {
    const t = await getAdminToken();
    await use(t);
  },
});

export { expect };
