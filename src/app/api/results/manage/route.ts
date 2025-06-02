import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { verifyToken } from '@/lib/auth';
import { 
  createErrorResponse, 
  logError, 
  AuthenticationError, 
  AuthorizationError, 
  NotFoundError,
  ValidationError,
  validateMarks
} from '@/lib/errors';

// Enhanced Results Management API for Principal
export async function GET(request: NextRequest) {
  try {
    // Check for token in header first, then fallback to cookies
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
        token = cookies.token;
      }
    }

    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      throw new AuthenticationError('Invalid token');
    }

    // Only principals can access this management endpoint
    if (decoded.role !== 'principal') {
      throw new AuthorizationError('Only principals can access results management');
    }

    const db = getDatabase();
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('class_id');
    const subjectId = searchParams.get('subject_id');
    const studentId = searchParams.get('student_id');
    const includeClassSubjects = searchParams.get('include_class_subjects') === 'true';

    // Build dynamic where clause
    let whereClause = '';
    const params: any[] = [];
    
    if (studentId) {
      whereClause += ' WHERE r.student_id = ?';
      params.push(studentId);
    }
    if (classId) {
      whereClause += (whereClause ? ' AND' : ' WHERE') + ' st.class_id = ?';
      params.push(classId);
    }
    if (subjectId) {
      whereClause += (whereClause ? ' AND' : ' WHERE') + ' r.subject_id = ?';
      params.push(subjectId);
    }

    // Enhanced query with class-subjects information
    const query = `
      SELECT 
        r.id,
        r.student_id,
        r.subject_id,
        r.exam_type,
        r.max_marks,
        r.obtained_marks,
        r.exam_date,
        r.created_at,
        s.name as subject_name,
        s.code as subject_code,
        (u.first_name || ' ' || u.last_name) as student_name,
        st.student_id as roll_number,
        c.name as class_name,
        c.grade_level,
        c.section,
        cs.is_mandatory,
        cs.credits,
        (r.obtained_marks * 100.0 / r.max_marks) as percentage
      FROM results r
      JOIN subjects s ON r.subject_id = s.id
      JOIN students st ON r.student_id = st.id
      JOIN users u ON st.user_id = u.id
      JOIN classes c ON st.class_id = c.id
      LEFT JOIN class_subjects cs ON c.id = cs.class_id AND s.id = cs.subject_id
      ${whereClause}
      ORDER BY c.grade_level, c.section, st.student_id, s.name, r.exam_date DESC
    `;

    const results = db.prepare(query).all(...params);

    // If requested, also get available class-subjects combinations
    let classSubjects = null;
    if (includeClassSubjects) {
      classSubjects = db.prepare(`
        SELECT 
          cs.class_id,
          cs.subject_id,
          c.name as class_name,
          c.grade_level,
          c.section,
          s.name as subject_name,
          s.code as subject_code,
          cs.is_mandatory,
          cs.credits
        FROM class_subjects cs
        JOIN classes c ON cs.class_id = c.id
        JOIN subjects s ON cs.subject_id = s.id
        ORDER BY c.grade_level, c.section, s.name
      `).all();
    }

    // Get summary statistics for principal dashboard
    const summaryStats = db.prepare(`
      SELECT 
        COUNT(DISTINCT r.student_id) as total_students_with_results,
        COUNT(r.id) as total_results,
        COUNT(DISTINCT r.subject_id) as subjects_with_results,
        COUNT(DISTINCT st.class_id) as classes_with_results,
        AVG(r.obtained_marks * 100.0 / r.max_marks) as overall_average,
        MIN(r.exam_date) as earliest_exam,
        MAX(r.exam_date) as latest_exam
      FROM results r
      JOIN students st ON r.student_id = st.id
    `).get();

    return NextResponse.json({
      success: true,
      data: {
        results,
        classSubjects,
        summary: summaryStats,
        filters: {
          classId,
          subjectId,
          studentId
        }
      }
    });

  } catch (error) {
    logError(error as Error, 'Failed to get results management data');
    return createErrorResponse(error as Error);
  }
}

