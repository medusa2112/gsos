import { APIGatewayProxyHandlerV2, APIGatewayProxyEventV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import {
  Student,
  CreateStudentRequest,
  UpdateStudentRequest,
  UserRole
} from '@gsos/types';
import { DataKeys, QueryBuilders, DataTransforms } from '@gsos/utils/data-utils';
import { canAccessStudent } from '@gsos/utils/auth';

const logger = new Logger({ serviceName: 'students-handler' });
const tracer = new Tracer({ serviceName: 'students-handler' });

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const STUDENTS_TABLE = process.env.STUDENTS_TABLE!;
const GUARDIANS_TABLE = process.env.GUARDIANS_TABLE!;
const DOCUMENTS_BUCKET = process.env.DOCUMENTS_BUCKET!;

// Mock JWT verification for now - in production, use aws-jwt-verify
async function verifyToken(token: string): Promise<{ user: any } | null> {
  try {
    if (!token || !token.startsWith('Bearer ')) {
      return null;
    }
    
    const cleanToken = token.replace('Bearer ', '');
    // Mock user for development - replace with actual JWT verification
    const mockUser = {
      id: 'user123',
      email: 'teacher@school.com',
      role: 'teacher' as UserRole,
      schoolId: 'school123',
      studentId: undefined,
      parentOf: undefined
    };
    
    return { user: mockUser };
  } catch (error) {
    logger.error('Token verification failed', { error });
    return null;
  }
}

// Authentication middleware
async function authenticate(event: APIGatewayProxyEventV2) {
  const authHeader = event.headers.authorization;
  if (!authHeader) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Authorization header required' })
    };
  }

  const authResult = await verifyToken(authHeader);
  if (!authResult) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid or expired token' })
    };
  }

  return authResult;
}

// Authorization helpers
function canCreateStudent(userRole: UserRole): boolean {
  return ['admin', 'teacher'].includes(userRole);
}

function canUpdateStudent(userRole: UserRole): boolean {
  return ['admin', 'teacher'].includes(userRole);
}

function canDeleteStudent(userRole: UserRole): boolean {
  return ['admin', 'teacher'].includes(userRole);
}

function canListStudents(userRole: UserRole): boolean {
  return ['admin', 'teacher', 'parent'].includes(userRole);
}

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  logger.info('Students handler invoked', { event });

  try {
    const method = event.requestContext.http.method;
    const path = event.rawPath;

    // Authenticate user
    const authResult = await authenticate(event);
    if ('statusCode' in authResult) {
      return authResult; // Return error response
    }
    const { user } = authResult;

    // Route to appropriate handler
    if (method === 'GET' && path === '/students') {
      return await listStudents(event.queryStringParameters || {}, user);
    } else if (method === 'POST' && path === '/students') {
      return await createStudent(event.body || null, user);
    } else if (method === 'GET' && path.startsWith('/students/')) {
      const studentId = event.pathParameters?.id;
      if (!studentId) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Student ID is required' })
        };
      }
      return await getStudent(studentId, user);
    } else if (method === 'PATCH' && path.startsWith('/students/')) {
      const studentId = event.pathParameters?.id;
      if (!studentId) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Student ID is required' })
        };
      }
      return await updateStudent(studentId, event.body || null, user);
    } else if (method === 'DELETE' && path.startsWith('/students/')) {
      const studentId = event.pathParameters?.id;
      if (!studentId) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Student ID is required' })
        };
      }
      return await deleteStudent(studentId, user);
    } else {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Not found' })
      };
    }
  } catch (error) {
    logger.error('Error in students handler', { error });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

async function listStudents(queryParams: { [key: string]: string | undefined }, user: any) {
  // Check permissions
  if (!canListStudents(user.role)) {
    return {
      statusCode: 403,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Insufficient permissions to list students' })
    };
  }

  try {
    const schoolId = queryParams.schoolId || user.schoolId;
    const grade = queryParams.grade;
    const yearGroup = queryParams.yearGroup;
    const q = queryParams.q; // Search query

    let command;

    if (grade && yearGroup) {
      // Query by grade and year group using GSI
      const queryBuilder = QueryBuilders.studentsByGrade(schoolId, grade, yearGroup);
      command = new QueryCommand({
        TableName: STUDENTS_TABLE,
        ...queryBuilder
      });
    } else {
      // Query all students in school using GSI
      command = new QueryCommand({
        TableName: STUDENTS_TABLE,
        IndexName: 'SchoolIndex',
        KeyConditionExpression: 'GSI1PK = :schoolId',
        ExpressionAttributeValues: {
          ':schoolId': schoolId
        }
      });
    }

    const result = await docClient.send(command);
    let students = result.Items || [];

    // Apply search filter if provided
    if (q) {
      const searchTerm = q.toLowerCase();
      students = students.filter((student: any) => 
        student.firstName?.toLowerCase().includes(searchTerm) ||
        student.lastName?.toLowerCase().includes(searchTerm) ||
        student.studentNumber?.toLowerCase().includes(searchTerm) ||
        student.email?.toLowerCase().includes(searchTerm)
      );
    }

    // Filter based on user permissions
    if (user.role === 'parent' && user.parentOf) {
      students = students.filter((student: any) => 
        user.parentOf.includes(student.id)
      );
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        students,
        count: students.length,
        schoolId
      })
    };
  } catch (error) {
    logger.error('Error listing students', { error });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to list students' })
    };
  }
}

