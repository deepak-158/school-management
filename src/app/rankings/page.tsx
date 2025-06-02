'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Trophy, Award, TrendingUp, Users, BookOpen, Target, Star, Medal } from 'lucide-react';

interface RankingData {
  studentId: number;
  studentName: string;
  rollNumber: string;
  className: string;
  grandTotal: number;
  maxPossible: number;
  percentage: number;
  overallRank: number;
  classRank: number;
  examBreakdown: {
    examType: string;
    totalMarks: number;
    maxMarks: number;
    percentage: number;
  }[];
  subjectPerformance: {
    subjectName: string;
    totalMarks: number;
    maxMarks: number;
    percentage: number;
    grade: string;
  }[];
}

interface RankingsResponse {
  studentRanking?: RankingData;
  topPerformers: RankingData[];
  classRankings: RankingData[];
  examPattern: {
    examTypes: string[];
    marksPerExam: number;
    totalExams: number;
    maxPossibleTotal: number;
  };
}

export default function RankingsPage() {
  const { user } = useAuth();
  const [rankings, setRankings] = useState<RankingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'my-ranking' | 'class' | 'school'>('my-ranking');

  useEffect(() => {
    if (user) {
      fetchRankings();
    }
  }, [user]);

  const fetchRankings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/rankings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch rankings');
      }
      
      const data = await response.json();
      setRankings(data);
    } catch (error) {
      console.error('Error fetching rankings:', error);
      setError('Failed to load rankings');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Award className="h-6 w-6 text-orange-500" />;
    return <Star className="h-5 w-5 text-blue-500" />;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
    if (rank <= 10) return 'bg-gradient-to-r from-blue-400 to-blue-600 text-white';
    return 'bg-gradient-to-r from-purple-400 to-purple-600 text-white';
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

  if (error) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center py-12">
            <p className="text-red-600 text-lg">{error}</p>
            <button 
              onClick={fetchRankings}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
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
          <div className="bg-gradient-to-r from-indigo-600 to-purple-800 rounded-lg p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">Academic Rankings</h1>
            <p className="text-indigo-100">Based on standardized exam system with grand total calculations</p>
          </div>

          {/* Exam Pattern Info */}
          {rankings?.examPattern && (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Standardized Exam Pattern</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-blue-700">Total Exams</p>
                  <p className="text-2xl font-bold text-blue-900">{rankings.examPattern.totalExams}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-700">Marks per Exam</p>
                  <p className="text-2xl font-bold text-green-900">{rankings.examPattern.marksPerExam}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-purple-700">Exam Types</p>
                  <p className="text-lg font-bold text-purple-900">{rankings.examPattern.examTypes.join(', ')}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <Award className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-orange-700">Max Total (per subject)</p>
                  <p className="text-2xl font-bold text-orange-900">{rankings.examPattern.maxPossibleTotal}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {user?.role === 'student' && (
                  <button
                    onClick={() => setActiveTab('my-ranking')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'my-ranking'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    My Performance
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('class')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'class'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Class Rankings
                </button>
                <button
                  onClick={() => setActiveTab('school')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'school'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Top Performers
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* My Ranking Tab */}
              {activeTab === 'my-ranking' && user?.role === 'student' && rankings?.studentRanking && (
                <div className="space-y-6">
                  {/* Overall Performance */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Overall Performance</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getRankBadgeColor(rankings.studentRanking.overallRank)} mb-2`}>
                          {getRankIcon(rankings.studentRanking.overallRank)}
                        </div>
                        <p className="text-sm font-medium text-gray-600">Overall Rank</p>
                        <p className="text-2xl font-bold text-gray-900">#{rankings.studentRanking.overallRank}</p>
                      </div>
                      <div className="text-center">
                        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getRankBadgeColor(rankings.studentRanking.classRank)} mb-2`}>
                          {getRankIcon(rankings.studentRanking.classRank)}
                        </div>
                        <p className="text-sm font-medium text-gray-600">Class Rank</p>
                        <p className="text-2xl font-bold text-gray-900">#{rankings.studentRanking.classRank}</p>
                      </div>
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-2">
                          <TrendingUp className="h-8 w-8" />
                        </div>
                        <p className="text-sm font-medium text-gray-600">Grand Total</p>
                        <p className="text-2xl font-bold text-gray-900">{rankings.studentRanking.grandTotal}/{rankings.studentRanking.maxPossible}</p>
                      </div>
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-purple-600 mb-2">
                          <Target className="h-8 w-8" />
                        </div>
                        <p className="text-sm font-medium text-gray-600">Percentage</p>
                        <p className="text-2xl font-bold text-gray-900">{rankings.studentRanking.percentage.toFixed(2)}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Exam-wise Performance */}
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Exam-wise Performance</h3>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {rankings.studentRanking.examBreakdown.map((exam, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-2">{exam.examType}</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Marks:</span>
                                <span className="font-medium">{exam.totalMarks}/{exam.maxMarks}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Percentage:</span>
                                <span className="font-medium text-green-600">{exam.percentage.toFixed(1)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    exam.percentage >= 80 ? 'bg-green-500' :
                                    exam.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(exam.percentage, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Subject-wise Performance */}
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Subject-wise Performance</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Marks</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {rankings.studentRanking.subjectPerformance.map((subject, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {subject.subjectName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {subject.totalMarks}/{subject.maxMarks}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {subject.percentage.toFixed(1)}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  subject.grade === 'A+' || subject.grade === 'A' ? 'bg-green-100 text-green-800' :
                                  subject.grade === 'B+' || subject.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                                  subject.grade === 'C+' || subject.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {subject.grade}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                                    <div 
                                      className={`h-2 rounded-full ${
                                        subject.percentage >= 80 ? 'bg-green-500' :
                                        subject.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                      }`}
                                      style={{ width: `${Math.min(subject.percentage, 100)}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm text-gray-500">{subject.percentage.toFixed(1)}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Class Rankings Tab */}
              {activeTab === 'class' && rankings?.classRankings && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Class Rankings - {rankings.classRankings[0]?.className || 'Your Class'}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grand Total</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {rankings.classRankings.map((student, index) => (
                          <tr key={index} className={`${
                            user?.role === 'student' && student.studentName.includes(user.first_name) ? 'bg-blue-50' : ''
                          }`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${getRankBadgeColor(student.classRank)} mr-2`}>
                                  <span className="text-xs font-bold">#{student.classRank}</span>
                                </div>
                                {getRankIcon(student.classRank)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {student.studentName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {student.rollNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {student.grandTotal}/{student.maxPossible}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {student.percentage.toFixed(2)}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      student.percentage >= 80 ? 'bg-green-500' :
                                      student.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${Math.min(student.percentage, 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-gray-500">{student.percentage.toFixed(1)}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Top Performers Tab */}
              {activeTab === 'school' && rankings?.topPerformers && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">School Top Performers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rankings.topPerformers.slice(0, 10).map((student, index) => (
                      <div key={index} className={`rounded-lg p-6 border-2 ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300' :
                        index === 1 ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300' :
                        index === 2 ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-300' :
                        'bg-white border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between mb-4">
                          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${getRankBadgeColor(student.overallRank)}`}>
                            {getRankIcon(student.overallRank)}
                          </div>
                          <span className={`text-2xl font-bold ${
                            index === 0 ? 'text-yellow-600' :
                            index === 1 ? 'text-gray-600' :
                            index === 2 ? 'text-orange-600' :
                            'text-blue-600'
                          }`}>
                            #{student.overallRank}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900 text-lg mb-2">{student.studentName}</h4>
                        <div className="space-y-2 text-sm text-gray-600">
                          <p>Class: <span className="font-medium text-gray-900">{student.className}</span></p>
                          <p>Roll No: <span className="font-medium text-gray-900">{student.rollNumber}</span></p>
                          <p>Grand Total: <span className="font-medium text-gray-900">{student.grandTotal}/{student.maxPossible}</span></p>
                          <p>Percentage: <span className="font-medium text-green-600">{student.percentage.toFixed(2)}%</span></p>
                        </div>
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">Performance</span>
                            <span className="text-xs text-gray-600">{student.percentage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                student.percentage >= 80 ? 'bg-green-500' :
                                student.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(student.percentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
