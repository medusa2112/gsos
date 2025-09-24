import { APIRequestContext } from '@playwright/test';

export interface TestDataSeed {
  users: TestUser[];
  students: TestStudent[];
  classes: TestClass[];
  invoices: TestInvoice[];
}

export interface TestUser {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'teacher' | 'parent' | 'student';
  firstName: string;
  lastName: string;
  permissions?: string[];
}

export interface TestStudent {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  yearGroup: string;
  parentId?: string;
  admissionNumber: string;
  status: 'active' | 'inactive' | 'graduated';
}

export interface TestClass {
  id: string;
  name: string;
  subject: string;
  yearGroup: string;
  teacherId: string;
  students: string[];
  schedule: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
}

export interface TestInvoice {
  id: string;
  studentId: string;
  description: string;
  amount: number;
  category: string;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
}

/**
 * Predefined test data for consistent E2E testing
 */
export const TEST_DATA_SEED: TestDataSeed = {
  users: [
    {
      id: 'admin-001',
      email: 'admin@test.gsos.app',
      password: 'TestAdmin123!',
      role: 'admin',
      firstName: 'Test',
      lastName: 'Administrator',
      permissions: ['*']
    },
    {
      id: 'teacher-001',
      email: 'teacher@test.gsos.app',
      password: 'TestTeacher123!',
      role: 'teacher',
      firstName: 'Sarah',
      lastName: 'Johnson',
      permissions: ['attendance:write', 'students:read', 'classes:manage']
    },
    {
      id: 'teacher-002',
      email: 'teacher2@test.gsos.app',
      password: 'TestTeacher123!',
      role: 'teacher',
      firstName: 'Michael',
      lastName: 'Brown',
      permissions: ['attendance:write', 'students:read', 'classes:manage']
    },
    {
      id: 'parent-001',
      email: 'parent@test.gsos.app',
      password: 'TestParent123!',
      role: 'parent',
      firstName: 'Emma',
      lastName: 'Wilson',
      permissions: ['payments:manage', 'student:read']
    },
    {
      id: 'parent-002',
      email: 'parent2@test.gsos.app',
      password: 'TestParent123!',
      role: 'parent',
      firstName: 'David',
      lastName: 'Taylor',
      permissions: ['payments:manage', 'student:read']
    }
  ],
  students: [
    {
      id: 'student-001',
      firstName: 'James',
      lastName: 'Wilson',
      dateOfBirth: '2010-03-15',
      yearGroup: 'Year 7',
      parentId: 'parent-001',
      admissionNumber: 'ADM2024001',
      status: 'active'
    },
    {
      id: 'student-002',
      firstName: 'Sophie',
      lastName: 'Taylor',
      dateOfBirth: '2009-07-22',
      yearGroup: 'Year 8',
      parentId: 'parent-002',
      admissionNumber: 'ADM2024002',
      status: 'active'
    },
    {
      id: 'student-003',
      firstName: 'Oliver',
      lastName: 'Davis',
      dateOfBirth: '2011-01-10',
      yearGroup: 'Year 6',
      parentId: 'parent-001',
      admissionNumber: 'ADM2024003',
      status: 'active'
    },
    {
      id: 'student-004',
      firstName: 'Emily',
      lastName: 'Johnson',
      dateOfBirth: '2010-09-05',
      yearGroup: 'Year 7',
      parentId: 'parent-002',
      admissionNumber: 'ADM2024004',
      status: 'active'
    }
  ],
  classes: [
    {
      id: 'class-001',
      name: 'Year 7 Mathematics',
      subject: 'Mathematics',
      yearGroup: 'Year 7',
      teacherId: 'teacher-001',
      students: ['student-001', 'student-004'],
      schedule: [
        { day: 'Monday', startTime: '09:00', endTime: '10:00' },
        { day: 'Wednesday', startTime: '11:00', endTime: '12:00' },
        { day: 'Friday', startTime: '14:00', endTime: '15:00' }
      ]
    },
    {
      id: 'class-002',
      name: 'Year 8 English',
      subject: 'English',
      yearGroup: 'Year 8',
      teacherId: 'teacher-002',
      students: ['student-002'],
      schedule: [
        { day: 'Tuesday', startTime: '10:00', endTime: '11:00' },
        { day: 'Thursday', startTime: '09:00', endTime: '10:00' }
      ]
    },
    {
      id: 'class-003',
      name: 'Year 6 Science',
      subject: 'Science',
      yearGroup: 'Year 6',
      teacherId: 'teacher-001',
      students: ['student-003'],
      schedule: [
        { day: 'Monday', startTime: '13:00', endTime: '14:00' },
        { day: 'Friday', startTime: '10:00', endTime: '11:00' }
      ]
    }
  ],
  invoices: [
    {
      id: 'invoice-001',
      studentId: 'student-001',
      description: 'School Trip - Science Museum',
      amount: 25.00,
      category: 'School Trips',
      dueDate: '2024-12-31',
      status: 'pending'
    },
    {
      id: 'invoice-002',
      studentId: 'student-002',
      description: 'Music Lessons - Term 1',
      amount: 120.00,
      category: 'Music Lessons',
      dueDate: '2024-11-30',
      status: 'pending'
    },
    {
      id: 'invoice-003',
      studentId: 'student-003',
      description: 'School Uniform',
      amount: 45.50,
      category: 'Uniform',
      dueDate: '2024-10-15',
      status: 'paid'
    }
  ]
};

/**
 * Seeds test data via API calls
 */
