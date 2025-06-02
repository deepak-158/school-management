'use client';

import { useState, useEffect } from 'react';

export default function DebugPage() {
  const [authData, setAuthData] = useState<any>(null);
  const [timetableData, setTimetableData] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Check auth state
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    setAuthData({ token: token ? 'exists' : 'missing', userData: userData ? JSON.parse(userData) : null });
  }, []);

  const testLogin = async () => {
    try {
      setError('');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'principal',
          password: 'password123'
        }),
      });

      const result = await response.json();
      console.log('Login result:', result);
      
      if (result.success) {
        localStorage.setItem('auth_token', result.data.token);
        localStorage.setItem('user_data', JSON.stringify(result.data));
        setAuthData({ token: 'exists', userData: result.data });
        setError('Login successful!');
      } else {
        setError('Login failed: ' + JSON.stringify(result));
      }
    } catch (err) {
      setError('Login error: ' + err);
    }
  };

  const testTimetable = async () => {
    try {
      setError('');
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('No token found. Please login first.');
        return;
      }

      const response = await fetch('/api/timetable', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      console.log('Timetable result:', result);
      
      if (response.ok) {
        setTimetableData(result);
        setError('Timetable loaded successfully!');
      } else {
        setError('Timetable failed: ' + JSON.stringify(result));
      }
    } catch (err) {
      setError('Timetable error: ' + err);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Debug Page</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold">Auth Status:</h2>
          <pre>{JSON.stringify(authData, null, 2)}</pre>
        </div>

        <div className="space-x-4">
          <button 
            onClick={testLogin}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test Login
          </button>
          <button 
            onClick={testTimetable}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Test Timetable API
          </button>
        </div>

        {error && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {timetableData && (
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="font-semibold">Timetable Data:</h2>
            <p>Entries: {timetableData.timetable?.length || 0}</p>
            {timetableData.timetable?.slice(0, 3).map((entry: any, i: number) => (
              <div key={i} className="text-sm">
                {entry.day} {entry.time_slot}: {entry.subject_name} ({entry.class_name}) - {entry.teacher_name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
