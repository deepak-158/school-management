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
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const db = getDatabase();
    const url = new URL(request.url);
    const classId = url.searchParams.get('class_id');
    
    let timetable = [];

    if (decoded.role === 'student') {
      // Student sees their class timetable
      const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(decoded.userId) as any;
      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      timetable = db.prepare(`
        SELECT 
          t.*,
          s.name as subject_name,
          te.full_name as teacher_name,
          c.name as class_name
        FROM timetable t
        JOIN subjects s ON t.subject_id = s.id
        JOIN teachers te ON t.teacher_id = te.id
        JOIN classes c ON t.class_id = c.id
        WHERE t.class_id = ?
        ORDER BY 
          CASE t.day 
            WHEN 'Monday' THEN 1
            WHEN 'Tuesday' THEN 2
            WHEN 'Wednesday' THEN 3
            WHEN 'Thursday' THEN 4
            WHEN 'Friday' THEN 5
          END,
          t.time_slot
      `).all(student.class_id);

    } else if (decoded.role === 'teacher') {
      // Teacher sees their assigned classes or specific class
      const teacher = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(decoded.userId) as any;
      if (!teacher) {
        return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
      }

      if (classId) {
        // Specific class timetable
        timetable = db.prepare(`
          SELECT 
            t.*,
            s.name as subject_name,
            te.full_name as teacher_name,
            c.name as class_name
          FROM timetable t
          JOIN subjects s ON t.subject_id = s.id
          JOIN teachers te ON t.teacher_id = te.id
          JOIN classes c ON t.class_id = c.id
          WHERE t.class_id = ?
          ORDER BY 
            CASE t.day 
              WHEN 'Monday' THEN 1
              WHEN 'Tuesday' THEN 2
              WHEN 'Wednesday' THEN 3
              WHEN 'Thursday' THEN 4
              WHEN 'Friday' THEN 5
            END,
            t.time_slot
        `).all(classId);
      } else {
        // Teacher's own timetable
        timetable = db.prepare(`
          SELECT 
            t.*,
            s.name as subject_name,
            te.full_name as teacher_name,
            c.name as class_name
          FROM timetable t
          JOIN subjects s ON t.subject_id = s.id
          JOIN teachers te ON t.teacher_id = te.id
          JOIN classes c ON t.class_id = c.id
          WHERE t.teacher_id = ?
          ORDER BY 
            CASE t.day 
              WHEN 'Monday' THEN 1
              WHEN 'Tuesday' THEN 2
              WHEN 'Wednesday' THEN 3
              WHEN 'Thursday' THEN 4
              WHEN 'Friday' THEN 5
            END,
            t.time_slot
        `).all(teacher.id);
      }

    } else if (decoded.role === 'principal') {
      // Principal sees all timetables or specific class
      if (classId) {
        timetable = db.prepare(`
          SELECT 
            t.*,
            s.name as subject_name,
            te.full_name as teacher_name,
            c.name as class_name
          FROM timetable t
          JOIN subjects s ON t.subject_id = s.id
          JOIN teachers te ON t.teacher_id = te.id
          JOIN classes c ON t.class_id = c.id
          WHERE t.class_id = ?
          ORDER BY 
            CASE t.day 
              WHEN 'Monday' THEN 1
              WHEN 'Tuesday' THEN 2
              WHEN 'Wednesday' THEN 3
              WHEN 'Thursday' THEN 4
              WHEN 'Friday' THEN 5
            END,
            t.time_slot
        `).all(classId);
      } else {
        // All timetables
        timetable = db.prepare(`
          SELECT 
            t.*,
            s.name as subject_name,
            te.full_name as teacher_name,
            c.name as class_name
          FROM timetable t
          JOIN subjects s ON t.subject_id = s.id
          JOIN teachers te ON t.teacher_id = te.id
          JOIN classes c ON t.class_id = c.id
          ORDER BY 
            c.name,
            CASE t.day 
              WHEN 'Monday' THEN 1
              WHEN 'Tuesday' THEN 2
              WHEN 'Wednesday' THEN 3
              WHEN 'Thursday' THEN 4
              WHEN 'Friday' THEN 5
            END,
            t.time_slot
        `).all();
      }
    }

    return NextResponse.json({ timetable });
  } catch (error) {
    console.error('Timetable API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
