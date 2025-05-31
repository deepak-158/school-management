const Database = require('better-sqlite3');

const db = new Database('school.db');

console.log('=== Database Verification ===\n');

// Check users
console.log('USERS:');
const users = db.prepare('SELECT id, username, email, role, first_name, last_name FROM users').all();
console.table(users);

// Check students
console.log('\nSTUDENTS:');
const students = db.prepare('SELECT id, user_id, student_id, class_id, guardian_name FROM students').all();
console.table(students);

// Check teachers
console.log('\nTEACHERS:');
const teachers = db.prepare('SELECT id, user_id, employee_id, qualification FROM teachers').all();
console.table(teachers);

// Check classes
console.log('\nCLASSES:');
const classes = db.prepare('SELECT id, name, grade, section, class_teacher_id FROM classes').all();
console.table(classes);

// Check results count
const resultCount = db.prepare('SELECT COUNT(*) as count FROM results').get();
console.log(`\nRESULTS: ${resultCount.count} records`);

// Check attendance count
const attendanceCount = db.prepare('SELECT COUNT(*) as count FROM attendance').get();
console.log(`ATTENDANCE: ${attendanceCount.count} records`);

// Check announcements
console.log('\nANNOUNCEMENTS:');
const announcements = db.prepare('SELECT id, title, author_id, target_audience FROM announcements').all();
console.table(announcements);

db.close();
console.log('\nDatabase verification completed!');
