import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { thirdwebAuth } from '../_shared/thirdweb.ts';
import { jsonResponse } from '../_shared/response.ts';
import { withCors } from '../_shared/cors.ts';

function getJwt(req: Request): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;
  const [scheme, token] = authHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }
  return token.trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', withCors(req));
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return jsonResponse(req, { loggedIn: false }, { status: 405 });
  }

  try {
    const jwt = getJwt(req);
    if (!jwt) {
      return jsonResponse(req, { loggedIn: false }, { status: 401 });
    }

    const verification = await thirdwebAuth.verifyJWT({ jwt });
    if (!verification.valid) {
      return jsonResponse(req, { loggedIn: false }, { status: 401 });
    }

    const parsed = verification.parsedJWT;
    const address = parsed.sub ?? parsed.address;
    return jsonResponse(req, { loggedIn: true, address, session: parsed });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Session invalid';
    return jsonResponse(req, { loggedIn: false, detail: message }, { status: 401 });
  }
});
