'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-context';
import { ProtectedRouteProps, UserRole } from '@gsos/types/auth';
import { hasPermission, canAccessRoute } from '@gsos/utils/auth';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-blue-600`} />
    </div>
  );
}

interface UnauthorizedProps {
  message?: string;
  onRetry?: () => void;
}

function Unauthorized({ message, onRetry }: UnauthorizedProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
      <div className="max-w-md mx-auto">
        <div className="mb-4">
          <svg 
            className="w-16 h-16 mx-auto text-red-500" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          {message || 'You do not have permission to access this page.'}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

export function ProtectedRoute({ 
  children, 
  requiredRoles, 
  requiredPermissions,
  fallback,
  redirectTo = '/auth/signin',
  showUnauthorized = true 
}: ProtectedRouteProps) {
  const { session, loading, refreshSession } = useAuth();
  const router = useRouter();

  // Show loading spinner while checking authentication
  if (loading) {
    return fallback || <LoadingSpinner />;
  }

  // Redirect to sign-in if not authenticated
  if (!session?.isAuthenticated) {
    router.push(redirectTo);
    return fallback || <LoadingSpinner />;
  }

  const { user } = session;

  // Check role-based access
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.includes(user.role) || 
                           user.groups.some(group => requiredRoles.includes(group as UserRole));
    
    if (!hasRequiredRole) {
      if (showUnauthorized) {
        return (
          <Unauthorized 
            message={`This page requires one of the following roles: ${requiredRoles.join(', ')}`}
            onRetry={refreshSession}
          />
        );
      }
      router.push(redirectTo);
      return fallback || <LoadingSpinner />;
    }
  }

  // Check permission-based access
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasRequiredPermissions = requiredPermissions.every(permission => 
      hasPermission(user.role, permission)
    );
    
    if (!hasRequiredPermissions) {
      if (showUnauthorized) {
        return (
          <Unauthorized 
            message="You do not have the required permissions to access this page."
            onRetry={refreshSession}
          />
        );
      }
      router.push(redirectTo);
      return fallback || <LoadingSpinner />;
    }
  }

  return <>{children}</>;
}

// Higher-order component for protecting pages
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

// Hook for checking route access
export function useRouteAccess(routePath: string) {
  const { session } = useAuth();
  
  if (!session?.isAuthenticated) {
    return { canAccess: false, reason: 'Not authenticated' };
  }

  const canAccess = canAccessRoute(session.user.role, routePath);
  
  return {
    canAccess,
    reason: canAccess ? null : 'Insufficient permissions'
  };
}

// Component for conditionally rendering content based on permissions
interface ConditionalRenderProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requiredPermissions?: string[];
  fallback?: React.ReactNode;
}

export function ConditionalRender({ 
  children, 
  requiredRoles, 
  requiredPermissions, 
  fallback = null 
}: ConditionalRenderProps) {
  const { session } = useAuth();

  if (!session?.isAuthenticated) {
    return <>{fallback}</>;
  }

  const { user } = session;

  // Check role-based access
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.includes(user.role) || 
                           user.groups.some(group => requiredRoles.includes(group as UserRole));
    
    if (!hasRequiredRole) {
      return <>{fallback}</>;
    }
  }

  // Check permission-based access
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasRequiredPermissions = requiredPermissions.every(permission => 
      hasPermission(user.role, permission)
    );
    
    if (!hasRequiredPermissions) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}