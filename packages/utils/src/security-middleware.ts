import { getSecurityHeaders, SECURITY_CONFIG, redactSensitiveData } from './security-config';

/**
 * Security headers for HTTP responses
 */
export function getHTTPSecurityHeaders(): Record<string, string> {
  const securityHeaders = getSecurityHeaders();
  
  return {
    ...securityHeaders,
    'X-Robots-Tag': 'noindex, nofollow',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };
}

/**
 * Check if request should be redirected to HTTPS
 */
export function shouldRedirectToHTTPS(headers: Record<string, string>): boolean {
  return SECURITY_CONFIG.TLS.ENFORCE_HTTPS && 
         process.env.NODE_ENV === 'production' && 
         headers['x-forwarded-proto'] !== 'https';
}

/**
 * API Security middleware for Lambda functions
 */
export interface APISecurityOptions {
  requireAuth?: boolean;
  requiredRoles?: string[];
  rateLimitKey?: string;
  logRequest?: boolean;
}

export function apiSecurityMiddleware(options: APISecurityOptions = {}) {
  return async function(event: any, context: any, next: Function) {
    const startTime = Date.now();
    
    try {
      // Log request (with PII redaction)
      if (options.logRequest) {
        const redactedEvent = redactSensitiveData({
          httpMethod: event.httpMethod,
          path: event.path,
          headers: redactSensitiveData(event.headers),
          queryStringParameters: event.queryStringParameters,
          // Never log body as it may contain PII
        });
        console.log('API Request:', JSON.stringify(redactedEvent));
      }

      // Validate HTTPS
      if (SECURITY_CONFIG.TLS.ENFORCE_HTTPS && 
          event.headers['x-forwarded-proto'] !== 'https' &&
          process.env.NODE_ENV === 'production') {
        return {
          statusCode: 403,
          headers: getAPISecurityHeaders(),
          body: JSON.stringify({ error: 'HTTPS required' })
        };
      }

      // Execute the handler
      const result = await next(event, context);

      // Add security headers to response
      const securityHeaders = getAPISecurityHeaders();
      result.headers = { ...result.headers, ...securityHeaders };

      // Log response (without sensitive data)
      if (options.logRequest) {
        const duration = Date.now() - startTime;
        console.log('API Response:', JSON.stringify({
          statusCode: result.statusCode,
          duration: `${duration}ms`,
          // Never log response body as it may contain PII
        }));
      }

      return result;

    } catch (error) {
      // Log error (with PII redaction)
      console.error('API Error:', JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        path: event.path,
        method: event.httpMethod,
        duration: `${Date.now() - startTime}ms`,
      }));

      return {
        statusCode: 500,
        headers: getAPISecurityHeaders(),
        body: JSON.stringify({ error: 'Internal server error' })
      };
    }
  };
}

/**
 * Get security headers for API responses
 */
function getAPISecurityHeaders(): Record<string, string> {
  return {
    'Strict-Transport-Security': `max-age=${SECURITY_CONFIG.TLS.HSTS_MAX_AGE}; includeSubDomains; preload`,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'Content-Type': 'application/json',
  };
}

/**
 * Validate request against security policies
 */
export function validateRequest(request: any): { valid: boolean; error?: string } {
  // Check for required security headers
  const userAgent = request.headers['user-agent'];
  if (!userAgent || userAgent.length < 10) {
    return { valid: false, error: 'Invalid user agent' };
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /script/i,
    /javascript/i,
    /vbscript/i,
    /onload/i,
    /onerror/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];

  const requestString = JSON.stringify(request);
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestString)) {
      return { valid: false, error: 'Suspicious content detected' };
    }
  }

  return { valid: true };
}

/**
 * Rate limiting implementation
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  key: string, 
  windowMs: number = SECURITY_CONFIG.RATE_LIMITS.API.WINDOW_MS,
  maxRequests: number = SECURITY_CONFIG.RATE_LIMITS.API.MAX_REQUESTS
): { allowed: boolean; resetTime?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    // Create new record or reset expired one
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, resetTime: record.resetTime };
  }

  // Increment count
  record.count++;
  rateLimitStore.set(key, record);
  return { allowed: true };
}

/**
 * Clean up expired rate limit records
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up rate limit store every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}