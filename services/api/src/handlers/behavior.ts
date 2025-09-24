import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { randomUUID } from 'node:crypto';

// Behavior types
type BehaviorType = 'positive' | 'negative' | 'neutral' | 'incident' | 'achievement' | 'concern';

type BehaviorRecord = {
  id: string;
  studentId: string;
  teacherId: string;
  classId?: string;
  type: BehaviorType;
  title: string;
  description: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  actionTaken?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  parentNotified: boolean;
  parentNotifiedAt?: string;
  isConfidential: boolean;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
};

type CreateBehaviorRequest = Omit<BehaviorRecord, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateBehaviorRequest = Partial<Omit<BehaviorRecord, 'id' | 'createdAt' | 'updatedAt'>>;

const logger = new Logger({ serviceName: 'behavior-handler' });
const tracer = new Tracer({ serviceName: 'behavior-handler' });

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME!;

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  logger.info('Behavior handler invoked', { event });

  try {
    const method = event.requestContext.http.method;
    const path = event.rawPath;
    const pathParameters = event.pathParameters || {};

    // Route handling
    if (method === 'GET' && path === '/behavior') {
      return await listBehaviorRecords(event.queryStringParameters || null);
    }
    
    if (method === 'POST' && path === '/behavior') {
      return await createBehaviorRecord(event.body || null);
    }
    
    if (method === 'GET' && pathParameters.id) {
      return await getBehaviorRecord(pathParameters.id);
    }
    
    if (method === 'PUT' && pathParameters.id) {
      return await updateBehaviorRecord(pathParameters.id, event.body || null);
    }
    
    if (method === 'DELETE' && pathParameters.id) {
      return await deleteBehaviorRecord(pathParameters.id);
    }

    // Special endpoints for behavior reports
    if (method === 'GET' && path === '/behavior/student/{studentId}') {
      return await getStudentBehaviorRecords(pathParameters.studentId!, event.queryStringParameters || null);
    }

    if (method === 'GET' && path === '/behavior/teacher/{teacherId}') {
      return await getTeacherBehaviorRecords(pathParameters.teacherId!, event.queryStringParameters || null);
    }

    if (method === 'GET' && path === '/behavior/class/{classId}') {
      return await getClassBehaviorRecords(pathParameters.classId!, event.queryStringParameters || null);
    }

    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Route not found' })
    };

  } catch (error) {
    logger.error('Error in behavior handler', { error });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

async function listBehaviorRecords(queryParams: { [key: string]: string | undefined } | null) {
  try {
    const studentId = queryParams?.studentId;
    const teacherId = queryParams?.teacherId;
    const type = queryParams?.type as BehaviorType | undefined;
    const severity = queryParams?.severity;
    const limit = queryParams?.limit ? parseInt(queryParams.limit) : 50;
    
    let command;
    
    if (studentId) {
      // Query by student
      command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :gsi1pk',
        ExpressionAttributeValues: {
          ':gsi1pk': `student#${studentId}#behavior`
        },
        Limit: limit,
        ScanIndexForward: false // Most recent first
      });
    } else if (teacherId) {
      // Query by teacher
      command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :gsi2pk',
        ExpressionAttributeValues: {
          ':gsi2pk': `teacher#${teacherId}#behavior`
        },
        Limit: limit,
        ScanIndexForward: false
      });
    } else {
      // Scan all behavior records
      const filterExpressions = [];
      const expressionAttributeValues: any = {};
      
      if (type) {
        filterExpressions.push('#type = :type');
        expressionAttributeValues[':type'] = type;
      }
      
      if (severity) {
        filterExpressions.push('severity = :severity');
        expressionAttributeValues[':severity'] = severity;
      }
      
      command = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: filterExpressions.length > 0 ? filterExpressions.join(' AND ') : undefined,
        ExpressionAttributeValues: Object.keys(expressionAttributeValues).length > 0 ? expressionAttributeValues : undefined,
        ExpressionAttributeNames: type ? { '#type': 'type' } : undefined,
        Limit: limit
      });
    }

    const result = await docClient.send(command);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        behaviorRecords: result.Items || [],
        count: result.Items?.length || 0,
        lastEvaluatedKey: result.LastEvaluatedKey
      })
    };
  } catch (error) {
    logger.error('Error listing behavior records', { error });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to list behavior records' })
    };
  }
}