export class TestDataSeeder {
  constructor(private apiContext: APIRequestContext, private baseUrl: string) {}

  async seedAll(): Promise<void> {
    console.log('🌱 Seeding test data...');
    
    try {
      await this.seedUsers();
      await this.seedStudents();
      await this.seedClasses();
      await this.seedInvoices();
      
      console.log('✅ Test data seeded successfully');
    } catch (error) {
      console.error('❌ Failed to seed test data:', error);
      throw error;
    }
  }

  async cleanupAll(): Promise<void> {
    console.log('🧹 Cleaning up test data...');
    
    try {
      await this.cleanupInvoices();
      await this.cleanupClasses();
      await this.cleanupStudents();
      await this.cleanupUsers();
      
      console.log('✅ Test data cleaned up successfully');
    } catch (error) {
      console.error('❌ Failed to cleanup test data:', error);
      // Don't throw on cleanup errors to avoid breaking tests
    }
  }

  private async seedUsers(): Promise<void> {
    for (const user of TEST_DATA_SEED.users) {
      try {
        await this.apiContext.post(`${this.baseUrl}/api/test/users`, {
          data: user
        });
      } catch (error) {
        console.warn(`Failed to seed user ${user.email}:`, error);
      }
    }
  }

  private async seedStudents(): Promise<void> {
    for (const student of TEST_DATA_SEED.students) {
      try {
        await this.apiContext.post(`${this.baseUrl}/api/test/students`, {
          data: student
        });
      } catch (error) {
        console.warn(`Failed to seed student ${student.firstName} ${student.lastName}:`, error);
      }
    }
  }

  private async seedClasses(): Promise<void> {
    for (const classData of TEST_DATA_SEED.classes) {
      try {
        await this.apiContext.post(`${this.baseUrl}/api/test/classes`, {
          data: classData
        });
      } catch (error) {
        console.warn(`Failed to seed class ${classData.name}:`, error);
      }
    }
  }

  private async seedInvoices(): Promise<void> {
    for (const invoice of TEST_DATA_SEED.invoices) {
      try {
        await this.apiContext.post(`${this.baseUrl}/api/test/invoices`, {
          data: invoice
        });
      } catch (error) {
        console.warn(`Failed to seed invoice ${invoice.description}:`, error);
      }
    }
  }

  private async cleanupUsers(): Promise<void> {
    for (const user of TEST_DATA_SEED.users) {
      try {
        await this.apiContext.delete(`${this.baseUrl}/api/test/users/${user.id}`);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  private async cleanupStudents(): Promise<void> {
    for (const student of TEST_DATA_SEED.students) {
      try {
        await this.apiContext.delete(`${this.baseUrl}/api/test/students/${student.id}`);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  private async cleanupClasses(): Promise<void> {
    for (const classData of TEST_DATA_SEED.classes) {
      try {
        await this.apiContext.delete(`${this.baseUrl}/api/test/classes/${classData.id}`);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  private async cleanupInvoices(): Promise<void> {
    for (const invoice of TEST_DATA_SEED.invoices) {
      try {
        await this.apiContext.delete(`${this.baseUrl}/api/test/invoices/${invoice.id}`);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Creates a fresh application for testing admissions workflow
   */
  async createTestApplication(): Promise<{
    applicationId: string;
    studentData: {
      firstName: string;
      lastName: string;
      email: string;
    };
  }> {
    const timestamp = Date.now();
    const studentData = {
      firstName: `TestStudent${timestamp}`,
      lastName: 'Application',
      email: `test.application.${timestamp}@test.gsos.app`
    };

    const response = await this.apiContext.post(`${this.baseUrl}/api/test/applications`, {
      data: {
        student: {
          firstName: studentData.firstName,
          lastName: studentData.lastName,
          dateOfBirth: '2010-05-15',
          yearGroup: 'Year 7'
        },
        parent: {
          firstName: 'Test',
          lastName: 'Parent',
          email: studentData.email,
          phone: '+44 7700 900123'
        }
      }
    });

    const result = await response.json();
    
    return {
      applicationId: result.applicationId,
      studentData
    };
  }

  /**
   * Gets authentication token for a test user
   */
  async getAuthToken(userEmail: string): Promise<string> {
    const response = await this.apiContext.post(`${this.baseUrl}/api/test/auth/token`, {
      data: { email: userEmail }
    });

    const result = await response.json();
    return result.token;
  }

  /**
   * Creates a test invoice for payment testing
   */
  async createTestInvoice(studentId: string): Promise<string> {
    const timestamp = Date.now();
    
    const response = await this.apiContext.post(`${this.baseUrl}/api/test/invoices`, {
      data: {
        id: `test-invoice-${timestamp}`,
        studentId,
        description: `Test Invoice ${timestamp}`,
        amount: 10.00,
        category: 'Testing',
        dueDate: '2024-12-31',
        status: 'pending'
      }
    });

    const result = await response.json();
    return result.invoiceId;
  }
}

/**
 * Utility function to get test user by role
 */
export function getTestUserByRole(role: string): TestUser | undefined {
  return TEST_DATA_SEED.users.find(user => user.role === role);
}

/**
 * Utility function to get test student by ID
 */
export function getTestStudentById(id: string): TestStudent | undefined {
  return TEST_DATA_SEED.students.find(student => student.id === id);
}

/**
 * Utility function to get test class by teacher
 */
export function getTestClassByTeacher(teacherId: string): TestClass[] {
  return TEST_DATA_SEED.classes.filter(cls => cls.teacherId === teacherId);
}