const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

// Initialize database
const dbPath = path.join(__dirname, '..', 'database', 'school.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

console.log('Checking database and seeding if needed...');

// Check if we have users
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
console.log(`Current user count: ${userCount.count}`);

if (userCount.count === 0) {
  console.log('No users found, creating sample data...');
  
  // Hash passwords
  const hashedPassword = bcrypt.hashSync('password123', 10);
  
  // Create principal
  const principalResult = db.prepare(`
    INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone, address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('principal', 'principal@school.edu', hashedPassword, 'principal', 'John', 'Smith', '+1-555-0001', '123 Main St');
  
  console.log('Created principal user');
  
  // Create sample teachers
  const teacher1Result = db.prepare(`
    INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone, address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('teacher1', 'sarah.johnson@school.edu', hashedPassword, 'teacher', 'Sarah', 'Johnson', '+1-555-0002', '456 Oak Ave');
  
  const teacher2Result = db.prepare(`
    INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone, address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('teacher2', 'michael.brown@school.edu', hashedPassword, 'teacher', 'Michael', 'Brown', '+1-555-0003', '789 Pine St');
  
  // Insert teacher records
  db.prepare(`
    INSERT INTO teachers (user_id, employee_id, department, qualification, experience_years, joining_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(teacher1Result.lastInsertRowid, 'T001', 'Mathematics', 'M.Sc Mathematics', 5, '2023-01-15');
  
  db.prepare(`
    INSERT INTO teachers (user_id, employee_id, department, qualification, experience_years, joining_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(teacher2Result.lastInsertRowid, 'T002', 'Science', 'M.Sc Physics', 8, '2022-08-01');
  
  console.log('Created teacher users and profiles');
  
  // Create sample students
  const student1Result = db.prepare(`
    INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone, address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('student1', 'emma.davis@school.edu', hashedPassword, 'student', 'Emma', 'Davis', '+1-555-0004', '321 Elm St');
  
  const student2Result = db.prepare(`
    INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone, address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('student2', 'alex.wilson@school.edu', hashedPassword, 'student', 'Alex', 'Wilson', '+1-555-0005', '654 Maple Dr');
  
  // Create sample classes
  const class1Result = db.prepare(`
    INSERT INTO classes (name, grade_level, section, academic_year, class_teacher_id)
    VALUES (?, ?, ?, ?, ?)
  `).run('Grade 10-A', 10, 'A', '2024-2025', teacher1Result.lastInsertRowid);
  
  const class2Result = db.prepare(`
    INSERT INTO classes (name, grade_level, section, academic_year)
    VALUES (?, ?, ?, ?)
  `).run('Grade 9-B', 9, 'B', '2024-2025');
  
  console.log('Created sample classes');
  
  // Insert student records
  db.prepare(`
    INSERT INTO students (user_id, student_id, class_id, roll_number, admission_date, guardian_name, guardian_phone)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(student1Result.lastInsertRowid, 'S001', class1Result.lastInsertRowid, 1, '2024-04-01', 'Robert Davis', '+1-555-0006');
  
  db.prepare(`
    INSERT INTO students (user_id, student_id, roll_number, admission_date, guardian_name, guardian_phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(student2Result.lastInsertRowid, 'S002', 2, '2024-04-01', 'Jennifer Wilson', '+1-555-0007');
  
  console.log('Created student users and profiles');
  
  console.log('Sample data creation completed!');
  console.log('Login credentials:');
  console.log('Principal: principal / password123');
  console.log('Teacher 1: teacher1 / password123');
  console.log('Teacher 2: teacher2 / password123');
  console.log('Student 1: student1 / password123');
  console.log('Student 2: student2 / password123');
} else {
  console.log('Database already has users, skipping seed data creation');
}

// Show current data summary
const stats = {
  users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
  teachers: db.prepare('SELECT COUNT(*) as count FROM teachers').get().count,
  students: db.prepare('SELECT COUNT(*) as count FROM students').get().count,
  classes: db.prepare('SELECT COUNT(*) as count FROM classes').get().count
};

console.log('\nDatabase Summary:');
console.log(`Users: ${stats.users}`);
console.log(`Teachers: ${stats.teachers}`);
console.log(`Students: ${stats.students}`);
console.log(`Classes: ${stats.classes}`);

db.close();
