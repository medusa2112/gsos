'use client';

import { useAuth } from '../../lib/auth';
import { useState } from 'react';

export default function AuthTestPage() {
  const { session, isLoading, signIn, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await signIn(email, password);
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err instanceof Error ? err.message : 'Sign in failed');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Admin Authentication Test
          </h1>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {session?.user ? (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Admin Welcome, {session.user.givenName} {session.user.familyName}!
            </h2>
            
            <div className="space-y-3 mb-6">
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <span className="ml-2 text-gray-900">{session.user.email}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Role:</span>
                <span className="ml-2 text-gray-900 font-semibold text-red-600">{session.user.role}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">School ID:</span>
                <span className="ml-2 text-gray-900">{session.user.schoolId || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Groups:</span>
                <span className="ml-2 text-gray-900">
                  {session.user.groups?.join(', ') || 'None'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Groups (Raw):</span>
                <div className="ml-2 mt-1">
                  {session.user.groups && session.user.groups.length > 0 ? (
                    <div className="grid grid-cols-1 gap-1">
                      {session.user.groups.slice(0, 5).map((group: string, index: number) => (
                        <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {group}
                        </span>
                      ))}
                      {session.user.groups.length > 5 && (
                        <span className="text-xs text-gray-500">
                          +{session.user.groups.length - 5} more...
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-500">None</span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={signOut}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Admin Sign In
            </h2>
            
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Admin Sign In
              </button>
            </form>
          </div>
        )}

        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Admin Authentication Status
          </h3>
          
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-gray-700">Loading:</span>
              <span className={`ml-2 ${isLoading ? 'text-yellow-600' : 'text-green-600'}`}>
                {isLoading ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Authenticated:</span>
              <span className={`ml-2 ${session?.user ? 'text-green-600' : 'text-red-600'}`}>
                {session?.user ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Error:</span>
              <span className={`ml-2 ${error ? 'text-red-600' : 'text-green-600'}`}>
                {error || 'None'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}