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
    if (!decoded || decoded.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDatabase();
    
    // Get teacher ID
    const teacher = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(decoded.userId) as any;
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Get classes taught by this teacher
    const classes = db.prepare(`
      SELECT DISTINCT c.id, c.name, c.section
      FROM classes c
      JOIN class_subjects cs ON c.id = cs.class_id
      JOIN teacher_subjects ts ON cs.subject_id = ts.subject_id
      WHERE ts.teacher_id = ?
      ORDER BY c.name, c.section
    `).all(teacher.id) as any[];

    return NextResponse.json({ classes });
  } catch (error) {
    console.error('Teacher classes API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
