const Database = require('better-sqlite3');
const db = new Database('./database/school.db');

console.log('Users table structure:');
const tableInfo = db.prepare("PRAGMA table_info(users)").all();
console.table(tableInfo);

console.log('\nSample user data:');
const sampleUsers = db.prepare("SELECT * FROM users WHERE role = 'teacher' LIMIT 2").all();
console.table(sampleUsers);

db.close();
