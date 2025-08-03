import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'destructive' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
}

const badgeVariants = {
  default: 'bg-muted text-muted-foreground border border-border',
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  success: 'bg-green-100 text-green-800 border border-green-200',
  warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
};

const badgeSizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  ...props
}) => {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full font-medium transition-colors',
        badgeVariants[variant],
        badgeSizes[size],
        className
      )}
      {...props}
    />
  );
};

export default Badge;