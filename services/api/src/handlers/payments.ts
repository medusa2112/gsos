import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { randomUUID } from 'node:crypto';

// Payment types
type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded';
type PaymentMethod = 'card' | 'bank_transfer' | 'cash' | 'cheque' | 'stripe' | 'other';

type Payment = {
  id: string;
  schoolId: string;
  studentId: string;
  invoiceId?: string;
  // Payment Details
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  reference?: string;
  description?: string;
  // Stripe Integration
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  stripeCustomerId?: string;
  // Refund Information
  refundedAmount?: number;
  refundReason?: string;
  refundedAt?: string;
  // Metadata
  paymentDate: string;
  processedBy?: string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
};

type CreatePaymentRequest = Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>;
type UpdatePaymentRequest = Partial<Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>>;

const logger = new Logger({ serviceName: 'payments-handler' });
const tracer = new Tracer({ serviceName: 'payments-handler' });

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME!;

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  logger.info('Payments handler invoked', { event });

  try {
    const method = event.requestContext.http.method;
    const path = event.rawPath;
    const pathParameters = event.pathParameters || {};

    // Route handling
    if (method === 'GET' && path === '/payments') {
      return await listPayments(event.queryStringParameters || null);
    }
    
    if (method === 'POST' && path === '/payments') {
      return await createPayment(event.body || null);
    }
    
    if (method === 'GET' && pathParameters.id) {
      return await getPayment(pathParameters.id);
    }
    
    if (method === 'PUT' && pathParameters.id) {
      return await updatePayment(pathParameters.id, event.body || null);
    }
    
    if (method === 'DELETE' && pathParameters.id) {
      return await deletePayment(pathParameters.id);
    }

    // Special endpoints for payment management
    if (method === 'GET' && path === '/payments/student/{studentId}') {
      return await getStudentPayments(pathParameters.studentId!);
    }

    if (method === 'GET' && path === '/payments/school/{schoolId}') {
      return await getSchoolPayments(pathParameters.schoolId!);
    }

    if (method === 'GET' && path === '/payments/invoice/{invoiceId}') {
      return await getInvoicePayments(pathParameters.invoiceId!);
    }

    if (method === 'POST' && path === '/payments/{id}/refund') {
      return await refundPayment(pathParameters.id!, event.body || null);
    }

    if (method === 'POST' && path === '/payments/stripe/webhook') {
      return await handleStripeWebhook(event.body || null, event.headers);
    }

    if (method === 'POST' && path === '/payments/stripe/create-intent') {
      return await createStripePaymentIntent(event.body || null);
    }

    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Route not found' })
    };

  } catch (error) {
    logger.error('Error in payments handler', { error });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

async function listPayments(queryParams: { [key: string]: string | undefined } | null) {
  try {
    const schoolId = queryParams?.schoolId;
    const studentId = queryParams?.studentId;
    const status = queryParams?.status as PaymentStatus | undefined;
    const method = queryParams?.method as PaymentMethod | undefined;
    const limit = queryParams?.limit ? parseInt(queryParams.limit) : 50;
    
    let command;
    
    if (schoolId) {
      // Query by school
      let keyConditionExpression = 'GSI1PK = :gsi1pk';
      const expressionAttributeValues: any = {
        ':gsi1pk': `school#${schoolId}#payments`
      };
      
      const filterExpressions = [];
      
      if (status) {
        filterExpressions.push('#status = :status');
        expressionAttributeValues[':status'] = status;
      }
      
      if (method) {
        filterExpressions.push('#method = :method');
        expressionAttributeValues[':method'] = method;
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
        ExpressionAttributeNames: {
          ...(status && { '#status': 'status' }),
          ...(method && { '#method': 'method' })
        },
        Limit: limit,
        ScanIndexForward: false // Most recent first
      });
    } else {
      // Scan all payments
      const filterExpressions = [];
      const expressionAttributeValues: any = {};
      
      if (status) {
        filterExpressions.push('#status = :status');
        expressionAttributeValues[':status'] = status;
      }
      
      if (method) {
        filterExpressions.push('#method = :method');
        expressionAttributeValues[':method'] = method;
      }
      
      if (studentId) {
        filterExpressions.push('studentId = :studentId');
        expressionAttributeValues[':studentId'] = studentId;
      }
      
      command = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: filterExpressions.length > 0 ? filterExpressions.join(' AND ') : undefined,
        ExpressionAttributeValues: Object.keys(expressionAttributeValues).length > 0 ? expressionAttributeValues : undefined,
        ExpressionAttributeNames: {
          ...(status && { '#status': 'status' }),
          ...(method && { '#method': 'method' })
        },
        Limit: limit
      });
    }

    const result = await docClient.send(command);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        payments: result.Items || [],
        count: result.Items?.length || 0,
        lastEvaluatedKey: result.LastEvaluatedKey
      })
    };
  } catch (error) {
    logger.error('Error listing payments', { error });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to list payments' })
    };
  }
}

