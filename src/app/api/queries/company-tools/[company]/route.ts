import { NextRequest, NextResponse } from 'next/server';
import { 
  createSuccessResponse, 
  createErrorResponse,
  HTTP_STATUS,
  ERROR_MESSAGES
} from '@/app/lib/api-utils';
import { getToolsByCompany } from '@/app/lib/database-utils';

// GET /api/queries/company-tools/[company] - All tools currently with company
export async function GET(
  request: NextRequest,
  { params }: { params: { company: string } }
) {
  try {
    const company = decodeURIComponent(params.company);

    if (!company || company.trim().length === 0) {
      return NextResponse.json(
        createErrorResponse('Company name is required'),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const { data: assignments, error } = await getToolsByCompany(company);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // Process assignments to separate current and historical
    const currentTools = assignments?.filter(a => !a.returned_at) || [];
    const historicalTools = assignments?.filter(a => a.returned_at) || [];

    const processedCurrentTools = currentTools.map(assignment => ({
      ...assignment.tools,
      assignmentId: assignment.id,
      assignedAt: assignment.assigned_at,
      job: assignment.jobs
    }));

    const processedHistoricalTools = historicalTools.map(assignment => ({
      ...assignment.tools,
      assignmentId: assignment.id,
      assignedAt: assignment.assigned_at,
      returnedAt: assignment.returned_at,
      job: assignment.jobs
    }));

    const summary = {
      currentlyAssigned: currentTools.length,
      historicalAssignments: historicalTools.length,
      totalAssignments: assignments?.length || 0,
      activeJobs: [...new Set(currentTools.map(t => t.jobs.job_id))].length
    };

    return NextResponse.json(
      createSuccessResponse({
        company,
        currentTools: processedCurrentTools,
        historicalTools: processedHistoricalTools,
        summary
      }, `Found ${summary.totalAssignments} tool assignments for ${company}`),
      { status: HTTP_STATUS.OK }
    );

  } catch (error) {
    console.error('Company tools query GET error:', error);
    return NextResponse.json(
      createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}