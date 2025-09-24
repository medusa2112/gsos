'use client';

import { useState } from 'react';

const API_BASE_URL = 'http://localhost:3003';

export default function TestApiPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testApi = async () => {
    setLoading(true);
    setResult('Testing...');
    
    try {
      console.log('Starting API test...');
      const url = `${API_BASE_URL}/attendance?classId=class-7&from=2025-01-20&to=2025-01-20`;
      console.log('Request URL:', url);
      console.log('Browser info:', navigator.userAgent);
      console.log('Location:', window.location.href);
      
      // Test basic connectivity first
      console.log('Testing basic connectivity...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-user-role': 'teacher',
          'x-user-id': 'teacher-001'
        },
        signal: controller.signal,
        mode: 'cors',
        credentials: 'omit'
      });
      
      clearTimeout(timeoutId);
      
      console.log('Response received!');
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      
      setResult(`Success! Status: ${response.status}, Data: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('API test error:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}\nType: ${error instanceof Error ? error.name : 'Unknown'}`);
    } finally {
      setLoading(false);
    }
  };

  const testStudents = async () => {
    setLoading(true);
    setResult('Testing students endpoint...');
    
    try {
      const url = `${API_BASE_URL}/students`;
      console.log('Testing students URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'x-user-role': 'teacher',
          'x-user-id': 'teacher-001'
        }
      });
      
      console.log('Students response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Students data:', data);
      
      setResult(`Students Success! Status: ${response.status}, Count: ${data.length}`);
    } catch (error) {
      console.error('Students test error:', error);
      setResult(`Students Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testBasicConnectivity = async () => {
    setLoading(true);
    setResult('Testing basic connectivity...');
    
    try {
      // Test if we can reach the server at all
      const url = `${API_BASE_URL}/`;
      console.log('Testing basic connectivity to:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        mode: 'no-cors' // This bypasses CORS but limits what we can read
      });
      
      console.log('Basic connectivity test response:', response);
      setResult(`Basic connectivity: ${response.type === 'opaque' ? 'Server reachable (no-cors)' : 'Success'}`);
    } catch (error) {
      console.error('Basic connectivity error:', error);
      setResult(`Basic connectivity failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">API Connectivity Test</h1>
      
      <div className="space-y-4">
        <button
          onClick={testApi}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Attendance API'}
        </button>
        
        <button
          onClick={testStudents}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 ml-4"
        >
          {loading ? 'Testing...' : 'Test Students API'}
        </button>
        
        <button
          onClick={testBasicConnectivity}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50 ml-4"
        >
          {loading ? 'Testing...' : 'Test Basic Connectivity'}
        </button>
      </div>
      
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Result:</h2>
        <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap">
          {result || 'Click a button to test the API'}
        </pre>
      </div>
      
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Instructions:</h2>
        <p>1. Open browser developer tools (F12)</p>
        <p>2. Go to Console tab</p>
        <p>3. Click "Test Attendance API" button</p>
        <p>4. Check console for detailed logs</p>
      </div>
    </div>
  );
}