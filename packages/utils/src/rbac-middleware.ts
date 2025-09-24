import { redactSensitiveData } from './security-config';

/**
 * Role-Based Access Control (RBAC) Middleware
 * Enforces permissions for mutations and sensitive operations
 */

export interface User {
  id: string;
  email: string;
  role: UserRole;
  schoolId?: string;
  permissions: Permission[];
  isActive: boolean;
  lastLogin?: string;
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  SCHOOL_ADMIN = 'school_admin',
  TEACHER = 'teacher',
  SAFEGUARDING_LEAD = 'safeguarding_lead',
  FINANCE_ADMIN = 'finance_admin',
  PARENT = 'parent',
  STUDENT = 'student',
}

export enum Permission {
  // Student data permissions
  READ_STUDENT_DATA = 'read_student_data',
  WRITE_STUDENT_DATA = 'write_student_data',
  DELETE_STUDENT_DATA = 'delete_student_data',
  
  // Safeguarding permissions
  READ_SAFEGUARDING_DATA = 'read_safeguarding_data',
  WRITE_SAFEGUARDING_DATA = 'write_safeguarding_data',
  ACCESS_SENSITIVE_RECORDS = 'access_sensitive_records',
  
  // Financial permissions
  READ_FINANCIAL_DATA = 'read_financial_data',
  WRITE_FINANCIAL_DATA = 'write_financial_data',
  PROCESS_PAYMENTS = 'process_payments',
  
  // Administrative permissions
  MANAGE_USERS = 'manage_users',
  MANAGE_SCHOOL_SETTINGS = 'manage_school_settings',
  VIEW_AUDIT_LOGS = 'view_audit_logs',
  
  // System permissions
  SYSTEM_ADMIN = 'system_admin',
  DATA_EXPORT = 'data_export',
  BULK_OPERATIONS = 'bulk_operations',
}

/**
 * Role hierarchy and default permissions
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    Permission.SYSTEM_ADMIN,
    Permission.MANAGE_USERS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.DATA_EXPORT,
    Permission.BULK_OPERATIONS,
    Permission.READ_STUDENT_DATA,
    Permission.WRITE_STUDENT_DATA,
    Permission.READ_FINANCIAL_DATA,
    Permission.WRITE_FINANCIAL_DATA,
    Permission.READ_SAFEGUARDING_DATA,
    Permission.WRITE_SAFEGUARDING_DATA,
    Permission.ACCESS_SENSITIVE_RECORDS,
  ],
  [UserRole.SCHOOL_ADMIN]: [
    Permission.MANAGE_SCHOOL_SETTINGS,
    Permission.MANAGE_USERS,
    Permission.READ_STUDENT_DATA,
    Permission.WRITE_STUDENT_DATA,
    Permission.READ_FINANCIAL_DATA,
    Permission.WRITE_FINANCIAL_DATA,
    Permission.PROCESS_PAYMENTS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.DATA_EXPORT,
  ],
  [UserRole.SAFEGUARDING_LEAD]: [
    Permission.READ_STUDENT_DATA,
    Permission.WRITE_STUDENT_DATA,
    Permission.READ_SAFEGUARDING_DATA,
    Permission.WRITE_SAFEGUARDING_DATA,
    Permission.ACCESS_SENSITIVE_RECORDS,
  ],
  [UserRole.TEACHER]: [
    Permission.READ_STUDENT_DATA,
    Permission.WRITE_STUDENT_DATA,
  ],
  [UserRole.FINANCE_ADMIN]: [
    Permission.READ_FINANCIAL_DATA,
    Permission.WRITE_FINANCIAL_DATA,
    Permission.PROCESS_PAYMENTS,
  ],
  [UserRole.PARENT]: [
    // Parents can only access their own children's data
  ],
  [UserRole.STUDENT]: [
    // Students can only access their own data
  ],
};

/**
 * Check if user has required permission
 */
export function hasPermission(user: User, permission: Permission): boolean {
  if (!user.isActive) {
    return false;
  }
  
  return user.permissions.includes(permission) || 
         ROLE_PERMISSIONS[user.role].includes(permission);
}

/**
 * Check if user can access specific student data
 */
export function canAccessStudentData(
  user: User, 
  studentId: string, 
  operation: 'read' | 'write' | 'delete'
): boolean {
  // Check if user is active
  if (!user.isActive) {
    return false;
  }

  // Super admins can access everything
  if (user.role === UserRole.SUPER_ADMIN) {
    return true;
  }

  // Check basic permission first
  const permissionMap = {
    read: Permission.READ_STUDENT_DATA,
    write: Permission.WRITE_STUDENT_DATA,
    delete: Permission.DELETE_STUDENT_DATA,
  };

  if (!hasPermission(user, permissionMap[operation])) {
    return false;
  }

  // School-level access control
  // TODO: Implement student-school relationship check
  // This would typically query the database to verify the student belongs to the user's school
  
  return true;
}

