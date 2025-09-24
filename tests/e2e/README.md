# GSOS E2E Testing Suite

Comprehensive end-to-end testing suite for the GSOS School Management System using Playwright.

## 🎯 Overview

This test suite validates critical user journeys and system functionality across the GSOS platform, ensuring that core workflows operate correctly after deployments.

### Tested Workflows

- **🎓 Admissions**: Application submission → Admin acceptance → Student record creation
- **👨‍🎓 Students**: Create/edit student, guardian linking, list queries
- **📚 Attendance**: Mark class attendance → Student sees day status  
- **💰 Finance**: Create invoice → Payment processing → Webhook reconciliation
- **🔐 Authentication**: Role-based access control and security gates

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Running GSOS application (local or deployed)

### Installation

```bash
# Install dependencies
cd tests/e2e
pnpm install

# Install Playwright browsers
npx playwright install
```

### Running Tests

```bash
# Run all smoke tests
pnpm test:smoke

# Run specific workflow tests
pnpm test:admissions
pnpm test:students
pnpm test:attendance
pnpm test:finance
pnpm test:auth

# Run tests in headed mode (see browser)
pnpm test:headed

# Run tests in debug mode
pnpm test:debug

# Generate test report
pnpm test:report
```

## 📁 Test Structure

```
tests/e2e/
├── tests/
│   ├── smoke.spec.ts           # Critical smoke tests for CI
│   ├── admissions.spec.ts      # Admissions workflow tests
│   ├── students.spec.ts        # Student management tests
│   ├── attendance.spec.ts      # Attendance tracking tests
│   ├── finance.spec.ts         # Finance operations tests
│   └── auth.spec.ts           # Authentication & RBAC tests
├── utils/
│   ├── test-helpers.ts         # Common test utilities
│   └── test-data-seeder.ts    # Test data management
├── playwright.config.ts        # Playwright configuration
├── global-setup.ts            # Global test setup
├── global-teardown.ts         # Global test cleanup
└── package.json               # E2E package dependencies
```

## 🔧 Configuration

### Environment Variables

```bash
# Base URL for testing (defaults to http://localhost:3000)
PLAYWRIGHT_BASE_URL=https://staging.gsos.app

# Test user credentials (optional, uses defaults)
TEST_ADMIN_EMAIL=admin@test.gsos.app
TEST_ADMIN_PASSWORD=TestAdmin123!

# API endpoints for test data seeding
TEST_API_BASE_URL=https://api.staging.gsos.app
```

### Browser Configuration

Tests run across multiple browsers by default:
- **Desktop Chrome** (Chromium)
- **Desktop Firefox**
- **Desktop Safari** (WebKit)
- **Mobile Chrome** (Android)
- **Mobile Safari** (iOS)

## 🧪 Test Categories

### Smoke Tests (`smoke.spec.ts`)

Critical path tests that run in CI after every deployment:

- **Critical Path**: Full application submission to student enrollment
- **Authentication**: Login/logout for all user roles
- **Student Management**: Basic CRUD operations
- **Attendance**: Basic marking functionality
- **Finance**: Invoice creation and listing
- **System Health**: Performance and responsiveness
- **Data Integrity**: Verify core data consistency
- **Security**: Access control and session management
- **Mobile**: Responsive design validation

### Workflow Tests

Detailed tests for each major system workflow:

#### Admissions (`admissions.spec.ts`)
- Application form submission
- Admin review and acceptance/rejection
- Student record creation
- Form validation and error handling

#### Students (`students.spec.ts`)
- Student creation and editing
- Guardian linking and management
- Student search and filtering
- Bulk operations
- Profile management

#### Attendance (`attendance.spec.ts`)
- Class attendance marking
- Student attendance viewing
- Multi-period attendance
- Attendance statistics and reports
- Late arrivals and early departures

#### Finance (`finance.spec.ts`)
- Invoice creation and management
- Payment processing (sandbox)
- Webhook reconciliation
- Payment plans and installments
- Financial reporting

#### Authentication (`auth.spec.ts`)
- Role-based access control
- Session management
- Password reset flows
- Multi-factor authentication
- API endpoint authorization

## 🤖 CI Integration

### GitHub Actions

The test suite integrates with GitHub Actions for automated testing:

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Smoke Tests
on:
  deployment_status:  # Run after successful deployments
  push:              # Run on main branch pushes
  pull_request:      # Run on PRs
  workflow_dispatch: # Manual trigger
