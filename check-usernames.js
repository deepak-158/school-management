const Database = require('better-sqlite3');
const db = new Database('./database/school.db');

console.log('Users with their usernames:');
const users = db.prepare('SELECT id, username, email, role, first_name, last_name FROM users ORDER BY role, id').all();
users.forEach(u => {
  console.log(`${u.role}: ${u.username} (${u.email}) - ${u.first_name} ${u.last_name}`);
});

db.close();
