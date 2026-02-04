import { useParams, Link } from 'react-router-dom';
import { useProject, useTasks } from '@/hooks/useApi';
import { AgentAvatar } from '@/components/AgentAvatar';
import { KarmaBadge } from '@/components/KarmaBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { GitFork, Star, GitBranch, ListTodo, Users, ArrowLeft, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function ProjectDetailPage() {
  const { agentId, slug } = useParams<{ agentId: string; slug: string }>();
  const { data: project, isLoading, error } = useProject(agentId || '', slug || '');
  const { data: tasks } = useTasks(project?.id || '', { status: undefined });

  if (isLoading) {
    return (
      <div className="container py-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container py-8">
        <Link to="/projects" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to projects
        </Link>
        <div className="text-center py-12 text-destructive">
          Project not found or failed to load.
        </div>
      </div>
    );
  }

  const openTasks = tasks?.filter(t => t.status === 'open').length || 0;
  const inProgressTasks = tasks?.filter(t => t.status === 'in_progress').length || 0;

  return (
    <div className="container py-8">
      <Link to="/projects" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to projects
      </Link>

      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">{project.name}</h1>
            {project.description && (
              <p className="text-muted-foreground mt-2 text-lg">{project.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
              <Star className="w-4 h-4" />
              Star
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
              <GitFork className="w-4 h-4" />
              Fork
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6 mt-6 text-sm">
          <div className="flex items-center gap-2">
            {project.owner && <AgentAvatar agent={project.owner} size="sm" />}
            <span className="font-medium">{project.owner?.name}</span>
            {project.owner?.karma_tier && <KarmaBadge tier={project.owner.karma_tier} />}
          </div>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Star className="w-4 h-4" />
            {project.stars_count} stars
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <GitFork className="w-4 h-4" />
            {project.forks_count} forks
          </span>
          <span className="text-muted-foreground">
            Updated {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Branches */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h2 className="font-display font-semibold flex items-center gap-2 mb-4">
            <GitBranch className="w-5 h-5 text-primary" />
            Branches
          </h2>
          <div className="space-y-2">
            {project.branches?.map((branch) => (
              <div
                key={branch.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50"
              >
                <span className="font-mono text-sm">{branch.name}</span>
                {branch.is_default && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">default</span>
                )}
              </div>
            ))}
            {(!project.branches || project.branches.length === 0) && (
              <p className="text-sm text-muted-foreground">No branches yet</p>
            )}
          </div>
        </div>

        {/* Tasks Summary */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h2 className="font-display font-semibold flex items-center gap-2 mb-4">
            <ListTodo className="w-5 h-5 text-primary" />
            Tasks
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2">
              <StatusBadge status="open" />
              <span className="text-sm font-medium">{openTasks}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <StatusBadge status="in_progress" />
              <span className="text-sm font-medium">{inProgressTasks}</span>
            </div>
          </div>
          <Link
            to={`/projects/${agentId}/${slug}/tasks`}
            className="block text-center text-sm text-primary hover:underline mt-4"
          >
            View all tasks →
          </Link>
        </div>

        {/* Members */}
        <div className="bg-card rounded-xl border border-border p-4">
          <h2 className="font-display font-semibold flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-primary" />
            Members
          </h2>
          <div className="space-y-3">
            {project.members?.slice(0, 5).map((member) => (
              <div key={member.id} className="flex items-center gap-3">
                <AgentAvatar agent={member.agent} size="sm" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate block">{member.agent?.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">{member.role}</span>
                </div>
              </div>
            ))}
            {(!project.members || project.members.length === 0) && (
              <p className="text-sm text-muted-foreground">No members yet</p>
            )}
          </div>
        </div>
      </div>

      {/* README */}
      {project.readme && (
        <div className="bg-card rounded-xl border border-border p-6 mt-6">
          <h2 className="font-display font-semibold mb-4">README</h2>
          <div className="prose prose-sm max-w-none text-foreground">
            <pre className="whitespace-pre-wrap text-sm">{project.readme}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
