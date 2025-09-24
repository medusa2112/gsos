import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { randomUUID } from 'node:crypto';

// Admission types
type AdmissionStatus = 'pending' | 'under_review' | 'interview_scheduled' | 'assessment_scheduled' | 'offer_made' | 'offer_accepted' | 'offer_declined' | 'rejected' | 'withdrawn';

type Guardian = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  relationship: 'mother' | 'father' | 'guardian' | 'other';
  isPrimary: boolean;
};

type Document = {
  type: string;
  filename: string;
  s3Key: string;
  uploadedAt: string;
};

type Admission = {
  id: string;
  schoolId: string;
  // Application Information
  applicationNumber: string;
  status: AdmissionStatus;
  appliedGrade: string;
  appliedYearGroup: string;
  preferredStartDate: string;
  // Student Information (before enrollment)
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  nationality?: string;
  previousSchool?: string;
  // Guardian Information
  guardians: Guardian[];
  // Documents
  documents: Document[];
  // Assessment
  assessmentScore?: number;
  assessmentNotes?: string;
  // Decision
  decisionDate?: string;
  decisionBy?: string;
  decisionNotes?: string;
  offerLetterSent: boolean;
  offerAccepted?: boolean;
  offerAcceptedAt?: string;
  // Conversion to student
  studentId?: string;
  createdAt: string;
  updatedAt: string;
};

type CreateAdmissionRequest = Omit<Admission, 'id' | 'applicationNumber' | 'createdAt' | 'updatedAt'>;
type UpdateAdmissionRequest = Partial<Omit<Admission, 'id' | 'applicationNumber' | 'createdAt' | 'updatedAt'>>;

const logger = new Logger({ serviceName: 'admissions-handler' });
const tracer = new Tracer({ serviceName: 'admissions-handler' });

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME!;

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  logger.info('Admissions handler invoked', { event });

  try {
    const method = event.requestContext.http.method;
    const path = event.rawPath;
    const pathParameters = event.pathParameters || {};

    // Route handling
    if (method === 'GET' && path === '/admissions') {
      return await listAdmissions(event.queryStringParameters || null);
    }
    
    if (method === 'POST' && path === '/admissions') {
      return await createAdmission(event.body || null);
    }
    
    if (method === 'GET' && pathParameters.id) {
      return await getAdmission(pathParameters.id);
    }
    
    if (method === 'PUT' && pathParameters.id) {
      return await updateAdmission(pathParameters.id, event.body || null);
    }
    
    if (method === 'DELETE' && pathParameters.id) {
      return await deleteAdmission(pathParameters.id);
    }

    // Special endpoints for admission management
    if (method === 'POST' && path === '/admissions/{id}/documents') {
      return await uploadDocument(pathParameters.id!, event.body || null);
    }

    if (method === 'POST' && path === '/admissions/{id}/assessment') {
      return await recordAssessment(pathParameters.id!, event.body || null);
    }

    if (method === 'POST' && path === '/admissions/{id}/decision') {
      return await recordDecision(pathParameters.id!, event.body || null);
    }

    if (method === 'POST' && path === '/admissions/{id}/convert') {
      return await convertToStudent(pathParameters.id!, event.body || null);
    }

    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Route not found' })
    };

  } catch (error) {
    logger.error('Error in admissions handler', { error });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

async function listAdmissions(queryParams: { [key: string]: string | undefined } | null) {
  try {
    const schoolId = queryParams?.schoolId;
    const status = queryParams?.status as AdmissionStatus | undefined;
    const appliedGrade = queryParams?.appliedGrade;
    const limit = queryParams?.limit ? parseInt(queryParams.limit) : 50;
    
    let command;
    
    if (schoolId) {
      // Query by school
      let keyConditionExpression = 'GSI1PK = :gsi1pk';
      const expressionAttributeValues: any = {
        ':gsi1pk': `school#${schoolId}#admissions`
      };
      
      const filterExpressions = [];
      
      if (status) {
        filterExpressions.push('#status = :status');
        expressionAttributeValues[':status'] = status;
      }
      
      if (appliedGrade) {
        filterExpressions.push('appliedGrade = :appliedGrade');
        expressionAttributeValues[':appliedGrade'] = appliedGrade;
      }
      
      command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI1',
        KeyConditionExpression: keyConditionExpression,
        FilterExpression: filterExpressions.length > 0 ? filterExpressions.join(' AND ') : undefined,
        ExpressionAttributeValues: expressionAttributeValues,
        ExpressionAttributeNames: status ? { '#status': 'status' } : undefined,
        Limit: limit,
        ScanIndexForward: false // Most recent first
      });
    } else {
      // Scan all admissions
      const filterExpressions = [];
      const expressionAttributeValues: any = {};
      
      if (status) {
        filterExpressions.push('#status = :status');
        expressionAttributeValues[':status'] = status;
      }
      
      if (appliedGrade) {
        filterExpressions.push('appliedGrade = :appliedGrade');
        expressionAttributeValues[':appliedGrade'] = appliedGrade;
      }
      
      command = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: filterExpressions.length > 0 ? filterExpressions.join(' AND ') : undefined,
        ExpressionAttributeValues: Object.keys(expressionAttributeValues).length > 0 ? expressionAttributeValues : undefined,
        ExpressionAttributeNames: status ? { '#status': 'status' } : undefined,
        Limit: limit
      });
    }

    const result = await docClient.send(command);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        admissions: result.Items || [],
        count: result.Items?.length || 0,
        lastEvaluatedKey: result.LastEvaluatedKey
      })
    };
  } catch (error) {
    logger.error('Error listing admissions', { error });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to list admissions' })
    };
  }
}

