'use client';

import { useState } from 'react';

export default function TimetableTestPage() {
  const [status, setStatus] = useState('');
  const [timetableData, setTimetableData] = useState(null);

  const fullTest = async () => {
    setStatus('Starting full authentication and timetable test...\n');
    
    try {
      // Step 1: Clear any existing tokens
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      setStatus(prev => prev + '✅ Cleared existing tokens\n');

      // Step 2: Login
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'ateacher001',
          password: 'teacher123'
        })
      });

      const loginData = await loginResponse.json();
      if (!loginData.success) {
        throw new Error('Login failed: ' + JSON.stringify(loginData));
      }

      setStatus(prev => prev + '✅ Login successful\n');
      
      // Step 3: Store tokens like the AuthContext does
      const authUser = loginData.data;
      localStorage.setItem('auth_token', authUser.token);
      const { token, ...userWithoutToken } = authUser;
      localStorage.setItem('user_data', JSON.stringify(userWithoutToken));
      
      setStatus(prev => prev + '✅ Tokens stored in localStorage\n');

      // Step 4: Test timetable with stored token
      const storedToken = localStorage.getItem('auth_token');
      const timetableResponse = await fetch('/api/timetable', {
        headers: { 'Authorization': `Bearer ${storedToken}` }
      });

      if (!timetableResponse.ok) {
        const errorText = await timetableResponse.text();
        throw new Error(`Timetable API failed: ${timetableResponse.status} - ${errorText}`);
      }

      const timetableResult = await timetableResponse.json();
      setTimetableData(timetableResult);
      
      setStatus(prev => prev + `✅ Timetable API successful - ${timetableResult.timetable?.length || 0} entries\n`);

      // Step 5: Test data structure
      if (timetableResult.timetable && timetableResult.timetable.length > 0) {
        const sample = timetableResult.timetable[0];
        setStatus(prev => prev + `✅ Sample entry: ${sample.day} ${sample.time_slot} - ${sample.subject_name} (${sample.teacher_name})\n`);
      }

      setStatus(prev => prev + '\n🎉 Complete test passed! You can now try the real timetable page.\n');
      setStatus(prev => prev + 'Visit: /timetable (you should already be logged in)\n');

    } catch (error) {
      setStatus(prev => prev + `❌ Error: ${error.message}\n`);
      console.error('Full test error:', error);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Complete Timetable Authentication Test</h1>
      
      <div className="mb-6">
        <button 
          onClick={fullTest}
          className="bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600 mr-4"
        >
          Run Full Test
        </button>
        
        <a 
          href="/timetable"
          className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 inline-block"
        >
          Go to Timetable Page
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-semibold mb-2">Test Status:</h3>
          <pre className="whitespace-pre-wrap text-sm">
            {status || 'Click "Run Full Test" to start'}
          </pre>
        </div>

        {timetableData && (
          <div className="bg-blue-50 p-4 rounded">
            <h3 className="font-semibold mb-2">Timetable Data Preview:</h3>
            <pre className="text-xs overflow-auto max-h-64">
              {JSON.stringify(timetableData, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 border rounded">
        <h3 className="font-semibold mb-2">Troubleshooting:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>If login fails: Check if the server is running on port 3001</li>
          <li>If timetable fails: Check browser console for errors</li>
          <li>If no data shows: Teacher might not have assigned classes</li>
          <li>Try with principal account: <code>principal</code> / <code>principal123</code></li>
        </ul>
      </div>
    </div>
  );
}
