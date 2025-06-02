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
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month'>('month');

  useEffect(() => {
    // Redirect if not principal
    if (user && user.role !== 'principal') {
      window.location.href = '/dashboard';
      return;
    }
    fetchAnalytics();
  }, [user, timeRange]);  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch real data from API
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setAnalytics(data.analytics);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError('Failed to fetch analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      // Generate and download a comprehensive PDF report
      const reportData = {
        generatedAt: new Date().toISOString(),
        timeRange,
        ...analytics
      };
      
      // Create a simple text report for now (could be enhanced to PDF later)
      const reportContent = `
SCHOOL ANALYTICS REPORT
Generated: ${new Date().toLocaleDateString()}
Time Range: ${timeRange}

OVERVIEW:
- Total Students: ${analytics?.overview.totalStudents}
- Total Teachers: ${analytics?.overview.totalTeachers}
- Total Classes: ${analytics?.overview.totalClasses}
- Average Attendance: ${analytics?.overview.avgAttendance}%

ATTENDANCE TRENDS:
${analytics?.attendance.map(data => `${data.month}: Students ${data.students}%, Teachers ${data.teachers}%`).join('\n')}

CLASS PERFORMANCE:
${analytics?.performance.map(data => `${data.class}: ${data.avgGrade.toFixed(1)}% (${data.students} students)`).join('\n')}

LEAVE REQUESTS:
${analytics?.leaveRequests.map(data => `${data.month}: Approved ${data.approved}, Rejected ${data.rejected}, Pending ${data.pending}`).join('\n')}
      `;

      // Create and download the report
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `school-analytics-report-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      alert('Report generated and downloaded successfully!');
    } catch (err) {
      alert('Failed to generate report. Please try again.');
    }
  };

  const handleExportData = async () => {
    try {
      if (!analytics) return;
      
      // Convert analytics data to CSV format
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Overview data
      csvContent += "Overview Data\n";
      csvContent += "Metric,Value\n";
      csvContent += `Total Students,${analytics.overview.totalStudents}\n`;
      csvContent += `Total Teachers,${analytics.overview.totalTeachers}\n`;
      csvContent += `Total Classes,${analytics.overview.totalClasses}\n`;
      csvContent += `Average Attendance,${analytics.overview.avgAttendance}%\n\n`;
      
      // Attendance data
      csvContent += "Attendance Trends\n";
      csvContent += "Month,Students %,Teachers %\n";
      analytics.attendance.forEach(data => {
        csvContent += `${data.month},${data.students},${data.teachers}\n`;
      });
      csvContent += "\n";
      
      // Performance data
      csvContent += "Class Performance\n";
      csvContent += "Class,Average Grade,Student Count\n";
      analytics.performance.forEach(data => {
        csvContent += `${data.class},${data.avgGrade},${data.students}\n`;
      });
      csvContent += "\n";
      
      // Leave requests data
      csvContent += "Leave Requests\n";
      csvContent += "Month,Approved,Rejected,Pending\n";
      analytics.leaveRequests.forEach(data => {
        csvContent += `${data.month},${data.approved},${data.rejected},${data.pending}\n`;
      });

      // Create and download the CSV
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `school-analytics-data-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('Data exported successfully!');
    } catch (err) {
      alert('Failed to export data. Please try again.');
    }
  };

  const handleScheduleMeeting = () => {
    // For now, this will show a simple dialog
    // In a real implementation, this could integrate with calendar systems
    const meetingTypes = [
      'Staff Meeting',
      'Parent-Teacher Conference',
      'Academic Review Meeting',
      'Emergency Meeting',
      'Budget Planning Meeting'
    ];
    
    const selectedType = prompt(`Select meeting type:\n${meetingTypes.map((type, index) => `${index + 1}. ${type}`).join('\n')}\n\nEnter the number (1-5):`);
    
    if (selectedType && parseInt(selectedType) >= 1 && parseInt(selectedType) <= 5) {
      const meetingType = meetingTypes[parseInt(selectedType) - 1];
      const date = prompt('Enter meeting date (YYYY-MM-DD):');
      const time = prompt('Enter meeting time (HH:MM):');
      
      if (date && time) {
        // In a real app, this would save to the database
        alert(`Meeting scheduled successfully!\n\nType: ${meetingType}\nDate: ${date}\nTime: ${time}\n\nThis would normally be saved to the system and notifications sent to relevant staff.`);
      } else {
        alert('Meeting scheduling cancelled - missing date or time.');
      }
    } else {
      alert('Meeting scheduling cancelled.');
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
            value={timeRange}            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
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
        </div>        {/* Quick Actions */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={handleGenerateReport}
              className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-sm font-medium text-gray-900">Generate Report</div>
              <div className="text-xs text-gray-500 mt-1">Create comprehensive school report</div>
            </button>
            <button 
              onClick={handleExportData}
              className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-sm font-medium text-gray-900">Export Data</div>
              <div className="text-xs text-gray-500 mt-1">Download analytics data as CSV</div>
            </button>
            <button 
              onClick={handleScheduleMeeting}
              className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-sm font-medium text-gray-900">Schedule Meeting</div>
              <div className="text-xs text-gray-500 mt-1">Arrange staff meeting</div>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
