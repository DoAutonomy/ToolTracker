import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/supabase-client';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  mapDbJobToJob,
  validateCompanyName,
  validateDateString,
  HTTP_STATUS,
  ERROR_MESSAGES
} from '@/app/lib/api-utils';
import { CreateJobRequest, GetJobsParams, Job } from '@/app/types';

// GET /api/jobs - Get all jobs with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const params: GetJobsParams = {
      finished: searchParams.get('finished') === 'true' ? true : 
                searchParams.get('finished') === 'false' ? false : undefined,
      company: searchParams.get('company') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20')
    };

    // Build the query
    let query = supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (params.finished !== undefined) {
      query = query.eq('finished', params.finished);
    }
    if (params.company) {
      query = query.ilike('company', `%${params.company}%`);
    }
    if (params.startDate) {
      query = query.gte('start_date', params.startDate);
    }
    if (params.endDate) {
      query = query.lte('end_date', params.endDate);
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

    // Map database rows to Job objects
    const jobs: Job[] = data?.map(mapDbJobToJob) || [];

    // For paginated response, we'd need total count
    const response = {
      success: true,
      data: jobs,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 20,
        total: count || jobs.length,
        totalPages: Math.ceil((count || jobs.length) / (params.limit || 20))
      }
    };

    return NextResponse.json(response, { status: HTTP_STATUS.OK });

  } catch (error) {
    console.error('Jobs GET error:', error);
    return NextResponse.json(
      createErrorResponse(ERROR_MESSAGES.DATABASE_ERROR),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

// POST /api/jobs - Create new job
export async function POST(request: NextRequest) {
  try {
    const body: CreateJobRequest = await request.json();

    // Validation
    if (!body.company || !validateCompanyName(body.company)) {
      return NextResponse.json(
        createErrorResponse('Company name is required and must be valid'),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    if (!body.startDate || !validateDateString(body.startDate)) {
      return NextResponse.json(
        createErrorResponse('Valid start date is required'),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    if (body.endDate && !validateDateString(body.endDate)) {
      return NextResponse.json(
        createErrorResponse('End date must be valid if provided'),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Check if end date is after start date
    if (body.endDate && new Date(body.endDate) <= new Date(body.startDate)) {
      return NextResponse.json(
        createErrorResponse('End date must be after start date'),
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Insert into database
    const { data, error } = await supabase
      .from('jobs')
      .insert({
        company: body.company.trim(),
        start_date: body.startDate,
        end_date: body.endDate || null,
        finished: false
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

    const job: Job = mapDbJobToJob(data);

    return NextResponse.json(
      createSuccessResponse(job, 'Job created successfully'),
      { status: HTTP_STATUS.CREATED }
    );

  } catch (error) {
    console.error('Jobs POST error:', error);
    return NextResponse.json(
      createErrorResponse(ERROR_MESSAGES.INVALID_REQUEST_BODY),
      { status: HTTP_STATUS.BAD_REQUEST }
    );
  }
}