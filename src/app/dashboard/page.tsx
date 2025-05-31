'use client';

import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { useEffect, useState } from 'react';
import {
  Users,
  BookOpen,
  Calendar,
  ClipboardList,
  MessageSquare,
  TrendingUp,
  Bell,
  Clock
} from 'lucide-react';

interface DashboardStats {
  // Student stats
  className?: string;
  totalSubjects?: number;
  attendanceRate?: number;
  totalTests?: number;
  averageMarks?: number;
  presentDays?: number;
  totalDays?: number;
  
  // Teacher stats
  totalClasses?: number;
  totalStudents?: number;
  presentToday?: number;
  
  // Principal stats
  totalTeachers?: number;
}

interface Announcement {
  id: number;
  title: string;
  content: string;
  author_name: string;
  target_role: string;
  target_class_id?: number;
  created_at: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({});
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch dashboard stats
        const statsResponse = await fetch('/api/dashboard/stats');
        if (statsResponse.ok) {
          const statsResult = await statsResponse.json();
          setStats(statsResult.stats || {});
        }

        // Fetch announcements
        const announcementsResponse = await fetch('/api/dashboard/announcements');
        if (announcementsResponse.ok) {
          const announcementsResult = await announcementsResponse.json();
          setAnnouncements(announcementsResult.announcements || []);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const getStatsCards = () => {
    if (!user) return [];    const baseCards = [
      {
        title: 'Announcements',
        value: announcements.length,
        icon: MessageSquare,
        color: 'bg-blue-500',
        href: '/announcements'
      }
    ];

    const studentCards = [
      {
        title: 'Attendance Rate',
        value: `${stats.attendanceRate || 0}%`,
        icon: ClipboardList,
        color: 'bg-green-500',
        href: '/attendance'
      },
      {
        title: 'Total Subjects',
        value: stats.totalSubjects || 0,
        icon: BookOpen,
        color: 'bg-purple-500',
        href: '/timetable'
      },
      {
        title: 'Average Marks',
        value: stats.averageMarks || 0,
        icon: TrendingUp,
        color: 'bg-indigo-500',
        href: '/results'
      }
    ];

    const teacherCards = [
      {
        title: 'My Classes',
        value: stats.totalClasses || 0,
        icon: Users,
        color: 'bg-orange-500',
        href: '/timetable'
      },
      {
        title: 'My Students',
        value: stats.totalStudents || 0,
        icon: Users,
        color: 'bg-blue-500',
        href: '/attendance'
      },
      {
        title: 'Subjects',
        value: stats.totalSubjects || 0,
        icon: BookOpen,
        color: 'bg-purple-500',
        href: '/timetable'
      },
      {
        title: 'Present Today',
        value: stats.presentToday || 0,
        icon: ClipboardList,
        color: 'bg-green-500',
        href: '/attendance'
      }
    ];

    const principalCards = [
      {
        title: 'Total Students',
        value: stats.totalStudents || 0,
        icon: Users,
        color: 'bg-blue-500',
        href: '/students'
      },
      {
        title: 'Total Teachers',
        value: stats.totalTeachers || 0,
        icon: Users,
        color: 'bg-green-500',
        href: '/teachers'
      },
      {
        title: 'Total Classes',
        value: stats.totalClasses || 0,
        icon: BookOpen,
        color: 'bg-purple-500',
        href: '/classes'
      },
      {
        title: 'Attendance Rate',
        value: `${stats.attendanceRate || 0}%`,
        icon: TrendingUp,
        color: 'bg-indigo-500',
        href: '/attendance'
      }
    ];

    switch (user.role) {
      case 'student':
        return [...baseCards, ...studentCards];
      case 'teacher':
        return [...baseCards, ...teacherCards];
      case 'principal':
        return [...baseCards, ...principalCards];
      default:
        return baseCards;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
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

  const statsCards = getStatsCards();

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">
              Welcome to your dashboard, {user?.username}!
            </h1>
            <p className="text-blue-100">
              {user?.role === 'student' && 'View your academic progress, attendance, and announcements.'}
              {user?.role === 'teacher' && 'Manage your classes, students, and academic activities.'}
              {user?.role === 'principal' && 'Oversee school operations and manage the entire institution.'}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <a
                  key={index}
                  href={card.href}
                  className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                      <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                    </div>
                    <div className={`p-3 rounded-full ${card.color} text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                </a>
              );
            })}
          </div>

          {/* Recent Announcements */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Recent Announcements
                </h2>                <a
                  href="/announcements"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all
                </a>
              </div>
            </div>
            <div className="p-6">
              {announcements.length > 0 ? (
                <div className="space-y-4">
                  {announcements.slice(0, 3).map((announcement) => (
                    <div
                      key={announcement.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow duration-200"
                    >                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{announcement.title}</h3>
                        <span className="text-xs text-gray-500">
                          {announcement.target_role === 'all' ? 'Everyone' : announcement.target_role}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {announcement.content}
                      </p>                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          By {announcement.author_name}
                        </span>
                        <span>
                          {new Date(announcement.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No announcements at the moment</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">                {user?.role === 'student' && (
                  <>
                    <a
                      href="/timetable"
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <Calendar className="h-8 w-8 text-blue-600 mr-3" />
                      <div>
                        <h3 className="font-medium text-gray-900">View Timetable</h3>
                        <p className="text-sm text-gray-600">Check your class schedule</p>
                      </div>
                    </a>
                    <a
                      href="/results"
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
                      <div>
                        <h3 className="font-medium text-gray-900">View Results</h3>
                        <p className="text-sm text-gray-600">Check your academic performance</p>
                      </div>
                    </a>
                    <a
                      href="/leave-application"
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <Clock className="h-8 w-8 text-orange-600 mr-3" />
                      <div>
                        <h3 className="font-medium text-gray-900">Leave Request</h3>
                        <p className="text-sm text-gray-600">Apply for leave</p>
                      </div>
                    </a>
                  </>
                )}                {user?.role === 'teacher' && (
                  <>
                    <a
                      href="/attendance"
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <ClipboardList className="h-8 w-8 text-blue-600 mr-3" />
                      <div>
                        <h3 className="font-medium text-gray-900">Mark Attendance</h3>
                        <p className="text-sm text-gray-600">Record student attendance</p>
                      </div>
                    </a>
                    <a
                      href="/manage-results"
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
                      <div>
                        <h3 className="font-medium text-gray-900">Enter Results</h3>
                        <p className="text-sm text-gray-600">Record student grades</p>
                      </div>
                    </a>
                    <a
                      href="/announcements"
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <MessageSquare className="h-8 w-8 text-purple-600 mr-3" />
                      <div>
                        <h3 className="font-medium text-gray-900">Create Announcement</h3>
                        <p className="text-sm text-gray-600">Share updates with students</p>
                      </div>
                    </a>
                  </>
                )}                {user?.role === 'principal' && (
                  <>
                    <a
                      href="/users"
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <Users className="h-8 w-8 text-blue-600 mr-3" />
                      <div>
                        <h3 className="font-medium text-gray-900">Manage Users</h3>
                        <p className="text-sm text-gray-600">Add or edit users</p>
                      </div>
                    </a>
                    <a
                      href="/analytics"
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
                      <div>
                        <h3 className="font-medium text-gray-900">View Analytics</h3>
                        <p className="text-sm text-gray-600">School performance insights</p>
                      </div>
                    </a>
                    <a
                      href="/leave-approvals"
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <Clock className="h-8 w-8 text-orange-600 mr-3" />
                      <div>
                        <h3 className="font-medium text-gray-900">Leave Approvals</h3>
                        <p className="text-sm text-gray-600">Review pending requests</p>
                      </div>
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
