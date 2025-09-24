import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { randomUUID } from 'node:crypto';

// Invoice types
type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'overdue' | 'paid' | 'cancelled' | 'refunded';

type InvoiceLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  category?: string;
};

type Invoice = {
  id: string;
  schoolId: string;
  studentId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  // Invoice Details
  title: string;
  description?: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  // Dates
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  // Payment
  paymentMethod?: string;
  paymentReference?: string;
  stripeInvoiceId?: string;
  stripePaymentIntentId?: string;
  // Metadata
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

type CreateInvoiceRequest = Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>;
type UpdateInvoiceRequest = Partial<Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>>;

const logger = new Logger({ serviceName: 'invoices-handler' });
const tracer = new Tracer({ serviceName: 'invoices-handler' });

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME!;

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  logger.info('Invoices handler invoked', { event });

  try {
    const method = event.requestContext.http.method;
    const path = event.rawPath;
    const pathParameters = event.pathParameters || {};

    // Route handling
    if (method === 'GET' && path === '/invoices') {
      return await listInvoices(event.queryStringParameters || null);
    }
    
    if (method === 'POST' && path === '/invoices') {
      return await createInvoice(event.body || null);
    }
    
    if (method === 'GET' && pathParameters.id) {
      return await getInvoice(pathParameters.id);
    }
    
    if (method === 'PUT' && pathParameters.id) {
      return await updateInvoice(pathParameters.id, event.body || null);
    }
    
    if (method === 'DELETE' && pathParameters.id) {
      return await deleteInvoice(pathParameters.id);
    }

    // Special endpoints for invoice management
    if (method === 'GET' && path === '/invoices/student/{studentId}') {
      return await getStudentInvoices(pathParameters.studentId!);
    }

    if (method === 'GET' && path === '/invoices/school/{schoolId}') {
      return await getSchoolInvoices(pathParameters.schoolId!);
    }

    if (method === 'POST' && path === '/invoices/{id}/send') {
      return await sendInvoice(pathParameters.id!);
    }

    if (method === 'POST' && path === '/invoices/{id}/mark-paid') {
      return await markInvoicePaid(pathParameters.id!, event.body || null);
    }

    if (method === 'POST' && path === '/invoices/{id}/cancel') {
      return await cancelInvoice(pathParameters.id!);
    }

    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Route not found' })
    };

  } catch (error) {
    logger.error('Error in invoices handler', { error });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

async function listInvoices(queryParams: { [key: string]: string | undefined } | null) {
  try {
    const schoolId = queryParams?.schoolId;
    const studentId = queryParams?.studentId;
    const status = queryParams?.status as InvoiceStatus | undefined;
    const limit = queryParams?.limit ? parseInt(queryParams.limit) : 50;
    
    let command;
    
    if (schoolId) {
      // Query by school
      let keyConditionExpression = 'GSI1PK = :gsi1pk';
      const expressionAttributeValues: any = {
        ':gsi1pk': `school#${schoolId}#invoices`
      };
      
      const filterExpressions = [];
      
      if (status) {
        filterExpressions.push('#status = :status');
        expressionAttributeValues[':status'] = status;
      }
      
      if (studentId) {
        filterExpressions.push('studentId = :studentId');
        expressionAttributeValues[':studentId'] = studentId;
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
      // Scan all invoices
      const filterExpressions = [];
      const expressionAttributeValues: any = {};
      
      if (status) {
        filterExpressions.push('#status = :status');
        expressionAttributeValues[':status'] = status;
      }
      
      if (studentId) {
        filterExpressions.push('studentId = :studentId');
        expressionAttributeValues[':studentId'] = studentId;
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
        invoices: result.Items || [],
        count: result.Items?.length || 0,
        lastEvaluatedKey: result.LastEvaluatedKey
      })
    };
  } catch (error) {
    logger.error('Error listing invoices', { error });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to list invoices' })
    };
  }
}

async function getInvoice(invoiceId: string) {
  try {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { 
        pk: `invoice#${invoiceId}`,
        sk: `invoice#${invoiceId}`
      }
    });

    const result = await docClient.send(command);
    
    if (!result.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invoice not found' })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice: result.Item })
    };
  } catch (error) {
    logger.error('Error getting invoice', { error, invoiceId });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to get invoice' })
    };
  }
}

