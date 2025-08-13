import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/supabase-client';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  mapDbJobToJob,
  validateUUID,
  validateCompanyName,
  validateDateString,
  HTTP_STATUS,
  ERROR_MESSAGES
} from '@/app/lib/api-utils';
import { UpdateJobRequest, Job } from '@/app/types';

// GET /api/jobs/[jobId] - Get job by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    // Validate UUID
    if (!validateUUID(jobId)) {
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.INVALID_UUID),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('job_id', jobId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          createErrorResponse(ERROR_MESSAGES.JOB_NOT_FOUND),
          { status: HTTP_STATUS.NOT_FOUND }
        );
      }
      
      console.error('Database error:', error);
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    const job: Job = mapDbJobToJob(data);

    return NextResponse.json(
      createSuccessResponse(job),
      { status: HTTP_STATUS.OK }
    );

  } catch (error) {
    console.error('Job GET error:', error);
    return NextResponse.json(
      createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

// PUT /api/jobs/[jobId] - Update job
export async function PUT(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;
    const body: UpdateJobRequest = await request.json();

    // Validate UUID
    if (!validateUUID(jobId)) {
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.INVALID_UUID),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Validation
    if (body.company !== undefined && !validateCompanyName(body.company)) {
      return NextResponse.json(
        createErrorResponse('Company name must be valid'),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    if (body.startDate !== undefined && !validateDateString(body.startDate)) {
      return NextResponse.json(
        createErrorResponse('Start date must be valid'),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    if (body.endDate !== undefined && body.endDate !== null && !validateDateString(body.endDate)) {
      return NextResponse.json(
        createErrorResponse('End date must be valid'),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Build update object
    const updateData: any = {};
    if (body.company !== undefined) updateData.company = body.company.trim();
    if (body.startDate !== undefined) updateData.start_date = body.startDate;
    if (body.endDate !== undefined) updateData.end_date = body.endDate;
    if (body.finished !== undefined) updateData.finished = body.finished;

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        createErrorResponse('No valid fields to update'),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Update the job
    const { data, error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('job_id', jobId)
      .select('*')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          createErrorResponse(ERROR_MESSAGES.JOB_NOT_FOUND),
          { status: HTTP_STATUS.NOT_FOUND }
        );
      }
      
      console.error('Database error:', error);
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    const job: Job = mapDbJobToJob(data);

    return NextResponse.json(
      createSuccessResponse(job, 'Job updated successfully'),
      { status: HTTP_STATUS.OK }
    );

  } catch (error) {
    console.error('Job PUT error:', error);
    return NextResponse.json(
      createErrorResponse(ERROR_MESSAGES.INVALID_REQUEST_BODY),
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }
}

// DELETE /api/jobs/[jobId] - Delete job (soft delete if has tools)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    // Validate UUID
    if (!validateUUID(jobId)) {
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.INVALID_UUID),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Check if job has any tool assignments
    const { data: assignments, error: assignmentError } = await supabase
      .from('job_to_tool')
      .select('id')
      .eq('job_id', jobId)
      .limit(1);

    if (assignmentError) {
      console.error('Database error:', assignmentError);
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    // If job has assignments, we should not allow deletion
    // In a production app, you might want to implement soft delete instead
    if (assignments && assignments.length > 0) {
      return NextResponse.json(
        createErrorResponse('Cannot delete job with tool assignments. Mark as finished instead.'),
        { status: HTTP_STATUS.CONFLICT }
      );
    }

    // Delete the job
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('job_id', jobId);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    return NextResponse.json(
      createSuccessResponse(null, 'Job deleted successfully'),
      { status: HTTP_STATUS.OK }
    );

  } catch (error) {
    console.error('Job DELETE error:', error);
    return NextResponse.json(
      createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}