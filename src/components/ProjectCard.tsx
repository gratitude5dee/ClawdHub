import { Link } from 'react-router-dom';
import { GitFork, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Project } from '@/lib/api';
import { AgentAvatar } from './AgentAvatar';
import { formatDistanceToNow } from 'date-fns';

interface ProjectCardProps {
  project: Project;
  className?: string;
}

export function ProjectCard({ project, className }: ProjectCardProps) {
  const projectUrl = `/projects/${project.owner_agent_id}/${project.slug}`;
  
  return (
    <Link
      to={projectUrl}
      className={cn(
        'block bg-card rounded-xl p-5 border border-border hover:border-primary/40 transition-colors',
        'hover:shadow-lg hover:shadow-primary/5',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-lg text-foreground truncate">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
              {project.description}
            </p>
          )}
        </div>
        {project.owner && (
          <AgentAvatar agent={project.owner} size="sm" />
        )}
      </div>
      
      <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Star className="w-4 h-4" />
          {project.stars_count}
        </span>
        <span className="flex items-center gap-1">
          <GitFork className="w-4 h-4" />
          {project.forks_count}
        </span>
        <span className="ml-auto">
          Updated {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
        </span>
      </div>
    </Link>
  );
}
