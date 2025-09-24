import { test, expect } from '@playwright/test';
import { 
  login, 
  logout, 
  navigateTo, 
  fillField, 
  clickButton, 
  waitForToast, 
  waitForLoading,
  generateTestData,
  TEST_USERS,
  verifyUrlContains
} from '../utils/test-helpers';

test.describe('Authentication and Authorization', () => {
  test('Role gates prevent unauthorized access - Admin areas', async ({ page }) => {
    console.log('🔒 Testing admin role restrictions...');

    // Test 1: Teacher trying to access admin-only areas
    await page.goto('/login');
    await login(page, TEST_USERS.teacher);

    // Try to access admin dashboard
    await page.goto('/admin/dashboard');
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
    await expect(page.locator('text=Access Denied, text=Unauthorized, text=403')).toBeVisible();

    // Try to access user management
    await page.goto('/admin/users');
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();

    // Try to access system settings
    await page.goto('/admin/settings');
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();

    console.log('✅ Teacher correctly blocked from admin areas');

    await logout(page);

    // Test 2: Parent trying to access admin areas
    await login(page, TEST_USERS.parent);

    await page.goto('/admin/dashboard');
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();

    await page.goto('/admin/finance');
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();

    console.log('✅ Parent correctly blocked from admin areas');

    await logout(page);

    // Test 3: Admin can access all areas
    await login(page, TEST_USERS.admin);

    await page.goto('/admin/dashboard');
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible();

    await page.goto('/admin/users');
    await expect(page.locator('[data-testid="user-management"]')).toBeVisible();

    await page.goto('/admin/settings');
    await expect(page.locator('[data-testid="system-settings"]')).toBeVisible();

    console.log('✅ Admin can access all admin areas');
  });

  test('Role gates prevent unauthorized access - Student data', async ({ page }) => {
    console.log('👨‍🎓 Testing student data access restrictions...');

    // Test 1: Parent can only see their own children's data
    await page.goto('/login');
    await login(page, TEST_USERS.parent);

    await navigateTo(page, 'students');
    await waitForLoading(page);

    // Verify parent can see their linked students
    await expect(page.locator('[data-testid="student-list"]')).toBeVisible();
    
    // Try to access another student's profile directly
    await page.goto('/students/other-student-id');
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();

    console.log('✅ Parent correctly restricted to their children\'s data');

    await logout(page);

    // Test 2: Teacher can see students in their classes only
    await login(page, TEST_USERS.teacher);

    await navigateTo(page, 'students');
    await waitForLoading(page);

    // Verify teacher can see class students
    await expect(page.locator('[data-testid="class-students"]')).toBeVisible();

    // Try to access admin student management
    await page.goto('/admin/students/manage');
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();

    console.log('✅ Teacher correctly restricted to class students');
  });

  test('Role gates prevent unauthorized access - Financial data', async ({ page }) => {
    console.log('💰 Testing financial data access restrictions...');

    // Test 1: Teacher cannot access financial management
    await page.goto('/login');
    await login(page, TEST_USERS.teacher);

    await page.goto('/finance/admin');
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();

    await page.goto('/finance/reports');
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();

    console.log('✅ Teacher blocked from financial admin areas');

    await logout(page);

    // Test 2: Parent can only see their own payment information
    await login(page, TEST_USERS.parent);

    await navigateTo(page, 'payments');
    await waitForLoading(page);

    // Verify parent can see their payments
    await expect(page.locator('[data-testid="parent-payments"]')).toBeVisible();

    // Try to access all payments admin view
    await page.goto('/finance/all-payments');
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();

    console.log('✅ Parent restricted to their own payment data');

    await logout(page);

    // Test 3: Admin can access all financial data
    await login(page, TEST_USERS.admin);

    await page.goto('/finance/admin');
    await expect(page.locator('[data-testid="finance-admin"]')).toBeVisible();

    await page.goto('/finance/reports');
    await expect(page.locator('[data-testid="financial-reports"]')).toBeVisible();

    console.log('✅ Admin can access all financial areas');
  });

  test('Authentication flow and session management', async ({ page }) => {
    console.log('🔐 Testing authentication flow...');

    // Test 1: Unauthenticated user redirected to login
    await page.goto('/dashboard');
    await verifyUrlContains(page, '/login');

    await page.goto('/students');
    await verifyUrlContains(page, '/login');

    console.log('✅ Unauthenticated users redirected to login');

    // Test 2: Successful login redirects to intended page
    await fillField(page, 'email-input', TEST_USERS.admin.email);
    await fillField(page, 'password-input', TEST_USERS.admin.password);
    await clickButton(page, 'login-button');

    await verifyUrlContains(page, '/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

    console.log('✅ Successful login redirects correctly');

    // Test 3: Session persistence
    await page.reload();
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

    console.log('✅ Session persists across page reloads');

    // Test 4: Logout clears session
    await logout(page);
    await verifyUrlContains(page, '/login');

    // Try to access protected page after logout
    await page.goto('/dashboard');
    await verifyUrlContains(page, '/login');

    console.log('✅ Logout clears session correctly');
  });

  test('Invalid login attempts and security measures', async ({ page }) => {
    console.log('🛡️ Testing login security measures...');

    await page.goto('/login');

    // Test 1: Invalid email format
    await fillField(page, 'email-input', 'invalid-email');
    await fillField(page, 'password-input', 'password123');
    await clickButton(page, 'login-button');

    await expect(page.locator('[data-testid="email-error"]')).toContainText('valid email');

    console.log('✅ Invalid email format rejected');

    // Test 2: Wrong password
    await fillField(page, 'email-input', TEST_USERS.admin.email);
    await fillField(page, 'password-input', 'wrongpassword');
    await clickButton(page, 'login-button');

    await expect(page.locator('[data-testid="login-error"]')).toContainText('Invalid credentials');

    console.log('✅ Wrong password rejected');

    // Test 3: Non-existent user
    await fillField(page, 'email-input', 'nonexistent@test.com');
    await fillField(page, 'password-input', 'password123');
    await clickButton(page, 'login-button');

    await expect(page.locator('[data-testid="login-error"]')).toContainText('Invalid credentials');

    console.log('✅ Non-existent user rejected');

    // Test 4: Empty fields
    await fillField(page, 'email-input', '');
    await fillField(page, 'password-input', '');
    await clickButton(page, 'login-button');

    await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="password-error"]')).toBeVisible();

    console.log('✅ Empty fields validation works');
  });

  test('Password reset functionality', async ({ page }) => {
    console.log('🔑 Testing password reset...');

    await page.goto('/login');

    // Click forgot password
    await clickButton(page, 'forgot-password-link');
    await verifyUrlContains(page, '/forgot-password');

    // Test valid email
    await fillField(page, 'reset-email', TEST_USERS.teacher.email);
    await clickButton(page, 'send-reset-link');

    await waitForToast(page, 'Password reset link sent');

    console.log('✅ Password reset link sent for valid email');

    // Test invalid email
    await fillField(page, 'reset-email', 'invalid@test.com');
    await clickButton(page, 'send-reset-link');

    await expect(page.locator('[data-testid="reset-error"]')).toContainText('Email not found');

    console.log('✅ Invalid email handled correctly');
  });

  test('Multi-factor authentication (if enabled)', async ({ page }) => {
    console.log('🔐 Testing MFA (if enabled)...');

    await page.goto('/login');

    // Login with MFA-enabled user (if available)
    await fillField(page, 'email-input', TEST_USERS.admin.email);
    await fillField(page, 'password-input', TEST_USERS.admin.password);
    await clickButton(page, 'login-button');

    // Check if MFA is required
    const mfaRequired = await page.locator('[data-testid="mfa-code-input"]').isVisible();

    if (mfaRequired) {
      console.log('MFA is enabled - testing MFA flow');

      // Test invalid MFA code
      await fillField(page, 'mfa-code-input', '000000');
      await clickButton(page, 'verify-mfa');

      await expect(page.locator('[data-testid="mfa-error"]')).toContainText('Invalid code');

      // For testing, we'd need a way to get valid MFA codes
      // This would typically involve test-specific MFA setup
      console.log('✅ Invalid MFA code rejected');
    } else {
      console.log('ℹ️ MFA not enabled for test user');
    }
  });

  test('Role-based navigation menu visibility', async ({ page }) => {
    console.log('🧭 Testing role-based navigation...');

    // Test 1: Admin sees all menu items
    await page.goto('/login');
    await login(page, TEST_USERS.admin);

    await expect(page.locator('[data-testid="nav-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-students"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-attendance"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-finance"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-admin"]')).toBeVisible();

    console.log('✅ Admin sees all navigation items');

    await logout(page);

    // Test 2: Teacher sees limited menu items
    await login(page, TEST_USERS.teacher);

    await expect(page.locator('[data-testid="nav-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-students"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-attendance"]')).toBeVisible();
    
    // Teacher should not see admin or full finance menu
    await expect(page.locator('[data-testid="nav-admin"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="nav-finance-admin"]')).not.toBeVisible();

    console.log('✅ Teacher sees appropriate navigation items');

    await logout(page);

    // Test 3: Parent sees minimal menu items
    await login(page, TEST_USERS.parent);

    await expect(page.locator('[data-testid="nav-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-payments"]')).toBeVisible();
    
    // Parent should not see admin, attendance management, or student management
    await expect(page.locator('[data-testid="nav-admin"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="nav-attendance-admin"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="nav-student-admin"]')).not.toBeVisible();

    console.log('✅ Parent sees appropriate navigation items');
  });

  test('API endpoint authorization', async ({ page }) => {
    console.log('🔌 Testing API endpoint authorization...');

    // Test unauthorized API access
    const response = await page.request.get('/api/admin/users');
    expect(response.status()).toBe(401);

    console.log('✅ Unauthorized API access blocked');

    // Login and test authorized access
    await page.goto('/login');
    await login(page, TEST_USERS.admin);

    // Test authorized API access
    const authorizedResponse = await page.request.get('/api/admin/users');
    expect(authorizedResponse.status()).toBe(200);

    console.log('✅ Authorized API access allowed');

    // Test role-based API restrictions
    await logout(page);
    await login(page, TEST_USERS.teacher);

    // Teacher should not access admin endpoints
    const teacherResponse = await page.request.get('/api/admin/users');
    expect(teacherResponse.status()).toBe(403);

    console.log('✅ Role-based API restrictions work');
  });

  test.afterEach(async ({ page }) => {
    // Logout after each test
    try {
      await logout(page);
    } catch (error) {
      // Ignore logout errors in cleanup
    }
  });
});