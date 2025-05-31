import { NextResponse } from 'next/server';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, true, 'AUTH_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, true, 'AUTHORIZATION_ERROR');
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed') {
    super(message, 400, true, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, true, 'NOT_FOUND_ERROR');
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500, true, 'DATABASE_ERROR');
  }
}

// Error response utility for API routes
export function createErrorResponse(error: unknown, defaultMessage: string = 'Internal server error') {
  if (error instanceof AppError) {
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        code: error.code 
      },
      { status: error.statusCode }
    );
  }

  // Log unexpected errors
  console.error('Unexpected error:', error);

  // Return generic error for security
  return NextResponse.json(
    { 
      success: false,
      error: defaultMessage,
      code: 'INTERNAL_ERROR' 
    },
    { status: 500 }
  );
}

// Log error utility
export function logError(error: Error, context?: string) {
  const timestamp = new Date().toISOString();
  const logLevel = process.env.LOG_LEVEL || 'info';
  const debugMode = process.env.DEBUG_MODE === 'true';

  if (debugMode || logLevel === 'debug') {
    console.error(`[${timestamp}] ${context ? `[${context}] ` : ''}ERROR:`, {
      message: error.message,
      stack: error.stack,
      ...(error instanceof AppError && { 
        statusCode: error.statusCode, 
        code: error.code 
      })
    });
  } else {
    console.error(`[${timestamp}] ${context ? `[${context}] ` : ''}ERROR:`, error.message);
  }
}

// Validation utilities
export function validateRequired(value: any, fieldName: string): void {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} is required`);
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
}

export function validateRole(role: string): void {
  const validRoles = ['student', 'teacher', 'principal'];
  if (!validRoles.includes(role)) {
    throw new ValidationError(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
  }
}

export function validateDateRange(startDate: string, endDate: string): void {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new ValidationError('Invalid date format');
  }
  
  if (start > end) {
    throw new ValidationError('Start date must be before end date');
  }
}

export function validateMarks(obtained: number, max: number): void {
  if (obtained < 0 || max < 0) {
    throw new ValidationError('Marks cannot be negative');
  }
  
  if (obtained > max) {
    throw new ValidationError('Obtained marks cannot exceed maximum marks');
  }
}

// Validate multiple required fields
export function validateRequiredFields(obj: any, fields: string[]): void {
  const missing = fields.filter(field => 
    obj[field] === undefined || obj[field] === null || obj[field] === ''
  );
  
  if (missing.length > 0) {
    throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
  }
}
