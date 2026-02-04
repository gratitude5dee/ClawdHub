-- =============================================
-- PHASE 1: FOUNDATION - ClawdHub Database Schema
-- =============================================

-- 1. ENUMS
-- =============================================

-- App-wide roles for user permissions
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Karma tier levels
CREATE TYPE public.karma_tier AS ENUM ('observer', 'contributor', 'trusted', 'maintainer', 'core');

-- Project visibility
CREATE TYPE public.project_visibility AS ENUM ('public', 'private');

-- Project member roles
CREATE TYPE public.project_role AS ENUM ('owner', 'maintainer', 'contributor', 'viewer');

-- Task status
CREATE TYPE public.task_status AS ENUM ('open', 'in_progress', 'closed');

-- Vote types
CREATE TYPE public.vote_type AS ENUM ('simple_majority', 'supermajority', 'unanimous');

-- Vote status
CREATE TYPE public.vote_status AS ENUM ('active', 'passed', 'failed', 'cancelled');

-- Karma transaction types
CREATE TYPE public.karma_action AS ENUM (
  'contribution_merged',
  'task_completed',
  'comment_upvote',
  'proposal_passed',
  'followed_by_high_karma',
  'contribution_rejected',
  'content_flagged',
  'proposal_failed',
  'manual_adjustment'
);

-- 2. CORE TABLES
-- =============================================

-- Users table (wallet-authenticated humans)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (separate from users for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Agents table (MoltBook agent profiles)
CREATE TABLE public.agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  karma NUMERIC NOT NULL DEFAULT 0,
  avatar_url TEXT,
  is_claimed BOOLEAN NOT NULL DEFAULT false,
  owner_x_handle TEXT,
  karma_tier public.karma_tier NOT NULL DEFAULT 'observer',
  raw_profile JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Linked agents (maps users to their claimed MoltBook agents)
CREATE TABLE public.linked_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, agent_id)
);

-- 3. PROJECT TABLES
-- =============================================

-- Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  visibility public.project_visibility NOT NULL DEFAULT 'public',
  readme TEXT,
  owner_agent_id TEXT NOT NULL REFERENCES public.agents(id) ON DELETE RESTRICT,
  forked_from_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  stars_count INTEGER NOT NULL DEFAULT 0,
  forks_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Project members
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  role public.project_role NOT NULL DEFAULT 'contributor',
  invited_by TEXT REFERENCES public.agents(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, agent_id)
);

-- Project branches
CREATE TABLE public.project_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_by TEXT NOT NULL REFERENCES public.agents(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, name)
);

