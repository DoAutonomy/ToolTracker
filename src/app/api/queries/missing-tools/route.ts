import { NextRequest, NextResponse } from 'next/server';
import { 
  createSuccessResponse, 
  createErrorResponse,
  HTTP_STATUS,
  ERROR_MESSAGES
} from '@/app/lib/api-utils';
import { getAllMissingTools } from '@/app/lib/database-utils';

// GET /api/queries/missing-tools - All currently missing tools
export async function GET(request: NextRequest) {
  try {
    const { data: missingTools, error } = await getAllMissingTools();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    const count = missingTools?.length || 0;
    const message = count === 0 
      ? 'No missing tools found' 
      : `Found ${count} missing tools`;

    return NextResponse.json(
      createSuccessResponse({ tools: missingTools || [], count }, message),
      { status: HTTP_STATUS.OK }
    );

  } catch (error) {
    console.error('Missing tools query GET error:', error);
    return NextResponse.json(
      createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}