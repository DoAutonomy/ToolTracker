# Tool Tracker API Documentation

This document provides comprehensive documentation for all API endpoints in the Tool Tracker Demo application.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

## Response Format

All API endpoints return JSON responses with a consistent format:

```json
{
  "success": boolean,
  "data": any,
  "error": string | null,
  "message": string | null
}
```

## Authentication

Currently, the demo uses Supabase's anonymous access. For production, consider implementing proper authentication.

## Error Handling

Standard HTTP status codes are used:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

---

## Jobs API

### Get All Jobs
```http
GET /api/jobs
```

**Query Parameters:**
- `finished` (boolean, optional) - Filter by job status
- `company` (string, optional) - Filter by company name
- `page` (number, optional, default: 1) - Page number
- `limit` (number, optional, default: 10) - Items per page

**Example Request:**
```bash
curl "http://localhost:3000/api/jobs?finished=false&limit=5"
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "jobId": "uuid-here",
      "company": "ABC Construction",
      "startDate": "2024-01-15",
      "endDate": null,
      "finished": false,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z",
      "toolCount": 5,
      "returnedToolCount": 0,
      "missingToolCount": 0
    }
  ]
}
```

### Create New Job
```http
POST /api/jobs
```

**Request Body:**
```json
{
  "company": "string (required)",
  "startDate": "YYYY-MM-DD (required)",
  "endDate": "YYYY-MM-DD (optional)"
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "company": "New Construction Co",
    "startDate": "2024-02-01"
  }'
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "new-uuid-here",
    "company": "New Construction Co",
    "startDate": "2024-02-01",
    "endDate": null,
    "finished": false,
    "createdAt": "2024-02-01T10:00:00Z",
    "updatedAt": "2024-02-01T10:00:00Z"
  }
}
```

### Get Job by ID
```http
GET /api/jobs/[jobId]
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "uuid-here",
    "company": "ABC Construction",
    "startDate": "2024-01-15",
    "endDate": "2024-01-20",
    "finished": true,
    "tools": [
      {
        "id": "assignment-uuid",
        "tool": {
          "toolId": "tool-uuid",
          "tin": "TIN001",
          "toolType": "drill",
          "dateAdded": "2024-01-01"
        },
        "assignedAt": "2024-01-15T08:00:00Z",
        "returnedAt": "2024-01-20T17:00:00Z",
        "isReturned": true
      }
    ],
    "toolCount": 5,
    "returnedToolCount": 5,
    "missingToolCount": 0
  }
}
```

### Update Job
```http
PUT /api/jobs/[jobId]
```

**Request Body:**
```json
{
  "company": "string (optional)",
  "startDate": "YYYY-MM-DD (optional)",
  "endDate": "YYYY-MM-DD (optional)",
  "finished": "boolean (optional)"
}
```

### Get Job Tools
```http
GET /api/jobs/[jobId]/tools
```

### Get Missing Tools for Job
```http
GET /api/jobs/[jobId]/missing-tools
```

---

## Tools API

### Get All Tools
```http
GET /api/tools
```

**Query Parameters:**
- `toolType` (string, optional) - Filter by tool type
- `isAssigned` (boolean, optional) - Filter by assignment status
- `tin` (string, optional) - Search by barcode
- `page` (number, optional, default: 1) - Page number
- `limit` (number, optional, default: 10) - Items per page

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "toolId": "uuid-here",
      "tin": "TIN001",
      "toolType": "drill",
      "dateAdded": "2024-01-01",
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2024-01-01T10:00:00Z",
      "isCurrentlyAssigned": false,
      "currentJob": null
    }
  ]
}
```

### Create New Tool
```http
POST /api/tools
```

**Request Body:**
```json
{
  "tin": "string (required, unique)",
  "toolType": "string (required)"
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/tools" \
  -H "Content-Type: application/json" \
  -d '{
    "tin": "TIN999",
    "toolType": "hammer"
  }'
```

### Get Tool by ID
```http
GET /api/tools/[toolId]
```

### Get Tool by Barcode/TIN
```http
GET /api/tools/by-tin/[tin]
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "toolId": "uuid-here",
    "tin": "TIN001",
    "toolType": "drill",
    "dateAdded": "2024-01-01",
    "isCurrentlyAssigned": true,
    "currentJob": {
      "jobId": "job-uuid",
      "company": "ABC Construction",
      "startDate": "2024-01-15"
    },
    "jobHistory": [
      {
        "id": "assignment-uuid",
        "job": {
          "jobId": "job-uuid",
          "company": "ABC Construction"
        },
        "assignedAt": "2024-01-15T08:00:00Z",
        "returnedAt": null,
        "isReturned": false
      }
    ]
  }
}
```

### Update Tool
```http
PUT /api/tools/[toolId]
```

### Get Available Tools
```http
GET /api/tools/available
```

Returns all tools not currently assigned to any job.

---

## Tool Assignment API

### Assign Tools to Job
```http
POST /api/assignments
```

**Request Body:**
```json
{
  "jobId": "string (required)",
  "toolIds": ["string array (required)"]
}
```

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/assignments" \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "job-uuid-here",
    "toolIds": ["tool-uuid-1", "tool-uuid-2"]
  }'
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "assigned": 2,
    "assignments": [
      {
        "id": "assignment-uuid-1",
        "jobId": "job-uuid-here",
        "toolId": "tool-uuid-1",
        "assignedAt": "2024-01-15T08:00:00Z"
      }
    ]
  }
}
```

