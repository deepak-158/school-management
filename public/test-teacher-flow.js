// Test teacher login and manage results flow
async function testTeacherFlow() {
  console.log('🧪 Starting teacher login test...');
  
  // Clear any existing session
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_data');
  
  try {    // Step 1: Login as teacher
    console.log('🔐 Logging in as teacher: ateacher001');
    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'ateacher001',
        password: 'teacher123'
      }),
    });

    const loginResult = await loginResponse.json();
    console.log('🔐 Login response:', loginResult);

    if (loginResult.success && loginResult.data) {
      const authUser = loginResult.data;
      console.log('✅ Login successful, user role:', authUser.role);
      
      // Store in localStorage (simulate what AuthContext does)
      localStorage.setItem('auth_token', authUser.token);
      const { token, ...userWithoutToken } = authUser;
      localStorage.setItem('user_data', JSON.stringify(userWithoutToken));
      
      // Step 2: Test teacher APIs
      console.log('📚 Testing teacher APIs...');
      
      const [classesRes, subjectsRes] = await Promise.all([
        fetch('/api/teacher/classes', {
          headers: { 'Authorization': `Bearer ${authUser.token}` }
        }),
        fetch('/api/teacher/subjects', {
          headers: { 'Authorization': `Bearer ${authUser.token}` }
        })
      ]);

      console.log('📚 Classes API status:', classesRes.status);
      console.log('📚 Subjects API status:', subjectsRes.status);

      if (classesRes.ok && subjectsRes.ok) {
        const classesData = await classesRes.json();
        const subjectsData = await subjectsRes.json();
        
        console.log('✅ Classes data:', classesData);
        console.log('✅ Subjects data:', subjectsData);
        
        // Step 3: Test specific class students
        if (classesData.classes && classesData.classes.length > 0) {
          const firstClass = classesData.classes[0];
          console.log(`👥 Testing students for class: ${firstClass.name} (ID: ${firstClass.id})`);
          
          const studentsRes = await fetch(`/api/students?class_id=${firstClass.id}`, {
            headers: { 'Authorization': `Bearer ${authUser.token}` }
          });
          
          console.log('👥 Students API status:', studentsRes.status);
          
          if (studentsRes.ok) {
            const studentsData = await studentsRes.json();
            console.log('✅ Students data:', studentsData);
          } else {
            console.error('❌ Students API error:', await studentsRes.text());
          }
        }
        
        return {
          success: true,
          user: authUser,
          classes: classesData,
          subjects: subjectsData
        };
      } else {
        console.error('❌ Teacher APIs failed');
        if (!classesRes.ok) console.error('Classes error:', await classesRes.text());
        if (!subjectsRes.ok) console.error('Subjects error:', await subjectsRes.text());
        return { success: false, error: 'Teacher APIs failed' };
      }
    } else {
      console.error('❌ Login failed');
      return { success: false, error: 'Login failed' };
    }
  } catch (error) {
    console.error('❌ Test error:', error);
    return { success: false, error: error.message };
  }
}

// Run the test when page loads
window.addEventListener('load', () => {
  console.log('🚀 Starting test in 2 seconds...');
  setTimeout(testTeacherFlow, 2000);
});

// Add button to manually run test
document.addEventListener('DOMContentLoaded', () => {
  const button = document.createElement('button');
  button.textContent = 'Run Teacher Test';
  button.onclick = testTeacherFlow;
  button.style.cssText = 'padding: 10px 20px; margin: 10px; background: #0070f3; color: white; border: none; border-radius: 5px; cursor: pointer;';
  document.body.appendChild(button);
});
