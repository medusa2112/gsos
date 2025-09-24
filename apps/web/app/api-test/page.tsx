'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api/client';

export default function ApiTestPage() {
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [studentsData, setStudentsData] = useState<any>(null);
  const [admissionsData, setAdmissionsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testApi = async () => {
      try {
        setLoading(true);
        setError(null);

        // Test health endpoint
        const health = await apiClient.health();
        setHealthStatus(health);

        // Test students endpoint
        const students = await apiClient.getStudents();
        setStudentsData(students);

        // Test admissions endpoint
        const admissions = await apiClient.getAdmissions();
        setAdmissionsData(admissions);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    testApi();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Testing API connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">API Test Results</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Health Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Health Check</h2>
            <div className="bg-gray-50 rounded p-4">
              <pre className="text-sm text-gray-700">
                {JSON.stringify(healthStatus, null, 2)}
              </pre>
            </div>
            {healthStatus?.ok && (
              <div className="mt-2 flex items-center text-green-600">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                API is healthy
              </div>
            )}
          </div>

          {/* Students Data */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Students Endpoint</h2>
            <div className="bg-gray-50 rounded p-4">
              <pre className="text-sm text-gray-700">
                {JSON.stringify(studentsData, null, 2)}
              </pre>
            </div>
          </div>

          {/* Admissions Data */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Admissions Endpoint</h2>
            <div className="bg-gray-50 rounded p-4">
              <pre className="text-sm text-gray-700">
                {JSON.stringify(admissionsData, null, 2)}
              </pre>
            </div>
          </div>

          {/* Environment Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Environment Info</h2>
            <div className="bg-gray-50 rounded p-4">
              <p className="text-sm text-gray-700">
                <strong>API Base URL:</strong> {process.env.NEXT_PUBLIC_API_BASE || 'Not set'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}