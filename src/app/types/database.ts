// Core Database Models - matching the database schema exactly

export interface Job {
  jobId: string; // job_id in database (UUID)
  company: string;
  startDate: string; // start_date (ISO date string)
  endDate: string | null; // end_date (ISO date string, null if ongoing)
  finished: boolean;
  createdAt: string; // created_at (ISO timestamp)
  updatedAt: string; // updated_at (ISO timestamp)
}

export interface Tool {
  toolId: string; // tool_id in database (UUID)
  tin: string; // Tool identification number (barcode)
  toolType: string; // tool_type (flexible string)
  dateAdded: string; // date_added (ISO date string)
  createdAt: string; // created_at (ISO timestamp)
  updatedAt: string; // updated_at (ISO timestamp)
}

export interface JobToTool {
  id: string; // Primary key (UUID)
  jobId: string; // job_id (Foreign key to Job)
  toolId: string; // tool_id (Foreign key to Tool)
  assignedAt: string; // assigned_at (ISO timestamp)
  returnedAt: string | null; // returned_at (ISO timestamp, null if still assigned)
  createdAt: string; // created_at (ISO timestamp)
}