const fs = require('fs');
const path = require('path');

console.log('🧹 Organizing Project Files');
console.log('==========================');

// Create verification folder if it doesn't exist
const verificationDir = './verification-scripts';
if (!fs.existsSync(verificationDir)) {
  fs.mkdirSync(verificationDir);
  console.log('✅ Created verification-scripts folder');
}

// List of verification/test files to move
const verificationFiles = [
  'final-system-check.js',
  'test-standardized-system.js',
  'create-standardized-results.js',
  'check-complete-data.js',
  'check-results-table.js'
];

// Move files to verification folder
verificationFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const newPath = path.join(verificationDir, file);
    fs.renameSync(file, newPath);
    console.log(`✅ Moved ${file} to verification-scripts/`);
  }
});

console.log('\n📁 Project Organization Complete!');
console.log('   Main files remain in root directory');
console.log('   Verification scripts moved to verification-scripts/');
console.log('\n🎯 Standardized Exam System: READY FOR USE! 🚀');
