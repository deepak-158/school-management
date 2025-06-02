import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check both Authorization header and cookies
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.role !== 'teacher' && decoded.role !== 'principal')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDatabase();
    
    let classes = [];

    if (decoded.role === 'principal') {
      // Principal can see all classes
      classes = db.prepare(`
        SELECT id, name, section
        FROM classes
        ORDER BY name, section
      `).all();
    } else {
      // Get teacher ID
      const teacher = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(decoded.id) as any;
      if (!teacher) {
        return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
      }

      // Get classes taught by this teacher using the corrected query
      classes = db.prepare(`
        SELECT DISTINCT c.id, c.name, c.section
        FROM classes c
        JOIN teacher_subjects ts ON c.id = ts.class_id
        WHERE ts.teacher_id = ?
        ORDER BY c.name, c.section
      `).all(teacher.id);
    }

    return NextResponse.json({ classes });
  } catch (error) {
    console.error('Teacher classes API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
