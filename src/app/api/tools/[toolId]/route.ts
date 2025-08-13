import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/supabase-client';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  mapDbToolToTool,
  validateUUID,
  validateToolType,
  HTTP_STATUS,
  ERROR_MESSAGES
} from '@/app/lib/api-utils';
import { Tool } from '@/app/types';

// GET /api/tools/[toolId] - Get tool by ID with job history
export async function GET(
  request: NextRequest,
  { params }: { params: { toolId: string } }
) {
  try {
    const { toolId } = params;

    // Validate UUID
    if (!validateUUID(toolId)) {
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.INVALID_UUID),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Get tool with its assignment history
    const { data, error } = await supabase
      .from('tools')
      .select(`
        *,
        job_to_tool (
          id,
          assigned_at,
          returned_at,
          jobs (
            job_id,
            company,
            start_date,
            end_date,
            finished
          )
        )
      `)
      .eq('tool_id', toolId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          createErrorResponse(ERROR_MESSAGES.TOOL_NOT_FOUND),
          { status: HTTP_STATUS.NOT_FOUND }
        );
      }
      
      console.error('Database error:', error);
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    const tool: Tool = mapDbToolToTool(data);
    
    // Add assignment history and current job info
    const toolWithJobs = {
      ...tool,
      jobHistory: data.job_to_tool || [],
      currentJob: data.job_to_tool?.find((jtt: any) => !jtt.returned_at)?.jobs || null,
      isCurrentlyAssigned: data.job_to_tool?.some((jtt: any) => !jtt.returned_at) || false
    };

    return NextResponse.json(
      createSuccessResponse(toolWithJobs),
      { status: HTTP_STATUS.OK }
    );

  } catch (error) {
    console.error('Tool GET error:', error);
    return NextResponse.json(
      createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

// PUT /api/tools/[toolId] - Update tool
export async function PUT(
  request: NextRequest,
  { params }: { params: { toolId: string } }
) {
  try {
    const { toolId } = params;
    const body = await request.json();

    // Validate UUID
    if (!validateUUID(toolId)) {
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.INVALID_UUID),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Validation - only allow updating tool_type for now
    // TIN updates could be dangerous as they're used for barcode scanning
    if (body.toolType !== undefined && !validateToolType(body.toolType)) {
      return NextResponse.json(
        createErrorResponse('Tool type must be valid'),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Build update object
    const updateData: any = {};
    if (body.toolType !== undefined) updateData.tool_type = body.toolType.trim();

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        createErrorResponse('No valid fields to update'),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Update the tool
    const { data, error } = await supabase
      .from('tools')
      .update(updateData)
      .eq('tool_id', toolId)
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          createErrorResponse(ERROR_MESSAGES.TOOL_NOT_FOUND),
          { status: HTTP_STATUS.NOT_FOUND }
        );
      }
      
      console.error('Database error:', error);
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    const tool: Tool = mapDbToolToTool(data);

    return NextResponse.json(
      createSuccessResponse(tool, 'Tool updated successfully'),
      { status: HTTP_STATUS.OK }
    );

  } catch (error) {
    console.error('Tool PUT error:', error);
    return NextResponse.json(
      createErrorResponse(ERROR_MESSAGES.INVALID_REQUEST_BODY),
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }
}

// DELETE /api/tools/[toolId] - Delete tool (only if never assigned)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { toolId: string } }
) {
  try {
    const { toolId } = params;

    // Validate UUID
    if (!validateUUID(toolId)) {
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.INVALID_UUID),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Check if tool has any assignments (current or historical)
    const { data: assignments, error: assignmentError } = await supabase
      .from('job_to_tool')
      .select('id')
      .eq('tool_id', toolId)
      .limit(1);

    if (assignmentError) {
      console.error('Database error:', assignmentError);
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // If tool has any assignments, don't allow deletion
    if (assignments && assignments.length > 0) {
      return NextResponse.json(
        createErrorResponse('Cannot delete tool that has been assigned to jobs'),
        { status: HTTP_STATUS.CONFLICT }
      );
    }

    // Delete the tool
    const { error } = await supabase
      .from('tools')
      .delete()
      .eq('tool_id', toolId);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    return NextResponse.json(
      createSuccessResponse(null, 'Tool deleted successfully'),
      { status: HTTP_STATUS.OK }
    );

  } catch (error) {
    console.error('Tool DELETE error:', error);
    return NextResponse.json(
      createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}