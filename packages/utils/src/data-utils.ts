/**
 * Data utilities for DynamoDB operations
 * Provides helper functions for working with the GSOS data model
 */

// Key generation utilities
export const DataKeys = {
  // Students Table Keys
  student: {
    pk: (schoolId: string, studentId: string) => `${schoolId}#${studentId}`,
    sk: (type: 'profile' | 'enrollment' | 'medical', timestamp?: string) => 
      `${type}#${timestamp || new Date().toISOString()}`,
    gsi1: {
      pk: (schoolId: string) => schoolId,
      sk: (grade: string, yearGroup: string) => `${grade}#${yearGroup}`
    },
    gsi2: {
      pk: (guardianId: string) => guardianId,
      sk: (schoolId: string, studentId: string) => `${schoolId}#${studentId}`
    }
  },

  // Guardians Table Keys
  guardian: {
    pk: (schoolId: string, guardianId: string) => `${schoolId}#${guardianId}`,
    sk: (type: 'profile' | 'contact' | 'relationship', timestamp?: string) => 
      `${type}#${timestamp || new Date().toISOString()}`,
    gsi1: {
      pk: (schoolId: string) => schoolId,
      sk: (lastName: string, firstName: string) => `${lastName}#${firstName}`
    },
    gsi2: {
      pk: (studentId: string) => studentId,
      sk: (schoolId: string, guardianId: string) => `${schoolId}#${guardianId}`
    }
  },

  // Guardian-Student Junction Items
  guardianStudent: {
    pk: (schoolId: string, guardianId: string) => `${schoolId}#${guardianId}`,
    sk: (studentId: string, relationship: string) => `student#${studentId}#${relationship}`,
    gsi2: {
      pk: (studentId: string) => studentId,
      sk: (schoolId: string, guardianId: string) => `${schoolId}#${guardianId}`
    }
  },

  // Attendance Table Keys
  attendance: {
    pk: (schoolId: string, date: string) => `${schoolId}#${date}`, // date format: YYYY-MM-DD
    sk: (studentId: string) => studentId,
    gsi1: {
      pk: (schoolId: string, studentId: string) => `${schoolId}#${studentId}`,
      sk: (date: string) => date
    },
    gsi2: {
      pk: (schoolId: string, classId: string, date: string) => `${schoolId}#${classId}#${date}`,
      sk: (studentId: string) => studentId
    }
  },

  // Behaviour Table Keys
  behaviour: {
    pk: (schoolId: string, studentId: string) => `${schoolId}#${studentId}`,
    sk: (timestamp: string) => timestamp,
    gsi1: {
      pk: (schoolId: string) => schoolId,
      sk: (timestamp: string) => timestamp
    },
    gsi2: {
      pk: (schoolId: string, isSafeguarding: boolean) => 
        isSafeguarding ? `${schoolId}#safeguarding` : `${schoolId}#general`,
      sk: (timestamp: string) => timestamp
    },
    gsi3: {
      pk: (schoolId: string, teacherId: string) => `${schoolId}#${teacherId}`,
      sk: (timestamp: string) => timestamp
    }
  },

  // Admissions Table Keys
  admission: {
    pk: (schoolId: string, applicationId: string) => `${schoolId}#${applicationId}`,
    sk: (timestamp: string) => timestamp,
    gsi1: {
      pk: (schoolId: string, status: string) => `${schoolId}#${status}`,
      sk: (timestamp: string) => timestamp
    },
    gsi2: {
      pk: (schoolId: string, appliedGrade: string) => `${schoolId}#${appliedGrade}`,
      sk: (timestamp: string) => timestamp
    },
    gsi3: {
      pk: (guardianEmail: string) => guardianEmail,
      sk: (timestamp: string) => timestamp
    }
  },

  // Invoices Table Keys
  invoice: {
    pk: (schoolId: string, invoiceId: string) => `${schoolId}#${invoiceId}`,
    sk: (studentId: string) => studentId,
    gsi1: {
      pk: (schoolId: string, studentId: string) => `${schoolId}#${studentId}`,
      sk: (dueDate: string) => dueDate
    },
    gsi2: {
      pk: (schoolId: string, status: string) => `${schoolId}#${status}`,
      sk: (dueDate: string) => dueDate
    },
    gsi3: {
      pk: (schoolId: string, isOverdue: boolean) => 
        isOverdue ? `${schoolId}#overdue` : `${schoolId}#current`,
      sk: (dueDate: string) => dueDate
    }
  },

  // Payments Table Keys
  payment: {
    pk: (schoolId: string, paymentId: string) => `${schoolId}#${paymentId}`,
    sk: (invoiceId: string) => invoiceId,
    gsi1: {
      pk: (schoolId: string, invoiceId: string) => `${schoolId}#${invoiceId}`,
      sk: (processedAt: string) => processedAt
    },
    gsi2: {
      pk: (schoolId: string, studentId: string) => `${schoolId}#${studentId}`,
      sk: (processedAt: string) => processedAt
    },
    gsi3: {
      pk: (schoolId: string, status: string) => `${schoolId}#${status}`,
      sk: (processedAt: string) => processedAt
    }
  }
};

