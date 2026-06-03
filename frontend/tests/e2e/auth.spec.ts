/**
 * Assignment 4 Bronze: E2E tests for login/register functionality
 * Tests both frontend and backend integration.
 *
 * Run: npx playwright test tests/e2e/auth.spec.ts
 * (Requires backend running on localhost:3001 and frontend on localhost:5173)
 */
import { test, expect, type Page } from '@playwright/test';

const ADMIN_EMAIL    = 'admin@pharmaconnect.ro';
const ADMIN_PASS     = 'admin123';
const USER_EMAIL     = 'user@pharmaconnect.ro';
const USER_PASS      = 'user123';
const INVALID_EMAIL  = 'nonexistent@test.com';
const INVALID_PASS   = 'wrongpassword';

// ── Helpers ────────────────────────────────────────────────────────────────────

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"], input[type="email"]', email);
  await page.fill('[data-testid="password-input"], input[type="password"]', password);
  await page.click('[data-testid="login-btn"], button[type="submit"]');
}

// ── Login Tests ────────────────────────────────────────────────────────────────

test.describe('Login', () => {
  test('admin can login and sees admin panel link', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASS);
    await expect(page).toHaveURL(/dashboard|admin/, { timeout: 5000 });
    // Admin should see the admin panel link
    const adminLink = page.locator('a[href*="admin"], text=Admin');
    await expect(adminLink.first()).toBeVisible({ timeout: 5000 });
  });

  test('normal user can login and does NOT see admin panel', async ({ page }) => {
    await loginAs(page, USER_EMAIL, USER_PASS);
    await expect(page).toHaveURL(/dashboard/, { timeout: 5000 });
    // Normal user should NOT have admin panel access
    const adminLink = page.locator('a[href="/admin"]');
    await expect(adminLink).toHaveCount(0);
  });

  test('invalid credentials show error message', async ({ page }) => {
    await loginAs(page, INVALID_EMAIL, INVALID_PASS);
    // Should stay on login page or show error
    const error = page.locator('text=/invalid|error|incorrect|wrong/i');
    await expect(error.first()).toBeVisible({ timeout: 5000 });
  });

  test('empty form shows validation error', async ({ page }) => {
    await page.goto('/login');
    await page.click('button[type="submit"]');
    // Should show validation error or not navigate
    await expect(page).toHaveURL(/login/, { timeout: 3000 });
  });

  test('JWT token is stored after login', async ({ page }) => {
    await loginAs(page, USER_EMAIL, USER_PASS);
    await expect(page).toHaveURL(/dashboard/, { timeout: 5000 });

    const auth = await page.evaluate(() => localStorage.getItem('auth'));
    expect(auth).not.toBeNull();
    const parsed = JSON.parse(auth!);
    expect(parsed.token).toBeTruthy();
    expect(parsed.role).toBe('USER');
  });
});

// ── Register Tests ──────────────────────────────────────────────────────────────

test.describe('Register', () => {
  const uniqueEmail = `test_${Date.now()}@pharmaconnect.ro`;
  const username    = `testuser_${Date.now()}`;

  test('new user can register successfully', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input[type="email"], [data-testid="email-input"]', uniqueEmail);
    await page.fill('input[placeholder*="sername"], [data-testid="username-input"]', username);
    const passFields = page.locator('input[type="password"]');
    await passFields.nth(0).fill('TestPass123!');
    if (await passFields.count() > 1) {
      await passFields.nth(1).fill('TestPass123!');
    }
    await page.click('button[type="submit"]');
    // After register should redirect to login or dashboard
    await expect(page).toHaveURL(/login|dashboard/, { timeout: 8000 });
  });

  test('duplicate email shows error', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input[type="email"], [data-testid="email-input"]', ADMIN_EMAIL);
    await page.fill('input[placeholder*="sername"], [data-testid="username-input"]', 'someuser');
    const passField = page.locator('input[type="password"]').first();
    await passField.fill('somepass123');
    await page.click('button[type="submit"]');
    const error = page.locator('text=/already|exists|taken|use/i');
    await expect(error.first()).toBeVisible({ timeout: 5000 });
  });
});

// ── Session/Token Tests ─────────────────────────────────────────────────────────