async function getPayment(paymentId: string) {
  try {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { 
        pk: `payment#${paymentId}`,
        sk: `payment#${paymentId}`
      }
    });

    const result = await docClient.send(command);
    
    if (!result.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Payment not found' })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment: result.Item })
    };
  } catch (error) {
    logger.error('Error getting payment', { error, paymentId });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to get payment' })
    };
  }
}

async function createPayment(body: string | null) {
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
    if (!data.schoolId || !data.studentId || !data.amount || !data.currency || !data.method || !data.paymentDate) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required fields: schoolId, studentId, amount, currency, method, paymentDate' })
      };
    }
    
    const validatedData = data as CreatePaymentRequest;
    
    const paymentId = randomUUID();
    const now = new Date().toISOString();
    
    const payment: Payment = {
      id: paymentId,
      ...validatedData,
      status: validatedData.status || 'pending',
      refundedAmount: validatedData.refundedAmount || 0,
      createdAt: now,
      updatedAt: now
    };

    // Store in DynamoDB with multiple access patterns
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        pk: `payment#${paymentId}`,
        sk: `payment#${paymentId}`,
        GSI1PK: `school#${payment.schoolId}#payments`,
        GSI1SK: now,
        GSI2PK: `student#${payment.studentId}#payments`,
        GSI2SK: now,
        ...(payment.invoiceId && {
          GSI3PK: `invoice#${payment.invoiceId}#payments`,
          GSI3SK: now
        }),
        ...payment
      }
    });

    await docClient.send(command);
    
    logger.info('Payment created', { paymentId, schoolId: payment.schoolId, studentId: payment.studentId, amount: payment.amount });
    
    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment })
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }
    
    logger.error('Error creating payment', { error });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to create payment' })
    };
  }
}

async function updatePayment(paymentId: string, body: string | null) {
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
    const validatedData = data as UpdatePaymentRequest;
    
    // Check if record exists
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: { 
        pk: `payment#${paymentId}`,
        sk: `payment#${paymentId}`
      }
    });

    const existingRecord = await docClient.send(getCommand);
    
    if (!existingRecord.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Payment not found' })
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
        pk: `payment#${paymentId}`,
        sk: `payment#${paymentId}`
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(updateCommand);
    
    logger.info('Payment updated', { paymentId });
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment: result.Attributes })
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }
    
    logger.error('Error updating payment', { error, paymentId });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to update payment' })
    };
  }
}

async function deletePayment(paymentId: string) {
  try {
    // Check if record exists
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: { 
        pk: `payment#${paymentId}`,
        sk: `payment#${paymentId}`
      }
    });

    const existingRecord = await docClient.send(getCommand);
    
    if (!existingRecord.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Payment not found' })
      };
    }

    // Check if payment can be deleted (only pending/failed)
    if (!['pending', 'failed', 'cancelled'].includes(existingRecord.Item.status)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Only pending, failed, or cancelled payments can be deleted' })
      };
    }

    const deleteCommand = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { 
        pk: `payment#${paymentId}`,
        sk: `payment#${paymentId}`
      }
    });

    await docClient.send(deleteCommand);
    
    logger.info('Payment deleted', { paymentId });
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Payment deleted successfully' })
    };
  } catch (error) {
    logger.error('Error deleting payment', { error, paymentId });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to delete payment' })
    };
  }
}

