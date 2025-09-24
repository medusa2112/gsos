/**
 * Data Retention Configuration and Utilities
 * Implements GDPR-compliant data retention policies
 */

import { logger } from '@gsos/utils/secure-logging';

/**
 * Data retention periods in days
 */
export const RETENTION_PERIODS = {
  // Student data retention
  STUDENT_RECORDS: {
    ACTIVE_STUDENT: 365 * 7, // 7 years after leaving
    GRADUATED_STUDENT: 365 * 25, // 25 years for academic records
    WITHDRAWN_STUDENT: 365 * 7, // 7 years after withdrawal
  },
  
  // Safeguarding and child protection
  SAFEGUARDING: {
    CHILD_PROTECTION_RECORDS: 365 * 25, // 25 years or until 25th birthday + 7 years
    INCIDENT_REPORTS: 365 * 7, // 7 years
    WELFARE_CONCERNS: 365 * 7, // 7 years
  },
  
  // Financial records
  FINANCIAL: {
    INVOICES: 365 * 6, // 6 years for tax purposes
    PAYMENTS: 365 * 6, // 6 years
    FINANCIAL_REPORTS: 365 * 6, // 6 years
  },
  
  // Staff records
  STAFF: {
    EMPLOYMENT_RECORDS: 365 * 6, // 6 years after leaving
    DBS_CHECKS: 365 * 1, // 1 year (certificate details only)
    TRAINING_RECORDS: 365 * 3, // 3 years
  },
  
  // Operational data
  OPERATIONAL: {
    ATTENDANCE_RECORDS: 365 * 3, // 3 years
    BEHAVIOUR_LOGS: 365 * 3, // 3 years
    COMMUNICATION_LOGS: 365 * 1, // 1 year
    SYSTEM_LOGS: 90, // 90 days
    AUDIT_LOGS: 365 * 7, // 7 years
  },
  
  // Temporary data
  TEMPORARY: {
    SESSION_DATA: 1, // 1 day
    CACHE_DATA: 7, // 7 days
    TEMP_FILES: 30, // 30 days
    BACKUP_FILES: 365, // 1 year
  },
} as const;

/**
 * Data classification for retention purposes
 */
export enum DataClassification {
  PERSONAL_DATA = 'personal_data',
  SENSITIVE_PERSONAL_DATA = 'sensitive_personal_data',
  CHILD_DATA = 'child_data',
  SAFEGUARDING_DATA = 'safeguarding_data',
  FINANCIAL_DATA = 'financial_data',
  OPERATIONAL_DATA = 'operational_data',
  SYSTEM_DATA = 'system_data',
}

/**
 * Retention policy configuration
 */
export interface RetentionPolicy {
  dataType: string;
  classification: DataClassification;
  retentionPeriodDays: number;
  archiveAfterDays?: number;
  requiresManualReview: boolean;
  legalBasis: string;
  description: string;
}

/**
 * Data retention policies
 */
export const RETENTION_POLICIES: Record<string, RetentionPolicy> = {
  student_records: {
    dataType: 'student_records',
    classification: DataClassification.CHILD_DATA,
    retentionPeriodDays: RETENTION_PERIODS.STUDENT_RECORDS.ACTIVE_STUDENT,
    archiveAfterDays: 365 * 2, // Archive after 2 years
    requiresManualReview: true,
    legalBasis: 'Education Act 2002, GDPR Article 6(1)(c)',
    description: 'Student academic and personal records',
  },
  
  safeguarding_records: {
    dataType: 'safeguarding_records',
    classification: DataClassification.SAFEGUARDING_DATA,
    retentionPeriodDays: RETENTION_PERIODS.SAFEGUARDING.CHILD_PROTECTION_RECORDS,
    requiresManualReview: true,
    legalBasis: 'Children Act 2004, GDPR Article 6(1)(c)',
    description: 'Child protection and safeguarding records',
  },
  
  financial_records: {
    dataType: 'financial_records',
    classification: DataClassification.FINANCIAL_DATA,
    retentionPeriodDays: RETENTION_PERIODS.FINANCIAL.INVOICES,
    archiveAfterDays: 365 * 2,
    requiresManualReview: false,
    legalBasis: 'Companies Act 2006, GDPR Article 6(1)(c)',
    description: 'Financial transactions and records',
  },
  
  attendance_records: {
    dataType: 'attendance_records',
    classification: DataClassification.OPERATIONAL_DATA,
    retentionPeriodDays: RETENTION_PERIODS.OPERATIONAL.ATTENDANCE_RECORDS,
    archiveAfterDays: 365,
    requiresManualReview: false,
    legalBasis: 'Education Act 2002, GDPR Article 6(1)(c)',
    description: 'Student attendance tracking',
  },
  
  system_logs: {
    dataType: 'system_logs',
    classification: DataClassification.SYSTEM_DATA,
    retentionPeriodDays: RETENTION_PERIODS.OPERATIONAL.SYSTEM_LOGS,
    requiresManualReview: false,
    legalBasis: 'GDPR Article 6(1)(f) - Legitimate interests',
    description: 'System operation and security logs',
  },
  
  audit_logs: {
    dataType: 'audit_logs',
    classification: DataClassification.SYSTEM_DATA,
    retentionPeriodDays: RETENTION_PERIODS.OPERATIONAL.AUDIT_LOGS,
    requiresManualReview: false,
    legalBasis: 'GDPR Article 6(1)(c) - Legal obligation',
    description: 'Audit trail and compliance logs',
  },
};

