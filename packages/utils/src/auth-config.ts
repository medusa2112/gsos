import { UserRole } from '@gsos/types/auth';

/**
 * Authentication configuration constants
 */
export const AUTH_CONFIG = {
  // Token settings
  TOKEN_EXPIRY: {
    ACCESS_TOKEN: 60 * 60, // 1 hour
    ID_TOKEN: 60 * 60, // 1 hour
    REFRESH_TOKEN: 30 * 24 * 60 * 60, // 30 days
  },

  // Password requirements
  PASSWORD_POLICY: {
    MIN_LENGTH: 8,
    REQUIRE_LOWERCASE: true,
    REQUIRE_UPPERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SYMBOLS: false,
    TEMP_PASSWORD_VALIDITY_DAYS: 7,
  },

  // MFA settings
  MFA: {
    ENABLED: true,
    OPTIONAL: true,
    METHODS: ['SMS', 'TOTP'],
  },

  // Session settings
  SESSION: {
    TIMEOUT_MINUTES: 60,
    EXTEND_ON_ACTIVITY: true,
    CONCURRENT_SESSIONS: 3,
  },

  // Rate limiting
  RATE_LIMITS: {
    LOGIN_ATTEMPTS: {
      MAX_ATTEMPTS: 5,
      WINDOW_MINUTES: 15,
      LOCKOUT_MINUTES: 30,
    },
    PASSWORD_RESET: {
      MAX_ATTEMPTS: 3,
      WINDOW_MINUTES: 60,
    },
  },
} as const;

/**
 * Role hierarchy for permission inheritance
 */
export const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  admin: ['admin', 'teacher', 'parent', 'student'],
  teacher: ['teacher'],
  parent: ['parent'],
  student: ['student'],
};

/**
 * Default route permissions by role
 */
export const DEFAULT_ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  // Public routes (no authentication required)
  '/': [],
  '/about': [],
  '/contact': [],
  '/auth/signin': [],
  '/auth/signup': [],
  '/auth/forgot-password': [],
  '/auth/reset-password': [],

  // Admin routes
  '/admin': ['admin'],
  '/admin/users': ['admin'],
  '/admin/schools': ['admin'],
  '/admin/settings': ['admin'],
  '/admin/reports': ['admin'],

  // Teacher routes
  '/teacher': ['admin', 'teacher'],
  '/teacher/dashboard': ['admin', 'teacher'],
  '/teacher/classes': ['admin', 'teacher'],
  '/teacher/students': ['admin', 'teacher'],
  '/teacher/attendance': ['admin', 'teacher'],
  '/teacher/behavior': ['admin', 'teacher'],
  '/teacher/reports': ['admin', 'teacher'],

  // Parent routes
  '/parent': ['admin', 'parent'],
  '/parent/dashboard': ['admin', 'parent'],
  '/parent/children': ['admin', 'parent'],
  '/parent/attendance': ['admin', 'parent'],
  '/parent/behavior': ['admin', 'parent'],
  '/parent/payments': ['admin', 'parent'],
  '/parent/reports': ['admin', 'parent'],

  // Student routes
  '/student': ['admin', 'student'],
  '/student/dashboard': ['admin', 'student'],
  '/student/attendance': ['admin', 'student'],
  '/student/behavior': ['admin', 'student'],
  '/student/reports': ['admin', 'student'],

  // Shared authenticated routes
  '/profile': ['admin', 'teacher', 'parent', 'student'],
  '/settings': ['admin', 'teacher', 'parent', 'student'],
  '/help': ['admin', 'teacher', 'parent', 'student'],
};

/**
 * Permission definitions by category
 */
export const PERMISSIONS = {
  // User management
  USERS: {
    READ: 'users:read',
    WRITE: 'users:write',
    DELETE: 'users:delete',
    INVITE: 'users:invite',
    SUSPEND: 'users:suspend',
  },

  // Student management
  STUDENTS: {
    READ: 'students:read',
    WRITE: 'students:write',
    DELETE: 'students:delete',
    ENROLL: 'students:enroll',
    TRANSFER: 'students:transfer',
  },

  // Teacher management
  TEACHERS: {
    READ: 'teachers:read',
    WRITE: 'teachers:write',
    DELETE: 'teachers:delete',
    ASSIGN: 'teachers:assign',
  },

  // Class management
  CLASSES: {
    READ: 'classes:read',
    WRITE: 'classes:write',
    DELETE: 'classes:delete',
    SCHEDULE: 'classes:schedule',
  },

  // Attendance management
  ATTENDANCE: {
    READ: 'attendance:read',
    WRITE: 'attendance:write',
    DELETE: 'attendance:delete',
    MARK: 'attendance:mark',
    REPORT: 'attendance:report',
  },

  // Behavior management
  BEHAVIOR: {
    READ: 'behavior:read',
    WRITE: 'behavior:write',
    DELETE: 'behavior:delete',
    INCIDENT: 'behavior:incident',
    REWARD: 'behavior:reward',
  },

  // Admissions management
  ADMISSIONS: {
    READ: 'admissions:read',
    WRITE: 'admissions:write',
    DELETE: 'admissions:delete',
    REVIEW: 'admissions:review',
    APPROVE: 'admissions:approve',
  },

  // Payment management
  PAYMENTS: {
    READ: 'payments:read',
    WRITE: 'payments:write',
    DELETE: 'payments:delete',
    PROCESS: 'payments:process',
    REFUND: 'payments:refund',
  },

  // Reporting
  REPORTS: {
    READ: 'reports:read',
    WRITE: 'reports:write',
    EXPORT: 'reports:export',
    SCHEDULE: 'reports:schedule',
  },

  // System settings
  SETTINGS: {
    READ: 'settings:read',
    WRITE: 'settings:write',
    SYSTEM: 'settings:system',
  },
} as const;

