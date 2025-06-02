const db = require('better-sqlite3')('./database/school.db');

console.log('🔍 CHECKING USER AUTHENTICATION STRUCTURE');
console.log('=========================================\n');

try {
  // Check the users table structure
  console.log('1. USERS TABLE STRUCTURE');
  console.log('-------------------------');
  const columns = db.prepare('PRAGMA table_info(users)').all();
  console.log('Users table columns:');
  columns.forEach(col => {
    console.log(`- ${col.name} (${col.type}) ${col.notnull ? '- NOT NULL' : ''} ${col.pk ? '- PRIMARY KEY' : ''}`);
  });

  // Check sample user data
  console.log('\n2. SAMPLE USER DATA');
  console.log('-------------------');
  const users = db.prepare(`
    SELECT id, username, email, role, first_name, last_name,
           CASE WHEN password_hash IS NOT NULL THEN 'Yes' ELSE 'No' END as has_password
    FROM users 
    WHERE role IN ('principal', 'teacher')
    LIMIT 5
  `).all();
  
  users.forEach(user => {
    console.log(`ID: ${user.id}`);
    console.log(`  Username: ${user.username || 'NULL'}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Name: ${user.first_name} ${user.last_name}`);
    console.log(`  Has Password: ${user.has_password}`);
    console.log('---');
  });

  // Test if email can be used as username
  console.log('\n3. AUTHENTICATION TESTING');
  console.log('--------------------------');
  
  const principalUser = db.prepare(`
    SELECT * FROM users 
    WHERE email = 'principal@vidyalaya.edu.in'
  `).get();
  
  if (principalUser) {
    console.log('Principal user found:');
    console.log(`- ID: ${principalUser.id}`);
    console.log(`- Username: ${principalUser.username || 'NULL'}`);
    console.log(`- Email: ${principalUser.email}`);
    console.log(`- Has password_hash: ${principalUser.password_hash ? 'Yes' : 'No'}`);
    
    if (!principalUser.username && principalUser.email) {
      console.log('\n💡 SOLUTION: Users have email but no username field');
      console.log('   Need to update authentication to use email instead of username');
    }
  }

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  db.close();
}