async function getAdmission(admissionId: string) {
  try {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { 
        pk: `admission#${admissionId}`,
        sk: `admission#${admissionId}`
      }
    });

    const result = await docClient.send(command);
    
    if (!result.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Admission not found' })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admission: result.Item })
    };
  } catch (error) {
    logger.error('Error getting admission', { error, admissionId });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to get admission' })
    };
  }
}

async function createAdmission(body: string | null) {
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
    if (!data.schoolId || !data.firstName || !data.lastName || !data.dateOfBirth || !data.appliedGrade || !data.guardians || !Array.isArray(data.guardians) || data.guardians.length === 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required fields: schoolId, firstName, lastName, dateOfBirth, appliedGrade, guardians' })
      };
    }
    
    const validatedData = data as CreateAdmissionRequest;
    
    const admissionId = randomUUID();
    const now = new Date().toISOString();
    const year = new Date().getFullYear();
    const applicationNumber = `APP-${year}-${admissionId.slice(0, 8).toUpperCase()}`;
    
    const admission: Admission = {
      id: admissionId,
      applicationNumber,
      ...validatedData,
      status: validatedData.status || 'pending',
      documents: validatedData.documents || [],
      offerLetterSent: validatedData.offerLetterSent || false,
      createdAt: now,
      updatedAt: now
    };

    // Store in DynamoDB with multiple access patterns
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: `admission#${admissionId}`,
        sk: `admission#${admissionId}`,
        GSI1PK: `school#${admission.schoolId}#admissions`,
        GSI1SK: now,
        GSI2PK: `status#${admission.status}`,
        GSI2SK: now,
        ...admission
      }
    });

    await docClient.send(command);
    
    logger.info('Admission created', { admissionId, applicationNumber, schoolId: admission.schoolId });
    
    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admission })
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }
    
    logger.error('Error creating admission', { error });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to create admission' })
    };
  }
}