/**
 * Role-based permission mapping
 */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    // Full access to everything
    ...Object.values(PERMISSIONS.USERS),
    ...Object.values(PERMISSIONS.STUDENTS),
    ...Object.values(PERMISSIONS.TEACHERS),
    ...Object.values(PERMISSIONS.CLASSES),
    ...Object.values(PERMISSIONS.ATTENDANCE),
    ...Object.values(PERMISSIONS.BEHAVIOR),
    ...Object.values(PERMISSIONS.ADMISSIONS),
    ...Object.values(PERMISSIONS.PAYMENTS),
    ...Object.values(PERMISSIONS.REPORTS),
    ...Object.values(PERMISSIONS.SETTINGS),
  ],

  teacher: [
    // Student management (limited)
    PERMISSIONS.STUDENTS.READ,
    PERMISSIONS.STUDENTS.WRITE, // For their classes only

    // Class management
    PERMISSIONS.CLASSES.READ,
    PERMISSIONS.CLASSES.WRITE, // For their classes only
    PERMISSIONS.CLASSES.SCHEDULE,

    // Attendance management
    PERMISSIONS.ATTENDANCE.READ,
    PERMISSIONS.ATTENDANCE.WRITE,
    PERMISSIONS.ATTENDANCE.MARK,
    PERMISSIONS.ATTENDANCE.REPORT,

    // Behavior management
    PERMISSIONS.BEHAVIOR.READ,
    PERMISSIONS.BEHAVIOR.WRITE,
    PERMISSIONS.BEHAVIOR.INCIDENT,
    PERMISSIONS.BEHAVIOR.REWARD,

    // Reporting (limited)
    PERMISSIONS.REPORTS.READ,
    PERMISSIONS.REPORTS.EXPORT,

    // Settings (limited)
    PERMISSIONS.SETTINGS.READ,
  ],

  parent: [
    // Student data (their children only)
    PERMISSIONS.STUDENTS.READ,

    // Attendance (their children only)
    PERMISSIONS.ATTENDANCE.READ,

    // Behavior (their children only)
    PERMISSIONS.BEHAVIOR.READ,

    // Payments
    PERMISSIONS.PAYMENTS.READ,
    PERMISSIONS.PAYMENTS.WRITE,

    // Reports (their children only)
    PERMISSIONS.REPORTS.READ,

    // Settings (limited)
    PERMISSIONS.SETTINGS.READ,
  ],

  student: [
    // Own data only
    PERMISSIONS.STUDENTS.READ, // Own profile only
    PERMISSIONS.ATTENDANCE.READ, // Own attendance only
    PERMISSIONS.BEHAVIOR.READ, // Own behavior only
    PERMISSIONS.REPORTS.READ, // Own reports only
    PERMISSIONS.SETTINGS.READ, // Limited settings
  ],
};

/**
 * Get permissions for a specific role
 */
export function getPermissionsForRole(role: UserRole): string[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

/**
 * Get allowed roles for a route
 */
export function getAllowedRolesForRoute(route: string): UserRole[] {
  // Exact match first
  if (DEFAULT_ROUTE_PERMISSIONS[route]) {
    return DEFAULT_ROUTE_PERMISSIONS[route];
  }

  // Pattern matching for dynamic routes
  for (const [pattern, roles] of Object.entries(DEFAULT_ROUTE_PERMISSIONS)) {
    if (pattern.includes(':') || pattern.includes('*')) {
      const regex = new RegExp(
        '^' + pattern.replace(/:[^/]+/g, '[^/]+').replace(/\*/g, '.*') + '$'
      );
      if (regex.test(route)) {
        return roles;
      }
    }
  }

  // Default to requiring authentication
  return ['admin', 'teacher', 'parent', 'student'];
}

/**
 * Environment-specific configuration
 */
export function getAuthConfig(environment: 'development' | 'staging' | 'production') {
  const baseConfig = AUTH_CONFIG;

  switch (environment) {
    case 'development':
      return {
        ...baseConfig,
        SESSION: {
          ...baseConfig.SESSION,
          TIMEOUT_MINUTES: 480, // 8 hours for development
        },
        RATE_LIMITS: {
          ...baseConfig.RATE_LIMITS,
          LOGIN_ATTEMPTS: {
            ...baseConfig.RATE_LIMITS.LOGIN_ATTEMPTS,
            MAX_ATTEMPTS: 10, // More lenient for development
          },
        },
      };

    case 'staging':
      return {
        ...baseConfig,
        SESSION: {
          ...baseConfig.SESSION,
          TIMEOUT_MINUTES: 120, // 2 hours for staging
        },
      };

    case 'production':
    default:
      return baseConfig;
  }
}