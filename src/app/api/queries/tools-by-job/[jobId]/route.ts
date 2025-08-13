import { NextRequest, NextResponse } from 'next/server';
import { 
  createSuccessResponse, 
  createErrorResponse,
  validateUUID,
  HTTP_STATUS,
  ERROR_MESSAGES
} from '@/app/lib/api-utils';
import { getToolsAssignedToJob } from '@/app/lib/database-utils';

// GET /api/queries/tools-by-job/[jobId] - All tools for specific job
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    // Validate UUID
    if (!validateUUID(jobId)) {
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.INVALID_UUID),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const { data: assignments, error } = await getToolsAssignedToJob(jobId);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // Process assignments to provide detailed information
    const processedTools = assignments?.map(assignment => {
      const isReturned = !!assignment.returned_at;
      const durationDays = assignment.returned_at 
        ? Math.floor((new Date(assignment.returned_at).getTime() - new Date(assignment.assigned_at).getTime()) / (1000 * 60 * 60 * 24))
        : Math.floor((new Date().getTime() - new Date(assignment.assigned_at).getTime()) / (1000 * 60 * 60 * 24));

      return {
        ...assignment.tools,
        assignmentId: assignment.id,
        assignedAt: assignment.assigned_at,
        returnedAt: assignment.returned_at,
        isReturned,
        durationDays,
        status: isReturned ? 'returned' : 'assigned'
      };
    }) || [];

    const summary = {
      totalTools: processedTools.length,
      returnedTools: processedTools.filter(t => t.isReturned).length,
      missingTools: processedTools.filter(t => !t.isReturned).length,
      averageDurationDays: processedTools.length > 0 
        ? Math.round(processedTools.reduce((sum, t) => sum + t.durationDays, 0) / processedTools.length)
        : 0,
      toolTypes: [...new Set(processedTools.map(t => t.toolType))]
    };

    return NextResponse.json(
      createSuccessResponse({
        jobId,
        tools: processedTools,
        summary
      }, `Found ${processedTools.length} tools for job`),
      { status: HTTP_STATUS.OK }
    );

  } catch (error) {
    console.error('Tools by job query GET error:', error);
    return NextResponse.json(
      createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}