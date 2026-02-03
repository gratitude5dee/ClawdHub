import { withCors } from './cors.ts';

export function jsonResponse(req: Request, body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), withCors(req, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  }));
}

export function errorResponse(
  req: Request,
  status: number,
  error: string,
  detail?: string,
): Response {
  return jsonResponse(req, { error, detail }, { status });
}
