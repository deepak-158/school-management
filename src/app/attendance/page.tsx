'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';

interface AttendanceRecord {
  id: number;
  date: string;
  status: 'present' | 'absent' | 'late';
  student_name: string;
  student_id: string;
  class_name: string;
}

export default function AttendancePage() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [markingAttendance, setMarkingAttendance] = useState(false);

  useEffect(() => {
    fetchAttendance();
    if (user?.role === 'principal' || user?.role === 'teacher') {
      fetchClasses();
    }
  }, [selectedDate, selectedClass]);

  useEffect(() => {
    if (selectedClass && (user?.role === 'principal' || user?.role === 'teacher')) {
      fetchStudents();
    }
  }, [selectedClass]);
  const fetchAttendance = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedDate) params.append('date', selectedDate);
      if (selectedClass) params.append('class_id', selectedClass);

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/attendance?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAttendance(data.attendance);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };
  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/classes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };
  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/students?class_id=${selectedClass}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };
  const markAttendance = async (studentId: number, status: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          student_id: studentId,
          date: selectedDate,
          status: status,
        }),
      });

      if (response.ok) {
        fetchAttendance();
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
    }
  };

  const markBulkAttendance = async () => {
    setMarkingAttendance(true);
    try {
      const attendanceData = students.map(student => {
        const existing = attendance.find(a => a.student_id === student.student_id);
        return {
          student_id: student.id,
          date: selectedDate,
          status: existing?.status || 'present',
        };
      });      const response = await fetch('/api/attendance/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ attendance: attendanceData }),
      });

      if (response.ok) {
        fetchAttendance();
      }
    } catch (error) {
      console.error('Error marking bulk attendance:', error);
    } finally {
      setMarkingAttendance(false);
    }
  };

  const getAttendanceStatus = (studentId: string) => {
    const record = attendance.find(a => a.student_id === studentId);
    return record?.status || 'not_marked';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
          
          <div className="flex items-center space-x-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {(user?.role === 'principal' || user?.role === 'teacher') && (
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  {user?.role === 'teacher' ? 'Select Class' : 'All Classes'}
                </option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {user?.role === 'student' ? (
          // Student View - Their own attendance history
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">My Attendance History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendance.map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // Teacher/Principal View - Mark attendance
          selectedClass && (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  Mark Attendance - {new Date(selectedDate).toLocaleDateString()}
                </h2>
                <button
                  onClick={markBulkAttendance}
                  disabled={markingAttendance}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {markingAttendance ? 'Saving...' : 'Save All'}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => {
                      const status = getAttendanceStatus(student.student_id);
                      return (
                        <tr key={student.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.student_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.full_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
                              {status === 'not_marked' ? 'Not Marked' : status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                            <button
                              onClick={() => markAttendance(student.id, 'present')}
                              className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                            >
                              Present
                            </button>
                            <button
                              onClick={() => markAttendance(student.id, 'absent')}
                              className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                            >
                              Absent
                            </button>
                            <button
                              onClick={() => markAttendance(student.id, 'late')}
                              className="bg-yellow-600 text-white px-2 py-1 rounded text-xs hover:bg-yellow-700"
                            >
                              Late
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {/* Attendance Summary for Teachers/Principal */}
        {(user?.role === 'principal' || user?.role === 'teacher') && attendance.length > 0 && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Attendance Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-green-600 text-2xl font-bold">
                  {attendance.filter(a => a.status === 'present').length}
                </div>
                <div className="text-green-700 text-sm">Present</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-red-600 text-2xl font-bold">
                  {attendance.filter(a => a.status === 'absent').length}
                </div>
                <div className="text-red-700 text-sm">Absent</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-yellow-600 text-2xl font-bold">
                  {attendance.filter(a => a.status === 'late').length}
                </div>
                <div className="text-yellow-700 text-sm">Late</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-blue-600 text-2xl font-bold">
                  {Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100)}%
                </div>
                <div className="text-blue-700 text-sm">Attendance Rate</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
