import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { MoltbookAgent } from '../types/moltbook';

export interface SupabaseEnv {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(env: SupabaseEnv): SupabaseClient {
  if (cachedClient) return cachedClient;
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }
  cachedClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return cachedClient;
}

export async function upsertAgent(env: SupabaseEnv, agent: MoltbookAgent): Promise<void> {
  const supabase = getSupabaseClient(env);
  const owner = agent.owner ?? {};
  const { error } = await supabase
    .from('agents')
    .upsert(
      {
        id: agent.id,
        name: agent.name,
        karma: agent.karma,
        avatar_url: agent.avatar_url ?? null,
        is_claimed: agent.is_claimed,
        owner_x_handle: owner.x_handle ?? null,
        owner_x_verified: owner.x_verified ?? null,
        raw_profile: agent,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );

  if (error) {
    throw new Error(`Supabase upsert agent failed: ${error.message}`);
  }
}

export async function upsertUser(env: SupabaseEnv, walletAddress: string): Promise<void> {
  const supabase = getSupabaseClient(env);
  const { error } = await supabase
    .from('users')
    .upsert(
      {
        wallet_address: walletAddress,
        last_login_at: new Date().toISOString(),
      },
      { onConflict: 'wallet_address' },
    );

  if (error) {
    throw new Error(`Supabase upsert user failed: ${error.message}`);
  }
}
