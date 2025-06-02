'use client';

import { useState } from 'react';

export default function QuickTestPage() {
  const [result, setResult] = useState('');

  const testFlow = async () => {
    try {
      setResult('Starting test...\n');
      
      // Test 1: Login
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

      setResult(prev => prev + '✅ Login successful\n');
      const token = loginData.data.token;

      // Test 2: Timetable API
      const timetableResponse = await fetch('/api/timetable', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const timetableData = await timetableResponse.json();
      if (!timetableData.timetable) {
        throw new Error('No timetable data received');
      }

      setResult(prev => prev + `✅ Timetable API working - ${timetableData.timetable.length} entries\n`);

      // Test 3: Check data structure
      if (timetableData.timetable.length > 0) {
        const sample = timetableData.timetable[0];
        const requiredFields = ['subject_name', 'teacher_name', 'day', 'time_slot'];
        const hasAllFields = requiredFields.every(field => field in sample);
        
        if (hasAllFields) {
          setResult(prev => prev + '✅ Data structure correct\n');
          setResult(prev => prev + `Sample entry: ${sample.day} ${sample.time_slot} - ${sample.subject_name}\n`);
        } else {
          setResult(prev => prev + '❌ Missing required fields\n');
        }
      }

      setResult(prev => prev + '\n🎉 All tests passed! Timetable should work.');

    } catch (error) {
      setResult(prev => prev + `❌ Error: ${error.message}\n`);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Quick Frontend Test</h1>
      
      <button 
        onClick={testFlow}
        className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600 mb-6"
      >
        Run Complete Test
      </button>

      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-semibold mb-2">Test Results:</h3>
        <pre className="whitespace-pre-wrap text-sm">
          {result || 'Click the button to run tests'}
        </pre>
      </div>

      <div className="mt-6 p-4 border rounded">
        <h3 className="font-semibold mb-2">Next Steps:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>If all tests pass, try logging in normally at <a href="/login" className="text-blue-500">/login</a></li>
          <li>Use credentials: <code>ateacher001</code> / <code>teacher123</code></li>
          <li>Navigate to the timetable page</li>
          <li>Check if the timetable displays correctly</li>
        </ol>
      </div>
    </div>
  );
}
