/**
 * Security Configuration for GSOS Application
 * Implements GDPR-compliant security measures and encryption standards
 */

export const SECURITY_CONFIG = {
  // TLS/HTTPS Configuration
  TLS: {
    ENFORCE_HTTPS: true,
    MIN_TLS_VERSION: '1.2',
    HSTS_MAX_AGE: 31536000, // 1 year
    INCLUDE_SUBDOMAINS: true,
    PRELOAD: true,
  },

  // Content Security Policy
  CSP: {
    DEFAULT_SRC: ["'self'"],
    SCRIPT_SRC: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
    STYLE_SRC: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    FONT_SRC: ["'self'", "https://fonts.gstatic.com"],
    IMG_SRC: ["'self'", "data:", "https:"],
    CONNECT_SRC: ["'self'", "https://api.stripe.com", "https://*.amazonaws.com"],
    FRAME_SRC: ["'none'"],
    OBJECT_SRC: ["'none'"],
    BASE_URI: ["'self'"],
    FORM_ACTION: ["'self'"],
  },

  // Security Headers
  HEADERS: {
    X_FRAME_OPTIONS: 'DENY',
    X_CONTENT_TYPE_OPTIONS: 'nosniff',
    X_XSS_PROTECTION: '1; mode=block',
    REFERRER_POLICY: 'strict-origin-when-cross-origin',
    PERMISSIONS_POLICY: 'camera=(), microphone=(), geolocation=()',
  },

  // Encryption Configuration
  ENCRYPTION: {
    // S3 Encryption
    S3: {
      ALGORITHM: 'AES256',
      KMS_KEY_ROTATION: true,
      BUCKET_KEY_ENABLED: true,
    },
    // DynamoDB Encryption
    DYNAMODB: {
      ENCRYPTION_AT_REST: true,
      POINT_IN_TIME_RECOVERY: true,
      KMS_MANAGED: true,
    },
    // Application-level encryption for PII
    PII: {
      ALGORITHM: 'aes-256-gcm',
      KEY_ROTATION_DAYS: 90,
    },
  },

  // Data Classification
  DATA_CLASSIFICATION: {
    PUBLIC: 'public',
    INTERNAL: 'internal',
    CONFIDENTIAL: 'confidential',
    RESTRICTED: 'restricted', // PII, student records
  },

  // PII Fields that require special handling
  PII_FIELDS: [
    'email',
    'phone',
    'address',
    'dateOfBirth',
    'nationalId',
    'passportNumber',
    'medicalInfo',
    'emergencyContact',
    'parentContact',
    'bankDetails',
    'paymentInfo',
  ],

  // Audit Log Configuration
  AUDIT: {
    ENABLED: true,
    RETENTION_DAYS: 2555, // 7 years for GDPR compliance
    LOG_LEVEL: 'INFO',
    INCLUDE_REQUEST_BODY: false, // Never log request bodies containing PII
    REDACT_FIELDS: ['password', 'token', 'authorization', 'cookie'],
  },

  // Rate Limiting
  RATE_LIMITS: {
    GLOBAL: {
      WINDOW_MS: 15 * 60 * 1000, // 15 minutes
      MAX_REQUESTS: 1000,
    },
    AUTH: {
      WINDOW_MS: 15 * 60 * 1000, // 15 minutes
      MAX_REQUESTS: 5,
    },
    API: {
      WINDOW_MS: 60 * 1000, // 1 minute
      MAX_REQUESTS: 100,
    },
  },

  // Session Security
  SESSION: {
    SECURE: true,
    HTTP_ONLY: true,
    SAME_SITE: 'strict',
    MAX_AGE: 3600, // 1 hour
  },

  // S3 Security Configuration
  S3: {
    SIGNED_URL_EXPIRY: 3600, // 1 hour in seconds
    MAX_UPLOAD_SIZE: 50 * 1024 * 1024, // 50MB
    ENCRYPTION_ALGORITHM: 'aws:kms',
    FORCE_SSL: true,
  },

  // File Upload Security
  FILE_UPLOAD: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    SCAN_FOR_MALWARE: true,
    QUARANTINE_SUSPICIOUS: true,
  } as const,

  // GDPR Compliance
  GDPR: {
    DATA_RETENTION_DAYS: 2555, // 7 years
    CONSENT_REQUIRED: true,
    RIGHT_TO_ERASURE: true,
    DATA_PORTABILITY: true,
    BREACH_NOTIFICATION_HOURS: 72,
  },
} as const;

/**
 * Security Headers Middleware Configuration
 */
export function getSecurityHeaders(): Record<string, string> {
  const csp = Object.entries(SECURITY_CONFIG.CSP)
    .map(([key, values]) => `${key.toLowerCase().replace(/_/g, '-')} ${values.join(' ')}`)
    .join('; ');

  return {
    'Strict-Transport-Security': `max-age=${SECURITY_CONFIG.TLS.HSTS_MAX_AGE}; includeSubDomains; preload`,
    'Content-Security-Policy': csp,
    'X-Frame-Options': SECURITY_CONFIG.HEADERS.X_FRAME_OPTIONS,
    'X-Content-Type-Options': SECURITY_CONFIG.HEADERS.X_CONTENT_TYPE_OPTIONS,
    'X-XSS-Protection': SECURITY_CONFIG.HEADERS.X_XSS_PROTECTION,
    'Referrer-Policy': SECURITY_CONFIG.HEADERS.REFERRER_POLICY,
    'Permissions-Policy': SECURITY_CONFIG.HEADERS.PERMISSIONS_POLICY,
  };
}

/**
 * Check if a field contains PII
 */
export function isPIIField(fieldName: string): boolean {
  return SECURITY_CONFIG.PII_FIELDS.some(piiField => 
    fieldName.toLowerCase().includes(piiField.toLowerCase())
  );
}

/**
 * Redact sensitive information from logs
 */
export function redactSensitiveData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const redacted = { ...data };
  
  for (const key in redacted) {
    if (isPIIField(key) || SECURITY_CONFIG.AUDIT.REDACT_FIELDS.includes(key.toLowerCase() as any)) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object') {
      redacted[key] = redactSensitiveData(redacted[key]);
    }
  }

  return redacted;
}

/**
 * Validate file upload security
 */
export function validateFileUpload(file: { type: string; size: number }): { valid: boolean; error?: string } {
  if (file.size > SECURITY_CONFIG.FILE_UPLOAD.MAX_SIZE) {
    return { valid: false, error: 'File size exceeds maximum allowed size' };
  }

  if (!SECURITY_CONFIG.FILE_UPLOAD.ALLOWED_TYPES.includes(file.type as any)) {
    return { valid: false, error: 'File type not allowed' };
  }

  return { valid: true };
}

/**
 * Generate secure random string for tokens
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomArray = new Uint8Array(length);
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomArray);
  } else {
    // Fallback for Node.js
    const nodeCrypto = require('crypto');
    for (let i = 0; i < length; i++) {
      randomArray[i] = nodeCrypto.randomBytes(1)[0];
    }
  }
  
  for (let i = 0; i < length; i++) {
    result += chars[randomArray[i] % chars.length];
  }
  
  return result;
}