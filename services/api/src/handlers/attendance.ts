import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';

// Attendance types
type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

type Attendance = {
  id: string;
  studentId: string;
  schoolId: string;
  classId?: string;
  date: string;
  status: AttendanceStatus;
  arrivalTime?: string;
  departureTime?: string;
  notes?: string;
  markedBy: string;
  markedAt: string;
  createdAt: string;
  updatedAt: string;
};

type CreateAttendanceRequest = Omit<Attendance, 'id' | 'markedAt' | 'createdAt' | 'updatedAt'>;
type UpdateAttendanceRequest = Partial<Omit<Attendance, 'id' | 'studentId' | 'schoolId' | 'date' | 'createdAt' | 'updatedAt'>>;

const logger = new Logger({ serviceName: 'attendance-handler' });
const tracer = new Tracer({ serviceName: 'attendance-handler' });

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME!;

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  logger.info('Attendance handler invoked', { event });

  try {
    const method = event.requestContext.http.method;
    const path = event.rawPath;
    const pathParameters = event.pathParameters || {};

    // Route handling
    if (method === 'GET' && path === '/attendance') {
      return await listAttendance(event.queryStringParameters || null);
    }
    
    if (method === 'POST' && path === '/attendance') {
      return await createAttendance(event.body || null);
    }
    
    if (method === 'GET' && pathParameters.id) {
      return await getAttendance(pathParameters.id);
    }
    
    if (method === 'PUT' && pathParameters.id) {
      return await updateAttendance(pathParameters.id, event.body || null);
    }
    
    if (method === 'DELETE' && pathParameters.id) {
      return await deleteAttendance(pathParameters.id);
    }

    // Special endpoints for attendance reports
    if (method === 'GET' && path === '/attendance/student/{studentId}') {
      return await getStudentAttendance(pathParameters.studentId!, event.queryStringParameters || null);
    }

    if (method === 'GET' && path === '/attendance/class/{classId}') {
      return await getClassAttendance(pathParameters.classId!, event.queryStringParameters || null);
    }

    if (method === 'POST' && path === '/attendance/bulk') {
      return await bulkCreateAttendance(event.body || null);
    }

    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Route not found' })
    };

  } catch (error) {
    logger.error('Error in attendance handler', { error });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

async function listAttendance(queryParams: { [key: string]: string | undefined } | null) {
  try {
    const schoolId = queryParams?.schoolId;
    const date = queryParams?.date;
    const status = queryParams?.status;
    
    let command;
    const filterExpressions: string[] = ['begins_with(pk, :attendancePrefix)'];
    const expressionAttributeValues: Record<string, any> = {
      ':attendancePrefix': 'attendance#'
    };

    if (schoolId) {
      filterExpressions.push('schoolId = :schoolId');
      expressionAttributeValues[':schoolId'] = schoolId;
    }

    if (date) {
      filterExpressions.push('#date = :date');
      expressionAttributeValues[':date'] = date;
    }

    if (status) {
      filterExpressions.push('#status = :status');
      expressionAttributeValues[':status'] = status;
    }

    command = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: filterExpressions.join(' AND '),
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: date || status ? {
        ...(date && { '#date': 'date' }),
        ...(status && { '#status': 'status' })
      } : undefined
    });

    const result = await docClient.send(command);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        attendance: result.Items || [],
        count: result.Count || 0
      })
    };
  } catch (error) {
    logger.error('Error listing attendance', { error });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to list attendance' })
    };
  }
}

async function getAttendance(attendanceId: string) {
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: { 
      pk: `attendance#${attendanceId}`,
      sk: `attendance#${attendanceId}`
    }
  });

  const result = await docClient.send(command);
  
  if (!result.Item) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Attendance record not found' })
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attendance: result.Item })
  };
}

async function createAttendance(body: string | null) {
  if (!body) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Request body is required' })
    };
  }

  let requestData;
  try {
    requestData = JSON.parse(body);
  } catch (error) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON in request body' })
    };
  }

  // Basic validation
  if (!requestData.studentId || !requestData.schoolId || !requestData.date || !requestData.status || !requestData.markedBy) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Missing required fields: studentId, schoolId, date, status, markedBy' 
      })
    };
  }

  const attendanceData = requestData;
  const attendanceId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const pk = `attendance#${attendanceId}`;
  const now = new Date().toISOString();

  const attendance = {
    pk,
    sk: pk,
    id: attendanceId,
    ...attendanceData,
    markedAt: now,
    createdAt: now,
    updatedAt: now
  };

  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: attendance,
    ConditionExpression: 'attribute_not_exists(pk)'
  });

  try {
    await docClient.send(command);
    
    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attendance })
    };
  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Attendance record already exists' })
      };
    }
    
    logger.error('Error creating attendance', { error });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to create attendance record' })
    };
  }
}

