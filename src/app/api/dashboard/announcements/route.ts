import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Try to get token from cookie first, then from Authorization header
    let token = request.cookies.get('token')?.value;
    
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const db = getDatabase();
      // Get announcements based on user role
    let announcements: any[] = [];
      if (decoded.role === 'principal') {      // Principal sees all announcements
      announcements = db.prepare(`
        SELECT a.*, u.username as author_name, a.target_audience as target_role
        FROM announcements a
        JOIN users u ON a.author_id = u.id
        ORDER BY a.created_at DESC
        LIMIT 10
      `).all();
    } else if (decoded.role === 'teacher') {
      // Teachers see announcements for all or their classes
      const teacher = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(decoded.id) as any;      announcements = db.prepare(`
        SELECT a.*, u.username as author_name, a.target_audience as target_role
        FROM announcements a
        JOIN users u ON a.author_id = u.id
        WHERE a.target_audience IN ('all', 'teacher') 
           OR (a.target_audience = 'class' AND a.target_class_id IN (
             SELECT DISTINCT class_id FROM teacher_subjects WHERE teacher_id = ?
           ))
        ORDER BY a.created_at DESC
        LIMIT 10
      `).all(teacher?.id || 0);} else if (decoded.role === 'student') {
      // Students see announcements for all, students, or their class
      const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(decoded.id) as any;      announcements = db.prepare(`
        SELECT a.*, u.username as author_name, a.target_audience as target_role
        FROM announcements a
        JOIN users u ON a.author_id = u.id
        WHERE a.target_audience IN ('all', 'student') 
           OR (a.target_audience = 'class' AND a.target_class_id = ?)
        ORDER BY a.created_at DESC
        LIMIT 10
      `).all(student?.class_id || 0);
    }

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error('Announcements API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Only teachers and principals can create announcements
    if (!['teacher', 'principal'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { title, content, target_role, target_class_id } = await request.json();

    if (!title || !content || !target_role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }    const db = getDatabase();
    
    const result = db.prepare(`
      INSERT INTO announcements (title, content, author_id, target_audience, target_class_id, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(title, content, decoded.id, target_role, target_class_id || null);

    return NextResponse.json({ 
      success: true, 
      id: result.lastInsertRowid 
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
