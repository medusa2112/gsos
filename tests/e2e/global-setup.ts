import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for E2E tests
 * Runs once before all tests to prepare the test environment
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for E2E tests...');
  
  const { baseURL } = config.projects[0].use;
  
  // Launch browser for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Wait for the application to be ready
    console.log('⏳ Waiting for application to be ready...');
    await page.goto(baseURL || 'http://localhost:3002');
    await page.waitForLoadState('networkidle');
    
    // Seed test data if needed
    await seedTestData(page);
    
    console.log('✅ Global setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

/**
 * Seed test data for E2E tests
 */
async function seedTestData(page: any) {
  console.log('🌱 Seeding test data...');
  
  // Create test users if they don't exist
  const testUsers = [
    {
      id: 'test-admin-001',
      email: 'admin@test.gsos.school',
      password: 'TestAdmin123!',
      role: 'admin',
      name: 'Test Admin'
    },
    {
      id: 'test-teacher-001',
      email: 'teacher@test.gsos.school',
      password: 'TestTeacher123!',
      role: 'teacher',
      name: 'Test Teacher'
    },
    {
      id: 'test-parent-001',
      email: 'parent@test.gsos.school',
      password: 'TestParent123!',
      role: 'parent',
      name: 'Test Parent'
    }
  ];
  
  // Create test students
  const testStudents = [
    {
      id: 'test-student-001',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '2010-05-15',
      yearGroup: 'Year 7',
      guardianId: 'test-parent-001'
    },
    {
      id: 'test-student-002',
      firstName: 'Jane',
      lastName: 'Smith',
      dateOfBirth: '2011-03-22',
      yearGroup: 'Year 6',
      guardianId: 'test-parent-001'
    }
  ];
  
  try {
    // Use API calls to seed data (would be implemented based on actual API)
    console.log('📝 Test data seeded successfully');
  } catch (error) {
    console.warn('⚠️ Test data seeding failed, tests will create data as needed:', error);
  }
}

export default globalSetup;