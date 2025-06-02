const Database = require('better-sqlite3');
const db = new Database('./database/school.db');

console.log('🔍 DEBUGGING /api/students ENDPOINT');
console.log('===================================');

// Test the principal query
console.log('\n1. Testing principal query:');
try {
  const principalQuery = `
    SELECT s.*, c.name as class_name, u.username
    FROM students s
    JOIN classes c ON s.class_id = c.id
    JOIN users u ON s.user_id = u.id
    ORDER BY c.name, s.full_name
  `;
  const principalResults = db.prepare(principalQuery).all();
  console.log(`✅ Principal query successful: ${principalResults.length} students found`);
  if (principalResults.length > 0) {
    console.log('   Sample:', principalResults[0]);
  }
} catch (error) {
  console.log('❌ Principal query failed:', error.message);
}

// Test the teacher query  
console.log('\n2. Testing teacher query:');
try {
  // First get a teacher
  const teacher = db.prepare('SELECT * FROM teachers WHERE user_id = 2').get(); // ateacher001
  console.log('   Teacher found:', teacher ? 'Yes' : 'No');
  
  if (teacher) {
    const teacherQuery = `
      SELECT DISTINCT s.*, c.name as class_name, u.username
      FROM students s
      JOIN classes c ON s.class_id = c.id
      JOIN users u ON s.user_id = u.id
      JOIN teacher_subjects ts ON c.id = ts.class_id
      WHERE ts.teacher_id = ?
      ORDER BY c.name, s.full_name
    `;
    const teacherResults = db.prepare(teacherQuery).all(teacher.id);
    console.log(`✅ Teacher query successful: ${teacherResults.length} students found`);
    if (teacherResults.length > 0) {
      console.log('   Sample:', teacherResults[0]);
    }
  }
} catch (error) {
  console.log('❌ Teacher query failed:', error.message);
}

// Check table structures
console.log('\n3. Checking table structures:');
console.log('   Students table schema:');
const studentsSchema = db.prepare("PRAGMA table_info(students)").all();
studentsSchema.forEach(col => console.log(`     ${col.name}: ${col.type}`));

console.log('\n   Teacher_subjects table schema:');
const teacherSubjectsSchema = db.prepare("PRAGMA table_info(teacher_subjects)").all();
teacherSubjectsSchema.forEach(col => console.log(`     ${col.name}: ${col.type}`));

console.log('\n   Sample teacher_subjects data:');
const sampleTeacherSubjects = db.prepare("SELECT * FROM teacher_subjects LIMIT 5").all();
sampleTeacherSubjects.forEach(ts => console.log(`     Teacher ${ts.teacher_id}, Class ${ts.class_id}, Subject ${ts.subject_id}`));

db.close();
