// User types
export type UserRole = 'student' | 'teacher' | 'principal';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthUser extends User {
  token: string;
}

// Student types
export interface Student {
  id: number;
  user_id: number;
  student_id: string;
  class_id?: number;
  roll_number?: number;
  admission_date?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  blood_group?: string;
  created_at: string;
  // Relations
  user?: User;
  class?: Class;
}

// Teacher types
export interface Teacher {
  id: number;
  user_id: number;
  employee_id: string;
  department?: string;
  qualification?: string;
  experience_years?: number;
  salary?: number;
  joining_date?: string;
  created_at: string;
  // Relations
  user?: User;
  subjects?: Subject[];
  classes?: Class[];
}

// Class types
export interface Class {
  id: number;
  name: string;
  grade_level: number;
  section?: string;
  academic_year: string;
  class_teacher_id?: number;
  created_at: string;
  // Relations
  class_teacher?: Teacher;
  students?: Student[];
}

// Subject types
export interface Subject {
  id: number;
  name: string;
  code: string;
  description?: string;
  created_at: string;
}

// Timetable types
export interface TimetableEntry {
  id: number;
  class_id: number;
  subject_id: number;
  teacher_id: number;
  day_of_week: number; // 1-7 (Monday-Sunday)
  start_time: string;
  end_time: string;
  room_number?: string;
  created_at: string;
  // Relations
  class?: Class;
  subject?: Subject;
  teacher?: Teacher;
}

// Attendance types
export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface Attendance {
  id: number;
  student_id: number;
  class_id: number;
  subject_id?: number;
  date: string;
  status: AttendanceStatus;
  marked_by: number;
  notes?: string;
  created_at: string;
  // Relations
  student?: Student;
  class?: Class;
  subject?: Subject;
  marked_by_user?: User;
}

// Results types
export interface Result {
  id: number;
  student_id: number;
  subject_id: number;
  exam_type: string;
  exam_date?: string;
  max_marks: number;
  obtained_marks: number;
  grade?: string;
  remarks?: string;
  teacher_id: number;
  academic_year: string;
  semester?: string;
  created_at: string;
  // Relations
  student?: Student;
  subject?: Subject;
  teacher?: Teacher;
}

// Announcement types
export type AnnouncementTargetAudience = 'all' | 'students' | 'teachers' | 'class_specific';
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Announcement {
  id: number;
  title: string;
  content: string;
  author_id: number;
  target_audience: AnnouncementTargetAudience;
  target_class_id?: number;
  priority: AnnouncementPriority;
  is_active: boolean;
  created_at: string;
  expires_at?: string;
  // Relations
  author?: User;
  target_class?: Class;
}

// Leave request types
export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: number;
  user_id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: LeaveRequestStatus;
  approved_by?: number;
  approval_date?: string;
  approval_comments?: string;
  created_at: string;
  // Relations
  user?: User;
  approved_by_user?: User;
}

// Form types
export interface LoginForm {
  username: string;
  password: string;
}

export interface CreateUserForm {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
}

export interface CreateStudentForm extends CreateUserForm {
  student_id: string;
  class_id?: number;
  roll_number?: number;
  admission_date?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  blood_group?: string;
}

export interface CreateTeacherForm extends CreateUserForm {
  employee_id: string;
  department?: string;
  qualification?: string;
  experience_years?: number;
  salary?: number;
  joining_date?: string;
}

export interface LeaveRequestForm {
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
}

export interface AnnouncementForm {
  title: string;
  content: string;
  target_audience: AnnouncementTargetAudience;
  target_class_id?: number;
  priority: AnnouncementPriority;
  expires_at?: string;
}

// Dashboard stats types
export interface DashboardStats {
  total_students: number;
  total_teachers: number;
  total_classes: number;
  total_subjects: number;
  attendance_rate: number;
  pending_leave_requests: number;
  recent_announcements: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Context types
export interface AuthContextType {
  user: AuthUser | null;
  login: (credentials: LoginForm) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

// Component prop types
export interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export interface DashboardLayoutProps {
  children: React.ReactNode;
  user: AuthUser;
}

// Utility types
export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
  key: string;
  direction: SortOrder;
}

export interface FilterConfig {
  [key: string]: any;
}

export interface PaginationConfig {
  page: number;
  limit: number;
  total: number;
}
