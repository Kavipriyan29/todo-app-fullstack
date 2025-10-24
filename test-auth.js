// Test script for authentication system
const testAuth = async () => {
    console.log('🧪 Testing authentication system...\n');

    // Test 1: Health check
    try {
        const healthResponse = await fetch('http://localhost:3000/api/health');
        const healthData = await healthResponse.json();
        console.log('✅ Health check:', healthData);
    } catch (error) {
        console.log('❌ Health check failed:', error.message);
    }

    // Test 2: Test signup
    try {
        const signupResponse = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'testuser',
                email: 'test@example.com',
                password: 'testpass123',
                firstName: 'Test',
                lastName: 'User'
            })
        });
        const signupData = await signupResponse.json();
        console.log('✅ Signup test:', signupData);
    } catch (error) {
        console.log('❌ Signup test failed:', error.message);
    }

    // Test 3: Test login
    try {
        const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'testpass123'
            })
        });
        const loginData = await loginResponse.json();
        console.log('✅ Login test:', loginData);
    } catch (error) {
        console.log('❌ Login test failed:', error.message);
    }

    console.log('\n🧪 Authentication tests completed!');
};

// Run tests
testAuth();
