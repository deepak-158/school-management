const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

// Create database connection
const db = new Database('school.db');

// Enable foreign key constraints
db.pragma('foreign_keys = ON');

// Create tables
console.log('Creating tables...');

// Users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'principal')),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    date_of_birth DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Students table
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    student_id TEXT UNIQUE NOT NULL,
    class_id INTEGER,
    roll_number TEXT,
    admission_date DATE,
    guardian_name TEXT,
    guardian_phone TEXT,
    guardian_email TEXT,
    blood_group TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE SET NULL
  )
`);

// Teachers table
db.exec(`
  CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    employee_id TEXT UNIQUE NOT NULL,
    qualification TEXT,
    experience_years INTEGER DEFAULT 0,
    subjects TEXT,
    joining_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  )
`);

// Classes table
db.exec(`
  CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    grade TEXT NOT NULL,
    section TEXT NOT NULL,
    class_teacher_id INTEGER,
    room_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_teacher_id) REFERENCES users (id) ON DELETE SET NULL
  )
`);

// Results table
db.exec(`
  CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    exam_type TEXT NOT NULL,
    obtained_marks INTEGER NOT NULL,
    total_marks INTEGER NOT NULL,
    exam_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE
  )
`);

// Attendance table
db.exec(`
  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
    UNIQUE(student_id, date)
  )
`);

// Announcements table
db.exec(`
  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER NOT NULL,
    target_audience TEXT NOT NULL CHECK (target_audience IN ('all', 'students', 'teachers')),
    is_urgent BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE
  )
`);

// Leave requests table
db.exec(`
  CREATE TABLE IF NOT EXISTS leave_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_id INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by INTEGER,
    approved_at DATETIME,
    rejection_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users (id) ON DELETE SET NULL
  )
`);

console.log('Tables created successfully!');

// Create sample data
console.log('Creating sample data...');

async function createSampleData() {
  // Hash password for sample users
  const defaultPassword = await bcrypt.hash('password123', 12);

  // Insert sample users
  const insertUser = db.prepare(`
    INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone, address, date_of_birth)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  // Principal
  const principal = insertUser.run(
    'principal',
    'principal@school.com',
    defaultPassword,
    'principal',
    'John',
    'Admin',
    '+1234567890',
    '123 School Street',
    '1975-05-15'
  );
  const principalId = principal.lastInsertRowid;

  // Teachers
  const teacher1 = insertUser.run(
    'teacher1',
    'teacher1@school.com',
    defaultPassword,
    'teacher',
    'Sarah',
    'Johnson',
    '+1234567891',
    '456 Teacher Ave',
    '1985-08-20'
  );
  const teacher1Id = teacher1.lastInsertRowid;

  const teacher2 = insertUser.run(
    'teacher2',
    'teacher2@school.com',
    defaultPassword,
    'teacher',
    'Michael',
    'Smith',
    '+1234567892',
    '789 Educator Blvd',
    '1980-12-10'
  );
  const teacher2Id = teacher2.lastInsertRowid;

  // Students
  const student1 = insertUser.run(
    'student1',
    'student1@school.com',
    defaultPassword,
    'student',
    'Emily',
    'Davis',
    '+1234567893',
    '321 Student Lane',
    '2008-03-15'
  );
  const student1Id = student1.lastInsertRowid;

  const student2 = insertUser.run(
    'student2',
    'student2@school.com',
    defaultPassword,
    'student',
    'James',
    'Wilson',
    '+1234567894',
    '654 Learner Road',
    '2008-07-22'
  );
  const student2Id = student2.lastInsertRowid;

  // Insert classes
  const insertClass = db.prepare(`
    INSERT INTO classes (name, grade, section, class_teacher_id, room_number)
    VALUES (?, ?, ?, ?, ?)
  `);
  const class1 = insertClass.run('Grade 10-A', '10', 'A', teacher1Id, 'Room 101');
  const class2 = insertClass.run('Grade 10-B', '10', 'B', teacher2Id, 'Room 102');

  // Insert teacher profiles
  const insertTeacher = db.prepare(`
    INSERT INTO teachers (user_id, employee_id, qualification, experience_years, subjects, joining_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertTeacher.run(
    teacher1Id,
    'TCH001',
    'M.Sc in Mathematics',
    10,
    'Mathematics, Physics',
    '2015-06-01'
  );

  insertTeacher.run(
    teacher2Id,
    'TCH002',
    'M.A in English Literature',
    8,
    'English, Literature',
    '2017-08-15'
  );

  // Insert student profiles
  const insertStudent = db.prepare(`
    INSERT INTO students (user_id, student_id, class_id, roll_number, admission_date, guardian_name, guardian_phone, guardian_email, blood_group)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertStudent.run(
    student1Id,
    'STU001',
    class1.lastInsertRowid,
    '001',
    '2023-04-01',
    'Robert Davis',
    '+1234567895',
    'robert.davis@email.com',
    'A+'
  );

  insertStudent.run(
    student2Id,
    'STU002',
    class2.lastInsertRowid,
    '002',
    '2023-04-01',
    'Linda Wilson',
    '+1234567896',
    'linda.wilson@email.com',
    'B+'
  );

  // Insert sample results
  const insertResult = db.prepare(`
    INSERT INTO results (student_id, subject, exam_type, obtained_marks, total_marks, exam_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const studentIds = [1, 2]; // Student IDs from above
  const subjects = ['Mathematics', 'English', 'Science', 'History'];
  const examTypes = ['Mid-term', 'Final'];

  studentIds.forEach(studentId => {
    subjects.forEach(subject => {
      examTypes.forEach(examType => {
        const obtainedMarks = Math.floor(Math.random() * 30) + 70; // 70-100
        insertResult.run(studentId, subject, examType, obtainedMarks, 100, '2024-01-15');
      });
    });
  });

  // Insert sample attendance
  const insertAttendance = db.prepare(`
    INSERT INTO attendance (student_id, date, status)
    VALUES (?, ?, ?)
  `);

  const statuses = ['present', 'absent', 'late'];
  for (let i = 1; i <= 30; i++) {
    const date = new Date(2024, 0, i).toISOString().split('T')[0];
    studentIds.forEach(studentId => {
      const status = Math.random() > 0.1 ? 'present' : (Math.random() > 0.5 ? 'absent' : 'late');
      insertAttendance.run(studentId, date, status);
    });
  }

  // Insert sample announcements
  const insertAnnouncement = db.prepare(`
    INSERT INTO announcements (title, content, author_id, target_audience, is_urgent)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertAnnouncement.run(
    'Welcome to New Academic Year',
    'We welcome all students and staff to the new academic year 2024. Classes will commence from January 15th.',
    principalId,
    'all',
    0
  );

  insertAnnouncement.run(
    'Parent-Teacher Meeting',
    'Parent-teacher meeting is scheduled for February 10th. All parents are requested to attend.',
    principalId,
    'all',
    1
  );

  console.log('Sample data created successfully!');
  console.log('\nDefault login credentials:');
  console.log('Principal: username=principal, password=password123');
  console.log('Teacher 1: username=teacher1, password=password123');
  console.log('Teacher 2: username=teacher2, password=password123');
  console.log('Student 1: username=student1, password=password123');
  console.log('Student 2: username=student2, password=password123');
}

createSampleData().then(() => {
  db.close();
  console.log('\nDatabase initialization completed!');
}).catch(error => {
  console.error('Error creating sample data:', error);
  db.close();
});