### Return Tools from Job
```http
POST /api/assignments/return
```

**Request Body:**
```json
{
  "jobId": "string (required)",
  "toolIds": ["string array (required)"]
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "returned": 2,
    "stillMissing": 1,
    "missingTools": [
      {
        "toolId": "missing-tool-uuid",
        "tin": "TIN003",
        "toolType": "saw"
      }
    ]
  }
}
```

---

## Query/Search API

### Get Missing Tools
```http
GET /api/queries/missing-tools
```

Returns all tools assigned to finished jobs but not yet returned.

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "toolId": "uuid-here",
      "tin": "TIN003",
      "toolType": "saw",
      "jobId": "job-uuid",
      "company": "ABC Construction",
      "endDate": "2024-01-20",
      "assignedAt": "2024-01-15T08:00:00Z",
      "daysOverdue": 5
    }
  ]
}
```

### Get Tools by Job
```http
GET /api/queries/tools-by-job/[jobId]
```

### Get Job History for Tool
```http
GET /api/queries/job-history/[toolId]
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "tool": {
      "toolId": "uuid-here",
      "tin": "TIN001",
      "toolType": "drill"
    },
    "history": [
      {
        "job": {
          "jobId": "job-uuid-1",
          "company": "ABC Construction",
          "startDate": "2024-01-15",
          "endDate": "2024-01-20"
        },
        "assignedAt": "2024-01-15T08:00:00Z",
        "returnedAt": "2024-01-20T17:00:00Z",
        "daysAssigned": 5
      }
    ]
  }
}
```

### Get Tool Usage Statistics
```http
GET /api/queries/tool-usage-stats
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "totalTools": 50,
    "currentlyAssigned": 15,
    "available": 30,
    "missing": 5,
    "toolTypeBreakdown": {
      "drill": 10,
      "hammer": 8,
      "saw": 12
    },
    "assignmentStats": {
      "totalAssignments": 150,
      "averageAssignmentDays": 7.5,
      "mostUsedTool": {
        "tin": "TIN001",
        "toolType": "drill",
        "timesAssigned": 25
      }
    }
  }
}
```

### Get Company Tools
```http
GET /api/queries/company-tools/[company]
```

Returns all tools currently assigned to a specific company.

### Get Overdue Returns
```http
GET /api/queries/overdue-returns
```

Returns tools that should have been returned (job finished but tool not returned).

---

## Database Schema Reference

### Tables

#### `jobs`
```sql
CREATE TABLE jobs (
    job_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    finished BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `tools`
```sql
CREATE TABLE tools (
    tool_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tin VARCHAR(255) UNIQUE NOT NULL,
    tool_type VARCHAR(255) NOT NULL,
    date_added DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `job_to_tool`
```sql
CREATE TABLE job_to_tool (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(job_id) ON DELETE CASCADE,
    tool_id UUID NOT NULL REFERENCES tools(tool_id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    returned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Database Views

#### `currently_assigned_tools`
Tools currently assigned to jobs (not returned).

#### `missing_tools`
Tools assigned to finished jobs but not returned.

#### `available_tools`
Tools not currently assigned to any job.

### Indexes

- `idx_job_to_tool_job_id` - Fast job lookups
- `idx_job_to_tool_tool_id` - Fast tool lookups
- `idx_job_to_tool_returned_at` - Fast return status filtering
- `idx_tools_tin` - Fast barcode searches
- `idx_jobs_company` - Company filtering
- `idx_jobs_finished` - Status filtering

---

## Common Use Cases

### 1. Adding a New Tool (Scanning Mode 1)
```bash
# Step 1: Create the tool
curl -X POST "/api/tools" \
  -d '{"tin": "NEW001", "toolType": "drill"}'
```

### 2. Assigning Tools to Job (Scanning Mode 2)
```bash
# Step 1: Get available tools
curl "/api/tools?isAssigned=false"

# Step 2: Get tool by barcode
curl "/api/tools/by-tin/TIN001"

# Step 3: Assign tools to job
curl -X POST "/api/assignments" \
  -d '{"jobId": "job-uuid", "toolIds": ["tool-uuid-1", "tool-uuid-2"]}'
```

### 3. Returning Tools (Scanning Mode 3)
```bash
# Step 1: Get job details to see assigned tools
curl "/api/jobs/job-uuid"

# Step 2: Return specific tools
curl -X POST "/api/assignments/return" \
  -d '{"jobId": "job-uuid", "toolIds": ["tool-uuid-1", "tool-uuid-2"]}'
```

### 4. Finding Missing Tools
```bash
# Get all missing tools across all jobs
curl "/api/queries/missing-tools"

# Get missing tools for specific job
curl "/api/jobs/job-uuid/missing-tools"
```

---

## Rate Limiting

Currently, no rate limiting is implemented. For production, consider implementing rate limiting to prevent abuse.

## Webhooks

Webhook support is not currently implemented but could be added for:
- Tool assignment notifications
- Missing tool alerts
- Job completion notifications

## SDKs and Libraries

The API is RESTful and can be used with any HTTP client. Popular options:

- **JavaScript**: `fetch()`, `axios`
- **Python**: `requests`
- **cURL**: Command line testing
- **Postman**: API testing and documentation

---

This API documentation covers all available endpoints and provides examples for common use cases in the Tool Tracker Demo application.