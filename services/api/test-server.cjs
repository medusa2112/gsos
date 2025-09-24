const http = require('http');
const { URL } = require('url');

// Mock data store
const mockStudents = new Map();
const mockAttendance = new Map(); // Store attendance records by date-period-classId
const mockBehaviour = new Map(); // Store behaviour records by id
const mockInvoices = new Map(); // Store invoices by id
const mockPayments = new Map(); // Store payments by id

// Helper functions
function generateId() {
  return `student-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateAttendanceId() {
  return `attendance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateBehaviourId() {
  return `behaviour-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateInvoiceId() {
  return `invoice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generatePaymentId() {
  return `payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const sequence = String(mockInvoices.size + 1).padStart(4, '0');
  return `INV-${year}-${sequence}`;
}

function validateRole(headers, allowedRoles) {
  // Simple role validation - in production this would check JWT tokens
  const userRole = headers['x-user-role'] || 'student';
  return allowedRoles.includes(userRole);
}

// Initialize sample invoice and payment data
function initializeSampleFinanceData() {
  // Sample invoices
  const invoice1 = {
    id: 'invoice-001',
    schoolId: 'school-001',
    studentId: 'student-001',
    invoiceNumber: 'INV-2025-0001',
    status: 'sent',
    title: 'Term 1 Tuition Fees',
    description: 'Tuition fees for Term 1 2025',
    lineItems: [
      {
        description: 'Tuition Fee',
        quantity: 1,
        unitPrice: 2500.00,
        amount: 2500.00,
        category: 'tuition'
      },
      {
        description: 'Technology Fee',
        quantity: 1,
        unitPrice: 150.00,
        amount: 150.00,
        category: 'technology'
      }
    ],
    subtotal: 2650.00,
    taxRate: 0.20,
    taxAmount: 530.00,
    total: 3180.00,
    currency: 'GBP',
    issueDate: '2025-01-15',
    dueDate: '2025-02-15',
    createdBy: 'admin-001',
    createdAt: '2025-01-15T09:00:00Z',
    updatedAt: '2025-01-15T09:00:00Z'
  };

  const invoice2 = {
    id: 'invoice-002',
    schoolId: 'school-001',
    studentId: 'student-002',
    invoiceNumber: 'INV-2025-0002',
    status: 'paid',
    title: 'Term 1 Tuition Fees',
    description: 'Tuition fees for Term 1 2025',
    lineItems: [
      {
        description: 'Tuition Fee',
        quantity: 1,
        unitPrice: 2500.00,
        amount: 2500.00,
        category: 'tuition'
      },
      {
        description: 'Scholarship Discount',
        quantity: 1,
        unitPrice: -500.00,
        amount: -500.00,
        category: 'scholarship'
      }
    ],
    subtotal: 2000.00,
    taxRate: 0.20,
    taxAmount: 400.00,
    total: 2400.00,
    currency: 'GBP',
    issueDate: '2025-01-15',
    dueDate: '2025-02-15',
    paidDate: '2025-01-20',
    paymentMethod: 'stripe',
    paymentReference: 'pi_1234567890',
    createdBy: 'admin-001',
    createdAt: '2025-01-15T09:00:00Z',
    updatedAt: '2025-01-20T14:30:00Z'
  };

  mockInvoices.set(invoice1.id, invoice1);
  mockInvoices.set(invoice2.id, invoice2);

  // Sample payments
  const payment1 = {
    id: 'payment-001',
    schoolId: 'school-001',
    studentId: 'student-002',
    invoiceId: 'invoice-002',
    amount: 2400.00,
    currency: 'GBP',
    status: 'succeeded',
    method: 'stripe',
    reference: 'pi_1234567890',
    description: 'Payment for Term 1 Tuition Fees',
    stripePaymentIntentId: 'pi_1234567890',
    stripeChargeId: 'ch_1234567890',
    paymentDate: '2025-01-20T14:30:00Z',
    createdAt: '2025-01-20T14:30:00Z',
    updatedAt: '2025-01-20T14:30:00Z'
  };

  mockPayments.set(payment1.id, payment1);
}

// Initialize sample data
initializeSampleFinanceData();

function createResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,x-user-role,x-user-id,x-student-id',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Credentials': 'true'
    },
    body: JSON.stringify(body)
  };
}

function validateCreateRequest(data) {
  if (!data.firstName || !data.lastName || !data.dateOfBirth || !data.gender || 
      !data.schoolId || !data.guardianIds || !data.enrollmentDate) {
    return null;
  }
  
  return {
    firstName: data.firstName,
    lastName: data.lastName,
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
    schoolId: data.schoolId,
    classId: data.classId,
    guardianIds: Array.isArray(data.guardianIds) ? data.guardianIds : [data.guardianIds],
    enrollmentDate: data.enrollmentDate,
    status: data.status || 'active'
  };
}

// Handler functions
async function createStudent(event) {
  try {
    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const requestData = JSON.parse(event.body);
    const validatedData = validateCreateRequest(requestData);
    
    if (!validatedData) {
      return createResponse(400, { error: 'Invalid request data' });
    }

    const id = generateId();
    const now = new Date().toISOString();
    
    const student = {
      id,
      ...validatedData,
      createdAt: now,
      updatedAt: now
    };

    mockStudents.set(id, student);

    return createResponse(201, student);
  } catch (error) {
    console.error('Error creating student:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

async function getStudent(event) {
  try {
    const studentId = event.pathParameters?.id;
    
    if (!studentId) {
      return createResponse(400, { error: 'Student ID is required' });
    }

    const student = mockStudents.get(studentId);
    
    if (!student) {
      return createResponse(404, { error: 'Student not found' });
    }

    return createResponse(200, student);
  } catch (error) {
    console.error('Error getting student:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

async function updateStudent(event) {
  try {
    const studentId = event.pathParameters?.id;
    
    if (!studentId) {
      return createResponse(400, { error: 'Student ID is required' });
    }

    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const student = mockStudents.get(studentId);
    
    if (!student) {
      return createResponse(404, { error: 'Student not found' });
    }

    const updateData = JSON.parse(event.body);
    
    const updatedStudent = {
      ...student,
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    mockStudents.set(studentId, updatedStudent);

    return createResponse(200, updatedStudent);
  } catch (error) {
    console.error('Error updating student:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

async function listStudents(event) {
  try {
    const students = Array.from(mockStudents.values());
    
    // Simple pagination
    const limit = parseInt(event.queryStringParameters?.limit || '10');
    const offset = parseInt(event.queryStringParameters?.offset || '0');
    
    const paginatedStudents = students.slice(offset, offset + limit);
    
    return createResponse(200, {
      students: paginatedStudents,
      total: students.length,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error listing students:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

async function deleteStudent(event) {
  try {
    const studentId = event.pathParameters?.id;
    
    if (!studentId) {
      return createResponse(400, { error: 'Student ID is required' });
    }

    const student = mockStudents.get(studentId);
    
    if (!student) {
      return createResponse(404, { error: 'Student not found' });
    }

    mockStudents.delete(studentId);

    return createResponse(200, { message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

// Attendance handler functions
async function markAttendance(event, headers) {
  try {
    // Check role permissions - only teachers and admins can mark attendance
    if (!validateRole(headers, ['teacher', 'admin'])) {
      return createResponse(403, { error: 'Insufficient permissions to mark attendance' });
    }

    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const data = JSON.parse(event.body);
    
    // Validate required fields
    if (!data.classId || !data.date || !data.period || !Array.isArray(data.students)) {
      return createResponse(400, { 
        error: 'classId, date, period, and students array are required' 
      });
    }

    const attendanceKey = `${data.date}-${data.period}-${data.classId}`;
    const attendanceRecord = {
      id: generateAttendanceId(),
      classId: data.classId,
      date: data.date,
      period: data.period,
      markedBy: headers['x-user-id'] || 'unknown',
      markedAt: new Date().toISOString(),
      students: data.students.map(student => ({
        studentId: student.studentId,
        status: student.status || 'present', // present, absent, late, excused
        notes: student.notes || null
      }))
    };

    mockAttendance.set(attendanceKey, attendanceRecord);

    return createResponse(201, {
      message: 'Attendance marked successfully',
      attendance: attendanceRecord
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

async function getAttendance(event, headers) {
  try {
    const params = event.queryStringParameters || {};
    const { studentId, from, to, classId } = params;

    // Role-based filtering
    const userRole = headers['x-user-role'] || 'student';
    const userId = headers['x-user-id'];

    let attendanceRecords = Array.from(mockAttendance.values());

    // Filter by student if specified
    if (studentId) {
      // Students can only view their own attendance
      if (userRole === 'student' && userId !== studentId) {
        return createResponse(403, { error: 'Students can only view their own attendance' });
      }
      
      attendanceRecords = attendanceRecords.filter(record => 
        record.students.some(s => s.studentId === studentId)
      );
    } else if (userRole === 'student') {
      // If no studentId specified and user is student, show only their records
      attendanceRecords = attendanceRecords.filter(record => 
        record.students.some(s => s.studentId === userId)
      );
    }

    // Filter by date range
    if (from) {
      attendanceRecords = attendanceRecords.filter(record => record.date >= from);
    }
    if (to) {
      attendanceRecords = attendanceRecords.filter(record => record.date <= to);
    }

    // Filter by class
    if (classId) {
      attendanceRecords = attendanceRecords.filter(record => record.classId === classId);
    }

    // For students, only return their specific attendance data
    if (userRole === 'student') {
      attendanceRecords = attendanceRecords.map(record => ({
        ...record,
        students: record.students.filter(s => s.studentId === (studentId || userId))
      }));
    }

    return createResponse(200, {
      attendance: attendanceRecords,
      total: attendanceRecords.length
    });
  } catch (error) {
    console.error('Error getting attendance:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

// Behaviour handler functions
async function recordBehaviour(event, headers) {
  try {
    // Check role permissions - only teachers and admins can record behaviour
    if (!validateRole(headers, ['teacher', 'admin'])) {
      return createResponse(403, { error: 'Insufficient permissions to record behaviour' });
    }

    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const data = JSON.parse(event.body);
    
    // Validate required fields
    if (!data.studentId || !data.type || !data.description) {
      return createResponse(400, { 
        error: 'studentId, type, and description are required' 
      });
    }

    const behaviourRecord = {
      id: generateBehaviourId(),
      studentId: data.studentId,
      type: data.type, // positive, negative, neutral
      category: data.category || 'general', // academic, social, disciplinary, safeguarding
      description: data.description,
      severity: data.severity || 'low', // low, medium, high, critical
      safeguardingFlag: data.safeguardingFlag || false,
      recordedBy: headers['x-user-id'] || 'unknown',
      recordedAt: new Date().toISOString(),
      followUpRequired: data.followUpRequired || false,
      followUpNotes: data.followUpNotes || null,
      parentNotified: data.parentNotified || false,
      classId: data.classId || null,
      subject: data.subject || null
    };

    mockBehaviour.set(behaviourRecord.id, behaviourRecord);

    return createResponse(201, {
      message: 'Behaviour record created successfully',
      behaviour: behaviourRecord
    });
  } catch (error) {
    console.error('Error recording behaviour:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

async function getBehaviour(event, headers) {
  try {
    const params = event.queryStringParameters || {};
    const { studentId, from, to, type, safeguardingOnly } = params;

    // Role-based access control
    const userRole = headers['x-user-role'] || 'student';
    const userId = headers['x-user-id'];

    let behaviourRecords = Array.from(mockBehaviour.values());

    // Students cannot access behaviour records
    if (userRole === 'student') {
      return createResponse(403, { error: 'Students cannot access behaviour records' });
    }

    // Filter by student if specified
    if (studentId) {
      behaviourRecords = behaviourRecords.filter(record => record.studentId === studentId);
    }

    // Filter by date range
    if (from) {
      behaviourRecords = behaviourRecords.filter(record => record.recordedAt >= from);
    }
    if (to) {
      behaviourRecords = behaviourRecords.filter(record => record.recordedAt <= to);
    }

    // Filter by type
    if (type) {
      behaviourRecords = behaviourRecords.filter(record => record.type === type);
    }

    // Filter safeguarding records - only accessible to admin and designated staff
    if (safeguardingOnly === 'true') {
      if (!validateRole(headers, ['admin', 'safeguarding_lead'])) {
        return createResponse(403, { error: 'Insufficient permissions to view safeguarding records' });
      }
      behaviourRecords = behaviourRecords.filter(record => record.safeguardingFlag === true);
    } else {
      // For non-admin users, filter out safeguarding records unless they have specific access
      if (!validateRole(headers, ['admin', 'safeguarding_lead'])) {
        behaviourRecords = behaviourRecords.filter(record => record.safeguardingFlag !== true);
      }
    }

    return createResponse(200, {
      behaviour: behaviourRecords,
      total: behaviourRecords.length
    });
  } catch (error) {
    console.error('Error getting behaviour records:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

// Mock admissions data store
const mockAdmissions = new Map();
const mockDocuments = new Map(); // Store documents by admission ID

// Admissions helper functions
function generateAdmissionId() {
  return `admission-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateS3Key(filename, admissionId) {
  return `admissions/${admissionId}/documents/${Date.now()}-${filename}`;
}

// Admissions handler functions
async function listAdmissions(event) {
  try {
    const admissions = Array.from(mockAdmissions.values());
    return createResponse(200, { 
      admissions,
      total: admissions.length 
    });
  } catch (error) {
    console.error('Error listing admissions:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

async function createAdmission(event) {
  try {
    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const data = JSON.parse(event.body);
    
    // Validate required fields
    if (!data.firstName || !data.lastName || !data.dateOfBirth || !data.appliedGrade) {
      return createResponse(400, { error: 'Missing required fields: firstName, lastName, dateOfBirth, appliedGrade' });
    }

    const admissionId = generateAdmissionId();
    const admission = {
      id: admissionId,
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      appliedGrade: data.appliedGrade,
      appliedYearGroup: data.appliedYearGroup,
      preferredStartDate: data.preferredStartDate,
      nationality: data.nationality,
      previousSchool: data.previousSchool,
      guardians: data.guardians || [],
      status: 'submitted',
      documents: [],
      assessmentScore: null,
      assessmentNotes: null,
      decisionNotes: null,
      offerLetterUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockAdmissions.set(admissionId, admission);
    
    return createResponse(201, admission);
  } catch (error) {
    console.error('Error creating admission:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

async function getAdmission(admissionId) {
  try {
    const admission = mockAdmissions.get(admissionId);
    
    if (!admission) {
      return createResponse(404, { error: 'Admission not found' });
    }

    return createResponse(200, admission);
  } catch (error) {
    console.error('Error getting admission:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

async function updateAdmission(admissionId, event) {
  try {
    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const admission = mockAdmissions.get(admissionId);
    
    if (!admission) {
      return createResponse(404, { error: 'Admission not found' });
    }

    const updates = JSON.parse(event.body);
    
    // Update allowed fields
    const updatedAdmission = {
      ...admission,
      ...updates,
      id: admissionId, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };

    mockAdmissions.set(admissionId, updatedAdmission);
    
    return createResponse(200, updatedAdmission);
  } catch (error) {
    console.error('Error updating admission:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

async function deleteAdmission(admissionId) {
  try {
    const admission = mockAdmissions.get(admissionId);
    
    if (!admission) {
      return createResponse(404, { error: 'Admission not found' });
    }

    mockAdmissions.delete(admissionId);
    mockDocuments.delete(admissionId);

    return createResponse(200, { message: 'Admission deleted successfully' });
  } catch (error) {
    console.error('Error deleting admission:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

async function generatePresignedUrl(event) {
  try {
    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const data = JSON.parse(event.body);
    
    if (!data.filename || !data.contentType || !data.admissionId) {
      return createResponse(400, { error: 'Missing required fields: filename, contentType, admissionId' });
    }

    const admission = mockAdmissions.get(data.admissionId);
    if (!admission) {
      return createResponse(404, { error: 'Admission not found' });
    }

    const s3Key = generateS3Key(data.filename, data.admissionId);
    const presignedUrl = `https://mock-s3-bucket.s3.amazonaws.com/${s3Key}?mock-presigned-url=true`;

    return createResponse(200, {
      presignedUrl,
      s3Key,
      expiresIn: 3600
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

async function addDocument(admissionId, event) {
  try {
    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const admission = mockAdmissions.get(admissionId);
    if (!admission) {
      return createResponse(404, { error: 'Admission not found' });
    }

    const data = JSON.parse(event.body);
    
    if (!data.type || !data.filename || !data.s3Key) {
      return createResponse(400, { error: 'Missing required fields: type, filename, s3Key' });
    }

    const document = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: data.type,
      filename: data.filename,
      s3Key: data.s3Key,
      uploadedAt: new Date().toISOString()
    };

    // Add document to admission
    admission.documents.push(document);
    admission.updatedAt = new Date().toISOString();
    
    mockAdmissions.set(admissionId, admission);

    return createResponse(200, {
      message: 'Document added successfully',
      document
    });
  } catch (error) {
    console.error('Error adding document:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

async function convertToStudent(admissionId) {
  try {
    const admission = mockAdmissions.get(admissionId);
    
    if (!admission) {
      return createResponse(404, { error: 'Admission not found' });
    }

    if (admission.status !== 'offer_accepted') {
      return createResponse(400, { error: 'Admission must be in offer_accepted status to convert to student' });
    }

    // Create student record
    const studentId = generateId();
    const student = {
      id: studentId,
      firstName: admission.firstName,
      lastName: admission.lastName,
      dateOfBirth: admission.dateOfBirth,
      gender: admission.gender,
      schoolId: 'school-1', // Default school
      classId: null, // To be assigned later
      guardianIds: admission.guardians.map(g => g.id || `guardian-${Date.now()}`),
      enrollmentDate: admission.preferredStartDate || new Date().toISOString(),
      status: 'active',
      admissionId: admissionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    mockStudents.set(studentId, student);

    // Update admission status
    admission.status = 'converted_to_student';
    admission.studentId = studentId;
    admission.updatedAt = new Date().toISOString();
    mockAdmissions.set(admissionId, admission);

    return createResponse(200, {
      message: 'Admission converted to student successfully',
      studentId,
      student
    });
  } catch (error) {
    console.error('Error converting admission to student:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

// Invoice API functions
async function listInvoices(event, headers) {
  try {
    if (!validateRole(headers, ['admin', 'teacher', 'parent', 'student'])) {
      return createResponse(403, { error: 'Insufficient permissions' });
    }

    const { studentId, schoolId, status } = event.queryStringParameters || {};
    let invoices = Array.from(mockInvoices.values());

    // Filter by studentId if provided
    if (studentId) {
      invoices = invoices.filter(invoice => invoice.studentId === studentId);
    }

    // Filter by schoolId if provided
    if (schoolId) {
      invoices = invoices.filter(invoice => invoice.schoolId === schoolId);
    }

    // Filter by status if provided
    if (status) {
      invoices = invoices.filter(invoice => invoice.status === status);
    }

    // Role-based filtering
    const userRole = headers['x-user-role'] || 'student';
    const userId = headers['x-user-id'];

    if (userRole === 'student') {
      invoices = invoices.filter(invoice => invoice.studentId === userId);
    }

    return createResponse(200, invoices);
  } catch (error) {
    console.error('Error listing invoices:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

async function getInvoice(event, headers) {
  try {
    if (!validateRole(headers, ['admin', 'teacher', 'parent', 'student'])) {
      return createResponse(403, { error: 'Insufficient permissions' });
    }

    const invoiceId = event.pathParameters?.id;
    if (!invoiceId) {
      return createResponse(400, { error: 'Invoice ID is required' });
    }

    const invoice = mockInvoices.get(invoiceId);
    if (!invoice) {
      return createResponse(404, { error: 'Invoice not found' });
    }

    // Role-based access control
    const userRole = headers['x-user-role'] || 'student';
    const userId = headers['x-user-id'];

    if (userRole === 'student' && invoice.studentId !== userId) {
      return createResponse(403, { error: 'Access denied' });
    }

    return createResponse(200, invoice);
  } catch (error) {
    console.error('Error getting invoice:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

async function createInvoice(event, headers) {
  try {
    if (!validateRole(headers, ['admin', 'teacher'])) {
      return createResponse(403, { error: 'Insufficient permissions' });
    }

    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const data = JSON.parse(event.body);
    
    if (!data.studentId || !data.title || !data.lineItems || !data.dueDate) {
      return createResponse(400, { error: 'Missing required fields: studentId, title, lineItems, dueDate' });
    }

    const invoiceId = generateInvoiceId();
    const invoiceNumber = generateInvoiceNumber();
    const now = new Date().toISOString();

    // Calculate totals
    const subtotal = data.lineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxRate = data.taxRate || 0.20;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    const invoice = {
      id: invoiceId,
      invoiceNumber,
      schoolId: data.schoolId || 'school-001',
      studentId: data.studentId,
      status: 'draft',
      title: data.title,
      description: data.description || '',
      lineItems: data.lineItems,
      subtotal,
      taxRate,
      taxAmount,
      total,
      currency: data.currency || 'GBP',
      issueDate: data.issueDate || now.split('T')[0],
      dueDate: data.dueDate,
      createdBy: headers['x-user-id'] || 'admin-001',
      createdAt: now,
      updatedAt: now
    };

    mockInvoices.set(invoiceId, invoice);

    return createResponse(201, invoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

async function updateInvoice(event, headers) {
  try {
    if (!validateRole(headers, ['admin', 'teacher'])) {
      return createResponse(403, { error: 'Insufficient permissions' });
    }

    const invoiceId = event.pathParameters?.id;
    if (!invoiceId) {
      return createResponse(400, { error: 'Invoice ID is required' });
    }

    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const invoice = mockInvoices.get(invoiceId);
    if (!invoice) {
      return createResponse(404, { error: 'Invoice not found' });
    }

    const updateData = JSON.parse(event.body);
    
    // Recalculate totals if line items changed
    if (updateData.lineItems) {
      const subtotal = updateData.lineItems.reduce((sum, item) => sum + item.amount, 0);
      const taxRate = updateData.taxRate || invoice.taxRate;
      const taxAmount = subtotal * taxRate;
      const total = subtotal + taxAmount;
      
      updateData.subtotal = subtotal;
      updateData.taxAmount = taxAmount;
      updateData.total = total;
    }

    const updatedInvoice = {
      ...invoice,
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    mockInvoices.set(invoiceId, updatedInvoice);

    return createResponse(200, updatedInvoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

// Payment API functions
async function listPayments(event, headers) {
  try {
    if (!validateRole(headers, ['admin', 'teacher', 'parent', 'student'])) {
      return createResponse(403, { error: 'Insufficient permissions' });
    }

    const { studentId, invoiceId, status } = event.queryStringParameters || {};
    let payments = Array.from(mockPayments.values());

    // Filter by studentId if provided
    if (studentId) {
      payments = payments.filter(payment => payment.studentId === studentId);
    }

    // Filter by invoiceId if provided
    if (invoiceId) {
      payments = payments.filter(payment => payment.invoiceId === invoiceId);
    }

    // Filter by status if provided
    if (status) {
      payments = payments.filter(payment => payment.status === status);
    }

    // Role-based filtering
    const userRole = headers['x-user-role'] || 'student';
    const userId = headers['x-user-id'];

    if (userRole === 'student') {
      payments = payments.filter(payment => payment.studentId === userId);
    }

    return createResponse(200, payments);
  } catch (error) {
    console.error('Error listing payments:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

async function createPaymentIntent(event, headers) {
  try {
    if (!validateRole(headers, ['admin', 'teacher', 'parent', 'student'])) {
      return createResponse(403, { error: 'Insufficient permissions' });
    }

    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const data = JSON.parse(event.body);
    
    if (!data.invoiceId || !data.amount) {
      return createResponse(400, { error: 'Missing required fields: invoiceId, amount' });
    }

    const invoice = mockInvoices.get(data.invoiceId);
    if (!invoice) {
      return createResponse(404, { error: 'Invoice not found' });
    }

    // Mock Stripe payment intent
    const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const clientSecret = `${paymentIntentId}_secret_${Math.random().toString(36).substr(2, 9)}`;

    const paymentIntent = {
      id: paymentIntentId,
      client_secret: clientSecret,
      amount: Math.round(data.amount * 100), // Convert to cents
      currency: data.currency || 'gbp',
      status: 'requires_payment_method',
      metadata: {
        invoiceId: data.invoiceId,
        studentId: invoice.studentId
      }
    };

    return createResponse(200, paymentIntent);
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

async function handlePaymentWebhook(event) {
  try {
    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const webhookData = JSON.parse(event.body);
    
    // Mock webhook handling for different event types
    switch (webhookData.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(webhookData.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(webhookData.data.object);
        break;
      default:
        console.log('Unhandled webhook event type:', webhookData.type);
    }

    return createResponse(200, { received: true });
  } catch (error) {
    console.error('Error handling payment webhook:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

async function handlePaymentSuccess(paymentIntent) {
  try {
    const invoiceId = paymentIntent.metadata?.invoiceId;
    if (!invoiceId) return;

    const invoice = mockInvoices.get(invoiceId);
    if (!invoice) return;

    // Create payment record
    const paymentId = generatePaymentId();
    const now = new Date().toISOString();

    const payment = {
      id: paymentId,
      schoolId: invoice.schoolId,
      studentId: invoice.studentId,
      invoiceId: invoiceId,
      amount: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency.toUpperCase(),
      status: 'succeeded',
      method: 'stripe',
      reference: paymentIntent.id,
      description: `Payment for ${invoice.title}`,
      stripePaymentIntentId: paymentIntent.id,
      paymentDate: now,
      createdAt: now,
      updatedAt: now
    };

    mockPayments.set(paymentId, payment);

    // Update invoice status
    const updatedInvoice = {
      ...invoice,
      status: 'paid',
      paidDate: now.split('T')[0],
      paymentMethod: 'stripe',
      paymentReference: paymentIntent.id,
      stripePaymentIntentId: paymentIntent.id,
      updatedAt: now
    };

    mockInvoices.set(invoiceId, updatedInvoice);

    console.log('Payment processed successfully:', paymentId);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailure(paymentIntent) {
  try {
    const invoiceId = paymentIntent.metadata?.invoiceId;
    if (!invoiceId) return;

    const invoice = mockInvoices.get(invoiceId);
    if (!invoice) return;

    // Update invoice status if needed
    const updatedInvoice = {
      ...invoice,
      status: 'sent', // Keep as sent, payment failed
      updatedAt: new Date().toISOString()
    };

    mockInvoices.set(invoiceId, updatedInvoice);

    console.log('Payment failed for invoice:', invoiceId);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

// Health check
async function health() {
  return createResponse(200, { status: 'healthy', timestamp: new Date().toISOString() });
}

// Create server
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;
  const pathSegments = pathname.split('/').filter(Boolean);

  // Helper functions
  function handleResponse(result) {
    res.statusCode = result.statusCode;
    Object.entries(result.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    res.end(result.body);
  }

  async function getBody() {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', (chunk) => body += chunk);
      req.on('end', () => resolve(body));
    });
  }

  try {
    // CORS preflight
    if (method === 'OPTIONS') {
      handleResponse(createResponse(200, {}));
      return;
    }

    // Health endpoint
    if (pathname === '/health' && method === 'GET') {
      const out = await health();
      handleResponse(out);
      return;
    }

    // Students endpoints
    if (pathname === '/students' && (method === 'GET' || method === 'POST')) {
      const body = method === 'POST' ? await getBody() : '';
      const mockEvent = {
        body: body || null,
        queryStringParameters: Object.fromEntries(parsedUrl.searchParams),
        pathParameters: {}
      };
      const out = method === 'POST' 
        ? await createStudent(mockEvent)
        : await listStudents(mockEvent);
      handleResponse(out);
      return;
    }

    if (pathSegments[0] === 'students' && pathSegments[1] && (method === 'GET' || method === 'PATCH' || method === 'DELETE')) {
      const body = method === 'PATCH' ? await getBody() : '';
      const pathParameters = { id: pathSegments[1] };
      const mockEvent = {
        body: body || null,
        queryStringParameters: Object.fromEntries(parsedUrl.searchParams),
        pathParameters
      };
      
      let out;
      if (method === 'GET') {
        out = await getStudent(mockEvent);
      } else if (method === 'PATCH') {
        out = await updateStudent(mockEvent);
      } else if (method === 'DELETE') {
        out = await deleteStudent(mockEvent);
      }
      handleResponse(out);
      return;
    }

    // Attendance endpoints
    if (pathname === '/attendance/mark' && method === 'POST') {
      const body = await getBody();
      const mockEvent = {
        body: body || null,
        queryStringParameters: Object.fromEntries(parsedUrl.searchParams),
        pathParameters: {}
      };
      const out = await markAttendance(mockEvent, req.headers);
      handleResponse(out);
      return;
    }

    if (pathname === '/attendance' && method === 'GET') {
      const mockEvent = {
        body: null,
        queryStringParameters: Object.fromEntries(parsedUrl.searchParams),
        pathParameters: {}
      };
      const out = await getAttendance(mockEvent, req.headers);
      handleResponse(out);
      return;
    }

    // Behaviour endpoints
    if (pathname === '/behaviour' && method === 'POST') {
      const body = await getBody();
      const mockEvent = {
        body: body || null,
        queryStringParameters: Object.fromEntries(parsedUrl.searchParams),
        pathParameters: {}
      };
      const out = await recordBehaviour(mockEvent, req.headers);
      handleResponse(out);
      return;
    }

    if (pathname === '/behaviour' && method === 'GET') {
      const mockEvent = {
        body: null,
        queryStringParameters: Object.fromEntries(parsedUrl.searchParams),
        pathParameters: {}
      };
      const out = await getBehaviour(mockEvent, req.headers);
      handleResponse(out);
      return;
    }

    // Admissions endpoints
    if (pathname === '/admissions' && method === 'GET') {
      const mockEvent = {
        body: null,
        queryStringParameters: Object.fromEntries(parsedUrl.searchParams),
        pathParameters: {}
      };
      out = await listAdmissions(mockEvent);
      handleResponse(out);
      return;
    }

    if (pathname === '/admissions' && method === 'POST') {
      const body = await getBody();
      const mockEvent = {
        body: body || null,
        queryStringParameters: Object.fromEntries(parsedUrl.searchParams),
        pathParameters: {}
      };
      out = await createAdmission(mockEvent);
      handleResponse(out);
      return;
    }

    if (pathname.startsWith('/admissions/') && pathname.endsWith('/convert') && method === 'POST') {
      const admissionId = pathname.split('/')[2];
      out = await convertToStudent(admissionId);
      handleResponse(out);
      return;
    }

    if (pathname.startsWith('/admissions/') && pathname.endsWith('/documents') && method === 'POST') {
      const admissionId = pathname.split('/')[2];
      const body = await getBody();
      const mockEvent = {
        body: body || null,
        queryStringParameters: Object.fromEntries(parsedUrl.searchParams),
        pathParameters: { id: admissionId }
      };
      out = await addDocument(admissionId, mockEvent);
      handleResponse(out);
      return;
    }

    if (pathname === '/admissions/upload-url' && method === 'POST') {
      const body = await getBody();
      const mockEvent = {
        body: body || null,
        queryStringParameters: Object.fromEntries(parsedUrl.searchParams),
        pathParameters: {}
      };
      out = await generatePresignedUrl(mockEvent);
      handleResponse(out);
      return;
    }

    if (pathname.startsWith('/admissions/') && method === 'GET') {
      const admissionId = pathname.split('/')[2];
      out = await getAdmission(admissionId);
      handleResponse(out);
      return;
    }

    if (pathname.startsWith('/admissions/') && method === 'PATCH') {
      const admissionId = pathname.split('/')[2];
      const body = await getBody();
      const mockEvent = {
        body: body || null,
        queryStringParameters: Object.fromEntries(parsedUrl.searchParams),
        pathParameters: { id: admissionId }
      };
      out = await updateAdmission(admissionId, mockEvent);
      handleResponse(out);
      return;
    }

    if (pathname.startsWith('/admissions/') && method === 'DELETE') {
      const admissionId = pathname.split('/')[2];
      out = await deleteAdmission(admissionId);
      handleResponse(out);
      return;
    }

    // Invoice endpoints
    if (pathname === '/invoices' && method === 'GET') {
      const mockEvent = {
        body: null,
        queryStringParameters: Object.fromEntries(parsedUrl.searchParams),
        pathParameters: {}
      };
      const out = await listInvoices(mockEvent, req.headers);
      handleResponse(out);
      return;
    }

    if (pathname === '/invoices' && method === 'POST') {
      const body = await getBody();
      const mockEvent = {
        body: body || null,
        queryStringParameters: Object.fromEntries(parsedUrl.searchParams),
        pathParameters: {}
      };
      const out = await createInvoice(mockEvent, req.headers);
      handleResponse(out);
      return;
    }

    if (pathSegments[0] === 'invoices' && pathSegments[1] && (method === 'GET' || method === 'PATCH')) {
      const body = method === 'PATCH' ? await getBody() : '';
      const pathParameters = { id: pathSegments[1] };
      const mockEvent = {
        body: body || null,
        queryStringParameters: Object.fromEntries(parsedUrl.searchParams),
        pathParameters
      };
      
      let out;
      if (method === 'GET') {
        out = await getInvoice(mockEvent, req.headers);
      } else if (method === 'PATCH') {
        out = await updateInvoice(mockEvent, req.headers);
      }
      handleResponse(out);
      return;
    }

    // Payment endpoints
    if (pathname === '/payments' && method === 'GET') {
      const mockEvent = {
        body: null,
        queryStringParameters: Object.fromEntries(parsedUrl.searchParams),
        pathParameters: {}
      };
      const out = await listPayments(mockEvent, req.headers);
      handleResponse(out);
      return;
    }

    if (pathname === '/payments/intent' && method === 'POST') {
      const body = await getBody();
      const mockEvent = {
        body: body || null,
        queryStringParameters: Object.fromEntries(parsedUrl.searchParams),
        pathParameters: {}
      };
      const out = await createPaymentIntent(mockEvent, req.headers);
      handleResponse(out);
      return;
    }

    if (pathname === '/payments/webhook' && method === 'POST') {
      const body = await getBody();
      const mockEvent = {
        body: body || null,
        queryStringParameters: Object.fromEntries(parsedUrl.searchParams),
        pathParameters: {}
      };
      const out = await handlePaymentWebhook(mockEvent);
      handleResponse(out);
      return;
    }

    // 404 for unmatched routes
    handleResponse(createResponse(404, { error: 'Not found' }));
  } catch (error) {
    console.error('Server error:', error);
    handleResponse(createResponse(500, { error: 'Internal server error' }));
  }
});

const PORT = 3003;
server.listen(PORT, () => {
  console.log(`🚀 GSOS API Server running on http://localhost:${PORT}`);
  console.log('');
  console.log('Available endpoints:');
  console.log('  GET  /health');
  console.log('');
  console.log('Students:');
  console.log('  GET  /students');
  console.log('  POST /students');
  console.log('  GET  /students/{id}');
  console.log('  PATCH /students/{id}');
  console.log('  DELETE /students/{id}');
  console.log('');
  console.log('Attendance:');
  console.log('  POST /attendance/mark');
  console.log('  GET  /attendance?studentId=...&from=...&to=...&classId=...');
  console.log('');
  console.log('Behaviour:');
  console.log('  POST /behaviour');
  console.log('  GET  /behaviour?studentId=...&from=...&to=...&type=...&safeguardingOnly=...');
  console.log('');
  console.log('Admissions:');
  console.log('  GET  /admissions');
  console.log('  POST /admissions');
  console.log('  GET  /admissions/{id}');
  console.log('  PATCH /admissions/{id}');
  console.log('  DELETE /admissions/{id}');
  console.log('  POST /admissions/upload-url');
  console.log('  POST /admissions/{id}/documents');
  console.log('  POST /admissions/{id}/convert');
  console.log('');
  console.log('Invoices:');
  console.log('  GET  /invoices?studentId=...&schoolId=...&status=...');
  console.log('  POST /invoices');
  console.log('  GET  /invoices/{id}');
  console.log('  PATCH /invoices/{id}');
  console.log('');
  console.log('Payments:');
  console.log('  GET  /payments?studentId=...&invoiceId=...&status=...');
  console.log('  POST /payments/intent');
  console.log('  POST /payments/webhook');
  console.log('');
  console.log('Ready for testing! 🎉');
});