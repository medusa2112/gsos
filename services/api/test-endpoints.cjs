const http = require('http');

// Test data
const testStudent = {
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: '2010-05-15',
  gender: 'male',
  schoolId: 'school-123',
  classId: 'class-456',
  guardianIds: ['guardian-789'],
  enrollmentDate: '2024-09-01',
  status: 'active'
};

const testUpdate = {
  firstName: 'Jane',
  status: 'inactive'
};

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null
          };
          resolve(result);
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test functions
async function testHealthEndpoint() {
  console.log('\n🔍 Testing Health Endpoint...');
  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 3003,
      path: '/health',
      method: 'GET'
    });
    
    console.log(`Status: ${result.statusCode}`);
    console.log(`Response:`, result.body);
    return result.statusCode === 200;
  } catch (error) {
    console.error('Health check failed:', error.message);
    return false;
  }
}

async function testCreateStudent() {
  console.log('\n📝 Testing Create Student...');
  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 3003,
      path: '/students',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-jwt-token'
      }
    }, testStudent);
    
    console.log(`Status: ${result.statusCode}`);
    console.log(`Response:`, result.body);
    
    if (result.statusCode === 201 && result.body && result.body.id) {
      return result.body.id;
    }
    return null;
  } catch (error) {
    console.error('Create student failed:', error.message);
    return null;
  }
}

async function testGetStudent(studentId) {
  console.log(`\n👤 Testing Get Student (${studentId})...`);
  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 3003,
      path: `/students/${studentId}`,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer mock-jwt-token'
      }
    });
    
    console.log(`Status: ${result.statusCode}`);
    console.log(`Response:`, result.body);
    return result.statusCode === 200;
  } catch (error) {
    console.error('Get student failed:', error.message);
    return false;
  }
}

async function testUpdateStudent(studentId) {
  console.log(`\n✏️ Testing Update Student (${studentId})...`);
  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/students/${studentId}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-jwt-token'
      }
    }, testUpdate);
    
    console.log(`Status: ${result.statusCode}`);
    console.log(`Response:`, result.body);
    return result.statusCode === 200;
  } catch (error) {
    console.error('Update student failed:', error.message);
    return false;
  }
}

async function testListStudents() {
  console.log('\n📋 Testing List Students...');
  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/students',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer mock-jwt-token'
      }
    });
    
    console.log(`Status: ${result.statusCode}`);
    console.log(`Response:`, result.body);
    return result.statusCode === 200;
  } catch (error) {
    console.error('List students failed:', error.message);
    return false;
  }
}

async function testDeleteStudent(studentId) {
  console.log(`\n🗑️ Testing Delete Student (${studentId})...`);
  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/students/${studentId}`,
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer mock-jwt-token'
      }
    });
    
    console.log(`Status: ${result.statusCode}`);
    console.log(`Response:`, result.body);
    return result.statusCode === 200;
  } catch (error) {
    console.error('Delete student failed:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting API Endpoint Tests...');
  
  // Test health endpoint first
  const healthOk = await testHealthEndpoint();
  if (!healthOk) {
    console.log('❌ Health check failed. Server may not be running.');
    return;
  }
  
  console.log('✅ Health check passed!');
  
  // Test CRUD operations
  const studentId = await testCreateStudent();
  if (!studentId) {
    console.log('❌ Create student failed. Skipping other tests.');
    return;
  }
  
  console.log(`✅ Student created with ID: ${studentId}`);
  
  // Test get student
  const getOk = await testGetStudent(studentId);
  if (getOk) {
    console.log('✅ Get student passed!');
  } else {
    console.log('❌ Get student failed.');
  }
  
  // Test update student
  const updateOk = await testUpdateStudent(studentId);
  if (updateOk) {
    console.log('✅ Update student passed!');
  } else {
    console.log('❌ Update student failed.');
  }
  
  // Test list students
  const listOk = await testListStudents();
  if (listOk) {
    console.log('✅ List students passed!');
  } else {
    console.log('❌ List students failed.');
  }
  
  // Test delete student
  const deleteOk = await testDeleteStudent(studentId);
  if (deleteOk) {
    console.log('✅ Delete student passed!');
  } else {
    console.log('❌ Delete student failed.');
  }
  
  console.log('\n🎉 All tests completed!');
}

// Check if server is running first
async function checkServer() {
  try {
    await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/health',
      method: 'GET'
    });
    return true;
  } catch (error) {
    return false;
  }
}

// Run the tests
checkServer().then(isRunning => {
  if (isRunning) {
    runTests();
  } else {
    console.log('❌ Server is not running on localhost:3003');
    console.log('Please start the server first with: node test-server.cjs');
  }
});