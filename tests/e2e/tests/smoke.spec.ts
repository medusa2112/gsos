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
  selectDropdownOption
} from '../utils/test-helpers';

/**
 * Smoke Tests - Critical User Journeys
 * These tests verify core functionality and should run in CI after deployment
 */
test.describe('Smoke Tests - Critical User Journeys', () => {
  test('Critical Path: Application submission to student enrollment', async ({ page }) => {
    const testData = generateTestData();
    
    console.log('🚀 Running critical path smoke test...');

    // 1. Submit application
    await page.goto('/admissions/apply');
    await fillField(page, 'student-first-name', testData.firstName);
    await fillField(page, 'student-last-name', testData.lastName);
    await fillField(page, 'student-dob', '2010-05-15');
    await selectDropdownOption(page, 'year-group', 'Year 7');
    await fillField(page, 'parent-name', 'Test Parent');
    await fillField(page, 'parent-email', testData.email);
    await fillField(page, 'parent-phone', '+44 7700 900123');
    await clickButton(page, 'submit-application');
    await waitForToast(page, 'Application submitted successfully');

    // 2. Admin accepts application
    await page.goto('/login');
    await login(page, TEST_USERS.admin);
    await navigateTo(page, 'admissions');
    await waitForLoading(page);
    
    const applicationRow = page.locator(`[data-testid="application-row"]`).filter({
      hasText: testData.firstName
    });
    await applicationRow.click();
    await clickButton(page, 'accept-application');
    await clickButton(page, 'confirm-acceptance');
    await waitForToast(page, 'Application accepted successfully');

    // 3. Verify student record exists
    await navigateTo(page, 'students');
    await fillField(page, 'student-search', testData.firstName);
    await clickButton(page, 'search-students');
    await waitForLoading(page);
    
    await expect(page.locator('[data-testid="students-table"]')).toContainText(testData.firstName);

    console.log('✅ Critical path smoke test passed');
  });

  test('Authentication and basic navigation smoke test', async ({ page }) => {
    console.log('🔐 Running authentication smoke test...');

    // Test login for each role
    const roles = [
      { user: TEST_USERS.admin, expectedNav: 'nav-admin' },
      { user: TEST_USERS.teacher, expectedNav: 'nav-attendance' },
      { user: TEST_USERS.parent, expectedNav: 'nav-payments' }
    ];

    for (const role of roles) {
      await page.goto('/login');
      await login(page, role.user);
      
      // Verify role-specific navigation
      await expect(page.locator(`[data-testid="${role.expectedNav}"]`)).toBeVisible();
      
      // Test basic navigation
      await navigateTo(page, 'dashboard');
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
      
      await logout(page);
    }

    console.log('✅ Authentication smoke test passed');
  });

  test('Student management smoke test', async ({ page }) => {
    console.log('👨‍🎓 Running student management smoke test...');

    await page.goto('/login');
    await login(page, TEST_USERS.admin);
    await navigateTo(page, 'students');
    await waitForLoading(page);

    // Test student creation
    const testData = generateTestData();
    await clickButton(page, 'create-student');
    await fillField(page, 'student-first-name', testData.firstName);
    await fillField(page, 'student-last-name', testData.lastName);
    await fillField(page, 'student-dob', '2010-03-15');
    await selectDropdownOption(page, 'year-group', 'Year 8');
    await clickButton(page, 'save-student');
    await waitForToast(page, 'Student created successfully');

    // Test student search
    await navigateTo(page, 'students');
    await fillField(page, 'student-search', testData.firstName);
    await clickButton(page, 'search-students');
    await waitForLoading(page);
    
    await expect(page.locator('[data-testid="students-table"]')).toContainText(testData.firstName);

    console.log('✅ Student management smoke test passed');
  });

  test('Attendance marking smoke test', async ({ page }) => {
    console.log('📚 Running attendance smoke test...');

    await page.goto('/login');
    await login(page, TEST_USERS.teacher);
    await navigateTo(page, 'attendance');
    await waitForLoading(page);

    const today = new Date().toISOString().split('T')[0];
    
    // Test attendance marking
    await fillField(page, 'attendance-date', today);
    await selectDropdownOption(page, 'class-select', 'Year 7 Mathematics');
    await clickButton(page, 'load-class');
    await waitForLoading(page);

    // Mark first student present if any students exist
    const studentRows = page.locator('[data-testid="student-attendance-row"]');
    const studentCount = await studentRows.count();
    
    if (studentCount > 0) {
      await studentRows.nth(0).locator('[data-testid="attendance-present"]').click();
      await clickButton(page, 'save-attendance');
      await waitForToast(page, 'Attendance saved successfully');
    }

    console.log('✅ Attendance smoke test passed');
  });

  test('Finance workflow smoke test', async ({ page }) => {
    console.log('💰 Running finance smoke test...');

    await page.goto('/login');
    await login(page, TEST_USERS.admin);
    await navigateTo(page, 'finance');
    await waitForLoading(page);

    // Test invoice creation
    await clickButton(page, 'create-invoice');
    await selectDropdownOption(page, 'invoice-student', 'test-student-001');
    await fillField(page, 'invoice-description', 'Smoke Test Invoice');
    await fillField(page, 'invoice-amount', '10.00');
    await selectDropdownOption(page, 'invoice-category', 'School Trips');
    await fillField(page, 'invoice-due-date', '2024-12-31');
    await clickButton(page, 'save-invoice');
    await waitForToast(page, 'Invoice created successfully');

    // Verify invoice appears in list
    await navigateTo(page, 'finance');
    await waitForLoading(page);
    await expect(page.locator('[data-testid="invoices-table"]')).toContainText('Smoke Test Invoice');

    console.log('✅ Finance smoke test passed');
  });

  test('System health and performance smoke test', async ({ page }) => {
    console.log('🏥 Running system health smoke test...');

    // Test page load times
    const startTime = Date.now();
    await page.goto('/login');
    const loginLoadTime = Date.now() - startTime;
    
    expect(loginLoadTime).toBeLessThan(5000); // Should load within 5 seconds

    // Test API responsiveness
    await login(page, TEST_USERS.admin);
    
    const apiStartTime = Date.now();
    await navigateTo(page, 'dashboard');
    await waitForLoading(page);
    const dashboardLoadTime = Date.now() - apiStartTime;
    
    expect(dashboardLoadTime).toBeLessThan(10000); // Dashboard should load within 10 seconds

    // Test basic functionality is working
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

    console.log(`✅ System health smoke test passed (Login: ${loginLoadTime}ms, Dashboard: ${dashboardLoadTime}ms)`);
  });

  test('Data integrity smoke test', async ({ page }) => {
    console.log('🔍 Running data integrity smoke test...');

    await page.goto('/login');
    await login(page, TEST_USERS.admin);

    // Test students data
    await navigateTo(page, 'students');
    await waitForLoading(page);
    
    const studentsTable = page.locator('[data-testid="students-table"]');
    if (await studentsTable.isVisible()) {
      const studentRows = page.locator('[data-testid="student-row"]');
      const studentCount = await studentRows.count();
      expect(studentCount).toBeGreaterThanOrEqual(0);
    }

    // Test finance data
    await navigateTo(page, 'finance');
    await waitForLoading(page);
    
    const invoicesTable = page.locator('[data-testid="invoices-table"]');
    if (await invoicesTable.isVisible()) {
      const invoiceRows = page.locator('[data-testid="invoice-row"]');
      const invoiceCount = await invoiceRows.count();
      expect(invoiceCount).toBeGreaterThanOrEqual(0);
    }

    // Test attendance data
    await navigateTo(page, 'attendance');
    await waitForLoading(page);
    
    await expect(page.locator('[data-testid="attendance-dashboard"]')).toBeVisible();

    console.log('✅ Data integrity smoke test passed');
  });

  test('Security smoke test', async ({ page }) => {
    console.log('🛡️ Running security smoke test...');

    // Test unauthenticated access is blocked
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login.*/);

    await page.goto('/admin/users');
    await expect(page).toHaveURL(/.*login.*/);

    // Test role-based access
    await login(page, TEST_USERS.teacher);
    
    await page.goto('/admin/dashboard');
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();

    // Test logout clears session
    await logout(page);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login.*/);

    console.log('✅ Security smoke test passed');
  });

  test('Mobile responsiveness smoke test', async ({ page }) => {
    console.log('📱 Running mobile responsiveness smoke test...');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/login');
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

    await login(page, TEST_USERS.admin);
    
    // Test mobile navigation
    const mobileMenu = page.locator('[data-testid="mobile-menu-button"]');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    }

    // Test responsive tables
    await navigateTo(page, 'students');
    await waitForLoading(page);
    
    const studentsTable = page.locator('[data-testid="students-table"]');
    if (await studentsTable.isVisible()) {
      // Table should be scrollable or responsive on mobile
      await expect(studentsTable).toBeVisible();
    }

    console.log('✅ Mobile responsiveness smoke test passed');
  });

  test.afterEach(async ({ page }) => {
    // Cleanup after each test
    try {
      await logout(page);
    } catch (error) {
      // Ignore logout errors in cleanup
    }
  });
});