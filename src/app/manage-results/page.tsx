'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';

interface Student {
  id: number;
  user_id: number;
  roll_number: number;
  class_id: number;
  first_name: string;
  last_name: string;
  class_name: string;
  student_id?: string;
  full_name?: string;
}

interface Subject {
  id: number;
  name: string;
  code: string;
}

interface Class {
  id: number;
  name: string;
}

interface Result {
  id?: number;
  student_id: number;
  subject_id: number;
  obtained_marks: number;
  max_marks: number;
  grade: string;
  academic_year: string;
  exam_type: string;
  remarks?: string;
  student_name?: string;
  subject_name?: string;
}

export default function ManageResultsPage() {
  const { user, loading: authLoading } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [dataLoading, setDataLoading] = useState(true);const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedAcademicYear, setAcademicYear] = useState('2024-2025');
  const [selectedExamType, setExamType] = useState('First Term Exam');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'add' | 'search' | 'view'>('add');
  const [editingResults, setEditingResults] = useState<{ [key: string]: Result }>({});
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);  useEffect(() => {
    console.log('=== useEffect: user changed ===');
    console.log('User object:', JSON.stringify(user, null, 2));
    console.log('User role:', user?.role);
    console.log('Auth loading state:', authLoading);
    
    // Wait for auth to finish loading
    if (authLoading) {
      console.log('Auth still loading, waiting...');
      return;
    }
    
    if (!user) {
      console.log('No user object after auth loaded, skipping data fetch');
      return;
    }
    
    if (user?.role === 'teacher') {
      console.log('🔵 Calling fetchTeacherData()');
      fetchTeacherData();
    } else if (user?.role === 'principal') {
      console.log('🔴 Calling fetchPrincipalData()');
      fetchPrincipalData();
    } else {
      console.log('⚠️ Unknown user role:', user?.role);
    }
  }, [user, authLoading]);
  useEffect(() => {
    if (selectedClass && selectedSubject) {
      fetchStudentsAndResults();
    }
  }, [selectedClass, selectedSubject, selectedAcademicYear, selectedExamType]);
  // Filter students based on search term
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = students.filter(student => 
        student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.roll_number?.toString().includes(searchTerm) ||
        student.class_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [students, searchTerm]);

  // Handle view mode changes for principal
  useEffect(() => {
    if (user?.role === 'principal' && viewMode === 'view') {
      viewAllResults();
    }
  }, [viewMode, selectedAcademicYear, user?.role]);const fetchTeacherData = async () => {
    console.log('Fetching teacher data...');
    try {
      const token = localStorage.getItem('auth_token');
      console.log('Using token:', token ? 'Token exists' : 'No token');
      
      const [classesRes, subjectsRes] = await Promise.all([
        fetch('/api/teacher/classes', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/teacher/subjects', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      console.log('Classes API status:', classesRes.status);
      console.log('Subjects API status:', subjectsRes.status);

      if (classesRes.ok && subjectsRes.ok) {
        const classesData = await classesRes.json();
        const subjectsData = await subjectsRes.json();
        
        console.log('Classes data:', classesData);
        console.log('Subjects data:', subjectsData);
        
        setClasses(classesData.classes || []);
        setSubjects(subjectsData.subjects || []);
      } else {
        if (!classesRes.ok) {
          console.error('Classes API error:', await classesRes.text());
        }
        if (!subjectsRes.ok) {
          console.error('Subjects API error:', await subjectsRes.text());
        }
      }    } catch (error) {
      console.error('Error fetching teacher data:', error);
    } finally {
      setDataLoading(false);
    }
  };
  const fetchPrincipalData = async () => {
    console.log('Fetching principal data...');
    try {
      const token = localStorage.getItem('auth_token');
      console.log('Principal using token:', token ? 'Token exists' : 'No token');
      
      // For principals, fetch all classes and all subjects
      const [classesRes, subjectsRes] = await Promise.all([
        fetch('/api/classes', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/results/manage?include_class_subjects=true', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      console.log('Principal classes API status:', classesRes.status);
      console.log('Principal subjects API status:', subjectsRes.status);

      if (classesRes.ok) {
        const classesData = await classesRes.json();
        console.log('Principal classes data:', classesData);
        setClasses(classesData.classes || []);
      } else {
        console.error('Principal classes API error:', await classesRes.text());
      }

      if (subjectsRes.ok) {
        const managementData = await subjectsRes.json();
        console.log('Principal subjects data:', managementData);
        // Extract unique subjects from class-subjects data
        const allSubjects = managementData.data?.classSubjects || [];
        const uniqueSubjects = allSubjects.reduce((acc: any[], cs: any) => {
          const existing = acc.find(s => s.id === cs.subject_id);
          if (!existing) {
            acc.push({
              id: cs.subject_id,
              name: cs.subject_name,
              code: cs.subject_code
            });
          }
          return acc;
        }, []);
        setSubjects(uniqueSubjects);
      }    } catch (error) {
      console.error('Error fetching principal data:', error);
    } finally {
      setDataLoading(false);
    }
  };  const fetchStudentsAndResults = async () => {
    if (!selectedClass || !selectedSubject) return;

    console.log('Fetching students and results for:', { selectedClass, selectedSubject, selectedExamType });

    try {
      const token = localStorage.getItem('auth_token');
      const [studentsRes, resultsRes] = await Promise.all([
        fetch(`/api/students?class_id=${selectedClass}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/results?class_id=${selectedClass}&subject_id=${selectedSubject}&exam_type=${selectedExamType}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      let studentsData = null;
      let resultsData = null;

      console.log('Students API response status:', studentsRes.status);
      console.log('Results API response status:', resultsRes.status);

      if (studentsRes.ok) {
        studentsData = await studentsRes.json();
        console.log('Students data received:', studentsData);
        setStudents(studentsData.students || []);
      } else {
        console.error('Students API error:', await studentsRes.text());
      }

      if (resultsRes.ok) {
        resultsData = await resultsRes.json();
        console.log('Results data received:', resultsData);
        setResults(resultsData.results || []);
      } else {
        console.error('Results API error:', await resultsRes.text());
      }

      // Initialize editing results only if we have students data
      if (studentsData?.students) {
        const editing: { [key: string]: Result } = {};
        studentsData.students.forEach((student: Student) => {
          const existingResult = resultsData?.results?.find((r: Result) => r.student_id === student.id);
          const key = `${student.id}-${selectedSubject}`;          editing[key] = existingResult || {
            student_id: student.id,
            subject_id: parseInt(selectedSubject),
            obtained_marks: 0,
            max_marks: 100,
            grade: '',
            academic_year: selectedAcademicYear,
            exam_type: selectedExamType,
            remarks: ''
          };
        });
        setEditingResults(editing);
      }
    } catch (error) {
      console.error('Error fetching students and results:', error);
    }
  };

  const calculateGrade = (marks: number, total: number): string => {
    const percentage = (marks / total) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    return 'F';
  };

  const handleResultChange = (studentId: number, field: keyof Result, value: string | number) => {
    const key = `${studentId}-${selectedSubject}`;
    setEditingResults(prev => {
      const updated = { ...prev };
      updated[key] = { ...updated[key], [field]: value };
        // Auto-calculate grade if marks changed
      if (field === 'obtained_marks' || field === 'max_marks') {
        const marks = field === 'obtained_marks' ? Number(value) : updated[key].obtained_marks;
        const total = field === 'max_marks' ? Number(value) : updated[key].max_marks;
        updated[key].grade = calculateGrade(marks, total);
      }
      
      return updated;
    });
  };  const saveResults = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const resultsToSave = Object.values(editingResults).filter(result => 
        result.obtained_marks > 0 || result.remarks
      );

      // Use different API endpoints based on user role
      const apiEndpoint = user?.role === 'principal' ? '/api/results/manage' : '/api/results';
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ results: resultsToSave })
      });

      if (response.ok) {
        alert('Results saved successfully!');
        fetchStudentsAndResults();
      } else {
        alert('Error saving results');
      }
    } catch (error) {
      console.error('Error saving results:', error);      alert('Error saving results');
    }
  };
  const searchStudentResults = async () => {
    if (!searchTerm.trim()) {
      alert('Please enter a search term');
      return;
    }    setSearchLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/results/search?query=${encodeURIComponent(searchTerm)}&academic_year=${selectedAcademicYear}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      } else {
        alert('Error searching results');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching results:', error);
      alert('Error searching results');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const viewAllResults = async () => {
    setSearchLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      let url = '/api/results?include_all=true';
      
      const params = new URLSearchParams({
        academic_year: selectedAcademicYear
      });
      
      const response = await fetch(`${url}&${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      } else {
        alert('Error loading all results');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error loading all results:', error);
      alert('Error loading all results');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const exportResults = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      let url = '/api/results/export?';      const params = new URLSearchParams({
        academic_year: selectedAcademicYear,
        exam_type: selectedExamType
      });
      
      if (selectedClass) params.append('class_id', selectedClass);
      if (selectedSubject) params.append('subject_id', selectedSubject);
      
      const response = await fetch(url + params.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `results_${selectedAcademicYear}_${selectedExamType.replace(/ /g, '_')}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        alert('Error exporting results');
      }
    } catch (error) {
      console.error('Error exporting results:', error);
      alert('Error exporting results');
    }
  };
  if (user?.role !== 'teacher' && user?.role !== 'principal') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">Access denied. This page is for teachers and principals only.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (authLoading || dataLoading) {
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
        {/* Header with mode switching */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Manage Results {user?.role === 'principal' ? '(All Classes)' : ''}
          </h1>
            <div className="flex flex-wrap gap-2">
            {user?.role === 'principal' && (
              <>
                <button
                  onClick={() => setViewMode('add')}
                  className={`px-4 py-2 rounded-md ${viewMode === 'add' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Add/Edit Results
                </button>
                <button
                  onClick={() => setViewMode('search')}
                  className={`px-4 py-2 rounded-md ${viewMode === 'search' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Search Results
                </button>
                <button
                  onClick={() => setViewMode('view')}
                  className={`px-4 py-2 rounded-md ${viewMode === 'view' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  View All
                </button>
                <button
                  onClick={exportResults}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Export CSV                </button>
              </>
            )}
            {selectedClass && selectedSubject && viewMode === 'add' && (
              <button
                onClick={saveResults}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Save All Results
              </button>
            )}
          </div>
        </div>

        {/* Search Interface for Principal */}
        {user?.role === 'principal' && viewMode === 'search' && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Search Student Results</h2>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by student name, roll number, or class..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && searchStudentResults()}
                />
              </div>              <div className="flex gap-2">
                <select
                  value={selectedAcademicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="2025-2026">2025-2026</option>
                  <option value="2024-2025">2024-2025</option>
                  <option value="2023-2024">2023-2024</option>
                </select>
                <button
                  onClick={searchStudentResults}
                  disabled={searchLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {searchLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search Results Display */}
        {user?.role === 'principal' && viewMode === 'search' && searchResults.length > 0 && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="text-lg font-semibold">Search Results ({searchResults.length} found)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Year</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {searchResults.map((result, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {result.student_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.class_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.subject_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.obtained_marks}/{result.max_marks} ({((result.obtained_marks/result.max_marks)*100).toFixed(1)}%)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          result.grade === 'A+' || result.grade === 'A' ? 'bg-green-100 text-green-800' :
                          result.grade === 'B+' || result.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                          result.grade === 'C+' || result.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {result.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.exam_type}                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.academic_year}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>        )}

        {/* View All Results Display */}
        {user?.role === 'principal' && viewMode === 'view' && searchResults.length > 0 && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="text-lg font-semibold">All Results ({searchResults.length} found)</h3>
              <p className="text-sm text-gray-600">Academic Year: {selectedAcademicYear}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Year</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {searchResults.map((result, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {result.student_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.class_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.subject_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.obtained_marks}/{result.max_marks} ({((result.obtained_marks/result.max_marks)*100).toFixed(1)}%)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          result.grade === 'A+' || result.grade === 'A' ? 'bg-green-100 text-green-800' :
                          result.grade === 'B+' || result.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                          result.grade === 'C+' || result.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {result.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.exam_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.academic_year}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>        )}

        {/* No Results Message for View All Mode */}
        {user?.role === 'principal' && viewMode === 'view' && searchResults.length === 0 && !searchLoading && (
          <div className="bg-white shadow-md rounded-lg p-8 text-center">
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No results found for academic year {selectedAcademicYear}
              </p>
            </div>
          </div>
        )}

        {/* Loading Message for View All Mode */}
        {user?.role === 'principal' && viewMode === 'view' && searchLoading && (
          <div className="bg-white shadow-md rounded-lg p-8 text-center">
            <div className="text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading all results...</p>
            </div>
          </div>
        )}

        {/* Filters */}
        {(viewMode === 'add' || user?.role === 'teacher') && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
            </div><div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Year
              </label>
              <select
                value={selectedAcademicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="2025-2026">2025-2026</option>
                <option value="2024-2025">2024-2025</option>
                <option value="2023-2024">2023-2024</option>
              </select>
            </div>            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam Type
              </label>
              <select
                value={selectedExamType}
                onChange={(e) => setExamType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="First Term Exam">First Term Exam (100 marks)</option>
                <option value="Second Term Exam">Second Term Exam (100 marks)</option>
                <option value="Final Exam">Final Exam (100 marks)</option>
              </select>
            </div>
          </div>
        )}

        {/* Results Entry Table */}
        {viewMode === 'add' && selectedClass && selectedSubject && students.length > 0 && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">            <div className="p-4 bg-gray-50 border-b">
              <h3 className="text-lg font-semibold">
                Enter Results for {classes.find(c => c.id.toString() === selectedClass)?.name} - {subjects.find(s => s.id.toString() === selectedSubject)?.name}
              </h3>              <p className="text-sm text-gray-600">
                {selectedAcademicYear} • {selectedExamType}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Roll No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marks Obtained
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Marks
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => {
                    const key = `${student.id}-${selectedSubject}`;
                    const result = editingResults[key];
                    
                    return (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.roll_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.first_name} {student.last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            min="0"
                            max={result?.max_marks || 100}
                            value={result?.obtained_marks || ''}
                            onChange={(e) => handleResultChange(student.id, 'obtained_marks', parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            min="1"
                            value={result?.max_marks || 100}
                            onChange={(e) => handleResultChange(student.id, 'max_marks', parseInt(e.target.value) || 100)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            result?.grade === 'A+' || result?.grade === 'A' ? 'bg-green-100 text-green-800' :
                            result?.grade === 'B+' || result?.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                            result?.grade === 'C+' || result?.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                            result?.grade === 'F' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {result?.grade || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={result?.remarks || ''}
                            onChange={(e) => handleResultChange(student.id, 'remarks', e.target.value)}
                            placeholder="Optional remarks"
                            className="w-32 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No Students Found */}
        {viewMode === 'add' && selectedClass && selectedSubject && students.length === 0 && (
          <div className="bg-white shadow-md rounded-lg p-8 text-center">
            <p className="text-gray-500">No students found for the selected class.</p>
          </div>
        )}        {/* Select Class and Subject */}
        {viewMode === 'add' && (!selectedClass || !selectedSubject) && (
          <div className="bg-white shadow-md rounded-lg p-8 text-center">
            <p className="text-gray-500">Please select a class and subject to manage results.</p>
          </div>        )}

      </div>
    </DashboardLayout>
  );
}
