import { NextRequest, NextResponse } from 'next/server';
import { 
  createSuccessResponse, 
  createErrorResponse,
  HTTP_STATUS,
  ERROR_MESSAGES
} from '@/app/lib/api-utils';
import { getToolUsageStats } from '@/app/lib/database-utils';

// GET /api/queries/tool-usage-stats - Tool usage statistics
export async function GET(request: NextRequest) {
  try {
    const { data: stats, error } = await getToolUsageStats();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // Calculate overall statistics
    const overallStats = {
      totalTools: stats?.length || 0,
      totalAssignments: stats?.reduce((sum, tool) => sum + tool.totalAssignments, 0) || 0,
      toolsCurrentlyAssigned: stats?.filter(tool => tool.currentlyAssigned).length || 0,
      averageUsageRate: stats?.length > 0 
        ? stats.reduce((sum, tool) => sum + tool.usageRate, 0) / stats.length 
        : 0
    };

    return NextResponse.json(
      createSuccessResponse(
        { 
          tools: stats || [], 
          summary: overallStats 
        }, 
        `Tool usage statistics for ${stats?.length || 0} tools`
      ),
      { status: HTTP_STATUS.OK }
    );

  } catch (error) {
    console.error('Tool usage stats query GET error:', error);
    return NextResponse.json(
      createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}