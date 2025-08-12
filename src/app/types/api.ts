import { Job, Tool, JobToTool } from './database';

// Extended Models with Relations
export interface JobWithTools extends Job {
  tools: ToolAssignment[];
  toolCount: number;
  returnedToolCount: number;
  missingToolCount: number;
}

export interface ToolWithJobs extends Tool {
  currentJob: Job | null;
  jobHistory: JobAssignment[];
  isCurrentlyAssigned: boolean;
}

export interface ToolAssignment {
  id: string;
  tool: Tool;
  job: Job;
  assignedAt: string;
  returnedAt: string | null;
  isReturned: boolean;
}

export interface JobAssignment {
  id: string;
  job: Job;
  tool: Tool;
  assignedAt: string;
  returnedAt: string | null;
  isReturned: boolean;
}

// API Request Types
export interface CreateJobRequest {
  company: string;
  startDate: string;
  endDate?: string;
}

export interface UpdateJobRequest {
  company?: string;
  startDate?: string;
  endDate?: string;
  finished?: boolean;
}

export interface CreateToolRequest {
  tin: string;
  toolType: string;
}

export interface AssignToolsRequest {
  jobId: string;
  toolIds: string[];
}

export interface ReturnToolsRequest {
  jobId: string;
  toolIds: string[];
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Query Parameter Types
export interface GetJobsParams {
  finished?: boolean;
  company?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface GetToolsParams {
  toolType?: string;
  isAssigned?: boolean;
  jobId?: string;
  tin?: string; // Search by barcode
  page?: number;
  limit?: number;
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  field?: string; // For validation errors
}

export class ToolTrackerError extends Error {
  code: string;
  details?: any;
  
  constructor(code: string, message: string, details?: any) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = 'ToolTrackerError';
  }
}