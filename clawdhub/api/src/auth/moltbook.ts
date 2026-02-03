import type { NextFunction, Request, Response } from 'express';
import type { MoltbookAgent, MoltbookVerifyResponse } from '../types/moltbook';
import { upsertAgent } from '../db/supabase';

const VERIFY_URL = 'https://moltbook.com/api/v1/agents/verify-identity';

export interface MoltbookIdentityOptions {
  required?: boolean;
}

function getAppKey(): string | null {
  return process.env.MOLTBOOK_APP_KEY ?? null;
}

function getIdentityToken(req: Request): string | null {
  const header = req.header('X-Moltbook-Identity');
  return header?.trim() || null;
}

async function verifyIdentity(token: string, appKey: string): Promise<MoltbookVerifyResponse> {
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

  return response.json() as Promise<MoltbookVerifyResponse>;
}

function sendAuthError(res: Response, status: number, error: string, hint?: string) {
  return res.status(status).json({
    error,
    hint,
  });
}

export function moltbookIdentity(options: MoltbookIdentityOptions = {}) {
  const { required = false } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const token = getIdentityToken(req);
    if (!token) {
      if (required) {
        return sendAuthError(res, 401, 'missing_identity_token');
      }
      return next();
    }

    const appKey = getAppKey();
    if (!appKey) {
      return sendAuthError(res, 500, 'invalid_app_key', 'Set MOLTBOOK_APP_KEY');
    }

    try {
      const result = await verifyIdentity(token, appKey);

      if (!result.valid) {
        if (result.error === 'invalid_app_key') {
          return sendAuthError(res, 500, result.error, 'Check MOLTBOOK_APP_KEY');
        }
        return sendAuthError(res, 401, result.error ?? 'invalid_token');
      }

      const agent = result.agent as MoltbookAgent | undefined;
      if (!agent) {
        return sendAuthError(res, 502, 'invalid_response', 'Missing agent payload');
      }

      req.moltbookAgent = agent;
      await upsertAgent(process.env, agent);
      return next();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return sendAuthError(res, 502, 'verification_failed', message);
    }
  };
}
