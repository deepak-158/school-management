// Test the fixed teacher classes API
async function testTeacherClasses() {
  console.log('🏫 TESTING TEACHER CLASSES API');
  console.log('==============================');
  
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
    
    // Test teacher classes API
    const classesResponse = await fetch('http://localhost:3000/api/teacher/classes', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`Classes API status: ${classesResponse.status}`);
    
    if (classesResponse.ok) {
      const data = await classesResponse.json();
      console.log(`✅ Classes found: ${data.classes?.length || 0}`);
      data.classes?.forEach(cls => {
        console.log(`   - ${cls.name} (ID: ${cls.id})`);
      });
    } else {
      const errorText = await classesResponse.text();
      console.log(`❌ Classes API error: ${errorText}`);
    }
    
  } catch (error) {
    console.log('❌ Test error:', error.message);
  }
}

testTeacherClasses();
