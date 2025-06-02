// Complete test for login and manage-results page
const runCompleteTest = async () => {
  console.log('=== COMPLETE LOGIN AND MANAGE-RESULTS TEST ===');
  
  // Clear existing storage
  localStorage.clear();
  console.log('1. Cleared localStorage');
  
  // Test with correct teacher username
  console.log('\n2. Testing login with ateacher001...');
  
  try {
    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'ateacher001',
        password: 'password123'
      })
    });
    
    console.log('Login status:', loginResponse.status);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('Login response:', loginData);
      
      if (loginData.success && loginData.data) {
        // Store auth data exactly like AuthContext does
        localStorage.setItem('auth_token', loginData.data.token);
        const { token, ...userWithoutToken } = loginData.data;
        localStorage.setItem('user_data', JSON.stringify(userWithoutToken));
        
        console.log('3. Stored auth data:');
        console.log('   Token stored:', !!localStorage.getItem('auth_token'));
        console.log('   User data:', JSON.parse(localStorage.getItem('user_data')));
        
        // Now test the individual APIs that manage-results calls
        console.log('\n4. Testing APIs individually...');
        
        const authToken = loginData.data.token;
        
        // Test teacher classes
        const classesRes = await fetch('/api/teacher/classes', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log('Teacher classes API:', classesRes.status);
        if (classesRes.ok) {
          const classesData = await classesRes.json();
          console.log('Classes found:', classesData.classes?.length || 0);
          if (classesData.classes?.length > 0) {
            console.log('First class:', classesData.classes[0]);
          }
        }
        
        // Test teacher subjects
        const subjectsRes = await fetch('/api/teacher/subjects', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log('Teacher subjects API:', subjectsRes.status);
        if (subjectsRes.ok) {
          const subjectsData = await subjectsRes.json();
          console.log('Subjects found:', subjectsData.subjects?.length || 0);
          if (subjectsData.subjects?.length > 0) {
            console.log('First subject:', subjectsData.subjects[0]);
          }
        }
        
        console.log('\n✅ Auth setup complete. Ready to test manage-results page.');
        console.log('Navigate to: /manage-results and click Debug button');
        
        return true;
      }
    } else {
      const errorText = await loginResponse.text();
      console.error('Login failed:', errorText);
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
  
  return false;
};

// Run the test
runCompleteTest();
