const Database = require('better-sqlite3');
const fs = require('fs');

// Create backup before migration
const backupPath = `school_backup_${Date.now()}.db`;
if (fs.existsSync('./school.db')) {
  fs.copyFileSync('./school.db', backupPath);
  console.log(`✅ Database backed up to ${backupPath}`);
}

const db = new Database('./school.db');

console.log('🔄 Starting migration to remove semester column...');

try {
  // Start transaction
  db.exec('BEGIN TRANSACTION');

  // Create new results table without semester column
  db.exec(`
    CREATE TABLE IF NOT EXISTS results_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      subject_id INTEGER NOT NULL,
      exam_type TEXT NOT NULL,
      exam_date DATE,
      max_marks INTEGER NOT NULL,
      obtained_marks INTEGER NOT NULL,
      grade TEXT,
      remarks TEXT,
      teacher_id INTEGER NOT NULL,
      academic_year TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
    )
  `);

  // Copy data from old table to new table (excluding semester column)
  db.exec(`
    INSERT INTO results_new (
      id, student_id, subject_id, exam_type, exam_date, max_marks, 
      obtained_marks, grade, remarks, teacher_id, academic_year, created_at
    )
    SELECT 
      id, student_id, subject_id, exam_type, exam_date, max_marks, 
      obtained_marks, grade, remarks, teacher_id, academic_year, created_at
    FROM results
  `);

  // Drop old table and rename new table
  db.exec('DROP TABLE results');
  db.exec('ALTER TABLE results_new RENAME TO results');

  // Commit transaction
  db.exec('COMMIT');

  console.log('✅ Migration completed successfully!');
  
  // Verify the new structure
  const tableInfo = db.prepare('PRAGMA table_info(results)').all();
  console.log('\n📊 Updated Results Table Structure:');
  tableInfo.forEach(col => {
    console.log(`   ${col.name}: ${col.type}${col.pk ? ' PRIMARY KEY' : ''}${col.notnull ? ' NOT NULL' : ''}`);
  });
  
  // Check data count
  const count = db.prepare('SELECT COUNT(*) as count FROM results').get();
  console.log(`\n📈 Results table now contains ${count.count} records`);
  
} catch (error) {
  // Rollback on error
  db.exec('ROLLBACK');
  console.error('❌ Migration failed:', error.message);
  console.log('Database has been rolled back to original state');
} finally {
  db.close();
}
