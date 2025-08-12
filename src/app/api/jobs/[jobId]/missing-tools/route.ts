import { NextRequest, NextResponse } from 'next/server';
import { 
  createSuccessResponse, 
  createErrorResponse,
  validateUUID,
  HTTP_STATUS,
  ERROR_MESSAGES
} from '@/app/lib/api-utils';
import { getMissingToolsForJob } from '@/app/lib/database-utils';

// GET /api/jobs/[jobId]/missing-tools - Get missing tools for a job
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

    const { data: missingTools, error } = await getMissingToolsForJob(jobId);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    const count = missingTools?.length || 0;
    const message = count === 0 
      ? 'All tools have been returned for this job' 
      : `${count} tools are still missing from this job`;

    return NextResponse.json(
      createSuccessResponse({ tools: missingTools || [], count }, message),
      { status: HTTP_STATUS.OK }
    );

  } catch (error) {
    console.error('Job missing tools GET error:', error);
    return NextResponse.json(
      createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}