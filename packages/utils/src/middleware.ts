import { UserRole, UserProfile } from '@gsos/types/auth';
import { hasPermission } from './auth';

// Types for middleware
export interface AuthenticatedRequest {
  user?: UserProfile;
  token?: string;
}

export interface AuthMiddlewareOptions {
  requiredRoles?: UserRole[];
  requiredPermissions?: string[];
  allowAnonymous?: boolean;
}

export interface AuthMiddlewareResult {
  success: boolean;
  user?: UserProfile;
  error?: {
    code: string;
    message: string;
    statusCode: number;
  };
}

/**
 * Verify JWT token and extract user information
 */
export async function verifyJwtToken(token: string): Promise<UserProfile | null> {
  try {
    // This would typically use AWS Cognito JWT verification
    // For now, we'll return a mock implementation
    // In production, you'd use aws-jwt-verify or similar
    
    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace(/^Bearer\s+/, '');
    
    // Decode JWT payload (in production, verify signature first)
    const payload = JSON.parse(Buffer.from(cleanToken.split('.')[1], 'base64').toString());
    
    const userProfile: UserProfile = {
      id: payload.sub || payload['custom:user_id'],
      email: payload.email,
      firstName: payload.given_name || '',
      lastName: payload.family_name || '',
      role: (payload['custom:role'] as UserRole) || 'student',
      groups: payload['cognito:groups']?.split(',') || [],
      emailVerified: payload.email_verified || false,
      mfaEnabled: false, // Would need to check from Cognito
      lastSignIn: new Date(payload.auth_time * 1000),
      createdAt: new Date(payload.iat * 1000),
      updatedAt: new Date()
    };
    
    return userProfile;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Express/Next.js middleware for authentication
 */
export async function authMiddleware(
  token: string | undefined,
  options: AuthMiddlewareOptions = {}
): Promise<AuthMiddlewareResult> {
  const { requiredRoles, requiredPermissions, allowAnonymous = false } = options;

  // Handle anonymous access
  if (!token) {
    if (allowAnonymous) {
      return { success: true };
    }
    return {
      success: false,
      error: {
        code: 'MISSING_TOKEN',
        message: 'Authentication token is required',
        statusCode: 401
      }
    };
  }

  // Verify token and get user
  const user = await verifyJwtToken(token);
  if (!user) {
    return {
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired authentication token',
        statusCode: 401
      }
    };
  }

  // Check role requirements
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.includes(user.role) || 
                           user.groups.some(group => requiredRoles.includes(group as UserRole));
    
    if (!hasRequiredRole) {
      return {
        success: false,
        error: {
          code: 'INSUFFICIENT_ROLE',
          message: `Access denied. Required roles: ${requiredRoles.join(', ')}`,
          statusCode: 403
        }
      };
    }
  }

  // Check permission requirements
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasRequiredPermissions = requiredPermissions.every(permission => 
      hasPermission(user.role, permission)
    );
    
    if (!hasRequiredPermissions) {
      return {
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Access denied. Insufficient permissions',
          statusCode: 403
        }
      };
    }
  }

  return { success: true, user };
}

/**
 * Higher-order function for protecting API routes
 */
export function withAuth(options: AuthMiddlewareOptions = {}) {
  return function <T extends AuthenticatedRequest>(
    handler: (req: T) => Promise<any>
  ) {
    return async function (req: T) {
      // Extract token from Authorization header
      const authHeader = (req as any).headers?.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

      const authResult = await authMiddleware(token, options);
      
      if (!authResult.success) {
        throw new Error(JSON.stringify(authResult.error));
      }

      // Attach user to request
      req.user = authResult.user;
      req.token = token;

      return handler(req);
    };
  };
}

/**
 * Resource-based authorization helper
 */
export function canAccessResource(
  user: UserProfile,
  resourceType: string,
  resourceId: string,
  action: 'read' | 'write' | 'delete'
): boolean {
  // Admin can access everything
  if (user.role === 'admin') {
    return true;
  }

  // Teachers can access their classes and students
  if (user.role === 'teacher') {
    if (resourceType === 'student' || resourceType === 'class' || resourceType === 'attendance' || resourceType === 'behavior') {
      return true; // In production, check if teacher is assigned to this resource
    }
  }

  // Parents can only access their children's data
  if (user.role === 'parent') {
    if (resourceType === 'student' && action === 'read') {
      // In production, check if this student is their child
      return true;
    }
    if ((resourceType === 'attendance' || resourceType === 'behavior') && action === 'read') {
      // In production, check if this data belongs to their child
      return true;
    }
  }

  // Students can only access their own data
  if (user.role === 'student') {
    if (resourceId === user.id && action === 'read') {
      return true;
    }
  }

  return false;
}

/**
 * Context-aware permission checker
 */
export interface ResourceContext {
  schoolId?: string;
  studentId?: string;
  teacherId?: string;
  classId?: string;
}

export function hasContextualPermission(
  user: UserProfile,
  permission: string,
  context: ResourceContext = {}
): boolean {
  // Basic permission check
  if (!hasPermission(user.role, permission)) {
    return false;
  }

  // Context-specific checks
  if (context.schoolId && user.role !== 'admin') {
    // In production, verify user belongs to this school
  }

  if (context.studentId && user.role === 'parent') {
    // In production, verify this is their child
  }

  if (context.teacherId && user.role === 'teacher') {
    // In production, verify this is the same teacher
    if (context.teacherId !== user.id) {
      return false;
    }
  }

  return true;
}