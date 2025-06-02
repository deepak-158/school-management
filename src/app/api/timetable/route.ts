import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    let token = request.cookies.get('token')?.value;
    
    // If no cookie token, check Authorization header
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
    }    const db = getDatabase();
    const url = new URL(request.url);
    const classId = url.searchParams.get('class_id');
    
    let timetable: any[] = [];if (decoded.role === 'student') {
      // Student sees their class timetable
      const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(decoded.id) as any;
      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }      timetable = db.prepare(`
        SELECT 
          t.*,
          s.name as subject_name,
          (u.first_name || ' ' || u.last_name) as teacher_name,
          c.name as class_name,
          CASE t.day_of_week 
            WHEN 1 THEN 'Monday'
            WHEN 2 THEN 'Tuesday'
            WHEN 3 THEN 'Wednesday'
            WHEN 4 THEN 'Thursday'
            WHEN 5 THEN 'Friday'
          END as day,
          (t.start_time || '-' || t.end_time) as time_slot
        FROM timetable t
        JOIN subjects s ON t.subject_id = s.id
        JOIN teachers te ON t.teacher_id = te.id
        JOIN users u ON te.user_id = u.id
        JOIN classes c ON t.class_id = c.id
        WHERE t.class_id = ?
        ORDER BY 
          CASE t.day_of_week 
            WHEN 1 THEN 1
            WHEN 2 THEN 2
            WHEN 3 THEN 3
            WHEN 4 THEN 4
            WHEN 5 THEN 5
          END,
          t.start_time
      `).all(student.class_id);

    } else if (decoded.role === 'teacher') {
      // Teacher sees their assigned classes or specific class
      const teacher = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(decoded.id) as any;
      if (!teacher) {
        return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
      }      if (classId) {
        // Specific class timetable
        timetable = db.prepare(`
          SELECT 
            t.*,
            s.name as subject_name,
            (u.first_name || ' ' || u.last_name) as teacher_name,
            c.name as class_name,
            CASE t.day_of_week 
              WHEN 1 THEN 'Monday'
              WHEN 2 THEN 'Tuesday'
              WHEN 3 THEN 'Wednesday'
              WHEN 4 THEN 'Thursday'
              WHEN 5 THEN 'Friday'
            END as day,
            (t.start_time || '-' || t.end_time) as time_slot
          FROM timetable t
          JOIN subjects s ON t.subject_id = s.id
          JOIN teachers te ON t.teacher_id = te.id
          JOIN users u ON te.user_id = u.id
          JOIN classes c ON t.class_id = c.id
          WHERE t.class_id = ?
          ORDER BY 
            CASE t.day_of_week 
              WHEN 1 THEN 1
              WHEN 2 THEN 2
              WHEN 3 THEN 3
              WHEN 4 THEN 4
              WHEN 5 THEN 5
            END,
            t.start_time
        `).all(classId);      } else {
        // Teacher's own timetable
        timetable = db.prepare(`
          SELECT 
            t.*,
            s.name as subject_name,
            (u.first_name || ' ' || u.last_name) as teacher_name,
            c.name as class_name,
            CASE t.day_of_week 
              WHEN 1 THEN 'Monday'
              WHEN 2 THEN 'Tuesday'
              WHEN 3 THEN 'Wednesday'
              WHEN 4 THEN 'Thursday'
              WHEN 5 THEN 'Friday'
            END as day,
            (t.start_time || '-' || t.end_time) as time_slot
          FROM timetable t
          JOIN subjects s ON t.subject_id = s.id
          JOIN teachers te ON t.teacher_id = te.id
          JOIN users u ON te.user_id = u.id
          JOIN classes c ON t.class_id = c.id
          WHERE t.teacher_id = ?
          ORDER BY 
            CASE t.day_of_week 
              WHEN 1 THEN 1
              WHEN 2 THEN 2
              WHEN 3 THEN 3
              WHEN 4 THEN 4
              WHEN 5 THEN 5
            END,
            t.start_time
        `).all(teacher.id);
      }    } else if (decoded.role === 'principal') {
      // Principal sees all timetables or specific class
      if (classId) {
        timetable = db.prepare(`
          SELECT 
            t.*,
            s.name as subject_name,
            (u.first_name || ' ' || u.last_name) as teacher_name,
            c.name as class_name,
            CASE t.day_of_week 
              WHEN 1 THEN 'Monday'
              WHEN 2 THEN 'Tuesday'
              WHEN 3 THEN 'Wednesday'
              WHEN 4 THEN 'Thursday'
              WHEN 5 THEN 'Friday'
            END as day,
            (t.start_time || '-' || t.end_time) as time_slot
          FROM timetable t
          JOIN subjects s ON t.subject_id = s.id
          JOIN teachers te ON t.teacher_id = te.id
          JOIN users u ON te.user_id = u.id
          JOIN classes c ON t.class_id = c.id
          WHERE t.class_id = ?
          ORDER BY 
            CASE t.day_of_week 
              WHEN 1 THEN 1
              WHEN 2 THEN 2
              WHEN 3 THEN 3
              WHEN 4 THEN 4
              WHEN 5 THEN 5
            END,
            t.start_time
        `).all(classId);
      } else {
        // All timetables
        timetable = db.prepare(`
          SELECT 
            t.*,
            s.name as subject_name,
            (u.first_name || ' ' || u.last_name) as teacher_name,
            c.name as class_name,
            CASE t.day_of_week 
              WHEN 1 THEN 'Monday'
              WHEN 2 THEN 'Tuesday'
              WHEN 3 THEN 'Wednesday'
              WHEN 4 THEN 'Thursday'
              WHEN 5 THEN 'Friday'
            END as day,
            (t.start_time || '-' || t.end_time) as time_slot
          FROM timetable t
          JOIN subjects s ON t.subject_id = s.id
          JOIN teachers te ON t.teacher_id = te.id
          JOIN users u ON te.user_id = u.id
          JOIN classes c ON t.class_id = c.id
          ORDER BY 
            c.name,
            CASE t.day_of_week 
              WHEN 1 THEN 1
              WHEN 2 THEN 2
              WHEN 3 THEN 3
              WHEN 4 THEN 4
              WHEN 5 THEN 5
            END,
            t.start_time
        `).all();
      }
    }

    return NextResponse.json({ timetable });
  } catch (error) {
    console.error('Timetable API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
