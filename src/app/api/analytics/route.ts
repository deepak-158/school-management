import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'principal') {
      return NextResponse.json({ error: 'Access denied - Principal role required' }, { status: 403 });
    }

    const db = getDatabase();
    
    // Get overview statistics
    const totalStudents = db.prepare('SELECT COUNT(*) as count FROM students').get() as { count: number };
    const totalTeachers = db.prepare('SELECT COUNT(*) as count FROM teachers').get() as { count: number };
    const totalClasses = db.prepare('SELECT COUNT(*) as count FROM classes').get() as { count: number };
    
    // Calculate average attendance for the current academic year
    const avgAttendanceResult = db.prepare(`
      SELECT 
        AVG(CASE WHEN status = 'present' THEN 100.0 ELSE 0.0 END) as avgAttendance
      FROM attendance 
      WHERE date >= date('now', '-30 days')
    `).get() as { avgAttendance: number | null };
    
    const avgAttendance = avgAttendanceResult.avgAttendance || 0;

    // Get attendance trends (last 6 months)
    const attendanceTrends = db.prepare(`
      SELECT 
        strftime('%m', date) as month,
        AVG(CASE WHEN status = 'present' THEN 100.0 ELSE 0.0 END) as students,
        100 as teachers
      FROM attendance 
      WHERE date >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', date)
      ORDER BY date DESC
      LIMIT 6
    `).all() as Array<{ month: string; students: number; teachers: number }>;

    // Convert month numbers to month names
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedAttendance = attendanceTrends.map(trend => ({
      month: monthNames[parseInt(trend.month) - 1],
      students: Math.round(trend.students),
      teachers: Math.round(trend.teachers)
    })).reverse();

    // Get class performance data
    const classPerformance = db.prepare(`
      SELECT 
        c.name as class,
        AVG(r.obtained_marks * 100.0 / r.max_marks) as avgGrade,
        COUNT(DISTINCT s.id) as students
      FROM classes c
      LEFT JOIN students s ON c.id = s.class_id
      LEFT JOIN results r ON s.id = r.student_id
      WHERE r.created_at >= date('now', '-6 months')
      GROUP BY c.id, c.name
      HAVING COUNT(r.id) > 0
      ORDER BY avgGrade DESC
    `).all() as Array<{ class: string; avgGrade: number; students: number }>;

    // Get leave requests statistics (last 6 months)
    const leaveStats = db.prepare(`
      SELECT 
        strftime('%m', created_at) as month,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM leave_requests 
      WHERE created_at >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY created_at DESC
      LIMIT 6
    `).all() as Array<{ month: string; approved: number; rejected: number; pending: number }>;

    const formattedLeaveStats = leaveStats.map(stat => ({
      month: monthNames[parseInt(stat.month) - 1],
      approved: stat.approved,
      rejected: stat.rejected,
      pending: stat.pending
    })).reverse();

    const analytics = {
      overview: {
        totalStudents: totalStudents.count,
        totalTeachers: totalTeachers.count,
        totalClasses: totalClasses.count,
        avgAttendance: Math.round(avgAttendance * 10) / 10
      },
      attendance: formattedAttendance.length > 0 ? formattedAttendance : [
        { month: 'Jan', students: 0, teachers: 0 },
        { month: 'Feb', students: 0, teachers: 0 },
        { month: 'Mar', students: 0, teachers: 0 },
        { month: 'Apr', students: 0, teachers: 0 },
        { month: 'May', students: 0, teachers: 0 },
        { month: 'Jun', students: 0, teachers: 0 }
      ],
      performance: classPerformance.length > 0 ? classPerformance : [],
      leaveRequests: formattedLeaveStats.length > 0 ? formattedLeaveStats : [
        { month: 'Jan', approved: 0, rejected: 0, pending: 0 },
        { month: 'Feb', approved: 0, rejected: 0, pending: 0 },
        { month: 'Mar', approved: 0, rejected: 0, pending: 0 },
        { month: 'Apr', approved: 0, rejected: 0, pending: 0 },
        { month: 'May', approved: 0, rejected: 0, pending: 0 },
        { month: 'Jun', approved: 0, rejected: 0, pending: 0 }
      ]
    };

    return NextResponse.json({ analytics });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