/**
 * Calculate retention expiry date
 */
export function calculateRetentionExpiry(
  createdDate: Date,
  retentionPeriodDays: number
): Date {
  const expiryDate = new Date(createdDate);
  expiryDate.setDate(expiryDate.getDate() + retentionPeriodDays);
  return expiryDate;
}

/**
 * Check if data should be archived
 */
export function shouldArchiveData(
  createdDate: Date,
  archiveAfterDays?: number
): boolean {
  if (!archiveAfterDays) return false;
  
  const archiveDate = new Date(createdDate);
  archiveDate.setDate(archiveDate.getDate() + archiveAfterDays);
  
  return new Date() >= archiveDate;
}

/**
 * Check if data has expired and should be deleted
 */
export function hasDataExpired(
  createdDate: Date,
  retentionPeriodDays: number
): boolean {
  const expiryDate = calculateRetentionExpiry(createdDate, retentionPeriodDays);
  return new Date() >= expiryDate;
}

/**
 * Get retention policy for data type
 */
export function getRetentionPolicy(dataType: string): RetentionPolicy | null {
  return RETENTION_POLICIES[dataType] || null;
}

/**
 * Data retention audit entry
 */
export interface RetentionAuditEntry {
  id: string;
  dataType: string;
  recordId: string;
  action: 'archived' | 'deleted' | 'reviewed' | 'extended';
  reason: string;
  performedBy: string;
  performedAt: Date;
  retentionPolicy: string;
  originalExpiryDate: Date;
  newExpiryDate?: Date;
}

/**
 * Log retention action for audit
 */
export function logRetentionAction(entry: RetentionAuditEntry): void {
  logger.info('Data retention action performed', {
    auditId: entry.id,
    dataType: entry.dataType,
    recordId: entry.recordId,
    action: entry.action,
    reason: entry.reason,
    performedBy: entry.performedBy,
    retentionPolicy: entry.retentionPolicy,
    originalExpiryDate: entry.originalExpiryDate.toISOString(),
    newExpiryDate: entry.newExpiryDate?.toISOString(),
  });
}

/**
 * Data subject request types for GDPR
 */
export enum DataSubjectRequestType {
  ACCESS = 'access', // Right to access
  RECTIFICATION = 'rectification', // Right to rectification
  ERASURE = 'erasure', // Right to erasure (right to be forgotten)
  RESTRICT_PROCESSING = 'restrict_processing', // Right to restrict processing
  DATA_PORTABILITY = 'data_portability', // Right to data portability
  OBJECT = 'object', // Right to object
}

/**
 * Data subject request
 */
export interface DataSubjectRequest {
  id: string;
  requestType: DataSubjectRequestType;
  dataSubjectId: string; // Student ID, staff ID, etc.
  requestedBy: string;
  requestDate: Date;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  completionDate?: Date;
  rejectionReason?: string;
  dataTypes: string[];
  legalBasis?: string;
}

/**
 * Create data subject request
 */
export function createDataSubjectRequest(
  requestType: DataSubjectRequestType,
  dataSubjectId: string,
  requestedBy: string,
  description: string,
  dataTypes: string[]
): DataSubjectRequest {
  const request: DataSubjectRequest = {
    id: `dsr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    requestType,
    dataSubjectId,
    requestedBy,
    requestDate: new Date(),
    description,
    status: 'pending',
    dataTypes,
  };
  
  logger.info('Data subject request created', {
    requestId: request.id,
    requestType,
    dataSubjectId,
    requestedBy,
    dataTypes,
  });
  
  return request;
}

/**
 * Anonymization utilities
 */
export const ANONYMIZATION_PATTERNS = {
  // Replace with anonymous identifiers
  STUDENT_ID: (id: string) => `ANON_STUDENT_${id.slice(-4)}`,
  STAFF_ID: (id: string) => `ANON_STAFF_${id.slice(-4)}`,
  
  // Replace personal identifiers
  NAME: () => '[REDACTED_NAME]',
  EMAIL: () => '[REDACTED_EMAIL]',
  PHONE: () => '[REDACTED_PHONE]',
  ADDRESS: () => '[REDACTED_ADDRESS]',
  
  // Keep statistical data but remove identifiers
  DATE_OF_BIRTH: (dob: string) => {
    const date = new Date(dob);
    return `${date.getFullYear()}-XX-XX`; // Keep year only
  },
  
  // Preserve data utility while removing identity
  POSTCODE: (postcode: string) => postcode.slice(0, 2) + 'X XXX',
};

/**
 * Anonymize data object
 */
export function anonymizeData(
  data: Record<string, any>,
  anonymizationRules: Record<string, (value: any) => any>
): Record<string, any> {
  const anonymized = { ...data };
  
  for (const [field, rule] of Object.entries(anonymizationRules)) {
    if (anonymized[field] !== undefined) {
      anonymized[field] = rule(anonymized[field]);
    }
  }
  
  return anonymized;
}

/**
 * Data retention scheduler configuration
 */
export interface RetentionScheduleConfig {
  enabled: boolean;
  scheduleExpression: string; // Cron expression
  batchSize: number;
  dryRun: boolean;
  notificationEmail?: string;
}

export const DEFAULT_RETENTION_SCHEDULE: RetentionScheduleConfig = {
  enabled: true,
  scheduleExpression: '0 2 * * 0', // Weekly on Sunday at 2 AM
  batchSize: 100,
  dryRun: false,
  notificationEmail: process.env.DATA_PROTECTION_EMAIL,
};