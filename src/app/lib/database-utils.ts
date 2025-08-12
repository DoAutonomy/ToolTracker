import { supabase } from '@/app/supabase-client';
import { Job, Tool, JobToTool } from '@/app/types/database';
import { 
  mapDbJobToJob, 
  mapDbToolToTool,
  mapDbAssignmentToAssignment
} from './api-utils';

// Database utility functions for common operations

/**
 * Get all available tools (not currently assigned to any job)
 */
export async function getAvailableTools(): Promise<{ data: Tool[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('available_tools')
      .select('*')
      .order('date_added', { ascending: false });

    if (error) {
      return { data: null, error };
    }

    const tools = data?.map(mapDbToolToTool) || [];
    return { data: tools, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Get all tools assigned to a specific job
 */
export async function getToolsAssignedToJob(jobId: string): Promise<{ data: any[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('job_to_tool')
      .select(`
        id,
        assigned_at,
        returned_at,
        tools (
          tool_id,
          tin,
          tool_type,
          date_added
        )
      `)
      .eq('job_id', jobId)
      .order('assigned_at', { ascending: false });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Get missing tools for a completed job (tools assigned but not returned)
 */
export async function getMissingToolsForJob(jobId: string): Promise<{ data: Tool[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('job_to_tool')
      .select(`
        tools (
          tool_id,
          tin,
          tool_type,
          date_added,
          created_at,
          updated_at
        )
      `)
      .eq('job_id', jobId)
      .is('returned_at', null);

    if (error) {
      return { data: null, error };
    }

    const tools = data?.map(item => mapDbToolToTool(item.tools)).filter(Boolean) || [];
    return { data: tools, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Get all currently missing tools (from missing_tools view)
 */
export async function getAllMissingTools(): Promise<{ data: any[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('missing_tools')
      .select('*')
      .order('days_overdue', { ascending: false });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Get all currently assigned tools (from currently_assigned_tools view)
 */
export async function getCurrentlyAssignedTools(): Promise<{ data: any[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('currently_assigned_tools')
      .select('*')
      .order('assigned_at', { ascending: false });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Get tool usage statistics
 */
export async function getToolUsageStats(): Promise<{ data: any[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('tools')
      .select(`
        tool_id,
        tin,
        tool_type,
        date_added,
        job_to_tool (
          id,
          assigned_at,
          returned_at,
          jobs (
            company,
            finished
          )
        )
      `);

    if (error) {
      return { data: null, error };
    }

    // Process data to create usage statistics
    const stats = data?.map(tool => {
      const assignments = tool.job_to_tool || [];
      const totalAssignments = assignments.length;
      const completedAssignments = assignments.filter((a: any) => a.returned_at).length;
      const currentlyAssigned = assignments.some((a: any) => !a.returned_at);
      const companies = [...new Set(assignments.map((a: any) => a.jobs?.company).filter(Boolean))];

      return {
        toolId: tool.tool_id,
        tin: tool.tin,
        toolType: tool.tool_type,
        dateAdded: tool.date_added,
        totalAssignments,
        completedAssignments,
        currentlyAssigned,
        companiesUsed: companies,
        usageRate: totalAssignments > 0 ? (completedAssignments / totalAssignments * 100) : 0
      };
    }) || [];

    return { data: stats, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Get tools by company (currently assigned or historically assigned)
 */
export async function getToolsByCompany(company: string): Promise<{ data: any[] | null; error: any }> {
  try {
    const { data, error } = await supabase
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
        jobs!inner (
          job_id,
          company,
          start_date,
          end_date,
          finished
        )
      `)
      .ilike('jobs.company', `%${company}%`)
      .order('assigned_at', { ascending: false });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Get overdue tool returns (tools not returned after job end date)
 */
export async function getOverdueReturns(): Promise<{ data: any[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('job_to_tool')
      .select(`
        id,
        assigned_at,
        tools (
          tool_id,
          tin,
          tool_type
        ),
        jobs!inner (
          job_id,
          company,
          end_date,
          finished
        )
      `)
      .is('returned_at', null)
      .eq('jobs.finished', true)
      .not('jobs.end_date', 'is', null)
      .lt('jobs.end_date', new Date().toISOString().split('T')[0]);

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Get job history for a specific tool
 */
export async function getJobHistoryForTool(toolId: string): Promise<{ data: any[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('job_to_tool')
      .select(`
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
      `)
      .eq('tool_id', toolId)
      .order('assigned_at', { ascending: false });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Check if tool is currently assigned
 */
export async function isToolCurrentlyAssigned(toolId: string): Promise<{ isAssigned: boolean; assignmentInfo?: any; error?: any }> {
  try {
    const { data, error } = await supabase
      .from('job_to_tool')
      .select(`
        id,
        assigned_at,
        jobs (
          job_id,
          company,
          finished
        )
      `)
      .eq('tool_id', toolId)
      .is('returned_at', null)
      .single();

    if (error && error.code === 'PGRST116') {
      // No current assignment found
      return { isAssigned: false };
    }

    if (error) {
      return { isAssigned: false, error };
    }

    return { isAssigned: true, assignmentInfo: data };
  } catch (error) {
    return { isAssigned: false, error };
  }
}

/**
 * Get tool counts by type
 */
export async function getToolCountsByType(): Promise<{ data: any[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('tools')
      .select('tool_type')
      .order('tool_type');

    if (error) {
      return { data: null, error };
    }

    // Group by tool type and count
    const counts = data?.reduce((acc: any, tool: any) => {
      const type = tool.tool_type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const result = Object.entries(counts || {}).map(([type, count]) => ({
      toolType: type,
      count
    }));

    return { data: result, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Batch assign tools to job
 */
export async function batchAssignToolsToJob(jobId: string, toolIds: string[]): Promise<{ data: any[] | null; error: any }> {
  try {
    const assignmentData = toolIds.map(toolId => ({
      job_id: jobId,
      tool_id: toolId
    }));

    const { data, error } = await supabase
      .from('job_to_tool')
      .insert(assignmentData)
      .select(`
        id,
        assigned_at,
        tools (
          tool_id,
          tin,
          tool_type
        )
      `);

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Batch return tools from job
 */
export async function batchReturnToolsFromJob(jobId: string, toolIds: string[]): Promise<{ data: any[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('job_to_tool')
      .update({ returned_at: new Date().toISOString() })
      .eq('job_id', jobId)
      .in('tool_id', toolIds)
      .is('returned_at', null)
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

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}