// Test principal login and results access
const baseUrl = 'http://localhost:3001';

async function testPrincipalResults() {
  console.log('=== Testing Principal Results Functionality ===\n');

  try {
    // 1. Login as principal
    console.log('1. Logging in as principal...');    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },      body: JSON.stringify({
        username: 'principal',
        password: 'admin123'
      }),
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.text();
      throw new Error(`Login failed: ${error}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Principal login successful');
    
    const token = loginData.token;

    // 2. Test search results API
    console.log('\n2. Testing search results API...');
    const searchResponse = await fetch(`${baseUrl}/api/results/search?query=Aarav&academic_year=2024-2025`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!searchResponse.ok) {
      throw new Error(`Search API failed: ${searchResponse.status} ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    console.log(`✅ Search API working - Found ${searchData.results ? searchData.results.length : 0} results`);
    
    if (searchData.results && searchData.results.length > 0) {
      console.log('Sample search result:', {
        student_name: searchData.results[0].student_name,
        class_name: searchData.results[0].class_name,
        subject_name: searchData.results[0].subject_name,
        marks: `${searchData.results[0].obtained_marks}/${searchData.results[0].max_marks}`,
        grade: searchData.results[0].grade
      });
    }

    // 3. Test view all results API
    console.log('\n3. Testing view all results API...');
    const viewAllResponse = await fetch(`${baseUrl}/api/results?include_all=true&academic_year=2024-2025`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!viewAllResponse.ok) {
      throw new Error(`View all API failed: ${viewAllResponse.status} ${viewAllResponse.statusText}`);
    }

    const viewAllData = await viewAllResponse.json();
    console.log(`✅ View all API working - Found ${viewAllData.results ? viewAllData.results.length : 0} results`);
    
    if (viewAllData.results && viewAllData.results.length > 0) {
      console.log('Sample view all result:', {
        student_name: viewAllData.results[0].student_name,
        class_name: viewAllData.results[0].class_name,
        subject_name: viewAllData.results[0].subject_name,
        marks: `${viewAllData.results[0].obtained_marks}/${viewAllData.results[0].max_marks}`,
        grade: viewAllData.results[0].grade
      });
    }

    // 4. Test principal dashboard access
    console.log('\n4. Testing principal management API...');
    const manageResponse = await fetch(`${baseUrl}/api/results/manage?include_class_subjects=true`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!manageResponse.ok) {
      throw new Error(`Management API failed: ${manageResponse.status} ${manageResponse.statusText}`);
    }

    const manageData = await manageResponse.json();
    console.log('✅ Management API working');
    console.log('Available data:', Object.keys(manageData.data || {}));

    console.log('\n=== Test Summary ===');
    console.log('✅ Principal login successful');
    console.log('✅ Search results API working');
    console.log('✅ View all results API working'); 
    console.log('✅ Management API working');
    console.log('\n🎉 All API tests passed! Principal should now be able to view results.');
    console.log('\n📋 Next steps:');
    console.log('1. Open http://localhost:3001 in your browser');
    console.log('2. Login as principal: principal@vidyalaya.edu.in / admin123');
    console.log('3. Go to "Manage Results" page');
    console.log('4. Try "Search Results" and "View All" buttons');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPrincipalResults();