async function getBehaviorRecord(behaviorId: string) {
  try {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { 
        pk: `behavior#${behaviorId}`,
        sk: `behavior#${behaviorId}`
      }
    });

    const result = await docClient.send(command);
    
    if (!result.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Behavior record not found' })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ behaviorRecord: result.Item })
    };
  } catch (error) {
    logger.error('Error getting behavior record', { error, behaviorId });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to get behavior record' })
    };
  }
}

async function createBehaviorRecord(body: string | null) {
  try {
    if (!body) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Request body is required' })
      };
    }

    const data = JSON.parse(body);
    
    // Basic validation
    if (!data.studentId || !data.teacherId || !data.type || !data.title || !data.description) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required fields: studentId, teacherId, type, title, description' })
      };
    }
    
    const validatedData = data as CreateBehaviorRequest;
    
    const behaviorId = randomUUID();
    const now = new Date().toISOString();
    
    const behaviorRecord: BehaviorRecord = {
      id: behaviorId,
      ...validatedData,
      createdAt: now,
      updatedAt: now
    };

    // Store in DynamoDB with multiple access patterns
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: `behavior#${behaviorId}`,
        sk: `behavior#${behaviorId}`,
        GSI1PK: `student#${behaviorRecord.studentId}#behavior`,
        GSI1SK: now,
        GSI2PK: `teacher#${behaviorRecord.teacherId}#behavior`,
        GSI2SK: now,
        ...behaviorRecord
      }
    });

    await docClient.send(command);
    
    logger.info('Behavior record created', { behaviorId, studentId: behaviorRecord.studentId });
    
    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ behaviorRecord })
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }
    

    
    logger.error('Error creating behavior record', { error });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to create behavior record' })
    };
  }
}

async function updateBehaviorRecord(behaviorId: string, body: string | null) {
  try {
    if (!body) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Request body is required' })
      };
    }

    const data = JSON.parse(body);
    
    // Basic validation - allow partial updates
    const validatedData = data as UpdateBehaviorRequest;
    
    // Check if record exists
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: { 
        pk: `behavior#${behaviorId}`,
        sk: `behavior#${behaviorId}`
      }
    });

    const existingRecord = await docClient.send(getCommand);
    
    if (!existingRecord.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Behavior record not found' })
      };
    }

    const now = new Date().toISOString();
    
    // Build update expression
    const updateExpressions = [];
    const expressionAttributeNames: any = {};
    const expressionAttributeValues: any = {};
    
    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    });
    
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = now;

    const updateCommand = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { 
        pk: `behavior#${behaviorId}`,
        sk: `behavior#${behaviorId}`
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(updateCommand);
    
    logger.info('Behavior record updated', { behaviorId });
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ behaviorRecord: result.Attributes })
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }
    

    
    logger.error('Error updating behavior record', { error, behaviorId });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to update behavior record' })
    };
  }
}

async function deleteBehaviorRecord(behaviorId: string) {
  try {
    // Check if record exists
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: { 
        pk: `behavior#${behaviorId}`,
        sk: `behavior#${behaviorId}`
      }
    });

    const existingRecord = await docClient.send(getCommand);
    
    if (!existingRecord.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Behavior record not found' })
      };
    }

    const deleteCommand = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { 
        pk: `behavior#${behaviorId}`,
        sk: `behavior#${behaviorId}`
      }
    });

    await docClient.send(deleteCommand);
    
    logger.info('Behavior record deleted', { behaviorId });
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Behavior record deleted successfully' })
    };
  } catch (error) {
    logger.error('Error deleting behavior record', { error, behaviorId });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to delete behavior record' })
    };
  }
}

