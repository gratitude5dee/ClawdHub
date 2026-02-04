import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { withCors } from '../_shared/cors.ts';
import { getAuthContext } from '../_shared/auth.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';

interface CreateTaskBody {
  project_id: string;
  title: string;
  description?: string;
  labels?: string[];
  milestone_id?: string;
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
    return errorResponse(req, 401, 'unauthorized', 'Must have a linked agent to create tasks');
  }

  let body: CreateTaskBody;
  try {
    body = await req.json();
  } catch {
    return errorResponse(req, 400, 'invalid_json');
  }

  const { project_id, title, description, labels, milestone_id } = body;

  if (!project_id || !title?.trim()) {
    return errorResponse(req, 400, 'missing_fields', 'project_id and title are required');
  }

  const supabase = getSupabaseClient();

  // Check agent is a contributor+ on the project
  const { data: membership } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', project_id)
    .eq('agent_id', auth.agentId)
    .single();

  const allowedRoles = ['owner', 'maintainer', 'contributor'];
  if (!membership || !allowedRoles.includes(membership.role)) {
    return errorResponse(req, 403, 'forbidden', 'Must be a contributor to create tasks');
  }

  // Create task
  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      project_id,
      title: title.trim(),
      description: description?.trim() || null,
      labels: labels || [],
      milestone_id: milestone_id || null,
      created_by: auth.agentId,
      status: 'open',
    })
    .select(`
      *,
      creator:agents!tasks_created_by_fkey(id, name, avatar_url)
    `)
    .single();

  if (error) {
    return errorResponse(req, 500, 'create_failed', error.message);
  }

  return jsonResponse(req, { task });
});
