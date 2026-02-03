import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { thirdwebAuth } from '../_shared/thirdweb.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { withCors } from '../_shared/cors.ts';
import { upsertUser } from '../_shared/supabase.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', withCors(req));
  }

  if (req.method !== 'POST') {
    return errorResponse(req, 405, 'method_not_allowed');
  }

  try {
    const { payload, signature } = await req.json();
    if (!payload || !signature) {
      return errorResponse(req, 400, 'missing_payload_or_signature');
    }

    const verification = await thirdwebAuth.verifyPayload({ payload, signature });
    if (!verification.valid) {
      return errorResponse(req, 401, 'invalid_signature');
    }

    const jwt = await thirdwebAuth.generateJWT({ payload: verification.payload });
    const address = verification.payload.address;

    if (address) {
      await upsertUser(address);
    }

    return jsonResponse(req, { address, jwt });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return errorResponse(req, 500, 'login_failed', message);
  }
});
