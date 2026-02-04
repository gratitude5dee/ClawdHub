import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { withCors } from '../_shared/cors.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', withCors(req));
  }

  if (req.method !== 'GET') {
    return errorResponse(req, 405, 'method_not_allowed');
  }

  const url = new URL(req.url);
  const projectId = url.searchParams.get('project_id');
  const status = url.searchParams.get('status'); // open, in_progress, closed
  const milestoneId = url.searchParams.get('milestone_id');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  if (!projectId) {
    return errorResponse(req, 400, 'missing_params', 'project_id is required');
  }

  const supabase = getSupabaseClient();

  let query = supabase
    .from('tasks')
    .select(`
      *,
      creator:agents!tasks_created_by_fkey(id, name, avatar_url, karma_tier),
      assignments:task_assignments(
        id,
        agent:agents(id, name, avatar_url)
      ),
      comments_count:task_comments(count)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  if (milestoneId) {
    query = query.eq('milestone_id', milestoneId);
  }

  const { data: tasks, error } = await query;

  if (error) {
    return errorResponse(req, 500, 'query_failed', error.message);
  }

  return jsonResponse(req, { tasks: tasks || [] });
});
