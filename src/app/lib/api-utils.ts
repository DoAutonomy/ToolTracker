import { ApiResponse, ApiError, ToolTrackerError } from '../types';

// API utility functions for handling requests and responses

export const handleApiError = (error: any): ApiError => {
  // Handle different types of errors
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  
  if (error instanceof ToolTrackerError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details
    };
  }
  
  return {
    code: 'UNKNOWN_ERROR',
    message: error.message || 'An unexpected error occurred'
  };
};

export const createApiResponse = <T>(
  success: boolean,
  data?: T,
  error?: string,
  message?: string
): ApiResponse<T> => {
  return {
    success,
    data,
    error,
    message
  };
};

export const createSuccessResponse = <T>(
  data: T,
  message?: string
): ApiResponse<T> => {
  return createApiResponse(true, data, undefined, message);
};

export const createErrorResponse = (
  error: string,
  details?: any
): ApiResponse => {
  return createApiResponse(false, undefined, error);
};

// Database field mapping utilities
export const mapDbJobToJob = (dbRow: any) => {
  return {
    jobId: dbRow.job_id,
    company: dbRow.company,
    startDate: dbRow.start_date,
    endDate: dbRow.end_date,
    finished: dbRow.finished,
    createdAt: dbRow.created_at,
    updatedAt: dbRow.updated_at
  };
};

export const mapDbToolToTool = (dbRow: any) => {
  return {
    toolId: dbRow.tool_id,
    tin: dbRow.tin,
    toolType: dbRow.tool_type,
    dateAdded: dbRow.date_added,
    createdAt: dbRow.created_at,
    updatedAt: dbRow.updated_at
  };
};

export const mapDbAssignmentToAssignment = (dbRow: any) => {
  return {
    id: dbRow.id,
    jobId: dbRow.job_id,
    toolId: dbRow.tool_id,
    assignedAt: dbRow.assigned_at,
    returnedAt: dbRow.returned_at,
    createdAt: dbRow.created_at
  };
};

// Validation utilities
export const validateUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const validateTin = (tin: string): boolean => {
  // Basic validation - adjust based on your barcode format requirements
  return tin.trim().length > 0 && tin.length <= 255;
};

export const validateCompanyName = (company: string): boolean => {
  return company.trim().length > 0 && company.length <= 255;
};

export const validateToolType = (toolType: string): boolean => {
  return toolType.trim().length > 0 && toolType.length <= 255;
};

export const validateDateString = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

// HTTP status code helpers
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
} as const;

// Common error messages
export const ERROR_MESSAGES = {
  INVALID_UUID: 'Invalid UUID format',
  TOOL_NOT_FOUND: 'Tool not found',
  JOB_NOT_FOUND: 'Job not found',
  TOOL_ALREADY_EXISTS: 'Tool with this TIN already exists',
  TOOL_ALREADY_ASSIGNED: 'Tool is already assigned to a job',
  TOOL_NOT_ASSIGNED: 'Tool is not currently assigned to any job',
  INVALID_REQUEST_BODY: 'Invalid request body',
  DATABASE_ERROR: 'Database operation failed',
  VALIDATION_ERROR: 'Validation failed'
} as const;