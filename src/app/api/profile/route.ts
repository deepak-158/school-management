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
    }    const db = getDatabase();
    let profile = {};    // Get basic user info
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    profile = {
      username: user.username,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      address: user.address,
      date_of_birth: user.date_of_birth,
    };

    // Get role-specific information
    if (decoded.role === 'student') {
      const student = db.prepare(`
        SELECT s.*, c.name as class_name 
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        WHERE s.user_id = ?
      `).get(decoded.id) as any;

      if (student) {
        profile = {
          ...profile,
          student_id: student.student_id,
          class_name: student.class_name,
          roll_number: student.roll_number,
          admission_date: student.admission_date,
          guardian_name: student.guardian_name,
          guardian_phone: student.guardian_phone,
          guardian_email: student.guardian_email,
          blood_group: student.blood_group,        };
      }
    } else if (decoded.role === 'teacher') {
      const teacher = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(decoded.id) as any;
      
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
          department: teacher.department,
          qualification: teacher.qualification,
          experience_years: teacher.experience_years,
          joining_date: teacher.joining_date,
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
    }    const data = await request.json();
    const db = getDatabase();

    // Update basic user info
    db.prepare(`
      UPDATE users 
      SET first_name = COALESCE(?, first_name),
          last_name = COALESCE(?, last_name),
          phone = COALESCE(?, phone),
          address = COALESCE(?, address),
          date_of_birth = COALESCE(?, date_of_birth),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      data.first_name,      data.last_name, 
      data.phone,
      data.address,
      data.date_of_birth,
      decoded.id
    );    // Update role-specific information
    if (decoded.role === 'student') {
      const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(decoded.id) as any;
      if (student) {
        db.prepare(`
          UPDATE students 
          SET guardian_name = COALESCE(?, guardian_name),
              guardian_phone = COALESCE(?, guardian_phone),
              guardian_email = COALESCE(?, guardian_email),
              blood_group = COALESCE(?, blood_group)
          WHERE user_id = ?
        `).run(
          data.guardian_name,
          data.guardian_phone,
          data.guardian_email,
          data.blood_group,          decoded.id
        );
      }
    } else if (decoded.role === 'teacher') {
      const teacher = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(decoded.id) as any;
      if (teacher) {
        db.prepare(`
          UPDATE teachers 
          SET department = COALESCE(?, department),
              qualification = COALESCE(?, qualification)
          WHERE user_id = ?
        `).run(          data.department,
          data.qualification,
          decoded.id
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
