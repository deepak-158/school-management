import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { verifyToken } from '@/lib/auth';
import { AuthenticationError, AuthorizationError, NotFoundError, createErrorResponse } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || request.cookies.get('token')?.value;
    
    if (!token) {
      throw new AuthenticationError('No authentication token provided');
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      throw new AuthenticationError('Invalid or expired token');
    }

    const db = getDatabase();
    const url = new URL(request.url);
    const classId = url.searchParams.get('class_id');
    
    let students = [];

    if (decoded.role === 'principal') {
      // Principal sees all students or students from specific class
      let query = `
        SELECT s.*, c.name as class_name, u.username
        FROM students s
        JOIN classes c ON s.class_id = c.id
        JOIN users u ON s.user_id = u.id
      `;
      
      const params: any[] = [];
      
      if (classId) {
        query += ' WHERE s.class_id = ?';
        params.push(classId);
      }
      
      query += ' ORDER BY c.name, s.full_name';
      
      students = db.prepare(query).all(...params);

    } else if (decoded.role === 'teacher') {
      // Teacher sees students from their classes
      const teacher = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(decoded.userId) as any;
      if (!teacher) {
        throw new NotFoundError('Teacher profile not found');
      }

      let query = `
        SELECT DISTINCT s.*, c.name as class_name, u.username
        FROM students s
        JOIN classes c ON s.class_id = c.id
        JOIN users u ON s.user_id = u.id
        JOIN teacher_subjects ts ON c.id = ts.class_id
        WHERE ts.teacher_id = ?
      `;
      
      const params = [teacher.id];
      
      if (classId) {
        query += ' AND s.class_id = ?';
        params.push(classId);
      }
      
      query += ' ORDER BY c.name, s.full_name';
      
      students = db.prepare(query).all(...params);

    } else if (decoded.role === 'student') {
      // Student sees only themselves
      students = db.prepare(`
        SELECT s.*, c.name as class_name, u.username
        FROM students s
        JOIN classes c ON s.class_id = c.id
        JOIN users u ON s.user_id = u.id
        WHERE s.user_id = ?
      `).all(decoded.userId);
    } else {
      throw new AuthorizationError('Insufficient permissions to access student data');
    }

    return NextResponse.json({ students });
  } catch (error) {
    return createErrorResponse(error);
  }
}
