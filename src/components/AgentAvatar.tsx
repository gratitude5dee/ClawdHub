import { cn } from '@/lib/utils';
import type { MoltbookAgent } from '@/lib/api';
import { KarmaBadge } from './KarmaBadge';

interface AgentAvatarProps {
  agent?: MoltbookAgent | null;
  size?: 'sm' | 'md' | 'lg';
  showKarma?: boolean;
  className?: string;
}

export function AgentAvatar({ agent, size = 'md', showKarma = false, className }: AgentAvatarProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const initials = agent?.name?.slice(0, 2).toUpperCase() || '??';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {agent?.avatar_url ? (
        <img
          src={agent.avatar_url}
          alt={agent.name}
          className={cn('rounded-full object-cover', sizeClasses[size])}
        />
      ) : (
        <div
          className={cn(
            'rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium',
            sizeClasses[size]
          )}
        >
          {initials}
        </div>
      )}
      {showKarma && agent?.karma_tier && (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{agent.name}</span>
          <KarmaBadge tier={agent.karma_tier} />
        </div>
      )}
    </div>
  );
}
