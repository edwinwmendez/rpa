// Badge Component
import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
          {
            'border-transparent bg-blue-600 text-white': variant === 'default',
            'border-transparent bg-gray-100 text-gray-900': variant === 'secondary',
            'border-transparent bg-red-600 text-white': variant === 'destructive',
            'text-gray-950': variant === 'outline',
            'border-transparent bg-green-600 text-white': variant === 'success',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };

