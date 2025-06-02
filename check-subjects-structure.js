// Check teacher subjects API response structure
async function checkSubjectsStructure() {
  console.log('🔍 CHECKING TEACHER SUBJECTS API STRUCTURE');
  console.log('==========================================');
  
  // Login as teacher
  const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'ateacher001', password: 'teacher123' })
  });
  
  const loginData = await loginResponse.json();
  const token = loginData.data.token;
  
  // Get subjects
  const subjectsResponse = await fetch('http://localhost:3001/api/teacher/subjects', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const subjectsData = await subjectsResponse.json();
  
  console.log('Subjects response structure:');
  console.log(JSON.stringify(subjectsData, null, 2));
  
  if (subjectsData.subjects && subjectsData.subjects.length > 0) {
    console.log('\nFirst subject details:');
    console.log(JSON.stringify(subjectsData.subjects[0], null, 2));
    
    console.log('\nAll unique class_ids:');
    const classIds = [...new Set(subjectsData.subjects.map(s => s.class_id))];
    console.log(classIds);
  }
}

checkSubjectsStructure().catch(console.error);
