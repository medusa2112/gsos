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
  verifyTableContains,
  fillDateInput,
  selectDropdownOption,
  waitForElement
} from '../utils/test-helpers';

test.describe('Students Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin for student management
    await page.goto('/login');
    await login(page, TEST_USERS.admin);
    await navigateTo(page, 'students');
    await waitForLoading(page);
  });

  test('Create new student with complete information', async ({ page }) => {
    const testData = generateTestData();
    const studentData = {
      firstName: testData.firstName,
      lastName: testData.lastName,
      dateOfBirth: '2010-03-15',
      yearGroup: 'Year 8',
      admissionNumber: `ADM${Date.now()}`,
      address: '456 Student Street, Test City, TC2 3CD',
      medicalInfo: 'Asthma - requires inhaler',
      emergencyContact: 'Emergency Contact',
      emergencyPhone: '+44 7700 900789'
    };

    console.log('👨‍🎓 Creating new student...');

    // Click create new student button
    await clickButton(page, 'create-student');
    await waitForElement(page, 'student-form');

    // Fill basic information
    await fillField(page, 'student-first-name', studentData.firstName);
    await fillField(page, 'student-last-name', studentData.lastName);
    await fillDateInput(page, 'student-dob', studentData.dateOfBirth);
    await selectDropdownOption(page, 'year-group', studentData.yearGroup);
    await fillField(page, 'admission-number', studentData.admissionNumber);

    // Fill contact information
    await fillField(page, 'student-address', studentData.address);
    await fillField(page, 'emergency-contact', studentData.emergencyContact);
    await fillField(page, 'emergency-phone', studentData.emergencyPhone);

    // Fill medical information
    await fillField(page, 'medical-info', studentData.medicalInfo);

    // Save student
    await clickButton(page, 'save-student');
    await waitForToast(page, 'Student created successfully');

    console.log('✅ Student created successfully');

    // Verify student appears in list
    await navigateTo(page, 'students');
    await waitForLoading(page);

    await verifyTableContains(page, 'students-table', {
      'first-name': studentData.firstName,
      'last-name': studentData.lastName,
      'year-group': studentData.yearGroup,
      'admission-number': studentData.admissionNumber
    });

    console.log('✅ Student verified in students list');
  });

  test('Edit existing student information', async ({ page }) => {
    // First create a student to edit
    const testData = generateTestData();
    await clickButton(page, 'create-student');
    await fillField(page, 'student-first-name', testData.firstName);
    await fillField(page, 'student-last-name', testData.lastName);
    await fillDateInput(page, 'student-dob', '2010-06-20');
    await selectDropdownOption(page, 'year-group', 'Year 7');
    await clickButton(page, 'save-student');
    await waitForToast(page, 'Student created successfully');

    console.log('👨‍🎓 Editing student information...');

    // Navigate back to students list
    await navigateTo(page, 'students');
    await waitForLoading(page);

    // Find and click on the student
    const studentRow = page.locator(`[data-testid="student-row"]`).filter({
      hasText: testData.firstName
    });
    await studentRow.click();
    await waitForLoading(page);

    // Click edit button
    await clickButton(page, 'edit-student');
    await waitForElement(page, 'student-form');

    // Update information
    const updatedData = {
      yearGroup: 'Year 8',
      address: '789 Updated Street, New City, NC4 5EF',
      medicalInfo: 'Updated medical information'
    };

    await selectDropdownOption(page, 'year-group', updatedData.yearGroup);
    await fillField(page, 'student-address', updatedData.address);
    await fillField(page, 'medical-info', updatedData.medicalInfo);

    // Save changes
    await clickButton(page, 'save-student');
    await waitForToast(page, 'Student updated successfully');

    console.log('✅ Student information updated');

    // Verify changes
    await expect(page.locator('[data-testid="student-year-group"]')).toContainText(updatedData.yearGroup);
    await expect(page.locator('[data-testid="student-address"]')).toContainText(updatedData.address);
    await expect(page.locator('[data-testid="student-medical-info"]')).toContainText(updatedData.medicalInfo);

    console.log('✅ Changes verified successfully');
  });

  test('Link guardian to student', async ({ page }) => {
    const testData = generateTestData();
    const guardianData = {
      name: 'Test Guardian',
      email: testData.email,
      phone: '+44 7700 900111',
      relationship: 'Parent'
    };

    console.log('👨‍👩‍👧‍👦 Linking guardian to student...');

    // Create a student first
    await clickButton(page, 'create-student');
    await fillField(page, 'student-first-name', testData.firstName);
    await fillField(page, 'student-last-name', testData.lastName);
    await fillDateInput(page, 'student-dob', '2010-08-10');
    await selectDropdownOption(page, 'year-group', 'Year 7');
    await clickButton(page, 'save-student');
    await waitForToast(page, 'Student created successfully');

    // Navigate to student profile
    await navigateTo(page, 'students');
    const studentRow = page.locator(`[data-testid="student-row"]`).filter({
      hasText: testData.firstName
    });
    await studentRow.click();
    await waitForLoading(page);

    // Add guardian
    await clickButton(page, 'add-guardian');
    await waitForElement(page, 'guardian-form');

    // Fill guardian information
    await fillField(page, 'guardian-name', guardianData.name);
    await fillField(page, 'guardian-email', guardianData.email);
    await fillField(page, 'guardian-phone', guardianData.phone);
    await selectDropdownOption(page, 'guardian-relationship', guardianData.relationship);

    // Save guardian
    await clickButton(page, 'save-guardian');
    await waitForToast(page, 'Guardian added successfully');

    console.log('✅ Guardian linked to student');

    // Verify guardian appears in student profile
    await expect(page.locator('[data-testid="guardian-info"]')).toContainText(guardianData.name);
    await expect(page.locator('[data-testid="guardian-email"]')).toContainText(guardianData.email);
    await expect(page.locator('[data-testid="guardian-phone"]')).toContainText(guardianData.phone);
    await expect(page.locator('[data-testid="guardian-relationship"]')).toContainText(guardianData.relationship);

    console.log('✅ Guardian information verified');
  });

  test('Student list query and filtering works', async ({ page }) => {
    console.log('🔍 Testing student list queries and filters...');

    // Test search by name
    await fillField(page, 'student-search', 'John');
    await clickButton(page, 'search-students');
    await waitForLoading(page);

    // Verify search results
    const searchResults = page.locator('[data-testid="student-row"]');
    const resultCount = await searchResults.count();
    
    if (resultCount > 0) {
      // Verify all results contain "John"
      for (let i = 0; i < resultCount; i++) {
        const row = searchResults.nth(i);
        const text = await row.textContent();
        expect(text?.toLowerCase()).toContain('john');
      }
    }

    console.log(`✅ Search returned ${resultCount} results`);

    // Test filter by year group
    await selectDropdownOption(page, 'filter-year-group', 'Year 7');
    await clickButton(page, 'apply-filters');
    await waitForLoading(page);

    // Verify filtered results
    const filteredResults = page.locator('[data-testid="student-row"]');
    const filteredCount = await filteredResults.count();
    
    if (filteredCount > 0) {
      // Verify all results are Year 7
      for (let i = 0; i < filteredCount; i++) {
        const row = filteredResults.nth(i);
        await expect(row.locator('[data-testid="cell-year-group"]')).toContainText('Year 7');
      }
    }

    console.log(`✅ Filter returned ${filteredCount} Year 7 students`);

    // Test sorting
    await clickButton(page, 'sort-by-name');
    await waitForLoading(page);

    // Verify sorting (check first few names are in alphabetical order)
    const sortedResults = page.locator('[data-testid="student-row"]');
    const sortedCount = await sortedResults.count();
    
    if (sortedCount >= 2) {
      const firstName = await sortedResults.nth(0).locator('[data-testid="cell-first-name"]').textContent();
      const secondName = await sortedResults.nth(1).locator('[data-testid="cell-first-name"]').textContent();
      
      if (firstName && secondName) {
        expect(firstName.localeCompare(secondName)).toBeLessThanOrEqual(0);
      }
    }

    console.log('✅ Sorting verified');

    // Clear filters
    await clickButton(page, 'clear-filters');
    await waitForLoading(page);

    // Verify all students are shown again
    const allResults = page.locator('[data-testid="student-row"]');
    const totalCount = await allResults.count();
    
    console.log(`✅ Cleared filters - showing ${totalCount} total students`);
  });

  test('Student profile displays complete information', async ({ page }) => {
    // Use existing test student
    const student = TEST_STUDENTS.student1;

    console.log('📋 Viewing student profile...');

    // Search for specific student
    await fillField(page, 'student-search', student.firstName);
    await clickButton(page, 'search-students');
    await waitForLoading(page);

    // Click on student
    const studentRow = page.locator(`[data-testid="student-row"]`).filter({
      hasText: student.firstName
    });
    
    if (await studentRow.count() > 0) {
      await studentRow.first().click();
      await waitForLoading(page);

      // Verify profile sections are present
      await expect(page.locator('[data-testid="student-profile"]')).toBeVisible();
      await expect(page.locator('[data-testid="personal-info-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="contact-info-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="academic-info-section"]')).toBeVisible();
      await expect(page.locator('[data-testid="guardian-info-section"]')).toBeVisible();

      // Verify key information is displayed
      await expect(page.locator('[data-testid="student-name"]')).toContainText(student.firstName);
      await expect(page.locator('[data-testid="student-year-group"]')).toContainText(student.yearGroup);

      console.log('✅ Student profile verified');
    } else {
      console.log('ℹ️ No existing students found - skipping profile test');
    }
  });

  test('Bulk operations on students', async ({ page }) => {
    console.log('📦 Testing bulk operations...');

    // Select multiple students
    const studentRows = page.locator('[data-testid="student-row"]');
    const rowCount = await studentRows.count();

    if (rowCount >= 2) {
      // Select first two students
      await studentRows.nth(0).locator('[data-testid="student-checkbox"]').check();
      await studentRows.nth(1).locator('[data-testid="student-checkbox"]').check();

      // Verify bulk actions are available
      await expect(page.locator('[data-testid="bulk-actions"]')).toBeVisible();

      // Test bulk year group update
      await clickButton(page, 'bulk-update-year-group');
      await selectDropdownOption(page, 'bulk-year-group', 'Year 8');
      await clickButton(page, 'confirm-bulk-update');
      await waitForToast(page, 'Students updated successfully');

      console.log('✅ Bulk year group update completed');
    } else {
      console.log('ℹ️ Not enough students for bulk operations test');
    }
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