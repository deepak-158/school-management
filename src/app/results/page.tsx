'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { TrendingUp, Award, Calendar, BookOpen, User, FileText } from 'lucide-react';

interface Result {
  id: number;
  subject_name: string;
  subject_code: string;
  exam_type: string;
  exam_date: string;
  max_marks: number;
  obtained_marks: number;
  grade: string;
  remarks?: string;
  teacher_name: string;
  academic_year: string;
  created_at: string;
}

interface ResultsStats {
  totalExams: number;
  averageMarks: number;
  highestMarks: number;
  lowestMarks: number;
  totalSubjects: number;
  passedExams: number;
  classRank?: number;
  totalStudentsInClass?: number;
  classPercentile?: number;
  // Principal analytics
  totalResults?: number;
  totalStudents?: number;
  overallAverage?: number;
  classPerformance?: any[];
  subjectPerformance?: any[];
  topPerformers?: any[];
}

export default function ResultsPage() {
  const { user } = useAuth();
  const [results, setResults] = useState<Result[]>([]);
  const [stats, setStats] = useState<ResultsStats | null>(null);
  const [loading, setLoading] = useState(true);  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2024-2025');
  const [selectedExamType, setSelectedExamType] = useState('all');
  const [error, setError] = useState('');  useEffect(() => {
    if (user) {
      fetchResults();
    }
  }, [user, selectedAcademicYear, selectedExamType]);  const fetchResults = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        academic_year: selectedAcademicYear,
        ...(selectedExamType !== 'all' && { exam_type: selectedExamType })
      });
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/results?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }
      
      const data = await response.json();
      setResults(data.results || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Error fetching results:', error);
      setError('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade?.toUpperCase()) {
      case 'A+':
      case 'A':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'B+':
      case 'B':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'C+':
      case 'C':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'D':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'F':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const calculatePercentage = (obtained: number, max: number) => {
    return max > 0 ? Math.round((obtained / max) * 100) : 0;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">Academic Results</h1>
            <p className="text-purple-100">Track your academic performance and progress</p>
          </div>          {/* Filters */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="academic-year" className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Year
                </label>
                <select
                  id="academic-year"
                  value={selectedAcademicYear}
                  onChange={(e) => setSelectedAcademicYear(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="2024-2025">2024-2025</option>
                  <option value="2023-2024">2023-2024</option>
                  <option value="2025-2026">2025-2026</option>
                </select>
              </div>
              <div>
                <label htmlFor="exam-type" className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Type
                </label>
                <select
                  id="exam-type"
                  value={selectedExamType}
                  onChange={(e) => setSelectedExamType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Exam Types</option>
                  <option value="First Term Exam">First Term Exam (100 marks)</option>
                  <option value="Second Term Exam">Second Term Exam (100 marks)</option>
                  <option value="Final Exam">Final Exam (100 marks)</option>
                </select>
              </div>
            </div>
          </div>          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Exams</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalExams}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Average Marks</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.averageMarks}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Highest Score</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.highestMarks}%</p>
                  </div>
                  <Award className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Lowest Score</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.lowestMarks}%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Subjects</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalSubjects}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Passed Exams</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.passedExams}</p>
                  </div>
                  <Award className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>
          )}

          {/* Grand Total Rankings for Students */}
          {user?.role === 'student' && (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Academic Rankings</h2>
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200">
                <p className="text-sm text-indigo-700 mb-2">
                  Rankings are calculated based on your grand total marks across all three standardized exams:
                </p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white rounded-lg p-3 border border-indigo-100">
                    <p className="text-xs font-medium text-indigo-600">First Term</p>
                    <p className="text-lg font-bold text-indigo-900">100 marks</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-indigo-100">
                    <p className="text-xs font-medium text-indigo-600">Second Term</p>
                    <p className="text-lg font-bold text-indigo-900">100 marks</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-indigo-100">
                    <p className="text-xs font-medium text-indigo-600">Final Exam</p>
                    <p className="text-lg font-bold text-indigo-900">100 marks</p>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm font-medium text-indigo-800">
                    Total Possible: <span className="text-lg">300 marks per subject</span>
                  </p>
                  <button 
                    onClick={() => window.open('/rankings', '_blank')}
                    className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    View Detailed Rankings
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Class Ranking Section for Students */}
          {user?.role === 'student' && stats && stats.classRank && (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Class Ranking</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-700 mb-1">Class Rank</p>
                      <p className="text-2xl font-bold text-blue-900">#{stats.classRank}</p>
                    </div>
                    <Award className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700 mb-1">Class Percentile</p>
                      <p className="text-2xl font-bold text-green-900">{stats.classPercentile}%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-700 mb-1">Total Students</p>
                      <p className="text-2xl font-bold text-purple-900">{stats.totalStudentsInClass}</p>
                    </div>
                    <User className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Principal Analytics */}
          {user?.role === 'principal' && stats && stats.classPerformance && (
            <div className="space-y-6">
              {/* Class Performance */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Class Performance Overview</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average %</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Exams</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stats.classPerformance.map((classData: any) => (
                        <tr key={classData.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {classData.class_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {classData.student_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {Math.round(classData.avg_percentage)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {classData.total_exams}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    classData.avg_percentage >= 80 ? 'bg-green-500' :
                                    classData.avg_percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(classData.avg_percentage, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-500">{Math.round(classData.avg_percentage)}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Performers */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.topPerformers?.slice(0, 6).map((student: any, index: number) => (
                    <div key={index} className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border border-yellow-200">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{student.student_name}</h3>
                        <span className="text-lg font-bold text-yellow-600">#{index + 1}</span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Class: {student.class_name}</p>
                        <p>Roll No: {student.roll_number}</p>
                        <p>Average: <span className="font-semibold text-green-600">{Math.round(student.avg_percentage)}%</span></p>
                        <p>Total Exams: {student.total_exams}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Results Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Exam Results</h2>
            </div>
            <div className="overflow-x-auto">
              {error ? (
                <div className="p-6 text-center">
                  <p className="text-red-600">{error}</p>
                </div>
              ) : results.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500">No results found for the selected filters.</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Exam Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Marks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Teacher
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remarks
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.map((result) => (
                      <tr key={result.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {result.subject_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {result.subject_code}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {result.exam_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.exam_date ? new Date(result.exam_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {result.obtained_marks}/{result.max_marks}
                          </div>
                          <div className="text-sm text-gray-500">
                            {calculatePercentage(result.obtained_marks, result.max_marks)}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getGradeColor(result.grade)}`}>
                            {result.grade || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.teacher_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {result.remarks || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
