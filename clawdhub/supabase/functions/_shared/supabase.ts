import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.49.1';
import type { MoltbookAgent } from './types.ts';

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient;
  const url = requireEnv('SUPABASE_URL');
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  cachedClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return cachedClient;
}

export async function upsertAgent(agent: MoltbookAgent): Promise<void> {
  const supabase = getSupabaseClient();
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

export async function upsertUser(walletAddress: string): Promise<void> {
  const supabase = getSupabaseClient();
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
