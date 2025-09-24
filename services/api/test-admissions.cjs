const http = require('http');

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsedBody = body ? JSON.parse(body) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsedBody
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test functions
async function testHealthCheck() {
  console.log('🔍 Testing Health Endpoint...');
  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 3003,
      path: '/health',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Status:', result.statusCode);
    console.log('Response:', result.body);
    
    if (result.statusCode === 200) {
      console.log('✅ Health check passed!');
      return true;
    } else {
      console.log('❌ Health check failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return false;
  }
}

async function testCreateAdmission() {
  console.log('\n📝 Testing Create Admission...');
  try {
    const admissionData = {
      firstName: 'Alice',
      lastName: 'Johnson',
      dateOfBirth: '2012-03-15',
      gender: 'female',
      appliedGrade: 'Year 7',
      appliedYearGroup: 'Year 7',
      preferredStartDate: '2024-09-01',
      nationality: 'British',
      previousSchool: 'Primary School ABC',
      guardians: [
        {
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@email.com',
          phone: '+44 7700 900123',
          relationship: 'mother',
          isPrimary: true
        },
        {
          firstName: 'David',
          lastName: 'Johnson',
          email: 'david.johnson@email.com',
          phone: '+44 7700 900124',
          relationship: 'father',
          isPrimary: false
        }
      ]
    };

    const result = await makeRequest({
      hostname: 'localhost',
      port: 3003,
      path: '/admissions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, admissionData);

    console.log('Status:', result.statusCode);
    console.log('Response:', result.body);
    
    if (result.statusCode === 201 && result.body.id) {
      console.log('✅ Admission created with ID:', result.body.id);
      return result.body.id;
    } else {
      console.log('❌ Create admission failed');
      return null;
    }
  } catch (error) {
    console.log('❌ Create admission failed:', error.message);
    return null;
  }
}

async function testGetAdmission(admissionId) {
  console.log(`\n👤 Testing Get Admission (${admissionId})...`);
  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 3003,
      path: `/admissions/${admissionId}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Status:', result.statusCode);
    console.log('Response:', result.body);
    
    if (result.statusCode === 200) {
      console.log('✅ Get admission passed!');
      return true;
    } else {
      console.log('❌ Get admission failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Get admission failed:', error.message);
    return false;
  }
}

async function testListAdmissions() {
  console.log('\n📋 Testing List Admissions...');
  try {
    const result = await makeRequest({
      hostname: 'localhost',
      port: 3003,
      path: '/admissions',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Status:', result.statusCode);
    console.log('Response:', result.body);
    
    if (result.statusCode === 200 && Array.isArray(result.body.admissions)) {
      console.log('✅ List admissions passed!');
      return true;
    } else {
      console.log('❌ List admissions failed');
      return false;
    }
  } catch (error) {
    console.log('❌ List admissions failed:', error.message);
    return false;
  }
}

async function testUpdateAdmission(admissionId) {
  console.log(`\n✏️ Testing Update Admission (${admissionId})...`);
  try {
    const updateData = {
      status: 'under_review',
      assessmentScore: 85,
      assessmentNotes: 'Strong performance in mathematics and science'
    };

    const result = await makeRequest({
      hostname: 'localhost',
      port: 3003,
      path: `/admissions/${admissionId}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      }
    }, updateData);

    console.log('Status:', result.statusCode);
    console.log('Response:', result.body);
    
    if (result.statusCode === 200) {
      console.log('✅ Update admission passed!');
      return true;
    } else {
      console.log('❌ Update admission failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Update admission failed:', error.message);
    return false;
  }
}

async function testGeneratePresignedUrl(admissionId) {
  console.log(`\n📎 Testing Generate Pre-signed URL for admission (${admissionId})...`);
  try {
    const uploadData = {
      filename: 'birth_certificate.pdf',
      contentType: 'application/pdf',
      admissionId: admissionId
    };

    const result = await makeRequest({
      hostname: 'localhost',
      port: 3003,
      path: '/admissions/upload-url',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, uploadData);

    console.log('Status:', result.statusCode);
    console.log('Response:', result.body);
    
    if (result.statusCode === 200 && result.body.presignedUrl) {
      console.log('✅ Generate pre-signed URL passed!');
      return result.body.s3Key;
    } else {
      console.log('❌ Generate pre-signed URL failed');
      return null;
    }
  } catch (error) {
    console.log('❌ Generate pre-signed URL failed:', error.message);
    return null;
  }
}

async function testAddDocument(admissionId, s3Key) {
  console.log(`\n📄 Testing Add Document to admission (${admissionId})...`);
  try {
    const documentData = {
      type: 'birth_certificate',
      filename: 'birth_certificate.pdf',
      s3Key: s3Key
    };

    const result = await makeRequest({
      hostname: 'localhost',
      port: 3003,
      path: `/admissions/${admissionId}/documents`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, documentData);

    console.log('Status:', result.statusCode);
    console.log('Response:', result.body);
    
    if (result.statusCode === 200) {
      console.log('✅ Add document passed!');
      return true;
    } else {
      console.log('❌ Add document failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Add document failed:', error.message);
    return false;
  }
}

async function testConvertToStudent(admissionId) {
  console.log(`\n🎓 Testing Convert to Student (${admissionId})...`);
  try {
    // First update admission to accepted status
    await makeRequest({
      hostname: 'localhost',
      port: 3003,
      path: `/admissions/${admissionId}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      }
    }, { status: 'offer_accepted' });

    // Then convert to student
    const result = await makeRequest({
      hostname: 'localhost',
      port: 3003,
      path: `/admissions/${admissionId}/convert`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Status:', result.statusCode);
    console.log('Response:', result.body);
    
    if (result.statusCode === 200 && result.body.studentId) {
      console.log('✅ Convert to student passed!');
      return true;
    } else {
      console.log('❌ Convert to student failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Convert to student failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Admissions API Endpoint Tests...\n');

  let admissionId = null;
  let s3Key = null;

  // Test health check first
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('\n❌ Health check failed, stopping tests');
    return;
  }

  // Test create admission
  admissionId = await testCreateAdmission();
  if (!admissionId) {
    console.log('\n❌ Create admission failed, stopping tests');
    return;
  }

  // Test get admission
  await testGetAdmission(admissionId);

  // Test list admissions
  await testListAdmissions();

  // Test update admission
  await testUpdateAdmission(admissionId);

  // Test generate pre-signed URL
  s3Key = await testGeneratePresignedUrl(admissionId);
  if (s3Key) {
    // Test add document
    await testAddDocument(admissionId, s3Key);
  }

  // Test convert to student
  await testConvertToStudent(admissionId);

  console.log('\n🎉 All admissions tests completed!');
}

// Check if server is running and run tests
const healthCheck = http.request({
  hostname: 'localhost',
  port: 3003,
  path: '/health',
  method: 'GET'
}, (res) => {
  if (res.statusCode === 200) {
    runTests();
  } else {
    console.log('❌ Server is not running on localhost:3003');
    console.log('Please start the server first with: node test-server.cjs');
  }
});

healthCheck.on('error', (error) => {
  console.log('❌ Server is not running on localhost:3003');
  console.log('Please start the server first with: node test-server.cjs');
});

healthCheck.end();