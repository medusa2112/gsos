// Auth context and hooks
export { AuthProvider, useAuth } from './auth-context';

// Protected route components
export { 
  ProtectedRoute, 
  withAuth, 
  useRouteAccess, 
  ConditionalRender 
} from './protected-route';

// Amplify configuration
export { configureAmplify } from './amplify-config';

// Re-export auth types for convenience
export type {
  UserRole,
  UserProfile,
  AuthSession,
  AuthTokens,
  AuthContextType,
  ProtectedRouteProps,
  RoutePermissions,
  AuthError
} from '@gsos/types/auth';