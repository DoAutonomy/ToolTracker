import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/supabase-client';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  validateUUID,
  HTTP_STATUS,
  ERROR_MESSAGES
} from '@/app/lib/api-utils';
import { AssignToolsRequest } from '@/app/types';

// POST /api/assignments - Assign tools to job
export async function POST(request: NextRequest) {
  try {
    const body: AssignToolsRequest = await request.json();

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

    // Check if job exists and is not finished
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('job_id, finished')
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

    if (job.finished) {
      return NextResponse.json(
        createErrorResponse('Cannot assign tools to finished job'),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Check if all tools exist and are not currently assigned
    const { data: tools, error: toolsError } = await supabase
      .from('tools')
      .select(`
        tool_id,
        tin,
        job_to_tool!left (
          id,
          returned_at
        )
      `)
      .in('tool_id', body.toolIds);

    if (toolsError) {
      console.error('Database error:', toolsError);
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    if (!tools || tools.length !== body.toolIds.length) {
      return NextResponse.json(
        createErrorResponse('One or more tools not found'),
        { status: HTTP_STATUS.NOT_FOUND }
      );
    }

    // Check for already assigned tools
    const alreadyAssigned = tools.filter(tool => 
      tool.job_to_tool?.some((jtt: any) => !jtt.returned_at)
    );

    if (alreadyAssigned.length > 0) {
      const assignedTins = alreadyAssigned.map(t => t.tin).join(', ');
      return NextResponse.json(
        createErrorResponse(`Tools already assigned: ${assignedTins}`),
        { status: HTTP_STATUS.CONFLICT }
      );
    }

    // Create assignments
    const assignmentData = body.toolIds.map(toolId => ({
      job_id: body.jobId,
      tool_id: toolId
    }));

    const { data: assignments, error: assignError } = await supabase
      .from('job_to_tool')
      .insert(assignmentData)
      .select(`
        id,
        assigned_at,
        tools (
          tool_id,
          tin,
          tool_type
        ),
        jobs (
          job_id,
          company
        )
      `);

    if (assignError) {
      console.error('Database error:', assignError);
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    return NextResponse.json(
      createSuccessResponse(assignments, `${assignments?.length} tools assigned successfully`),
      { status: HTTP_STATUS.CREATED }
    );

  } catch (error) {
    console.error('Assignment POST error:', error);
    return NextResponse.json(
      createErrorResponse(ERROR_MESSAGES.INVALID_REQUEST_BODY),
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }
}

// GET /api/assignments - Get all assignments with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const jobId = searchParams.get('jobId');
    const toolId = searchParams.get('toolId');
    const isReturned = searchParams.get('isReturned');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
      .from('job_to_tool')
      .select(`
        id,
        assigned_at,
        returned_at,
        tools (
          tool_id,
          tin,
          tool_type
        ),
        jobs (
          job_id,
          company,
          start_date,
          end_date,
          finished
        )
      `)
      .order('assigned_at', { ascending: false });

    // Apply filters
    if (jobId && validateUUID(jobId)) {
      query = query.eq('job_id', jobId);
    }
    if (toolId && validateUUID(toolId)) {
      query = query.eq('tool_id', toolId);
    }
    if (isReturned === 'true') {
      query = query.not('returned_at', 'is', null);
    } else if (isReturned === 'false') {
      query = query.is('returned_at', null);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    const response = {
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };

    return NextResponse.json(response, { status: HTTP_STATUS.OK });

  } catch (error) {
    console.error('Assignments GET error:', error);
    return NextResponse.json(
      createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}