import { randomUUID } from 'node:crypto';

// Mock data store
const mockAdmissions = new Map<string, any>();

// Helper function to create response
function createResponse(statusCode: number, body: any) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}

// Helper function to generate application number
function generateApplicationNumber(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `APP${year}${randomNum}`;
}

// List admissions
export async function listAdmissions(event: any) {
  try {
    const queryParams = event.queryStringParameters || {};
    const status = queryParams.status;
    const schoolId = queryParams.schoolId || 'school-123'; // Default school

    let admissions = Array.from(mockAdmissions.values());

    // Filter by school
    admissions = admissions.filter(admission => admission.schoolId === schoolId);

    // Filter by status if provided
    if (status) {
      admissions = admissions.filter(admission => admission.status === status);
    }

    return createResponse(200, {
      admissions,
      total: admissions.length
    });

  } catch (error) {
    console.error('Error listing admissions:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

// Get admission by ID
export async function getAdmission(event: any) {
  try {
    const admissionId = event.pathParameters?.id;
    
    if (!admissionId) {
      return createResponse(400, { error: 'Admission ID is required' });
    }

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

// Create admission
export async function createAdmission(event: any) {
  try {
    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const data = JSON.parse(event.body);
    
    // Validate required fields
    if (!data.firstName || !data.lastName || !data.dateOfBirth || !data.appliedGrade) {
      return createResponse(400, { 
        error: 'Missing required fields: firstName, lastName, dateOfBirth, appliedGrade' 
      });
    }

    if (!data.guardians || !Array.isArray(data.guardians) || data.guardians.length === 0) {
      return createResponse(400, { 
        error: 'At least one guardian is required' 
      });
    }

    const now = new Date().toISOString();
    const admissionId = `admission-${Date.now()}-${randomUUID().slice(0, 8)}`;
    
    const admission = {
      id: admissionId,
      schoolId: data.schoolId || 'school-123',
      applicationNumber: generateApplicationNumber(),
      status: 'pending',
      appliedGrade: data.appliedGrade,
      appliedYearGroup: data.appliedYearGroup || data.appliedGrade,
      preferredStartDate: data.preferredStartDate || new Date().toISOString().split('T')[0],
      
      // Student information
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      nationality: data.nationality,
      previousSchool: data.previousSchool,
      
      // Guardian information
      guardians: data.guardians,
      
      // Documents (empty initially)
      documents: [],
      
      // Assessment fields
      assessmentScore: null,
      assessmentNotes: null,
      
      // Decision fields
      decisionDate: null,
      decisionBy: null,
      decisionNotes: null,
      offerLetterSent: false,
      offerAccepted: null,
      offerAcceptedAt: null,
      
      // Conversion
      studentId: null,
      
      createdAt: now,
      updatedAt: now
    };

    mockAdmissions.set(admissionId, admission);

    return createResponse(201, admission);

  } catch (error) {
    console.error('Error creating admission:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

// Update admission
export async function updateAdmission(event: any) {
  try {
    const admissionId = event.pathParameters?.id;
    
    if (!admissionId) {
      return createResponse(400, { error: 'Admission ID is required' });
    }

    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const admission = mockAdmissions.get(admissionId);
    
    if (!admission) {
      return createResponse(404, { error: 'Admission not found' });
    }

    const updateData = JSON.parse(event.body);
    
    const updatedAdmission = {
      ...admission,
      ...updateData,
      id: admissionId, // Ensure ID doesn't change
      applicationNumber: admission.applicationNumber, // Ensure application number doesn't change
      createdAt: admission.createdAt, // Ensure created date doesn't change
      updatedAt: new Date().toISOString()
    };

    mockAdmissions.set(admissionId, updatedAdmission);

    return createResponse(200, updatedAdmission);

  } catch (error) {
    console.error('Error updating admission:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

// Delete admission
export async function deleteAdmission(event: any) {
  try {
    const admissionId = event.pathParameters?.id;
    
    if (!admissionId) {
      return createResponse(400, { error: 'Admission ID is required' });
    }

    const admission = mockAdmissions.get(admissionId);
    
    if (!admission) {
      return createResponse(404, { error: 'Admission not found' });
    }

    mockAdmissions.delete(admissionId);

    return createResponse(200, { message: 'Admission deleted successfully' });

  } catch (error) {
    console.error('Error deleting admission:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

// Generate pre-signed URL for document upload
export async function generatePresignedUrl(event: any) {
  try {
    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const { filename, contentType, admissionId } = JSON.parse(event.body);

    if (!filename || !contentType || !admissionId) {
      return createResponse(400, { 
        error: 'Missing required fields: filename, contentType, admissionId' 
      });
    }

    // For local development, return a mock response
    const fileExtension = filename.split('.').pop();
    const uniqueFilename = `${randomUUID()}.${fileExtension}`;
    const s3Key = `admissions/${admissionId}/documents/${uniqueFilename}`;

    return createResponse(200, {
      presignedUrl: `https://mock-s3-upload-url.com/${s3Key}`,
      s3Key,
      filename: uniqueFilename,
      originalFilename: filename
    });

  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    return createResponse(500, { error: 'Failed to generate upload URL' });
  }
}

// Add document to admission
export async function addDocument(event: any) {
  try {
    const admissionId = event.pathParameters?.id;
    
    if (!admissionId) {
      return createResponse(400, { error: 'Admission ID is required' });
    }

    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const admission = mockAdmissions.get(admissionId);
    
    if (!admission) {
      return createResponse(404, { error: 'Admission not found' });
    }

    const { type, filename, s3Key } = JSON.parse(event.body);

    if (!type || !filename || !s3Key) {
      return createResponse(400, { 
        error: 'Missing required fields: type, filename, s3Key' 
      });
    }

    const document = {
      type,
      filename,
      s3Key,
      uploadedAt: new Date().toISOString()
    };

    admission.documents.push(document);
    admission.updatedAt = new Date().toISOString();

    mockAdmissions.set(admissionId, admission);

    return createResponse(200, {
      message: 'Document added successfully',
      document,
      admission
    });

  } catch (error) {
    console.error('Error adding document:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}

// Convert admission to student
export async function convertToStudent(event: any) {
  try {
    const admissionId = event.pathParameters?.id;
    
    if (!admissionId) {
      return createResponse(400, { error: 'Admission ID is required' });
    }

    const admission = mockAdmissions.get(admissionId);
    
    if (!admission) {
      return createResponse(404, { error: 'Admission not found' });
    }

    if (admission.status !== 'offer_accepted') {
      return createResponse(400, { 
        error: 'Admission must have accepted offer status to convert to student' 
      });
    }

    if (admission.studentId) {
      return createResponse(400, { 
        error: 'Admission has already been converted to student' 
      });
    }

    // Generate student ID
    const studentId = `student-${Date.now()}-${randomUUID().slice(0, 8)}`;
    
    // Update admission with student ID
    admission.studentId = studentId;
    admission.status = 'converted';
    admission.updatedAt = new Date().toISOString();

    mockAdmissions.set(admissionId, admission);

    // In a real implementation, this would create a Student record
    // and Guardian records in their respective tables

    return createResponse(200, {
      message: 'Admission converted to student successfully',
      studentId,
      admission
    });

  } catch (error) {
    console.error('Error converting admission to student:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
}