import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { thirdwebAuth } from '../_shared/thirdweb.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { withCors } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', withCors(req));
  }

  if (req.method !== 'POST') {
    return errorResponse(req, 405, 'method_not_allowed');
  }

  try {
    const { address, chainId } = await req.json();
    if (!address) {
      return errorResponse(req, 400, 'missing_address');
    }

    const payload = await thirdwebAuth.generatePayload({
      address,
      chainId,
    });

    return jsonResponse(req, payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate payload';
    return errorResponse(req, 500, 'payload_error', message);
  }
});
