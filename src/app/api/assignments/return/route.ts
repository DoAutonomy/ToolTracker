import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/supabase-client';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  validateUUID,
  HTTP_STATUS,
  ERROR_MESSAGES
} from '@/app/lib/api-utils';
import { ReturnToolsRequest } from '@/app/types';

// PUT /api/assignments/return - Return tools from job
export async function PUT(request: NextRequest) {
  try {
    const body: ReturnToolsRequest = await request.json();

    // Validation
    if (!body.jobId || !validateUUID(body.jobId)) {
      return NextResponse.json(
        createErrorResponse('Valid job ID is required'),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    if (!body.toolIds || !Array.isArray(body.toolIds) || body.toolIds.length === 0) {
      return NextResponse.json(
        createErrorResponse('At least one tool ID is required'),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Validate all tool IDs are UUIDs
    for (const toolId of body.toolIds) {
      if (!validateUUID(toolId)) {
        return NextResponse.json(
          createErrorResponse(`Invalid tool ID format: ${toolId}`),
          { status: HTTP_STATUS.BAD_REQUEST }
        );
      }
    }

    // Check if job exists
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('job_id, company, finished')
      .eq('job_id', body.jobId)
      .single();

    if (jobError) {
      if (jobError.code === 'PGRST116') {
        return NextResponse.json(
          createErrorResponse(ERROR_MESSAGES.JOB_NOT_FOUND),
          { status: HTTP_STATUS.NOT_FOUND }
        );
      }
      
      console.error('Database error:', jobError);
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // Find current assignments for these tools to this job
    const { data: assignments, error: assignmentsError } = await supabase
      .from('job_to_tool')
      .select(`
        id,
        tool_id,
        assigned_at,
        returned_at,
        tools (
          tool_id,
          tin,
          tool_type
        )
      `)
      .eq('job_id', body.jobId)
      .in('tool_id', body.toolIds)
      .is('returned_at', null);

    if (assignmentsError) {
      console.error('Database error:', assignmentsError);
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    if (!assignments || assignments.length === 0) {
      return NextResponse.json(
        createErrorResponse('No active assignments found for the specified tools and job'),
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // Check if all requested tools have active assignments
    const assignedToolIds = assignments.map(a => a.tool_id);
    const notAssignedToolIds = body.toolIds.filter(id => !assignedToolIds.includes(id));

    if (notAssignedToolIds.length > 0) {
      return NextResponse.json(
        createErrorResponse(`Some tools are not currently assigned to this job: ${notAssignedToolIds.join(', ')}`),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Update assignments to mark as returned
    const assignmentIds = assignments.map(a => a.id);
    const { data: updatedAssignments, error: updateError } = await supabase
      .from('job_to_tool')
      .update({ returned_at: new Date().toISOString() })
      .in('id', assignmentIds)
      .select(`
        id,
        assigned_at,
        returned_at,
        tools (
          tool_id,
          tin,
          tool_type
        )
      `);

    if (updateError) {
      console.error('Database error:', updateError);
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // Get all tools that were supposed to be assigned to this job to check for missing ones
    const { data: allJobAssignments, error: allAssignmentsError } = await supabase
      .from('job_to_tool')
      .select(`
        id,
        tool_id,
        returned_at,
        tools (
          tool_id,
          tin,
          tool_type
        )
      `)
      .eq('job_id', body.jobId);

    if (allAssignmentsError) {
      console.error('Database error:', allAssignmentsError);
    }

    // Identify missing tools (still not returned)
    const missingTools = allJobAssignments
      ?.filter(assignment => !assignment.returned_at)
      ?.map(assignment => assignment.tools) || [];

    const result = {
      returnedTools: updatedAssignments?.map(a => a.tools) || [],
      missingTools,
      job: {
        jobId: job.job_id,
        company: job.company,
        finished: job.finished
      },
      summary: {
        returned: updatedAssignments?.length || 0,
        missing: missingTools.length
      }
    };

    const message = missingTools.length > 0 
      ? `${result.summary.returned} tools returned successfully. Warning: ${result.summary.missing} tools still missing from this job.`
      : `${result.summary.returned} tools returned successfully.`;

    return NextResponse.json(
      createSuccessResponse(result, message),
      { status: HTTP_STATUS.OK }
    );

  } catch (error) {
    console.error('Return tools PUT error:', error);
    return NextResponse.json(
      createErrorResponse(ERROR_MESSAGES.INVALID_REQUEST_BODY),
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }
}