async function getStudentBehaviorRecords(studentId: string, queryParams: { [key: string]: string | undefined } | null) {
  try {
    const type = queryParams?.type as BehaviorType | undefined;
    const severity = queryParams?.severity;
    const limit = queryParams?.limit ? parseInt(queryParams.limit) : 50;
    const startDate = queryParams?.startDate;
    const endDate = queryParams?.endDate;
    
    let keyConditionExpression = 'GSI1PK = :gsi1pk';
    const expressionAttributeValues: any = {
      ':gsi1pk': `student#${studentId}#behavior`
    };
    
    if (startDate && endDate) {
      keyConditionExpression += ' AND GSI1SK BETWEEN :startDate AND :endDate';
      expressionAttributeValues[':startDate'] = startDate;
      expressionAttributeValues[':endDate'] = endDate;
    } else if (startDate) {
      keyConditionExpression += ' AND GSI1SK >= :startDate';
      expressionAttributeValues[':startDate'] = startDate;
    } else if (endDate) {
      keyConditionExpression += ' AND GSI1SK <= :endDate';
      expressionAttributeValues[':endDate'] = endDate;
    }
    
    const filterExpressions = [];
    
    if (type) {
      filterExpressions.push('#type = :type');
      expressionAttributeValues[':type'] = type;
    }
    
    if (severity) {
      filterExpressions.push('severity = :severity');
      expressionAttributeValues[':severity'] = severity;
    }

    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: keyConditionExpression,
      FilterExpression: filterExpressions.length > 0 ? filterExpressions.join(' AND ') : undefined,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: type ? { '#type': 'type' } : undefined,
      Limit: limit,
      ScanIndexForward: false // Most recent first
    });

    const result = await docClient.send(command);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        behaviorRecords: result.Items || [],
        count: result.Items?.length || 0,
        studentId,
        lastEvaluatedKey: result.LastEvaluatedKey
      })
    };
  } catch (error) {
    logger.error('Error getting student behavior records', { error, studentId });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to get student behavior records' })
    };
  }
}

async function getTeacherBehaviorRecords(teacherId: string, queryParams: { [key: string]: string | undefined } | null) {
  try {
    const limit = queryParams?.limit ? parseInt(queryParams.limit) : 50;
    const startDate = queryParams?.startDate;
    const endDate = queryParams?.endDate;
    
    let keyConditionExpression = 'GSI2PK = :gsi2pk';
    const expressionAttributeValues: any = {
      ':gsi2pk': `teacher#${teacherId}#behavior`
    };
    
    if (startDate && endDate) {
      keyConditionExpression += ' AND GSI2SK BETWEEN :startDate AND :endDate';
      expressionAttributeValues[':startDate'] = startDate;
      expressionAttributeValues[':endDate'] = endDate;
    } else if (startDate) {
      keyConditionExpression += ' AND GSI2SK >= :startDate';
      expressionAttributeValues[':startDate'] = startDate;
    } else if (endDate) {
      keyConditionExpression += ' AND GSI2SK <= :endDate';
      expressionAttributeValues[':endDate'] = endDate;
    }

    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI2',
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      Limit: limit,
      ScanIndexForward: false // Most recent first
    });

    const result = await docClient.send(command);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        behaviorRecords: result.Items || [],
        count: result.Items?.length || 0,
        teacherId,
        lastEvaluatedKey: result.LastEvaluatedKey
      })
    };
  } catch (error) {
    logger.error('Error getting teacher behavior records', { error, teacherId });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to get teacher behavior records' })
    };
  }
}

async function getClassBehaviorRecords(classId: string, queryParams: { [key: string]: string | undefined } | null) {
  try {
    const limit = queryParams?.limit ? parseInt(queryParams.limit) : 50;
    const type = queryParams?.type as BehaviorType | undefined;
    const severity = queryParams?.severity;
    
    const filterExpressions = ['classId = :classId'];
    const expressionAttributeValues: any = {
      ':classId': classId
    };
    
    if (type) {
      filterExpressions.push('#type = :type');
      expressionAttributeValues[':type'] = type;
    }
    
    if (severity) {
      filterExpressions.push('severity = :severity');
      expressionAttributeValues[':severity'] = severity;
    }

    const command = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: filterExpressions.join(' AND '),
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: type ? { '#type': 'type' } : undefined,
      Limit: limit
    });

    const result = await docClient.send(command);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        behaviorRecords: result.Items || [],
        count: result.Items?.length || 0,
        classId,
        lastEvaluatedKey: result.LastEvaluatedKey
      })
    };
  } catch (error) {
    logger.error('Error getting class behavior records', { error, classId });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to get class behavior records' })
    };
  }
}