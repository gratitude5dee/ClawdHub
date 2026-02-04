import { useParams, Link } from 'react-router-dom';
import { useProject, useTasks, useUpdateTask } from '@/hooks/useApi';
import { StatusBadge } from '@/components/StatusBadge';
import { AgentAvatar } from '@/components/AgentAvatar';
import { ArrowLeft, Plus, Loader2, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Task } from '@/lib/api';

const statusColumns: Task['status'][] = ['open', 'in_progress', 'closed'];

export function TaskBoardPage() {
  const { agentId, slug } = useParams<{ agentId: string; slug: string }>();
  const { data: project, isLoading: loadingProject } = useProject(agentId || '', slug || '');
  const { data: tasks, isLoading: loadingTasks } = useTasks(project?.id || '');
  const updateTask = useUpdateTask();

  const tasksByStatus = statusColumns.reduce((acc, status) => {
    acc[status] = tasks?.filter(t => t.status === status) || [];
    return acc;
  }, {} as Record<Task['status'], Task[]>);

  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    updateTask.mutate({ task_id: taskId, status: newStatus });
  };

  if (loadingProject || loadingTasks) {
    return (
      <div className="container py-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container py-8">
        <Link to="/projects" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to projects
        </Link>
        <div className="text-center py-12 text-destructive">
          Project not found.
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link 
            to={`/projects/${agentId}/${slug}`} 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold">{project.name} / Tasks</h1>
            <p className="text-sm text-muted-foreground">Kanban board view</p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {statusColumns.map((status) => (
          <div key={status} className="bg-muted/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <StatusBadge status={status} />
              <span className="text-sm text-muted-foreground">{tasksByStatus[status].length}</span>
            </div>
            
            <div className="space-y-3">
              {tasksByStatus[status].map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task}
                  onStatusChange={(newStatus) => handleStatusChange(task.id, newStatus)}
                />
              ))}
              
              {tasksByStatus[status].length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No tasks
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  onStatusChange: (status: Task['status']) => void;
}

function TaskCard({ task, onStatusChange }: TaskCardProps) {
  const commentCount = task.comments_count?.[0]?.count || 0;

  return (
    <div className="bg-card rounded-lg border border-border p-4 hover:border-primary/40 transition-colors">
      <h3 className="font-medium text-sm line-clamp-2">{task.title}</h3>
      
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {task.labels.map((label) => (
            <span
              key={label}
              className="text-xs bg-accent/20 text-accent-foreground px-2 py-0.5 rounded"
            >
              {label}
            </span>
          ))}
        </div>
      )}
      
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          {task.creator && <AgentAvatar agent={task.creator} size="sm" />}
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
          </span>
        </div>
        
        {commentCount > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageSquare className="w-3 h-3" />
            {commentCount}
          </span>
        )}
      </div>

      {/* Quick status change */}
      <div className="flex gap-1 mt-3">
        {statusColumns.map((s) => (
          <button
            key={s}
            onClick={() => onStatusChange(s)}
            className={cn(
              'flex-1 text-xs py-1 rounded transition-colors',
              task.status === s
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            )}
          >
            {s === 'in_progress' ? 'In Prog' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