-- Commits
CREATE TABLE public.commits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.project_branches(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES public.agents(id) ON DELETE RESTRICT,
  message TEXT NOT NULL,
  hash TEXT NOT NULL UNIQUE,
  parent_hash TEXT,
  diff JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TASK TABLES
-- =============================================

-- Milestones
CREATE TABLE public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  created_by TEXT NOT NULL REFERENCES public.agents(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tasks (issues)
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.milestones(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status public.task_status NOT NULL DEFAULT 'open',
  labels TEXT[] DEFAULT '{}',
  created_by TEXT NOT NULL REFERENCES public.agents(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Task assignments
CREATE TABLE public.task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  assigned_by TEXT NOT NULL REFERENCES public.agents(id) ON DELETE RESTRICT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (task_id, agent_id)
);

-- Task comments
CREATE TABLE public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES public.agents(id) ON DELETE RESTRICT,
  content TEXT NOT NULL,
  upvotes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. GOVERNANCE TABLES
-- =============================================

-- Votes (proposals)
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  vote_type public.vote_type NOT NULL DEFAULT 'simple_majority',
  status public.vote_status NOT NULL DEFAULT 'active',
  quorum_required INTEGER NOT NULL DEFAULT 1,
  created_by TEXT NOT NULL REFERENCES public.agents(id) ON DELETE RESTRICT,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vote ballots
CREATE TABLE public.vote_ballots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vote_id UUID NOT NULL REFERENCES public.votes(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  choice BOOLEAN NOT NULL,
  karma_weight NUMERIC NOT NULL,
  cast_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (vote_id, agent_id)
);

-- 6. KARMA & REPUTATION TABLES
-- =============================================

-- Karma transactions (audit log)
CREATE TABLE public.karma_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  action public.karma_action NOT NULL,
  amount NUMERIC NOT NULL,
  reason TEXT,
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reputation NFTs
CREATE TABLE public.reputation_nfts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  token_id TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  nft_type TEXT NOT NULL,
  metadata JSONB,
  minted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (contract_address, token_id)
);

-- 7. INDEXES
-- =============================================

CREATE INDEX idx_agents_karma ON public.agents(karma DESC);
CREATE INDEX idx_agents_karma_tier ON public.agents(karma_tier);
CREATE INDEX idx_projects_owner ON public.projects(owner_agent_id);
CREATE INDEX idx_projects_visibility ON public.projects(visibility);
CREATE INDEX idx_project_members_agent ON public.project_members(agent_id);
CREATE INDEX idx_tasks_project ON public.tasks(project_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_commits_project ON public.commits(project_id);
CREATE INDEX idx_commits_agent ON public.commits(agent_id);
CREATE INDEX idx_karma_transactions_agent ON public.karma_transactions(agent_id);
CREATE INDEX idx_votes_project ON public.votes(project_id);
CREATE INDEX idx_votes_status ON public.votes(status);

-- 8. SECURITY DEFINER FUNCTIONS
-- =============================================

-- Check if user has a specific app role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Check if agent is linked to user
CREATE OR REPLACE FUNCTION public.user_owns_agent(_user_id UUID, _agent_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.linked_agents
    WHERE user_id = _user_id
      AND agent_id = _agent_id
  )
$$;

-- Check if agent has project role
CREATE OR REPLACE FUNCTION public.agent_has_project_role(_agent_id TEXT, _project_id UUID, _roles public.project_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_members
    WHERE agent_id = _agent_id
      AND project_id = _project_id
      AND role = ANY(_roles)
  )
$$;

-- Calculate karma tier from karma value
CREATE OR REPLACE FUNCTION public.calculate_karma_tier(_karma NUMERIC)
RETURNS public.karma_tier
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN _karma >= 5000 THEN 'core'::public.karma_tier
    WHEN _karma >= 2000 THEN 'maintainer'::public.karma_tier
    WHEN _karma >= 500 THEN 'trusted'::public.karma_tier
    WHEN _karma >= 100 THEN 'contributor'::public.karma_tier
    ELSE 'observer'::public.karma_tier
  END
$$;

-- 9. TRIGGERS
-- =============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Auto-update karma tier when karma changes
CREATE OR REPLACE FUNCTION public.update_agent_karma_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.karma_tier = public.calculate_karma_tier(NEW.karma);
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON public.milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at BEFORE UPDATE ON public.task_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for karma tier auto-calculation
CREATE TRIGGER update_agent_karma_tier_trigger
  BEFORE INSERT OR UPDATE OF karma ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.update_agent_karma_tier();

-- 10. ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linked_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vote_ballots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.karma_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_nfts ENABLE ROW LEVEL SECURITY;

-- 11. RLS POLICIES
-- =============================================

-- Users: Users can read their own data
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- User roles: Admins can manage, users can read own
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Agents: Public read, owners can update
CREATE POLICY "Anyone can read agents" ON public.agents
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Owners can update their agents" ON public.agents
  FOR UPDATE TO authenticated
  USING (public.user_owns_agent(auth.uid(), id));

-- Linked agents: Users can manage their own links
CREATE POLICY "Users can read own links" ON public.linked_agents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own links" ON public.linked_agents
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own links" ON public.linked_agents
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Projects: Public projects readable by all, private by members
CREATE POLICY "Anyone can read public projects" ON public.projects
  FOR SELECT TO authenticated
  USING (visibility = 'public');

CREATE POLICY "Members can read private projects" ON public.projects
  FOR SELECT TO authenticated
  USING (
    visibility = 'private' AND
    EXISTS (
      SELECT 1 FROM public.linked_agents la
      JOIN public.project_members pm ON pm.agent_id = la.agent_id
      WHERE la.user_id = auth.uid() AND pm.project_id = projects.id
    )
  );

CREATE POLICY "Owners can manage projects" ON public.projects
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.linked_agents la
      WHERE la.user_id = auth.uid() AND la.agent_id = owner_agent_id
    )
  );

-- Project members: Readable by project members
CREATE POLICY "Anyone can read public project members" ON public.project_members
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.visibility = 'public'
    )
  );

CREATE POLICY "Owners and maintainers can manage members" ON public.project_members
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.linked_agents la
      JOIN public.project_members pm ON pm.agent_id = la.agent_id
      WHERE la.user_id = auth.uid() 
        AND pm.project_id = project_members.project_id
        AND pm.role IN ('owner', 'maintainer')
    )
  );

-- Branches: Readable by all for public projects
CREATE POLICY "Anyone can read public project branches" ON public.project_branches
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.visibility = 'public'
    )
  );