// Query builders for common access patterns
export const QueryBuilders = {
  // Get all students in a school by grade
  studentsByGrade: (schoolId: string, grade: string, yearGroup: string) => ({
    IndexName: 'SchoolIndex',
    KeyConditionExpression: 'GSI1PK = :schoolId AND GSI1SK = :gradeYear',
    ExpressionAttributeValues: {
      ':schoolId': schoolId,
      ':gradeYear': `${grade}#${yearGroup}`
    }
  }),

  // Get all students for a guardian
  studentsByGuardian: (guardianId: string) => ({
    IndexName: 'GuardianIndex',
    KeyConditionExpression: 'GSI2PK = :guardianId',
    ExpressionAttributeValues: {
      ':guardianId': guardianId
    }
  }),

  // Get attendance for a specific date
  attendanceByDate: (schoolId: string, date: string) => ({
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: {
      ':pk': DataKeys.attendance.pk(schoolId, date)
    }
  }),

  // Get student attendance history
  studentAttendanceHistory: (schoolId: string, studentId: string, fromDate?: string, toDate?: string) => {
    const query: any = {
      IndexName: 'StudentAttendanceIndex',
      KeyConditionExpression: 'GSI1PK = :studentKey',
      ExpressionAttributeValues: {
        ':studentKey': DataKeys.attendance.gsi1.pk(schoolId, studentId)
      }
    };

    if (fromDate && toDate) {
      query.KeyConditionExpression += ' AND GSI1SK BETWEEN :fromDate AND :toDate';
      query.ExpressionAttributeValues[':fromDate'] = fromDate;
      query.ExpressionAttributeValues[':toDate'] = toDate;
    }

    return query;
  },

  // Get behaviour records for a student
  studentBehaviour: (schoolId: string, studentId: string, fromTimestamp?: string, toTimestamp?: string) => {
    const query: any = {
      KeyConditionExpression: 'pk = :pk',
      ExpressionAttributeValues: {
        ':pk': DataKeys.behaviour.pk(schoolId, studentId)
      }
    };

    if (fromTimestamp && toTimestamp) {
      query.KeyConditionExpression += ' AND sk BETWEEN :fromTs AND :toTs';
      query.ExpressionAttributeValues[':fromTs'] = fromTimestamp;
      query.ExpressionAttributeValues[':toTs'] = toTimestamp;
    }

    return query;
  },

  // Get safeguarding incidents for a school
  safeguardingIncidents: (schoolId: string, fromTimestamp?: string, toTimestamp?: string) => {
    const query: any = {
      IndexName: 'SafeguardingIndex',
      KeyConditionExpression: 'GSI2PK = :safeguardingKey',
      ExpressionAttributeValues: {
        ':safeguardingKey': DataKeys.behaviour.gsi2.pk(schoolId, true)
      }
    };

    if (fromTimestamp && toTimestamp) {
      query.KeyConditionExpression += ' AND GSI2SK BETWEEN :fromTs AND :toTs';
      query.ExpressionAttributeValues[':fromTs'] = fromTimestamp;
      query.ExpressionAttributeValues[':toTs'] = toTimestamp;
    }

    return query;
  },

  // Get admissions by status
  admissionsByStatus: (schoolId: string, status: string) => ({
    IndexName: 'SchoolStatusIndex',
    KeyConditionExpression: 'GSI1PK = :statusKey',
    ExpressionAttributeValues: {
      ':statusKey': DataKeys.admission.gsi1.pk(schoolId, status)
    }
  }),

  // Get student invoices
  studentInvoices: (schoolId: string, studentId: string) => ({
    IndexName: 'StudentInvoicesIndex',
    KeyConditionExpression: 'GSI1PK = :studentKey',
    ExpressionAttributeValues: {
      ':studentKey': DataKeys.invoice.gsi1.pk(schoolId, studentId)
    }
  }),

  // Get overdue invoices
  overdueInvoices: (schoolId: string) => ({
    IndexName: 'OverdueInvoicesIndex',
    KeyConditionExpression: 'GSI3PK = :overdueKey',
    ExpressionAttributeValues: {
      ':overdueKey': DataKeys.invoice.gsi3.pk(schoolId, true)
    }
  }),

  // Get payments for an invoice
  invoicePayments: (schoolId: string, invoiceId: string) => ({
    IndexName: 'InvoicePaymentsIndex',
    KeyConditionExpression: 'GSI1PK = :invoiceKey',
    ExpressionAttributeValues: {
      ':invoiceKey': DataKeys.payment.gsi1.pk(schoolId, invoiceId)
    }
  })
};