```

### Test Execution

- **Parallel execution** across multiple browsers
- **Automatic retries** for flaky tests
- **Screenshot/video capture** on failures
- **HTML reports** with detailed results
- **Slack notifications** for deployment status

### Artifacts

- Test results (JUnit XML)
- HTML reports with screenshots
- Video recordings of failures
- Performance metrics

## 📊 Test Data Management

### Test Users

Predefined test users for consistent testing:

```typescript
TEST_USERS = {
  admin: { email: 'admin@test.gsos.app', role: 'admin' },
  teacher: { email: 'teacher@test.gsos.app', role: 'teacher' },
  parent: { email: 'parent@test.gsos.app', role: 'parent' }
}
```

### Test Data Seeding

Automated test data creation and cleanup:

```typescript
// Seed test data before tests
await testDataSeeder.seedAll();

// Clean up after tests
await testDataSeeder.cleanupAll();
```

### Dynamic Test Data

Generate unique test data for each test run:

```typescript
const testData = generateTestData();
// Creates unique names, emails, etc.
```

## 🛠 Development

### Writing New Tests

1. **Follow the Page Object Model** pattern
2. **Use test helpers** for common operations
3. **Add proper test data cleanup**
4. **Include accessibility checks**
5. **Add performance assertions**

Example test structure:

```typescript
test('should create new student', async ({ page }) => {
  // Arrange
  await login(page, TEST_USERS.admin);
  const testData = generateTestData();
  
  // Act
  await navigateTo(page, 'students');
  await clickButton(page, 'create-student');
  await fillField(page, 'first-name', testData.firstName);
  await clickButton(page, 'save-student');
  
  // Assert
  await waitForToast(page, 'Student created successfully');
  await expect(page.locator('[data-testid="students-table"]'))
    .toContainText(testData.firstName);
});
```

### Test Helpers

Common utilities available in `test-helpers.ts`:

- `login(page, user)` - Authenticate user
- `navigateTo(page, section)` - Navigate to app section
- `fillField(page, field, value)` - Fill form fields
- `clickButton(page, button)` - Click buttons with waiting
- `waitForToast(page, message)` - Wait for notifications
- `waitForLoading(page)` - Wait for loading states
- `generateTestData()` - Create unique test data

### Debugging Tests

```bash
# Run in headed mode to see browser
pnpm test:headed

# Run with debugger
pnpm test:debug

# Run specific test
npx playwright test tests/students.spec.ts --headed

# Generate trace for debugging
npx playwright test --trace on
```

## 📈 Performance Monitoring

Tests include performance assertions:

- **Page load times** < 5 seconds
- **API response times** < 2 seconds
- **Form submission** < 3 seconds
- **Search operations** < 1 second

## 🔒 Security Testing

Automated security validations:

- **Authentication required** for protected routes
- **Role-based access control** enforcement
- **Session management** and logout
- **CSRF protection** validation
- **Input sanitization** checks

## 📱 Mobile Testing

Responsive design validation:

- **Mobile viewports** (375x667, 414x896)
- **Touch interactions** and gestures
- **Mobile navigation** patterns
- **Responsive tables** and forms

## 🚨 Troubleshooting

### Common Issues

1. **Tests timing out**
   - Increase timeout in `playwright.config.ts`
   - Check if application is running
   - Verify network connectivity

2. **Authentication failures**
   - Verify test user credentials
   - Check if test data is seeded
   - Ensure auth endpoints are working

3. **Element not found**
   - Check `data-testid` attributes
   - Verify page is fully loaded
   - Update selectors if UI changed

4. **Flaky tests**
   - Add proper waits for async operations
   - Use `waitForLoadState()` for navigation
   - Implement retry logic for unstable elements

### Debug Commands

```bash
# Show browser console logs
npx playwright test --headed --debug

# Generate detailed trace
npx playwright test --trace on

# Run single test with verbose output
npx playwright test tests/smoke.spec.ts --reporter=line

# Check test configuration
npx playwright show-config
```

## 📞 Support

For issues with the E2E testing suite:

1. Check the [troubleshooting guide](#troubleshooting)
2. Review test logs and artifacts
3. Contact the development team
4. Create an issue in the project repository

## 🎯 Success Criteria

The E2E test suite validates that:

✅ **Critical user journeys work end-to-end**  
✅ **All user roles can access appropriate features**  
✅ **Data flows correctly between components**  
✅ **Security controls are enforced**  
✅ **Performance meets acceptable thresholds**  
✅ **Mobile experience is functional**  
✅ **Tests are CI-ready and reliable**