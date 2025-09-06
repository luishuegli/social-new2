import { NextResponse } from 'next/server';

/**
 * Production-ready error handler for API routes
 */
export class APIError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'APIError';
  }
}

/**
 * Handle API errors in a consistent, production-ready way
 */
export function handleAPIError(error, context = '') {
  // Log error for monitoring (replace with your logging service)
  const errorId = generateErrorId();
  
  // Log to server (in production, use proper logging service like Winston, DataDog, etc.)
  logError({
    errorId,
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    statusCode: error.statusCode || 500
  });

  // Return user-friendly error response
  if (error instanceof APIError) {
    return NextResponse.json(
      { 
        error: error.message,
        code: error.code,
        errorId: errorId
      }, 
      { status: error.statusCode }
    );
  }

  // Handle unknown errors
  return NextResponse.json(
    { 
      error: 'An unexpected error occurred. Please try again.',
      errorId: errorId
    }, 
    { status: 500 }
  );
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(data, requiredFields) {
  const missing = requiredFields.filter(field => !data[field]);
  
  if (missing.length > 0) {
    throw new APIError(
      `Missing required fields: ${missing.join(', ')}`,
      400,
      'MISSING_FIELDS'
    );
  }
}

/**
 * Validate user authentication
 */
export function validateAuth(userId) {
  if (!userId) {
    throw new APIError(
      'Authentication required',
      401,
      'AUTH_REQUIRED'
    );
  }
}

/**
 * Generate unique error ID for tracking
 */
function generateErrorId() {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Log error (replace with proper logging service in production)
 */
function logError(errorData) {
  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', errorData);
    return;
  }

  // In production, send to logging service
  // Example: Send to DataDog, Winston, CloudWatch, etc.
  // logToService(errorData);
  
  // For now, just log essential info
  console.error(`[${errorData.errorId}] ${errorData.context}: ${errorData.message}`);
}

