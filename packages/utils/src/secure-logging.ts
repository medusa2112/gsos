import { SECURITY_CONFIG, redactSensitiveData } from './security-config';

/**
 * Secure Logging Utility for GSOS
 * Implements PII minimization and token redaction
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  AUDIT = 'audit',
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  operation?: string;
  resource?: string;
  metadata?: Record<string, any>;
  error?: Error;
}

export interface AuditLogEntry extends LogEntry {
  level: LogLevel.AUDIT;
  operation: string;
  resource: string;
  success: boolean;
  duration?: number;
  dataClassification?: 'public' | 'internal' | 'confidential' | 'restricted';
}

/**
 * Patterns for detecting and redacting sensitive information
 */
const SENSITIVE_PATTERNS = {
  // Authentication tokens
  JWT_TOKEN: /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g,
  BEARER_TOKEN: /Bearer\s+[A-Za-z0-9-._~+/]+=*/g,
  API_KEY: /(?:api[_-]?key|apikey)["\s:=]+[A-Za-z0-9-._~+/]{20,}/gi,
  
  // Personal identifiers
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  PHONE: /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g,
  SSN: /\b\d{3}-?\d{2}-?\d{4}\b/g,
  
  // Financial information
  CREDIT_CARD: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  BANK_ACCOUNT: /\b\d{8,17}\b/g,
  
  // Student identifiers
  STUDENT_ID: /(?:student[_-]?id|studentid)["\s:=]+[A-Za-z0-9-]{6,}/gi,
  
  // Passwords and secrets
  PASSWORD: /(?:password|passwd|pwd)["\s:=]+[^\s"',}]+/gi,
  SECRET: /(?:secret|key)["\s:=]+[A-Za-z0-9+/=]{16,}/gi,
};

/**
 * Redact sensitive information from text
 */
export function redactSensitiveText(text: string): string {
  let redacted = text;
  
  // Apply all redaction patterns
  Object.entries(SENSITIVE_PATTERNS).forEach(([type, pattern]) => {
    redacted = redacted.replace(pattern, `[REDACTED_${type}]`);
  });
  
  return redacted;
}

/**
 * Redact sensitive information from objects
 */
export function redactSensitiveObject(obj: any): any {
  if (typeof obj === 'string') {
    return redactSensitiveText(obj);
  }
  
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveObject(item));
  }
  
  const redacted: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    // Check if key indicates sensitive data
    const piiFields = ['email', 'phone', 'address', 'ssn', 'dob', 'name'];
    if (piiFields.some(field => lowerKey.includes(field))) {
      redacted[key] = '[REDACTED_PII]';
    } else if (lowerKey.includes('token') || lowerKey.includes('password') || 
               lowerKey.includes('secret') || lowerKey.includes('key')) {
      redacted[key] = '[REDACTED_CREDENTIAL]';
    } else {
      redacted[key] = redactSensitiveObject(value);
    }
  }
  
  return redacted;
}

/**
 * Sanitize IP address for logging (remove last octet for privacy)
 */
export function sanitizeIPAddress(ip?: string): string | undefined {
  if (!ip) return undefined;
  
  // IPv4
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
    }
  }
  
  // IPv6 - truncate to first 4 groups
  if (ip.includes(':')) {
    const parts = ip.split(':');
    if (parts.length >= 4) {
      return `${parts.slice(0, 4).join(':')}::xxxx`;
    }
  }
  
  return '[REDACTED_IP]';
}

/**
 * Create a secure log entry
 */
export function createLogEntry(
  level: LogLevel,
  message: string,
  metadata?: Partial<LogEntry>
): LogEntry {
  const entry: LogEntry = {
    level,
    message: redactSensitiveText(message),
    timestamp: new Date().toISOString(),
    ...metadata,
  };
  
  // Sanitize sensitive fields
  if (entry.ipAddress) {
    entry.ipAddress = sanitizeIPAddress(entry.ipAddress);
  }
  
  if (entry.metadata) {
    entry.metadata = redactSensitiveObject(entry.metadata);
  }
  
  if (entry.error) {
    entry.error = {
      ...entry.error,
      message: redactSensitiveText(entry.error.message),
      stack: entry.error.stack ? redactSensitiveText(entry.error.stack) : undefined,
    } as Error;
  }
  
  return entry;
}

