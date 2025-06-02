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
    }    const db = getDatabase();
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('class_id');
    const subjectId = searchParams.get('subject_id');
    const studentId = searchParams.get('student_id');
    const academicYear = searchParams.get('academic_year');
    const includeAll = searchParams.get('include_all') === 'true';
    
    // Enhanced search and filter parameters
    const search = searchParams.get('search');
    const subject = searchParams.get('subject'); // Subject code like 'MATH', 'PHY'
    const examType = searchParams.get('exam_type');
    const grade = searchParams.get('grade');
    const sortBy = searchParams.get('sortBy') || 'exam_date';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = '';
    let params: any[] = [];

    if (decoded.role === 'student') {
      // Students can only see their own results
      const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(decoded.id) as any;
      if (!student) {
        throw new NotFoundError('Student not found');
      }

      let whereClause = 'WHERE r.student_id = ?';      params = [student.id];
      
      if (academicYear) {
        whereClause += ' AND r.academic_year = ?';
        params.push(academicYear);
      }

      query = `
        SELECT          r.id,
          r.student_id,
          r.subject_id,
          r.exam_type,
          r.max_marks,
          r.obtained_marks,
          r.exam_date,
          r.grade,
          r.remarks,
          r.academic_year,
          r.created_at,
          s.name as subject_name,
          s.code as subject_code,
          (u.first_name || ' ' || u.last_name) as student_name,
          st.roll_number,
          COALESCE(tu.first_name || ' ' || tu.last_name, 'Unknown') as teacher_name
        FROM results r
        JOIN subjects s ON r.subject_id = s.id
        JOIN students st ON r.student_id = st.id
        JOIN users u ON st.user_id = u.id
        LEFT JOIN teachers t ON r.teacher_id = t.id
        LEFT JOIN users tu ON t.user_id = tu.id
        ${whereClause}
        ORDER BY r.exam_date DESC, s.name
      `;

    } else if (decoded.role === 'teacher') {
      // Teachers can only see results for their assigned subjects in classes they teach
      const teacher = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(decoded.id) as any;
      if (!teacher) {
        throw new NotFoundError('Teacher not found');
      }      // Get all subject-class combinations this teacher is assigned to
      const teacherAssignments = db.prepare(`
        SELECT DISTINCT ts.subject_id, ts.class_id
        FROM teacher_subjects ts
        WHERE ts.teacher_id = ?
      `).all(teacher.id) as any[];

      if (teacherAssignments.length === 0) {
        throw new AuthorizationError('No class/subject assignments found for this teacher');
      }

      // Build where clause based on teacher's assignments
      const assignmentConditions = teacherAssignments.map(() => '(st.class_id = ? AND r.subject_id = ?)').join(' OR ');
      const assignmentParams: any[] = [];
      teacherAssignments.forEach(assignment => {
        assignmentParams.push(assignment.class_id, assignment.subject_id);
      });

      // Add additional filters
      let additionalFilters = '';
      const additionalParams: any[] = [];

      if (classId) {
        // Verify teacher teaches in this class
        const hasClassAccess = teacherAssignments.some(a => a.class_id == classId);
        if (!hasClassAccess) {
          throw new AuthorizationError('Teacher does not have access to this class');
        }
        additionalFilters += ' AND st.class_id = ?';
        additionalParams.push(classId);
      }

      if (subjectId) {
        // Verify teacher teaches this subject
        const hasSubjectAccess = teacherAssignments.some(a => a.subject_id == subjectId);
        if (!hasSubjectAccess) {
          throw new AuthorizationError('Teacher does not teach this subject');
        }
        additionalFilters += ' AND r.subject_id = ?';
        additionalParams.push(subjectId);
      }

      if (studentId) {
        additionalFilters += ' AND r.student_id = ?';
        additionalParams.push(studentId);
      }
      
      if (academicYear) {
        additionalFilters += ' AND r.academic_year = ?';
        additionalParams.push(academicYear);      }

      query = `
        SELECT 
          r.id,
          r.student_id,
          r.subject_id,
          r.exam_type,
          r.max_marks,
          r.obtained_marks,
          r.exam_date,
          r.grade,
          r.remarks,
          r.academic_year,
          r.created_at,
          s.name as subject_name,
          s.code as subject_code,
          (u.first_name || ' ' || u.last_name) as student_name,
          st.roll_number,
          c.name as class_name,
          COALESCE(tu.first_name || ' ' || tu.last_name, 'Unknown') as teacher_name
        FROM results r
        JOIN subjects s ON r.subject_id = s.id
        JOIN students st ON r.student_id = st.id
        JOIN users u ON st.user_id = u.id
        JOIN classes c ON st.class_id = c.id
        LEFT JOIN teachers t ON r.teacher_id = t.id
        LEFT JOIN users tu ON t.user_id = tu.id
        WHERE (${assignmentConditions})${additionalFilters}
        ORDER BY c.name, st.roll_number, r.exam_date DESC, s.name
      `;

      params = [...assignmentParams, ...additionalParams];    } else if (decoded.role === 'principal') {
      // Principals can see all results with enhanced filtering
      let whereConditions: string[] = [];
      params = []; // Reset params array instead of redeclaring
      
      // If include_all is true and no other filters, get all results
      if (includeAll && !classId && !subjectId && !studentId && !search && !subject && !examType && !grade) {
        // Only apply academic year filter if specified
        if (academicYear) {
          whereConditions.push('r.academic_year = ?');
          params.push(academicYear);
        }
      } else {
        // Legacy filters (for backwards compatibility)
        if (classId) {
          whereConditions.push('st.class_id = ?');
          params.push(classId);
        }
        if (subjectId) {
          whereConditions.push('r.subject_id = ?');
          params.push(subjectId);
        }
        if (studentId) {
          whereConditions.push('r.student_id = ?');
          params.push(studentId);
        }      if (academicYear) {
        whereConditions.push('r.academic_year = ?');
        params.push(academicYear);
      }
        // Enhanced filters
      if (search) {
        whereConditions.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR (u.first_name || \' \' || u.last_name) LIKE ?)');
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }
      
      if (subject) {
        whereConditions.push('s.code = ?');
        params.push(subject);
      }
      
      if (examType) {
        whereConditions.push('r.exam_type = ?');
        params.push(examType);
      }
      
      if (grade) {
        whereConditions.push('r.grade = ?');
        params.push(grade);
      }
      }
      
      const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
        // Determine sort column and order
      const validSortColumns = ['student_name', 'subject_name', 'obtained_marks', 'grade', 'exam_date', 'exam_type'];
      const sortColumn = validSortColumns.includes(sortBy) ? 
        (sortBy === 'student_name' ? '(u.first_name || \' \' || u.last_name)' : 
         sortBy === 'subject_name' ? 's.name' : 
         `r.${sortBy}`) : 'r.exam_date';
      const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

      query = `
        SELECT          r.id,
          r.student_id,
          r.subject_id,
          r.exam_type,
          r.max_marks,
          r.obtained_marks,
          r.exam_date,
          r.grade,
          r.remarks,
          r.academic_year,
          r.created_at,
          s.name as subject_name,
          s.code as subject_code,
          (u.first_name || ' ' || u.last_name) as student_name,
          st.roll_number,
          c.name as class_name,
          COALESCE(tu.first_name || ' ' || tu.last_name, 'Unknown') as teacher_name
        FROM results r
        JOIN subjects s ON r.subject_id = s.id
        JOIN students st ON r.student_id = st.id
        JOIN users u ON st.user_id = u.id
        JOIN classes c ON st.class_id = c.id
        LEFT JOIN teachers t ON r.teacher_id = t.id
        LEFT JOIN users tu ON t.user_id = tu.id
        ${whereClause}
        ORDER BY ${sortColumn} ${order}, c.name, st.roll_number
      `;
    } else {
      throw new AuthorizationError('Unauthorized role');
    }

    const results = db.prepare(query).all(...params) as any[];
    
    // Calculate stats and rankings
    let stats = null;
    
    if (decoded.role === 'student' && results.length > 0) {
      const totalExams = results.length;
      const totalMarks = results.reduce((sum, r) => sum + r.obtained_marks, 0);
      const totalMaxMarks = results.reduce((sum, r) => sum + r.max_marks, 0);
      const averageMarks = totalMaxMarks > 0 ? Math.round((totalMarks / totalMaxMarks) * 100) : 0;
      const percentages = results.map(r => r.max_marks > 0 ? Math.round((r.obtained_marks / r.max_marks) * 100) : 0);
      const highestMarks = Math.max(...percentages);
      const lowestMarks = Math.min(...percentages);
      const totalSubjects = new Set(results.map(r => r.subject_id)).size;
      const passedExams = results.filter(r => {
        const percentage = r.max_marks > 0 ? (r.obtained_marks / r.max_marks) * 100 : 0;
        return percentage >= 35; // Assuming 35% is passing
      }).length;

      // Calculate class ranking
      const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(decoded.id) as any;
      if (student) {        const currentAcademicYear = academicYear || '2024-2025';
        const classRankQuery = `
          SELECT 
            s.id,
            u.first_name || ' ' || u.last_name as student_name,
            s.roll_number,
            AVG(r.obtained_marks * 100.0 / r.max_marks) as avg_percentage,
            COUNT(r.id) as total_exams,
            RANK() OVER (ORDER BY AVG(r.obtained_marks * 100.0 / r.max_marks) DESC) as class_rank
          FROM students s
          JOIN users u ON s.user_id = u.id
          JOIN results r ON s.id = r.student_id
          WHERE s.class_id = ? AND r.academic_year = ?
          GROUP BY s.id
          ORDER BY avg_percentage DESC
        `;
        
        const classRankingResults = db.prepare(classRankQuery).all(student.class_id, currentAcademicYear) as any[];
        const myRanking = classRankingResults.find(rank => rank.id === student.id);
        
        stats = {
          totalExams,
          averageMarks,
          highestMarks,
          lowestMarks,
          totalSubjects,
          passedExams,
          classRank: myRanking?.class_rank || null,
          totalStudentsInClass: classRankingResults.length,
          classPercentile: myRanking ? Math.round(((classRankingResults.length - myRanking.class_rank + 1) / classRankingResults.length) * 100) : null
        };
      }
    }    // For principal role, add comprehensive analytics
    if (decoded.role === 'principal' && results.length > 0) {
      const currentAcademicYear = academicYear || '2024-2025';
      
      // Class-wise performance
      const classPerformance = db.prepare(`
        SELECT 
          c.id,
          c.name as class_name,
          COUNT(DISTINCT s.id) as student_count,
          AVG(r.obtained_marks * 100.0 / r.max_marks) as avg_percentage,
          COUNT(r.id) as total_exams,
          MIN(r.obtained_marks * 100.0 / r.max_marks) as min_percentage,
          MAX(r.obtained_marks * 100.0 / r.max_marks) as max_percentage
        FROM results r
        JOIN students s ON r.student_id = s.id
        JOIN classes c ON s.class_id = c.id
        WHERE r.academic_year = ?
        GROUP BY c.id, c.name
        ORDER BY avg_percentage DESC
      `).all(currentAcademicYear);
        // Subject-wise performance
      const subjectPerformance = db.prepare(`
        SELECT 
          sub.id,
          sub.name as subject_name,
          sub.code,
          AVG(r.obtained_marks * 100.0 / r.max_marks) as avg_percentage,
          COUNT(r.id) as total_exams,
          COUNT(DISTINCT r.student_id) as students_appeared
        FROM results r
        JOIN subjects sub ON r.subject_id = sub.id
        WHERE r.academic_year = ?
        GROUP BY sub.id, sub.name
        ORDER BY avg_percentage DESC
      `).all(currentAcademicYear);
      
      // Top performers across all classes
      const topPerformers = db.prepare(`
        SELECT          u.first_name || ' ' || u.last_name as student_name,
          s.roll_number,
          c.name as class_name,
          AVG(r.obtained_marks * 100.0 / r.max_marks) as avg_percentage,
          COUNT(r.id) as total_exams
        FROM results r
        JOIN students s ON r.student_id = s.id
        JOIN users u ON s.user_id = u.id
        JOIN classes c ON s.class_id = c.id
        WHERE r.academic_year = ?
        GROUP BY s.id
        ORDER BY avg_percentage DESC
        LIMIT 10
      `).all(currentAcademicYear);
      
      stats = {
        totalResults: results.length,
        totalStudents: new Set(results.map(r => r.student_id)).size,
        totalSubjects: new Set(results.map(r => r.subject_id)).size,
        overallAverage: results.length > 0 ? Math.round(results.reduce((sum, r) => sum + (r.obtained_marks / r.max_marks) * 100, 0) / results.length) : 0,
        classPerformance,        subjectPerformance,
        topPerformers
      };
    }
    
    // Execute the query and get all results first
    const allResults = db.prepare(query).all(...params) as any[];
    
    // Apply pagination
    const total = allResults.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedResults = allResults.slice(offset, offset + limit);
    
    // Calculate enhanced analytics for the current page
    let topPerformer = null;
    let classAverage = 0;
    
    if (allResults.length > 0) {
      // Find top performer from all results (not just current page)
      const studentPerformance = allResults.reduce((acc: any, result: any) => {
        const key = result.student_name;
        if (!acc[key]) {
          acc[key] = { name: key, totalMarks: 0, totalMaxMarks: 0, count: 0 };
        }
        acc[key].totalMarks += result.obtained_marks;
        acc[key].totalMaxMarks += result.max_marks;
        acc[key].count++;
        return acc;
      }, {});
      
      const performers = Object.values(studentPerformance).map((p: any) => ({
        name: p.name,
        average: p.totalMaxMarks > 0 ? Number(((p.totalMarks / p.totalMaxMarks) * 100).toFixed(2)) : 0
      }));
      
      topPerformer = performers.reduce((top, current) => 
        current.average > top.average ? current : top, performers[0]
      );
      
      // Calculate class average from all results
      const totalObtained = allResults.reduce((sum, r) => sum + r.obtained_marks, 0);
      const totalMax = allResults.reduce((sum, r) => sum + r.max_marks, 0);
      classAverage = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0;
    }
    
    const response = {
      results: paginatedResults,
      pagination: {
        currentPage: page,
        totalPages,
        total,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      analytics: {
        topPerformer,
        classAverage,
        totalResults: total
      },
      stats
    };
    
    return NextResponse.json(response);

  } catch (error) {
    logError(error as Error, 'Results API GET');
    return createErrorResponse(error as Error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'teacher' && decoded.role !== 'principal')) {
      throw new AuthorizationError('Unauthorized - only teachers and principals can add results');
    }

    const body = await request.json();
    const { results } = body;

    if (!results || !Array.isArray(results) || results.length === 0) {
      throw new ValidationError('Invalid results data - must be a non-empty array');
    }

    const db = getDatabase();
    
    // Verify authorization for teacher role
    if (decoded.role === 'teacher') {
      const teacher = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(decoded.id) as any;
      if (!teacher) {
        throw new NotFoundError('Teacher not found');
      }

      // Verify teacher can add results for these subject-class combinations
      for (const result of results) {
        const studentClass = db.prepare('SELECT class_id FROM students WHERE id = ?').get(result.student_id) as any;
        if (!studentClass) {
          throw new NotFoundError(`Student ${result.student_id} not found`);
        }

        const teacherAssignment = db.prepare(`
          SELECT 1 FROM teacher_subjects ts
          WHERE ts.teacher_id = ? AND ts.subject_id = ? AND ts.class_id = ?
        `).get(teacher.id, result.subject_id, studentClass.class_id);

        if (!teacherAssignment) {
          throw new AuthorizationError(`Unauthorized to add results for this student-subject combination`);
        }
      }
    }

    // Validate results data
    for (const result of results) {
      const validation = validateMarks(result.obtained_marks, result.max_marks);
      if (!validation.isValid) {
        throw new ValidationError(`Invalid marks for student ${result.student_id}: ${validation.error}`);
      }
    }

    // Use transaction for bulk insert/update
    const insertOrUpdate = db.transaction((resultsData: any[]) => {      const insertStmt = db.prepare(`
        INSERT INTO results (student_id, subject_id, exam_type, max_marks, obtained_marks, exam_date, teacher_id, academic_year, grade, remarks)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const updateStmt = db.prepare(`
        UPDATE results 
        SET max_marks = ?, obtained_marks = ?, exam_date = ?, teacher_id = ?, grade = ?, remarks = ?
        WHERE student_id = ? AND subject_id = ? AND exam_type = ? AND academic_year = ?
      `);

      const checkStmt = db.prepare(`
        SELECT id FROM results 
        WHERE student_id = ? AND subject_id = ? AND exam_type = ? AND academic_year = ?
      `);      for (const result of resultsData) {
        const { 
          student_id, 
          subject_id, 
          exam_type, 
          max_marks, 
          obtained_marks, 
          exam_date,
          teacher_id,
          academic_year,
          grade,
          remarks
        } = result;

        // Calculate grade if not provided
        const calculatedGrade = grade || (() => {
          const percentage = (obtained_marks / max_marks) * 100;
          if (percentage >= 90) return 'A+';
          if (percentage >= 80) return 'A';
          if (percentage >= 70) return 'B+';
          if (percentage >= 60) return 'B';
          if (percentage >= 50) return 'C+';
          if (percentage >= 40) return 'C';
          if (percentage >= 35) return 'D';
          return 'F';
        })();        // Check if result already exists
        const existing = checkStmt.get(student_id, subject_id, exam_type, academic_year || '2024-2025');
        
        if (existing) {
          // Update existing result
          updateStmt.run(max_marks, obtained_marks, exam_date, teacher_id || decoded.id, calculatedGrade, remarks, student_id, subject_id, exam_type, academic_year || '2024-2025');
        } else {
          // Insert new result
          insertStmt.run(student_id, subject_id, exam_type, max_marks, obtained_marks, exam_date, teacher_id || decoded.id, academic_year || '2024-2025', calculatedGrade, remarks);
        }
      }
    });

    insertOrUpdate(results);

    return NextResponse.json({ 
      message: 'Results saved successfully',
      count: results.length 
    });

  } catch (error) {
    logError(error as Error, 'Results API POST');
    return createErrorResponse(error as Error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      throw new AuthenticationError('Invalid token');
    }

    const body = await request.json();    const { 
      id, 
      student_id, 
      subject_id, 
      exam_type, 
      max_marks, 
      obtained_marks, 
      exam_date,
      grade,
      remarks,
      academic_year
    } = body;

    if (!id) {
      throw new ValidationError('Result ID is required');
    }

    // Validate marks
    const validation = validateMarks(obtained_marks, max_marks);
    if (!validation.isValid) {
      throw new ValidationError(`Invalid marks: ${validation.error}`);
    }

    const db = getDatabase();

    // Get the existing result to check authorization
    const existingResult = db.prepare('SELECT * FROM results WHERE id = ?').get(id) as any;
    if (!existingResult) {
      throw new NotFoundError('Result not found');
    }

    // Verify authorization
    if (decoded.role === 'teacher') {
      const teacher = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(decoded.id) as any;
      if (!teacher) {
        throw new NotFoundError('Teacher not found');
      }

      // Check if teacher can edit this result
      const studentClass = db.prepare('SELECT class_id FROM students WHERE id = ?').get(student_id || existingResult.student_id) as any;
      if (!studentClass) {
        throw new NotFoundError('Student not found');
      }

      const teacherAssignment = db.prepare(`
        SELECT 1 FROM teacher_subjects ts
        WHERE ts.teacher_id = ? AND ts.subject_id = ? AND ts.class_id = ?
      `).get(teacher.id, subject_id || existingResult.subject_id, studentClass.class_id);

      if (!teacherAssignment) {
        throw new AuthorizationError('Unauthorized to edit this result');
      }
    } else if (decoded.role !== 'principal') {
      throw new AuthorizationError('Only teachers and principals can edit results');
    }

    // Calculate grade if not provided
    const calculatedGrade = grade || (() => {
      const percentage = (obtained_marks / max_marks) * 100;
      if (percentage >= 90) return 'A+';
      if (percentage >= 80) return 'A';
      if (percentage >= 70) return 'B+';
      if (percentage >= 60) return 'B';
      if (percentage >= 50) return 'C+';
      if (percentage >= 40) return 'C';
      if (percentage >= 35) return 'D';
      return 'F';
    })();    const updateResult = db.prepare(`
      UPDATE results 
      SET student_id = ?, subject_id = ?, exam_type = ?, max_marks = ?, obtained_marks = ?, exam_date = ?, grade = ?, remarks = ?, academic_year = ?
      WHERE id = ?
    `).run(
      student_id || existingResult.student_id,
      subject_id || existingResult.subject_id,
      exam_type || existingResult.exam_type,
      max_marks || existingResult.max_marks,
      obtained_marks || existingResult.obtained_marks,
      exam_date || existingResult.exam_date,
      calculatedGrade,
      remarks || existingResult.remarks,
      academic_year || existingResult.academic_year,
      id
    );

    if (updateResult.changes === 0) {
      throw new NotFoundError('Result not found or no changes made');
    }

    return NextResponse.json({ message: 'Result updated successfully' });

  } catch (error) {
    logError(error as Error, 'Results API PUT');
    return createErrorResponse(error as Error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new AuthenticationError('No token provided');
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      throw new AuthenticationError('Invalid token');
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      throw new ValidationError('Result ID is required');
    }

    const db = getDatabase();

    // Get the existing result to check authorization
    const existingResult = db.prepare('SELECT * FROM results WHERE id = ?').get(id) as any;
    if (!existingResult) {
      throw new NotFoundError('Result not found');
    }

    // Verify authorization - only principal can delete results
    if (decoded.role !== 'principal') {
      throw new AuthorizationError('Only principals can delete results');
    }

    const deleteResult = db.prepare('DELETE FROM results WHERE id = ?').run(id);

    if (deleteResult.changes === 0) {
      throw new NotFoundError('Result not found');
    }

    return NextResponse.json({ message: 'Result deleted successfully' });

  } catch (error) {
    logError(error as Error, 'Results API DELETE');
    return createErrorResponse(error as Error);
  }
}
