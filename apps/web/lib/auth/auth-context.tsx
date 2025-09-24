'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  AuthSession, 
  AuthTokens, 
  UserProfile, 
  UserRole,
  AuthContextType,
  AuthError 
} from '@gsos/types/auth';
import { 
  getCurrentUser, 
  signOut as cognitoSignOut,
  fetchAuthSession,
  signIn,
  confirmSignIn,
  resendSignUpCode,
  confirmSignUp
} from 'aws-amplify/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const user = await getCurrentUser();
      const authSession = await fetchAuthSession();
      
      if (user && authSession.tokens) {
        const idToken = authSession.tokens.idToken;
        const accessToken = authSession.tokens.accessToken;
        
        // Extract user profile from tokens
        const userProfile: UserProfile = {
          id: user.userId,
          email: user.signInDetails?.loginId || '',
          firstName: idToken?.payload.given_name as string || '',
          lastName: idToken?.payload.family_name as string || '',
          role: (idToken?.payload['custom:role'] as UserRole) || 'student',
          groups: (idToken?.payload['cognito:groups'] as string[]) || [],
          emailVerified: idToken?.payload.email_verified as boolean || false,
          mfaEnabled: user.signInDetails?.authFlowType === 'USER_SRP_AUTH',
          lastSignIn: new Date(accessToken?.payload.auth_time as number * 1000),
          createdAt: new Date(user.signInDetails?.loginId ? Date.now() : 0),
          updatedAt: new Date()
        };

        const tokens: AuthTokens = {
          accessToken: accessToken?.toString() || '',
          idToken: idToken?.toString() || '',
          refreshToken: authSession.tokens.refreshToken?.toString() || '',
          expiresAt: new Date((accessToken?.payload.exp as number) * 1000)
        };

        setSession({
          user: userProfile,
          tokens,
          isAuthenticated: true
        });
      } else {
        setSession(null);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      setSession(null);
      setError({
        code: 'AUTH_CHECK_FAILED',
        message: 'Failed to check authentication state',
        details: err
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await signIn({ username: email, password });
      
      if (result.isSignedIn) {
        await checkAuthState();
        return { success: true };
      } else {
        // Handle MFA or other challenges
        return { 
          success: false, 
          nextStep: result.nextStep,
          challengeName: result.nextStep?.signInStep 
        };
      }
    } catch (err: any) {
      const authError: AuthError = {
        code: err.name || 'SIGN_IN_FAILED',
        message: err.message || 'Sign in failed',
        details: err
      };
      setError(authError);
      return { success: false, error: authError };
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSignIn = async (challengeResponse: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await confirmSignIn({ challengeResponse });
      
      if (result.isSignedIn) {
        await checkAuthState();
        return { success: true };
      } else {
        return { 
          success: false, 
          nextStep: result.nextStep,
          challengeName: result.nextStep?.signInStep 
        };
      }
    } catch (err: any) {
      const authError: AuthError = {
        code: err.name || 'CONFIRM_SIGN_IN_FAILED',
        message: err.message || 'Sign in confirmation failed',
        details: err
      };
      setError(authError);
      return { success: false, error: authError };
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await cognitoSignOut();
      setSession(null);
      return { success: true };
    } catch (err: any) {
      const authError: AuthError = {
        code: err.name || 'SIGN_OUT_FAILED',
        message: err.message || 'Sign out failed',
        details: err
      };
      setError(authError);
      return { success: false, error: authError };
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    await checkAuthState();
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    session,
    loading,
    error,
    signIn: handleSignIn,
    confirmSignIn: handleConfirmSignIn,
    signOut: handleSignOut,
    refreshSession,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}