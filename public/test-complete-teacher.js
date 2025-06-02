// Complete end-to-end test for teacher manage-results flow
async function completeTeacherTest() {
    console.log('🚀 Starting complete teacher test...');
    
    // Step 1: Clear any existing session
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    console.log('🧹 Cleared existing session');
    
    // Step 2: Login as teacher
    try {
        const loginResponse = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'ateacher001',
                password: 'teacher123'
            })
        });

        const loginResult = await loginResponse.json();
        console.log('🔐 Login response:', loginResult);

        if (!loginResult.success || !loginResult.data) {
            console.error('❌ Login failed');
            return;
        }

        const authUser = loginResult.data;
        console.log('✅ Login successful - User role:', authUser.role);
        
        // Store in localStorage (exactly like AuthContext)
        localStorage.setItem('auth_token', authUser.token);
        const { token, ...userWithoutToken } = authUser;
        localStorage.setItem('user_data', JSON.stringify(userWithoutToken));
        
        // Step 3: Navigate to manage-results page and verify APIs
        console.log('📄 Now navigate to /manage-results to test React frontend...');
        console.log('✅ You should see ONLY teacher APIs being called:');
        console.log('  - /api/teacher/classes');
        console.log('  - /api/teacher/subjects');
        console.log('❌ You should NOT see principal APIs:');
        console.log('  - /api/classes');
        console.log('  - /api/results/manage');
        
        // Wait a moment then navigate programmatically
        setTimeout(() => {
            console.log('🔄 Navigating to manage-results page...');
            window.location.href = '/manage-results';
        }, 2000);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Auto-run test
window.addEventListener('load', () => {
    setTimeout(completeTeacherTest, 1000);
});

// Manual run button
document.addEventListener('DOMContentLoaded', () => {
    const button = document.createElement('button');
    button.textContent = 'Run Complete Teacher Test';
    button.onclick = completeTeacherTest;
    button.style.cssText = 'padding: 15px 30px; margin: 20px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;';
    document.body.appendChild(button);
    
    const instructions = document.createElement('div');
    instructions.innerHTML = `
        <h2>Teacher Login Test Instructions</h2>
        <ol>
            <li>Click the button above or wait for auto-test</li>
            <li>Watch the console for login process</li>
            <li>You'll be redirected to /manage-results automatically</li>
            <li>Check the browser developer console and network tab</li>
            <li>Verify only teacher APIs are called (no principal APIs)</li>
        </ol>
        <p><strong>Expected behavior:</strong> Only teacher-specific APIs should be called, fixing the race condition.</p>
    `;
    instructions.style.cssText = 'margin: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px; font-family: Arial, sans-serif;';
    document.body.appendChild(instructions);
});
