import { NextRequest, NextResponse } from 'next/server';
import { 
  createSuccessResponse, 
  createErrorResponse,
  validateUUID,
  HTTP_STATUS,
  ERROR_MESSAGES
} from '@/app/lib/api-utils';
import { getJobHistoryForTool } from '@/app/lib/database-utils';

// GET /api/queries/job-history/[toolId] - Job history for specific tool
export async function GET(
  request: NextRequest,
  { params }: { params: { toolId: string } }
) {
  try {
    const { toolId } = params;

    // Validate UUID
    if (!validateUUID(toolId)) {
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.INVALID_UUID),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const { data: jobHistory, error } = await getJobHistoryForTool(toolId);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // Process the job history to add useful information
    const processedHistory = jobHistory?.map(assignment => {
      const isCurrentlyAssigned = !assignment.returned_at;
      const durationDays = assignment.returned_at 
        ? Math.floor((new Date(assignment.returned_at).getTime() - new Date(assignment.assigned_at).getTime()) / (1000 * 60 * 60 * 24))
        : Math.floor((new Date().getTime() - new Date(assignment.assigned_at).getTime()) / (1000 * 60 * 60 * 24));

      return {
        assignmentId: assignment.id,
        assignedAt: assignment.assigned_at,
        returnedAt: assignment.returned_at,
        isCurrentlyAssigned,
        durationDays,
        job: assignment.jobs
      };
    }) || [];

    const summary = {
      totalAssignments: processedHistory.length,
      currentlyAssigned: processedHistory.some(h => h.isCurrentlyAssigned),
      averageDurationDays: processedHistory.length > 0 
        ? Math.round(processedHistory.reduce((sum, h) => sum + h.durationDays, 0) / processedHistory.length)
        : 0,
      uniqueCompanies: [...new Set(processedHistory.map(h => h.job.company))].length
    };

    return NextResponse.json(
      createSuccessResponse(
        { history: processedHistory, summary }, 
        `Found ${processedHistory.length} assignments for tool`
      ),
      { status: HTTP_STATUS.OK }
    );

  } catch (error) {
    console.error('Job history query GET error:', error);
    return NextResponse.json(
      createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}