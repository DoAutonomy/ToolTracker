import { NextRequest, NextResponse } from 'next/server';
import { 
  createSuccessResponse, 
  createErrorResponse,
  HTTP_STATUS,
  ERROR_MESSAGES
} from '@/app/lib/api-utils';
import { getOverdueReturns } from '@/app/lib/database-utils';

// GET /api/queries/overdue-returns - Tools not returned after job end date
export async function GET(request: NextRequest) {
  try {
    const { data: overdueTools, error } = await getOverdueReturns();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // Calculate days overdue for each tool
    const processedTools = overdueTools?.map(item => {
      const endDate = new Date(item.jobs.end_date);
      const today = new Date();
      const daysOverdue = Math.floor((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        assignmentId: item.id,
        assignedAt: item.assigned_at,
        tool: item.tools,
        job: item.jobs,
        daysOverdue
      };
    }) || [];

    const count = processedTools.length;
    const message = count === 0 
      ? 'No overdue tool returns found' 
      : `Found ${count} overdue tool returns`;

    return NextResponse.json(
      createSuccessResponse({ tools: processedTools, count }, message),
      { status: HTTP_STATUS.OK }
    );

  } catch (error) {
    console.error('Overdue returns query GET error:', error);
    return NextResponse.json(
      createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}