async function getStudentPayments(studentId: string) {
  try {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :gsi2pk',
      ExpressionAttributeValues: {
        ':gsi2pk': `student#${studentId}#payments`
      },
      ScanIndexForward: false // Most recent first
    });

    const result = await docClient.send(command);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        payments: result.Items || [],
        count: result.Items?.length || 0,
        studentId
      })
    };
  } catch (error) {
    logger.error('Error getting student payments', { error, studentId });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to get student payments' })
    };
  }
}

async function getSchoolPayments(schoolId: string) {
  try {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :gsi1pk',
      ExpressionAttributeValues: {
        ':gsi1pk': `school#${schoolId}#payments`
      },
      ScanIndexForward: false // Most recent first
    });

    const result = await docClient.send(command);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        payments: result.Items || [],
        count: result.Items?.length || 0,
        schoolId
      })
    };
  } catch (error) {
    logger.error('Error getting school payments', { error, schoolId });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to get school payments' })
    };
  }
}

async function getInvoicePayments(invoiceId: string) {
  try {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'GSI3',
      KeyConditionExpression: 'GSI3PK = :gsi3pk',
      ExpressionAttributeValues: {
        ':gsi3pk': `invoice#${invoiceId}#payments`
      },
      ScanIndexForward: false // Most recent first
    });

    const result = await docClient.send(command);
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        payments: result.Items || [],
        count: result.Items?.length || 0,
        invoiceId
      })
    };
  } catch (error) {
    logger.error('Error getting invoice payments', { error, invoiceId });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to get invoice payments' })
    };
  }
}

async function refundPayment(paymentId: string, body: string | null) {
  try {
    // Check if payment exists
    const getCommand = new GetCommand({
      TableName: TABLE_NAME,
      Key: { 
        pk: `payment#${paymentId}`,
        sk: `payment#${paymentId}`
      }
    });

    const result = await docClient.send(getCommand);
    
    if (!result.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Payment not found' })
      };
    }

    const payment = result.Item as Payment;

    if (payment.status !== 'succeeded') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Only succeeded payments can be refunded' })
      };
    }

    const refundData = body ? JSON.parse(body) : {};
    const refundAmount = refundData.amount || payment.amount;
    const refundReason = refundData.reason || 'Refund requested';

    if (refundAmount > (payment.amount - (payment.refundedAmount || 0))) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Refund amount exceeds available amount' })
      };
    }

    const now = new Date().toISOString();
    const totalRefunded = (payment.refundedAmount || 0) + refundAmount;
    const newStatus = totalRefunded >= payment.amount ? 'refunded' : 'partially_refunded';

    // TODO: Integrate with Stripe for actual refund processing
    // if (payment.stripePaymentIntentId) {
    //   // Process Stripe refund
    // }

    const updateCommand = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { 
        pk: `payment#${paymentId}`,
        sk: `payment#${paymentId}`
      },
      UpdateExpression: 'SET #status = :status, refundedAmount = :refundedAmount, refundReason = :refundReason, refundedAt = :refundedAt, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': newStatus,
        ':refundedAmount': totalRefunded,
        ':refundReason': refundReason,
        ':refundedAt': now,
        ':updatedAt': now
      },
      ReturnValues: 'ALL_NEW'
    });

    const updateResult = await docClient.send(updateCommand);
    
    logger.info('Payment refunded', { paymentId, refundAmount, totalRefunded });
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        payment: updateResult.Attributes,
        refundAmount,
        message: 'Payment refunded successfully'
      })
    };
  } catch (error) {
    logger.error('Error refunding payment', { error, paymentId });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to refund payment' })
    };
  }
}

