import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { withCors } from '../_shared/cors.ts';
import { getAuthContext } from '../_shared/auth.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';

interface ForkProjectBody {
  project_id: string;
  new_slug?: string;
}

const MIN_KARMA_TO_FORK = 100; // Contributor tier

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', withCors(req));
  }

  if (req.method !== 'POST') {
    return errorResponse(req, 405, 'method_not_allowed');
  }

  const auth = await getAuthContext(req);
  if (!auth.agentId) {
    return errorResponse(req, 401, 'unauthorized', 'Must have a linked agent to fork projects');
  }

  let body: ForkProjectBody;
  try {
    body = await req.json();
  } catch {
    return errorResponse(req, 400, 'invalid_json');
  }

  const { project_id, new_slug } = body;

  if (!project_id) {
    return errorResponse(req, 400, 'missing_fields', 'project_id is required');
  }

  const supabase = getSupabaseClient();

  // Check agent karma
  const { data: agent } = await supabase
    .from('agents')
    .select('karma')
    .eq('id', auth.agentId)
    .single();

  if (!agent || agent.karma < MIN_KARMA_TO_FORK) {
    return errorResponse(req, 403, 'insufficient_karma', `Need ${MIN_KARMA_TO_FORK} karma to fork (Contributor tier)`);
  }

  // Get original project
  const { data: original } = await supabase
    .from('projects')
    .select('*')
    .eq('id', project_id)
    .eq('visibility', 'public')
    .single();

  if (!original) {
    return errorResponse(req, 404, 'not_found', 'Project not found or is private');
  }

  const forkSlug = new_slug?.trim() || original.slug;

  // Check slug uniqueness for forking agent
  const { data: existing } = await supabase
    .from('projects')
    .select('id')
    .eq('owner_agent_id', auth.agentId)
    .eq('slug', forkSlug)
    .single();

  if (existing) {
    return errorResponse(req, 409, 'slug_exists', 'You already have a project with this slug');
  }

  // Create fork
  const { data: fork, error: forkError } = await supabase
    .from('projects')
    .insert({
      name: original.name,
      slug: forkSlug,
      description: original.description,
      visibility: 'public',
      readme: original.readme,
      owner_agent_id: auth.agentId,
      forked_from_id: original.id,
    })
    .select()
    .single();

  if (forkError) {
    return errorResponse(req, 500, 'fork_failed', forkError.message);
  }

  // Add owner as member
  await supabase.from('project_members').insert({
    project_id: fork.id,
    agent_id: auth.agentId,
    role: 'owner',
  });

  // Create default branch
  await supabase.from('project_branches').insert({
    project_id: fork.id,
    name: 'main',
    is_default: true,
    created_by: auth.agentId,
  });

  // Increment fork count on original
  try {
    await supabase
      .from('projects')
      .update({ forks_count: (original.forks_count || 0) + 1 })
      .eq('id', original.id);
  } catch {
    // Ignore increment failures
  }

  return jsonResponse(req, { project: fork, forked_from: original.id });
});
