import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { verifyToken } from '@/lib/auth';
import { AuthenticationError, NotFoundError, createErrorResponse } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      throw new AuthenticationError('No authentication token provided');
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      throw new AuthenticationError('Invalid or expired token');
    }

    const db = getDatabase();
    let classes = [];

    if (decoded.role === 'principal') {
      // Principal sees all classes
      classes = db.prepare(`
        SELECT c.*, COUNT(s.id) as student_count
        FROM classes c
        LEFT JOIN students s ON c.id = s.class_id
        GROUP BY c.id
        ORDER BY c.name
      `).all();
    } else if (decoded.role === 'teacher') {
      // Teacher sees classes they teach
      const teacher = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(decoded.userId) as any;
      if (!teacher) {
        throw new NotFoundError('Teacher profile not found');
      }
      
      classes = db.prepare(`
        SELECT DISTINCT c.*, COUNT(s.id) as student_count
        FROM classes c
        JOIN teacher_subjects ts ON c.id = ts.class_id
        LEFT JOIN students s ON c.id = s.class_id
        WHERE ts.teacher_id = ?
        GROUP BY c.id
        ORDER BY c.name
      `).all(teacher.id);
    } else if (decoded.role === 'student') {
      // Student sees only their class
      const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(decoded.userId) as any;
      if (!student) {
        throw new NotFoundError('Student profile not found');
      }
      
      classes = db.prepare(`
        SELECT c.*, COUNT(s.id) as student_count
        FROM classes c
        LEFT JOIN students s ON c.id = s.class_id
        WHERE c.id = ?
        GROUP BY c.id
      `).all(student.class_id);
    }

    return NextResponse.json({ classes });
  } catch (error) {
    return createErrorResponse(error);
  }
}
