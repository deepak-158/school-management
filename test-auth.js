const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const db = new Database('school.db');

// Test user authentication
async function testLogin(username, password) {
    console.log(`\nTesting login for: ${username}`);
    
    try {
        // Get user from database
        const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        
        if (!user) {
            console.log('❌ User not found');
            return false;
        }
        
        console.log(`✅ User found: ${user.first_name} ${user.last_name} (${user.role})`);
        
        // Check password
        const isValid = await bcrypt.compare(password, user.password_hash);
        
        if (isValid) {
            console.log('✅ Password is correct');
            
            // Get additional profile data based on role
            if (user.role === 'student') {
                const student = db.prepare('SELECT * FROM students WHERE user_id = ?').get(user.id);
                console.log('Student data:', {
                    student_id: student?.student_id,
                    class_id: student?.class_id,
                    guardian_name: student?.guardian_name
                });
            } else if (user.role === 'teacher') {
                const teacher = db.prepare('SELECT * FROM teachers WHERE user_id = ?').get(user.id);
                console.log('Teacher data:', {
                    employee_id: teacher?.employee_id,
                    qualification: teacher?.qualification,
                    subjects: teacher?.subjects
                });
            }
            
            return true;
        } else {
            console.log('❌ Incorrect password');
            return false;
        }
    } catch (error) {
        console.error('❌ Authentication error:', error.message);
        return false;
    }
}

// Test all sample users
async function runTests() {
    console.log('=== Authentication Tests ===');
    
    await testLogin('principal', 'password123');
    await testLogin('teacher1', 'password123');
    await testLogin('teacher2', 'password123');
    await testLogin('student1', 'password123');
    await testLogin('student2', 'password123');
    
    // Test with wrong password
    await testLogin('principal', 'wrongpassword');
    
    console.log('\n=== Tests completed ===');
}

runTests().then(() => {
    db.close();
}).catch(error => {
    console.error('Test error:', error);
    db.close();
});
