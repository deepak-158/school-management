const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

// Database connection
const dbPath = path.join(__dirname, '..', 'database', 'school.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

async function hashPassword(password) {
  return await bcrypt.hash(password, 12);
}

// Clear existing data (in correct order to avoid foreign key constraints)
function clearDatabase() {
  console.log('Clearing existing data...');
  
  const tables = [
    'attendance',
    'results', 
    'teacher_subjects',
    'timetable',
    'announcements',
    'leave_requests',
    'students',
    'teachers',
    'classes',
    'subjects',
    'users'
  ];
  
  tables.forEach(table => {
    db.prepare(`DELETE FROM ${table}`).run();
  });
  
  // Reset auto-increment counters
  tables.forEach(table => {
    db.prepare(`DELETE FROM sqlite_sequence WHERE name = ?`).run(table);
  });
  
  console.log('Database cleared successfully!');
}

async function seedUsers() {
  console.log('Seeding users...');
  
  const users = [
    // Principal
    {
      username: 'principal',
      email: 'principal@school.edu.in',
      password: 'password123',
      role: 'principal',
      first_name: 'Dr. Rajesh',
      last_name: 'Sharma',
      phone: '+91-9876543210',
      address: 'Principal Quarters, School Campus, Mumbai, Maharashtra',
      date_of_birth: '1970-05-15'
    },
    // Teachers
    {
      username: 'ateacher001',
      email: 'anita.verma@school.edu.in',
      password: 'teacher123',
      role: 'teacher',
      first_name: 'Anita',
      last_name: 'Verma',
      phone: '+91-9876543211',
      address: 'A-101, Teachers Colony, Mumbai, Maharashtra',
      date_of_birth: '1985-08-20'
    },
    {
      username: 'vteacher002',
      email: 'vikram.singh@school.edu.in',
      password: 'teacher123',
      role: 'teacher',
      first_name: 'Vikram',
      last_name: 'Singh',
      phone: '+91-9876543212',
      address: 'B-205, Teachers Colony, Mumbai, Maharashtra',
      date_of_birth: '1982-12-10'
    },
    {
      username: 'pteacher003',
      email: 'priya.patel@school.edu.in',
      password: 'teacher123',
      role: 'teacher',
      first_name: 'Priya',
      last_name: 'Patel',
      phone: '+91-9876543213',
      address: 'C-302, Teachers Colony, Mumbai, Maharashtra',
      date_of_birth: '1988-03-25'
    },
    {
      username: 'rteacher004',
      email: 'ravi.kumar@school.edu.in',
      password: 'teacher123',
      role: 'teacher',
      first_name: 'Ravi',
      last_name: 'Kumar',
      phone: '+91-9876543214',
      address: 'D-105, Teachers Colony, Mumbai, Maharashtra',
      date_of_birth: '1980-07-18'
    },
    {
      username: 'steacher005',
      email: 'sunita.joshi@school.edu.in',
      password: 'teacher123',
      role: 'teacher',
      first_name: 'Sunita',
      last_name: 'Joshi',
      phone: '+91-9876543215',
      address: 'E-201, Teachers Colony, Mumbai, Maharashtra',
      date_of_birth: '1987-11-05'
    },
    // Students
    {
      username: 'astudent001',
      email: 'arjun.reddy@student.school.edu.in',
      password: 'student123',
      role: 'student',
      first_name: 'Arjun',
      last_name: 'Reddy',
      phone: '+91-9876543216',
      address: '123, MG Road, Bandra, Mumbai, Maharashtra',
      date_of_birth: '2008-04-12'
    },
    {
      username: 'pstudent002',
      email: 'priyanka.sharma@student.school.edu.in',
      password: 'student123',
      role: 'student',
      first_name: 'Priyanka',
      last_name: 'Sharma',
      phone: '+91-9876543217',
      address: '456, Hill Road, Bandra, Mumbai, Maharashtra',
      date_of_birth: '2008-09-08'
    },
    {
      username: 'rstudent003',
      email: 'rohit.gupta@student.school.edu.in',
      password: 'student123',
      role: 'student',
      first_name: 'Rohit',
      last_name: 'Gupta',
      phone: '+91-9876543218',
      address: '789, Linking Road, Khar, Mumbai, Maharashtra',
      date_of_birth: '2007-01-22'
    },
    {
      username: 'nstudent004',
      email: 'neha.singh@student.school.edu.in',
      password: 'student123',
      role: 'student',
      first_name: 'Neha',
      last_name: 'Singh',
      phone: '+91-9876543219',
      address: '321, Carter Road, Bandra, Mumbai, Maharashtra',
      date_of_birth: '2007-06-15'
    },
    {
      username: 'astudent005',
      email: 'aditya.jain@student.school.edu.in',
      password: 'student123',
      role: 'student',
      first_name: 'Aditya',
      last_name: 'Jain',
      phone: '+91-9876543220',
      address: '654, SV Road, Santacruz, Mumbai, Maharashtra',
      date_of_birth: '2008-11-30'
    },
    {
      username: 'sstudent006',
      email: 'sneha.iyer@student.school.edu.in',
      password: 'student123',
      role: 'student',
      first_name: 'Sneha',
      last_name: 'Iyer',
      phone: '+91-9876543221',
      address: '987, JP Road, Andheri, Mumbai, Maharashtra',
      date_of_birth: '2008-02-14'
    },
    {
      username: 'kstudent007',
      email: 'karthik.nair@student.school.edu.in',
      password: 'student123',
      role: 'student',
      first_name: 'Karthik',
      last_name: 'Nair',
      phone: '+91-9876543222',
      address: '147, New Link Road, Malad, Mumbai, Maharashtra',
      date_of_birth: '2007-08-03'
    },
    {
      username: 'istudent008',
      email: 'ishita.agarwal@student.school.edu.in',
      password: 'student123',
      role: 'student',
      first_name: 'Ishita',
      last_name: 'Agarwal',
      phone: '+91-9876543223',
      address: '258, Yari Road, Versova, Mumbai, Maharashtra',
      date_of_birth: '2007-12-19'
    },
    {
      username: 'vstudent009',
      email: 'varun.mehta@student.school.edu.in',
      password: 'student123',
      role: 'student',
      first_name: 'Varun',
      last_name: 'Mehta',
      phone: '+91-9876543224',
      address: '369, Oshiwara, Goregaon, Mumbai, Maharashtra',
      date_of_birth: '2008-05-07'
    },
    {
      username: 'astudent010',
      email: 'anjali.das@student.school.edu.in',
      password: 'student123',
      role: 'student',
      first_name: 'Anjali',
      last_name: 'Das',
      phone: '+91-9876543225',
      address: '741, Film City Road, Goregaon, Mumbai, Maharashtra',
      date_of_birth: '2008-10-25'
    }
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone, address, date_of_birth)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const user of users) {
    const hashedPassword = await hashPassword(user.password);
    insertUser.run(
      user.username, user.email, hashedPassword, user.role,
      user.first_name, user.last_name, user.phone, user.address, user.date_of_birth
    );
  }

  console.log(`${users.length} users seeded successfully!`);
}

