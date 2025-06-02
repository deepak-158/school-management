// Test all possible principal credentials
const baseUrl = 'http://localhost:3001';

async function testAllCredentials() {
  console.log('=== Testing All Possible Principal Credentials ===\n');

  const credentialCombinations = [
    { username: 'principal', password: 'admin123' },
    { username: 'principal@vidyalaya.edu.in', password: 'admin123' },
    { username: 'admin', password: 'admin123' },
    { username: 'principal', password: 'principal' },
    { username: 'principal', password: 'password' },
    { username: 'principal', password: '123456' }
  ];

  for (let i = 0; i < credentialCombinations.length; i++) {
    const creds = credentialCombinations[i];
    console.log(`${i + 1}. Testing: ${creds.username} / ${creds.password}`);

    try {
      const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(creds),
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log('✅ SUCCESS! Valid credentials found:');
        console.log(`   Username: ${creds.username}`);
        console.log(`   Password: ${creds.password}`);
        console.log(`   Token: ${loginData.token ? 'Received' : 'Missing'}`);
        return creds;
      } else {
        const error = await loginResponse.text();
        console.log(`❌ Failed: ${error.substring(0, 100)}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n❌ No valid credentials found from the tested combinations.');
  console.log('Try manually logging in through the browser to check credentials.');
  return null;
}

testAllCredentials();