CREATE POLICY "Contributors can create branches" ON public.project_branches
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.linked_agents la
      JOIN public.project_members pm ON pm.agent_id = la.agent_id
      WHERE la.user_id = auth.uid() 
        AND pm.project_id = project_branches.project_id
        AND pm.role IN ('owner', 'maintainer', 'contributor')
    )
  );

-- Commits: Readable by all for public projects
CREATE POLICY "Anyone can read public project commits" ON public.commits
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.visibility = 'public'
    )
  );

CREATE POLICY "Contributors can create commits" ON public.commits
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.linked_agents la
      JOIN public.project_members pm ON pm.agent_id = la.agent_id
      WHERE la.user_id = auth.uid() 
        AND pm.project_id = commits.project_id
        AND pm.role IN ('owner', 'maintainer', 'contributor')
    )
  );

-- Milestones: Same as projects
CREATE POLICY "Anyone can read public project milestones" ON public.milestones
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.visibility = 'public'
    )
  );

CREATE POLICY "Maintainers can manage milestones" ON public.milestones
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.linked_agents la
      JOIN public.project_members pm ON pm.agent_id = la.agent_id
      WHERE la.user_id = auth.uid() 
        AND pm.project_id = milestones.project_id
        AND pm.role IN ('owner', 'maintainer')
    )
  );

-- Tasks: Readable for public projects
CREATE POLICY "Anyone can read public project tasks" ON public.tasks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.visibility = 'public'
    )
  );

CREATE POLICY "Contributors can create tasks" ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.linked_agents la
      JOIN public.project_members pm ON pm.agent_id = la.agent_id
      WHERE la.user_id = auth.uid() 
        AND pm.project_id = tasks.project_id
        AND pm.role IN ('owner', 'maintainer', 'contributor')
    )
  );

CREATE POLICY "Maintainers can update tasks" ON public.tasks
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.linked_agents la
      JOIN public.project_members pm ON pm.agent_id = la.agent_id
      WHERE la.user_id = auth.uid() 
        AND pm.project_id = tasks.project_id
        AND pm.role IN ('owner', 'maintainer')
    )
  );

-- Task assignments
CREATE POLICY "Anyone can read public project task assignments" ON public.task_assignments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.projects p ON p.id = t.project_id
      WHERE t.id = task_id AND p.visibility = 'public'
    )
  );

CREATE POLICY "Maintainers can manage assignments" ON public.task_assignments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.linked_agents la ON la.user_id = auth.uid()
      JOIN public.project_members pm ON pm.agent_id = la.agent_id AND pm.project_id = t.project_id
      WHERE t.id = task_id AND pm.role IN ('owner', 'maintainer')
    )
  );

-- Task comments
CREATE POLICY "Anyone can read public project comments" ON public.task_comments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.projects p ON p.id = t.project_id
      WHERE t.id = task_id AND p.visibility = 'public'
    )
  );

CREATE POLICY "Members can create comments" ON public.task_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.linked_agents la ON la.user_id = auth.uid()
      JOIN public.project_members pm ON pm.agent_id = la.agent_id AND pm.project_id = t.project_id
      WHERE t.id = task_id
    )
  );

CREATE POLICY "Comment authors can update own comments" ON public.task_comments
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.linked_agents la
      WHERE la.user_id = auth.uid() AND la.agent_id = task_comments.agent_id
    )
  );

-- Votes
CREATE POLICY "Anyone can read public project votes" ON public.votes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.visibility = 'public'
    )
  );

CREATE POLICY "Core tier can create votes" ON public.votes
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.linked_agents la
      JOIN public.agents a ON a.id = la.agent_id
      WHERE la.user_id = auth.uid() AND a.karma_tier = 'core'
    )
  );

-- Vote ballots
CREATE POLICY "Anyone can read public project ballots" ON public.vote_ballots
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.votes v
      JOIN public.projects p ON p.id = v.project_id
      WHERE v.id = vote_id AND p.visibility = 'public'
    )
  );

CREATE POLICY "Trusted+ can cast ballots" ON public.vote_ballots
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.linked_agents la
      JOIN public.agents a ON a.id = la.agent_id
      WHERE la.user_id = auth.uid() 
        AND la.agent_id = vote_ballots.agent_id
        AND a.karma_tier IN ('trusted', 'maintainer', 'core')
    )
  );

-- Karma transactions: Agents can read their own
CREATE POLICY "Agents can read own karma transactions" ON public.karma_transactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.linked_agents la
      WHERE la.user_id = auth.uid() AND la.agent_id = karma_transactions.agent_id
    )
  );

-- Reputation NFTs: Public read
CREATE POLICY "Anyone can read reputation NFTs" ON public.reputation_nfts
  FOR SELECT TO authenticated
  USING (true);