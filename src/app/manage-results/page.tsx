'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';

interface Student {
  id: number;
  student_id: string;
  full_name: string;
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
  semester: string;
  academic_year: string;
  exam_type: string;
  remarks?: string;
  student_name?: string;
  subject_name?: string;
}

export default function ManageResultsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSemester, setSemester] = useState('1');
  const [selectedAcademicYear, setAcademicYear] = useState('2024-2025');
  const [selectedExamType, setExamType] = useState('Mid-term');
  const [editingResults, setEditingResults] = useState<{ [key: string]: Result }>({});

  useEffect(() => {
    if (user?.role === 'teacher') {
      fetchTeacherData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedClass && selectedSubject) {
      fetchStudentsAndResults();
    }
  }, [selectedClass, selectedSubject, selectedSemester, selectedAcademicYear, selectedExamType]);
  const fetchTeacherData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const [classesRes, subjectsRes] = await Promise.all([
        fetch('/api/teacher/classes', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/teacher/subjects', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (classesRes.ok && subjectsRes.ok) {
        const classesData = await classesRes.json();
        const subjectsData = await subjectsRes.json();
        setClasses(classesData.classes || []);
        setSubjects(subjectsData.subjects || []);
      }
    } catch (error) {
      console.error('Error fetching teacher data:', error);
    } finally {
      setLoading(false);
    }
  };  const fetchStudentsAndResults = async () => {
    if (!selectedClass || !selectedSubject) return;

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

      if (studentsRes.ok) {
        studentsData = await studentsRes.json();
        setStudents(studentsData.students || []);
      }

      if (resultsRes.ok) {
        resultsData = await resultsRes.json();
        setResults(resultsData.results || []);
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
            semester: selectedSemester,
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
  };
  const saveResults = async () => {
    try {
      const token = localStorage.getItem('auth_token');      const resultsToSave = Object.values(editingResults).filter(result => 
        result.obtained_marks > 0 || result.remarks
      );

      const response = await fetch('/api/results', {
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
      console.error('Error saving results:', error);
      alert('Error saving results');
    }
  };

  if (user?.role !== 'teacher') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">Access denied. This page is for teachers only.</p>
        </div>
      </DashboardLayout>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Manage Results</h1>
          {selectedClass && selectedSubject && (
            <button
              onClick={saveResults}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Save All Results
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white shadow-md rounded-lg p-6">
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semester
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Year
              </label>
              <select
                value={selectedAcademicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="2024-2025">2024-2025</option>
                <option value="2023-2024">2023-2024</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam Type
              </label>
              <select
                value={selectedExamType}
                onChange={(e) => setExamType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Mid-term">Mid-term</option>
                <option value="Final">Final</option>
                <option value="Assignment">Assignment</option>
                <option value="Quiz">Quiz</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Entry Table */}
        {selectedClass && selectedSubject && students.length > 0 && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
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
                      <tr key={student.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.student_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.full_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">                          <input
                            type="number"
                            min="0"
                            max={result?.max_marks || 100}
                            value={result?.obtained_marks || ''}
                            onChange={(e) => handleResultChange(student.id, 'obtained_marks', parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"                            min="1"
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
                            'bg-red-100 text-red-800'
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

        {selectedClass && selectedSubject && students.length === 0 && (
          <div className="bg-white shadow-md rounded-lg p-8 text-center">
            <p className="text-gray-500">No students found for the selected class.</p>
          </div>
        )}

        {(!selectedClass || !selectedSubject) && (
          <div className="bg-white shadow-md rounded-lg p-8 text-center">
            <p className="text-gray-500">Please select a class and subject to manage results.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