function seedSubjects() {
  console.log('Seeding subjects...');
  
  const subjects = [
    { name: 'Mathematics', code: 'MATH10', description: 'Advanced Mathematics for Grade 10' },
    { name: 'Physics', code: 'PHY10', description: 'Physics fundamentals and applications' },
    { name: 'Chemistry', code: 'CHEM10', description: 'Basic Chemistry concepts and experiments' },
    { name: 'Biology', code: 'BIO10', description: 'Life Sciences and Biology' },
    { name: 'English Literature', code: 'ENG10', description: 'English Language and Literature' },
    { name: 'Hindi', code: 'HIN10', description: 'Hindi Language and Literature' },
    { name: 'History', code: 'HIST10', description: 'Indian and World History' },
    { name: 'Geography', code: 'GEO10', description: 'Physical and Human Geography' },
    { name: 'Computer Science', code: 'CS10', description: 'Introduction to Computer Science' },
    { name: 'Physical Education', code: 'PE10', description: 'Sports and Physical Fitness' }
  ];

  const insertSubject = db.prepare(`
    INSERT INTO subjects (name, code, description)
    VALUES (?, ?, ?)
  `);

  subjects.forEach(subject => {
    insertSubject.run(subject.name, subject.code, subject.description);
  });

  console.log(`${subjects.length} subjects seeded successfully!`);
}

