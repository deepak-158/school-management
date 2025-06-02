// Enhanced Results API with Grand Total Ranking System - Semester Free
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
    const { searchParams } = new URL(request.url);
    const academicYear = searchParams.get('academic_year') || '2024-2025';

    // Grand Total Rankings for all students
    const grandTotalRankings = db.prepare(`
      SELECT 
        s.id,
        u.first_name || ' ' || u.last_name as student_name,
        s.roll_number,
        c.name as class_name,
        SUM(r.obtained_marks) as grand_total,
        SUM(r.max_marks) as total_possible,
        ROUND(SUM(r.obtained_marks) * 100.0 / SUM(r.max_marks), 2) as grand_percentage,
        COUNT(r.id) as total_exams,
        RANK() OVER (ORDER BY SUM(r.obtained_marks) DESC) as overall_rank,
        RANK() OVER (
          PARTITION BY s.class_id 
          ORDER BY SUM(r.obtained_marks) DESC
        ) as class_rank
      FROM students s
      JOIN users u ON s.user_id = u.id
      JOIN classes c ON s.class_id = c.id
      JOIN results r ON s.id = r.student_id
      WHERE r.academic_year = ?
      GROUP BY s.id
      ORDER BY grand_total DESC
    `).all(academicYear);

    // Exam-wise Performance Analysis
    const examWiseAnalysis = db.prepare(`
      SELECT 
        r.exam_type,
        COUNT(DISTINCT r.student_id) as students_appeared,
        COUNT(r.id) as total_results,
        AVG(r.obtained_marks) as avg_marks,
        AVG(r.obtained_marks * 100.0 / r.max_marks) as avg_percentage,
        MIN(r.obtained_marks) as min_marks,
        MAX(r.obtained_marks) as max_marks,
        SUM(CASE WHEN (r.obtained_marks * 100.0 / r.max_marks) >= 90 THEN 1 ELSE 0 END) as a_plus_count,
        SUM(CASE WHEN (r.obtained_marks * 100.0 / r.max_marks) >= 80 THEN 1 ELSE 0 END) as a_count,
        SUM(CASE WHEN (r.obtained_marks * 100.0 / r.max_marks) < 35 THEN 1 ELSE 0 END) as fail_count
      FROM results r
      WHERE r.academic_year = ?
      GROUP BY r.exam_type
      ORDER BY 
        CASE r.exam_type 
          WHEN 'First Term Exam' THEN 1
          WHEN 'Second Term Exam' THEN 2  
          WHEN 'Final Exam' THEN 3
          ELSE 4
        END
    `).all(academicYear);

    // Class-wise Rankings
    const classWiseRankings = db.prepare(`
      SELECT 
        c.id as class_id,
        c.name as class_name,
        COUNT(DISTINCT s.id) as total_students,
        AVG(totals.grand_total) as avg_class_total,
        MAX(totals.grand_total) as highest_total,
        MIN(totals.grand_total) as lowest_total
      FROM classes c
      JOIN students s ON c.id = s.class_id
      JOIN (
        SELECT 
          r.student_id,
          SUM(r.obtained_marks) as grand_total
        FROM results r
        WHERE r.academic_year = ?
        GROUP BY r.student_id
      ) totals ON s.id = totals.student_id
      GROUP BY c.id, c.name
      ORDER BY avg_class_total DESC
    `).all(academicYear);

    // Subject-wise Performance
    const subjectWisePerformance = db.prepare(`
      SELECT 
        sub.id,
        sub.name as subject_name,
        sub.code,
        AVG(r.obtained_marks * 100.0 / r.max_marks) as avg_percentage,
        COUNT(r.id) as total_exams,
        COUNT(DISTINCT r.student_id) as students_appeared,
        MAX(r.obtained_marks) as highest_marks,
        MIN(r.obtained_marks) as lowest_marks
      FROM results r
      JOIN subjects sub ON r.subject_id = sub.id
      WHERE r.academic_year = ?
      GROUP BY sub.id, sub.name
      ORDER BY avg_percentage DESC
    `).all(academicYear);

    // For specific student (if student role)
    let studentSpecificData = null;
    if (decoded.role === 'student') {
      const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(decoded.id) as any;
      if (student) {
        const myRanking = grandTotalRankings.find(r => r.id === student.id);
        
        const myExamWisePerformance = db.prepare(`
          SELECT 
            r.exam_type,
            SUM(r.obtained_marks) as total_obtained,
            SUM(r.max_marks) as total_possible,
            ROUND(SUM(r.obtained_marks) * 100.0 / SUM(r.max_marks), 2) as percentage,
            COUNT(r.id) as subjects_count
          FROM results r
          WHERE r.student_id = ? AND r.academic_year = ?
          GROUP BY r.exam_type
          ORDER BY 
            CASE r.exam_type 
              WHEN 'First Term Exam' THEN 1
              WHEN 'Second Term Exam' THEN 2  
              WHEN 'Final Exam' THEN 3
              ELSE 4
            END
        `).all(student.id, academicYear);

        studentSpecificData = {
          myRanking,
          examWisePerformance: myExamWisePerformance,
          classmates: grandTotalRankings.filter(r => {
            const studentClass = db.prepare('SELECT class_id FROM students WHERE id = ?').get(r.id) as any;
            return studentClass?.class_id === student.class_id;
          }).length
        };
      }
    }

    const response = {
      rankings: {
        grandTotalRankings: grandTotalRankings.slice(0, 20), // Top 20
        examWiseAnalysis,
        classWiseRankings,
        subjectWisePerformance
      },
      examPattern: {
        type: 'Standardized Three-Term System',
        terms: [
          { name: 'First Term Exam', maxMarks: 100, description: '80 Written + 20 Internal' },
          { name: 'Second Term Exam', maxMarks: 100, description: '80 Written + 20 Internal' },
          { name: 'Final Exam', maxMarks: 100, description: '80 Written + 20 Internal' }
        ],
        totalPossiblePerSubject: 300,
        totalSubjects: subjectWisePerformance.length,
        maxGrandTotal: 300 * subjectWisePerformance.length
      },
      academicYear,
      studentSpecificData,
      summary: {
        totalStudents: grandTotalRankings.length,
        totalExamsPerStudent: examWiseAnalysis.reduce((sum, exam) => sum + (exam.total_results / grandTotalRankings.length), 0),
        overallClassAverage: grandTotalRankings.reduce((sum, student) => sum + student.grand_percentage, 0) / grandTotalRankings.length
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Rankings API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
