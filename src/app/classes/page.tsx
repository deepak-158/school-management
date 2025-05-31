'use client';

import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useEffect, useState } from 'react';
import { BookOpen, Users, Plus, Edit, Eye } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Class {
  id: number;
  name: string;
  description: string;
  student_count: number;
  created_at: string;
}

export default function ClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

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
            </div>
            {user?.role === 'principal' && (
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                <Plus className="h-4 w-4" />
                <span>Add Class</span>
              </button>
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
                  
                  {classItem.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {classItem.description}
                    </p>
                  )}
                  
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
                <div className="mt-6">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2 transition-colors">
                    <Plus className="h-4 w-4" />
                    <span>Create Class</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
