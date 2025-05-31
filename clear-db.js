const Database = require('better-sqlite3');
const fs = require('fs');

// Delete existing database file if it exists
const dbPath = 'school.db';
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('Existing database deleted');
} else {
  console.log('No existing database found');
}

// Create fresh database
const db = new Database(dbPath);
console.log('New database created');

// Just create a simple test table to verify connection
db.exec(`
  CREATE TABLE test (
    id INTEGER PRIMARY KEY,
    name TEXT
  )
`);

// Test insert
db.prepare('INSERT INTO test (name) VALUES (?)').run('test data');

// Test select
const result = db.prepare('SELECT * FROM test').all();
console.log('Test data:', result);

db.close();
console.log('Database test completed successfully');
