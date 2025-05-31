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

    // Get subjects taught by this teacher
    const subjects = db.prepare(`
      SELECT s.id, s.name, s.code
      FROM subjects s
      JOIN teacher_subjects ts ON s.id = ts.subject_id
      WHERE ts.teacher_id = ?
      ORDER BY s.name
    `).all(teacher.id) as any[];

    return NextResponse.json({ subjects });
  } catch (error) {
    console.error('Teacher subjects API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
