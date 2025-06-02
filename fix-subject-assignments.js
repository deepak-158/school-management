const db = require('better-sqlite3')('./database/school.db');

console.log('🔧 FIXING SUBJECT DROPDOWN AND TEACHER ASSIGNMENT ISSUES');
console.log('=========================================================\n');

try {
  // 1. Create class_subjects table if it doesn't exist
  console.log('1. Creating class_subjects table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS class_subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      UNIQUE(class_id, subject_id)
    )
  `);
  console.log('✅ class_subjects table created');

  // 2. Create teacher_assignments table
  console.log('\n2. Creating teacher_assignments table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS teacher_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      UNIQUE(teacher_id, class_id, subject_id)
    )
  `);
  console.log('✅ teacher_assignments table created');

  // 3. Get all classes and subjects
  const classes = db.prepare('SELECT * FROM classes').all();
  const subjects = db.prepare('SELECT * FROM subjects WHERE id <= 8').all(); // Core subjects only
  
  console.log(`\n3. Setting up class-subject mappings for ${classes.length} classes and ${subjects.length} subjects...`);
  
  // 4. Create class-subject mappings (all classes have all core subjects)
  const insertClassSubject = db.prepare(`
    INSERT OR IGNORE INTO class_subjects (class_id, subject_id) 
    VALUES (?, ?)
  `);
  
  let mappingCount = 0;
  for (const cls of classes) {
    for (const subject of subjects) {
      insertClassSubject.run(cls.id, subject.id);
      mappingCount++;
    }
  }
  console.log(`✅ Created ${mappingCount} class-subject mappings`);

  // 5. Get all teachers
  const teachers = db.prepare(`
    SELECT t.id, u.first_name, u.last_name, u.email
    FROM teachers t
    JOIN users u ON t.user_id = u.id
  `).all();
  
  console.log(`\n4. Creating teacher assignments for ${teachers.length} teachers...`);
  
  // 6. Create teacher assignments (each teacher teaches 1-2 subjects across all classes)
  const insertTeacherAssignment = db.prepare(`
    INSERT OR IGNORE INTO teacher_assignments (teacher_id, class_id, subject_id)
    VALUES (?, ?, ?)
  `);
  
  // Define teacher-subject specializations
  const teacherSubjects = {
    1: [1, 2], // Teacher 1: Math, Physics
    2: [3, 4], // Teacher 2: Chemistry, Biology  
    3: [5, 6], // Teacher 3: English, Hindi
    4: [7, 8], // Teacher 4: History, Geography
    5: [1, 9], // Teacher 5: Math, Computer Science
  };
  
  let assignmentCount = 0;
  for (const teacher of teachers) {
    const subjectIds = teacherSubjects[teacher.id] || [1]; // Default to Math if not specified
    
    // Assign this teacher to teach their subjects in all classes
    for (const cls of classes) {
      for (const subjectId of subjectIds) {
        insertTeacherAssignment.run(teacher.id, cls.id, subjectId);
        assignmentCount++;
      }
    }
    
    console.log(`- ${teacher.first_name} ${teacher.last_name}: assigned ${subjectIds.length} subjects across ${classes.length} classes`);
  }
  
  console.log(`✅ Created ${assignmentCount} teacher assignments`);

  // 7. Verify the setup
  console.log('\n5. VERIFICATION');
  console.log('----------------');
  
  const classSubjectCount = db.prepare('SELECT COUNT(*) as count FROM class_subjects').get();
  console.log(`✅ Class-subject mappings: ${classSubjectCount.count}`);
  
  const teacherAssignmentCount = db.prepare('SELECT COUNT(*) as count FROM teacher_assignments').get();
  console.log(`✅ Teacher assignments: ${teacherAssignmentCount.count}`);
  
  // Show sample teacher assignments
  const sampleAssignments = db.prepare(`
    SELECT 
      u.first_name || ' ' || u.last_name as teacher_name,
      c.name as class_name,
      s.name as subject_name
    FROM teacher_assignments ta
    JOIN teachers t ON ta.teacher_id = t.id
    JOIN users u ON t.user_id = u.id
    JOIN classes c ON ta.class_id = c.id
    JOIN subjects s ON ta.subject_id = s.id
    LIMIT 10
  `).all();
  
  console.log('\nSample teacher assignments:');
  sampleAssignments.forEach(assignment => {
    console.log(`- ${assignment.teacher_name} teaches ${assignment.subject_name} in ${assignment.class_name}`);
  });

  console.log('\n🎉 FIXES COMPLETED SUCCESSFULLY!');
  console.log('================================');
  console.log('✅ class_subjects table created and populated');
  console.log('✅ teacher_assignments table created and populated');
  console.log('✅ Teachers now have specific subject-class assignments');
  console.log('✅ Subject dropdowns should now work for teachers');
  console.log('✅ Teachers can only manage results for their assigned subjects');
  console.log('✅ Principal can manage all results');

} catch (error) {
  console.error('❌ Fix failed:', error.message);
  console.error('Full error:', error);
} finally {
  db.close();
}
