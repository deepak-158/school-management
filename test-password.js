const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

async function testPasswords() {
  const db = new Database('./database/school.db');
  
  console.log('🔐 TESTING PASSWORD AUTHENTICATION');
  console.log('=====================================');
  
  // Get principal user
  const user = db.prepare('SELECT username, password_hash FROM users WHERE username = ?').get('principal');
  
  if (!user) {
    console.log('❌ Principal user not found');
    return;
  }
  
  console.log('Principal user found:', user.username);
  console.log('Password hash exists:', !!user.password_hash);
  console.log('Hash length:', user.password_hash ? user.password_hash.length : 'null');
    // Test different password variations
  const passwordsToTest = [
    'password123',  // This should be the correct one
    'admin123',
    'Admin123',
    'ADMIN123',
    'admin',
    'password',
    'Password123',
    'principal123'
  ];
  
  console.log('\nTesting passwords:');
  for (const password of passwordsToTest) {
    try {
      const isValid = await bcrypt.compare(password, user.password_hash);
      console.log(`Password "${password}": ${isValid ? '✅ VALID' : '❌ Invalid'}`);
      if (isValid) {
        console.log(`🎉 CORRECT PASSWORD FOUND: "${password}"`);
        break;
      }
    } catch (error) {
      console.log(`Password "${password}": ❌ Error - ${error.message}`);
    }
  }
  
  db.close();
}

testPasswords().catch(console.error);
