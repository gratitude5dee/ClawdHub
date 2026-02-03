import type { MoltbookAgent, MoltbookVerifyResponse } from './types.ts';

const VERIFY_URL = 'https://moltbook.com/api/v1/agents/verify-identity';

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export async function verifyMoltbookIdentity(token: string): Promise<MoltbookAgent> {
  const appKey = requireEnv('MOLTBOOK_APP_KEY');
  const response = await fetch(VERIFY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Moltbook-App-Key': appKey,
    },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Moltbook verify failed (${response.status}): ${text}`);
  }

  const data = await response.json() as MoltbookVerifyResponse;
  if (!data.valid) {
    throw new Error(data.error ?? 'invalid_token');
  }

  if (!data.agent) {
    throw new Error('invalid_response');
  }

  return data.agent;
}