test.describe('Session management', () => {
  test('logout clears token from storage', async ({ page }) => {
    await loginAs(page, USER_EMAIL, USER_PASS);
    await expect(page).toHaveURL(/dashboard/, { timeout: 5000 });

    // Click logout
    const logoutBtn = page.locator('button:has-text("Logout"), a:has-text("Logout"), [data-testid="logout-btn"]');
    await logoutBtn.first().click();

    const auth = await page.evaluate(() => localStorage.getItem('auth'));
    expect(auth).toBeNull();
    await expect(page).toHaveURL(/login|landing|\/$/, { timeout: 5000 });
  });

  test('unauthenticated user is redirected to login from protected routes', async ({ page }) => {
    // Clear any stored auth
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('auth'));

    await page.goto('/dashboard');
    // Should redirect to login or landing
    await expect(page).toHaveURL(/login|landing|\/$/, { timeout: 5000 });
  });

  test('non-admin user redirected from /admin route', async ({ page }) => {
    await loginAs(page, USER_EMAIL, USER_PASS);
    await expect(page).toHaveURL(/dashboard/, { timeout: 5000 });

    await page.goto('/admin');
    // Should redirect away from admin panel
    await expect(page).toHaveURL(/dashboard/, { timeout: 5000 });
  });
});

// ── Backend API Tests (direct fetch) ───────────────────────────────────────────

test.describe('Auth API (backend)', () => {
  const API = 'http://localhost:3001';

  test('POST /auth/login returns token for valid credentials', async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, {
      data: { email: USER_EMAIL, password: USER_PASS },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.token).toBeTruthy();
    expect(body.role).toBe('USER');
    expect(body.userId).toBeGreaterThan(0);
  });

  test('POST /auth/login returns 401 for invalid credentials', async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, {
      data: { email: INVALID_EMAIL, password: INVALID_PASS },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  test('POST /auth/register creates a new user', async ({ request }) => {
    const email = `e2e_${Date.now()}@test.ro`;
    const res = await request.post(`${API}/auth/register`, {
      data: { email, username: `user_${Date.now()}`, password: 'TestPass123!' },
    });
    expect(res.status()).toBe(201);
  });

  test('POST /auth/register rejects duplicate email', async ({ request }) => {
    const res = await request.post(`${API}/auth/register`, {
      data: { email: ADMIN_EMAIL, username: 'dup', password: 'any123' },
    });
    expect(res.status()).toBe(400);
  });

  test('Protected route returns data with valid token', async ({ request }) => {
    const loginRes = await request.post(`${API}/auth/login`, {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASS },
    });
    const { token } = await loginRes.json();

    const res = await request.get(`${API}/prescriptions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
  });

  test('X-Refreshed-Token header is present on authenticated requests', async ({ request }) => {
    const loginRes = await request.post(`${API}/auth/login`, {
      data: { email: USER_EMAIL, password: USER_PASS },
    });
    const { token } = await loginRes.json();

    const res = await request.get(`${API}/prescriptions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // Server should return a refreshed token for sliding-window session
    const refreshed = res.headers()['x-refreshed-token'];
    expect(refreshed).toBeTruthy();
  });

  test('Silver: POST /auth/forgot-password returns reset code', async ({ request }) => {
    const res = await request.post(`${API}/auth/forgot-password`, {
      data: { email: USER_EMAIL },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.resetCode).toMatch(/^\d{6}$/);
  });

  test('Silver: POST /auth/reset-password resets password', async ({ request }) => {
    // Step 1: get reset code
    const forgotRes = await request.post(`${API}/auth/forgot-password`, {
      data: { email: USER_EMAIL },
    });
    const { resetCode } = await forgotRes.json();

    // Step 2: reset to original password
    const resetRes = await request.post(`${API}/auth/reset-password`, {
      data: { email: USER_EMAIL, resetCode, newPassword: USER_PASS },
    });
    expect(resetRes.ok()).toBeTruthy();

    // Step 3: login with new password works
    const loginRes = await request.post(`${API}/auth/login`, {
      data: { email: USER_EMAIL, password: USER_PASS },
    });
    expect(loginRes.ok()).toBeTruthy();
  });
});
