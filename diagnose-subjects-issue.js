const db = require('better-sqlite3')('./database/school.db');

console.log('🔍 DIAGNOSING SUBJECT DROPDOWN AND RESULTS ISSUES');
console.log('================================================\n');

try {
  // 1. Check if subjects exist
  console.log('1. CHECKING SUBJECTS TABLE');
  console.log('---------------------------');
  const subjects = db.prepare('SELECT * FROM subjects').all();
  console.log(`Found ${subjects.length} subjects:`);
  subjects.forEach(subject => {
    console.log(`- ${subject.name} (${subject.code}) - ID: ${subject.id}`);
  });

  // 2. Check if classes exist
  console.log('\n2. CHECKING CLASSES TABLE');
  console.log('--------------------------');
  const classes = db.prepare('SELECT * FROM classes').all();
  console.log(`Found ${classes.length} classes:`);
  classes.forEach(cls => {
    console.log(`- ${cls.name} - ID: ${cls.id}`);
  });

  // 3. Check if class_subjects mapping exists
  console.log('\n3. CHECKING CLASS_SUBJECTS MAPPING');
  console.log('-----------------------------------');
  try {
    const classSubjects = db.prepare('SELECT * FROM class_subjects').all();
    console.log(`Found ${classSubjects.length} class-subject mappings:`);
    classSubjects.forEach(cs => {
      console.log(`- Class ID ${cs.class_id} -> Subject ID ${cs.subject_id}`);
    });
  } catch (error) {
    console.log('❌ class_subjects table might not exist:', error.message);
  }

  // 4. Check teacher assignments
  console.log('\n4. CHECKING TEACHER ASSIGNMENTS');
  console.log('--------------------------------');
  try {
    const teacherAssignments = db.prepare(`
      SELECT 
        t.id as teacher_id,
        u.first_name || ' ' || u.last_name as teacher_name,
        u.email,
        ta.class_id,
        ta.subject_id,
        c.name as class_name,
        s.name as subject_name
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN teacher_assignments ta ON t.id = ta.teacher_id
      LEFT JOIN classes c ON ta.class_id = c.id
      LEFT JOIN subjects s ON ta.subject_id = s.id
    `).all();
    
    console.log(`Found ${teacherAssignments.length} teacher records:`);
    teacherAssignments.forEach(ta => {
      if (ta.class_id && ta.subject_id) {
        console.log(`- ${ta.teacher_name} teaches ${ta.subject_name} in ${ta.class_name}`);
      } else {
        console.log(`- ${ta.teacher_name} (${ta.email}) - NO ASSIGNMENTS`);
      }
    });
  } catch (error) {
    console.log('❌ Error checking teacher assignments:', error.message);
  }

  // 5. Check if results exist
  console.log('\n5. CHECKING RESULTS TABLE');
  console.log('--------------------------');
  const results = db.prepare('SELECT COUNT(*) as count FROM results').get();
  console.log(`Found ${results.count} results in database`);

  if (results.count > 0) {
    const sampleResults = db.prepare(`
      SELECT 
        r.id,
        r.exam_type,
        r.obtained_marks,
        r.max_marks,
        s.name as subject_name,
        u.first_name || ' ' || u.last_name as student_name
      FROM results r
      JOIN subjects s ON r.subject_id = s.id
      JOIN students st ON r.student_id = st.id
      JOIN users u ON st.user_id = u.id
      LIMIT 5
    `).all();
    
    console.log('Sample results:');
    sampleResults.forEach(result => {
      console.log(`- ${result.student_name}: ${result.subject_name} - ${result.obtained_marks}/${result.max_marks} (${result.exam_type})`);
    });
  }

  // 6. Check user credentials
  console.log('\n6. CHECKING USER CREDENTIALS');
  console.log('-----------------------------');
  const users = db.prepare(`
    SELECT 
      u.email, 
      u.role,
      u.first_name || ' ' || u.last_name as name,
      CASE WHEN u.password_hash IS NOT NULL THEN 'Yes' ELSE 'No' END as has_password
    FROM users u 
    WHERE u.role IN ('teacher', 'principal')
    ORDER BY u.role, u.email
  `).all();
  
  users.forEach(user => {
    console.log(`- ${user.email} (${user.role}) - ${user.name} - Password: ${user.has_password}`);
  });

  console.log('\n7. DIAGNOSIS SUMMARY');
  console.log('====================');
  
  if (subjects.length === 0) {
    console.log('❌ ISSUE: No subjects found - need to seed subject data');
  }
  
  if (classes.length === 0) {
    console.log('❌ ISSUE: No classes found - need to seed class data');
  }
  
  try {
    const classSubjects = db.prepare('SELECT COUNT(*) as count FROM class_subjects').get();
    if (classSubjects.count === 0) {
      console.log('❌ ISSUE: No class-subject mappings - subjects won\'t appear in dropdowns');
    }
  } catch (error) {
    console.log('❌ ISSUE: class_subjects table missing - subjects won\'t appear in dropdowns');
  }
  
  const teachersWithAssignments = db.prepare(`
    SELECT COUNT(*) as count 
    FROM teacher_assignments ta
    JOIN teachers t ON ta.teacher_id = t.id
  `).get();
  
  if (teachersWithAssignments.count === 0) {
    console.log('❌ ISSUE: No teacher assignments - teachers can\'t see their subjects');
  }
  
  console.log('\n🔧 RECOMMENDED FIXES:');
  console.log('1. Reseed the database with proper class-subject mappings');
  console.log('2. Create teacher assignments for subject-class combinations');
  console.log('3. Ensure API endpoints return subjects based on teacher assignments');

} catch (error) {
  console.error('❌ Database diagnosis failed:', error.message);
} finally {
  db.close();
}
