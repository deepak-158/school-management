// Debug frontend authentication and localStorage
async function debugFrontendAuth() {
  console.log('🔍 FRONTEND AUTHENTICATION DEBUG');
  console.log('================================');
  
  // Check what's in localStorage
  console.log('\n📦 LocalStorage Contents:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    console.log(`   ${key}: ${value?.substring(0, 50)}${value?.length > 50 ? '...' : ''}`);
  }
  
  // Test login and token storage
  console.log('\n🔐 Testing Login Flow:');
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'ateacher001',
        password: 'teacher123'
      })
    });
    
    console.log(`   Login response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   Login response structure:', Object.keys(data));
      console.log('   Data structure:', data.data ? Object.keys(data.data) : 'No data field');
      
      // Check if token is in the response
      const token = data.data?.token;
      if (token) {
        console.log('   ✅ Token found in response');
        
        // Simulate frontend token storage
        localStorage.setItem('auth_token', token);
        console.log('   ✅ Token stored in localStorage');
        
        // Test API call with stored token
        console.log('\n🧪 Testing API calls with stored token:');
        const storedToken = localStorage.getItem('auth_token');
        
        const studentsResponse = await fetch('/api/students', {
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        });
        
        console.log(`   Students API status: ${studentsResponse.status}`);
        
        if (studentsResponse.ok) {
          const studentsData = await studentsResponse.json();
          console.log(`   ✅ Students found: ${studentsData.students?.length || 0}`);
        } else {
          const errorText = await studentsResponse.text();
          console.log(`   ❌ Students API error: ${errorText}`);
        }
        
        // Test teacher subjects API
        const subjectsResponse = await fetch('/api/teacher/subjects', {
          headers: {
            'Authorization': `Bearer ${storedToken}`
          }
        });
        
        console.log(`   Teacher subjects API status: ${subjectsResponse.status}`);
        
        if (subjectsResponse.ok) {
          const subjectsData = await subjectsResponse.json();
          console.log(`   ✅ Subjects found: ${subjectsData.subjects?.length || 0}`);
          if (subjectsData.subjects?.length > 0) {
            console.log('   Sample subject:', subjectsData.subjects[0]);
          }
        } else {
          const errorText = await subjectsResponse.text();
          console.log(`   ❌ Subjects API error: ${errorText}`);
        }
        
      } else {
        console.log('   ❌ No token in response');
      }
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Login failed: ${errorText}`);
    }
    
  } catch (error) {
    console.log(`   ❌ Login error: ${error.message}`);
  }
  
  // Check cookies
  console.log('\n🍪 Checking Cookies:');
  console.log('   Document cookies:', document.cookie);
}

// Run the debug
debugFrontendAuth();
