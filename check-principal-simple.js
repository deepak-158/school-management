// Simple script to check principal credentials
const sqlite3 = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'school.db');
const db = sqlite3(dbPath);

console.log('=== Checking Principal Credentials ===\n');

try {
  // Get principal user
  const principal = db.prepare(`
    SELECT id, username, email, password_hash, first_name, last_name, role
    FROM users 
    WHERE role = 'principal' 
    LIMIT 1
  `).get();

  if (!principal) {
    console.log('❌ No principal found in database');
    process.exit(1);
  }

  console.log('✅ Principal found:');
  console.log('ID:', principal.id);
  console.log('Username:', principal.username);
  console.log('Email:', principal.email);
  console.log('Name:', `${principal.first_name} ${principal.last_name}`);
  console.log('Role:', principal.role);
  console.log('Password Hash:', principal.password_hash.substring(0, 20) + '...');

  console.log('\n=== Login Credentials to Use ===');
  console.log('Username:', principal.username);
  console.log('Email:', principal.email);
  console.log('Try password: admin123 (this should be the default)');

} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  db.close();
}
