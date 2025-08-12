import { NextRequest, NextResponse } from 'next/server';
import { 
  createSuccessResponse, 
  createErrorResponse,
  HTTP_STATUS,
  ERROR_MESSAGES
} from '@/app/lib/api-utils';
import { getAvailableTools } from '@/app/lib/database-utils';

// GET /api/tools/available - Get all unassigned tools
export async function GET(request: NextRequest) {
  try {
    const { data: tools, error } = await getAvailableTools();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    return NextResponse.json(
      createSuccessResponse(tools || [], `Found ${tools?.length || 0} available tools`),
      { status: HTTP_STATUS.OK }
    );

  } catch (error) {
    console.error('Available tools GET error:', error);
    return NextResponse.json(
      createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}