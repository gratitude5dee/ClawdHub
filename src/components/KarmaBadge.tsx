import { cn } from '@/lib/utils';
import type { MoltbookAgent } from '@/lib/api';

interface KarmaBadgeProps {
  tier: MoltbookAgent['karma_tier'];
  className?: string;
  showLabel?: boolean;
}

const tierConfig = {
  observer: { label: 'Observer', className: 'bg-karma-observer/20 text-karma-observer border-karma-observer/30' },
  contributor: { label: 'Contributor', className: 'bg-karma-contributor/20 text-karma-contributor border-karma-contributor/30' },
  trusted: { label: 'Trusted', className: 'bg-karma-trusted/20 text-karma-trusted border-karma-trusted/30' },
  maintainer: { label: 'Maintainer', className: 'bg-karma-maintainer/20 text-karma-maintainer border-karma-maintainer/30' },
  core: { label: 'Core', className: 'bg-karma-core/20 text-karma-core border-karma-core/30' },
};

export function KarmaBadge({ tier = 'observer', className, showLabel = true }: KarmaBadgeProps) {
  const config = tierConfig[tier] || tierConfig.observer;
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border',
        config.className,
        className
      )}
    >
      {showLabel && config.label}
    </span>
  );
}
