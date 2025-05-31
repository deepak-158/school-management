import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Try to get token from cookie first, then from Authorization header
    let token = request.cookies.get('token')?.value;
    
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }const db = getDatabase();
    const today = new Date().toISOString().split('T')[0];
    let stats = {};

    switch (decoded.role) {
      case 'principal':
        // Principal sees overall system stats
        const totalStudents = db.prepare('SELECT COUNT(*) as count FROM students').get() as { count: number };
        const totalTeachers = db.prepare('SELECT COUNT(*) as count FROM teachers').get() as { count: number };
        const totalClasses = db.prepare('SELECT COUNT(*) as count FROM classes').get() as { count: number };
        const totalSubjects = db.prepare('SELECT COUNT(*) as count FROM subjects').get() as { count: number };
        
        // Today's attendance
        const todayAttendance = db.prepare(`
          SELECT COUNT(*) as present FROM attendance 
          WHERE date = ? AND status = 'present'
        `).get(today) as { present: number };
        
        const totalStudentsForAttendance = totalStudents.count;
        const attendanceRate = totalStudentsForAttendance > 0 
          ? Math.round((todayAttendance.present / totalStudentsForAttendance) * 100) 
          : 0;

        stats = {
          totalStudents: totalStudents.count,
          totalTeachers: totalTeachers.count,
          totalClasses: totalClasses.count,
          totalSubjects: totalSubjects.count,
          attendanceRate,
          presentToday: todayAttendance.present
        };
        break;

      case 'teacher':
        // Teacher sees their class stats
        const teacher = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(decoded.userId) as any;
        if (!teacher) {
          return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
        }

        // Get classes taught by this teacher
        const teacherClasses = db.prepare(`
          SELECT DISTINCT c.* FROM classes c
          JOIN teacher_subjects ts ON c.id = ts.class_id
          WHERE ts.teacher_id = ?
        `).all(teacher.id) as any[];

        // Get students in teacher's classes
        const studentsInClasses = db.prepare(`
          SELECT COUNT(DISTINCT s.id) as count FROM students s
          JOIN classes c ON s.class_id = c.id
          JOIN teacher_subjects ts ON c.id = ts.class_id
          WHERE ts.teacher_id = ?
        `).get(teacher.id) as { count: number };

        // Get teacher's subjects
        const teacherSubjects = db.prepare(`
          SELECT COUNT(*) as count FROM teacher_subjects ts
          WHERE ts.teacher_id = ?
        `).get(teacher.id) as { count: number };

        // Today's attendance for teacher's classes
        const teacherAttendance = db.prepare(`
          SELECT COUNT(*) as present FROM attendance a
          JOIN students s ON a.student_id = s.id
          JOIN classes c ON s.class_id = c.id
          JOIN teacher_subjects ts ON c.id = ts.class_id
          WHERE ts.teacher_id = ? AND a.date = ? AND a.status = 'present'
        `).get(teacher.id, today) as { present: number };

        stats = {
          totalClasses: teacherClasses.length,
          totalStudents: studentsInClasses.count,
          totalSubjects: teacherSubjects.count,
          presentToday: teacherAttendance.present,
          attendanceRate: studentsInClasses.count > 0 
            ? Math.round((teacherAttendance.present / studentsInClasses.count) * 100) 
            : 0
        };
        break;      case 'student':
        // Student sees their personal stats
        const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(decoded.userId) as any;
        if (!student) {
          return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        // Get student's class info
        const studentClass = db.prepare('SELECT * FROM classes WHERE id = ?').get(student.class_id) as any;
        
        // Get total subjects for the class
        const classSubjects = db.prepare(`
          SELECT COUNT(*) as count FROM teacher_subjects ts
          WHERE ts.class_id = ?
        `).get(student.class_id) as { count: number };

        // Get student's attendance this month
        const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
        const monthlyAttendance = db.prepare(`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
          FROM attendance 
          WHERE student_id = ? AND date LIKE ?
        `).get(student.id, `${thisMonth}%`) as { total: number; present: number };

        // Get latest results - fix column name
        const latestResults = db.prepare(`
          SELECT COUNT(*) as count, AVG(obtained_marks) as avgMarks
          FROM results 
          WHERE student_id = ?
        `).get(student.id) as { count: number; avgMarks: number };

        stats = {
          className: studentClass?.name || 'N/A',
          totalSubjects: classSubjects.count,
          attendanceRate: monthlyAttendance.total > 0 
            ? Math.round((monthlyAttendance.present / monthlyAttendance.total) * 100) 
            : 0,
          totalTests: latestResults.count,
          averageMarks: Math.round(latestResults.avgMarks || 0),
          presentDays: monthlyAttendance.present,
          totalDays: monthlyAttendance.total
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
