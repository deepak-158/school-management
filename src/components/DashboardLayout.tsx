'use client';

import { useAuth } from '@/context/AuthContext';
import { AuthUser } from '@/lib/types';
import { useState } from 'react';
import {
  User,
  Home,
  BookOpen,
  Calendar,
  ClipboardList,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Users,
  BarChart3,
  FileText
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  const getNavigationItems = (userRole: string) => {
    const commonItems = [
      { name: 'Dashboard', href: '/dashboard', icon: Home },
      { name: 'Profile', href: '/dashboard/profile', icon: User },
      { name: 'Announcements', href: '/dashboard/announcements', icon: MessageSquare },
    ];

    const studentItems = [
      { name: 'Results', href: '/dashboard/results', icon: BarChart3 },
      { name: 'Timetable', href: '/dashboard/timetable', icon: Calendar },
      { name: 'Attendance', href: '/dashboard/attendance', icon: ClipboardList },
      { name: 'Leave Requests', href: '/dashboard/leave-requests', icon: FileText },
    ];

    const teacherItems = [
      { name: 'Timetable', href: '/dashboard/timetable', icon: Calendar },
      { name: 'Manage Attendance', href: '/dashboard/manage-attendance', icon: ClipboardList },
      { name: 'Manage Results', href: '/dashboard/manage-results', icon: BarChart3 },
      { name: 'Leave Requests', href: '/dashboard/leave-requests', icon: FileText },
    ];

    const principalItems = [
      { name: 'Users', href: '/dashboard/users', icon: Users },
      { name: 'Classes', href: '/dashboard/classes', icon: BookOpen },
      { name: 'Timetable', href: '/dashboard/timetable', icon: Calendar },
      { name: 'Attendance Reports', href: '/dashboard/attendance-reports', icon: ClipboardList },
      { name: 'Results Overview', href: '/dashboard/results-overview', icon: BarChart3 },
      { name: 'Leave Approvals', href: '/dashboard/leave-approvals', icon: FileText },
      { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    ];

    switch (userRole) {
      case 'student':
        return [...commonItems, ...studentItems];
      case 'teacher':
        return [...commonItems, ...teacherItems];
      case 'principal':
        return [...commonItems, ...principalItems];
      default:
        return commonItems;
    }
  };

  const navigationItems = getNavigationItems(user.role);

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'student':
        return 'Student';
      case 'teacher':
        return 'Teacher';
      case 'principal':
        return 'Principal';
      default:
        return 'User';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'student':
        return 'bg-blue-100 text-blue-800';
      case 'teacher':
        return 'bg-green-100 text-green-800';
      case 'principal':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo and close button */}
          <div className="flex items-center justify-between p-4 border-b">
            <h1 className="text-xl font-bold text-gray-900">School Portal</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* User info */}
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.first_name} {user.last_name}
                </p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                  {getRoleDisplayName(user.role)}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200"
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </a>
              );
            })}
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t">
            <button
              onClick={logout}
              className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-1 lg:flex lg:items-center lg:justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Welcome back, {user.first_name}!
              </h2>
              <div className="hidden lg:flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
