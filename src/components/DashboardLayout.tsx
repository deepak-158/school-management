'use client';

import { useAuth } from '@/context/AuthContext';
import { AuthUser } from '@/lib/types';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  FileText,
  FilePlus,
  FileCheck,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Leave']));
  const pathname = usePathname();

  if (!user) return null;
  const getNavigationItems = (userRole: string) => {
    const commonItems = [
      { name: 'Dashboard', href: '/dashboard', icon: Home },
      { name: 'Profile', href: '/profile', icon: User },
      { name: 'Announcements', href: '/announcements', icon: MessageSquare },
    ];    const studentItems = [
      { name: 'Results', href: '/results', icon: BarChart3 },
      { name: 'Timetable', href: '/timetable', icon: Calendar },
      { name: 'Attendance', href: '/attendance', icon: ClipboardList },
      { 
        name: 'Leave', 
        icon: FileText, 
        isExpandable: true,
        children: [
          { name: 'Apply for Leave', href: '/leave-application', icon: FilePlus },
          { name: 'My Leave', href: '/my-leave', icon: FileText },
        ]
      },
    ];    const teacherItems = [
      { name: 'Timetable', href: '/timetable', icon: Calendar },
      { name: 'Manage Attendance', href: '/attendance', icon: ClipboardList },
      { name: 'Manage Results', href: '/manage-results', icon: BarChart3 },
      { 
        name: 'Leave', 
        icon: FileText, 
        isExpandable: true,
        children: [
          { name: 'Apply for Leave', href: '/leave-application', icon: FilePlus },
          { name: 'My Leave', href: '/my-leave', icon: FileText },
          { name: 'Approve Leave', href: '/leave-approvals', icon: FileCheck },
        ]
      },
    ];    const principalItems = [
      { name: 'Users', href: '/users', icon: Users },
      { name: 'Classes', href: '/classes', icon: BookOpen },
      { name: 'Class Assignments', href: '/class-assignments', icon: Users },
      { name: 'Timetable', href: '/timetable', icon: Calendar },
      { name: 'Attendance Reports', href: '/attendance', icon: ClipboardList },
      { name: 'Manage Results', href: '/manage-results', icon: BarChart3 },
      { name: 'Leave Approvals', href: '/leave-approvals', icon: FileCheck },
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
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

  const toggleSection = (sectionName: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionName)) {
      newExpanded.delete(sectionName);
    } else {
      newExpanded.add(sectionName);
    }
    setExpandedSections(newExpanded);
  };

  const isLeaveRelatedPath = (path: string) => {
    return path.includes('/leave-') || path.includes('/my-leave');
  };

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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full w-64">{/* Rest of sidebar content stays the same */}
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
          </div>          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item: any) => {
              const Icon = item.icon;
              
              if (item.isExpandable) {
                const isExpanded = expandedSections.has(item.name);
                const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;
                const hasActiveChild = item.children?.some((child: any) => pathname === child.href);
                
                return (
                  <div key={item.name}>
                    <button
                      onClick={() => toggleSection(item.name)}
                      className={`flex items-center justify-between w-full px-3 py-2 rounded-lg transition-colors duration-200 ${
                        hasActiveChild || isLeaveRelatedPath(pathname)
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </div>
                      <ChevronIcon className="h-4 w-4" />
                    </button>
                    
                    {isExpanded && (
                      <div className="ml-6 mt-2 space-y-1">
                        {item.children?.map((child: any) => {
                          const ChildIcon = child.icon;
                          const isChildActive = pathname === child.href;
                          return (
                            <Link
                              key={child.name}
                              href={child.href}
                              className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
                                isChildActive
                                  ? 'bg-blue-50 text-blue-600 font-medium'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                              }`}
                              onClick={() => setSidebarOpen(false)}
                            >
                              <ChildIcon className="h-4 w-4" />
                              <span className="text-sm">{child.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }
              
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
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
      </div>      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
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
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
