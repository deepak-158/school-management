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
    let classes = [];

    if (decoded.role === 'principal') {
      // Principal sees all classes with class teacher info
      classes = db.prepare(`
        SELECT c.*, 
               COUNT(s.id) as student_count,
               (u.first_name || ' ' || u.last_name) as class_teacher_name,
               u.username as class_teacher_username
        FROM classes c
        LEFT JOIN students s ON c.id = s.class_id
        LEFT JOIN users u ON c.class_teacher_id = u.id
        GROUP BY c.id
        ORDER BY c.name
      `).all();
    } else if (decoded.role === 'teacher') {
      // Teacher sees classes they teach or are class teacher of
      const teacher = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(decoded.id) as any;
      if (!teacher) {
        throw new NotFoundError('Teacher profile not found');
      }
      
      classes = db.prepare(`
        SELECT DISTINCT c.*, 
               COUNT(s.id) as student_count,
               (u.first_name || ' ' || u.last_name) as class_teacher_name,
               u.username as class_teacher_username
        FROM classes c
        LEFT JOIN teacher_subjects ts ON c.id = ts.class_id
        LEFT JOIN students s ON c.id = s.class_id
        LEFT JOIN users u ON c.class_teacher_id = u.id
        WHERE ts.teacher_id = ? OR c.class_teacher_id = ?
        GROUP BY c.id
        ORDER BY c.name
      `).all(teacher.id, decoded.id);
    } else if (decoded.role === 'student') {
      // Student sees only their class
      const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(decoded.id) as any;
      if (!student) {
        throw new NotFoundError('Student profile not found');
      }
      
      classes = db.prepare(`
        SELECT c.*, 
               COUNT(s.id) as student_count,
               (u.first_name || ' ' || u.last_name) as class_teacher_name,
               u.username as class_teacher_username
        FROM classes c
        LEFT JOIN students s ON c.id = s.class_id
        LEFT JOIN users u ON c.class_teacher_id = u.id
        WHERE c.id = ?
        GROUP BY c.id
      `).all(student.class_id);
    }

    return NextResponse.json({ 
      success: true,
      classes 
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || request.cookies.get('token')?.value;
    
    if (!token) {
      throw new AuthenticationError('No authentication token provided');
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      throw new AuthenticationError('Invalid or expired token');
    }

    // Only principals can create classes
    if (decoded.role !== 'principal') {
      throw new AuthorizationError('Only principals can create classes');
    }

    const body = await request.json();
    const { name, grade_level, section, academic_year, class_teacher_id } = body;

    // Validate required fields
    if (!name || !grade_level || !academic_year) {
      return NextResponse.json({ 
        success: false,
        message: 'Name, grade level, and academic year are required'
      }, { status: 400 });
    }

    const db = getDatabase();

    // Verify class teacher exists if provided
    if (class_teacher_id) {
      const teacher = db.prepare(`
        SELECT u.id FROM users u 
        JOIN teachers t ON u.id = t.user_id 
        WHERE u.id = ?
      `).get(class_teacher_id);

      if (!teacher) {
        return NextResponse.json({ 
          success: false,
          message: 'Invalid class teacher selected'
        }, { status: 400 });
      }
    }

    // Insert new class
    const result = db.prepare(`
      INSERT INTO classes (name, grade_level, section, academic_year, class_teacher_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, grade_level, section, academic_year, class_teacher_id || null);

    return NextResponse.json({ 
      success: true,
      message: 'Class created successfully',
      classId: result.lastInsertRowid
    });

  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || request.cookies.get('token')?.value;
    
    if (!token) {
      throw new AuthenticationError('No authentication token provided');
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      throw new AuthenticationError('Invalid or expired token');
    }

    // Only principals can update classes
    if (decoded.role !== 'principal') {
      throw new AuthorizationError('Only principals can update classes');
    }

    const body = await request.json();
    const { id, name, grade_level, section, academic_year, class_teacher_id } = body;

    // Validate required fields
    if (!id || !name || !grade_level || !academic_year) {
      return NextResponse.json({ 
        success: false,
        message: 'ID, name, grade level, and academic year are required'
      }, { status: 400 });
    }

    const db = getDatabase();

    // Check if class exists
    const existingClass = db.prepare('SELECT id FROM classes WHERE id = ?').get(id);
    if (!existingClass) {
      return NextResponse.json({ 
        success: false,
        message: 'Class not found'
      }, { status: 404 });
    }

    // Verify class teacher exists if provided
    if (class_teacher_id) {
      const teacher = db.prepare(`
        SELECT u.id FROM users u 
        JOIN teachers t ON u.id = t.user_id 
        WHERE u.id = ?
      `).get(class_teacher_id);

      if (!teacher) {
        return NextResponse.json({ 
          success: false,
          message: 'Invalid class teacher selected'
        }, { status: 400 });
      }
    }

    // Update class
    db.prepare(`
      UPDATE classes 
      SET name = ?, grade_level = ?, section = ?, academic_year = ?, class_teacher_id = ?
      WHERE id = ?
    `).run(name, grade_level, section, academic_year, class_teacher_id || null, id);

    return NextResponse.json({ 
      success: true,
      message: 'Class updated successfully'
    });

  } catch (error) {
    return createErrorResponse(error);
  }
}