// Utility functions for data transformation
export const DataTransforms = {
  // Convert date to DynamoDB date format
  toDateKey: (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  },

  // Convert timestamp to ISO string
  toTimestampKey: (timestamp: Date | string | number): string => {
    if (typeof timestamp === 'string') return timestamp;
    if (typeof timestamp === 'number') return new Date(timestamp).toISOString();
    return timestamp.toISOString();
  },

  // Generate application number
  generateApplicationNumber: (schoolId: string, year: number): string => {
    const timestamp = Date.now().toString().slice(-6);
    return `${schoolId.toUpperCase()}-${year}-${timestamp}`;
  },

  // Generate invoice number
  generateInvoiceNumber: (schoolId: string, year: number, month: number): string => {
    const timestamp = Date.now().toString().slice(-4);
    return `INV-${schoolId.toUpperCase()}-${year}${month.toString().padStart(2, '0')}-${timestamp}`;
  },

  // Check if invoice is overdue
  isInvoiceOverdue: (dueDate: string): boolean => {
    return new Date(dueDate) < new Date();
  },

  // Calculate age from date of birth
  calculateAge: (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
};

// S3 key patterns for document storage
export const S3Keys = {
  admissions: {
    document: (schoolId: string, applicationId: string, documentType: string, filename: string) =>
      `admissions/${schoolId}/${applicationId}/${documentType}/${filename}`,
    
    profilePhoto: (schoolId: string, applicationId: string, filename: string) =>
      `admissions/${schoolId}/${applicationId}/photos/${filename}`
  },
  
  students: {
    document: (schoolId: string, studentId: string, documentType: string, filename: string) =>
      `students/${schoolId}/${studentId}/${documentType}/${filename}`,
      
    profilePhoto: (schoolId: string, studentId: string, filename: string) =>
      `students/${schoolId}/${studentId}/photos/${filename}`
  },
  
  behaviour: {
    attachment: (schoolId: string, studentId: string, behaviourId: string, filename: string) =>
      `behaviour/${schoolId}/${studentId}/${behaviourId}/${filename}`
  }
};

export default {
  DataKeys,
  QueryBuilders,
  DataTransforms,
  S3Keys
};