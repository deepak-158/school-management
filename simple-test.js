// Simple test to check login and timetable access
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testLogin() {
  try {
    console.log('🔐 Testing login...');
    
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'principal',
        password: 'password123'
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.log('❌ Login failed:', error);
      return null;
    }    const data = await response.json();
    console.log('✅ Login successful!');
    console.log('User:', data.data.first_name, data.data.last_name, '(' + data.data.role + ')');
    
    return data.data.token;
  } catch (error) {
    console.error('❌ Login error:', error);
    return null;
  }
}

async function testTimetable(token) {
  try {
    console.log('\n📅 Testing timetable API...');
    
    const response = await fetch('http://localhost:3000/api/timetable', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.log('❌ Timetable failed:', error);
      return;
    }

    const data = await response.json();
    console.log('✅ Timetable API successful!');
    console.log(`📊 Retrieved ${data.timetable.length} timetable entries`);
    
    if (data.timetable.length > 0) {
      console.log('\n📋 Sample entries:');
      data.timetable.slice(0, 3).forEach((entry, i) => {
        console.log(`${i+1}. ${entry.day} ${entry.time_slot}: ${entry.subject_name} (${entry.class_name}) - ${entry.teacher_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Timetable error:', error);
  }
}

async function runTests() {
  const token = await testLogin();
  if (token) {
    await testTimetable(token);
  }
}

runTests();
