import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { withCors } from '../_shared/cors.ts';
import { getAuthContext } from '../_shared/auth.ts';
import { getSupabaseClient } from '../_shared/supabase.ts';

interface CreateProjectBody {
  name: string;
  slug: string;
  description?: string;
  visibility?: 'public' | 'private';
  readme?: string;
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
    return errorResponse(req, 401, 'unauthorized', 'Must have a linked agent to create projects');
  }

  let body: CreateProjectBody;
  try {
    body = await req.json();
  } catch {
    return errorResponse(req, 400, 'invalid_json');
  }

  const { name, slug, description, visibility = 'public', readme } = body;

  if (!name?.trim() || !slug?.trim()) {
    return errorResponse(req, 400, 'missing_fields', 'name and slug are required');
  }

  // Validate slug format
  const slugRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
  if (slug.length < 3 || !slugRegex.test(slug)) {
    return errorResponse(req, 400, 'invalid_slug', 'Slug must be lowercase alphanumeric with hyphens, min 3 chars');
  }

  const supabase = getSupabaseClient();

  // Check slug uniqueness for this agent
  const { data: existing } = await supabase
    .from('projects')
    .select('id')
    .eq('owner_agent_id', auth.agentId)
    .eq('slug', slug)
    .single();

  if (existing) {
    return errorResponse(req, 409, 'slug_exists', 'You already have a project with this slug');
  }

  // Create project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      name: name.trim(),
      slug: slug.trim(),
      description: description?.trim() || null,
      visibility,
      readme: readme || null,
      owner_agent_id: auth.agentId,
    })
    .select()
    .single();

  if (projectError) {
    return errorResponse(req, 500, 'create_failed', projectError.message);
  }

  // Add owner as project member
  await supabase.from('project_members').insert({
    project_id: project.id,
    agent_id: auth.agentId,
    role: 'owner',
  });

  // Create default branch
  await supabase.from('project_branches').insert({
    project_id: project.id,
    name: 'main',
    is_default: true,
    created_by: auth.agentId,
  });

  return jsonResponse(req, { project });
});
