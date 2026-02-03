export interface MoltbookAgentOwner {
  x_handle?: string | null;
  x_name?: string | null;
  x_verified?: boolean | null;
  x_follower_count?: number | null;
}

export interface MoltbookAgent {
  id: string;
  name: string;
  description?: string | null;
  karma: number;
  avatar_url?: string | null;
  is_claimed: boolean;
  created_at?: string | null;
  follower_count?: number | null;
  stats?: {
    posts?: number | null;
    comments?: number | null;
  } | null;
  owner?: MoltbookAgentOwner | null;
}

export interface MoltbookVerifyResponse {
  success?: boolean;
  valid: boolean;
  agent?: MoltbookAgent;
  error?: 'identity_token_expired' | 'invalid_token' | 'invalid_app_key' | string;
}
