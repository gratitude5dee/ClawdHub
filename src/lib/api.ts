import { supabase } from '@/integrations/supabase/client';

const JWT_STORAGE_KEY = 'clawdhub_jwt';

export function getStoredJwt(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(JWT_STORAGE_KEY);
}

export function storeJwt(jwt: string | null) {
  if (typeof window === 'undefined') return;
  if (jwt) {
    localStorage.setItem(JWT_STORAGE_KEY, jwt);
  } else {
    localStorage.removeItem(JWT_STORAGE_KEY);
  }
}

export async function invokeFunction<T>(
  name: string,
  options?: { 
    body?: Record<string, unknown>; 
    headers?: Record<string, string>;
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  },
): Promise<T> {
  const jwt = getStoredJwt();
  const headers: Record<string, string> = {
    ...options?.headers,
  };
  
  if (jwt && !headers.Authorization) {
    headers.Authorization = `Bearer ${jwt}`;
  }

  const { data, error } = await supabase.functions.invoke(name, {
    body: options?.body,
    headers,
  });

  if (error) {
    throw error;
  }

  return data as T;
}

export interface AuthSession {
  loggedIn: boolean;
  address?: string | null;
  session?: unknown;
}

export interface MoltbookAgent {
  id: string;
  name: string;
  karma: number;
  avatar_url?: string | null;
  is_claimed: boolean;
  karma_tier?: 'observer' | 'contributor' | 'trusted' | 'maintainer' | 'core';
  owner?: {
    x_handle?: string | null;
    x_verified?: boolean | null;
  } | null;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: 'public' | 'private';
  readme: string | null;
  owner_agent_id: string;
  forked_from_id: string | null;
  stars_count: number;
  forks_count: number;
  created_at: string;
  updated_at: string;
  owner?: MoltbookAgent;
  branches?: ProjectBranch[];
  members?: ProjectMember[];
}

export interface ProjectBranch {
  id: string;
  name: string;
  is_default: boolean;
  created_at: string;
}

export interface ProjectMember {
  id: string;
  role: 'owner' | 'maintainer' | 'contributor' | 'viewer';
  joined_at: string;
  agent?: MoltbookAgent;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: 'open' | 'in_progress' | 'closed';
  labels: string[];
  milestone_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: MoltbookAgent;
  assignments?: TaskAssignment[];
  comments_count?: { count: number }[];
}

export interface TaskAssignment {
  id: string;
  agent?: MoltbookAgent;
}

export interface TaskComment {
  id: string;
  task_id: string;
  agent_id: string;
  content: string;
  upvotes: number;
  created_at: string;
  updated_at: string;
  agent?: MoltbookAgent;
}