async function createStripePaymentIntent(body: string | null) {
  try {
    if (!body) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Request body is required' })
      };
    }

    const data = JSON.parse(body);
    
    if (!data.amount || !data.currency || !data.studentId || !data.schoolId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing required fields: amount, currency, studentId, schoolId' })
      };
    }

    // TODO: Integrate with Stripe SDK
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: data.amount * 100, // Convert to cents
    //   currency: data.currency,
    //   metadata: {
    //     studentId: data.studentId,
    //     schoolId: data.schoolId,
    //     invoiceId: data.invoiceId || ''
    //   }
    // });

    // For now, return a mock response
    const mockPaymentIntent = {
      id: `pi_mock_${randomUUID().slice(0, 8)}`,
      client_secret: `pi_mock_${randomUUID().slice(0, 8)}_secret_mock`,
      amount: data.amount * 100,
      currency: data.currency,
      status: 'requires_payment_method'
    };
    
    logger.info('Stripe payment intent created (mock)', { 
      paymentIntentId: mockPaymentIntent.id,
      amount: data.amount,
      studentId: data.studentId
    });
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        paymentIntent: mockPaymentIntent,
        message: 'Payment intent created successfully (mock)'
      })
    };
  } catch (error) {
    logger.error('Error creating Stripe payment intent', { error });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to create payment intent' })
    };
  }
}

async function handleStripeWebhook(body: string | null, headers: { [key: string]: string | undefined }) {
  try {
    if (!body) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Request body is required' })
      };
    }

    // TODO: Verify Stripe webhook signature
    // const sig = headers['stripe-signature'];
    // const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    // const event = stripe.webhooks.constructEvent(body, sig, endpointSecret);

    // For now, parse the body as JSON
    const event = JSON.parse(body);
    
    logger.info('Stripe webhook received', { eventType: event.type });

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      case 'charge.dispute.created':
        await handleChargeDispute(event.data.object);
        break;
      default:
        logger.info('Unhandled Stripe webhook event', { eventType: event.type });
    }
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ received: true })
    };
  } catch (error) {
    logger.error('Error handling Stripe webhook', { error });
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to handle webhook' })
    };
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  try {
    // Find payment record by Stripe payment intent ID
    const scanCommand = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'stripePaymentIntentId = :paymentIntentId',
      ExpressionAttributeValues: {
        ':paymentIntentId': paymentIntent.id
      }
    });

    const result = await docClient.send(scanCommand);
    
    if (result.Items && result.Items.length > 0) {
      const payment = result.Items[0];
      const now = new Date().toISOString();

      // Update payment status
      const updateCommand = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { 
          pk: payment.pk,
          sk: payment.sk
        },
        UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': 'succeeded',
          ':updatedAt': now
        }
      });

      await docClient.send(updateCommand);
      
      logger.info('Payment status updated to succeeded', { paymentId: payment.id });
    }
  } catch (error) {
    logger.error('Error handling payment intent succeeded', { error, paymentIntentId: paymentIntent.id });
  }
}

async function handlePaymentIntentFailed(paymentIntent: any) {
  try {
    // Find payment record by Stripe payment intent ID
    const scanCommand = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: 'stripePaymentIntentId = :paymentIntentId',
      ExpressionAttributeValues: {
        ':paymentIntentId': paymentIntent.id
      }
    });

    const result = await docClient.send(scanCommand);
    
    if (result.Items && result.Items.length > 0) {
      const payment = result.Items[0];
      const now = new Date().toISOString();

      // Update payment status
      const updateCommand = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { 
          pk: payment.pk,
          sk: payment.sk
        },
        UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': 'failed',
          ':updatedAt': now
        }
      });

      await docClient.send(updateCommand);
      
      logger.info('Payment status updated to failed', { paymentId: payment.id });
    }
  } catch (error) {
    logger.error('Error handling payment intent failed', { error, paymentIntentId: paymentIntent.id });
  }
}

async function handleChargeDispute(dispute: any) {
  try {
    logger.info('Charge dispute created', { disputeId: dispute.id, chargeId: dispute.charge });
    
    // TODO: Implement dispute handling logic
    // - Find related payment
    // - Update payment status
    // - Notify administrators
    // - Create dispute record
    
  } catch (error) {
    logger.error('Error handling charge dispute', { error, disputeId: dispute.id });
  }
}