// Create/Update result (Principal only)
export async function POST(request: NextRequest) {
  try {
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
        token = cookies.token;
      }
    }

    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      throw new AuthenticationError('Invalid token');
    }

    if (decoded.role !== 'principal') {
      throw new AuthorizationError('Only principals can manage results');
    }

    const body = await request.json();
    const { 
      student_id, 
      subject_id, 
      exam_type, 
      max_marks, 
      obtained_marks, 
      exam_date 
    } = body;

    // Validate input
    if (!student_id || !subject_id || !exam_type || !max_marks || obtained_marks === undefined || !exam_date) {
      throw new ValidationError('All fields are required');
    }

    validateMarks(obtained_marks, max_marks);

    const db = getDatabase();

    // Verify the student exists and get their class
    const student = db.prepare('SELECT st.*, c.name as class_name FROM students st JOIN classes c ON st.class_id = c.id WHERE st.id = ?').get(student_id) as any;
    if (!student) {
      throw new NotFoundError('Student not found');
    }

    // Verify the subject is offered in the student's class
    const classSubject = db.prepare(`
      SELECT cs.*, s.name as subject_name 
      FROM class_subjects cs 
      JOIN subjects s ON cs.subject_id = s.id 
      WHERE cs.class_id = ? AND cs.subject_id = ?
    `).get(student.class_id, subject_id) as any;

    if (!classSubject) {
      throw new ValidationError(`Subject is not offered in ${student.class_name}`);
    }

    // Check if result already exists for this student, subject, and exam type
    const existingResult = db.prepare(`
      SELECT id FROM results 
      WHERE student_id = ? AND subject_id = ? AND exam_type = ?
    `).get(student_id, subject_id, exam_type);

    if (existingResult) {
      // Update existing result
      const updateStmt = db.prepare(`
        UPDATE results 
        SET max_marks = ?, obtained_marks = ?, exam_date = ?
        WHERE student_id = ? AND subject_id = ? AND exam_type = ?
      `);
      updateStmt.run(max_marks, obtained_marks, exam_date, student_id, subject_id, exam_type);
      
      return NextResponse.json({
        success: true,
        message: 'Result updated successfully',
        data: {
          action: 'updated',
          student_name: student.student_id,
          class_name: student.class_name,
          subject_name: classSubject.subject_name,
          exam_type,
          marks: `${obtained_marks}/${max_marks}`
        }
      });
    } else {
      // Insert new result
      const insertStmt = db.prepare(`
        INSERT INTO results (student_id, subject_id, exam_type, max_marks, obtained_marks, exam_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const result = insertStmt.run(student_id, subject_id, exam_type, max_marks, obtained_marks, exam_date);
      
      return NextResponse.json({
        success: true,
        message: 'Result added successfully',
        data: {
          action: 'created',
          result_id: result.lastInsertRowid,
          student_name: student.student_id,
          class_name: student.class_name,
          subject_name: classSubject.subject_name,
          exam_type,
          marks: `${obtained_marks}/${max_marks}`
        }
      });
    }

  } catch (error) {
    logError(error as Error, 'Failed to add/update result');
    return createErrorResponse(error as Error);
  }
}

// Delete result (Principal only)
export async function DELETE(request: NextRequest) {
  try {
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {} as Record<string, string>);
        token = cookies.token;
      }
    }

    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      throw new AuthenticationError('Invalid token');
    }

    if (decoded.role !== 'principal') {
      throw new AuthorizationError('Only principals can delete results');
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      throw new ValidationError('Result ID is required');
    }

    const db = getDatabase();

    // Get the result details before deletion for logging
    const result = db.prepare(`
      SELECT 
        r.*,
        s.name as subject_name,
        st.student_id as roll_number,
        c.name as class_name,
        (u.first_name || ' ' || u.last_name) as student_name
      FROM results r
      JOIN subjects s ON r.subject_id = s.id
      JOIN students st ON r.student_id = st.id
      JOIN users u ON st.user_id = u.id
      JOIN classes c ON st.class_id = c.id
      WHERE r.id = ?
    `).get(id) as any;

    if (!result) {
      throw new NotFoundError('Result not found');
    }

    // Delete the result
    const deleteStmt = db.prepare('DELETE FROM results WHERE id = ?');
    deleteStmt.run(id);

    return NextResponse.json({
      success: true,
      message: 'Result deleted successfully',
      data: {
        deleted_result: {
          student_name: result.student_name,
          roll_number: result.roll_number,
          class_name: result.class_name,
          subject_name: result.subject_name,
          exam_type: result.exam_type,
          marks: `${result.obtained_marks}/${result.max_marks}`
        }
      }
    });

  } catch (error) {
    logError(error as Error, 'Failed to delete result');
    return createErrorResponse(error as Error);
  }
}