function seedClasses() {
  console.log('Seeding classes...');
  
  const classes = [
    { name: 'Grade 10-A', grade_level: 10, section: 'A', academic_year: '2024-25', class_teacher_id: 2 }, // Anita Verma
    { name: 'Grade 10-B', grade_level: 10, section: 'B', academic_year: '2024-25', class_teacher_id: 3 }, // Vikram Singh
    { name: 'Grade 9-A', grade_level: 9, section: 'A', academic_year: '2024-25', class_teacher_id: 4 }, // Priya Patel
    { name: 'Grade 9-B', grade_level: 9, section: 'B', academic_year: '2024-25', class_teacher_id: 5 }  // Ravi Kumar
  ];

  const insertClass = db.prepare(`
    INSERT INTO classes (name, grade_level, section, academic_year, class_teacher_id)
    VALUES (?, ?, ?, ?, ?)
  `);

  classes.forEach(cls => {
    insertClass.run(cls.name, cls.grade_level, cls.section, cls.academic_year, cls.class_teacher_id);
  });

  console.log(`${classes.length} classes seeded successfully!`);
}

function seedTeachers() {
  console.log('Seeding teachers...');
  
  const teachers = [
    { user_id: 2, employee_id: 'T001', department: 'Mathematics', qualification: 'M.Sc Mathematics, B.Ed', experience_years: 8, salary: 65000.00, joining_date: '2016-06-15' },
    { user_id: 3, employee_id: 'T002', department: 'Science', qualification: 'M.Sc Physics, B.Ed', experience_years: 12, salary: 70000.00, joining_date: '2012-07-01' },
    { user_id: 4, employee_id: 'T003', department: 'Science', qualification: 'M.Sc Chemistry, B.Ed', experience_years: 6, salary: 62000.00, joining_date: '2018-08-15' },
    { user_id: 5, employee_id: 'T004', department: 'Mathematics', qualification: 'M.Sc Mathematics, M.Ed', experience_years: 15, salary: 75000.00, joining_date: '2009-06-01' },
    { user_id: 6, employee_id: 'T005', department: 'Languages', qualification: 'M.A English, B.Ed', experience_years: 10, salary: 68000.00, joining_date: '2014-07-15' }
  ];

  const insertTeacher = db.prepare(`
    INSERT INTO teachers (user_id, employee_id, department, qualification, experience_years, salary, joining_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  teachers.forEach(teacher => {
    insertTeacher.run(
      teacher.user_id, teacher.employee_id, teacher.department,
      teacher.qualification, teacher.experience_years, teacher.salary, teacher.joining_date
    );
  });

  console.log(`${teachers.length} teachers seeded successfully!`);
}

function seedStudents() {
  console.log('Seeding students...');
  
  const students = [
    // Grade 10-A students
    { user_id: 7, student_id: 'S001', class_id: 1, roll_number: 1, admission_date: '2022-04-01', guardian_name: 'Ramesh Reddy', guardian_phone: '+91-9876543300', guardian_email: 'ramesh.reddy@gmail.com', blood_group: 'O+' },
    { user_id: 8, student_id: 'S002', class_id: 1, roll_number: 2, admission_date: '2022-04-01', guardian_name: 'Suresh Sharma', guardian_phone: '+91-9876543301', guardian_email: 'suresh.sharma@gmail.com', blood_group: 'A+' },
    { user_id: 11, student_id: 'S005', class_id: 1, roll_number: 5, admission_date: '2022-04-01', guardian_name: 'Vinod Jain', guardian_phone: '+91-9876543304', guardian_email: 'vinod.jain@gmail.com', blood_group: 'B+' },
    
    // Grade 10-B students
    { user_id: 12, student_id: 'S006', class_id: 2, roll_number: 1, admission_date: '2022-04-01', guardian_name: 'Sunil Iyer', guardian_phone: '+91-9876543305', guardian_email: 'sunil.iyer@gmail.com', blood_group: 'AB+' },
    { user_id: 16, student_id: 'S010', class_id: 2, roll_number: 10, admission_date: '2022-04-01', guardian_name: 'Prakash Das', guardian_phone: '+91-9876543309', guardian_email: 'prakash.das@gmail.com', blood_group: 'O-' },
    
    // Grade 9-A students
    { user_id: 9, student_id: 'S003', class_id: 3, roll_number: 3, admission_date: '2023-04-01', guardian_name: 'Manoj Gupta', guardian_phone: '+91-9876543302', guardian_email: 'manoj.gupta@gmail.com', blood_group: 'B+' },
    { user_id: 13, student_id: 'S007', class_id: 3, roll_number: 7, admission_date: '2023-04-01', guardian_name: 'Mohan Nair', guardian_phone: '+91-9876543306', guardian_email: 'mohan.nair@gmail.com', blood_group: 'A-' },
    { user_id: 15, student_id: 'S009', class_id: 3, roll_number: 9, admission_date: '2023-04-01', guardian_name: 'Deepak Mehta', guardian_phone: '+91-9876543308', guardian_email: 'deepak.mehta@gmail.com', blood_group: 'O+' },
    
    // Grade 9-B students
    { user_id: 10, student_id: 'S004', class_id: 4, roll_number: 4, admission_date: '2023-04-01', guardian_name: 'Ajay Singh', guardian_phone: '+91-9876543303', guardian_email: 'ajay.singh@gmail.com', blood_group: 'AB-' },
    { user_id: 14, student_id: 'S008', class_id: 4, roll_number: 8, admission_date: '2023-04-01', guardian_name: 'Rajesh Agarwal', guardian_phone: '+91-9876543307', guardian_email: 'rajesh.agarwal@gmail.com', blood_group: 'B-' }
  ];

  const insertStudent = db.prepare(`
    INSERT INTO students (user_id, student_id, class_id, roll_number, admission_date, guardian_name, guardian_phone, guardian_email, blood_group)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  students.forEach(student => {
    insertStudent.run(
      student.user_id, student.student_id, student.class_id, student.roll_number,
      student.admission_date, student.guardian_name, student.guardian_phone, 
      student.guardian_email, student.blood_group
    );
  });

  console.log(`${students.length} students seeded successfully!`);
}

function seedTeacherSubjects() {
  console.log('Seeding teacher-subject assignments...');
  
  const assignments = [
    // Anita Verma (T001) - Mathematics teacher for Grade 10
    { teacher_id: 1, subject_id: 1, class_id: 1 }, // Math for Grade 10-A
    { teacher_id: 1, subject_id: 1, class_id: 2 }, // Math for Grade 10-B
    
    // Vikram Singh (T002) - Physics teacher
    { teacher_id: 2, subject_id: 2, class_id: 1 }, // Physics for Grade 10-A
    { teacher_id: 2, subject_id: 2, class_id: 2 }, // Physics for Grade 10-B
    { teacher_id: 2, subject_id: 2, class_id: 3 }, // Physics for Grade 9-A
    
    // Priya Patel (T003) - Chemistry teacher
    { teacher_id: 3, subject_id: 3, class_id: 1 }, // Chemistry for Grade 10-A
    { teacher_id: 3, subject_id: 3, class_id: 2 }, // Chemistry for Grade 10-B
    { teacher_id: 3, subject_id: 4, class_id: 3 }, // Biology for Grade 9-A
    
    // Ravi Kumar (T004) - Mathematics for Grade 9
    { teacher_id: 4, subject_id: 1, class_id: 3 }, // Math for Grade 9-A
    { teacher_id: 4, subject_id: 1, class_id: 4 }, // Math for Grade 9-B
    
    // Sunita Joshi (T005) - English and Hindi
    { teacher_id: 5, subject_id: 5, class_id: 1 }, // English for Grade 10-A
    { teacher_id: 5, subject_id: 5, class_id: 2 }, // English for Grade 10-B
    { teacher_id: 5, subject_id: 6, class_id: 3 }, // Hindi for Grade 9-A
    { teacher_id: 5, subject_id: 6, class_id: 4 }  // Hindi for Grade 9-B
  ];

  const insertAssignment = db.prepare(`
    INSERT INTO teacher_subjects (teacher_id, subject_id, class_id)
    VALUES (?, ?, ?)
  `);

  assignments.forEach(assignment => {
    insertAssignment.run(assignment.teacher_id, assignment.subject_id, assignment.class_id);
  });

  console.log(`${assignments.length} teacher-subject assignments seeded successfully!`);
}

function seedAttendance() {
  console.log('Seeding attendance data...');
  
  const students = db.prepare('SELECT id, class_id FROM students').all();
  const subjects = db.prepare('SELECT id FROM subjects LIMIT 5').all(); // First 5 subjects
  
  const statuses = ['present', 'present', 'present', 'present', 'absent', 'late']; // More present than absent
  const dates = [];
  
  // Generate last 30 days of attendance
  for (let i = 30; i >= 1; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }

  const insertAttendance = db.prepare(`
    INSERT INTO attendance (student_id, class_id, subject_id, date, status, marked_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  let attendanceCount = 0;
  
  students.forEach(student => {
    dates.forEach(date => {
      subjects.forEach(subject => {
        // Skip weekends (simple check)
        const dayOfWeek = new Date(date).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) return;
        
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const markedBy = 2; // Anita Verma (first teacher)
        
        try {
          insertAttendance.run(student.id, student.class_id, subject.id, date, status, markedBy);
          attendanceCount++;
        } catch (error) {
          // Skip if duplicate entry
        }
      });
    });
  });

  console.log(`${attendanceCount} attendance records seeded successfully!`);
}

function seedTimetable() {
  console.log('Seeding timetable data...');
  
  const timetableEntries = [
    // Grade 10-A (Class ID: 1) - Monday to Friday
    // Monday
    { class_id: 1, subject_id: 1, teacher_id: 1, day_of_week: 1, start_time: '09:00', end_time: '09:45', room_number: 'Room 101' }, // Math
    { class_id: 1, subject_id: 2, teacher_id: 2, day_of_week: 1, start_time: '09:45', end_time: '10:30', room_number: 'Lab 1' }, // Physics
    { class_id: 1, subject_id: 5, teacher_id: 5, day_of_week: 1, start_time: '11:00', end_time: '11:45', room_number: 'Room 101' }, // English
    { class_id: 1, subject_id: 3, teacher_id: 3, day_of_week: 1, start_time: '11:45', end_time: '12:30', room_number: 'Lab 2' }, // Chemistry
    
    // Tuesday
    { class_id: 1, subject_id: 2, teacher_id: 2, day_of_week: 2, start_time: '09:00', end_time: '09:45', room_number: 'Lab 1' }, // Physics
    { class_id: 1, subject_id: 1, teacher_id: 1, day_of_week: 2, start_time: '09:45', end_time: '10:30', room_number: 'Room 101' }, // Math
    { class_id: 1, subject_id: 6, teacher_id: 5, day_of_week: 2, start_time: '11:00', end_time: '11:45', room_number: 'Room 102' }, // Hindi
    { class_id: 1, subject_id: 7, teacher_id: 4, day_of_week: 2, start_time: '11:45', end_time: '12:30', room_number: 'Room 103' }, // History
    
    // Grade 10-B (Class ID: 2) 
    // Monday
    { class_id: 2, subject_id: 2, teacher_id: 2, day_of_week: 1, start_time: '09:00', end_time: '09:45', room_number: 'Lab 1' }, // Physics
    { class_id: 2, subject_id: 1, teacher_id: 1, day_of_week: 1, start_time: '09:45', end_time: '10:30', room_number: 'Room 102' }, // Math
    { class_id: 2, subject_id: 3, teacher_id: 3, day_of_week: 1, start_time: '11:00', end_time: '11:45', room_number: 'Lab 2' }, // Chemistry
    { class_id: 2, subject_id: 5, teacher_id: 5, day_of_week: 1, start_time: '11:45', end_time: '12:30', room_number: 'Room 102' }, // English
    
    // Grade 9-A (Class ID: 3)
    // Monday
    { class_id: 3, subject_id: 1, teacher_id: 4, day_of_week: 1, start_time: '09:00', end_time: '09:45', room_number: 'Room 201' }, // Math
    { class_id: 3, subject_id: 4, teacher_id: 3, day_of_week: 1, start_time: '09:45', end_time: '10:30', room_number: 'Lab 3' }, // Biology
    { class_id: 3, subject_id: 6, teacher_id: 5, day_of_week: 1, start_time: '11:00', end_time: '11:45', room_number: 'Room 201' }, // Hindi
    { class_id: 3, subject_id: 8, teacher_id: 4, day_of_week: 1, start_time: '11:45', end_time: '12:30', room_number: 'Room 201' }, // Geography
    
    // Grade 9-B (Class ID: 4)
    // Monday
    { class_id: 4, subject_id: 1, teacher_id: 4, day_of_week: 1, start_time: '09:00', end_time: '09:45', room_number: 'Room 202' }, // Math
    { class_id: 4, subject_id: 6, teacher_id: 5, day_of_week: 1, start_time: '09:45', end_time: '10:30', room_number: 'Room 202' }, // Hindi
    { class_id: 4, subject_id: 4, teacher_id: 3, day_of_week: 1, start_time: '11:00', end_time: '11:45', room_number: 'Lab 3' }, // Biology
    { class_id: 4, subject_id: 10, teacher_id: 2, day_of_week: 1, start_time: '11:45', end_time: '12:30', room_number: 'Gym' } // PE
  ];

  const insertTimetable = db.prepare(`
    INSERT INTO timetable (class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room_number)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  timetableEntries.forEach(entry => {
    insertTimetable.run(
      entry.class_id, entry.subject_id, entry.teacher_id, entry.day_of_week,
      entry.start_time, entry.end_time, entry.room_number
    );
  });

  console.log(`${timetableEntries.length} timetable entries seeded successfully!`);
}

function seedResults() {
  console.log('Seeding results/marks data...');
  
  const students = db.prepare('SELECT id FROM students').all();
  const subjects = db.prepare('SELECT id FROM subjects LIMIT 6').all(); // First 6 subjects
  
  const examTypes = ['Unit Test 1', 'Unit Test 2', 'Mid Term', 'Final Exam'];
  const maxMarks = [25, 25, 50, 100]; // Corresponding max marks
  
  const insertResult = db.prepare(`
    INSERT INTO results (student_id, subject_id, exam_type, exam_date, max_marks, obtained_marks, grade, teacher_id, academic_year, semester)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let resultsCount = 0;
  
  students.forEach(student => {
    subjects.forEach(subject => {
      examTypes.forEach((examType, index) => {
        const maxMark = maxMarks[index];
        const obtained = Math.floor(Math.random() * (maxMark - maxMark * 0.4) + maxMark * 0.4); // 40% to 100%
        
        let grade = 'F';
        const percentage = (obtained / maxMark) * 100;
        if (percentage >= 90) grade = 'A+';
        else if (percentage >= 80) grade = 'A';
        else if (percentage >= 70) grade = 'B+';
        else if (percentage >= 60) grade = 'B';
        else if (percentage >= 50) grade = 'C';
        else if (percentage >= 40) grade = 'D';
        
        const examDate = new Date();
        examDate.setMonth(examDate.getMonth() - (4 - index)); // Spread exams over months
        
        insertResult.run(
          student.id, subject.id, examType, examDate.toISOString().split('T')[0],
          maxMark, obtained, grade, 2, '2024-25', 'Semester 1'
        );
        resultsCount++;
      });
    });
  });

  console.log(`${resultsCount} result records seeded successfully!`);
}

function seedAnnouncements() {
  console.log('Seeding announcements...');
  
  const announcements = [
    {
      title: 'Annual Sports Day',
      content: 'Annual Sports Day will be held on December 15th, 2024. All students are required to participate. Practice sessions start from next week.',
      author_id: 1, // Principal
      target_audience: 'all',
      priority: 'high'
    },
    {
      title: 'Parent-Teacher Meeting',
      content: 'Parent-Teacher meeting scheduled for all classes on December 8th, 2024 from 10 AM to 4 PM.',
      author_id: 1,
      target_audience: 'all',
      priority: 'high'
    },
    {
      title: 'Mathematics Quiz Competition',
      content: 'Inter-class Mathematics quiz competition for Grade 10 students on December 5th, 2024.',
      author_id: 2, // Anita Verma
      target_audience: 'students',
      priority: 'normal'
    },
    {
      title: 'Science Project Submission',
      content: 'All Grade 9 students must submit their science projects by December 10th, 2024.',
      author_id: 3, // Vikram Singh
      target_audience: 'students',
      priority: 'urgent'
    },
    {
      title: 'Winter Break Notice',
      content: 'School will remain closed from December 25th, 2024 to January 5th, 2025 for winter break.',
      author_id: 1,
      target_audience: 'all',
      priority: 'high'
    }
  ];

  const insertAnnouncement = db.prepare(`
    INSERT INTO announcements (title, content, author_id, target_audience, priority)
    VALUES (?, ?, ?, ?, ?)
  `);

  announcements.forEach(announcement => {
    insertAnnouncement.run(
      announcement.title, announcement.content, announcement.author_id,
      announcement.target_audience, announcement.priority
    );
  });

  console.log(`${announcements.length} announcements seeded successfully!`);
}

function seedLeaveRequests() {
  console.log('Seeding leave requests...');
  
  const leaveRequests = [
    // Student leave requests
    {
      user_id: 7, // Arjun Reddy
      leave_type: 'sick',
      start_date: '2024-12-02',
      end_date: '2024-12-02',
      reason: 'Fever and cold symptoms',
      status: 'approved',
      approved_by: 2, // Class teacher Anita Verma
      approval_date: new Date().toISOString(),
      approval_comments: 'Get well soon. Rest for full recovery.'
    },
    {
      user_id: 9, // Rohit Gupta
      leave_type: 'personal',
      start_date: '2024-12-05',
      end_date: '2024-12-06',
      reason: 'Family wedding ceremony',
      status: 'pending'
    },
    {
      user_id: 12, // Sneha Iyer
      leave_type: 'medical',
      start_date: '2024-12-03',
      end_date: '2024-12-04',
      reason: 'Medical check-up appointment',
      status: 'approved',
      approved_by: 1, // Principal
      approval_date: new Date().toISOString(),
      approval_comments: 'Approved for medical appointment. Submit medical certificate.'
    },
    // Teacher leave requests
    {
      user_id: 3, // Vikram Singh
      leave_type: 'personal',
      start_date: '2024-12-10',
      end_date: '2024-12-11',
      reason: 'Personal work',
      status: 'pending'
    },
    {
      user_id: 4, // Priya Patel
      leave_type: 'sick',
      start_date: '2024-11-28',
      end_date: '2024-11-29',
      reason: 'Viral fever',
      status: 'approved',
      approved_by: 1, // Principal
      approval_date: new Date().toISOString(),
      approval_comments: 'Approved. Take care of your health.'
    }
  ];

  const insertLeave = db.prepare(`
    INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, reason, status, approved_by, approval_date, approval_comments)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  leaveRequests.forEach(leave => {
    insertLeave.run(
      leave.user_id, leave.leave_type, leave.start_date, leave.end_date,
      leave.reason, leave.status, leave.approved_by || null, 
      leave.approval_date || null, leave.approval_comments || null
    );
  });

  console.log(`${leaveRequests.length} leave requests seeded successfully!`);
}

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding with Indian names...');
    
    clearDatabase();
    await seedUsers();
    seedSubjects();
    seedClasses();    seedTeachers();
    seedStudents();
    seedTeacherSubjects();
    seedTimetable();
    seedAttendance();
    seedResults();
    seedAnnouncements();
    seedLeaveRequests();
    
    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`👤 Users: ${db.prepare('SELECT COUNT(*) as count FROM users').get().count}`);
    console.log(`👨‍🏫 Teachers: ${db.prepare('SELECT COUNT(*) as count FROM teachers').get().count}`);
    console.log(`👨‍🎓 Students: ${db.prepare('SELECT COUNT(*) as count FROM students').get().count}`);    console.log(`🏫 Classes: ${db.prepare('SELECT COUNT(*) as count FROM classes').get().count}`);
    console.log(`📚 Subjects: ${db.prepare('SELECT COUNT(*) as count FROM subjects').get().count}`);
    console.log(`🕐 Timetable Entries: ${db.prepare('SELECT COUNT(*) as count FROM timetable').get().count}`);
    console.log(`✅ Attendance Records: ${db.prepare('SELECT COUNT(*) as count FROM attendance').get().count}`);
    console.log(`📝 Result Records: ${db.prepare('SELECT COUNT(*) as count FROM results').get().count}`);
    console.log(`📢 Announcements: ${db.prepare('SELECT COUNT(*) as count FROM announcements').get().count}`);
    console.log(`🏖️ Leave Requests: ${db.prepare('SELECT COUNT(*) as count FROM leave_requests').get().count}`);
    
    console.log('\n🔑 Login Credentials:');
    console.log('Principal: principal / password123');
    console.log('Teachers: ateacher001, vteacher002, pteacher003, rteacher004, steacher005 / teacher123');
    console.log('Students: astudent001, pstudent002, rstudent003, etc. / student123');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    db.close();
  }
}

// Run the seeding
seedDatabase();