async function updateAdmission(admissionId: string, body: string | null) {
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
    const validatedData = data as UpdateAdmissionRequest;
    
    // Check if record exists
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: { 
        pk: `admission#${admissionId}`,
        sk: `admission#${admissionId}`
      }
    });

    const existingRecord = await docClient.send(getCommand);
    
    if (!existingRecord.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Admission not found' })
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

    // Update GSI2 if status changed
    if (validatedData.status) {
      updateExpressions.push('GSI2PK = :gsi2pk');
      expressionAttributeValues[':gsi2pk'] = `status#${validatedData.status}`;
    }

    const updateCommand = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { 
        pk: `admission#${admissionId}`,
        sk: `admission#${admissionId}`
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(updateCommand);
    
    logger.info('Admission updated', { admissionId });
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admission: result.Attributes })
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }
    
    logger.error('Error updating admission', { error, admissionId });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to update admission' })
    };
  }
}

async function deleteAdmission(admissionId: string) {
  try {
    // Check if record exists
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: { 
        pk: `admission#${admissionId}`,
        sk: `admission#${admissionId}`
      }
    });

    const existingRecord = await docClient.send(getCommand);
    
    if (!existingRecord.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Admission not found' })
      };
    }

    const deleteCommand = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { 
        pk: `admission#${admissionId}`,
        sk: `admission#${admissionId}`
      }
    });

    await docClient.send(deleteCommand);
    
    logger.info('Admission deleted', { admissionId });
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Admission deleted successfully' })
    };
  } catch (error) {
    logger.error('Error deleting admission', { error, admissionId });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to delete admission' })
    };
  }
}

async function uploadDocument(admissionId: string, body: string | null) {
  try {
    if (!body) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Request body is required' })
      };
    }

    const data = JSON.parse(body);
    
    if (!data.type || !data.filename || !data.s3Key) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required fields: type, filename, s3Key' })
      };
    }

    // Get existing admission
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: { 
        pk: `admission#${admissionId}`,
        sk: `admission#${admissionId}`
      }
    });

    const result = await docClient.send(getCommand);
    
    if (!result.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Admission not found' })
      };
    }

    const now = new Date().toISOString();
    const newDocument: Document = {
      type: data.type,
      filename: data.filename,
      s3Key: data.s3Key,
      uploadedAt: now
    };

    const existingDocuments = result.Item.documents || [];
    const updatedDocuments = [...existingDocuments, newDocument];

    const updateCommand = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { 
        pk: `admission#${admissionId}`,
        sk: `admission#${admissionId}`
      },
      UpdateExpression: 'SET documents = :documents, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':documents': updatedDocuments,
        ':updatedAt': now
      },
      ReturnValues: 'ALL_NEW'
    });

    const updateResult = await docClient.send(updateCommand);
    
    logger.info('Document uploaded to admission', { admissionId, documentType: data.type });
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admission: updateResult.Attributes })
    };
  } catch (error) {
    logger.error('Error uploading document', { error, admissionId });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to upload document' })
    };
  }
}

async function recordAssessment(admissionId: string, body: string | null) {
  try {
    if (!body) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Request body is required' })
      };
    }

    const data = JSON.parse(body);
    
    // Check if admission exists
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: { 
        pk: `admission#${admissionId}`,
        sk: `admission#${admissionId}`
      }
    });

    const result = await docClient.send(getCommand);
    
    if (!result.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Admission not found' })
      };
    }

    const now = new Date().toISOString();
    
    const updateExpressions = ['updatedAt = :updatedAt'];
    const expressionAttributeValues: any = {
      ':updatedAt': now
    };
    
    if (data.assessmentScore !== undefined) {
      updateExpressions.push('assessmentScore = :assessmentScore');
      expressionAttributeValues[':assessmentScore'] = data.assessmentScore;
    }
    
    if (data.assessmentNotes !== undefined) {
      updateExpressions.push('assessmentNotes = :assessmentNotes');
      expressionAttributeValues[':assessmentNotes'] = data.assessmentNotes;
    }

    const updateCommand = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { 
        pk: `admission#${admissionId}`,
        sk: `admission#${admissionId}`
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    const updateResult = await docClient.send(updateCommand);
    
    logger.info('Assessment recorded for admission', { admissionId });
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admission: updateResult.Attributes })
    };
  } catch (error) {
    logger.error('Error recording assessment', { error, admissionId });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to record assessment' })
    };
  }
}