/**
 * Create an audit log entry
 */
export function createAuditLogEntry(
  operation: string,
  resource: string,
  success: boolean,
  metadata?: Partial<AuditLogEntry>
): AuditLogEntry {
  return {
    ...createLogEntry(LogLevel.AUDIT, `${operation} ${resource}`, metadata),
    level: LogLevel.AUDIT,
    operation,
    resource,
    success,
    dataClassification: metadata?.dataClassification || 'internal',
  } as AuditLogEntry;
}

/**
 * Secure logger class
 */
export class SecureLogger {
  private context: string;
  
  constructor(context: string) {
    this.context = context;
  }
  
  public log(entry: LogEntry): void {
    const logData = {
      ...entry,
      context: this.context,
    };
    
    // In production, this would send to CloudWatch, DataDog, or other logging service
    console.log(JSON.stringify(logData));
  }
  
  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log(createLogEntry(LogLevel.ERROR, message, { error, metadata }));
  }
  
  warn(message: string, metadata?: Record<string, any>): void {
    this.log(createLogEntry(LogLevel.WARN, message, { metadata }));
  }
  
  info(message: string, metadata?: Record<string, any>): void {
    this.log(createLogEntry(LogLevel.INFO, message, { metadata }));
  }
  
  debug(message: string, metadata?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      this.log(createLogEntry(LogLevel.DEBUG, message, { metadata }));
    }
  }
  
  audit(
    operation: string,
    resource: string,
    success: boolean,
    metadata?: Partial<AuditLogEntry>
  ): void {
    this.log(createAuditLogEntry(operation, resource, success, metadata));
  }
}

/**
 * Request logging middleware
 */
export function logRequest(
  method: string,
  path: string,
  userId?: string,
  metadata?: Record<string, any>
): void {
  const logger = new SecureLogger('HTTP');
  
  logger.info(`${method} ${path}`, {
    userId,
    operation: 'http_request',
    resource: path,
    ...metadata,
  });
}

/**
 * Error logging utility
 */
export function logError(
  error: Error,
  context: string,
  metadata?: Record<string, any>
): void {
  const logger = new SecureLogger(context);
  
  logger.error(error.message, error, metadata);
}

/**
 * Security event logging
 */
export function logSecurityEvent(
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  metadata?: Record<string, any>
): void {
  const logger = new SecureLogger('SECURITY');
  
  const level = severity === 'critical' || severity === 'high' ? LogLevel.ERROR : LogLevel.WARN;
  
  logger.log(createLogEntry(level, `Security event: ${event}`, {
    metadata: {
      ...metadata,
      severity,
      securityEvent: true,
    },
  }));
}

/**
 * Data access logging for compliance
 */
export function logDataAccess(
  operation: 'read' | 'write' | 'delete',
  dataType: string,
  userId: string,
  success: boolean,
  metadata?: Record<string, any>
): void {
  const logger = new SecureLogger('DATA_ACCESS');
  
  logger.audit(
    `${operation}_${dataType}`,
    dataType,
    success,
    {
      userId,
      dataClassification: dataType.includes('student') ? 'confidential' : 'internal',
      ...metadata,
    }
  );
}

/**
 * Performance logging
 */
export function logPerformance(
  operation: string,
  duration: number,
  metadata?: Record<string, any>
): void {
  const logger = new SecureLogger('PERFORMANCE');
  
  logger.info(`Operation ${operation} completed in ${duration}ms`, {
    operation,
    duration,
    ...metadata,
  });
}

/**
 * Export default logger instance
 */
export const logger = new SecureLogger('GSOS');