# Tool Tracker Demo

A comprehensive tool tracking system designed to solve the critical problem of tool theft and loss. This demo addresses a company's annual $150,000 tool loss by providing barcode-based tracking, job assignment management, and comprehensive reporting capabilities.

## Problem Statement

- **$150,000 lost annually** to tool theft and misplacement
- No existing tracking system for tool whereabouts and recovery
- Previous TrackVia subscription was cancelled due to cost, losing all historical data
- Critical need for affordable, effective tool management solution

## Solution Overview

The Tool Tracker Demo provides three essential scanning modes for complete tool lifecycle management:

### 🔍 Three Scanning Modes

1. **Mode 1: Add New Tool** - Register new tools into the system with barcode scanning
2. **Mode 2: Assign Tools to Job** - Track which tools are assigned to specific jobs
3. **Mode 3: Return Tools from Job** - Process tool returns and identify missing items

### 🎯 Key Features

- **Barcode Scanning Interface** - Quick tool identification and processing
- **Job Management** - Track tools across different company jobs and projects
- **Missing Tools Detection** - Automatic alerts for unreturned tools
- **Search & Query System** - Powerful reporting and tool lookup capabilities
- **Real-time Status Tracking** - Know exactly where every tool is at all times

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (ready for future implementation)
- **Deployment**: Vercel-ready configuration

## Quick Start

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### 1. Clone and Install

```bash
git clone <repository-url>
cd tool-tracker
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

1. Log into your [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Go to the SQL Editor
4. Copy and paste the schema from `supabase/schema.sql`
5. Run the SQL to create all tables and views

### 4. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Application Structure

```
src/
├── app/
│   ├── page.tsx              # Dashboard/Home page
│   ├── scan/                 # Scanning interface
│   │   └── page.tsx          # Three-mode scanning system
│   ├── search/               # Search and query system
│   │   └── page.tsx          # Tool and job search interface
│   ├── api/                  # Next.js API routes
│   │   ├── jobs/             # Job management endpoints
│   │   ├── tools/            # Tool management endpoints
│   │   ├── assignments/      # Tool assignment endpoints
│   │   └── queries/          # Search and reporting endpoints
│   ├── components/           # Reusable UI components
│   └── types/               # TypeScript type definitions
```

## Features Walkthrough

### 🏠 Dashboard
- Overview of active jobs and tool statistics
- Quick navigation to scanning and search functions
- Real-time status indicators

### 🔍 Scanning Interface (`/scan`)

**Mode 1: Add New Tool**
1. Select "Add New Tool" mode
2. Enter tool type (drill, saw, hammer, etc.)
3. Scan or enter tool barcode (TIN)
4. Tool is registered in the system

**Mode 2: Assign Tools to Job**
1. Select "Assign Tools to Job" mode
2. Choose the job from dropdown
3. Scan multiple tool barcodes
4. Submit to assign all tools to the job

**Mode 3: Return Tools from Job**
1. Select "Return Tools from Job" mode
2. Choose the job from dropdown
3. Scan returned tool barcodes
4. System automatically detects missing tools
5. Displays warning for any unreturned tools

### 🔍 Search Interface (`/search`)
- **Missing Tools**: Find all unreturned tools across all jobs
- **Active Jobs**: View jobs currently in progress
- **Tool Lookup**: Search by barcode, type, or assignment status
- **Job History**: View complete assignment history for any tool
- **Company Reports**: See all tools currently assigned to specific companies

## Database Schema

### Core Tables

**`jobs`** - Job information and status
- `job_id` (UUID, Primary Key)
- `company` (Company name)
- `start_date` / `end_date` (Job timeline)
- `finished` (Boolean status)

**`tools`** - Tool inventory
- `tool_id` (UUID, Primary Key)
- `tin` (Tool Identification Number - barcode)
- `tool_type` (Category: drill, saw, etc.)
- `date_added` (Registration date)

**`job_to_tool`** - Assignment tracking
- `job_id` / `tool_id` (Relationships)
- `assigned_at` (Assignment timestamp)
- `returned_at` (Return timestamp, NULL if not returned)

### Database Views

- `currently_assigned_tools` - Tools currently out on jobs
- `missing_tools` - Tools assigned to finished jobs but not returned
- `available_tools` - Tools available for assignment

## API Endpoints

### Jobs
- `GET /api/jobs` - List all jobs with filtering
- `POST /api/jobs` - Create new job
- `GET /api/jobs/[jobId]` - Get job details with tools
- `GET /api/jobs/[jobId]/tools` - Get all tools for job
- `GET /api/jobs/[jobId]/missing-tools` - Get missing tools for job

### Tools
- `GET /api/tools` - List all tools with filtering
- `POST /api/tools` - Add new tool
- `GET /api/tools/[toolId]` - Get tool details with history
- `GET /api/tools/by-tin/[tin]` - Get tool by barcode
- `GET /api/tools/available` - Get unassigned tools

### Assignments
- `POST /api/assignments` - Assign tools to job
- `POST /api/assignments/return` - Return tools from job

### Queries
- `GET /api/queries/missing-tools` - All missing tools
- `GET /api/queries/tool-usage-stats` - Usage statistics
- `GET /api/queries/company-tools/[company]` - Tools by company
- `GET /api/queries/overdue-returns` - Overdue tool returns

## Deployment Guide

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Production Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

## Development

### Adding New Tool Types

Tool types are flexible strings. Common examples:
- Power tools: `drill`, `circular_saw`, `impact_driver`
- Hand tools: `hammer`, `screwdriver_set`, `wrench_set`
- Measuring: `tape_measure`, `level`, `square`

### Custom Queries

Add new preset queries in `/src/app/search/page.tsx`:

```typescript
const customQuery = {
  name: "Custom Report",
  endpoint: "/api/queries/custom-endpoint",
  description: "Your custom query description"
};
```

### Barcode Integration

The system accepts barcode input through:
- Physical barcode scanners (acts as keyboard input)
- Manual entry for testing
- Camera scanning (ready for future implementation)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For questions or issues:
1. Check the troubleshooting section below
2. Review the API documentation
3. Create an issue on GitHub

## Troubleshooting

### Common Issues

**Database Connection Errors**
- Verify your Supabase URL and API key in `.env.local`
- Ensure your Supabase project is active
- Check that the schema has been properly applied

**Tools Not Scanning**
- Verify the tool exists in the database (Mode 1 first)
- Check for duplicate TIN entries
- Ensure proper job selection for Modes 2 & 3

**Missing Tools Not Detected**
- Ensure the job is marked as `finished: true`
- Verify tools were properly assigned before attempting return
- Check that `returned_at` is NULL for missing tools

## License

MIT License - See LICENSE file for details

## Roadmap

Future enhancements planned:
- Mobile app for field scanning
- Photo documentation for tools
- Maintenance scheduling
- Advanced reporting dashboards
- Integration with existing inventory systems

---

**Built to solve real problems. Designed for production use. Ready to save your company thousands in tool losses.**