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
  verifyTableContains,
  fillDateInput,
  selectDropdownOption
} from '../utils/test-helpers';

test.describe('Admissions Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure clean state
    await page.goto('/');
  });

  test('Complete admissions workflow: submit form → admin accepts → student record exists', async ({ page }) => {
    const testData = generateTestData();
    const applicationData = {
      firstName: testData.firstName,
      lastName: testData.lastName,
      dateOfBirth: '2010-05-15',
      yearGroup: 'Year 7',
      parentEmail: testData.email,
      parentName: 'Test Parent',
      parentPhone: '+44 7700 900123',
      address: '123 Test Street, Test City, TC1 2AB',
      previousSchool: 'Test Primary School',
      medicalInfo: 'No known allergies',
      emergencyContact: 'Emergency Contact Name',
      emergencyPhone: '+44 7700 900456'
    };

    // Step 1: Submit admission application
    console.log('📝 Step 1: Submitting admission application...');
    
    await page.goto('/admissions/apply');
    
    // Fill student information
    await fillField(page, 'student-first-name', applicationData.firstName);
    await fillField(page, 'student-last-name', applicationData.lastName);
    await fillDateInput(page, 'student-dob', applicationData.dateOfBirth);
    await selectDropdownOption(page, 'year-group', applicationData.yearGroup);
    
    // Fill parent/guardian information
    await fillField(page, 'parent-name', applicationData.parentName);
    await fillField(page, 'parent-email', applicationData.parentEmail);
    await fillField(page, 'parent-phone', applicationData.parentPhone);
    
    // Fill additional information
    await fillField(page, 'address', applicationData.address);
    await fillField(page, 'previous-school', applicationData.previousSchool);
    await fillField(page, 'medical-info', applicationData.medicalInfo);
    await fillField(page, 'emergency-contact', applicationData.emergencyContact);
    await fillField(page, 'emergency-phone', applicationData.emergencyPhone);
    
    // Submit application
    await clickButton(page, 'submit-application');
    
    // Verify submission success
    await waitForToast(page, 'Application submitted successfully');
    
    // Get application reference number
    const referenceElement = await page.locator('[data-testid="application-reference"]');
    await expect(referenceElement).toBeVisible();
    const applicationReference = await referenceElement.textContent();
    
    console.log(`✅ Application submitted with reference: ${applicationReference}`);

    // Step 2: Admin reviews and accepts application
    console.log('👨‍💼 Step 2: Admin reviewing and accepting application...');
    
    // Logout if logged in and login as admin
    await page.goto('/login');
    await login(page, TEST_USERS.admin);
    
    // Navigate to admissions management
    await navigateTo(page, 'admissions');
    await waitForLoading(page);
    
    // Find the submitted application
    const applicationRow = page.locator(`[data-testid="application-row"]`).filter({
      hasText: applicationData.firstName
    });
    await expect(applicationRow).toBeVisible();
    
    // Click on application to view details
    await applicationRow.click();
    await waitForLoading(page);
    
    // Verify application details
    await expect(page.locator('[data-testid="application-details"]')).toContainText(applicationData.firstName);
    await expect(page.locator('[data-testid="application-details"]')).toContainText(applicationData.lastName);
    await expect(page.locator('[data-testid="application-details"]')).toContainText(applicationData.parentEmail);
    
    // Accept the application
    await clickButton(page, 'accept-application');
    
    // Confirm acceptance
    await clickButton(page, 'confirm-acceptance');
    
    // Verify acceptance success
    await waitForToast(page, 'Application accepted successfully');
    
    console.log('✅ Application accepted by admin');

    // Step 3: Verify student record exists
    console.log('👨‍🎓 Step 3: Verifying student record creation...');
    
    // Navigate to students section
    await navigateTo(page, 'students');
    await waitForLoading(page);
    
    // Search for the new student
    await fillField(page, 'student-search', applicationData.firstName);
    await clickButton(page, 'search-students');
    await waitForLoading(page);
    
    // Verify student appears in the list
    await verifyTableContains(page, 'students-table', {
      'first-name': applicationData.firstName,
      'last-name': applicationData.lastName,
      'year-group': applicationData.yearGroup
    });
    
    // Click on student to view full record
    const studentRow = page.locator(`[data-testid="student-row"]`).filter({
      hasText: applicationData.firstName
    });
    await studentRow.click();
    await waitForLoading(page);
    
    // Verify complete student record
    await expect(page.locator('[data-testid="student-profile"]')).toBeVisible();
    await expect(page.locator('[data-testid="student-name"]')).toContainText(`${applicationData.firstName} ${applicationData.lastName}`);
    await expect(page.locator('[data-testid="student-year-group"]')).toContainText(applicationData.yearGroup);
    await expect(page.locator('[data-testid="student-dob"]')).toContainText('15/05/2010');
    
    // Verify guardian information is linked
    await expect(page.locator('[data-testid="guardian-info"]')).toContainText(applicationData.parentName);
    await expect(page.locator('[data-testid="guardian-email"]')).toContainText(applicationData.parentEmail);
    
    console.log('✅ Student record created and verified');
    
    // Verify student status is active
    await expect(page.locator('[data-testid="student-status"]')).toContainText('Active');
    
    console.log('🎉 Complete admissions workflow test passed!');
  });

  test('Admin can reject application with reason', async ({ page }) => {
    const testData = generateTestData();
    
    // Submit a basic application first
    await page.goto('/admissions/apply');
    await fillField(page, 'student-first-name', testData.firstName);
    await fillField(page, 'student-last-name', testData.lastName);
    await fillDateInput(page, 'student-dob', '2010-05-15');
    await selectDropdownOption(page, 'year-group', 'Year 7');
    await fillField(page, 'parent-name', 'Test Parent');
    await fillField(page, 'parent-email', testData.email);
    await fillField(page, 'parent-phone', '+44 7700 900123');
    await clickButton(page, 'submit-application');
    await waitForToast(page, 'Application submitted successfully');
    
    // Login as admin
    await page.goto('/login');
    await login(page, TEST_USERS.admin);
    
    // Navigate to admissions and find application
    await navigateTo(page, 'admissions');
    await waitForLoading(page);
    
    const applicationRow = page.locator(`[data-testid="application-row"]`).filter({
      hasText: testData.firstName
    });
    await applicationRow.click();
    
    // Reject the application
    await clickButton(page, 'reject-application');
    await fillField(page, 'rejection-reason', 'Insufficient documentation provided');
    await clickButton(page, 'confirm-rejection');
    
    // Verify rejection
    await waitForToast(page, 'Application rejected');
    await expect(page.locator('[data-testid="application-status"]')).toContainText('Rejected');
  });

  test('Application form validation works correctly', async ({ page }) => {
    await page.goto('/admissions/apply');
    
    // Try to submit empty form
    await clickButton(page, 'submit-application');
    
    // Verify validation errors
    await expect(page.locator('[data-testid="error-student-first-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-student-last-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-parent-email"]')).toBeVisible();
    
    // Fill invalid email
    await fillField(page, 'parent-email', 'invalid-email');
    await clickButton(page, 'submit-application');
    
    // Verify email validation
    await expect(page.locator('[data-testid="error-parent-email"]')).toContainText('valid email');
  });

  test.afterEach(async ({ page }) => {
    // Logout if logged in
    try {
      await logout(page);
    } catch (error) {
      // Ignore logout errors in cleanup
    }
  });
});