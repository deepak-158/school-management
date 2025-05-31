import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

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

    // Only teachers and principals can mark attendance
    if (!['teacher', 'principal'].includes(decoded.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { attendance } = await request.json();

    if (!attendance || !Array.isArray(attendance)) {
      return NextResponse.json({ error: 'Invalid attendance data' }, { status: 400 });
    }

    const db = getDatabase();
    
    // Start transaction
    const transaction = db.transaction(() => {
      for (const record of attendance) {
        const { student_id, date, status } = record;
        
        // Check if attendance already exists for this student and date
        const existing = db.prepare(`
          SELECT * FROM attendance 
          WHERE student_id = ? AND date = ?
        `).get(student_id, date);

        if (existing) {
          // Update existing attendance
          db.prepare(`
            UPDATE attendance 
            SET status = ?, updated_at = datetime('now')
            WHERE student_id = ? AND date = ?
          `).run(status, student_id, date);
        } else {
          // Insert new attendance record
          db.prepare(`
            INSERT INTO attendance (student_id, date, status, created_at, updated_at)
            VALUES (?, ?, ?, datetime('now'), datetime('now'))
          `).run(student_id, date, status);
        }
      }
    });

    transaction();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bulk attendance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