async function createInvoice(body: string | null) {
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
    if (!data.schoolId || !data.studentId || !data.title || !data.lineItems || !Array.isArray(data.lineItems) || data.lineItems.length === 0 || !data.dueDate || !data.createdBy) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required fields: schoolId, studentId, title, lineItems, dueDate, createdBy' })
      };
    }
    
    const validatedData = data as CreateInvoiceRequest;
    
    // Calculate totals
    const subtotal = validatedData.lineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxRate = validatedData.taxRate || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    
    const invoiceId = randomUUID();
    const now = new Date().toISOString();
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const invoiceNumber = `INV-${year}${month}-${invoiceId.slice(0, 8).toUpperCase()}`;
    
    const invoice: Invoice = {
      id: invoiceId,
      invoiceNumber,
      ...validatedData,
      status: validatedData.status || 'draft',
      subtotal,
      taxAmount,
      total,
      currency: validatedData.currency || 'GBP',
      issueDate: validatedData.issueDate || now.split('T')[0],
      createdAt: now,
      updatedAt: now
    };

    // Store in DynamoDB with multiple access patterns
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: `invoice#${invoiceId}`,
        sk: `invoice#${invoiceId}`,
        GSI1PK: `school#${invoice.schoolId}#invoices`,
        GSI1SK: now,
        GSI2PK: `student#${invoice.studentId}#invoices`,
        GSI2SK: now,
        ...invoice
      }
    });

    await docClient.send(command);
    
    logger.info('Invoice created', { invoiceId, invoiceNumber, schoolId: invoice.schoolId, studentId: invoice.studentId });
    
    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice })
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }
    
    logger.error('Error creating invoice', { error });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to create invoice' })
    };
  }
}

async function updateInvoice(invoiceId: string, body: string | null) {
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
    const validatedData = data as UpdateInvoiceRequest;
    
    // Check if record exists
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: { 
        pk: `invoice#${invoiceId}`,
        sk: `invoice#${invoiceId}`
      }
    });

    const existingRecord = await docClient.send(getCommand);
    
    if (!existingRecord.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invoice not found' })
      };
    }

    const now = new Date().toISOString();
    
    // Recalculate totals if line items changed
    let updateData = { ...validatedData };
    if (validatedData.lineItems) {
      const subtotal = validatedData.lineItems.reduce((sum, item) => sum + item.amount, 0);
      const taxRate = validatedData.taxRate || existingRecord.Item.taxRate || 0;
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;
      
      updateData = {
        ...updateData,
        subtotal,
        taxAmount,
        total
      };
    }
    
    // Build update expression
    const updateExpressions = [];
    const expressionAttributeNames: any = {};
    const expressionAttributeValues: any = {};
    
    Object.entries(updateData).forEach(([key, value]) => {
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
        pk: `invoice#${invoiceId}`,
        sk: `invoice#${invoiceId}`
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(updateCommand);
    
    logger.info('Invoice updated', { invoiceId });
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice: result.Attributes })
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }
    
    logger.error('Error updating invoice', { error, invoiceId });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to update invoice' })
    };
  }
}

async function deleteInvoice(invoiceId: string) {
  try {
    // Check if record exists
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: { 
        pk: `invoice#${invoiceId}`,
        sk: `invoice#${invoiceId}`
      }
    });

    const existingRecord = await docClient.send(getCommand);
    
    if (!existingRecord.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invoice not found' })
      };
    }

    // Check if invoice can be deleted (only drafts)
    if (existingRecord.Item.status !== 'draft') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Only draft invoices can be deleted' })
      };
    }

    const deleteCommand = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { 
        pk: `invoice#${invoiceId}`,
        sk: `invoice#${invoiceId}`
      }
    });

    await docClient.send(deleteCommand);
    
    logger.info('Invoice deleted', { invoiceId });
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Invoice deleted successfully' })
    };
  } catch (error) {
    logger.error('Error deleting invoice', { error, invoiceId });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to delete invoice' })
    };
  }
}

async function getStudentInvoices(studentId: string) {
  try {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :gsi2pk',
      ExpressionAttributeValues: {
        ':gsi2pk': `student#${studentId}#invoices`
      },
      ScanIndexForward: false // Most recent first
    });

    const result = await docClient.send(command);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        invoices: result.Items || [],
        count: result.Items?.length || 0,
        studentId
      })
    };
  } catch (error) {
    logger.error('Error getting student invoices', { error, studentId });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to get student invoices' })
    };
  }
}

