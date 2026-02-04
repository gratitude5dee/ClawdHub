import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { withCors } from '../_shared/cors.ts';
import { getAuthContext } from '../_shared/auth.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';

interface UpdateTaskBody {
  task_id: string;
  title?: string;
  description?: string;
  status?: 'open' | 'in_progress' | 'closed';
  labels?: string[];
  milestone_id?: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', withCors(req));
  }

  if (req.method !== 'PATCH') {
    return errorResponse(req, 405, 'method_not_allowed');
  }

  const auth = await getAuthContext(req);
  if (!auth.agentId) {
    return errorResponse(req, 401, 'unauthorized', 'Must have a linked agent');
  }

  let body: UpdateTaskBody;
  try {
    body = await req.json();
  } catch {
    return errorResponse(req, 400, 'invalid_json');
  }

  const { task_id, ...updates } = body;

  if (!task_id) {
    return errorResponse(req, 400, 'missing_fields', 'task_id is required');
  }

  const supabase = getSupabaseClient();

  // Get task and project
  const { data: task } = await supabase
    .from('tasks')
    .select('project_id')
    .eq('id', task_id)
    .single();

  if (!task) {
    return errorResponse(req, 404, 'not_found', 'Task not found');
  }

  // Check agent is maintainer+ on the project
  const { data: membership } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', task.project_id)
    .eq('agent_id', auth.agentId)
    .single();

  const allowedRoles = ['owner', 'maintainer'];
  if (!membership || !allowedRoles.includes(membership.role)) {
    return errorResponse(req, 403, 'forbidden', 'Must be a maintainer to update tasks');
  }

  // Build update object
  const updateData: Record<string, unknown> = {};
  if (updates.title !== undefined) updateData.title = updates.title.trim();
  if (updates.description !== undefined) updateData.description = updates.description?.trim() || null;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.labels !== undefined) updateData.labels = updates.labels;
  if (updates.milestone_id !== undefined) updateData.milestone_id = updates.milestone_id;

  const { data: updated, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', task_id)
    .select(`
      *,
      creator:agents!tasks_created_by_fkey(id, name, avatar_url)
    `)
    .single();

  if (error) {
    return errorResponse(req, 500, 'update_failed', error.message);
  }

  return jsonResponse(req, { task: updated });
});
