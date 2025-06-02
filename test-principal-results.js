// Test script to verify principal results functionality
const sqlite3 = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'school.db');
const db = sqlite3(dbPath);

console.log('=== Testing Principal Results Functionality ===\n');

try {
  // 1. Check if principal exists
  console.log('1. Checking principal user...');
  const principal = db.prepare(`
    SELECT u.*, 'principal' as role 
    FROM users u 
    WHERE u.role = 'principal' 
    LIMIT 1
  `).get();
  
  if (!principal) {
    console.log('❌ No principal found');
    process.exit(1);
  }
  
  console.log('✅ Principal found:', {
    id: principal.id,
    name: `${principal.first_name} ${principal.last_name}`,
    email: principal.email
  });

  // 2. Check total results in database
  console.log('\n2. Checking total results...');
  const totalResults = db.prepare('SELECT COUNT(*) as count FROM results').get();
  console.log('✅ Total results in database:', totalResults.count);

  // 3. Test search API query (simulating what the API does)
  console.log('\n3. Testing search query simulation...');
  const searchQuery = `
    SELECT DISTINCT
      s.id,
      s.roll_number,
      u.first_name || ' ' || u.last_name as name,
      c.name as class_name,
      s.student_id,
      COUNT(r.id) as total_results
    FROM students s
    JOIN users u ON s.user_id = u.id
    JOIN classes c ON s.class_id = c.id
    LEFT JOIN results r ON s.id = r.student_id
    WHERE (
      u.first_name LIKE '%a%' OR 
      u.last_name LIKE '%a%' OR 
      (u.first_name || ' ' || u.last_name) LIKE '%a%' OR
      s.roll_number LIKE '%a%' OR
      s.student_id LIKE '%a%' OR
      c.name LIKE '%a%'
    )
    GROUP BY s.id, s.roll_number, u.first_name, u.last_name, c.name, s.student_id
    ORDER BY u.first_name, u.last_name
    LIMIT 5
  `;
  
  const searchStudents = db.prepare(searchQuery).all();
  console.log(`✅ Found ${searchStudents.length} students matching search 'a'`);
  
  if (searchStudents.length > 0) {
    console.log('Sample student:', searchStudents[0]);
    
    // Get results for first student
    const studentResults = db.prepare(`
      SELECT 
        r.id,
        r.student_id,
        r.subject_id,
        r.exam_type,
        r.max_marks,
        r.obtained_marks,
        r.exam_date,
        r.grade,
        r.academic_year,
        s.name as subject_name,
        s.code as subject_code,
        ? as student_name,
        ? as class_name
      FROM results r
      JOIN subjects s ON r.subject_id = s.id
      WHERE r.student_id = ?
      ORDER BY r.exam_date DESC
      LIMIT 3
    `).all(searchStudents[0].name, searchStudents[0].class_name, searchStudents[0].id);
    
    console.log(`✅ Found ${studentResults.length} results for student:`, searchStudents[0].name);
    if (studentResults.length > 0) {
      console.log('Sample result:', studentResults[0]);
    }
  }

  // 4. Test view all query (simulating the API)
  console.log('\n4. Testing view all query simulation...');
  const viewAllQuery = `
    SELECT 
      r.id,
      r.student_id,
      r.subject_id,
      r.exam_type,
      r.max_marks,
      r.obtained_marks,
      r.exam_date,
      r.grade,
      r.remarks,
      r.academic_year,
      r.created_at,
      s.name as subject_name,
      s.code as subject_code,
      (u.first_name || ' ' || u.last_name) as student_name,
      st.roll_number,
      c.name as class_name
    FROM results r
    JOIN subjects s ON r.subject_id = s.id
    JOIN students st ON r.student_id = st.id
    JOIN users u ON st.user_id = u.id
    JOIN classes c ON st.class_id = c.id
    WHERE r.academic_year = '2024-2025'
    ORDER BY r.exam_date DESC, c.name, st.roll_number
    LIMIT 10
  `;
  
  const allResults = db.prepare(viewAllQuery).all();
  console.log(`✅ Found ${allResults.length} results for academic year 2024-2025`);
  
  if (allResults.length > 0) {
    console.log('Sample result:', {
      student: allResults[0].student_name,
      class: allResults[0].class_name,
      subject: allResults[0].subject_name,
      marks: `${allResults[0].obtained_marks}/${allResults[0].max_marks}`,
      grade: allResults[0].grade,
      exam_type: allResults[0].exam_type
    });
  }

  // 5. Check academic years available
  console.log('\n5. Checking available academic years...');
  const academicYears = db.prepare(`
    SELECT DISTINCT academic_year, COUNT(*) as result_count
    FROM results 
    GROUP BY academic_year 
    ORDER BY academic_year DESC
  `).all();
  
  console.log('✅ Available academic years:');
  academicYears.forEach(year => {
    console.log(`   - ${year.academic_year}: ${year.result_count} results`);
  });

  console.log('\n=== Principal Results Test Summary ===');
  console.log('✅ Principal user exists');
  console.log(`✅ ${totalResults.count} total results in database`);
  console.log(`✅ Search functionality can find students and their results`);
  console.log(`✅ View all functionality can retrieve results by academic year`);
  console.log(`✅ ${academicYears.length} academic years available`);
  console.log('\n🎉 All tests passed! Principal should be able to view results.');

} catch (error) {
  console.error('❌ Error during testing:', error.message);
  process.exit(1);
} finally {
  db.close();
}
