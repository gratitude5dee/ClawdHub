import { getSupabaseClient } from './supabase.ts';

export interface AuthContext {
  userId: string | null;
  agentId: string | null;
}

/**
 * Extract user/agent context from JWT Authorization header
 * JWT contains wallet address in 'sub' claim
 */
export async function getAuthContext(req: Request): Promise<AuthContext> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { userId: null, agentId: null };
  }

  const jwt = authHeader.slice(7);
  
  try {
    // Decode JWT payload (we trust the edge function gateway validated it)
    const parts = jwt.split('.');
    if (parts.length !== 3) {
      return { userId: null, agentId: null };
    }
    
    const payload = JSON.parse(atob(parts[1]));
    const walletAddress = payload.sub;
    
    if (!walletAddress) {
      return { userId: null, agentId: null };
    }

    // Look up user by wallet address
    const supabase = getSupabaseClient();
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (!user) {
      return { userId: null, agentId: null };
    }

    // Get primary linked agent (if any)
    const { data: linkedAgent } = await supabase
      .from('linked_agents')
      .select('agent_id')
      .eq('user_id', user.id)
      .order('linked_at', { ascending: true })
      .limit(1)
      .single();

    return {
      userId: user.id,
      agentId: linkedAgent?.agent_id ?? null,
    };
  } catch {
    return { userId: null, agentId: null };
  }
}

/**
 * Get agent context from MoltBook identity token
 */
export function getMoltbookToken(req: Request): string | null {
  const token = req.headers.get('x-moltbook-identity');
  return token?.trim() || null;
}
