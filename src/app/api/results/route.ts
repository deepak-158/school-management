import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const db = getDatabase();
    const url = new URL(request.url);
    const academicYear = url.searchParams.get('academic_year') || '2024-2025';
    const semester = url.searchParams.get('semester');
    const classId = url.searchParams.get('class_id');
    const subjectId = url.searchParams.get('subject_id');

    let results = [];
    let stats = null;

    switch (decoded.role) {
      case 'student':
        // Students see their own results
        const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(decoded.userId) as any;
        if (!student) {
          return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        let studentQuery = `
          SELECT 
            r.*,
            s.name as subject_name,
            s.code as subject_code,
            u.username as teacher_name
          FROM results r
          JOIN subjects s ON r.subject_id = s.id
          JOIN teachers t ON r.teacher_id = t.id
          JOIN users u ON t.user_id = u.id
          WHERE r.student_id = ? AND r.academic_year = ?
        `;
        const studentParams = [student.id, academicYear];

        if (semester) {
          studentQuery += ' AND r.semester = ?';
          studentParams.push(semester);
        }

        studentQuery += ' ORDER BY r.created_at DESC';

        results = db.prepare(studentQuery).all(...studentParams);

        // Calculate stats for student
        if (results.length > 0) {
          const percentages = results.map((r: any) => 
            r.max_marks > 0 ? Math.round((r.obtained_marks / r.max_marks) * 100) : 0
          );
          
          stats = {
            totalExams: results.length,
            averageMarks: Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length),
            highestMarks: Math.max(...percentages),
            lowestMarks: Math.min(...percentages),
            totalSubjects: new Set(results.map((r: any) => r.subject_id)).size,
            passedExams: results.filter((r: any) => 
              r.max_marks > 0 && (r.obtained_marks / r.max_marks) >= 0.4
            ).length
          };
        } else {
          stats = {
            totalExams: 0,
            averageMarks: 0,
            highestMarks: 0,
            lowestMarks: 0,
            totalSubjects: 0,
            passedExams: 0
          };
        }
        break;

      case 'teacher':
        // Teachers see results for their subjects/classes
        const teacher = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(decoded.userId) as any;
        if (!teacher) {
          return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
        }

        let teacherQuery = `
          SELECT 
            r.*,
            s.name as subject_name,
            s.code as subject_code,
            st.student_id as student_number,
            u.username as student_name,
            c.name as class_name
          FROM results r
          JOIN subjects s ON r.subject_id = s.id
          JOIN students st ON r.student_id = st.id
          JOIN users u ON st.user_id = u.id
          JOIN classes c ON st.class_id = c.id
          WHERE r.teacher_id = ? AND r.academic_year = ?
        `;
        const teacherParams = [teacher.id, academicYear];

        if (semester) {
          teacherQuery += ' AND r.semester = ?';
          teacherParams.push(semester);
        }

        if (classId) {
          teacherQuery += ' AND st.class_id = ?';
          teacherParams.push(classId);
        }

        if (subjectId) {
          teacherQuery += ' AND r.subject_id = ?';
          teacherParams.push(subjectId);
        }

        teacherQuery += ' ORDER BY r.created_at DESC';

        results = db.prepare(teacherQuery).all(...teacherParams);

        // Calculate stats for teacher
        if (results.length > 0) {
          const percentages = results.map((r: any) => 
            r.max_marks > 0 ? Math.round((r.obtained_marks / r.max_marks) * 100) : 0
          );
          
          stats = {
            totalExams: results.length,
            averageMarks: Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length),
            highestMarks: Math.max(...percentages),
            lowestMarks: Math.min(...percentages),
            totalSubjects: new Set(results.map((r: any) => r.subject_id)).size,
            totalStudents: new Set(results.map((r: any) => r.student_id)).size,
            passedExams: results.filter((r: any) => 
              r.max_marks > 0 && (r.obtained_marks / r.max_marks) >= 0.4
            ).length
          };
        } else {
          stats = {
            totalExams: 0,
            averageMarks: 0,
            highestMarks: 0,
            lowestMarks: 0,
            totalSubjects: 0,
            totalStudents: 0,
            passedExams: 0
          };
        }
        break;

      case 'principal':
        // Principal sees all results with filtering options
        let principalQuery = `
          SELECT 
            r.*,
            s.name as subject_name,
            s.code as subject_code,
            st.student_id as student_number,
            u1.username as student_name,
            c.name as class_name,
            u2.username as teacher_name
          FROM results r
          JOIN subjects s ON r.subject_id = s.id
          JOIN students st ON r.student_id = st.id
          JOIN users u1 ON st.user_id = u1.id
          JOIN classes c ON st.class_id = c.id
          JOIN teachers t ON r.teacher_id = t.id
          JOIN users u2 ON t.user_id = u2.id
          WHERE r.academic_year = ?
        `;
        const principalParams = [academicYear];

        if (semester) {
          principalQuery += ' AND r.semester = ?';
          principalParams.push(semester);
        }

        if (classId) {
          principalQuery += ' AND st.class_id = ?';
          principalParams.push(classId);
        }

        if (subjectId) {
          principalQuery += ' AND r.subject_id = ?';
          principalParams.push(subjectId);
        }

        principalQuery += ' ORDER BY r.created_at DESC LIMIT 100';

        results = db.prepare(principalQuery).all(...principalParams);

        // Calculate overall stats
        if (results.length > 0) {
          const percentages = results.map((r: any) => 
            r.max_marks > 0 ? Math.round((r.obtained_marks / r.max_marks) * 100) : 0
          );
          
          stats = {
            totalExams: results.length,
            averageMarks: Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length),
            highestMarks: Math.max(...percentages),
            lowestMarks: Math.min(...percentages),
            totalSubjects: new Set(results.map((r: any) => r.subject_id)).size,
            totalStudents: new Set(results.map((r: any) => r.student_id)).size,
            totalClasses: new Set(results.map((r: any) => r.class_name)).size,
            passedExams: results.filter((r: any) => 
              r.max_marks > 0 && (r.obtained_marks / r.max_marks) >= 0.4
            ).length
          };
        } else {
          stats = {
            totalExams: 0,
            averageMarks: 0,
            highestMarks: 0,
            lowestMarks: 0,
            totalSubjects: 0,
            totalStudents: 0,
            totalClasses: 0,
            passedExams: 0
          };
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    return NextResponse.json({ results, stats });
  } catch (error) {
    console.error('Results API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      student_id,
      subject_id,
      exam_type,
      exam_date,
      max_marks,
      obtained_marks,
      grade,
      remarks,
      academic_year,
      semester
    } = body;

    // Validate required fields
    if (!student_id || !subject_id || !exam_type || !max_marks || obtained_marks === undefined || !academic_year) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getDatabase();
    const teacher = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(decoded.userId) as any;
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Verify teacher teaches this subject
    const teacherSubject = db.prepare(`
      SELECT * FROM teacher_subjects 
      WHERE teacher_id = ? AND subject_id = ?
    `).get(teacher.id, subject_id);

    if (!teacherSubject) {
      return NextResponse.json({ error: 'You are not authorized to enter results for this subject' }, { status: 403 });
    }

    // Insert result
    const result = db.prepare(`
      INSERT INTO results (
        student_id, subject_id, exam_type, exam_date, max_marks, obtained_marks, 
        grade, remarks, teacher_id, academic_year, semester
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      student_id, subject_id, exam_type, exam_date, max_marks, obtained_marks,
      grade, remarks, teacher.id, academic_year, semester
    );

    return NextResponse.json({ 
      message: 'Result added successfully',
      id: result.lastInsertRowid 
    });
  } catch (error) {
    console.error('Add result error:', error);
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
    if (!decoded || decoded.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      id,
      exam_type,
      exam_date,
      max_marks,
      obtained_marks,
      grade,
      remarks
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Result ID is required' }, { status: 400 });
    }

    const db = getDatabase();
    const teacher = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(decoded.userId) as any;
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Verify the result belongs to this teacher
    const existingResult = db.prepare('SELECT * FROM results WHERE id = ? AND teacher_id = ?').get(id, teacher.id);
    if (!existingResult) {
      return NextResponse.json({ error: 'Result not found or unauthorized' }, { status: 404 });
    }

    // Update result
    db.prepare(`
      UPDATE results SET 
        exam_type = COALESCE(?, exam_type),
        exam_date = COALESCE(?, exam_date),
        max_marks = COALESCE(?, max_marks),
        obtained_marks = COALESCE(?, obtained_marks),
        grade = COALESCE(?, grade),
        remarks = COALESCE(?, remarks)
      WHERE id = ?
    `).run(exam_type, exam_date, max_marks, obtained_marks, grade, remarks, id);

    return NextResponse.json({ message: 'Result updated successfully' });
  } catch (error) {
    console.error('Update result error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
