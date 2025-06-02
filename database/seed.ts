import { db, initializeDatabase } from '../src/lib/database';
import { createUser } from '../src/lib/auth';

export async function seedDatabase() {
  console.log('🌱 Starting comprehensive database seeding with Indian names...');

  try {
    // Initialize database first
    initializeDatabase();

    // Temporarily disable foreign key checks
    db.exec('PRAGMA foreign_keys = OFF');

    // Clear existing data to allow reseeding
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
      db.exec(`DELETE FROM ${table}`);
    });
    
    // Reset auto-increment counters
    tables.forEach(table => {
      db.exec(`DELETE FROM sqlite_sequence WHERE name = '${table}'`);
    });

    // Create users with Indian names
    console.log('Creating users with Indian names...');

    // Create principal
    const principal = await createUser({
      username: 'principal',
      email: 'principal@vidyalaya.edu.in',
      password: 'password123',
      role: 'principal',
      first_name: 'Dr. Rajesh',
      last_name: 'Sharma',
      phone: '+91-9876543210',
      address: 'Principal Quarters, School Campus, New Delhi, Delhi',
      date_of_birth: '1970-05-15'
    });

    // Create sample teachers
    const teacher1 = await createUser({
      username: 'ateacher001',
      email: 'anita.verma@vidyalaya.edu.in',
      password: 'teacher123',
      role: 'teacher',
      first_name: 'Anita',
      last_name: 'Verma',
      phone: '+91-9876543211',
      address: 'A-101, Teachers Colony, New Delhi, Delhi',
      date_of_birth: '1985-08-20'
    });

    const teacher2 = await createUser({
      username: 'vteacher002',
      email: 'vikram.singh@vidyalaya.edu.in',
      password: 'teacher123',
      role: 'teacher',
      first_name: 'Vikram',
      last_name: 'Singh',
      phone: '+91-9876543212',
      address: 'B-205, Teachers Colony, New Delhi, Delhi',
      date_of_birth: '1982-12-10'
    });

    const teacher3 = await createUser({
      username: 'pteacher003',
      email: 'priya.patel@vidyalaya.edu.in',
      password: 'teacher123',
      role: 'teacher',
      first_name: 'Priya',
      last_name: 'Patel',
      phone: '+91-9876543213',
      address: 'C-302, Teachers Colony, New Delhi, Delhi',
      date_of_birth: '1988-03-25'
    });

    const teacher4 = await createUser({
      username: 'rteacher004',
      email: 'ravi.kumar@vidyalaya.edu.in',
      password: 'teacher123',
      role: 'teacher',
      first_name: 'Ravi',
      last_name: 'Kumar',
      phone: '+91-9876543214',
      address: 'D-105, Teachers Colony, New Delhi, Delhi',
      date_of_birth: '1980-07-18'
    });

    const teacher5 = await createUser({
      username: 'steacher005',
      email: 'sunita.joshi@vidyalaya.edu.in',
      password: 'teacher123',
      role: 'teacher',
      first_name: 'Sunita',
      last_name: 'Joshi',
      phone: '+91-9876543215',
      address: 'E-201, Teachers Colony, New Delhi, Delhi',
      date_of_birth: '1987-11-05'
    });

    // Create sample students with Indian names
    const student1 = await createUser({
      username: 'astudent001',
      email: 'aarav.sharma@student.vidyalaya.edu.in',
      password: 'student123',
      role: 'student',
      first_name: 'Aarav',
      last_name: 'Sharma',
      phone: '+91-9876543216',
      address: '12/A, Lajpat Nagar, New Delhi, Delhi',
      date_of_birth: '2008-03-15'
    });

    const student2 = await createUser({
      username: 'pstudent002',
      email: 'priya.gupta@student.vidyalaya.edu.in',
      password: 'student123',
      role: 'student',
      first_name: 'Priya',
      last_name: 'Gupta',
      phone: '+91-9876543217',
      address: '45/B, Karol Bagh, New Delhi, Delhi',
      date_of_birth: '2008-07-22'
    });

    const student3 = await createUser({
      username: 'vstudent003',
      email: 'vihaan.mehta@student.vidyalaya.edu.in',
      password: 'student123',
      role: 'student',
      first_name: 'Vihaan',
      last_name: 'Mehta',
      phone: '+91-9876543218',
      address: '78/C, Punjabi Bagh, New Delhi, Delhi',
      date_of_birth: '2009-01-10'
    });

    const student4 = await createUser({
      username: 'astudent004',
      email: 'aisha.khan@student.vidyalaya.edu.in',
      password: 'student123',
      role: 'student',
      first_name: 'Aisha',
      last_name: 'Khan',
      phone: '+91-9876543219',
      address: '23/D, Janakpuri, New Delhi, Delhi',
      date_of_birth: '2008-11-05'
    });

    const student5 = await createUser({
      username: 'rstudent005',
      email: 'rudra.patel@student.vidyalaya.edu.in',
      password: 'student123',
      role: 'student',
      first_name: 'Rudra',
      last_name: 'Patel',
      phone: '+91-9876543220',
      address: '67/E, Rohini, New Delhi, Delhi',
      date_of_birth: '2009-04-18'
    });

    const student6 = await createUser({
      username: 'sstudent006',
      email: 'sara.singh@student.vidyalaya.edu.in',
      password: 'student123',
      role: 'student',
      first_name: 'Sara',
      last_name: 'Singh',
      phone: '+91-9876543221',
      address: '89/F, Pitampura, New Delhi, Delhi',
      date_of_birth: '2008-09-12'
    });

    const student7 = await createUser({
      username: 'kstudent007',
      email: 'kabir.joshi@student.vidyalaya.edu.in',
      password: 'student123',
      role: 'student',
      first_name: 'Kabir',
      last_name: 'Joshi',
      phone: '+91-9876543222',
      address: '34/G, Dwarka, New Delhi, Delhi',
      date_of_birth: '2009-06-25'
    });

    const student8 = await createUser({
      username: 'istudent008',
      email: 'ishika.reddy@student.vidyalaya.edu.in',
      password: 'student123',
      role: 'student',
      first_name: 'Ishika',
      last_name: 'Reddy',
      phone: '+91-9876543223',
      address: '56/H, Vasant Kunj, New Delhi, Delhi',
      date_of_birth: '2008-12-08'
    });

    const student9 = await createUser({
      username: 'astudent009',
      email: 'arjun.nair@student.vidyalaya.edu.in',
      password: 'student123',
      role: 'student',
      first_name: 'Arjun',
      last_name: 'Nair',
      phone: '+91-9876543224',
      address: '12/I, Saket, New Delhi, Delhi',
      date_of_birth: '2009-02-14'
    });

    const student10 = await createUser({
      username: 'mstudent010',
      email: 'myra.agarwal@student.vidyalaya.edu.in',
      password: 'student123',
      role: 'student',
      first_name: 'Myra',
      last_name: 'Agarwal',
      phone: '+91-9876543225',
      address: '90/J, Greater Kailash, New Delhi, Delhi',
      date_of_birth: '2008-08-30'
    });

    // Create subjects with Indian curriculum focus
    console.log('Creating subjects...');
    const subjectStmt = db.prepare(`
      INSERT INTO subjects (name, code, description) VALUES (?, ?, ?)
    `);

    const subjects = [
      { name: 'Mathematics', code: 'MATH', description: 'CBSE Mathematics curriculum' },
      { name: 'Physics', code: 'PHY', description: 'CBSE Physics curriculum' },
      { name: 'Chemistry', code: 'CHEM', description: 'CBSE Chemistry curriculum' },
      { name: 'Biology', code: 'BIO', description: 'CBSE Biology curriculum' },
      { name: 'English', code: 'ENG', description: 'English language and literature' },
      { name: 'Hindi', code: 'HIN', description: 'Hindi language and literature' },
      { name: 'History', code: 'HIST', description: 'Indian and world history' },
      { name: 'Geography', code: 'GEO', description: 'Physical and human geography' },
      { name: 'Computer Science', code: 'CS', description: 'Programming and computer fundamentals' },
      { name: 'Physical Education', code: 'PE', description: 'Physical fitness and sports' }
    ];

    const subjectMap = new Map();
    for (const subject of subjects) {
      const result = subjectStmt.run(subject.name, subject.code, subject.description);
      subjectMap.set(subject.code, result.lastInsertRowid);
    }

    // Create classes with class teachers
    console.log('Creating classes...');
    const classStmt = db.prepare(`
      INSERT INTO classes (name, grade_level, section, academic_year, class_teacher_id) 
      VALUES (?, ?, ?, ?, ?)
    `);

    const classes = [
      { name: 'Grade 10-A', grade_level: 10, section: 'A', academic_year: '2024-2025', class_teacher_id: teacher1.id },
      { name: 'Grade 10-B', grade_level: 10, section: 'B', academic_year: '2024-2025', class_teacher_id: teacher2.id },
      { name: 'Grade 9-A', grade_level: 9, section: 'A', academic_year: '2024-2025', class_teacher_id: teacher3.id },
      { name: 'Grade 9-B', grade_level: 9, section: 'B', academic_year: '2024-2025', class_teacher_id: teacher4.id }
    ];

    const classMap = new Map();
    for (const classData of classes) {
      const result = classStmt.run(classData.name, classData.grade_level, classData.section, classData.academic_year, classData.class_teacher_id);
      classMap.set(classData.name, result.lastInsertRowid);
    }

    // Create teacher records with Indian qualifications
    console.log('Creating teacher records...');
    const teacherStmt = db.prepare(`
      INSERT INTO teachers (user_id, employee_id, department, qualification, experience_years, joining_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const teacherData = [
      { user_id: teacher1.id, employee_id: 'T001', department: 'Mathematics', qualification: 'M.Sc Mathematics, B.Ed', experience_years: 8, joining_date: '2020-08-15' },
      { user_id: teacher2.id, employee_id: 'T002', department: 'Physics', qualification: 'M.Sc Physics, B.Ed', experience_years: 5, joining_date: '2022-07-20' },
      { user_id: teacher3.id, employee_id: 'T003', department: 'Chemistry', qualification: 'M.Sc Chemistry, B.Ed', experience_years: 6, joining_date: '2021-06-10' },
      { user_id: teacher4.id, employee_id: 'T004', department: 'Biology', qualification: 'M.Sc Biology, B.Ed', experience_years: 12, joining_date: '2016-08-01' },
      { user_id: teacher5.id, employee_id: 'T005', department: 'English', qualification: 'M.A English, B.Ed', experience_years: 9, joining_date: '2019-07-15' }
    ];

    const teacherRecordMap = new Map();
    for (const teacher of teacherData) {
      const result = teacherStmt.run(teacher.user_id, teacher.employee_id, teacher.department, teacher.qualification, teacher.experience_years, teacher.joining_date);
      teacherRecordMap.set(teacher.user_id, result.lastInsertRowid);
    }

    // Create student records with Indian guardian information
    console.log('Creating student records...');
    const studentStmt = db.prepare(`
      INSERT INTO students (user_id, student_id, class_id, roll_number, admission_date, guardian_name, guardian_phone, guardian_email, blood_group)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const studentData = [
      { user: student1, student_id: 'S2024001', class: 'Grade 10-A', roll_number: 1, guardian_name: 'Rajesh Sharma', guardian_phone: '+91-9876543301', guardian_email: 'rajesh.sharma@email.com', blood_group: 'A+' },
      { user: student2, student_id: 'S2024002', class: 'Grade 10-A', roll_number: 2, guardian_name: 'Suresh Gupta', guardian_phone: '+91-9876543302', guardian_email: 'suresh.gupta@email.com', blood_group: 'B+' },
      { user: student3, student_id: 'S2024003', class: 'Grade 9-A', roll_number: 1, guardian_name: 'Ramesh Mehta', guardian_phone: '+91-9876543303', guardian_email: 'ramesh.mehta@email.com', blood_group: 'O+' },
      { user: student4, student_id: 'S2024004', class: 'Grade 10-B', roll_number: 1, guardian_name: 'Mohd. Ali Khan', guardian_phone: '+91-9876543304', guardian_email: 'ali.khan@email.com', blood_group: 'AB+' },
      { user: student5, student_id: 'S2024005', class: 'Grade 9-A', roll_number: 2, guardian_name: 'Dinesh Patel', guardian_phone: '+91-9876543305', guardian_email: 'dinesh.patel@email.com', blood_group: 'A-' },
      { user: student6, student_id: 'S2024006', class: 'Grade 10-B', roll_number: 2, guardian_name: 'Harpreet Singh', guardian_phone: '+91-9876543306', guardian_email: 'harpreet.singh@email.com', blood_group: 'B-' },
      { user: student7, student_id: 'S2024007', class: 'Grade 9-B', roll_number: 1, guardian_name: 'Manoj Joshi', guardian_phone: '+91-9876543307', guardian_email: 'manoj.joshi@email.com', blood_group: 'O-' },
      { user: student8, student_id: 'S2024008', class: 'Grade 10-A', roll_number: 3, guardian_name: 'Krishna Reddy', guardian_phone: '+91-9876543308', guardian_email: 'krishna.reddy@email.com', blood_group: 'AB-' },
      { user: student9, student_id: 'S2024009', class: 'Grade 9-B', roll_number: 2, guardian_name: 'Ravi Nair', guardian_phone: '+91-9876543309', guardian_email: 'ravi.nair@email.com', blood_group: 'A+' },
      { user: student10, student_id: 'S2024010', class: 'Grade 10-B', roll_number: 3, guardian_name: 'Vinod Agarwal', guardian_phone: '+91-9876543310', guardian_email: 'vinod.agarwal@email.com', blood_group: 'B+' }
    ];

    for (const student of studentData) {
      studentStmt.run(
        student.user.id, 
        student.student_id, 
        classMap.get(student.class), 
        student.roll_number, 
        '2024-08-01', 
        student.guardian_name, 
        student.guardian_phone, 
        student.guardian_email, 
        student.blood_group
      );
    }

    // Create teacher-subject assignments
    console.log('Creating teacher-subject assignments...');
    const teacherSubjectStmt = db.prepare(`
      INSERT INTO teacher_subjects (teacher_id, subject_id, class_id) VALUES (?, ?, ?)
    `);

    const teacherSubjectAssignments = [
      // Anita Verma (Mathematics) - teaches Mathematics to all classes
      { teacher_user_id: teacher1.id, subject: 'MATH', class: 'Grade 10-A' },
      { teacher_user_id: teacher1.id, subject: 'MATH', class: 'Grade 10-B' },
      { teacher_user_id: teacher1.id, subject: 'MATH', class: 'Grade 9-A' },
      
      // Vikram Singh (Physics) - teaches Physics to all classes
      { teacher_user_id: teacher2.id, subject: 'PHY', class: 'Grade 10-A' },
      { teacher_user_id: teacher2.id, subject: 'PHY', class: 'Grade 10-B' },
      { teacher_user_id: teacher2.id, subject: 'PHY', class: 'Grade 9-A' },
      
      // Priya Patel (Chemistry) - teaches Chemistry to all classes
      { teacher_user_id: teacher3.id, subject: 'CHEM', class: 'Grade 10-A' },
      { teacher_user_id: teacher3.id, subject: 'CHEM', class: 'Grade 10-B' },
      { teacher_user_id: teacher3.id, subject: 'CHEM', class: 'Grade 9-A' },
      
      // Ravi Kumar (Biology) - teaches Biology to all classes
      { teacher_user_id: teacher4.id, subject: 'BIO', class: 'Grade 10-A' },
      { teacher_user_id: teacher4.id, subject: 'BIO', class: 'Grade 10-B' },
      { teacher_user_id: teacher4.id, subject: 'BIO', class: 'Grade 9-A' },
      
      // Sunita Joshi (English) - teaches English to all classes
      { teacher_user_id: teacher5.id, subject: 'ENG', class: 'Grade 10-A' },
      { teacher_user_id: teacher5.id, subject: 'ENG', class: 'Grade 10-B' },
      { teacher_user_id: teacher5.id, subject: 'ENG', class: 'Grade 9-A' }
    ];

    for (const assignment of teacherSubjectAssignments) {
      teacherSubjectStmt.run(
        teacherRecordMap.get(assignment.teacher_user_id),
        subjectMap.get(assignment.subject),
        classMap.get(assignment.class)
      );
    }

    // Create comprehensive timetable for Monday
    console.log('Creating sample timetable...');
    const timetableStmt = db.prepare(`
      INSERT INTO timetable (class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room_number)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const timetableEntries = [
      // Grade 10-A Monday schedule
      { class: 'Grade 10-A', subject: 'MATH', teacher_user_id: teacher1.id, day_of_week: 1, start_time: '09:00', end_time: '09:45', room_number: 'Room 101' },
      { class: 'Grade 10-A', subject: 'PHY', teacher_user_id: teacher2.id, day_of_week: 1, start_time: '09:45', end_time: '10:30', room_number: 'Physics Lab' },
      { class: 'Grade 10-A', subject: 'CHEM', teacher_user_id: teacher3.id, day_of_week: 1, start_time: '10:45', end_time: '11:30', room_number: 'Chemistry Lab' },
      { class: 'Grade 10-A', subject: 'BIO', teacher_user_id: teacher4.id, day_of_week: 1, start_time: '11:30', end_time: '12:15', room_number: 'Biology Lab' },
      { class: 'Grade 10-A', subject: 'ENG', teacher_user_id: teacher5.id, day_of_week: 1, start_time: '13:00', end_time: '13:45', room_number: 'Room 101' },
      
      // Grade 10-B Monday schedule
      { class: 'Grade 10-B', subject: 'ENG', teacher_user_id: teacher5.id, day_of_week: 1, start_time: '09:00', end_time: '09:45', room_number: 'Room 102' },
      { class: 'Grade 10-B', subject: 'MATH', teacher_user_id: teacher1.id, day_of_week: 1, start_time: '09:45', end_time: '10:30', room_number: 'Room 102' },
      { class: 'Grade 10-B', subject: 'PHY', teacher_user_id: teacher2.id, day_of_week: 1, start_time: '10:45', end_time: '11:30', room_number: 'Physics Lab' },
      { class: 'Grade 10-B', subject: 'CHEM', teacher_user_id: teacher3.id, day_of_week: 1, start_time: '11:30', end_time: '12:15', room_number: 'Chemistry Lab' },
      { class: 'Grade 10-B', subject: 'BIO', teacher_user_id: teacher4.id, day_of_week: 1, start_time: '13:00', end_time: '13:45', room_number: 'Biology Lab' },
      
      // Grade 9-A Monday schedule
      { class: 'Grade 9-A', subject: 'BIO', teacher_user_id: teacher4.id, day_of_week: 1, start_time: '09:00', end_time: '09:45', room_number: 'Room 201' },
      { class: 'Grade 9-A', subject: 'ENG', teacher_user_id: teacher5.id, day_of_week: 1, start_time: '09:45', end_time: '10:30', room_number: 'Room 201' },
      { class: 'Grade 9-A', subject: 'MATH', teacher_user_id: teacher1.id, day_of_week: 1, start_time: '10:45', end_time: '11:30', room_number: 'Room 201' },
      { class: 'Grade 9-A', subject: 'PHY', teacher_user_id: teacher2.id, day_of_week: 1, start_time: '11:30', end_time: '12:15', room_number: 'Physics Lab' },
      { class: 'Grade 9-A', subject: 'CHEM', teacher_user_id: teacher3.id, day_of_week: 1, start_time: '13:00', end_time: '13:45', room_number: 'Chemistry Lab' },
      
      // Grade 9-B Monday schedule
      { class: 'Grade 9-B', subject: 'CHEM', teacher_user_id: teacher3.id, day_of_week: 1, start_time: '09:00', end_time: '09:45', room_number: 'Room 202' },
      { class: 'Grade 9-B', subject: 'BIO', teacher_user_id: teacher4.id, day_of_week: 1, start_time: '09:45', end_time: '10:30', room_number: 'Room 202' },
      { class: 'Grade 9-B', subject: 'ENG', teacher_user_id: teacher5.id, day_of_week: 1, start_time: '10:45', end_time: '11:30', room_number: 'Room 202' },
      { class: 'Grade 9-B', subject: 'MATH', teacher_user_id: teacher1.id, day_of_week: 1, start_time: '11:30', end_time: '12:15', room_number: 'Room 202' },
      { class: 'Grade 9-B', subject: 'PHY', teacher_user_id: teacher2.id, day_of_week: 1, start_time: '13:00', end_time: '13:45', room_number: 'Physics Lab' }
    ];

    for (const entry of timetableEntries) {
      timetableStmt.run(
        classMap.get(entry.class),
        subjectMap.get(entry.subject),
        teacherRecordMap.get(entry.teacher_user_id),
        entry.day_of_week,
        entry.start_time,
        entry.end_time,
        entry.room_number
      );    }

    // Create comprehensive attendance records (30 days)
    console.log('Creating attendance records...');
    const attendanceStmt = db.prepare(`
      INSERT INTO attendance (student_id, class_id, subject_id, date, status, marked_by, notes) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const students = [student1, student2, student3, student4, student5, student6, student7, student8, student9, student10];
    const attendanceSubjects = ['MATH', 'PHY', 'CHEM', 'BIO', 'ENG'];
    
    // Generate 30 days of attendance
    for (let day = 0; day < 30; day++) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      const dateStr = date.toISOString().split('T')[0];
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      for (const student of students) {
        // Get student's class from studentData array
        const studentRecord = studentData.find(s => s.user.id === student.id);
        if (!studentRecord) continue;
          const studentClassId = classMap.get(studentRecord.class);
        
        // Get the student's database ID
        const studentDbRecord = db.prepare('SELECT id FROM students WHERE user_id = ?').get(student.id) as { id: number } | undefined;
        if (!studentDbRecord) continue;
        
        for (const subjectCode of attendanceSubjects) {
          // 85% attendance rate with some random absences
          const isPresent = Math.random() > 0.15;
          const status = isPresent ? 'present' : (Math.random() > 0.7 ? 'absent' : 'late');
          const notes = status === 'absent' ? 'Informed absence' : (status === 'late' ? 'Traffic delay' : null);
          
          attendanceStmt.run(
            studentDbRecord.id,
            studentClassId,
            subjectMap.get(subjectCode),
            dateStr,
            status,
            principal.id, // marked by principal for demo
            notes
          );        }
      }
    }// Create comprehensive results/marks    console.log('Creating student results...');
    const resultStmt = db.prepare(`
      INSERT INTO results (student_id, subject_id, exam_type, max_marks, obtained_marks, grade, exam_date, remarks, teacher_id, academic_year)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const examTypes = ['Unit Test 1', 'Unit Test 2', 'Mid Term', 'Final Term'];
    const resultSubjects = ['MATH', 'PHY', 'CHEM', 'BIO', 'ENG', 'HIN'];
      for (const student of students) {
      // Get the student's database ID
      const studentDbRecord = db.prepare('SELECT id FROM students WHERE user_id = ?').get(student.id) as { id: number } | undefined;
      if (!studentDbRecord) continue;
      
      for (const examType of examTypes) {
        for (const subjectCode of resultSubjects) {
          // Generate realistic marks (60-95% range mostly)
          const maxMarks = 100;
          const obtainedMarks = Math.floor(Math.random() * 35) + 60; // 60-95 range
          let grade = 'F';
          
          if (obtainedMarks >= 90) grade = 'A+';
          else if (obtainedMarks >= 80) grade = 'A';
          else if (obtainedMarks >= 70) grade = 'B+';
          else if (obtainedMarks >= 60) grade = 'B';
          else if (obtainedMarks >= 50) grade = 'C';
          else if (obtainedMarks >= 40) grade = 'D';
          
          const examDate = new Date();
          examDate.setDate(examDate.getDate() - Math.floor(Math.random() * 90)); // Random date in last 3 months
          
          const remarks = grade === 'A+' ? 'Excellent performance' : (grade === 'D' ? 'Needs improvement' : null);
            resultStmt.run(
            studentDbRecord.id,
            subjectMap.get(subjectCode),
            examType,
            maxMarks,
            obtainedMarks,
            grade,
            examDate.toISOString().split('T')[0],
            remarks,
            teacherRecordMap.get(teacher1.id), // Use first teacher as examiner
            '2024-2025'
          );
        }
      }
    }

    // Create sample announcements
    console.log('Creating sample announcements...');
    const announcementStmt = db.prepare(`
      INSERT INTO announcements (title, content, author_id, target_audience, priority, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const announcements = [
      {
        title: 'Welcome to New Academic Year 2024-25',
        content: 'Welcome students and teachers to the 2024-2025 academic year. We wish you all the best for a successful year ahead. Classes will commence from August 1st, 2024.',
        author_id: principal.id,
        target_audience: 'all',
        priority: 'high',
        expires_at: '2025-12-31'
      },
      {
        title: 'Parent-Teacher Meeting',
        content: 'Parent-teacher meeting is scheduled for January 15th, 2025. All parents are requested to attend and discuss their ward\'s progress with respective subject teachers.',
        author_id: principal.id,
        target_audience: 'students',
        priority: 'normal',
        expires_at: '2025-01-15'
      },
      {
        title: 'Annual Sports Day 2024',
        content: 'Annual Sports Day will be held on December 20th, 2024. Students are encouraged to participate in various sports events. Registration starts from December 1st.',
        author_id: principal.id,
        target_audience: 'students',
        priority: 'normal',
        expires_at: '2024-12-20'
      },
      {
        title: 'Staff Development Workshop',
        content: 'Monthly staff development workshop is scheduled for December 15th at 2:00 PM in the conference room. All teaching staff must attend.',
        author_id: principal.id,
        target_audience: 'teachers',
        priority: 'high',
        expires_at: '2024-12-15'
      },
      {
        title: 'Winter Break Notice',
        content: 'Winter break will be from December 25th, 2024 to January 2nd, 2025. School will reopen on January 3rd, 2025. Have a wonderful holiday!',
        author_id: principal.id,
        target_audience: 'all',
        priority: 'normal',
        expires_at: '2025-01-03'
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
      );
    }

    // Create sample leave requests
    console.log('Creating sample leave requests...');    const leaveRequestStmt = db.prepare(`
      INSERT INTO leave_requests (
        user_id, leave_type, start_date, end_date, reason, 
        status, created_at, approved_by, approved_at, approver_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const currentDate = new Date().toISOString();
    const futureDate1 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const futureDate2 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const futureDate3 = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];    const leaveRequests = [
      // Student leave requests
      {
        user_id: student1.id,
        leave_type: 'sick',
        start_date: futureDate1,
        end_date: futureDate1,
        reason: 'Fever and cold symptoms',
        status: 'pending',
        created_at: currentDate,
        approved_by: null,
        approved_at: null,
        approver_notes: null
      },
      {
        user_id: student2.id,
        leave_type: 'personal',
        start_date: futureDate2,
        end_date: futureDate2,
        reason: 'Family wedding ceremony',
        status: 'approved',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        approved_by: teacher1.id, // Class teacher approval
        approved_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        approver_notes: 'Approved for family function. Please catch up on missed lessons.'
      },
      {
        user_id: student3.id,
        leave_type: 'personal',
        start_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reason: 'Medical appointment',
        status: 'approved',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        approved_by: principal.id, // Principal approval
        approved_at: currentDate,
        approver_notes: 'Approved. Medical appointments are important.'
      },
      // Teacher leave requests
      {
        user_id: teacher2.id,
        leave_type: 'sick',
        start_date: futureDate3,
        end_date: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reason: 'Medical checkup and rest',
        status: 'pending',
        created_at: currentDate,
        approved_by: null,
        approved_at: null,
        approver_notes: null
      },
      {
        user_id: teacher3.id,
        leave_type: 'personal',
        start_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reason: 'Personal work and family commitment',
        status: 'approved',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        approved_by: principal.id, // Principal approves teacher leaves
        approved_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        approver_notes: 'Approved. Please ensure lesson plans are prepared for substitute teacher.'
      }
    ];    for (const request of leaveRequests) {
      leaveRequestStmt.run(
        request.user_id,
        request.leave_type,
        request.start_date,
        request.end_date,
        request.reason,
        request.status,
        request.created_at,
        request.approved_by,
        request.approved_at,
        request.approver_notes
      );
    }

    // Re-enable foreign key checks
    db.exec('PRAGMA foreign_keys = ON');

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Data Summary:');
    console.log('- 16 Users (1 Principal, 5 Teachers, 10 Students)');
    console.log('- 10 Subjects (Mathematics, Physics, Chemistry, Biology, English, Hindi, History, Geography, Computer Science, PE)');
    console.log('- 4 Classes (Grade 10-A, 10-B, 9-A, 9-B)');
    console.log('- 5 Teacher Records with Indian qualifications');
    console.log('- 10 Student Records with Indian guardian information');
    console.log('- 16 Teacher-Subject assignments');
    console.log('- 20 Timetable entries (Monday schedule)');
    console.log('- 1,500 Attendance records (30 days × 5 subjects × 10 students)');
    console.log('- 240 Result records (4 exam types × 6 subjects × 10 students)');
    console.log('- 5 Announcements');
    console.log('- 5 Leave requests (mix of students and teachers)');
    
    console.log('\n🔑 Default login credentials:');
    console.log('Principal: username=principal, password=password123');
    console.log('Teachers: username=ateacher001 to steacher005, password=teacher123');
    console.log('Students: username=astudent001 to mstudent010, password=student123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}
