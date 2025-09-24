/**
 * Authentication and authorization types for GSOS
 */

export type UserRole = 'admin' | 'teacher' | 'parent' | 'student';

export interface UserProfile {
  id: string;
  email: string;
  givenName: string;
  familyName: string;
  role: UserRole;
  schoolId: string;
  studentId?: string; // For students
  parentOf?: string[]; // For parents - array of student IDs
  emailVerified: boolean;
  groups: string[];
}

export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AuthSession {
  user: UserProfile;
  tokens: AuthTokens;
  isAuthenticated: boolean;
}

export interface CognitoUserAttributes {
  email: string;
  email_verified: boolean;
  given_name: string;
  family_name: string;
  'custom:role': UserRole;
  'custom:school_id': string;
  'custom:student_id'?: string;
  'custom:parent_of'?: string; // JSON string array
}

export interface AuthContextType {
  session: AuthSession | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, attributes: Partial<CognitoUserAttributes>) => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  resendConfirmationCode: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  refreshSession: () => Promise<void>;
}

export interface ProtectedRouteProps {
  children: any;
  allowedRoles?: UserRole[];
  fallback?: any;
  redirectTo?: string;
}

export interface RoutePermissions {
  [path: string]: {
    allowedRoles: UserRole[];
    requiresAuth: boolean;
  };
}

// Default route permissions for the application
export const DEFAULT_ROUTE_PERMISSIONS: RoutePermissions = {
  '/': { allowedRoles: ['admin', 'teacher', 'parent', 'student'], requiresAuth: false },
  '/auth/signin': { allowedRoles: ['admin', 'teacher', 'parent', 'student'], requiresAuth: false },
  '/auth/signup': { allowedRoles: ['admin', 'teacher', 'parent', 'student'], requiresAuth: false },
  '/dashboard': { allowedRoles: ['admin', 'teacher', 'parent', 'student'], requiresAuth: true },
  '/admin': { allowedRoles: ['admin'], requiresAuth: true },
  '/admin/*': { allowedRoles: ['admin'], requiresAuth: true },
  '/teacher': { allowedRoles: ['teacher', 'admin'], requiresAuth: true },
  '/teacher/*': { allowedRoles: ['teacher', 'admin'], requiresAuth: true },
  '/parent': { allowedRoles: ['parent', 'admin'], requiresAuth: true },
  '/parent/*': { allowedRoles: ['parent', 'admin'], requiresAuth: true },
  '/student': { allowedRoles: ['student', 'admin'], requiresAuth: true },
  '/student/*': { allowedRoles: ['student', 'admin'], requiresAuth: true },
  '/profile': { allowedRoles: ['admin', 'teacher', 'parent', 'student'], requiresAuth: true },
  '/settings': { allowedRoles: ['admin', 'teacher', 'parent', 'student'], requiresAuth: true }
};

export interface AuthError {
  code: string;
  message: string;
  name: string;
}

export type AuthErrorCode = 
  | 'UserNotConfirmedException'
  | 'NotAuthorizedException'
  | 'UserNotFoundException'
  | 'InvalidParameterException'
  | 'CodeMismatchException'
  | 'ExpiredCodeException'
  | 'LimitExceededException'
  | 'TooManyRequestsException'
  | 'InvalidPasswordException'
  | 'UsernameExistsException';