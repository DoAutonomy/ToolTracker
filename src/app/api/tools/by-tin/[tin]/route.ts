import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/supabase-client';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  mapDbToolToTool,
  validateTin,
  HTTP_STATUS,
  ERROR_MESSAGES
} from '@/app/lib/api-utils';
import { Tool } from '@/app/types';

// GET /api/tools/by-tin/[tin] - Get tool by barcode/TIN
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tin: string }> }
) {
  try {
    const { tin } = await params;

    // Validate TIN
    if (!validateTin(decodeURIComponent(tin))) {
      return NextResponse.json(
        createErrorResponse('Invalid tool identification number'),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Get tool with current assignment info
    const { data, error } = await supabase
      .from('tools')
      .select(`
        *,
        job_to_tool!inner (
          id,
          assigned_at,
          returned_at,
          jobs (
            job_id,
            company,
            finished
          )
        )
      `)
      .eq('tin', decodeURIComponent(tin))
      .is('job_to_tool.returned_at', null)
      .single();

    // If no current assignment found, try to get tool without assignment
    if (error && error.code === 'PGRST116') {
      const { data: toolData, error: toolError } = await supabase
        .from('tools')
        .select('*')
        .eq('tin', decodeURIComponent(tin))
        .single();

      if (toolError) {
        if (toolError.code === 'PGRST116') {
          return NextResponse.json(
            createErrorResponse(ERROR_MESSAGES.TOOL_NOT_FOUND),
            { status: HTTP_STATUS.NOT_FOUND }
          );
        }
        
        console.error('Database error:', toolError);
        return NextResponse.json(
          createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
          { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        );
      }

      const tool: Tool = mapDbToolToTool(toolData);
      
      // Tool exists but has no current assignment
      const toolWithAssignmentInfo = {
        ...tool,
        currentJob: null,
        isCurrentlyAssigned: false
      };

      return NextResponse.json(
        createSuccessResponse(toolWithAssignmentInfo),
        { status: HTTP_STATUS.OK }
      );
    }

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    const tool: Tool = mapDbToolToTool(data);
    
    // Tool has current assignment
    const toolWithAssignmentInfo = {
      ...tool,
      currentJob: data.job_to_tool?.[0]?.jobs || null,
      isCurrentlyAssigned: true,
      assignmentId: data.job_to_tool?.[0]?.id
    };

    return NextResponse.json(
      createSuccessResponse(toolWithAssignmentInfo),
      { status: HTTP_STATUS.OK }
    );

  } catch (error) {
    console.error('Tool by TIN GET error:', error);
    return NextResponse.json(
      createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}