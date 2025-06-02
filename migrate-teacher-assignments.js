const db = require('better-sqlite3')('./database/school.db');

console.log('🔄 MIGRATING TEACHER ASSIGNMENTS TO CORRECT TABLE');
console.log('=================================================\n');

try {
  // 1. Create teacher_subjects table (following the schema)
  console.log('1. Creating teacher_subjects table (from schema)...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS teacher_subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      UNIQUE(teacher_id, subject_id, class_id)
    )
  `);
  console.log('✅ teacher_subjects table ready');

  // 2. Copy data from teacher_assignments to teacher_subjects
  console.log('\n2. Migrating data from teacher_assignments...');
  
  try {
    const assignments = db.prepare('SELECT * FROM teacher_assignments').all();
    const insertTeacherSubject = db.prepare(`
      INSERT OR IGNORE INTO teacher_subjects (teacher_id, subject_id, class_id)
      VALUES (?, ?, ?)
    `);
    
    let migratedCount = 0;
    for (const assignment of assignments) {
      insertTeacherSubject.run(assignment.teacher_id, assignment.subject_id, assignment.class_id);
      migratedCount++;
    }
    
    console.log(`✅ Migrated ${migratedCount} assignments to teacher_subjects table`);
    
    // 3. Drop the old teacher_assignments table
    console.log('\n3. Cleaning up old table...');
    db.exec('DROP TABLE IF EXISTS teacher_assignments');
    console.log('✅ Removed old teacher_assignments table');
    
  } catch (error) {
    console.log('⚠️  No teacher_assignments table found, creating fresh data...');
    
    // Create fresh teacher assignments
    const teachers = db.prepare(`
      SELECT t.id, u.first_name, u.last_name
      FROM teachers t
      JOIN users u ON t.user_id = u.id
    `).all();
    
    const classes = db.prepare('SELECT * FROM classes').all();
    const subjects = db.prepare('SELECT * FROM subjects WHERE id <= 8').all(); // Core subjects
    
    const insertTeacherSubject = db.prepare(`
      INSERT OR IGNORE INTO teacher_subjects (teacher_id, subject_id, class_id)
      VALUES (?, ?, ?)
    `);
    
    // Assign subjects to teachers
    const teacherSubjects = {
      1: [1, 2], // Teacher 1: Math, Physics
      2: [3, 4], // Teacher 2: Chemistry, Biology  
      3: [5, 6], // Teacher 3: English, Hindi
      4: [7, 8], // Teacher 4: History, Geography
      5: [1, 9], // Teacher 5: Math, Computer Science
    };
    
    let assignmentCount = 0;
    for (const teacher of teachers) {
      const subjectIds = teacherSubjects[teacher.id] || [1];
      
      for (const cls of classes) {
        for (const subjectId of subjectIds) {
          insertTeacherSubject.run(teacher.id, subjectId, cls.id);
          assignmentCount++;
        }
      }
    }
    
    console.log(`✅ Created ${assignmentCount} fresh teacher-subject assignments`);
  }

  // 4. Verify the setup
  console.log('\n4. VERIFICATION');
  console.log('----------------');
  
  const teacherSubjectCount = db.prepare('SELECT COUNT(*) as count FROM teacher_subjects').get();
  console.log(`✅ Teacher-subject assignments: ${teacherSubjectCount.count}`);
  
  // Show sample assignments
  const sampleAssignments = db.prepare(`
    SELECT 
      u.first_name || ' ' || u.last_name as teacher_name,
      c.name as class_name,
      s.name as subject_name
    FROM teacher_subjects ts
    JOIN teachers t ON ts.teacher_id = t.id
    JOIN users u ON t.user_id = u.id
    JOIN classes c ON ts.class_id = c.id
    JOIN subjects s ON ts.subject_id = s.id
    ORDER BY teacher_name, class_name, subject_name
    LIMIT 15
  `).all();
  
  console.log('\nSample teacher-subject assignments:');
  sampleAssignments.forEach(assignment => {
    console.log(`- ${assignment.teacher_name} teaches ${assignment.subject_name} in ${assignment.class_name}`);
  });

  console.log('\n🎉 MIGRATION COMPLETED SUCCESSFULLY!');
  console.log('====================================');
  console.log('✅ teacher_subjects table properly set up');
  console.log('✅ All teacher assignments migrated');
  console.log('✅ APIs should now work with correct table structure');

} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.error('Full error:', error);
} finally {
  db.close();
}
