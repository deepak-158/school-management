import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { verifyToken } from '@/lib/auth';
import { 
  createErrorResponse, 
  logError, 
  AuthenticationError, 
  AuthorizationError 
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

    // Only principals can search all student results
    if (decoded.role !== 'principal') {
      throw new AuthorizationError('Only principals can search student results');
    }    const db = getDatabase();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const academicYear = searchParams.get('academic_year') || '';

    if (!query.trim()) {
      return NextResponse.json({ students: [] });
    }

    // Search for students by name, roll number, or class
    let searchQuery = `
      SELECT DISTINCT
        s.id,
        s.roll_number,
        u.first_name || ' ' || u.last_name as name,
        c.name as class_name,
        s.student_id,
        COUNT(r.id) as total_results
      FROM students s
      JOIN users u ON s.user_id = u.id
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN results r ON s.id = r.student_id
    `;

    let whereConditions = [];
    let params: any[] = [];

    // Add search conditions
    whereConditions.push(`(
      u.first_name LIKE ? OR 
      u.last_name LIKE ? OR 
      (u.first_name || ' ' || u.last_name) LIKE ? OR
      s.roll_number LIKE ? OR
      s.student_id LIKE ? OR
      c.name LIKE ?
    )`);
    
    const searchPattern = `%${query}%`;
    params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);    // Add academic year filter for results
    if (academicYear) {
      whereConditions.push('(r.academic_year = ? OR r.academic_year IS NULL)');
      params.push(academicYear);
    }

    if (whereConditions.length > 0) {
      searchQuery += ' WHERE ' + whereConditions.join(' AND ');
    }

    searchQuery += `
      GROUP BY s.id, s.roll_number, u.first_name, u.last_name, c.name, s.student_id
      ORDER BY u.first_name, u.last_name
      LIMIT 50
    `;

    const students = db.prepare(searchQuery).all(...params) as any[];

    // For each student found, get their recent results    // Flatten results for each student to match frontend expectations
    const allResults: any[] = [];
    
    for (const student of students) {
      let resultsQuery = `
        SELECT 
          r.id,
          r.student_id,
          r.subject_id,
          r.exam_type,
          r.max_marks,
          r.obtained_marks,
          r.exam_date,
          r.grade,
          r.academic_year,
          s.name as subject_name,
          s.code as subject_code,
          ? as student_name,
          ? as class_name
        FROM results r
        JOIN subjects s ON r.subject_id = s.id
        WHERE r.student_id = ?
      `;

      let resultParams = [student.name, student.class_name, student.id];

      if (academicYear) {
        resultsQuery += ' AND r.academic_year = ?';
        resultParams.push(academicYear);
      }

      resultsQuery += ' ORDER BY r.exam_date DESC, s.name LIMIT 20';

      const studentResults = db.prepare(resultsQuery).all(...resultParams) as any[];
      allResults.push(...studentResults);
    }

    return NextResponse.json({ 
      results: allResults,
      totalStudents: students.length,
      totalResults: allResults.length 
    });

  } catch (error) {
    logError(error as Error, 'Results Search API');
    return createErrorResponse(error as Error);
  }
}
