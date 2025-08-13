import { NextRequest, NextResponse } from 'next/server';
import { 
  createSuccessResponse, 
  createErrorResponse,
  validateUUID,
  HTTP_STATUS,
  ERROR_MESSAGES
} from '@/app/lib/api-utils';
import { getToolsAssignedToJob } from '@/app/lib/database-utils';

// GET /api/jobs/[jobId]/tools - Get all tools for a job
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

    // Transform the data to include assignment status
    const toolsWithAssignmentInfo = assignments?.map(assignment => ({
      ...assignment.tools,
      assignmentId: assignment.id,
      assignedAt: assignment.assigned_at,
      returnedAt: assignment.returned_at,
      isReturned: !!assignment.returned_at
    })) || [];

    const summary = {
      total: toolsWithAssignmentInfo.length,
      returned: toolsWithAssignmentInfo.filter(t => t.isReturned).length,
      missing: toolsWithAssignmentInfo.filter(t => !t.isReturned).length
    };

    const result = {
      tools: toolsWithAssignmentInfo,
      summary
    };

    return NextResponse.json(
      createSuccessResponse(result, `Found ${toolsWithAssignmentInfo.length} tools for job`),
      { status: HTTP_STATUS.OK }
    );

  } catch (error) {
    console.error('Job tools GET error:', error);
    return NextResponse.json(
      createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}