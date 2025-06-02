// Test frontend authentication flow - the exact same flow the frontend uses
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-secret-key';

// Test data - using correct usernames from database
const testCredentials = {
  principal: { username: 'principal', password: 'password123' },
  teacher: { username: 'ateacher001', password: 'teacher123' },
  student: { username: 'astudent001', password: 'student123' }
};

async function testFrontendAuth() {
  console.log('🔍 FRONTEND AUTHENTICATION TEST');
  console.log('================================');
  
  for (const [role, credentials] of Object.entries(testCredentials)) {
    console.log(`\n📋 Testing ${role.toUpperCase()} authentication flow:`);
    
    try {
      // Step 1: Login
      const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });
      
      if (!loginResponse.ok) {
        console.log(`❌ Login failed for ${role}: ${loginResponse.status}`);
        continue;
      }
        const loginData = await loginResponse.json();
      console.log(`✅ Login successful for ${role}`);
      console.log(`   Response structure:`, Object.keys(loginData));
      console.log(`   User data:`, loginData.data ? 'present' : 'missing');
      
      // Extract token from response - check both old and new format
      const token = loginData.token || loginData.data?.token;
      const user = loginData.user || loginData.data;
      
      if (!token) {
        console.log(`❌ No token received for ${role}`);
        console.log(`   Full response:`, JSON.stringify(loginData, null, 2));
        continue;
      }
      
      if (!user) {
        console.log(`❌ No user data received for ${role}`);
        continue;
      }
      
      console.log(`   User ID: ${user.id}, Role: ${user.role}`);
      
      // Step 2: Test API endpoints that frontend uses
      console.log(`\n🧪 Testing API endpoints for ${role}:`);
      
      // Test students API (used by manage-results)
      console.log(`   Testing /api/students...`);
      const studentsResponse = await fetch('http://localhost:3001/api/students', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        console.log(`   ✅ Students API: ${studentsData.students?.length || 0} students found`);
      } else {
        console.log(`   ❌ Students API failed: ${studentsResponse.status}`);
        const errorText = await studentsResponse.text();
        console.log(`   Error: ${errorText}`);
      }
      
      // Test results API (used by results page)
      console.log(`   Testing /api/results...`);
      const resultsResponse = await fetch('http://localhost:3001/api/results', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (resultsResponse.ok) {
        const resultsData = await resultsResponse.json();
        console.log(`   ✅ Results API: ${resultsData.results?.length || 0} results found`);
      } else {
        console.log(`   ❌ Results API failed: ${resultsResponse.status}`);
        const errorText = await resultsResponse.text();
        console.log(`   Error: ${errorText}`);
      }
      
      // Test teacher subjects API (used by manage-results for teachers)
      if (role === 'teacher' || role === 'principal') {
        console.log(`   Testing /api/teacher/subjects...`);
        const subjectsResponse = await fetch('http://localhost:3001/api/teacher/subjects', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (subjectsResponse.ok) {
          const subjectsData = await subjectsResponse.json();
          console.log(`   ✅ Teacher Subjects API: ${subjectsData.subjects?.length || 0} subjects found`);
        } else {
          console.log(`   ❌ Teacher Subjects API failed: ${subjectsResponse.status}`);
          const errorText = await subjectsResponse.text();
          console.log(`   Error: ${errorText}`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Error testing ${role}: ${error.message}`);
    }
  }
}

// Also test with cookie authentication (simulating browser behavior)
async function testCookieAuth() {
  console.log('\n\n🍪 COOKIE AUTHENTICATION TEST');
  console.log('==============================');
  
  try {    // Login and get cookie
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCredentials.teacher)
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed for cookie test');
      return;
    }
    
    // Extract Set-Cookie header
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    console.log(`Set-Cookie header: ${setCookieHeader}`);
    
    if (setCookieHeader) {
      // Test API with cookie
      const cookieResponse = await fetch('http://localhost:3001/api/teacher/subjects', {
        headers: {
          'Cookie': setCookieHeader
        }
      });
      
      if (cookieResponse.ok) {
        const data = await cookieResponse.json();
        console.log(`✅ Cookie auth successful: ${data.subjects?.length || 0} subjects found`);
      } else {
        console.log(`❌ Cookie auth failed: ${cookieResponse.status}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Cookie test error: ${error.message}`);
  }
}

async function runTests() {
  await testFrontendAuth();
  await testCookieAuth();
  
  console.log('\n\n🎯 FRONTEND DEBUGGING TIPS:');
  console.log('============================');
  console.log('1. Check browser localStorage for auth_token');
  console.log('2. Open DevTools Network tab and monitor API calls');
  console.log('3. Check Console for any JavaScript errors');
  console.log('4. Verify that login sets token correctly');
  console.log('5. Test manage-results page with teacher login');
}

runTests().catch(console.error);
