import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { verifyToken } from '@/lib/auth';
import { AuthenticationError, AuthorizationError, NotFoundError, ValidationError, createErrorResponse, validateRequiredFields } from '@/lib/errors';

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
    const url = new URL(request.url);
    const date = url.searchParams.get('date');
    const classId = url.searchParams.get('class_id');
    
    let attendance = [];    if (decoded.role === 'student') {
      // Student sees their own attendance
      const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(decoded.id) as any;
      if (!student) {
        throw new NotFoundError('Student profile not found');
      }

      let query = `
        SELECT a.*, s.student_id, s.full_name as student_name, c.name as class_name
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        JOIN classes c ON s.class_id = c.id
        WHERE s.user_id = ?
      `;
      
      const params = [decoded.id];
      
      if (date) {
        query += ' AND a.date = ?';
        params.push(date);
      }
      
      query += ' ORDER BY a.date DESC LIMIT 100';
      
      attendance = db.prepare(query).all(...params);    } else if (decoded.role === 'teacher') {
      // Teacher sees attendance for their classes
      const teacher = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(decoded.id) as any;
      if (!teacher) {
        throw new NotFoundError('Teacher profile not found');
      }

      let query = `
        SELECT a.*, s.student_id, s.full_name as student_name, c.name as class_name
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        JOIN classes c ON s.class_id = c.id
        JOIN teacher_subjects ts ON c.id = ts.class_id
        WHERE ts.teacher_id = ?
      `;
      
      const params = [teacher.id];
      
      if (date) {
        query += ' AND a.date = ?';
        params.push(date);
      }
      
      if (classId) {
        query += ' AND c.id = ?';
        params.push(classId);
      }
      
      query += ' ORDER BY c.name, s.full_name';
      
      attendance = db.prepare(query).all(...params);

    } else if (decoded.role === 'principal') {
      // Principal sees all attendance
      let query = `
        SELECT a.*, s.student_id, s.full_name as student_name, c.name as class_name
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        JOIN classes c ON s.class_id = c.id
        WHERE 1=1
      `;
      
      const params: any[] = [];
      
      if (date) {
        query += ' AND a.date = ?';
        params.push(date);
      }
      
      if (classId) {
        query += ' AND c.id = ?';
        params.push(classId);
      }
      
      query += ' ORDER BY c.name, s.full_name';
      
      attendance = db.prepare(query).all(...params);
    } else {
      throw new AuthorizationError('Insufficient permissions to access attendance data');
    }

    return NextResponse.json({ attendance });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      throw new AuthenticationError('No authentication token provided');
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      throw new AuthenticationError('Invalid or expired token');
    }

    // Only teachers and principals can mark attendance
    if (!['teacher', 'principal'].includes(decoded.role)) {
      throw new AuthorizationError('Only teachers and principals can mark attendance');
    }    const body = await request.json();
    validateRequiredFields(body, ['student_id', 'date', 'status']);

    const { student_id, date, status } = body;

    // Validate status
    if (!['present', 'absent', 'late'].includes(status)) {
      throw new ValidationError('Invalid attendance status. Must be: present, absent, or late');
    }

    const db = getDatabase();
    
    // Check if attendance already exists for this student and date
    const existing = db.prepare(`
      SELECT * FROM attendance 
      WHERE student_id = ? AND date = ?
    `).get(student_id, date);

    if (existing) {
      // Update existing attendance
      db.prepare(`
        UPDATE attendance 
        SET status = ?, updated_at = datetime('now')
        WHERE student_id = ? AND date = ?
      `).run(status, student_id, date);
    } else {
      // Insert new attendance record
      db.prepare(`
        INSERT INTO attendance (student_id, date, status, created_at, updated_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
      `).run(student_id, date, status);
    }

    return NextResponse.json({ success: true, message: 'Attendance marked successfully' });
  } catch (error) {
    return createErrorResponse(error);
  }
}
