// Debug Frontend Data Flow
const debug = async () => {
  console.log('=== FRONTEND DEBUG FLOW ===');
  
  // Check localStorage first
  const token = localStorage.getItem('auth_token');
  const userData = localStorage.getItem('user_data');
  
  console.log('1. LocalStorage Check:');
  console.log('   Token exists:', !!token);
  console.log('   User data exists:', !!userData);
  
  if (userData) {
    try {
      const user = JSON.parse(userData);
      console.log('   User role:', user.role);
      console.log('   User ID:', user.id);
    } catch (e) {
      console.log('   Error parsing user data:', e);
    }
  }
  
  if (!token) {
    console.log('❌ No auth token found. Need to login first.');
    return;
  }
  
  // Test teacher classes API
  console.log('\n2. Testing Teacher Classes API:');
  try {
    const classesRes = await fetch('/api/teacher/classes', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('   Status:', classesRes.status);
    
    if (classesRes.ok) {
      const classesData = await classesRes.json();
      console.log('   Classes response:', classesData);
      console.log('   Number of classes:', classesData.classes?.length || 0);
    } else {
      const error = await classesRes.text();
      console.log('   Error:', error);
    }
  } catch (e) {
    console.log('   Fetch error:', e);
  }
  
  // Test teacher subjects API
  console.log('\n3. Testing Teacher Subjects API:');
  try {
    const subjectsRes = await fetch('/api/teacher/subjects', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('   Status:', subjectsRes.status);
    
    if (subjectsRes.ok) {
      const subjectsData = await subjectsRes.json();
      console.log('   Subjects response:', subjectsData);
      console.log('   Number of subjects:', subjectsData.subjects?.length || 0);
      
      if (subjectsData.subjects?.length > 0) {
        console.log('   First subject:', subjectsData.subjects[0]);
      }
    } else {
      const error = await subjectsRes.text();
      console.log('   Error:', error);
    }
  } catch (e) {
    console.log('   Fetch error:', e);
  }
  
  // Test students API with first available class
  console.log('\n4. Testing Students API:');
  try {
    // Get first class to test with
    const classesRes = await fetch('/api/teacher/classes', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (classesRes.ok) {
      const classesData = await classesRes.json();
      const firstClass = classesData.classes?.[0];
      
      if (firstClass) {
        console.log('   Testing with class ID:', firstClass.id);
        
        const studentsRes = await fetch(`/api/students?class_id=${firstClass.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('   Students API status:', studentsRes.status);
        
        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          console.log('   Students response:', studentsData);
          console.log('   Number of students:', studentsData.students?.length || 0);
          
          if (studentsData.students?.length > 0) {
            console.log('   First student:', studentsData.students[0]);
          }
        } else {
          const error = await studentsRes.text();
          console.log('   Students API error:', error);
        }
      } else {
        console.log('   No classes available to test students API');
      }
    }
  } catch (e) {
    console.log('   Students API fetch error:', e);
  }
  
  console.log('\n=== DEBUG COMPLETE ===');
};

// Run debug
debug().catch(console.error);
