const fetch = require('node-fetch');

(async () => {
  try {
    console.log('Testing login with ateacher001...');
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'ateacher001',
        password: 'password123'
      })
    });
    
    const result = await response.json();
    console.log('Login result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      const token = result.data.token;
      console.log('\n=== Testing Teacher APIs ===');
      
      // Test classes
      const classesRes = await fetch('http://localhost:3000/api/teacher/classes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const classesData = await classesRes.json();
      console.log('Classes:', JSON.stringify(classesData, null, 2));
      
      // Test subjects  
      const subjectsRes = await fetch('http://localhost:3000/api/teacher/subjects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const subjectsData = await subjectsRes.json();
      console.log('Subjects:', JSON.stringify(subjectsData, null, 2));
      
      // Test students with first class
      if (classesData.classes && classesData.classes.length > 0) {
        const firstClass = classesData.classes[0];
        console.log(`\nTesting students for class ${firstClass.id}...`);
        
        const studentsRes = await fetch(`http://localhost:3000/api/students?class_id=${firstClass.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const studentsData = await studentsRes.json();
        console.log('Students:', JSON.stringify(studentsData, null, 2));
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
