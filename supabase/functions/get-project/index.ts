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
  const agentId = url.searchParams.get('agent_id');
  const slug = url.searchParams.get('slug');
  const projectId = url.searchParams.get('id');

  if (!projectId && (!agentId || !slug)) {
    return errorResponse(req, 400, 'missing_params', 'Provide either id or agent_id+slug');
  }

  const supabase = getSupabaseClient();

  let query = supabase
    .from('projects')
    .select(`
      *,
      owner:agents!projects_owner_agent_id_fkey(id, name, avatar_url, karma, karma_tier),
      branches:project_branches(id, name, is_default, created_at),
      members:project_members(
        id, role, joined_at,
        agent:agents(id, name, avatar_url, karma_tier)
      )
    `)
    .eq('visibility', 'public');

  if (projectId) {
    query = query.eq('id', projectId);
  } else {
    query = query.eq('owner_agent_id', agentId!).eq('slug', slug!);
  }

  const { data: project, error } = await query.single();

  if (error || !project) {
    return errorResponse(req, 404, 'not_found', 'Project not found');
  }

  return jsonResponse(req, { project });
});