async function getStudent(studentId: string, user: any) {
  // Check if user can access this specific student
  if (!canAccessStudent(user, studentId)) {
    return {
      statusCode: 403,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Access denied to this student record' })
    };
  }

  try {
    const pk = DataKeys.student.pk(user.schoolId, studentId);
    const sk = DataKeys.student.sk('profile');

    const command = new GetCommand({
      TableName: STUDENTS_TABLE,
      Key: { pk, sk }
    });

    const result = await docClient.send(command);
    
    if (!result.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Student not found' })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student: result.Item })
    };
  } catch (error) {
    logger.error('Error getting student', { error, studentId });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to get student' })
    };
  }
}

async function createStudent(body: string | null, user: any) {
  // Check permissions
  if (!canCreateStudent(user.role)) {
    return {
      statusCode: 403,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Insufficient permissions to create students' })
    };
  }

  if (!body) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Request body is required' })
    };
  }

  try {
    const requestData = JSON.parse(body);
    
    // Validate with Zod schema
    const validationResult = CreateStudentRequest.safeParse(requestData);
    if (!validationResult.success) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Validation failed',
          details: validationResult.error.errors
        })
      };
    }

    const studentData = validationResult.data;
    const studentId = `student_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Ensure schoolId matches user's school
    if (user.role !== 'admin' && studentData.schoolId !== user.schoolId) {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Cannot create student for different school' })
      };
    }

    const pk = DataKeys.student.pk(studentData.schoolId, studentId);
    const sk = DataKeys.student.sk('profile', now);

    const student = {
      pk,
      sk,
      id: studentId,
      ...studentData,
      GSI1PK: DataKeys.student.gsi1.pk(studentData.schoolId),
      GSI1SK: DataKeys.student.gsi1.sk(studentData.grade, studentData.yearGroup),
      createdAt: now,
      updatedAt: now
    };

    const command = new PutCommand({
      TableName: STUDENTS_TABLE,
      Item: student,
      ConditionExpression: 'attribute_not_exists(pk)'
    });

    await docClient.send(command);
    
    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student })
    };
  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Student already exists' })
      };
    }
    
    logger.error('Error creating student', { error });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to create student' })
    };
  }
}

async function updateStudent(studentId: string, body: string | null, user: any) {
  // Check permissions
  if (!canUpdateStudent(user.role)) {
    return {
      statusCode: 403,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Insufficient permissions to update students' })
    };
  }

  if (!body) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Request body is required' })
    };
  }

  try {
    const requestData = JSON.parse(body);
    
    // Validate with Zod schema
    const validationResult = UpdateStudentRequest.safeParse(requestData);
    if (!validationResult.success) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Validation failed',
          details: validationResult.error.errors
        })
      };
    }

    const updateData = validationResult.data;
    const pk = DataKeys.student.pk(user.schoolId, studentId);
    const sk = DataKeys.student.sk('profile');

    // Build update expression dynamically
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    Object.entries(updateData).forEach(([key, value], index) => {
      const attrName = `#attr${index}`;
      const attrValue = `:val${index}`;
      
      updateExpressions.push(`${attrName} = ${attrValue}`);
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = value;
    });

    // Update GSI keys if grade/yearGroup changed
    if (updateData.grade || updateData.yearGroup) {
      // We'd need to get current values to build the GSI key
      // For now, assume both are provided together
      if (updateData.grade && updateData.yearGroup) {
        updateExpressions.push('#gsi1sk = :gsi1sk');
        expressionAttributeNames['#gsi1sk'] = 'GSI1SK';
        expressionAttributeValues[':gsi1sk'] = DataKeys.student.gsi1.sk(updateData.grade, updateData.yearGroup);
      }
    }

    // Always update the updatedAt timestamp
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const command = new UpdateCommand({
      TableName: STUDENTS_TABLE,
      Key: { pk, sk },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ConditionExpression: 'attribute_exists(pk)',
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(command);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student: result.Attributes })
    };
  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Student not found' })
      };
    }
    
    logger.error('Error updating student', { error, studentId });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to update student' })
    };
  }
}

async function deleteStudent(studentId: string, user: any) {
  // Check permissions
  if (!canDeleteStudent(user.role)) {
    return {
      statusCode: 403,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Insufficient permissions to delete students' })
    };
  }

  try {
    const pk = DataKeys.student.pk(user.schoolId, studentId);
    const sk = DataKeys.student.sk('profile');

    const command = new DeleteCommand({
      TableName: STUDENTS_TABLE,
      Key: { pk, sk },
      ConditionExpression: 'attribute_exists(pk)',
      ReturnValues: 'ALL_OLD'
    });

    const result = await docClient.send(command);
    
    if (!result.Attributes) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Student not found' })
      };
    }
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: 'Student deleted successfully',
        student: result.Attributes 
      })
    };
  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Student not found' })
      };
    }
    
    logger.error('Error deleting student', { error, studentId });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to delete student' })
    };
  }
}