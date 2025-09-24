import { z } from 'zod';

// Base IDs
export const SchoolId = z.string().min(1);
export const StudentId = z.string().min(1);
export const GuardianId = z.string().min(1);
export const TeacherId = z.string().min(1);
export const ClassId = z.string().min(1);
export const AttendanceId = z.string().min(1);
export const BehaviorId = z.string().min(1);
export const AdmissionId = z.string().min(1);
export const PaymentId = z.string().min(1);
export const InvoiceId = z.string().min(1);

// Enums
export const UserRole = z.enum(['student', 'parent', 'teacher', 'admin']);
export const AttendanceStatus = z.enum(['present', 'absent', 'late', 'excused']);
export const BehaviorType = z.enum(['positive', 'negative', 'neutral', 'safeguarding']);
export const AdmissionStatus = z.enum(['pending', 'under_review', 'accepted', 'rejected', 'waitlisted']);
export const PaymentStatus = z.enum(['pending', 'paid', 'failed', 'refunded']);
export const InvoiceStatus = z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']);

// School
export const School = z.object({ 
  id: SchoolId, 
  name: z.string(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type School = z.infer<typeof School>;

// Guardian/Parent
export const Guardian = z.object({
  id: GuardianId,
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  address: z.string(),
  relationship: z.enum(['mother', 'father', 'guardian', 'other']),
  isPrimary: z.boolean().default(false),
  emergencyContact: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type Guardian = z.infer<typeof Guardian>;

// Enhanced Student with comprehensive profile
export const Student = z.object({
  id: StudentId,
  schoolId: SchoolId,
  // Personal Information
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().date(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  nationality: z.string().optional(),
  // Contact Information
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string(),
  // Academic Information
  studentNumber: z.string().min(1),
  grade: z.string().min(1),
  yearGroup: z.string().min(1),
  house: z.string().optional(),
  // Enrollment Information
  enrollmentDate: z.string().date(),
  expectedGraduationDate: z.string().date().optional(),
  status: z.enum(['active', 'inactive', 'graduated', 'transferred', 'expelled']).default('active'),
  // Guardian relationships
  guardianIds: z.array(GuardianId).default([]),
  // Medical/Special Needs
  medicalInfo: z.string().optional(),
  specialNeeds: z.string().optional(),
  allergies: z.string().optional(),
  // Metadata
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type Student = z.infer<typeof Student>;

// Teacher
export const Teacher = z.object({
  id: TeacherId,
  schoolId: SchoolId,
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  department: z.string().optional(),
  subjects: z.array(z.string()).default([]),
  isClassTeacher: z.boolean().default(false),
  classIds: z.array(ClassId).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type Teacher = z.infer<typeof Teacher>;

// Class
export const Class = z.object({
  id: ClassId,
  schoolId: SchoolId,
  name: z.string().min(1),
  grade: z.string().min(1),
  yearGroup: z.string().min(1),
  teacherId: TeacherId,
  subject: z.string().optional(),
  room: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  studentIds: z.array(StudentId).default([]),
  schedule: z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  })).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type Class = z.infer<typeof Class>;

// Attendance
export const Attendance = z.object({
  id: AttendanceId,
  studentId: StudentId,
  classId: ClassId,
  teacherId: TeacherId,
  date: z.string().date(),
  status: AttendanceStatus,
  notes: z.string().optional(),
  markedAt: z.string().datetime(),
  markedBy: TeacherId,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type Attendance = z.infer<typeof Attendance>;

// Behavior & Safeguarding
export const BehaviorRecord = z.object({
  id: BehaviorId,
  studentId: StudentId,
  teacherId: TeacherId,
  classId: ClassId.optional(),
  type: BehaviorType,
  title: z.string().min(1),
  description: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  actionTaken: z.string().optional(),
  followUpRequired: z.boolean().default(false),
  followUpDate: z.string().date().optional(),
  parentNotified: z.boolean().default(false),
  parentNotifiedAt: z.string().datetime().optional(),
  isConfidential: z.boolean().default(false),
  attachments: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type BehaviorRecord = z.infer<typeof BehaviorRecord>;

// Admissions
export const Admission = z.object({
  id: AdmissionId,
  schoolId: SchoolId,
  // Application Information
  applicationNumber: z.string().min(1),
  status: AdmissionStatus,
  appliedGrade: z.string().min(1),
  appliedYearGroup: z.string().min(1),
  preferredStartDate: z.string().date(),
  // Student Information (before enrollment)
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().date(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  nationality: z.string().optional(),
  previousSchool: z.string().optional(),
  // Guardian Information
  guardians: z.array(z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    relationship: z.enum(['mother', 'father', 'guardian', 'other']),
    isPrimary: z.boolean().default(false)
  })),
  // Documents
  documents: z.array(z.object({
    type: z.string(),
    filename: z.string(),
    s3Key: z.string(),
    uploadedAt: z.string().datetime()
  })).default([]),
  // Assessment
  assessmentScore: z.number().optional(),
  assessmentNotes: z.string().optional(),
  // Decision
  decisionDate: z.string().date().optional(),
  decisionBy: TeacherId.optional(),
  decisionNotes: z.string().optional(),
  offerLetterSent: z.boolean().default(false),
  offerAccepted: z.boolean().optional(),
  offerAcceptedAt: z.string().datetime().optional(),
  // Conversion to student
  studentId: StudentId.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type Admission = z.infer<typeof Admission>;

// Finance - Invoice
export const Invoice = z.object({
  id: InvoiceId,
  schoolId: SchoolId,
  studentId: StudentId,
  invoiceNumber: z.string().min(1),
  status: InvoiceStatus,
  // Amounts
  subtotal: z.number().nonnegative(),
  taxAmount: z.number().nonnegative().default(0),
  discountAmount: z.number().nonnegative().default(0),
  totalAmount: z.number().nonnegative(),
  paidAmount: z.number().nonnegative().default(0),
  // Dates
  issueDate: z.string().date(),
  dueDate: z.string().date(),
  paidDate: z.string().date().optional(),
  // Line Items
  lineItems: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().positive().default(1),
    unitPrice: z.number().nonnegative(),
    totalPrice: z.number().nonnegative()
  })),
  // Notes
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type Invoice = z.infer<typeof Invoice>;

// Finance - Payment
export const Payment = z.object({
  id: PaymentId,
  schoolId: SchoolId,
  studentId: StudentId,
  invoiceId: InvoiceId,
  // Payment Details
  amount: z.number().positive(),
  currency: z.string().length(3).default('GBP'),
  status: PaymentStatus,
  method: z.enum(['card', 'bank_transfer', 'cash', 'cheque', 'other']),
  // External Payment Provider
  stripePaymentIntentId: z.string().optional(),
  stripeChargeId: z.string().optional(),
  // Metadata
  reference: z.string().optional(),
  notes: z.string().optional(),
  processedAt: z.string().datetime().optional(),
  failureReason: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type Payment = z.infer<typeof Payment>;

// Request/Response schemas for API endpoints
export const CreateStudentRequest = Student.omit({ id: true, createdAt: true, updatedAt: true });
export const UpdateStudentRequest = Student.omit({ id: true, createdAt: true, updatedAt: true }).partial();

export const CreateAttendanceRequest = Attendance.omit({ id: true, createdAt: true, updatedAt: true, markedAt: true });
export const UpdateAttendanceRequest = Attendance.omit({ id: true, createdAt: true, updatedAt: true, markedAt: true }).partial();

export const CreateBehaviorRequest = BehaviorRecord.omit({ id: true, createdAt: true, updatedAt: true });
export const UpdateBehaviorRequest = BehaviorRecord.omit({ id: true, createdAt: true, updatedAt: true }).partial();

export const CreateAdmissionRequest = Admission.omit({ id: true, applicationNumber: true, createdAt: true, updatedAt: true });
export const UpdateAdmissionRequest = Admission.omit({ id: true, applicationNumber: true, createdAt: true, updatedAt: true }).partial();

export const CreatePaymentRequest = Payment.omit({ id: true, createdAt: true, updatedAt: true });

// Export types
export type UserRole = z.infer<typeof UserRole>;
export type AttendanceStatus = z.infer<typeof AttendanceStatus>;
export type BehaviorType = z.infer<typeof BehaviorType>;
export type AdmissionStatus = z.infer<typeof AdmissionStatus>;
export type PaymentStatus = z.infer<typeof PaymentStatus>;
export type InvoiceStatus = z.infer<typeof InvoiceStatus>;

// Auth types
export * from './auth';