async function recordDecision(admissionId: string, body: string | null) {
  try {
    if (!body) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Request body is required' })
      };
    }

    const data = JSON.parse(body);
    
    if (!data.status || !data.decisionBy) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required fields: status, decisionBy' })
      };
    }

    // Check if admission exists
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: { 
        pk: `admission#${admissionId}`,
        sk: `admission#${admissionId}`
      }
    });

    const result = await docClient.send(getCommand);
    
    if (!result.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Admission not found' })
      };
    }

    const now = new Date().toISOString();

    const updateCommand = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { 
        pk: `admission#${admissionId}`,
        sk: `admission#${admissionId}`
      },
      UpdateExpression: 'SET #status = :status, decisionDate = :decisionDate, decisionBy = :decisionBy, decisionNotes = :decisionNotes, GSI2PK = :gsi2pk, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': data.status,
        ':decisionDate': now.split('T')[0], // Date only
        ':decisionBy': data.decisionBy,
        ':decisionNotes': data.decisionNotes || '',
        ':gsi2pk': `status#${data.status}`,
        ':updatedAt': now
      },
      ReturnValues: 'ALL_NEW'
    });

    const updateResult = await docClient.send(updateCommand);
    
    logger.info('Decision recorded for admission', { admissionId, status: data.status });
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admission: updateResult.Attributes })
    };
  } catch (error) {
    logger.error('Error recording decision', { error, admissionId });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to record decision' })
    };
  }
}

async function convertToStudent(admissionId: string, body: string | null) {
  try {
    // Check if admission exists and is in the right state
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: { 
        pk: `admission#${admissionId}`,
        sk: `admission#${admissionId}`
      }
    });

    const result = await docClient.send(getCommand);
    
    if (!result.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Admission not found' })
      };
    }

    const admission = result.Item as Admission;
    
    if (admission.status !== 'offer_accepted') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Admission must have offer_accepted status to convert to student' })
      };
    }

    if (admission.studentId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Admission has already been converted to student', studentId: admission.studentId })
      };
    }

    const studentId = randomUUID();
    const now = new Date().toISOString();

    // Create student record
    const student = {
      id: studentId,
      schoolId: admission.schoolId,
      firstName: admission.firstName,
      lastName: admission.lastName,
      dateOfBirth: admission.dateOfBirth,
      grade: admission.appliedGrade,
      guardianIds: [], // Will need to be populated separately
      enrollmentDate: admission.preferredStartDate,
      status: 'active',
      gender: admission.gender,
      nationality: admission.nationality,
      previousSchool: admission.previousSchool,
      createdAt: now,
      updatedAt: now
    };

    // Store student record
    const putStudentCommand = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: `student#${studentId}`,
        sk: `student#${studentId}`,
        GSI1PK: `school#${student.schoolId}#students`,
        GSI1SK: now,
        ...student
      }
    });

    await docClient.send(putStudentCommand);

    // Update admission with student ID
    const updateAdmissionCommand = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { 
        pk: `admission#${admissionId}`,
        sk: `admission#${admissionId}`
      },
      UpdateExpression: 'SET studentId = :studentId, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':studentId': studentId,
        ':updatedAt': now
      },
      ReturnValues: 'ALL_NEW'
    });

    const updateResult = await docClient.send(updateAdmissionCommand);
    
    logger.info('Admission converted to student', { admissionId, studentId });
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        admission: updateResult.Attributes,
        student,
        message: 'Admission successfully converted to student'
      })
    };
  } catch (error) {
    logger.error('Error converting admission to student', { error, admissionId });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to convert admission to student' })
    };
  }
}