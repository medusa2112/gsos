import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// Simple types for testing
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  schoolId: string;
  classId?: string;
  guardianIds: string[];
  enrollmentDate: string;
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
  createdAt: string;
  updatedAt: string;
}

interface CreateStudentRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  schoolId: string;
  classId?: string;
  guardianIds: string[];
  enrollmentDate: string;
  status?: 'active' | 'inactive' | 'graduated' | 'transferred';
}

interface UpdateStudentRequest {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  classId?: string;
  guardianIds?: string[];
  status?: 'active' | 'inactive' | 'graduated' | 'transferred';
}

// Mock data store
const mockStudents: Map<string, Student> = new Map();

// Helper functions
function generateId(): string {
  return `student-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function createResponse(statusCode: number, body: any): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
    },
    body: JSON.stringify(body)
  };
}

function validateCreateRequest(data: any): CreateStudentRequest | null {
  if (!data.firstName || !data.lastName || !data.dateOfBirth || !data.gender || 
      !data.schoolId || !data.guardianIds || !data.enrollmentDate) {
    return null;
  }
  
  return {
    firstName: data.firstName,
    lastName: data.lastName,
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
    schoolId: data.schoolId,
    classId: data.classId,
    guardianIds: Array.isArray(data.guardianIds) ? data.guardianIds : [data.guardianIds],
    enrollmentDate: data.enrollmentDate,
    status: data.status || 'active'
  };
}

// Handler functions
export async function createStudent(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const requestData = JSON.parse(event.body);
    const validatedData = validateCreateRequest(requestData);
    
    if (!validatedData) {
      return createResponse(400, { error: 'Invalid request data' });
    }

    const id = generateId();
    const now = new Date().toISOString();
    
    const student: Student = {
      id,
      ...validatedData,
      status: validatedData.status || 'active',
      createdAt: now,
      updatedAt: now
    };

    mockStudents.set(id, student);

    return createResponse(201, student);
  } catch (error) {
    console.error('Error creating student:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

export async function getStudent(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const studentId = event.pathParameters?.id;
    
    if (!studentId) {
      return createResponse(400, { error: 'Student ID is required' });
    }

    const student = mockStudents.get(studentId);
    
    if (!student) {
      return createResponse(404, { error: 'Student not found' });
    }

    return createResponse(200, student);
  } catch (error) {
    console.error('Error getting student:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

export async function updateStudent(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const studentId = event.pathParameters?.id;
    
    if (!studentId) {
      return createResponse(400, { error: 'Student ID is required' });
    }

    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const student = mockStudents.get(studentId);
    
    if (!student) {
      return createResponse(404, { error: 'Student not found' });
    }

    const updateData: UpdateStudentRequest = JSON.parse(event.body);
    
    const updatedStudent: Student = {
      ...student,
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    mockStudents.set(studentId, updatedStudent);

    return createResponse(200, updatedStudent);
  } catch (error) {
    console.error('Error updating student:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

export async function listStudents(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const students = Array.from(mockStudents.values());
    
    // Simple pagination
    const limit = parseInt(event.queryStringParameters?.limit || '10');
    const offset = parseInt(event.queryStringParameters?.offset || '0');
    
    const paginatedStudents = students.slice(offset, offset + limit);
    
    return createResponse(200, {
      students: paginatedStudents,
      total: students.length,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error listing students:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

export async function deleteStudent(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const studentId = event.pathParameters?.id;
    
    if (!studentId) {
      return createResponse(400, { error: 'Student ID is required' });
    }

    const student = mockStudents.get(studentId);
    
    if (!student) {
      return createResponse(404, { error: 'Student not found' });
    }

    mockStudents.delete(studentId);

    return createResponse(200, { message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}