/**
 * Check if user can access safeguarding data
 */
export function canAccessSafeguardingData(user: User, studentId: string): boolean {
  if (!user.isActive) {
    return false;
  }

  // Only specific roles can access safeguarding data
  const allowedRoles = [
    UserRole.SUPER_ADMIN,
    UserRole.SCHOOL_ADMIN,
    UserRole.SAFEGUARDING_LEAD,
  ];

  if (!allowedRoles.includes(user.role)) {
    return false;
  }

  return hasPermission(user, Permission.ACCESS_SENSITIVE_RECORDS);
}

/**
 * Audit log for access control decisions
 */
export interface AccessAuditLog {
  userId: string;
  userRole: UserRole;
  operation: string;
  resource: string;
  resourceId?: string;
  granted: boolean;
  reason?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log access control decision
 */
export function logAccessControl(log: AccessAuditLog): void {
  // Redact sensitive information
  const sanitizedLog = {
    ...log,
    // Don't log actual resource IDs for student data
    resourceId: log.resource.includes('student') ? '[REDACTED]' : log.resourceId,
  };

  console.log('[ACCESS_CONTROL]', JSON.stringify(sanitizedLog));
}

/**
 * Middleware function to check permissions before mutations
 */
export function requirePermission(permission: Permission) {
  return (user: User, operation: string, resourceId?: string) => {
    const granted = hasPermission(user, permission);
    
    logAccessControl({
      userId: user.id,
      userRole: user.role,
      operation,
      resource: permission,
      resourceId,
      granted,
      reason: granted ? 'Permission granted' : 'Insufficient permissions',
      timestamp: new Date().toISOString(),
    });

    if (!granted) {
      throw new Error(`Access denied: Insufficient permissions for ${operation}`);
    }

    return true;
  };
}

/**
 * Middleware to check student data access
 */
export function requireStudentAccess(operation: 'read' | 'write' | 'delete') {
  return (user: User, studentId: string) => {
    const granted = canAccessStudentData(user, studentId, operation);
    
    logAccessControl({
      userId: user.id,
      userRole: user.role,
      operation: `${operation}_student_data`,
      resource: 'student_data',
      resourceId: studentId,
      granted,
      reason: granted ? 'Access granted' : 'Access denied',
      timestamp: new Date().toISOString(),
    });

    if (!granted) {
      throw new Error(`Access denied: Cannot ${operation} student data`);
    }

    return true;
  };
}

/**
 * Middleware to check safeguarding data access
 */
export function requireSafeguardingAccess() {
  return (user: User, studentId: string) => {
    const granted = canAccessSafeguardingData(user, studentId);
    
    logAccessControl({
      userId: user.id,
      userRole: user.role,
      operation: 'access_safeguarding_data',
      resource: 'safeguarding_data',
      resourceId: studentId,
      granted,
      reason: granted ? 'Safeguarding access granted' : 'Insufficient safeguarding permissions',
      timestamp: new Date().toISOString(),
    });

    if (!granted) {
      throw new Error('Access denied: Insufficient safeguarding permissions');
    }

    return true;
  };
}

/**
 * Data filtering based on user permissions
 */
export function filterDataByPermissions<T extends Record<string, any>>(
  user: User,
  data: T[],
  dataType: 'student' | 'financial' | 'safeguarding'
): T[] {
  // Super admins see everything
  if (user.role === UserRole.SUPER_ADMIN) {
    return data;
  }

  // Filter based on data type and permissions
  switch (dataType) {
    case 'student':
      if (!hasPermission(user, Permission.READ_STUDENT_DATA)) {
        return [];
      }
      break;
    case 'financial':
      if (!hasPermission(user, Permission.READ_FINANCIAL_DATA)) {
        return [];
      }
      break;
    case 'safeguarding':
      if (!hasPermission(user, Permission.READ_SAFEGUARDING_DATA)) {
        return [];
      }
      break;
  }

  // Apply additional filtering based on school/relationship
  // TODO: Implement school-based filtering
  
  return data.map(item => {
    // Redact sensitive fields based on permissions
    if (dataType === 'safeguarding' && !hasPermission(user, Permission.ACCESS_SENSITIVE_RECORDS)) {
      return redactSensitiveData(item);
    }
    return item;
  });
}