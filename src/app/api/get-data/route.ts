import { NextResponse } from "next/server";
import { supabase } from "@/app/supabase-client";
import {
  createSuccessResponse,
  createErrorResponse,
  HTTP_STATUS,
  ERROR_MESSAGES
} from "@/app/lib/api-utils";
import {
  getAvailableTools,
  getAllMissingTools,
  getCurrentlyAssignedTools,
  getToolCountsByType
} from "@/app/lib/database-utils";

// GET /api/get-data - Get dashboard summary data
export async function GET(req: Request) {
  try {
    // Get basic counts
    const [
      { data: jobs, error: jobsError },
      { data: tools, error: toolsError },
      { data: assignments, error: assignmentsError }
    ] = await Promise.all([
      supabase.from('jobs').select('job_id, finished').order('created_at', { ascending: false }),
      supabase.from('tools').select('tool_id').order('created_at', { ascending: false }),
      supabase.from('job_to_tool').select('id, returned_at').order('created_at', { ascending: false })
    ]);

    if (jobsError || toolsError || assignmentsError) {
      console.error("Database errors:", { jobsError, toolsError, assignmentsError });
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // Get detailed information
    const [
      { data: availableTools, error: availableError },
      { data: missingTools, error: missingError },
      { data: assignedTools, error: assignedError },
      { data: toolCounts, error: countsError }
    ] = await Promise.all([
      getAvailableTools(),
      getAllMissingTools(),
      getCurrentlyAssignedTools(),
      getToolCountsByType()
    ]);

    if (availableError || missingError || assignedError || countsError) {
      console.error("Utility function errors:", { availableError, missingError, assignedError, countsError });
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // Calculate summary statistics
    const totalJobs = jobs?.length || 0;
    const activeJobs = jobs?.filter(job => !job.finished).length || 0;
    const completedJobs = totalJobs - activeJobs;
    
    const totalTools = tools?.length || 0;
    const availableToolsCount = availableTools?.length || 0;
    const assignedToolsCount = assignedTools?.length || 0;
    const missingToolsCount = missingTools?.length || 0;

    const totalAssignments = assignments?.length || 0;
    const activeAssignments = assignments?.filter(a => !a.returned_at).length || 0;
    const completedAssignments = totalAssignments - activeAssignments;

    const dashboardData = {
      summary: {
        jobs: {
          total: totalJobs,
          active: activeJobs,
          completed: completedJobs
        },
        tools: {
          total: totalTools,
          available: availableToolsCount,
          assigned: assignedToolsCount,
          missing: missingToolsCount
        },
        assignments: {
          total: totalAssignments,
          active: activeAssignments,
          completed: completedAssignments
        }
      },
      recentJobs: jobs?.slice(0, 5) || [],
      recentTools: tools?.slice(0, 5) || [],
      toolsByType: toolCounts || [],
      alerts: {
        missingTools: missingToolsCount,
        overdueReturns: missingTools?.filter((tool: any) => tool.days_overdue > 0).length || 0
      }
    };

    return NextResponse.json(
      createSuccessResponse(dashboardData, "Dashboard data retrieved successfully"),
      { status: HTTP_STATUS.OK }
    );

  } catch (error) {
    console.error("[/api/get-data] Error:", error);
    return NextResponse.json(
      createErrorResponse(error instanceof Error ? error.message : "Unknown error"),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}