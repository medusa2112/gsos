import { SECURITY_CONFIG } from './security-config';

/**
 * S3 Security utilities for GSOS
 * Provides secure file upload/download validation and configuration
 */

export interface SignedUrlOptions {
  bucket: string;
  key: string;
  expiresIn?: number;
  contentType?: string;
  contentLength?: number;
}

export interface UploadValidation {
  maxFileSize: number;
  allowedTypes: string[];
  allowedExtensions: string[];
}

/**
 * S3 Upload Configuration for secure uploads
 */
export interface S3UploadConfig {
  bucket: string;
  key: string;
  contentType: string;
  contentLength: number;
  serverSideEncryption: string;
  metadata: Record<string, string>;
  expiresIn: number;
}

/**
 * Generate S3 upload configuration with security constraints
 */
export function generateS3UploadConfig(
  options: SignedUrlOptions,
  validation?: UploadValidation
): S3UploadConfig {
  const {
    bucket,
    key,
    expiresIn = SECURITY_CONFIG.S3.SIGNED_URL_EXPIRY,
    contentType = 'application/octet-stream',
    contentLength = 0
  } = options;

  // Validate file type if provided
  if (validation && contentType) {
    if (!validation.allowedTypes.includes(contentType)) {
      throw new Error(`File type ${contentType} not allowed`);
    }
  }

  // Validate file extension
  if (validation) {
    const extension = key.split('.').pop()?.toLowerCase();
    if (extension && !validation.allowedExtensions.includes(extension)) {
      throw new Error(`File extension .${extension} not allowed`);
    }
  }

  // Validate file size
  if (validation && contentLength && contentLength > validation.maxFileSize) {
    throw new Error(`File size ${contentLength} exceeds maximum ${validation.maxFileSize}`);
  }

  return {
    bucket,
    key,
    contentType,
    contentLength,
    serverSideEncryption: SECURITY_CONFIG.S3.ENCRYPTION_ALGORITHM,
    metadata: {
      'uploaded-at': new Date().toISOString(),
      'security-classification': 'student-data',
    },
    expiresIn,
  };
}

/**
 * Validate file upload request
 */
export function validateFileUpload(
  file: { name: string; type: string; size: number },
  validation: UploadValidation
): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > validation.maxFileSize) {
    return {
      valid: false,
      error: `File size ${file.size} exceeds maximum ${validation.maxFileSize} bytes`
    };
  }

  // Check file type
  if (!validation.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`
    };
  }

  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !validation.allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension .${extension} is not allowed`
    };
  }

  return { valid: true };
}

/**
 * Generate secure S3 key with timestamp and random suffix
 */
export function generateSecureS3Key(
  prefix: string,
  filename: string,
  userId?: string
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  const userPrefix = userId ? `${userId}/` : '';
  return `${prefix}/${userPrefix}${timestamp}-${randomSuffix}-${sanitizedFilename}`;
}

/**
 * Default validation rules for different file types
 */
export const FILE_VALIDATION_RULES = {
  STUDENT_DOCUMENTS: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']
  },
  PROFILE_IMAGES: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp']
  },
  REPORTS: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    allowedExtensions: ['pdf', 'xls', 'xlsx']
  }
} as const;

/**
 * Audit log entry for S3 operations
 */
export interface S3AuditLog {
  operation: 'upload' | 'download' | 'delete';
  bucket: string;
  key: string;
  userId?: string;
  userRole?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  error?: string;
}

/**
 * Log S3 operation for audit trail
 */
export function logS3Operation(log: S3AuditLog): void {
  // In production, this would send to CloudWatch, DataDog, or audit system
  console.log('[S3_AUDIT]', JSON.stringify({
    ...log,
    // Redact sensitive information
    key: log.key.includes('student') ? '[REDACTED_STUDENT_DATA]' : log.key,
  }));
}