import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/supabase-client';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  mapDbToolToTool,
  validateTin,
  validateToolType,
  HTTP_STATUS,
  ERROR_MESSAGES
} from '@/app/lib/api-utils';
import { CreateToolRequest, GetToolsParams, Tool } from '@/app/types';

// GET /api/tools - Get all tools with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const params: GetToolsParams = {
      toolType: searchParams.get('toolType') || undefined,
      isAssigned: searchParams.get('isAssigned') === 'true' ? true : 
                  searchParams.get('isAssigned') === 'false' ? false : undefined,
      jobId: searchParams.get('jobId') || undefined,
      tin: searchParams.get('tin') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20')
    };

    // Build the query - we need to join with job_to_tool for assignment filtering
    let query;
    
    if (params.isAssigned !== undefined || params.jobId) {
      // Join with job_to_tool when filtering by assignment status or specific job
      query = supabase
        .from('tools')
        .select(`
          *,
          job_to_tool!left (
            id,
            job_id,
            returned_at
          )
        `);
    } else {
      // Simple query when not filtering by assignments
      query = supabase
        .from('tools')
        .select('*');
    }

    query = query.order('created_at', { ascending: false });

    // Apply filters
    if (params.toolType) {
      query = query.ilike('tool_type', `%${params.toolType}%`);
    }
    if (params.tin) {
      query = query.ilike('tin', `%${params.tin}%`);
    }

    // Apply pagination
    const from = ((params.page || 1) - 1) * (params.limit || 20);
    const to = from + (params.limit || 20) - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // Process results and apply assignment filtering if needed
    let tools: Tool[] = [];
    
    if (data) {
      tools = data
        .map((row: any) => {
          const tool = mapDbToolToTool(row);
          
          // If we have assignment data, filter based on criteria
          if (row.job_to_tool && Array.isArray(row.job_to_tool)) {
            const currentAssignment = row.job_to_tool.find((jtt: any) => !jtt.returned_at);
            
            // Filter by assignment status
            if (params.isAssigned === true && !currentAssignment) return null;
            if (params.isAssigned === false && currentAssignment) return null;
            
            // Filter by specific job
            if (params.jobId && (!currentAssignment || currentAssignment.job_id !== params.jobId)) {
              return null;
            }
          } else if (params.isAssigned === true || params.jobId) {
            // No assignments but we're filtering for assigned tools
            return null;
          }
          
          return tool;
        })
        .filter(Boolean) as Tool[];
    }

    const response = {
      success: true,
      data: tools,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 20,
        total: count || tools.length,
        totalPages: Math.ceil((count || tools.length) / (params.limit || 20))
      }
    };

    return NextResponse.json(response, { status: HTTP_STATUS.OK });

  } catch (error) {
    console.error('Tools GET error:', error);
    return NextResponse.json(
      createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

// POST /api/tools - Create new tool
export async function POST(request: NextRequest) {
  try {
    const body: CreateToolRequest = await request.json();

    // Validation
    if (!body.tin || !validateTin(body.tin)) {
      return NextResponse.json(
        createErrorResponse('Tool identification number (TIN) is required and must be valid'),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    if (!body.toolType || !validateToolType(body.toolType)) {
      return NextResponse.json(
        createErrorResponse('Tool type is required and must be valid'),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Check if tool with this TIN already exists
    const { data: existingTool, error: checkError } = await supabase
      .from('tools')
      .select('tool_id')
      .eq('tin', body.tin.trim())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Database error during uniqueness check:', checkError);
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    if (existingTool) {
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.TOOL_ALREADY_EXISTS),
        { status: HTTP_STATUS.CONFLICT }
      );
    }

    // Insert into database
    const { data, error } = await supabase
      .from('tools')
      .insert({
        tin: body.tin.trim(),
        tool_type: body.toolType.trim()
      })
      .select('*')
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    const tool: Tool = mapDbToolToTool(data);

    return NextResponse.json(
      createSuccessResponse(tool, 'Tool created successfully'),
      { status: HTTP_STATUS.CREATED }
    );

  } catch (error) {
    console.error('Tools POST error:', error);
    return NextResponse.json(
      createErrorResponse(ERROR_MESSAGES.INVALID_REQUEST_BODY),
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }
}