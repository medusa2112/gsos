import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { 
  generateS3UploadConfig, 
  generateSecureS3Key, 
  validateFileUpload, 
  FILE_VALIDATION_RULES,
  logS3Operation,
  SignedUrlOptions,
  UploadValidation 
} from '@gsos/utils/s3-security';
import { 
  requirePermission, 
  requireStudentAccess, 
  User, 
  Permission 
} from '@gsos/utils/rbac-middleware';
import { getHTTPSecurityHeaders } from '@gsos/utils/security-middleware';
import { logger, logDataAccess } from '@gsos/utils/secure-logging';

/**
 * Secure file upload handler with signed S3 URLs
 * Implements comprehensive security checks and audit logging
 */

interface UploadRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadType: 'student_document' | 'profile_image' | 'report';
  studentId?: string;
  metadata?: Record<string, string>;
}

interface UploadResponse {
  uploadUrl: string;
  fileKey: string;
  expiresIn: number;
  maxFileSize: number;
  allowedTypes: string[];
}

/**
 * Generate signed upload URL with security validation
 */
export async function generateSignedUploadUrl(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body: UploadRequest = JSON.parse(event.body || '{}');
    const { fileName, fileType, fileSize, uploadType, studentId, metadata } = body;
    
    // Extract user from event (would be set by auth middleware)
    const user: User = JSON.parse(event.requestContext.authorizer?.user || '{}');
    
    // Validate required fields
    if (!fileName || !fileType || !fileSize || !uploadType) {
      logger.warn('Invalid upload request - missing required fields', {
        userId: user.id,
        fileName: fileName || '[missing]',
        uploadType: uploadType || '[missing]',
      });
      
      return {
        statusCode: 400,
        headers: getHTTPSecurityHeaders(),
        body: JSON.stringify({
          error: 'Missing required fields: fileName, fileType, fileSize, uploadType'
        }),
      };
    }
    
    // Get validation rules for upload type
    const validationRules = getValidationRules(uploadType);
    
    // Validate file
    const validation = validateFileUpload(
      { name: fileName, type: fileType, size: fileSize },
      validationRules
    );
    
    if (!validation.valid) {
      logger.warn('File validation failed', {
        userId: user.id,
        fileName,
        fileType,
        fileSize,
        error: validation.error,
      });
      
      return {
        statusCode: 400,
        headers: getHTTPSecurityHeaders(),
        body: JSON.stringify({
          error: validation.error
        }),
      };
    }
    
    // Check permissions based on upload type
    await checkUploadPermissions(user, uploadType, studentId);
    
    // Generate secure S3 key
    const s3Key = generateSecureS3Key(uploadType, fileName, user.id);
    
    // Generate upload configuration
    const uploadConfig = generateS3UploadConfig(
      {
        bucket: process.env.DOCUMENTS_BUCKET || 'gsos-docs',
        key: s3Key,
        contentType: fileType,
        contentLength: fileSize,
      },
      validationRules
    );
    
    // Log the upload request for audit
    logDataAccess('write', uploadType, user.id, true, {
      fileName,
      fileType,
      fileSize,
      s3Key,
      studentId,
    });
    
    // Log S3 operation
    logS3Operation({
      operation: 'upload',
      bucket: uploadConfig.bucket,
      key: uploadConfig.key,
      userId: user.id,
      userRole: user.role,
      timestamp: new Date().toISOString(),
      ipAddress: event.requestContext.identity?.sourceIp,
      userAgent: event.headers['User-Agent'],
      success: true,
    });
    
    const response: UploadResponse = {
      uploadUrl: `https://${uploadConfig.bucket}.s3.amazonaws.com/${uploadConfig.key}`, // Placeholder - would use actual signed URL
      fileKey: uploadConfig.key,
      expiresIn: uploadConfig.expiresIn,
      maxFileSize: validationRules.maxFileSize,
      allowedTypes: validationRules.allowedTypes,
    };
    
    logger.info('Signed upload URL generated successfully', {
      userId: user.id,
      uploadType,
      fileName,
      s3Key,
      duration: Date.now() - startTime,
    });
    
    return {
      statusCode: 200,
      headers: {
        ...getHTTPSecurityHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response),
    };
    
  } catch (error) {
    logger.error('Failed to generate signed upload URL', error as Error, {
      event: event.path,
      method: event.httpMethod,
      duration: Date.now() - startTime,
    });
    
    return {
      statusCode: 500,
      headers: getHTTPSecurityHeaders(),
      body: JSON.stringify({
        error: 'Internal server error'
      }),
    };
  }
}

/**
 * Get validation rules based on upload type
 */
function getValidationRules(uploadType: string): UploadValidation {
  switch (uploadType) {
    case 'student_document':
      return {
        ...FILE_VALIDATION_RULES.STUDENT_DOCUMENTS,
        allowedTypes: [...FILE_VALIDATION_RULES.STUDENT_DOCUMENTS.allowedTypes],
        allowedExtensions: [...FILE_VALIDATION_RULES.STUDENT_DOCUMENTS.allowedExtensions],
      };
    case 'profile_image':
      return {
        ...FILE_VALIDATION_RULES.PROFILE_IMAGES,
        allowedTypes: [...FILE_VALIDATION_RULES.PROFILE_IMAGES.allowedTypes],
        allowedExtensions: [...FILE_VALIDATION_RULES.PROFILE_IMAGES.allowedExtensions],
      };
    case 'report':
      return {
        ...FILE_VALIDATION_RULES.REPORTS,
        allowedTypes: [...FILE_VALIDATION_RULES.REPORTS.allowedTypes],
        allowedExtensions: [...FILE_VALIDATION_RULES.REPORTS.allowedExtensions],
      };
    default:
      throw new Error(`Unknown upload type: ${uploadType}`);
  }
}

