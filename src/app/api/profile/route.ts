import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const db = getDatabase();
    let profile = {};

    // Get basic user info
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId) as any;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    profile = {
      username: user.username,
      email: user.email,
      role: user.role,
    };

    // Get role-specific information
    if (decoded.role === 'student') {
      const student = db.prepare(`
        SELECT s.*, c.name as class_name 
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE s.user_id = ?
      `).get(decoded.userId) as any;

      if (student) {
        profile = {
          ...profile,
          student_id: student.student_id,
          full_name: student.full_name,
          date_of_birth: student.date_of_birth,
          phone: student.phone,
          address: student.address,
          parent_guardian: student.parent_guardian,
          class_name: student.class_name,
        };
      }
    } else if (decoded.role === 'teacher') {
      const teacher = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(decoded.userId) as any;
      
      if (teacher) {
        // Get subjects taught by teacher
        const subjects = db.prepare(`
          SELECT GROUP_CONCAT(s.name) as subjects
          FROM teacher_subjects ts
          JOIN subjects s ON ts.subject_id = s.id
          WHERE ts.teacher_id = ?
        `).get(teacher.id) as any;

        profile = {
          ...profile,
          employee_id: teacher.employee_id,
          full_name: teacher.full_name,
          phone: teacher.phone,
          address: teacher.address,
          department: teacher.department,
          subjects: subjects?.subjects || 'None assigned',
        };
      }
    }
    // Principal uses basic user info only

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const data = await request.json();
    const db = getDatabase();

    // Update basic user info
    if (data.username || data.email) {
      db.prepare(`
        UPDATE users 
        SET username = COALESCE(?, username),
            email = COALESCE(?, email)
        WHERE id = ?
      `).run(data.username, data.email, decoded.userId);
    }

    // Update role-specific information
    if (decoded.role === 'student') {
      const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(decoded.userId) as any;
      if (student) {
        db.prepare(`
          UPDATE students 
          SET full_name = COALESCE(?, full_name),
              date_of_birth = COALESCE(?, date_of_birth),
              phone = COALESCE(?, phone),
              address = COALESCE(?, address),
              parent_guardian = COALESCE(?, parent_guardian)
          WHERE user_id = ?
        `).run(
          data.full_name,
          data.date_of_birth,
          data.phone,
          data.address,
          data.parent_guardian,
          decoded.userId
        );
      }
    } else if (decoded.role === 'teacher') {
      const teacher = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(decoded.userId) as any;
      if (teacher) {
        db.prepare(`
          UPDATE teachers 
          SET full_name = COALESCE(?, full_name),
              phone = COALESCE(?, phone),
              address = COALESCE(?, address),
              department = COALESCE(?, department)
          WHERE user_id = ?
        `).run(
          data.full_name,
          data.phone,
          data.address,
          data.department,
          decoded.userId
        );
      }
    }

    // Return updated profile
    const response = await GET(request);
    return response;
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
