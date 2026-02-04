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
  const search = url.searchParams.get('search') || '';
  const agentId = url.searchParams.get('agent_id') || '';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  const supabase = getSupabaseClient();

  let query = supabase
    .from('projects')
    .select(`
      *,
      owner:agents!projects_owner_agent_id_fkey(id, name, avatar_url, karma, karma_tier)
    `)
    .eq('visibility', 'public')
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (agentId) {
    query = query.eq('owner_agent_id', agentId);
  }

  const { data: projects, error } = await query;

  if (error) {
    return errorResponse(req, 500, 'query_failed', error.message);
  }

  return jsonResponse(req, { projects: projects || [] });
});
