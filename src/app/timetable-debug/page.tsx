'use client';

import { useState, useEffect } from 'react';

// Time slots from the database
const TIME_SLOTS = ['09:00-09:45', '09:45-10:30', '10:45-11:30', '11:30-12:15', '13:00-13:45', '13:45-14:30'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

interface TimetableEntry {
  id: number;
  class_id: number;
  subject: string;
  teacher_name: string;
  day: string;
  time_slot: string;
  class_name: string;
}

interface GroupedTimetable {
  [className: string]: {
    [day: string]: {
      [timeSlot: string]: TimetableEntry;
    };
  };
}

export default function TimetableDebugPage() {
  const [timetableData, setTimetableData] = useState<TimetableEntry[]>([]);
  const [groupedTimetable, setGroupedTimetable] = useState<GroupedTimetable>({});
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rawResponse, setRawResponse] = useState('');

  // Test login and get data
  const fetchDataWithAuth = async () => {
    setLoading(true);
    setError('');
    
    try {
      // First login
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'teacher1',
          password: 'teacher123'
        }),
      });

      const loginData = await loginResponse.json();
      
      if (!loginData.token) {
        throw new Error('Login failed: ' + JSON.stringify(loginData));
      }

      // Then fetch timetable
      const timetableResponse = await fetch('/api/timetable', {
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json',
        },
      });

      const timetableResponseData = await timetableResponse.json();
      setRawResponse(JSON.stringify(timetableResponseData, null, 2));

      if (!timetableResponse.ok) {
        throw new Error(`Timetable API error: ${timetableResponseData.error || 'Unknown error'}`);
      }

      const data = timetableResponseData.data || [];
      setTimetableData(data);

      // Group the data
      const grouped: GroupedTimetable = {};
      data.forEach((entry: TimetableEntry) => {
        if (!grouped[entry.class_name]) {
          grouped[entry.class_name] = {};
        }
        if (!grouped[entry.class_name][entry.day]) {
          grouped[entry.class_name][entry.day] = {};
        }
        grouped[entry.class_name][entry.day][entry.time_slot] = entry;
      });
      
      setGroupedTimetable(grouped);
      
      // Set first class as selected if none selected
      if (!selectedClass && Object.keys(grouped).length > 0) {
        setSelectedClass(Object.keys(grouped)[0]);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const availableClasses = Object.keys(groupedTimetable);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Timetable Debug Page</h1>
      
      <div className="mb-6 space-y-4">
        <button 
          onClick={fetchDataWithAuth}
          disabled={loading}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Fetch Timetable Data'}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <h3 className="font-semibold text-red-800 mb-2">Error:</h3>
            <pre className="text-red-700 text-sm whitespace-pre-wrap">{error}</pre>
          </div>
        )}
      </div>

      {timetableData.length > 0 && (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded p-4">
            <h3 className="font-semibold text-green-800 mb-2">Success!</h3>
            <p className="text-green-700">Found {timetableData.length} timetable entries</p>
            <p className="text-green-700">Available classes: {availableClasses.join(', ')}</p>
          </div>

          {availableClasses.length > 1 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Class:
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2"
              >
                {availableClasses.map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedClass && groupedTimetable[selectedClass] && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-blue-600 text-white px-6 py-4">
                <h2 className="text-xl font-semibold">Timetable for {selectedClass}</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      {DAYS.map((day) => (
                        <th key={day} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {TIME_SLOTS.map((timeSlot) => (
                      <tr key={timeSlot}>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {timeSlot}
                        </td>
                        {DAYS.map((day) => {
                          const entry = groupedTimetable[selectedClass]?.[day]?.[timeSlot];
                          return (
                            <td key={`${day}-${timeSlot}`} className="px-4 py-4 whitespace-nowrap">
                              {entry ? (
                                <div className="text-sm">
                                  <div className="font-medium text-gray-900">{entry.subject}</div>
                                  <div className="text-gray-500">{entry.teacher_name}</div>
                                </div>
                              ) : (
                                <div className="text-sm text-gray-400">-</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {rawResponse && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">Raw API Response:</h3>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {rawResponse}
          </pre>
        </div>
      )}

      <div className="mt-8 bg-gray-50 p-4 rounded">
        <h3 className="text-lg font-semibold mb-2">Debug Info:</h3>
        <div className="space-y-2 text-sm">
          <p><strong>Expected Time Slots:</strong> {TIME_SLOTS.join(', ')}</p>
          <p><strong>Expected Days:</strong> {DAYS.join(', ')}</p>
          <p><strong>Data Count:</strong> {timetableData.length}</p>
          <p><strong>Grouped Classes:</strong> {availableClasses.length}</p>
        </div>
      </div>
    </div>
  );
}
