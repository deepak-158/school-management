const bcrypt = require('bcrypt');
const db = require('./src/lib/database').getDatabase();

console.log('=== PRINCIPAL USERS ===');
const principals = db.prepare('SELECT * FROM users WHERE role = "principal"').all();
console.log('Found principals:', principals.length);
principals.forEach(p => {
  console.log('- Username:', p.username, '| ID:', p.id, '| Name:', p.first_name, p.last_name);
});

console.log('\n=== TESTING PRINCIPAL LOGIN ===');
if (principals.length > 0) {
  const principal = principals[0];
  console.log('Testing login for:', principal.username);
  
  // Test password verification
  const isValidPassword = bcrypt.compareSync('principal123', principal.password);
  console.log('Password valid:', isValidPassword);
  
  if (isValidPassword) {
    console.log('✅ Principal login should work with:');
    console.log('   Username:', principal.username);
    console.log('   Password: principal123');
  }
}
