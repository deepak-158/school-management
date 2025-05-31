'use client';

import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useEffect, useState } from 'react';
import { BookOpen, Users, Plus, Edit, Eye, UserCheck, Settings, X } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface Class {
  id: number;
  name: string;
  grade_level: number;
  section: string;
  academic_year: string;
  class_teacher_id: number | null;
  class_teacher_name: string | null;
  class_teacher_username: string | null;
  student_count: number;
  created_at: string;
}

interface Teacher {
  id: number;
  first_name: string;
  last_name: string;
  employee_id: string;
}

export default function ClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    grade_level: '',
    section: '',
    academic_year: new Date().getFullYear().toString(),
    class_teacher_id: '',
  });
  useEffect(() => {
    fetchClasses();
    if (user?.role === 'principal') {
      fetchTeachers();
    }
  }, [user]);
  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/classes', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch classes');
      }

      const data = await response.json();
      setClasses(data.classes || []);
    } catch (err) {
      setError('Failed to load classes');
      console.error('Error fetching classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/class-assignments?type=teachers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch teachers');
      }

      const data = await response.json();
      setTeachers(data.teachers || []);
    } catch (err) {
      console.error('Error fetching teachers:', err);
    }
  };

  const createClass = async () => {
    try {
      setCreating(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          grade_level: parseInt(formData.grade_level),
          section: formData.section || null,
          academic_year: formData.academic_year,
          class_teacher_id: formData.class_teacher_id ? parseInt(formData.class_teacher_id) : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create class');
      }

      setShowCreateModal(false);
      setFormData({
        name: '',
        grade_level: '',
        section: '',
        academic_year: new Date().getFullYear().toString(),
        class_teacher_id: '',
      });
      fetchClasses(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create class');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <DashboardLayout><LoadingSpinner /></DashboardLayout>;

  if (error) {
    return (
      <DashboardLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['principal', 'teacher']}>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
              <p className="text-gray-600">
                {user?.role === 'principal' 
                  ? 'Manage all classes in the school'
                  : 'View your assigned classes'
                }
              </p>
            </div>            {user?.role === 'principal' && (
              <div className="flex space-x-2">
                <button 
                  onClick={() => window.location.href = '/class-assignments'}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Manage Assignments</span>
                </button>                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Class</span>
                </button>
              </div>
            )}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Classes</p>
                  <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {classes.reduce((sum, cls) => sum + cls.student_count, 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Class Size</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {classes.length > 0 
                      ? Math.round(classes.reduce((sum, cls) => sum + cls.student_count, 0) / classes.length)
                      : 0
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Classes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classItem) => (
              <div key={classItem.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex items-center space-x-2">
                      {user?.role === 'principal' && (
                        <button className="text-gray-600 hover:text-blue-600 p-1 rounded transition-colors">
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      <button className="text-gray-600 hover:text-green-600 p-1 rounded transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {classItem.name}
                  </h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Grade:</span> {classItem.grade_level}
                      {classItem.section && (
                        <span className="ml-2"><span className="font-medium">Section:</span> {classItem.section}</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Academic Year:</span> {classItem.academic_year}
                    </div>
                    {classItem.class_teacher_name ? (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Class Teacher:</span> {classItem.class_teacher_name}
                      </div>
                    ) : (
                      <div className="text-sm text-orange-600">
                        <span className="font-medium">Class Teacher:</span> Not assigned
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{classItem.student_count} students</span>
                    </div>
                    <span className="text-xs text-gray-400">
                      Created {new Date(classItem.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {classes.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No classes found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {user?.role === 'principal' 
                  ? 'Get started by creating your first class.'
                  : 'No classes have been assigned to you yet.'
                }
              </p>
              {user?.role === 'principal' && (
                <div className="mt-6">                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Class</span>
                  </button>
                </div>
              )}
            </div>          )}
        </div>

        {/* Create Class Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create New Class</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); createClass(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Class 10-A, Primary Section"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grade Level *
                  </label>
                  <select
                    value={formData.grade_level}
                    onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Grade Level</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((grade) => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Section (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    placeholder="e.g., A, B, Science, Arts"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Academic Year *
                  </label>
                  <input
                    type="text"
                    value={formData.academic_year}
                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                    placeholder="e.g., 2024-2025"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class Teacher (Optional)
                  </label>
                  <select
                    value={formData.class_teacher_id}
                    onChange={(e) => setFormData({ ...formData, class_teacher_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Class Teacher</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.first_name} {teacher.last_name} ({teacher.employee_id})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    You can assign a class teacher later from the Class Assignments page
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create Class'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
