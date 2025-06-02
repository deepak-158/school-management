'use client';

import { useState } from 'react';

export default function ApiTestPage() {
  const [loginResult, setLoginResult] = useState('');
  const [timetableResult, setTimetableResult] = useState('');
  const [token, setToken] = useState('');

  const testLogin = async () => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'teacher1',
          password: 'teacher123'
        }),
      });

      const data = await response.json();
      setLoginResult(JSON.stringify(data, null, 2));
      
      if (data.token) {
        setToken(data.token);
      }
    } catch (error) {
      setLoginResult(`Error: ${error}`);
    }
  };

  const testTimetable = async () => {
    if (!token) {
      setTimetableResult('No token available. Please login first.');
      return;
    }

    try {
      const response = await fetch('/api/timetable', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setTimetableResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setTimetableResult(`Error: ${error}`);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">API Test Page</h1>
      
      <div className="space-y-6">
        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Login Test</h2>
          <button 
            onClick={testLogin}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test Login (teacher1)
          </button>
          <pre className="mt-4 bg-gray-100 p-4 rounded overflow-auto text-sm">
            {loginResult || 'Click test login to see results'}
          </pre>
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Timetable Test</h2>
          <button 
            onClick={testTimetable}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            disabled={!token}
          >
            Test Timetable API
          </button>
          <pre className="mt-4 bg-gray-100 p-4 rounded overflow-auto text-sm">
            {timetableResult || 'Click test timetable to see results (login first)'}
          </pre>
        </div>

        {token && (
          <div className="border p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Current Token</h2>
            <code className="bg-gray-100 p-2 rounded text-sm break-all">
              {token}
            </code>
          </div>
        )}
      </div>
    </div>
  );
}
