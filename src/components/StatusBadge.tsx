import { cn } from '@/lib/utils';
import type { Task } from '@/lib/api';

interface StatusBadgeProps {
  status: Task['status'];
  className?: string;
}

const statusConfig = {
  open: { label: 'Open', className: 'bg-status-open/20 text-status-open border-status-open/30' },
  in_progress: { label: 'In Progress', className: 'bg-status-in-progress/20 text-status-in-progress border-status-in-progress/30' },
  closed: { label: 'Closed', className: 'bg-status-closed/20 text-status-closed border-status-closed/30' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.open;
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
