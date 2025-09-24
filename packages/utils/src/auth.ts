import { UserRole, UserProfile, RoutePermissions, DEFAULT_ROUTE_PERMISSIONS } from '@gsos/types/auth';

/**
 * Authentication utility functions
 */

/**
 * Check if a user has permission to access a specific role-protected resource
 */
export function hasRole(user: UserProfile | null, allowedRoles: UserRole[]): boolean {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

/**
 * Check if a user has permission to access a specific route
 */
export function canAccessRoute(
  user: UserProfile | null, 
  path: string, 
  customPermissions?: RoutePermissions
): boolean {
  const permissions = customPermissions || DEFAULT_ROUTE_PERMISSIONS;
  
  // Find the most specific matching route
  const matchingRoute = findMatchingRoute(path, permissions);
  
  if (!matchingRoute) {
    // If no specific route is found, default to requiring authentication
    return user !== null;
  }

  const routeConfig = permissions[matchingRoute];
  
  // Check if authentication is required
  if (routeConfig.requiresAuth && !user) {
    return false;
  }

  // Check role permissions
  if (user && routeConfig.allowedRoles.length > 0) {
    return hasRole(user, routeConfig.allowedRoles);
  }

  return true;
}

/**
 * Find the most specific matching route pattern
 */
function findMatchingRoute(path: string, permissions: RoutePermissions): string | null {
  // First, try exact match
  if (permissions[path]) {
    return path;
  }

  // Then try wildcard matches, sorted by specificity (longest first)
  const wildcardRoutes = Object.keys(permissions)
    .filter(route => route.includes('*'))
    .sort((a, b) => b.length - a.length);

  for (const route of wildcardRoutes) {
    const pattern = route.replace('*', '');
    if (path.startsWith(pattern)) {
      return route;
    }
  }

  return null;
}

/**
 * Check if a user is an admin
 */
export function isAdmin(user: UserProfile | null): boolean {
  return hasRole(user, ['admin']);
}

/**
 * Check if a user is a teacher (or admin)
 */
export function isTeacher(user: UserProfile | null): boolean {
  return hasRole(user, ['teacher', 'admin']);
}

/**
 * Check if a user is a parent (or admin)
 */
export function isParent(user: UserProfile | null): boolean {
  return hasRole(user, ['parent', 'admin']);
}

/**
 * Check if a user is a student (or admin)
 */
export function isStudent(user: UserProfile | null): boolean {
  return hasRole(user, ['student', 'admin']);
}

/**
 * Get the appropriate dashboard route for a user based on their role
 */
export function getDashboardRoute(user: UserProfile | null): string {
  if (!user) return '/auth/signin';
  
  switch (user.role) {
    case 'admin':
      return '/admin';
    case 'teacher':
      return '/teacher';
    case 'parent':
      return '/parent';
    case 'student':
      return '/student';
    default:
      return '/dashboard';
  }
}

/**
 * Check if a parent has access to a specific student's information
 */
export function canAccessStudent(user: UserProfile | null, studentId: string): boolean {
  if (!user) return false;
  
  // Admins can access all students
  if (user.role === 'admin') return true;
  
  // Students can only access their own information
  if (user.role === 'student') {
    return user.studentId === studentId;
  }
  
  // Parents can access their children's information
  if (user.role === 'parent') {
    return user.parentOf?.includes(studentId) || false;
  }
  
  // Teachers can access students in their school (this could be more granular)
  if (user.role === 'teacher') {
    return true; // For now, teachers can access all students in their school
  }
  
  return false;
}

/**
 * Format user display name
 */
export function getDisplayName(user: UserProfile | null): string {
  if (!user) return 'Guest';
  return `${user.givenName} ${user.familyName}`.trim() || user.email;
}

/**
 * Get user initials for avatar display
 */
export function getUserInitials(user: UserProfile | null): string {
  if (!user) return 'G';
  
  const firstInitial = user.givenName?.charAt(0)?.toUpperCase() || '';
  const lastInitial = user.familyName?.charAt(0)?.toUpperCase() || '';
  
  return (firstInitial + lastInitial) || user.email.charAt(0).toUpperCase();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Parse Cognito user attributes to UserProfile
 */
export function parseUserAttributes(attributes: any): Partial<UserProfile> {
  return {
    email: attributes.email,
    givenName: attributes.given_name,
    familyName: attributes.family_name,
    role: attributes['custom:role'] as UserRole,
    schoolId: attributes['custom:school_id'],
    studentId: attributes['custom:student_id'],
    parentOf: attributes['custom:parent_of'] ? JSON.parse(attributes['custom:parent_of']) : undefined,
    emailVerified: attributes.email_verified === 'true'
  };
}