async function getSchoolInvoices(schoolId: string) {
  try {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :gsi1pk',
      ExpressionAttributeValues: {
        ':gsi1pk': `school#${schoolId}#invoices`
      },
      ScanIndexForward: false // Most recent first
    });

    const result = await docClient.send(command);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        invoices: result.Items || [],
        count: result.Items?.length || 0,
        schoolId
      })
    };
  } catch (error) {
    logger.error('Error getting school invoices', { error, schoolId });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to get school invoices' })
    };
  }
}

async function sendInvoice(invoiceId: string) {
  try {
    // Check if invoice exists
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: { 
        pk: `invoice#${invoiceId}`,
        sk: `invoice#${invoiceId}`
      }
    });

    const result = await docClient.send(getCommand);
    
    if (!result.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invoice not found' })
      };
    }

    if (result.Item.status !== 'draft') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Only draft invoices can be sent' })
      };
    }

    const now = new Date().toISOString();

    const updateCommand = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { 
        pk: `invoice#${invoiceId}`,
        sk: `invoice#${invoiceId}`
      },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'sent',
        ':updatedAt': now
      },
      ReturnValues: 'ALL_NEW'
    });

    const updateResult = await docClient.send(updateCommand);
    
    logger.info('Invoice sent', { invoiceId });
    
    // TODO: Integrate with email service to send invoice to guardians
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        invoice: updateResult.Attributes,
        message: 'Invoice sent successfully'
      })
    };
  } catch (error) {
    logger.error('Error sending invoice', { error, invoiceId });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to send invoice' })
    };
  }
}

async function markInvoicePaid(invoiceId: string, body: string | null) {
  try {
    // Check if invoice exists
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: { 
        pk: `invoice#${invoiceId}`,
        sk: `invoice#${invoiceId}`
      }
    });

    const result = await docClient.send(getCommand);
    
    if (!result.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invoice not found' })
      };
    }

    if (result.Item.status === 'paid') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invoice is already marked as paid' })
      };
    }

    const now = new Date().toISOString();
    const paymentData = body ? JSON.parse(body) : {};

    const updateCommand = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { 
        pk: `invoice#${invoiceId}`,
        sk: `invoice#${invoiceId}`
      },
      UpdateExpression: 'SET #status = :status, paidDate = :paidDate, paymentMethod = :paymentMethod, paymentReference = :paymentReference, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'paid',
        ':paidDate': now.split('T')[0], // Date only
        ':paymentMethod': paymentData.paymentMethod || 'manual',
        ':paymentReference': paymentData.paymentReference || '',
        ':updatedAt': now
      },
      ReturnValues: 'ALL_NEW'
    });

    const updateResult = await docClient.send(updateCommand);
    
    logger.info('Invoice marked as paid', { invoiceId });
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        invoice: updateResult.Attributes,
        message: 'Invoice marked as paid successfully'
      })
    };
  } catch (error) {
    logger.error('Error marking invoice as paid', { error, invoiceId });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to mark invoice as paid' })
    };
  }
}

async function cancelInvoice(invoiceId: string) {
  try {
    // Check if invoice exists
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: { 
        pk: `invoice#${invoiceId}`,
        sk: `invoice#${invoiceId}`
      }
    });

    const result = await docClient.send(getCommand);
    
    if (!result.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invoice not found' })
      };
    }

    if (result.Item.status === 'paid') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Paid invoices cannot be cancelled' })
      };
    }

    const now = new Date().toISOString();

    const updateCommand = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { 
        pk: `invoice#${invoiceId}`,
        sk: `invoice#${invoiceId}`
      },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'cancelled',
        ':updatedAt': now
      },
      ReturnValues: 'ALL_NEW'
    });

    const updateResult = await docClient.send(updateCommand);
    
    logger.info('Invoice cancelled', { invoiceId });
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        invoice: updateResult.Attributes,
        message: 'Invoice cancelled successfully'
      })
    };
  } catch (error) {
    logger.error('Error cancelling invoice', { error, invoiceId });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to cancel invoice' })
    };
  }
}