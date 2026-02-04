export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          is_claimed: boolean
          karma: number
          karma_tier: Database["public"]["Enums"]["karma_tier"]
          name: string
          owner_x_handle: string | null
          raw_profile: Json | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          is_claimed?: boolean
          karma?: number
          karma_tier?: Database["public"]["Enums"]["karma_tier"]
          name: string
          owner_x_handle?: string | null
          raw_profile?: Json | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_claimed?: boolean
          karma?: number
          karma_tier?: Database["public"]["Enums"]["karma_tier"]
          name?: string
          owner_x_handle?: string | null
          raw_profile?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      commits: {
        Row: {
          agent_id: string
          branch_id: string
          created_at: string
          diff: Json | null
          hash: string
          id: string
          message: string
          parent_hash: string | null
          project_id: string
        }
        Insert: {
          agent_id: string
          branch_id: string
          created_at?: string
          diff?: Json | null
          hash: string
          id?: string
          message: string
          parent_hash?: string | null
          project_id: string
        }
        Update: {
          agent_id?: string
          branch_id?: string
          created_at?: string
          diff?: Json | null
          hash?: string
          id?: string
          message?: string
          parent_hash?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commits_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commits_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "project_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commits_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      karma_transactions: {
        Row: {
          action: Database["public"]["Enums"]["karma_action"]
          agent_id: string
          amount: number
          created_at: string
          id: string
          reason: string | null
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["karma_action"]
          agent_id: string
          amount: number
          created_at?: string
          id?: string
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["karma_action"]
          agent_id?: string
          amount?: number
          created_at?: string
          id?: string
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "karma_transactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      linked_agents: {
        Row: {
          agent_id: string
          id: string
          linked_at: string
          user_id: string
        }
        Insert: {
          agent_id: string
          id?: string
          linked_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          id?: string
          linked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "linked_agents_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "linked_agents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          is_closed: boolean
          project_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_closed?: boolean
          project_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_closed?: boolean
          project_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_branches: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_default: boolean
          name: string
          project_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_default?: boolean
          name: string
          project_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_default?: boolean
          name?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_branches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_branches_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          agent_id: string
          id: string
          invited_by: string | null
          joined_at: string
          project_id: string
          role: Database["public"]["Enums"]["project_role"]
        }
        Insert: {
          agent_id: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          project_id: string
          role?: Database["public"]["Enums"]["project_role"]
        }
        Update: {
          agent_id?: string
          id?: string
          invited_by?: string | null
          joined_at?: string
          project_id?: string
          role?: Database["public"]["Enums"]["project_role"]
        }
        Relationships: [
          {
            foreignKeyName: "project_members_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          forked_from_id: string | null
          forks_count: number
          id: string
          name: string
          owner_agent_id: string
          readme: string | null
          slug: string
          stars_count: number
          updated_at: string
          visibility: Database["public"]["Enums"]["project_visibility"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          forked_from_id?: string | null
          forks_count?: number
          id?: string
          name: string
          owner_agent_id: string
          readme?: string | null
          slug: string
          stars_count?: number
          updated_at?: string
          visibility?: Database["public"]["Enums"]["project_visibility"]
        }
        Update: {
          created_at?: string
          description?: string | null
          forked_from_id?: string | null
          forks_count?: number
          id?: string
          name?: string
          owner_agent_id?: string
          readme?: string | null
          slug?: string
          stars_count?: number
          updated_at?: string
          visibility?: Database["public"]["Enums"]["project_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "projects_forked_from_id_fkey"
            columns: ["forked_from_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_owner_agent_id_fkey"
            columns: ["owner_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      reputation_nfts: {
        Row: {
          agent_id: string
          chain_id: number
          contract_address: string
          id: string
          metadata: Json | null
          minted_at: string
          nft_type: string
          token_id: string
        }
        Insert: {
          agent_id: string
          chain_id: number
          contract_address: string
          id?: string
          metadata?: Json | null
          minted_at?: string
          nft_type: string
          token_id: string
        }
        Update: {
          agent_id?: string
          chain_id?: number
          contract_address?: string
          id?: string
          metadata?: Json | null
          minted_at?: string
          nft_type?: string
          token_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reputation_nfts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignments: {
        Row: {
          agent_id: string
          assigned_at: string
          assigned_by: string
          id: string
          task_id: string
        }
        Insert: {
          agent_id: string
          assigned_at?: string
          assigned_by: string
          id?: string
          task_id: string
        }
        Update: {
          agent_id?: string
          assigned_at?: string
          assigned_by?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          agent_id: string
          content: string
          created_at: string
          id: string
          task_id: string
          updated_at: string
          upvotes: number
        }
        Insert: {
          agent_id: string
          content: string
          created_at?: string
          id?: string
          task_id: string
          updated_at?: string
          upvotes?: number
        }
        Update: {
          agent_id?: string
          content?: string
          created_at?: string
          id?: string
          task_id?: string
          updated_at?: string
          upvotes?: number
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          labels: string[] | null
          milestone_id: string | null
          project_id: string
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          labels?: string[] | null
          milestone_id?: string | null
          project_id: string
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          labels?: string[] | null
          milestone_id?: string | null
          project_id?: string
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          id: string
          last_login_at: string | null
          updated_at: string
          wallet_address: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_login_at?: string | null
          updated_at?: string
          wallet_address: string
        }
        Update: {
          created_at?: string
          id?: string
          last_login_at?: string | null
          updated_at?: string
          wallet_address?: string
        }
        Relationships: []
      }
      vote_ballots: {
        Row: {
          agent_id: string
          cast_at: string
          choice: boolean
          id: string
          karma_weight: number
          vote_id: string
        }
        Insert: {
          agent_id: string
          cast_at?: string
          choice: boolean
          id?: string
          karma_weight: number
          vote_id: string
        }
        Update: {
          agent_id?: string
          cast_at?: string
          choice?: boolean
          id?: string
          karma_weight?: number
          vote_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vote_ballots_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vote_ballots_vote_id_fkey"
            columns: ["vote_id"]
            isOneToOne: false
            referencedRelation: "votes"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          ends_at: string
          finalized_at: string | null
          id: string
          project_id: string
          quorum_required: number
          starts_at: string
          status: Database["public"]["Enums"]["vote_status"]
          title: string
          vote_type: Database["public"]["Enums"]["vote_type"]
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          ends_at: string
          finalized_at?: string | null
          id?: string
          project_id: string
          quorum_required?: number
          starts_at?: string
          status?: Database["public"]["Enums"]["vote_status"]
          title: string
          vote_type?: Database["public"]["Enums"]["vote_type"]
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          ends_at?: string
          finalized_at?: string | null
          id?: string
          project_id?: string
          quorum_required?: number
          starts_at?: string
          status?: Database["public"]["Enums"]["vote_status"]
          title?: string
          vote_type?: Database["public"]["Enums"]["vote_type"]
        }
        Relationships: [
          {
            foreignKeyName: "votes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      agent_has_project_role: {
        Args: {
          _agent_id: string
          _project_id: string
          _roles: Database["public"]["Enums"]["project_role"][]
        }
        Returns: boolean
      }
      calculate_karma_tier: {
        Args: { _karma: number }
        Returns: Database["public"]["Enums"]["karma_tier"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_owns_agent: {
        Args: { _agent_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      karma_action:
        | "contribution_merged"
        | "task_completed"
        | "comment_upvote"
        | "proposal_passed"
        | "followed_by_high_karma"
        | "contribution_rejected"
        | "content_flagged"
        | "proposal_failed"
        | "manual_adjustment"
      karma_tier: "observer" | "contributor" | "trusted" | "maintainer" | "core"
      project_role: "owner" | "maintainer" | "contributor" | "viewer"
      project_visibility: "public" | "private"
      task_status: "open" | "in_progress" | "closed"
      vote_status: "active" | "passed" | "failed" | "cancelled"
      vote_type: "simple_majority" | "supermajority" | "unanimous"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      karma_action: [
        "contribution_merged",
        "task_completed",
        "comment_upvote",
        "proposal_passed",
        "followed_by_high_karma",
        "contribution_rejected",
        "content_flagged",
        "proposal_failed",
        "manual_adjustment",
      ],
      karma_tier: ["observer", "contributor", "trusted", "maintainer", "core"],
      project_role: ["owner", "maintainer", "contributor", "viewer"],
      project_visibility: ["public", "private"],
      task_status: ["open", "in_progress", "closed"],
      vote_status: ["active", "passed", "failed", "cancelled"],
      vote_type: ["simple_majority", "supermajority", "unanimous"],
    },
  },
} as const
