'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';

interface TimetableSlot {
  id: number;
  day: string;
  time_slot: string;
  subject_name: string;
  teacher_name: string;
  class_name: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  '09:00-10:00',
  '10:00-11:00',
  '11:15-12:15',
  '12:15-13:15',
  '14:00-15:00',
  '15:00-16:00'
];

export default function TimetablePage() {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    fetchTimetable();
    if (user?.role === 'principal' || user?.role === 'teacher') {
      fetchClasses();
    }
  }, [selectedClass]);

  const fetchTimetable = async () => {
    try {
      const url = selectedClass 
        ? `/api/timetable?class_id=${selectedClass}`
        : '/api/timetable';
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTimetable(data.timetable);
      }
    } catch (error) {
      console.error('Error fetching timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes');
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const getTimetableSlot = (day: string, timeSlot: string) => {
    return timetable.find(slot => slot.day === day && slot.time_slot === timeSlot);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Timetable</h1>
          
          {(user?.role === 'principal' || user?.role === 'teacher') && (
            <div className="flex items-center space-x-4">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  {user?.role === 'teacher' ? 'My Classes' : 'All Classes'}
                </option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  {DAYS.map((day) => (
                    <th
                      key={day}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {TIME_SLOTS.map((timeSlot) => (
                  <tr key={timeSlot}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {timeSlot}
                    </td>
                    {DAYS.map((day) => {
                      const slot = getTimetableSlot(day, timeSlot);
                      return (
                        <td key={`${day}-${timeSlot}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {slot ? (
                            <div className="space-y-1">
                              <div className="font-medium text-blue-600">
                                {slot.subject_name}
                              </div>
                              <div className="text-gray-500 text-xs">
                                {slot.teacher_name}
                              </div>
                              {(user?.role === 'principal' || user?.role === 'teacher') && (
                                <div className="text-gray-400 text-xs">
                                  {slot.class_name}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-gray-400 text-sm">-</div>
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

        {/* Legend */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Legend</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <div><span className="font-medium">Subject Name</span> - The subject being taught</div>
            <div><span className="font-medium">Teacher Name</span> - The instructor for the class</div>
            {(user?.role === 'principal' || user?.role === 'teacher') && (
              <div><span className="font-medium">Class Name</span> - The class/grade level</div>
            )}
          </div>
        </div>

        {user?.role === 'principal' && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Timetable Management</h2>
            <div className="flex space-x-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                Add New Slot
              </button>
              <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                Bulk Import
              </button>
              <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
                Export Schedule
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
