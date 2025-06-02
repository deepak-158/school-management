'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

interface Announcement {
  id: number;
  title: string;
  content: string;
  author_name: string;
  target_role: string | null;
  target_class_id?: number | null;
  created_at: string;
}

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    target_role: 'all',
    target_class_id: '',
  });
  useEffect(() => {
    if (user) {
      fetchAnnouncements();
      if (user?.role === 'principal' || user?.role === 'teacher') {
        fetchClasses();
      }
    }
  }, [user]);
  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/dashboard/announcements', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.announcements);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };
  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/classes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/dashboard/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          target_role: formData.target_role,
          target_class_id: formData.target_class_id || null,
        }),
      });

      if (response.ok) {
        setFormData({
          title: '',
          content: '',
          target_role: 'all',
          target_class_id: '',
        });
        setShowCreateForm(false);
        fetchAnnouncements();
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };  const getTargetText = (targetRole: string | null, targetClassId?: number | null) => {
    if (!targetRole) return 'Unknown';
    if (targetRole === 'all') return 'Everyone';
    if (targetRole === 'class' && targetClassId) {
      const className = classes.find(c => c.id === targetClassId)?.name;
      return `Class: ${className || 'Unknown Class'}`;
    }
    return targetRole.charAt(0).toUpperCase() + targetRole.slice(1) + 's';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
          
          {(user?.role === 'principal' || user?.role === 'teacher') && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              {showCreateForm ? 'Cancel' : 'Create Announcement'}
            </button>
          )}
        </div>

        {/* Create Announcement Form */}
        {showCreateForm && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Announcement</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Announcement title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Announcement content..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience
                  </label>
                  <select
                    value={formData.target_role}
                    onChange={(e) => handleInputChange('target_role', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Everyone</option>
                    <option value="student">Students Only</option>
                    <option value="teacher">Teachers Only</option>
                    <option value="class">Specific Class</option>
                  </select>
                </div>

                {formData.target_role === 'class' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Class
                    </label>
                    <select
                      value={formData.target_class_id}
                      onChange={(e) => handleInputChange('target_class_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select a class...</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Create Announcement
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Announcements List */}
        <div className="space-y-4">
          {announcements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No announcements available.
            </div>
          ) : (
            announcements.map((announcement) => (
              <div key={announcement.id} className="bg-white shadow-md rounded-lg p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {announcement.title}
                  </h3>
                  <div className="text-sm text-gray-500">
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4 whitespace-pre-wrap">
                  {announcement.content}
                </p>
                
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div>
                    By: <span className="font-medium">{announcement.author_name}</span>
                  </div>
                  <div>
                    Target: <span className="font-medium">
                      {getTargetText(announcement.target_role, announcement.target_class_id)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}        </div>
      </div>
    </DashboardLayout>
    </ProtectedRoute>
  );
}
