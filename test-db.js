const Database = require('better-sqlite3');
const path = require('path');

try {
  const dbPath = path.join(__dirname, 'school.db');
  console.log('Attempting to connect to:', dbPath);
  
  const db = new Database(dbPath);
  console.log('Connected to database successfully');

  // Check if tables exist
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables:', tables.map(t => t.name));

  // Check users
  console.log('\n=== Users ===');
  const users = db.prepare('SELECT id, username, email, role, first_name, last_name FROM users LIMIT 5').all();
  console.log(users);

  // Check students
  console.log('\n=== Students ===');
  const students = db.prepare('SELECT id, user_id, student_id, class_id, guardian_name FROM students LIMIT 3').all();
  console.log(students);
  // Check teachers
  console.log('\n=== Teachers ===');
  const teachers = db.prepare('SELECT id, user_id, employee_id, qualification FROM teachers LIMIT 3').all();
  console.log(teachers);

  db.close();
  console.log('Database connection closed');
} catch (error) {
  console.error('Error:', error.message);
}
