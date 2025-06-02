// Test login and manage-results page flow
const testLoginAndManageResults = async () => {
  console.log('=== TESTING LOGIN AND MANAGE RESULTS ===');
  
  // First, clear any existing session
  localStorage.clear();
  
  // Test login
  console.log('1. Testing login...');
  
  const loginResponse = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'sarah.smith',
      password: 'password123'
    })
  });
  
  console.log('Login response status:', loginResponse.status);
  
  if (loginResponse.ok) {
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (loginData.success && loginData.data) {
      // Store auth data as the frontend would
      localStorage.setItem('auth_token', loginData.data.token);
      const { token, ...userWithoutToken } = loginData.data;
      localStorage.setItem('user_data', JSON.stringify(userWithoutToken));
      
      console.log('Auth data stored');
      console.log('User role:', loginData.data.role);
      
      // Now test the APIs that manage-results uses
      const token = loginData.data.token;
      
      console.log('\n2. Testing teacher classes API...');
      const classesRes = await fetch('/api/teacher/classes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Classes API status:', classesRes.status);
      if (classesRes.ok) {
        const classesData = await classesRes.json();
        console.log('Classes data:', classesData);
      } else {
        console.error('Classes API error:', await classesRes.text());
      }
      
      console.log('\n3. Testing teacher subjects API...');
      const subjectsRes = await fetch('/api/teacher/subjects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Subjects API status:', subjectsRes.status);
      if (subjectsRes.ok) {
        const subjectsData = await subjectsRes.json();
        console.log('Subjects data:', subjectsData);
        
        // Test students API with first available class
        if (classesRes.ok) {
          const classesData = await classesRes.json();
          if (classesData.classes && classesData.classes.length > 0) {
            const firstClass = classesData.classes[0];
            
            console.log('\n4. Testing students API with class', firstClass.id);
            const studentsRes = await fetch(`/api/students?class_id=${firstClass.id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            
            console.log('Students API status:', studentsRes.status);
            if (studentsRes.ok) {
              const studentsData = await studentsRes.json();
              console.log('Students data:', studentsData);
            } else {
              console.error('Students API error:', await studentsRes.text());
            }
          }
        }
      } else {
        console.error('Subjects API error:', await subjectsRes.text());
      }
      
      console.log('\n✅ All API tests complete. You can now navigate to /manage-results');
    }
  } else {
    console.error('Login failed:', await loginResponse.text());
  }
};

// Run the test
testLoginAndManageResults();
