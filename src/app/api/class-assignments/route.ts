import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { verifyToken } from '@/lib/auth';
import { AuthenticationError, AuthorizationError, NotFoundError, createErrorResponse } from '@/lib/errors';

// Get available teachers for class teacher assignment
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

    // Only principals can access this
    if (decoded.role !== 'principal') {
      throw new AuthorizationError('Only principals can access class assignments');
    }

    const db = getDatabase();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'teachers' or 'students'

    if (type === 'teachers') {
      // Get all teachers with their current class assignments
      const teachers = db.prepare(`
        SELECT 
          u.id,
          u.username,
          u.first_name,
          u.last_name,
          u.email,
          t.employee_id,
          t.department,
          GROUP_CONCAT(c.name) as assigned_classes
        FROM users u
        JOIN teachers t ON u.id = t.user_id
        LEFT JOIN classes c ON u.id = c.class_teacher_id
        WHERE u.role = 'teacher'
        GROUP BY u.id
        ORDER BY u.last_name, u.first_name
      `).all();

      return NextResponse.json({ 
        success: true,
        teachers 
      });
    } else if (type === 'students') {
      // Get all students with their class assignments
      const students = db.prepare(`
        SELECT 
          u.id,
          u.username,
          u.first_name,
          u.last_name,
          u.email,
          s.student_id,
          s.roll_number,
          s.class_id,
          c.name as class_name,
          c.grade_level,
          c.section
        FROM users u
        JOIN students s ON u.id = s.user_id
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE u.role = 'student'
        ORDER BY c.grade_level, c.section, s.roll_number, u.last_name, u.first_name
      `).all();

      return NextResponse.json({ 
        success: true,
        students 
      });
    } else {
      // Get all classes for assignment dropdowns
      const classes = db.prepare(`
        SELECT 
          c.*,
          (u.first_name || ' ' || u.last_name) as class_teacher_name,
          COUNT(s.id) as student_count
        FROM classes c
        LEFT JOIN users u ON c.class_teacher_id = u.id
        LEFT JOIN students s ON c.id = s.class_id
        GROUP BY c.id
        ORDER BY c.grade_level, c.section, c.name
      `).all();

      return NextResponse.json({ 
        success: true,
        classes 
      });
    }

  } catch (error) {
    return createErrorResponse(error);
  }
}

// Assign class teacher or student to class
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

    // Only principals can make assignments
    if (decoded.role !== 'principal') {
      throw new AuthorizationError('Only principals can make class assignments');
    }

    const body = await request.json();
    const { type, class_id, user_id } = body;

    if (!type || !class_id || !user_id) {
      return NextResponse.json({ 
        success: false,
        message: 'Type, class ID, and user ID are required'
      }, { status: 400 });
    }

    const db = getDatabase();

    if (type === 'class_teacher') {
      // Assign teacher as class teacher
      // First verify the user is a teacher
      const teacher = db.prepare(`
        SELECT t.id FROM teachers t
        JOIN users u ON t.user_id = u.id
        WHERE u.id = ? AND u.role = 'teacher'
      `).get(user_id);

      if (!teacher) {
        return NextResponse.json({ 
          success: false,
          message: 'Selected user is not a teacher'
        }, { status: 400 });
      }

      // Update class with new class teacher
      db.prepare(`
        UPDATE classes 
        SET class_teacher_id = ?
        WHERE id = ?
      `).run(user_id, class_id);

      return NextResponse.json({ 
        success: true,
        message: 'Class teacher assigned successfully'
      });

    } else if (type === 'student_class') {
      // Assign student to class
      // First verify the user is a student
      const student = db.prepare(`
        SELECT s.id FROM students s
        JOIN users u ON s.user_id = u.id
        WHERE u.id = ? AND u.role = 'student'
      `).get(user_id);

      if (!student) {
        return NextResponse.json({ 
          success: false,
          message: 'Selected user is not a student'
        }, { status: 400 });
      }

      // Update student with new class
      db.prepare(`
        UPDATE students 
        SET class_id = ?
        WHERE user_id = ?
      `).run(class_id, user_id);

      return NextResponse.json({ 
        success: true,
        message: 'Student assigned to class successfully'
      });

    } else {
      return NextResponse.json({ 
        success: false,
        message: 'Invalid assignment type'
      }, { status: 400 });
    }

  } catch (error) {
    return createErrorResponse(error);
  }
}

// Remove assignments
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || request.cookies.get('token')?.value;
    
    if (!token) {
      throw new AuthenticationError('No authentication token provided');
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      throw new AuthenticationError('Invalid or expired token');
    }

    // Only principals can remove assignments
    if (decoded.role !== 'principal') {
      throw new AuthorizationError('Only principals can remove class assignments');
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const class_id = searchParams.get('class_id');
    const user_id = searchParams.get('user_id');

    if (!type) {
      return NextResponse.json({ 
        success: false,
        message: 'Assignment type is required'
      }, { status: 400 });
    }

    const db = getDatabase();

    if (type === 'class_teacher' && class_id) {
      // Remove class teacher from class
      db.prepare(`
        UPDATE classes 
        SET class_teacher_id = NULL
        WHERE id = ?
      `).run(class_id);

      return NextResponse.json({ 
        success: true,
        message: 'Class teacher removed successfully'
      });

    } else if (type === 'student_class' && user_id) {
      // Remove student from class
      db.prepare(`
        UPDATE students 
        SET class_id = NULL
        WHERE user_id = ?
      `).run(user_id);

      return NextResponse.json({ 
        success: true,
        message: 'Student removed from class successfully'
      });

    } else {
      return NextResponse.json({ 
        success: false,
        message: 'Invalid parameters for assignment removal'
      }, { status: 400 });
    }

  } catch (error) {
    return createErrorResponse(error);
  }
}
