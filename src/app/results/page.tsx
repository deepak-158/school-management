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
  semester?: string;
  created_at: string;
}

interface ResultsStats {
  totalExams: number;
  averageMarks: number;
  highestMarks: number;
  lowestMarks: number;
  totalSubjects: number;
  passedExams: number;
}

export default function ResultsPage() {
  const { user } = useAuth();
  const [results, setResults] = useState<Result[]>([]);
  const [stats, setStats] = useState<ResultsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2024-2025');
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchResults();
    }
  }, [user, selectedAcademicYear, selectedSemester]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        academic_year: selectedAcademicYear,
        ...(selectedSemester !== 'all' && { semester: selectedSemester })
      });
      
      const response = await fetch(`/api/results?${params}`);
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
          </div>

          {/* Filters */}
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
                  <option value="2022-2023">2022-2023</option>
                </select>
              </div>
              <div>
                <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-2">
                  Semester
                </label>
                <select
                  id="semester"
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Semesters</option>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
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
