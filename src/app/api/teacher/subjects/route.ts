import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

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
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDatabase();
    
    // Get teacher ID
    const teacher = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(decoded.id) as any;
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }    // Get subjects taught by this teacher with class information
    const subjects = db.prepare(`
      SELECT s.id, s.name, s.code, c.id as class_id, c.name as class_name,
             ts.id as assignment_id
      FROM subjects s
      JOIN teacher_subjects ts ON s.id = ts.subject_id
      JOIN classes c ON ts.class_id = c.id
      WHERE ts.teacher_id = ?
      ORDER BY s.name, c.name
    `).all(teacher.id) as any[];

    return NextResponse.json({ subjects });
  } catch (error) {
    console.error('Teacher subjects API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
