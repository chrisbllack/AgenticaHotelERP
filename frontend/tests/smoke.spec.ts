import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=INFINEON PMS')).toBeVisible();
    await expect(page.locator('text=Sign In')).toBeVisible();
  });

  test('should show server settings toggle', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Server Settings');
    await expect(page.locator('text=Server IP Address')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Sign In")');
    // Should show error or prevent submission
  });
});

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login first (would need actual API or mock in real tests)
    await page.goto('/');
  });

  test('should show login form when not authenticated', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('should have sidebar navigation links', async ({ page }) => {
    await page.goto('/');
    // After login, sidebar should be visible
    // In real tests, mock the auth state
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.locator('text=INFINEON PMS')).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await expect(page.locator('text=INFINEON PMS')).toBeVisible();
  });
});

test.describe('Health Check', () => {
  test('should return healthy status', async ({ request }) => {
    const response = await request.get('http://localhost:8080/api/v1/health');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe('healthy');
  });
});
