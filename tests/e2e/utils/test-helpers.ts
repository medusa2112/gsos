import { Page, expect } from '@playwright/test';

/**
 * Test helper utilities for E2E tests
 */

export interface TestUser {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'teacher' | 'parent' | 'student';
  name: string;
}

export interface TestStudent {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  yearGroup: string;
  guardianId?: string;
}

/**
 * Test data fixtures
 */
export const TEST_USERS: Record<string, TestUser> = {
  admin: {
    id: 'test-admin-001',
    email: 'admin@test.gsos.school',
    password: 'TestAdmin123!',
    role: 'admin',
    name: 'Test Admin'
  },
  teacher: {
    id: 'test-teacher-001',
    email: 'teacher@test.gsos.school',
    password: 'TestTeacher123!',
    role: 'teacher',
    name: 'Test Teacher'
  },
  parent: {
    id: 'test-parent-001',
    email: 'parent@test.gsos.school',
    password: 'TestParent123!',
    role: 'parent',
    name: 'Test Parent'
  }
};

export const TEST_STUDENTS: Record<string, TestStudent> = {
  student1: {
    id: 'test-student-001',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '2010-05-15',
    yearGroup: 'Year 7',
    guardianId: 'test-parent-001'
  },
  student2: {
    id: 'test-student-002',
    firstName: 'Jane',
    lastName: 'Smith',
    dateOfBirth: '2011-03-22',
    yearGroup: 'Year 6',
    guardianId: 'test-parent-001'
  }
};

/**
 * Login helper function
 */
export async function login(page: Page, user: TestUser) {
  await page.goto('/login');
  
  // Fill login form
  await page.fill('[data-testid="email-input"]', user.email);
  await page.fill('[data-testid="password-input"]', user.password);
  
  // Submit form
  await page.click('[data-testid="login-button"]');
  
  // Wait for successful login
  await page.waitForURL('/dashboard');
  
  // Verify user is logged in
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
}

/**
 * Logout helper function
 */
export async function logout(page: Page) {
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="logout-button"]');
  await page.waitForURL('/login');
}

/**
 * Navigate to a specific section
 */
export async function navigateTo(page: Page, section: string) {
  await page.click(`[data-testid="nav-${section}"]`);
  await page.waitForLoadState('networkidle');
}

/**
 * Wait for API response
 */
export async function waitForApiResponse(page: Page, endpoint: string) {
  return page.waitForResponse(response => 
    response.url().includes(endpoint) && response.status() === 200
  );
}

/**
 * Fill form field by test ID
 */
export async function fillField(page: Page, testId: string, value: string) {
  await page.fill(`[data-testid="${testId}"]`, value);
}

/**
 * Click button by test ID
 */
export async function clickButton(page: Page, testId: string) {
  await page.click(`[data-testid="${testId}"]`);
}

/**
 * Wait for toast notification
 */
export async function waitForToast(page: Page, message?: string) {
  const toast = page.locator('[data-testid="toast"]');
  await expect(toast).toBeVisible();
  
  if (message) {
    await expect(toast).toContainText(message);
  }
  
  return toast;
}

/**
 * Wait for loading to complete
 */
export async function waitForLoading(page: Page) {
  await page.waitForLoadState('networkidle');
  
  // Wait for any loading spinners to disappear
  const loadingSpinner = page.locator('[data-testid="loading-spinner"]');
  if (await loadingSpinner.isVisible()) {
    await expect(loadingSpinner).not.toBeVisible();
  }
}

/**
 * Take screenshot with timestamp
 */
export async function takeScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true 
  });
}

/**
 * Generate random test data
 */
export function generateTestData() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  
  return {
    email: `test-${timestamp}-${random}@test.gsos.school`,
    firstName: `TestFirst${random}`,
    lastName: `TestLast${random}`,
    id: `test-${timestamp}-${random}`
  };
}

/**
 * Clean up test data
 */
export async function cleanupTestData(page: Page, dataType: string, id: string) {
  // This would make API calls to clean up test data
  // Implementation depends on actual API endpoints
  console.log(`Cleaning up ${dataType} with ID: ${id}`);
}

/**
 * Verify table contains data
 */
export async function verifyTableContains(page: Page, tableTestId: string, data: Record<string, string>) {
  const table = page.locator(`[data-testid="${tableTestId}"]`);
  await expect(table).toBeVisible();
  
  for (const [key, value] of Object.entries(data)) {
    await expect(table.locator(`[data-testid="cell-${key}"]`)).toContainText(value);
  }
}

/**
 * Fill date input
 */
export async function fillDateInput(page: Page, testId: string, date: string) {
  // Handle different date input formats
  const dateInput = page.locator(`[data-testid="${testId}"]`);
  await dateInput.fill(date);
  await dateInput.press('Tab'); // Trigger validation
}

/**
 * Select dropdown option
 */
export async function selectDropdownOption(page: Page, testId: string, option: string) {
  await page.click(`[data-testid="${testId}"]`);
  await page.click(`[data-testid="option-${option}"]`);
}

/**
 * Upload file
 */
export async function uploadFile(page: Page, testId: string, filePath: string) {
  const fileInput = page.locator(`[data-testid="${testId}"]`);
  await fileInput.setInputFiles(filePath);
}

/**
 * Verify URL contains path
 */
export async function verifyUrlContains(page: Page, path: string) {
  await expect(page).toHaveURL(new RegExp(path));
}

/**
 * Wait for element to be visible
 */
export async function waitForElement(page: Page, testId: string) {
  const element = page.locator(`[data-testid="${testId}"]`);
  await expect(element).toBeVisible();
  return element;
}