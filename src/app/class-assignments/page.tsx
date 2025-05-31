'use client';

import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useEffect, useState } from 'react';
import { Users, BookOpen, UserCheck, Search, Plus, X, Check } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface Teacher {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  employee_id: string;
  department: string;
  assigned_classes: string | null;
}

interface Student {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  student_id: string;
  roll_number: number;
  class_id: number | null;
  class_name: string | null;
  grade_level: number | null;
  section: string | null;
}

interface Class {
  id: number;
  name: string;
  grade_level: number;
  section: string;
  academic_year: string;
  class_teacher_id: number | null;
  class_teacher_name: string | null;
  student_count: number;
}

type TabType = 'class-teachers' | 'student-classes';

export default function ClassAssignmentsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('class-teachers');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<{
    type: TabType;
    userId?: number;
    classId?: number;
    userName?: string;
    className?: string;
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      
      // Fetch classes first
      const classesResponse = await fetch('/api/class-assignments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!classesResponse.ok) {
        throw new Error('Failed to fetch classes');
      }

      const classesData = await classesResponse.json();
      setClasses(classesData.classes || []);

      // Fetch teachers or students based on active tab
      const dataType = activeTab === 'class-teachers' ? 'teachers' : 'students';
      const response = await fetch(`/api/class-assignments?type=${dataType}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch ${dataType}`);
      }

      const data = await response.json();
      
      if (activeTab === 'class-teachers') {
        setTeachers(data.teachers || []);
      } else {
        setStudents(data.students || []);
      }
    } catch (err) {
      setError(`Failed to load ${activeTab === 'class-teachers' ? 'teachers' : 'students'}`);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignment = async (type: 'class_teacher' | 'student_class', classId: number, userId: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/class-assignments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          class_id: classId,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Assignment failed');
      }

      setShowAssignModal(false);
      setSelectedAssignment(null);
      fetchData(); // Refresh data
    } catch (err) {
      console.error('Assignment error:', err);
      setError(err instanceof Error ? err.message : 'Assignment failed');
    }
  };

  const handleRemoveAssignment = async (type: 'class_teacher' | 'student_class', classId?: number, userId?: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams({ type });
      if (classId) params.set('class_id', classId.toString());
      if (userId) params.set('user_id', userId.toString());

      const response = await fetch(`/api/class-assignments?${params}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Removal failed');
      }

      fetchData(); // Refresh data
    } catch (err) {
      console.error('Removal error:', err);
      setError(err instanceof Error ? err.message : 'Removal failed');
    }
  };

  const filteredTeachers = teachers.filter(teacher =>
    `${teacher.first_name} ${teacher.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStudents = students.filter(student =>
    `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableClasses = classes.filter(cls => {
    if (activeTab === 'class-teachers') {
      return !cls.class_teacher_id; // Only show classes without class teachers
    }
    return true; // Show all classes for student assignments
  });

  if (loading) return <DashboardLayout><LoadingSpinner /></DashboardLayout>;

  return (
    <ProtectedRoute allowedRoles={['principal']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Class Assignments</h1>
              <p className="text-gray-600">Manage class teacher and student class assignments</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="mt-2 text-red-600 hover:text-red-800"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('class-teachers')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'class-teachers'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <UserCheck className="inline h-4 w-4 mr-2" />
                Class Teachers
              </button>
              <button
                onClick={() => setActiveTab('student-classes')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'student-classes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="inline h-4 w-4 mr-2" />
                Student Classes
              </button>
            </nav>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'class-teachers' ? 'teachers' : 'students'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full max-w-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Content */}
          {activeTab === 'class-teachers' ? (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Class Teacher Assignments</h3>
                <p className="text-sm text-gray-600">Assign teachers as class teachers for different classes</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Teacher
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned Classes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTeachers.map((teacher) => (
                      <tr key={teacher.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {teacher.first_name} {teacher.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{teacher.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {teacher.employee_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {teacher.department || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {teacher.assigned_classes ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {teacher.assigned_classes}
                            </span>
                          ) : (
                            <span className="text-gray-400">Not assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {teacher.assigned_classes ? (
                            <button
                              onClick={() => {
                                const assignedClass = classes.find(cls => cls.class_teacher_id === teacher.id);
                                if (assignedClass) {
                                  handleRemoveAssignment('class_teacher', assignedClass.id);
                                }
                              }}
                              className="text-red-600 hover:text-red-900 mr-2"
                            >
                              Remove
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedAssignment({
                                  type: 'class-teachers',
                                  userId: teacher.id,
                                  userName: `${teacher.first_name} ${teacher.last_name}`,
                                });
                                setShowAssignModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Assign Class
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Student Class Assignments</h3>
                <p className="text-sm text-gray-600">Assign students to their respective classes</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Roll Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned Class
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map((student) => (
                      <tr key={student.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {student.first_name} {student.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{student.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.student_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.roll_number || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.class_name ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {student.class_name}
                            </span>
                          ) : (
                            <span className="text-gray-400">Not assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {student.class_id ? (
                            <button
                              onClick={() => handleRemoveAssignment('student_class', undefined, student.id)}
                              className="text-red-600 hover:text-red-900 mr-2"
                            >
                              Remove
                            </button>
                          ) : null}
                          <button
                            onClick={() => {
                              setSelectedAssignment({
                                type: 'student-classes',
                                userId: student.id,
                                userName: `${student.first_name} ${student.last_name}`,
                              });
                              setShowAssignModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            {student.class_id ? 'Change Class' : 'Assign Class'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Assignment Modal */}
          {showAssignModal && selectedAssignment && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedAssignment.type === 'class-teachers' ? 'Assign Class Teacher' : 'Assign Student to Class'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowAssignModal(false);
                      setSelectedAssignment(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    {selectedAssignment.type === 'class-teachers' 
                      ? `Assigning ${selectedAssignment.userName} as class teacher for:`
                      : `Assigning ${selectedAssignment.userName} to class:`
                    }
                  </p>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {(selectedAssignment.type === 'class-teachers' ? availableClasses : classes).map((cls) => (
                    <button
                      key={cls.id}
                      onClick={() => {
                        if (selectedAssignment.userId) {
                          handleAssignment(
                            selectedAssignment.type === 'class-teachers' ? 'class_teacher' : 'student_class',
                            cls.id,
                            selectedAssignment.userId
                          );
                        }
                      }}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
                    >
                      <div className="font-medium text-gray-900">{cls.name}</div>
                      <div className="text-sm text-gray-600">
                        Grade {cls.grade_level} {cls.section ? `- ${cls.section}` : ''} | {cls.student_count} students
                        {cls.class_teacher_name && (
                          <span className="text-blue-600 ml-2">Teacher: {cls.class_teacher_name}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {(selectedAssignment.type === 'class-teachers' ? availableClasses : classes).length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    {selectedAssignment.type === 'class-teachers' 
                      ? 'No classes available for assignment. All classes already have class teachers.'
                      : 'No classes available.'
                    }
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
