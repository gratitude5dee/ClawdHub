import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { withCors } from '../_shared/cors.ts';
import { verifyMoltbookIdentity } from '../_shared/moltbook.ts';
import { upsertAgent } from '../_shared/supabase.ts';

function getIdentityToken(req: Request): string | null {
  const token = req.headers.get('x-moltbook-identity');
  return token?.trim() || null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', withCors(req));
  }

  if (req.method !== 'POST') {
    return errorResponse(req, 405, 'method_not_allowed');
  }

  const token = getIdentityToken(req);
  if (!token) {
    return errorResponse(req, 401, 'missing_identity_token');
  }

  try {
    const agent = await verifyMoltbookIdentity(token);
    await upsertAgent(agent);
    return jsonResponse(req, { agent });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'verification_failed';
    return errorResponse(req, 502, 'verification_failed', message);
  }
});
