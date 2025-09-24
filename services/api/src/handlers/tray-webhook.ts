import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { createHmac } from 'node:crypto';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({ serviceName: 'tray-webhook' });

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    // Get the webhook secret from environment
    const webhookSecret = process.env.TRAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error('TRAY_WEBHOOK_SECRET environment variable not set');
      return {
        statusCode: 500,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }

    // Get the signature from headers
    const signature = event.headers['x-tray-signature'];
    if (!signature) {
      logger.warn('Missing x-tray-signature header');
      return {
        statusCode: 401,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: 'Missing signature header' })
      };
    }

    // Get the request body
    const body = event.body || '';
    
    // Calculate the expected signature
    const expectedSignature = createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');
    
    // Compare signatures (use timingSafeEqual for security)
    const providedSignature = signature.replace('sha256=', '');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const providedBuffer = Buffer.from(providedSignature, 'hex');
    
    if (expectedBuffer.length !== providedBuffer.length) {
      logger.warn('Invalid signature length');
      return {
        statusCode: 401,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid signature' })
      };
    }

    // Use crypto.timingSafeEqual for constant-time comparison
    const crypto = await import('node:crypto');
    const isValid = crypto.timingSafeEqual(expectedBuffer, providedBuffer);
    
    if (!isValid) {
      logger.warn('Invalid signature provided');
      return {
        statusCode: 401,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid signature' })
      };
    }

    // Parse the payload
    let payload;
    try {
      payload = JSON.parse(body);
    } catch (error) {
      logger.error('Invalid JSON payload', { error });
      return {
        statusCode: 400,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid JSON payload' })
      };
    }

    // Log the webhook event
    logger.info('Valid Tray webhook received', { 
      payloadKeys: Object.keys(payload),
      timestamp: Date.now()
    });

    // Echo back the payload with success confirmation
    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ok: true,
        message: 'Webhook received and validated',
        timestamp: Date.now(),
        payload
      })
    };

  } catch (error) {
    logger.error('Unexpected error processing webhook', { error });
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};