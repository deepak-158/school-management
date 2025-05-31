import { db, initializeDatabase } from '../src/lib/database';
import { createUser } from '../src/lib/auth';

export async function seedDatabase() {
  console.log('Starting database seeding...');

  try {
    // Initialize database first
    initializeDatabase();

    // Temporarily disable foreign key checks
    db.exec('PRAGMA foreign_keys = OFF');

    // Clear existing data to allow reseeding
    console.log('Clearing existing data...');
    db.exec(`
      DELETE FROM leave_requests;
      DELETE FROM announcements;
      DELETE FROM timetable;
      DELETE FROM teacher_subjects;
      DELETE FROM students;
      DELETE FROM teachers;
      DELETE FROM classes;
      DELETE FROM subjects;
      DELETE FROM users;
    `);

    // Create default users
    console.log('Creating default users...');

    // Create principal
    const principal = await createUser({
      username: 'principal',
      email: 'principal@school.edu',
      password: 'principal123',
      role: 'principal',
      first_name: 'John',
      last_name: 'Smith',
      phone: '+1-555-0001',
      address: '123 Main St, City, State 12345'
    });

    // Create sample teachers
    const teacher1 = await createUser({
      username: 'teacher1',
      email: 'sarah.johnson@school.edu',
      password: 'teacher123',
      role: 'teacher',
      first_name: 'Sarah',
      last_name: 'Johnson',
      phone: '+1-555-0002',
      address: '456 Oak Ave, City, State 12345'
    });

    const teacher2 = await createUser({
      username: 'teacher2',
      email: 'mike.wilson@school.edu',
      password: 'teacher123',
      role: 'teacher',
      first_name: 'Mike',
      last_name: 'Wilson',
      phone: '+1-555-0003',
      address: '789 Pine St, City, State 12345'
    });

    // Create sample students
    const student1 = await createUser({
      username: 'student1',
      email: 'alice.brown@school.edu',
      password: 'student123',
      role: 'student',
      first_name: 'Alice',
      last_name: 'Brown',
      phone: '+1-555-0004',
      date_of_birth: '2008-03-15'
    });

    const student2 = await createUser({
      username: 'student2',
      email: 'bob.davis@school.edu',
      password: 'student123',
      role: 'student',
      first_name: 'Bob',
      last_name: 'Davis',
      phone: '+1-555-0005',
      date_of_birth: '2008-07-22'
    });

    // Create subjects
    console.log('Creating subjects...');
    const subjectStmt = db.prepare(`
      INSERT INTO subjects (name, code, description) VALUES (?, ?, ?)
    `);

    const subjects = [
      { name: 'Mathematics', code: 'MATH', description: 'Core mathematics curriculum' },
      { name: 'English', code: 'ENG', description: 'English language and literature' },
      { name: 'Science', code: 'SCI', description: 'General science curriculum' },
      { name: 'History', code: 'HIST', description: 'World and national history' },
      { name: 'Physical Education', code: 'PE', description: 'Physical fitness and sports' }
    ];

    for (const subject of subjects) {
      subjectStmt.run(subject.name, subject.code, subject.description);
    }

    // Create classes
    console.log('Creating classes...');
    const classStmt = db.prepare(`
      INSERT INTO classes (name, grade_level, section, academic_year, class_teacher_id) 
      VALUES (?, ?, ?, ?, ?)
    `);

    const classes = [
      { name: 'Grade 9A', grade_level: 9, section: 'A', academic_year: '2024-2025', class_teacher_id: teacher1.id },
      { name: 'Grade 9B', grade_level: 9, section: 'B', academic_year: '2024-2025', class_teacher_id: teacher2.id },
      { name: 'Grade 10A', grade_level: 10, section: 'A', academic_year: '2024-2025', class_teacher_id: teacher1.id }
    ];

    for (const classData of classes) {
      classStmt.run(classData.name, classData.grade_level, classData.section, classData.academic_year, classData.class_teacher_id);
    }

    // Create teacher records
    console.log('Creating teacher records...');
    const teacherStmt = db.prepare(`
      INSERT INTO teachers (user_id, employee_id, department, qualification, experience_years, joining_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    teacherStmt.run(teacher1.id, 'T001', 'Mathematics', 'M.Ed Mathematics', 8, '2020-08-15');
    teacherStmt.run(teacher2.id, 'T002', 'Science', 'M.Sc Physics', 5, '2022-07-20');    // Create student records
    console.log('Creating student records...');
    const studentStmt = db.prepare(`
      INSERT INTO students (user_id, student_id, class_id, roll_number, admission_date, guardian_name, guardian_phone, guardian_email, blood_group)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Get the first class ID
    const firstClass = db.prepare('SELECT id FROM classes WHERE name = ?').get('Grade 9A') as { id: number };

    studentStmt.run(student1.id, 'S2024001', firstClass.id, 1, '2024-08-01', 'Robert Brown', '+1-555-1001', 'robert.brown@email.com', 'A+');
    studentStmt.run(student2.id, 'S2024002', firstClass.id, 2, '2024-08-01', 'Linda Davis', '+1-555-1002', 'linda.davis@email.com', 'B+');// Create teacher-subject assignments
    console.log('Creating teacher-subject assignments...');
    const teacherSubjectStmt = db.prepare(`
      INSERT INTO teacher_subjects (teacher_id, subject_id, class_id) VALUES (?, ?, ?)
    `);

    // Get teacher record IDs
    const teacher1Record = db.prepare('SELECT id FROM teachers WHERE user_id = ?').get(teacher1.id) as { id: number };
    const teacher2Record = db.prepare('SELECT id FROM teachers WHERE user_id = ?').get(teacher2.id) as { id: number };    // Teacher 1 teaches Math and English to Class 1
    teacherSubjectStmt.run(teacher1Record.id, 1, firstClass.id); // Math
    teacherSubjectStmt.run(teacher1Record.id, 2, firstClass.id); // English

    // Teacher 2 teaches Science to Class 1
    teacherSubjectStmt.run(teacher2Record.id, 3, firstClass.id); // Science

    // Create sample timetable
    console.log('Creating sample timetable...');
    const timetableStmt = db.prepare(`
      INSERT INTO timetable (class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room_number)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);    const timetableEntries = [
      { class_id: firstClass.id, subject_id: 1, teacher_id: teacher1Record.id, day_of_week: 1, start_time: '09:00', end_time: '10:00', room_number: 'Room 101' },
      { class_id: firstClass.id, subject_id: 2, teacher_id: teacher1Record.id, day_of_week: 1, start_time: '10:00', end_time: '11:00', room_number: 'Room 101' },
      { class_id: firstClass.id, subject_id: 3, teacher_id: teacher2Record.id, day_of_week: 1, start_time: '11:15', end_time: '12:15', room_number: 'Lab 1' },
      { class_id: firstClass.id, subject_id: 1, teacher_id: teacher1Record.id, day_of_week: 2, start_time: '09:00', end_time: '10:00', room_number: 'Room 101' },
      { class_id: firstClass.id, subject_id: 3, teacher_id: teacher2Record.id, day_of_week: 2, start_time: '10:00', end_time: '11:00', room_number: 'Lab 1' }
    ];

    for (const entry of timetableEntries) {
      timetableStmt.run(entry.class_id, entry.subject_id, entry.teacher_id, entry.day_of_week, entry.start_time, entry.end_time, entry.room_number);
    }

    // Create sample announcements
    console.log('Creating sample announcements...');
    const announcementStmt = db.prepare(`
      INSERT INTO announcements (title, content, author_id, target_audience, priority, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const announcements = [
      {
        title: 'Welcome to New Academic Year',
        content: 'Welcome students and teachers to the 2024-2025 academic year. We wish you all the best for a successful year ahead.',
        author_id: principal.id,
        target_audience: 'all',
        priority: 'high',
        expires_at: '2025-12-31'
      },
      {
        title: 'Parent-Teacher Meeting',
        content: 'Parent-teacher meeting is scheduled for June 15th, 2025. All parents are requested to attend.',
        author_id: principal.id,
        target_audience: 'students',
        priority: 'normal',
        expires_at: '2025-06-15'
      },
      {
        title: 'Staff Meeting',
        content: 'Monthly staff meeting is scheduled for June 5th at 3:00 PM in the conference room.',
        author_id: principal.id,
        target_audience: 'teachers',
        priority: 'normal',
        expires_at: '2025-06-05'
      }
    ];

    for (const announcement of announcements) {
      announcementStmt.run(
        announcement.title,
        announcement.content,
        announcement.author_id,
        announcement.target_audience,
        announcement.priority,
        announcement.expires_at
      );    }    // Create sample leave requests
    console.log('Creating sample leave requests...');
    const leaveRequestStmt = db.prepare(`
      INSERT INTO leave_requests (
        user_id, leave_type, start_date, end_date, reason, 
        status, created_at, approved_by, approval_date, approval_comments
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const currentDate = new Date().toISOString();
    const futureDate1 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 7 days from now
    const futureDate2 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 14 days from now
    const futureDate3 = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 21 days from now

    const leaveRequests = [
      // Student leave requests
      {
        user_id: student1.id,
        leave_type: 'sick',
        start_date: futureDate1,
        end_date: futureDate1,        reason: 'Fever and cold symptoms',
        status: 'pending',
        created_at: currentDate,
        approved_by: null,
        approval_date: null,
        approval_comments: null
      },
      {
        user_id: student2.id,
        leave_type: 'personal',
        start_date: futureDate2,
        end_date: futureDate2,
        reason: 'Family wedding ceremony',
        status: 'approved',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        approved_by: teacher1.id,
        approval_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        approval_comments: 'Approved for family function. Please catch up on missed lessons.'
      },
      // Teacher leave requests
      {
        user_id: teacher1.id,
        leave_type: 'sick',
        start_date: futureDate3,
        end_date: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 22 days from now
        reason: 'Medical checkup and rest',
        status: 'pending',
        created_at: currentDate,
        approved_by: null,
        approval_date: null,
        approval_comments: null
      },
      {
        user_id: teacher2.id,
        leave_type: 'personal',
        start_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days from now
        end_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 12 days from now
        reason: 'Personal work and family commitment',
        status: 'approved',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        approved_by: principal.id,
        approval_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        approval_comments: 'Approved. Please ensure lesson plans are prepared for substitute teacher.'
      }
    ];

    for (const request of leaveRequests) {
      leaveRequestStmt.run(
        request.user_id,        request.leave_type,
        request.start_date,
        request.end_date,
        request.reason,
        request.status,
        request.created_at,
        request.approved_by,
        request.approval_date,
        request.approval_comments
      );}

    // Re-enable foreign key checks
    db.exec('PRAGMA foreign_keys = ON');

    console.log('Database seeding completed successfully!');
    console.log('\nDefault login credentials:');
    console.log('Principal: username=principal, password=principal123');
    console.log('Teacher: username=teacher1, password=teacher123');
    console.log('Student: username=student1, password=student123');

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}
