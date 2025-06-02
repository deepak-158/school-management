// Quick test of the fixed students API
const jwt = require('jsonwebtoken');

async function testStudentsAPI() {
  console.log('🧪 TESTING STUDENTS API DIRECTLY');
  console.log('=================================');
  
  try {
    // Login as teacher
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ateacher001', password: 'teacher123' })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed');
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    
    console.log('✅ Login successful');
    
    // Test students API
    const studentsResponse = await fetch('http://localhost:3000/api/students', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (studentsResponse.ok) {
      const data = await studentsResponse.json();
      console.log(`✅ Students API working: ${data.students?.length || 0} students found`);
      if (data.students?.length > 0) {
        console.log('   Sample student:', data.students[0]);
      }
    } else {
      console.log(`❌ Students API failed: ${studentsResponse.status}`);
      const errorText = await studentsResponse.text();
      console.log('   Error:', errorText);
    }
    
    // Test with class filter
    const classStudentsResponse = await fetch('http://localhost:3000/api/students?class_id=1', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (classStudentsResponse.ok) {
      const data = await classStudentsResponse.json();
      console.log(`✅ Class-filtered students: ${data.students?.length || 0} students found`);
    } else {
      console.log(`❌ Class-filtered students failed: ${classStudentsResponse.status}`);
      const errorText = await classStudentsResponse.text();
      console.log('   Error:', errorText);
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testStudentsAPI();
