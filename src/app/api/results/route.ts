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

    const db = getDatabase();
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('class_id');
    const subjectId = searchParams.get('subject_id');
    const studentId = searchParams.get('student_id');

    let query = '';
    let params: any[] = [];    if (decoded.role === 'student') {
      // Students can only see their own results
      const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(decoded.userId) as any;
      if (!student) {
        throw new NotFoundError('Student not found');
      }

      query = `
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
          st.name as student_name,
          st.roll_number
        FROM results r
        JOIN subjects s ON r.subject_id = s.id
        JOIN students st ON r.student_id = st.id
        WHERE r.student_id = ?
        ORDER BY r.exam_date DESC, s.name
      `;
      params = [student.id];
    } else if (decoded.role === 'teacher') {
      // Teachers can see results for their classes and subjects
      const teacher = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(decoded.userId) as any;
      if (!teacher) {
        throw new NotFoundError('Teacher not found');
      }

      if (classId && subjectId) {
        // Verify teacher teaches this subject to this class
        const teacherSubject = db.prepare(`
          SELECT 1 FROM teacher_subjects ts
          JOIN class_subjects cs ON ts.subject_id = cs.subject_id
          WHERE ts.teacher_id = ? AND cs.class_id = ? AND ts.subject_id = ?
        `).get(teacher.id, classId, subjectId);

        if (!teacherSubject) {
          throw new AuthorizationError('Unauthorized access to this class/subject');
        }

        query = `
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
            st.name as student_name,
            st.roll_number,
            c.name as class_name
          FROM results r
          JOIN subjects s ON r.subject_id = s.id
          JOIN students st ON r.student_id = st.id
          JOIN classes c ON st.class_id = c.id
          WHERE st.class_id = ? AND r.subject_id = ?
          ORDER BY st.roll_number, r.exam_date DESC
        `;
        params = [classId, subjectId];
      } else {
        // Get all results for classes/subjects teacher teaches
        query = `
          SELECT DISTINCT
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
            st.name as student_name,
            st.roll_number,
            c.name as class_name
          FROM results r
          JOIN subjects s ON r.subject_id = s.id
          JOIN students st ON r.student_id = st.id
          JOIN classes c ON st.class_id = c.id
          JOIN teacher_subjects ts ON s.id = ts.subject_id
          JOIN class_subjects cs ON s.id = cs.subject_id AND st.class_id = cs.class_id
          WHERE ts.teacher_id = ?
          ORDER BY c.name, st.roll_number, s.name, r.exam_date DESC        `;
        params = [teacher.id];
      }
    } else if (decoded.role === 'principal') {
      // Principals can see all results
      let whereClause = '';
      if (classId) {
        whereClause += ' WHERE st.class_id = ?';
        params.push(classId);
      }
      if (subjectId) {
        whereClause += whereClause ? ' AND r.subject_id = ?' : ' WHERE r.subject_id = ?';
        params.push(subjectId);
      }
      if (studentId) {
        whereClause += whereClause ? ' AND r.student_id = ?' : ' WHERE r.student_id = ?';
        params.push(studentId);
      }

      query = `
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
          st.name as student_name,
          st.roll_number,
          c.name as class_name
        FROM results r
        JOIN subjects s ON r.subject_id = s.id
        JOIN students st ON r.student_id = st.id
        JOIN classes c ON st.class_id = c.id
        ${whereClause}
        ORDER BY c.name, st.roll_number, s.name, r.exam_date DESC
      `;
    } else {
      throw new AuthorizationError('Unauthorized role');
    }

    const results = db.prepare(query).all(...params) as any[];
    return NextResponse.json({ results });
  } catch (error) {
    logError(error as Error, 'Results API GET');
    const errorResponse = createErrorResponse(error as Error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'teacher' && decoded.role !== 'principal')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { results } = body;

    if (!results || !Array.isArray(results) || results.length === 0) {
      return NextResponse.json({ error: 'Invalid results data' }, { status: 400 });
    }

    const db = getDatabase();
    
    // Verify authorization for teacher role
    if (decoded.role === 'teacher') {
      const teacher = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(decoded.userId) as any;
      if (!teacher) {
        return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
      }

      // Verify teacher can add results for these subjects
      for (const result of results) {
        const teacherSubject = db.prepare(`
          SELECT 1 FROM teacher_subjects ts
          JOIN students st ON st.id = ?
          JOIN class_subjects cs ON cs.subject_id = ts.subject_id AND cs.class_id = st.class_id
          WHERE ts.teacher_id = ? AND ts.subject_id = ?
        `).get(result.student_id, teacher.id, result.subject_id);

        if (!teacherSubject) {
          return NextResponse.json({ 
            error: `Unauthorized to add results for student ${result.student_id} in subject ${result.subject_id}` 
          }, { status: 403 });
        }
      }
    }

    // Use transaction for bulk insert/update
    const insertOrUpdate = db.transaction((resultsData: any[]) => {
      const insertStmt = db.prepare(`
        INSERT INTO results (student_id, subject_id, exam_type, max_marks, obtained_marks, exam_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      const updateStmt = db.prepare(`
        UPDATE results 
        SET max_marks = ?, obtained_marks = ?, exam_date = ?
        WHERE student_id = ? AND subject_id = ? AND exam_type = ?
      `);

      const checkStmt = db.prepare(`
        SELECT id FROM results 
        WHERE student_id = ? AND subject_id = ? AND exam_type = ?
      `);

      for (const result of resultsData) {
        const { 
          student_id, 
          subject_id, 
          exam_type, 
          max_marks, 
          obtained_marks, 
          exam_date 
        } = result;

        // Check if result already exists
        const existing = checkStmt.get(student_id, subject_id, exam_type);
        
        if (existing) {
          // Update existing result
          updateStmt.run(max_marks, obtained_marks, exam_date, student_id, subject_id, exam_type);
        } else {
          // Insert new result
          insertStmt.run(student_id, subject_id, exam_type, max_marks, obtained_marks, exam_date);
        }
      }
    });

    insertOrUpdate(results);

    return NextResponse.json({ 
      message: 'Results saved successfully',
      count: results.length 
    });
  } catch (error) {
    console.error('Results API POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'teacher' && decoded.role !== 'principal')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      id, 
      student_id, 
      subject_id, 
      exam_type, 
      max_marks, 
      obtained_marks, 
      exam_date 
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Result ID is required' }, { status: 400 });
    }

    const db = getDatabase();

    // Verify authorization for teacher role
    if (decoded.role === 'teacher') {
      const teacher = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(decoded.userId) as any;
      if (!teacher) {
        return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
      }

      // Verify teacher can update this result
      const teacherSubject = db.prepare(`
        SELECT 1 FROM teacher_subjects ts
        JOIN students st ON st.id = ?
        JOIN class_subjects cs ON cs.subject_id = ts.subject_id AND cs.class_id = st.class_id
        WHERE ts.teacher_id = ? AND ts.subject_id = ?
      `).get(student_id, teacher.id, subject_id);

      if (!teacherSubject) {
        return NextResponse.json({ error: 'Unauthorized to update this result' }, { status: 403 });
      }
    }

    const updateResult = db.prepare(`
      UPDATE results 
      SET student_id = ?, subject_id = ?, exam_type = ?, max_marks = ?, obtained_marks = ?, exam_date = ?
      WHERE id = ?
    `).run(student_id, subject_id, exam_type, max_marks, obtained_marks, exam_date, id);

    if (updateResult.changes === 0) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Result updated successfully' });
  } catch (error) {
    console.error('Results API PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
