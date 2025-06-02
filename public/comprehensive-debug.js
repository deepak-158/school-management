// Comprehensive frontend debugging - simulate exact React behavior
async function comprehensiveFrontendTest() {
  console.log('🎯 COMPREHENSIVE FRONTEND DEBUG');
  console.log('===============================');
  
  // Clear everything to start fresh
  localStorage.clear();
  sessionStorage.clear();
  
  console.log('🔄 Step 1: Fresh start (cleared storage)');
  
  // Simulate login (like AuthContext.login)
  console.log('\n🔐 Step 2: Login Process');
  try {
    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ateacher001', password: 'teacher123' })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed:', loginResponse.status);
      return;
    }
    
    const result = await loginResponse.json();
    if (result.success && result.data) {
      const authUser = result.data;
      
      // Store like AuthContext does
      localStorage.setItem('auth_token', authUser.token);
      const { token, ...userWithoutToken } = authUser;
      localStorage.setItem('user_data', JSON.stringify(userWithoutToken));
      
      console.log('✅ Login successful and data stored');
      console.log('   User role:', authUser.role);
      console.log('   Token stored:', !!localStorage.getItem('auth_token'));
      console.log('   User data stored:', !!localStorage.getItem('user_data'));
    } else {
      console.log('❌ Login response format error');
      return;
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
    return;
  }
  
  // Simulate manage-results page loading (fetchTeacherData)
  console.log('\n📚 Step 3: Fetch Teacher Data (like fetchTeacherData)');
  try {
    const token = localStorage.getItem('auth_token');
    
    const [classesRes, subjectsRes] = await Promise.all([
      fetch('/api/teacher/classes', {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch('/api/teacher/subjects', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ]);
    
    let classes = [];
    let subjects = [];
    
    if (classesRes.ok && subjectsRes.ok) {
      const classesData = await classesRes.json();
      const subjectsData = await subjectsRes.json();
      classes = classesData.classes || [];
      subjects = subjectsData.subjects || [];
      
      console.log('✅ Teacher data loaded successfully');
      console.log(`   Classes: ${classes.length}`);
      console.log(`   Subjects: ${subjects.length}`);
      
      if (classes.length > 0) {
        console.log('   First class:', classes[0]);
      }
      if (subjects.length > 0) {
        console.log('   First subject:', subjects[0]);
      }
    } else {
      console.log('❌ Failed to load teacher data');
      console.log(`   Classes status: ${classesRes.status}`);
      console.log(`   Subjects status: ${subjectsRes.status}`);
      return;
    }
    
    // Simulate user selecting first class and subject
    console.log('\n🎯 Step 4: Simulate User Selection');
    if (classes.length > 0 && subjects.length > 0) {
      const selectedClass = classes[0].class_id; // Note: subjects have class_id
      const selectedSubject = subjects[0].id;
      
      console.log(`   Selected class: ${selectedClass}`);
      console.log(`   Selected subject: ${selectedSubject}`);
      
      // Simulate fetchStudentsAndResults
      console.log('\n👥 Step 5: Fetch Students and Results (like fetchStudentsAndResults)');
      
      const [studentsRes, resultsRes] = await Promise.all([
        fetch(`/api/students?class_id=${selectedClass}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/results?class_id=${selectedClass}&subject_id=${selectedSubject}&exam_type=First Term Exam`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      let studentsData = null;
      let resultsData = null;
      
      if (studentsRes.ok) {
        studentsData = await studentsRes.json();
        console.log(`✅ Students API success: ${studentsData.students?.length || 0} students`);
        if (studentsData.students?.length > 0) {
          console.log('   First student:', studentsData.students[0].first_name, studentsData.students[0].last_name);
        }
      } else {
        console.log(`❌ Students API failed: ${studentsRes.status}`);
        const errorText = await studentsRes.text();
        console.log('   Error:', errorText);
      }
      
      if (resultsRes.ok) {
        resultsData = await resultsRes.json();
        console.log(`✅ Results API success: ${resultsData.results?.length || 0} results`);
      } else {
        console.log(`❌ Results API failed: ${resultsRes.status}`);
        const errorText = await resultsRes.text();
        console.log('   Error:', errorText);
      }
      
      // Simulate the exact conditional check that shows "no students found"
      console.log('\n🔍 Step 6: Frontend Condition Check');
      const viewMode = 'add';
      const students = studentsData?.students || [];
      
      console.log(`   viewMode === 'add': ${viewMode === 'add'}`);
      console.log(`   selectedClass: ${selectedClass} (truthy: ${!!selectedClass})`);
      console.log(`   selectedSubject: ${selectedSubject} (truthy: ${!!selectedSubject})`);
      console.log(`   students.length: ${students.length}`);
      console.log(`   students.length === 0: ${students.length === 0}`);
      
      const showNoStudents = viewMode === 'add' && selectedClass && selectedSubject && students.length === 0;
      console.log(`   Should show "No students found": ${showNoStudents}`);
      
      if (showNoStudents) {
        console.log('❌ FRONTEND WOULD SHOW: "No students found for the selected class."');
      } else if (students.length > 0) {
        console.log('✅ FRONTEND WOULD SHOW: Students table with data');
      } else {
        console.log('ℹ️  FRONTEND WOULD SHOW: "Please select a class and subject"');
      }
      
    } else {
      console.log('❌ No classes or subjects to select');
    }
    
  } catch (error) {
    console.log('❌ Teacher data error:', error.message);
  }
  
  console.log('\n🎉 COMPREHENSIVE TEST COMPLETE');
  console.log('================================');
}

comprehensiveFrontendTest();
