const Database = require('better-sqlite3');
const db = new Database('./database/school.db');

console.log('=== CHECKING USER DATA ===');
const users = db.prepare('SELECT * FROM users').all();
users.forEach(user => {
  console.log(`ID: ${user.id}, Username: ${user.username}, Role: ${user.role}, Name: ${user.first_name} ${user.last_name}`);
});

console.log('\n=== CHECKING TEACHER ASSIGNMENTS ===');
const teacherAssignments = db.prepare(`
  SELECT ts.*, u.username, u.first_name, u.last_name, s.name as subject_name, c.name as class_name
  FROM teacher_subjects ts
  JOIN users u ON ts.teacher_id = u.id
  JOIN subjects s ON ts.subject_id = s.id
  JOIN classes c ON ts.class_id = c.id
  ORDER BY u.username, c.name, s.name
`).all();

teacherAssignments.forEach(ta => {
  console.log(`Teacher: ${ta.username} (${ta.first_name} ${ta.last_name}) - Class: ${ta.class_name} - Subject: ${ta.subject_name}`);
});

// Check a specific user - sarah.smith
console.log('\n=== CHECKING SARAH.SMITH ASSIGNMENTS ===');
const sarahAssignments = db.prepare(`
  SELECT ts.*, s.name as subject_name, c.name as class_name
  FROM teacher_subjects ts
  JOIN users u ON ts.teacher_id = u.id
  JOIN subjects s ON ts.subject_id = s.id
  JOIN classes c ON ts.class_id = c.id
  WHERE u.username = 'sarah.smith'
  ORDER BY c.name, s.name
`).all();

console.log(`Sarah has ${sarahAssignments.length} assignments:`);
sarahAssignments.forEach(ta => {
  console.log(`  Class: ${ta.class_name} - Subject: ${ta.subject_name}`);
});

db.close();
