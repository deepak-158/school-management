'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface AnalyticsData {
  overview: {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    avgAttendance: number;
  };
  attendance: {
    month: string;
    students: number;
    teachers: number;
  }[];
  performance: {
    class: string;
    avgGrade: number;
    students: number;
  }[];
  leaveRequests: {
    month: string;
    approved: number;
    rejected: number;
    pending: number;
  }[];
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'semester'>('month');

  useEffect(() => {
    // Redirect if not principal
    if (user && user.role !== 'principal') {
      window.location.href = '/dashboard';
      return;
    }
    fetchAnalytics();
  }, [user, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockData: AnalyticsData = {
        overview: {
          totalStudents: 450,
          totalTeachers: 28,
          totalClasses: 15,
          avgAttendance: 87.5
        },
        attendance: [
          { month: 'Jan', students: 89, teachers: 96 },
          { month: 'Feb', students: 85, teachers: 94 },
          { month: 'Mar', students: 91, teachers: 98 },
          { month: 'Apr', students: 88, teachers: 95 },
          { month: 'May', students: 86, teachers: 93 },
          { month: 'Jun', students: 90, teachers: 97 }
        ],
        performance: [
          { class: 'Class 10A', avgGrade: 85.2, students: 30 },
          { class: 'Class 10B', avgGrade: 82.7, students: 28 },
          { class: 'Class 9A', avgGrade: 88.1, students: 32 },
          { class: 'Class 9B', avgGrade: 79.5, students: 29 },
          { class: 'Class 8A', avgGrade: 91.3, students: 31 }
        ],
        leaveRequests: [
          { month: 'Jan', approved: 12, rejected: 3, pending: 1 },
          { month: 'Feb', approved: 8, rejected: 2, pending: 0 },
          { month: 'Mar', approved: 15, rejected: 4, pending: 2 },
          { month: 'Apr', approved: 10, rejected: 1, pending: 1 },
          { month: 'May', approved: 18, rejected: 5, pending: 3 },
          { month: 'Jun', approved: 14, rejected: 2, pending: 4 }
        ]
      };
      setAnalytics(mockData);
    } catch (err) {
      setError('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  if (error || !analytics) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="text-lg font-medium text-red-800">Error</h3>
            <p className="mt-2 text-red-600">{error || 'Failed to load analytics'}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">School Analytics</h1>
            <p className="mt-1 text-sm text-gray-600">
              Comprehensive insights into school performance and operations
            </p>
          </div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="semester">This Semester</option>
          </select>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Students</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics.overview.totalStudents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">👨‍🏫</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Teachers</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics.overview.totalTeachers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">🏫</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Classes</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics.overview.totalClasses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-orange-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Attendance</p>
                <p className="text-2xl font-semibold text-gray-900">{analytics.overview.avgAttendance}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Attendance Trends */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Trends</h3>
            <div className="space-y-4">
              {analytics.attendance.map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 w-12">{data.month}</span>
                  <div className="flex-1 mx-4">
                    <div className="flex space-x-2">
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-1">Students: {data.students}%</div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${data.students}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-1">Teachers: {data.teachers}%</div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${data.teachers}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Class Performance */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Performance</h3>
            <div className="space-y-4">
              {analytics.performance.map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-900">{data.class}</span>
                      <span className="text-sm text-gray-500">{data.avgGrade.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          data.avgGrade >= 90 ? 'bg-green-500' :
                          data.avgGrade >= 80 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${data.avgGrade}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{data.students} students</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Leave Requests Analytics */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave Requests Analytics</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-500">Month</th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-500">Approved</th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-500">Rejected</th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-500">Pending</th>
                  <th className="text-left py-2 px-4 text-sm font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody>
                {analytics.leaveRequests.map((data, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2 px-4 text-sm text-gray-900">{data.month}</td>
                    <td className="py-2 px-4">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {data.approved}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        {data.rejected}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {data.pending}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-sm font-medium text-gray-900">
                      {data.approved + data.rejected + data.pending}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-sm font-medium text-gray-900">Generate Report</div>
              <div className="text-xs text-gray-500 mt-1">Create comprehensive school report</div>
            </button>
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-sm font-medium text-gray-900">Export Data</div>
              <div className="text-xs text-gray-500 mt-1">Download analytics data as CSV</div>
            </button>
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-sm font-medium text-gray-900">Schedule Meeting</div>
              <div className="text-xs text-gray-500 mt-1">Arrange staff meeting</div>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
