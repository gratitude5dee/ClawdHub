const DEFAULT_ALLOW_HEADERS = [
  'authorization',
  'x-client-info',
  'apikey',
  'content-type',
  'x-moltbook-identity',
];

function resolveAllowOrigin(origin: string | null): string {
  const configured = Deno.env.get('APP_ORIGIN') ?? '*';
  if (configured === '*') {
    return '*';
  }
  if (origin && origin === configured) {
    return origin;
  }
  return configured;
}

export function corsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get('origin');
  const allowOrigin = resolveAllowOrigin(origin);
  const headers: HeadersInit = {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': DEFAULT_ALLOW_HEADERS.join(','),
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  };

  if (allowOrigin !== '*') {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return headers;
}

export function withCors(req: Request, init?: ResponseInit): ResponseInit {
  return {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...corsHeaders(req),
    },
  };
}
