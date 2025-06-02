// Browser storage clearing utility
// You can run this in the browser console (F12 > Console) to clear all storage

console.log('🧹 CLEARING BROWSER STORAGE FOR SCHOOL MANAGEMENT PORTAL');

// Clear localStorage
if (typeof localStorage !== 'undefined') {
  const localStorageKeys = Object.keys(localStorage);
  localStorage.clear();
  console.log(`✅ Cleared localStorage (${localStorageKeys.length} items)`);
}

// Clear sessionStorage  
if (typeof sessionStorage !== 'undefined') {
  const sessionStorageKeys = Object.keys(sessionStorage);
  sessionStorage.clear();
  console.log(`✅ Cleared sessionStorage (${sessionStorageKeys.length} items)`);
}

// Clear cookies for this domain
if (typeof document !== 'undefined') {
  const cookies = document.cookie.split(';');
  cookies.forEach(cookie => {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  });
  console.log(`✅ Cleared cookies (${cookies.length} items)`);
}

// Clear IndexedDB (if any)
if (typeof indexedDB !== 'undefined') {
  indexedDB.databases().then(databases => {
    databases.forEach(db => {
      indexedDB.deleteDatabase(db.name);
    });
    console.log(`✅ Cleared IndexedDB (${databases.length} databases)`);
  }).catch(() => {
    console.log('ℹ️  No IndexedDB to clear');
  });
}

console.log('🎉 BROWSER STORAGE CLEARED! Please refresh the page.');
console.log('🔄 You can now login with fresh credentials:');
console.log('   Principal: principal / password123');
console.log('   Teacher:   ateacher001 / teacher123');  
console.log('   Student:   astudent001 / student123');
