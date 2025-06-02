const Database = require('better-sqlite3');
const db = new Database('./school.db');

console.log('TIMETABLE SYSTEM VERIFICATION');
console.log('============================');

// Count timetable entries
const totalEntries = db.prepare('SELECT COUNT(*) as count FROM timetable').get();
console.log(`Total timetable entries: ${totalEntries.count}`);

// Check class coverage
const classCoverage = db.prepare(`
  SELECT c.name, COUNT(*) as periods 
  FROM timetable t 
  JOIN classes c ON t.class_id = c.id 
  GROUP BY c.name
`).all();

console.log('\nClass Coverage:');
classCoverage.forEach(row => {
  console.log(`${row.name}: ${row.periods} periods`);
});

// Sample schedule
const sample = db.prepare(`
  SELECT 
    c.name as class_name,
    s.name as subject,
    CASE t.day_of_week WHEN 1 THEN 'Mon' WHEN 2 THEN 'Tue' WHEN 3 THEN 'Wed' WHEN 4 THEN 'Thu' WHEN 5 THEN 'Fri' END as day,
    t.start_time
  FROM timetable t
  JOIN classes c ON t.class_id = c.id
  JOIN subjects s ON t.subject_id = s.id
  WHERE c.name = 'Grade 10-A' AND t.day_of_week = 1
  ORDER BY t.start_time
  LIMIT 5
`).all();

console.log('\nSample Monday Schedule for Grade 10-A:');
sample.forEach(row => {
  console.log(`${row.start_time}: ${row.subject}`);
});

db.close();