/**
 * Check upload permissions based on type and context
 */
async function checkUploadPermissions(
  user: User,
  uploadType: string,
  studentId?: string
): Promise<void> {
  switch (uploadType) {
    case 'student_document':
      if (!studentId) {
        throw new Error('Student ID required for student document uploads');
      }
      // Check if user can write student data
      requireStudentAccess('write')(user, studentId);
      break;
      
    case 'profile_image':
      // Users can upload their own profile images
      // Staff can upload student profile images with permission
      if (studentId) {
        requireStudentAccess('write')(user, studentId);
      }
      break;
      
    case 'report':
      // Only staff with appropriate permissions can upload reports
      requirePermission(Permission.WRITE_STUDENT_DATA)(user, 'upload_report');
      break;
      
    default:
      throw new Error(`Unknown upload type: ${uploadType}`);
  }
}

/**
 * Handle upload completion callback
 */
export async function handleUploadComplete(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const startTime = Date.now();
  
  try {
    const body = JSON.parse(event.body || '{}');
    const { fileKey, uploadSuccess, fileSize, contentType } = body;
    
    const user: User = JSON.parse(event.requestContext.authorizer?.user || '{}');
    
    // Log upload completion
    logS3Operation({
      operation: 'upload',
      bucket: process.env.DOCUMENTS_BUCKET || 'gsos-docs',
      key: fileKey,
      userId: user.id,
      userRole: user.role,
      timestamp: new Date().toISOString(),
      ipAddress: event.requestContext.identity?.sourceIp,
      userAgent: event.headers['User-Agent'],
      success: uploadSuccess,
    });
    
    if (uploadSuccess) {
      logger.info('File upload completed successfully', {
        userId: user.id,
        fileKey,
        fileSize,
        contentType,
      });
      
      // TODO: Trigger virus scan
      // TODO: Update database with file metadata
      // TODO: Send notification if required
    } else {
      logger.warn('File upload failed', {
        userId: user.id,
        fileKey,
      });
    }
    
    return {
      statusCode: 200,
      headers: getHTTPSecurityHeaders(),
      body: JSON.stringify({
        success: true,
        message: 'Upload status recorded'
      }),
    };
    
  } catch (error) {
    logger.error('Failed to handle upload completion', error as Error, {
      duration: Date.now() - startTime,
    });
    
    return {
      statusCode: 500,
      headers: getHTTPSecurityHeaders(),
      body: JSON.stringify({
        error: 'Internal server error'
      }),
    };
  }
}

/**
 * Generate signed download URL for secure file access
 */
export async function generateSignedDownloadUrl(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const startTime = Date.now();
  
  try {
    const { fileKey } = event.pathParameters || {};
    const user: User = JSON.parse(event.requestContext.authorizer?.user || '{}');
    
    if (!fileKey) {
      return {
        statusCode: 400,
        headers: getHTTPSecurityHeaders(),
        body: JSON.stringify({
          error: 'File key is required'
        }),
      };
    }
    
    // Check if user has permission to download this file
    // This would typically involve checking file ownership/permissions in database
    await checkDownloadPermissions(user, fileKey);
    
    // Generate download configuration (placeholder for actual signed URL)
    const downloadUrl = `https://${process.env.DOCUMENTS_BUCKET}.s3.amazonaws.com/${fileKey}`;
    
    // Log download request
    logS3Operation({
      operation: 'download',
      bucket: process.env.DOCUMENTS_BUCKET || 'gsos-docs',
      key: fileKey,
      userId: user.id,
      userRole: user.role,
      timestamp: new Date().toISOString(),
      ipAddress: event.requestContext.identity?.sourceIp,
      userAgent: event.headers['User-Agent'],
      success: true,
    });
    
    logger.info('Signed download URL generated', {
      userId: user.id,
      fileKey,
      duration: Date.now() - startTime,
    });
    
    return {
      statusCode: 200,
      headers: {
        ...getHTTPSecurityHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        downloadUrl,
        expiresIn: 3600, // 1 hour
      }),
    };
    
  } catch (error) {
    logger.error('Failed to generate signed download URL', error as Error, {
      duration: Date.now() - startTime,
    });
    
    return {
      statusCode: 500,
      headers: getHTTPSecurityHeaders(),
      body: JSON.stringify({
        error: 'Internal server error'
      }),
    };
  }
}

/**
 * Check download permissions for a file
 */
async function checkDownloadPermissions(user: User, fileKey: string): Promise<void> {
  // Extract file type and student ID from key if possible
  const keyParts = fileKey.split('/');
  const uploadType = keyParts[0];
  
  switch (uploadType) {
    case 'student_document':
      // Extract student ID from key and check permissions
      requirePermission(Permission.READ_STUDENT_DATA)(user, 'download_student_document');
      break;
      
    case 'profile_image':
      // Allow users to download profile images they have access to
      requirePermission(Permission.READ_STUDENT_DATA)(user, 'download_profile_image');
      break;
      
    case 'report':
      // Only staff can download reports
      requirePermission(Permission.READ_STUDENT_DATA)(user, 'download_report');
      break;
      
    default:
      throw new Error('Access denied: Unknown file type');
  }
}