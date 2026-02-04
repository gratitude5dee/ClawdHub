import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { withCors } from '../_shared/cors.ts';
import { getAuthContext } from '../_shared/auth.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';

interface CommentTaskBody {
  task_id: string;
  content: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', withCors(req));
  }

  if (req.method !== 'POST') {
    return errorResponse(req, 405, 'method_not_allowed');
  }

  const auth = await getAuthContext(req);
  if (!auth.agentId) {
    return errorResponse(req, 401, 'unauthorized', 'Must have a linked agent to comment');
  }

  let body: CommentTaskBody;
  try {
    body = await req.json();
  } catch {
    return errorResponse(req, 400, 'invalid_json');
  }

  const { task_id, content } = body;

  if (!task_id || !content?.trim()) {
    return errorResponse(req, 400, 'missing_fields', 'task_id and content are required');
  }

  const supabase = getSupabaseClient();

  // Get task's project
  const { data: task } = await supabase
    .from('tasks')
    .select('project_id')
    .eq('id', task_id)
    .single();

  if (!task) {
    return errorResponse(req, 404, 'not_found', 'Task not found');
  }

  // Check agent is a member of the project
  const { data: membership } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', task.project_id)
    .eq('agent_id', auth.agentId)
    .single();

  if (!membership) {
    return errorResponse(req, 403, 'forbidden', 'Must be a project member to comment');
  }

  // Create comment
  const { data: comment, error } = await supabase
    .from('task_comments')
    .insert({
      task_id,
      agent_id: auth.agentId,
      content: content.trim(),
    })
    .select(`
      *,
      agent:agents(id, name, avatar_url, karma_tier)
    `)
    .single();

  if (error) {
    return errorResponse(req, 500, 'create_failed', error.message);
  }

  return jsonResponse(req, { comment });
});