async function updateAttendance(attendanceId: string, body: string | null) {
  if (!body) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Request body is required' })
    };
  }

  let requestData;
  try {
    requestData = JSON.parse(body);
  } catch (error) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON in request body' })
    };
  }

  // Basic validation
  if (!requestData || Object.keys(requestData).length === 0) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'No data provided for update' 
      })
    };
  }

  const updateData = requestData;
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  // Build update expression dynamically
  Object.entries(updateData).forEach(([key, value], index) => {
    const attrName = `#attr${index}`;
    const attrValue = `:val${index}`;
    
    updateExpressions.push(`${attrName} = ${attrValue}`);
    expressionAttributeNames[attrName] = key;
    expressionAttributeValues[attrValue] = value;
  });

  // Always update the updatedAt timestamp
  updateExpressions.push('#updatedAt = :updatedAt');
  expressionAttributeNames['#updatedAt'] = 'updatedAt';
  expressionAttributeValues[':updatedAt'] = new Date().toISOString();

  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { 
      pk: `attendance#${attendanceId}`,
      sk: `attendance#${attendanceId}`
    },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ConditionExpression: 'attribute_exists(pk)',
    ReturnValues: 'ALL_NEW'
  });

  try {
    const result = await docClient.send(command);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attendance: result.Attributes })
    };
  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Attendance record not found' })
      };
    }
    
    logger.error('Error updating attendance', { error });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to update attendance record' })
    };
  }
}

async function deleteAttendance(attendanceId: string) {
  const command = new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { 
      pk: `attendance#${attendanceId}`,
      sk: `attendance#${attendanceId}`
    },
    ConditionExpression: 'attribute_exists(pk)',
    ReturnValues: 'ALL_OLD'
  });

  try {
    const result = await docClient.send(command);
    
    if (!result.Attributes) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Attendance record not found' })
      };
    }
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: 'Attendance record deleted successfully',
        attendance: result.Attributes 
      })
    };
  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Attendance record not found' })
      };
    }
    
    logger.error('Error deleting attendance', { error });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to delete attendance record' })
    };
  }
}

async function getStudentAttendance(studentId: string, queryParams: { [key: string]: string | undefined } | null) {
  try {
    const startDate = queryParams?.startDate;
    const endDate = queryParams?.endDate;
    
    let filterExpression = 'begins_with(pk, :attendancePrefix) AND studentId = :studentId';
    const expressionAttributeValues: Record<string, any> = {
      ':attendancePrefix': 'attendance#',
      ':studentId': studentId
    };

    if (startDate && endDate) {
      filterExpression += ' AND #date BETWEEN :startDate AND :endDate';
      expressionAttributeValues[':startDate'] = startDate;
      expressionAttributeValues[':endDate'] = endDate;
    } else if (startDate) {
      filterExpression += ' AND #date >= :startDate';
      expressionAttributeValues[':startDate'] = startDate;
    } else if (endDate) {
      filterExpression += ' AND #date <= :endDate';
      expressionAttributeValues[':endDate'] = endDate;
    }

    const command = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: (startDate || endDate) ? { '#date': 'date' } : undefined
    });

    const result = await docClient.send(command);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        studentId,
        attendance: result.Items || [],
        count: result.Count || 0
      })
    };
  } catch (error) {
    logger.error('Error getting student attendance', { error });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to get student attendance' })
    };
  }
}

async function getClassAttendance(classId: string, queryParams: { [key: string]: string | undefined } | null) {
  try {
    const date = queryParams?.date;
    
    let filterExpression = 'begins_with(pk, :attendancePrefix) AND classId = :classId';
    const expressionAttributeValues: Record<string, any> = {
      ':attendancePrefix': 'attendance#',
      ':classId': classId
    };

    if (date) {
      filterExpression += ' AND #date = :date';
      expressionAttributeValues[':date'] = date;
    }

    const command = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: date ? { '#date': 'date' } : undefined
    });

    const result = await docClient.send(command);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        classId,
        date: date || 'all',
        attendance: result.Items || [],
        count: result.Count || 0
      })
    };
  } catch (error) {
    logger.error('Error getting class attendance', { error });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to get class attendance' })
    };
  }
}

async function bulkCreateAttendance(body: string | null) {
  if (!body) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Request body is required' })
    };
  }

  let requestData;
  try {
    requestData = JSON.parse(body);
  } catch (error) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON in request body' })
    };
  }

  if (!Array.isArray(requestData.attendance)) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Expected array of attendance records' })
    };
  }

  const results = [];
  const errors = [];

  for (const attendanceData of requestData.attendance) {
    try {
      // Basic validation for each record
      if (!attendanceData.studentId || !attendanceData.schoolId || !attendanceData.date || !attendanceData.status || !attendanceData.markedBy) {
        errors.push({
          studentId: attendanceData.studentId,
          error: 'Missing required fields'
        });
        continue;
      }

      const attendanceId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const pk = `attendance#${attendanceId}`;
      const now = new Date().toISOString();

      const attendance = {
        pk,
        sk: pk,
        id: attendanceId,
        ...attendanceData,
        markedAt: now,
        createdAt: now,
        updatedAt: now
      };

      const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: attendance,
        ConditionExpression: 'attribute_not_exists(pk)'
      });

      await docClient.send(command);
      results.push(attendance);

    } catch (error: any) {
      errors.push({
        studentId: attendanceData.studentId,
        error: error.message
      });
    }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      created: results,
      errors: errors,
      summary: {
        total: requestData.attendance.length,
        created: results.length,
        failed: errors.length
      }
    })
  };
}