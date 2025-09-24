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
  TEST_STUDENTS,
  selectDropdownOption,
  waitForElement
} from '../utils/test-helpers';

test.describe('Attendance Management', () => {
  test('Complete attendance workflow: teacher marks class → student sees day status', async ({ page }) => {
    const today = new Date().toISOString().split('T')[0];
    const className = 'Year 7 Mathematics';
    
    console.log('📚 Step 1: Teacher marking class attendance...');

    // Login as teacher
    await page.goto('/login');
    await login(page, TEST_USERS.teacher);
    
    // Navigate to attendance
    await navigateTo(page, 'attendance');
    await waitForLoading(page);

    // Select today's date
    await fillField(page, 'attendance-date', today);
    
    // Select class
    await selectDropdownOption(page, 'class-select', className);
    await clickButton(page, 'load-class');
    await waitForLoading(page);

    // Verify class roster is loaded
    await expect(page.locator('[data-testid="class-roster"]')).toBeVisible();
    
    // Mark attendance for students
    const studentRows = page.locator('[data-testid="student-attendance-row"]');
    const studentCount = await studentRows.count();
    
    console.log(`📝 Marking attendance for ${studentCount} students...`);

    // Mark first student as present
    if (studentCount > 0) {
      await studentRows.nth(0).locator('[data-testid="attendance-present"]').click();
    }
    
    // Mark second student as late
    if (studentCount > 1) {
      await studentRows.nth(1).locator('[data-testid="attendance-late"]').click();
      await fillField(page, 'late-reason-1', 'Traffic delay');
    }
    
    // Mark third student as absent
    if (studentCount > 2) {
      await studentRows.nth(2).locator('[data-testid="attendance-absent"]').click();
      await fillField(page, 'absence-reason-2', 'Illness');
    }

    // Save attendance
    await clickButton(page, 'save-attendance');
    await waitForToast(page, 'Attendance saved successfully');
    
    console.log('✅ Teacher attendance marking completed');

    // Logout teacher
    await logout(page);

    console.log('👨‍🎓 Step 2: Student checking attendance status...');

    // Login as parent to check student attendance
    await login(page, TEST_USERS.parent);
    
    // Navigate to student dashboard/attendance
    await navigateTo(page, 'attendance');
    await waitForLoading(page);

    // Select today's date
    await fillField(page, 'view-date', today);
    await clickButton(page, 'load-attendance');
    await waitForLoading(page);

    // Verify attendance status is displayed
    await expect(page.locator('[data-testid="attendance-summary"]')).toBeVisible();
    
    // Check for attendance records
    const attendanceRecords = page.locator('[data-testid="attendance-record"]');
    const recordCount = await attendanceRecords.count();
    
    if (recordCount > 0) {
      // Verify attendance status is shown
      await expect(attendanceRecords.first()).toContainText(className);
      
      // Check for status indicators
      const statusElements = page.locator('[data-testid="attendance-status"]');
      await expect(statusElements.first()).toBeVisible();
    }

    console.log('✅ Student attendance status verified');
    console.log('🎉 Complete attendance workflow test passed!');
  });

  test('Teacher can mark attendance for multiple periods', async ({ page }) => {
    const today = new Date().toISOString().split('T')[0];
    
    console.log('📚 Testing multiple period attendance...');

    await page.goto('/login');
    await login(page, TEST_USERS.teacher);
    await navigateTo(page, 'attendance');
    await waitForLoading(page);

    // Mark attendance for Period 1
    await selectDropdownOption(page, 'period-select', 'Period 1');
    await selectDropdownOption(page, 'class-select', 'Year 7 Mathematics');
    await fillField(page, 'attendance-date', today);
    await clickButton(page, 'load-class');
    await waitForLoading(page);

    // Mark some students present
    const period1Students = page.locator('[data-testid="student-attendance-row"]');
    const period1Count = await period1Students.count();
    
    for (let i = 0; i < Math.min(period1Count, 3); i++) {
      await period1Students.nth(i).locator('[data-testid="attendance-present"]').click();
    }
    
    await clickButton(page, 'save-attendance');
    await waitForToast(page, 'Attendance saved successfully');

    // Mark attendance for Period 2
    await selectDropdownOption(page, 'period-select', 'Period 2');
    await selectDropdownOption(page, 'class-select', 'Year 8 English');
    await clickButton(page, 'load-class');
    await waitForLoading(page);

    const period2Students = page.locator('[data-testid="student-attendance-row"]');
    const period2Count = await period2Students.count();
    
    for (let i = 0; i < Math.min(period2Count, 2); i++) {
      await period2Students.nth(i).locator('[data-testid="attendance-present"]').click();
    }
    
    await clickButton(page, 'save-attendance');
    await waitForToast(page, 'Attendance saved successfully');

    console.log('✅ Multiple period attendance completed');
  });

  test('Attendance statistics and reports', async ({ page }) => {
    console.log('📊 Testing attendance statistics...');

    await page.goto('/login');
    await login(page, TEST_USERS.admin);
    await navigateTo(page, 'attendance');
    await waitForLoading(page);

    // Navigate to attendance reports
    await clickButton(page, 'attendance-reports');
    await waitForLoading(page);

    // Generate daily attendance report
    const today = new Date().toISOString().split('T')[0];
    await fillField(page, 'report-date', today);
    await clickButton(page, 'generate-daily-report');
    await waitForLoading(page);

    // Verify report is generated
    await expect(page.locator('[data-testid="attendance-report"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-students"]')).toBeVisible();
    await expect(page.locator('[data-testid="present-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="absent-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="late-count"]')).toBeVisible();

    // Test weekly report
    await clickButton(page, 'weekly-report-tab');
    await clickButton(page, 'generate-weekly-report');
    await waitForLoading(page);

    await expect(page.locator('[data-testid="weekly-attendance-chart"]')).toBeVisible();

    console.log('✅ Attendance reports verified');
  });

  test('Bulk attendance marking', async ({ page }) => {
    const today = new Date().toISOString().split('T')[0];
    
    console.log('📦 Testing bulk attendance marking...');

    await page.goto('/login');
    await login(page, TEST_USERS.teacher);
    await navigateTo(page, 'attendance');
    await waitForLoading(page);

    // Load a class
    await selectDropdownOption(page, 'class-select', 'Year 7 Mathematics');
    await fillField(page, 'attendance-date', today);
    await clickButton(page, 'load-class');
    await waitForLoading(page);

    // Use bulk actions
    await clickButton(page, 'select-all-students');
    await clickButton(page, 'bulk-mark-present');
    
    // Verify all students are marked present
    const presentButtons = page.locator('[data-testid="attendance-present"]:checked');
    const studentRows = page.locator('[data-testid="student-attendance-row"]');
    const totalStudents = await studentRows.count();
    const presentCount = await presentButtons.count();
    
    expect(presentCount).toBe(totalStudents);

    await clickButton(page, 'save-attendance');
    await waitForToast(page, 'Attendance saved successfully');

    console.log('✅ Bulk attendance marking completed');
  });

  test('Late arrival and early departure tracking', async ({ page }) => {
    const today = new Date().toISOString().split('T')[0];
    
    console.log('⏰ Testing late arrival and early departure...');

    await page.goto('/login');
    await login(page, TEST_USERS.teacher);
    await navigateTo(page, 'attendance');
    await waitForLoading(page);

    // Load class
    await selectDropdownOption(page, 'class-select', 'Year 7 Mathematics');
    await fillField(page, 'attendance-date', today);
    await clickButton(page, 'load-class');
    await waitForLoading(page);

    const studentRows = page.locator('[data-testid="student-attendance-row"]');
    const studentCount = await studentRows.count();

    if (studentCount > 0) {
      // Mark student as late with time
      await studentRows.nth(0).locator('[data-testid="attendance-late"]').click();
      await fillField(page, 'late-time-0', '09:15');
      await fillField(page, 'late-reason-0', 'Medical appointment');

      // Mark student for early departure
      if (studentCount > 1) {
        await studentRows.nth(1).locator('[data-testid="attendance-present"]').click();
        await studentRows.nth(1).locator('[data-testid="early-departure"]').check();
        await fillField(page, 'departure-time-1', '14:30');
        await fillField(page, 'departure-reason-1', 'Family emergency');
      }

      await clickButton(page, 'save-attendance');
      await waitForToast(page, 'Attendance saved successfully');

      // Verify time tracking
      await expect(page.locator('[data-testid="late-time-0"]')).toHaveValue('09:15');
      if (studentCount > 1) {
        await expect(page.locator('[data-testid="departure-time-1"]')).toHaveValue('14:30');
      }
    }

    console.log('✅ Late arrival and early departure tracking verified');
  });

  test('Attendance notifications and alerts', async ({ page }) => {
    console.log('🔔 Testing attendance notifications...');

    await page.goto('/login');
    await login(page, TEST_USERS.admin);
    await navigateTo(page, 'attendance');
    await waitForLoading(page);

    // Navigate to attendance alerts
    await clickButton(page, 'attendance-alerts');
    await waitForLoading(page);

    // Check for absence alerts
    await expect(page.locator('[data-testid="absence-alerts"]')).toBeVisible();
    
    // Check for chronic absenteeism alerts
    const chronicAbsenceAlerts = page.locator('[data-testid="chronic-absence-alert"]');
    const alertCount = await chronicAbsenceAlerts.count();
    
    console.log(`📊 Found ${alertCount} chronic absence alerts`);

    // Test notification settings
    await clickButton(page, 'notification-settings');
    await waitForElement(page, 'notification-preferences');

    // Verify notification options
    await expect(page.locator('[data-testid="email-notifications"]')).toBeVisible();
    await expect(page.locator('[data-testid="sms-notifications"]')).toBeVisible();
    await expect(page.locator('[data-testid="absence-threshold"]')).toBeVisible();

    console.log('✅ Attendance notifications verified');
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