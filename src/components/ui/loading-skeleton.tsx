import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <motion.div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      initial={{ opacity: 0.4 }}
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      {...(props as any)}
    />
  );
};

interface CardSkeletonProps {
  showIcon?: boolean;
  lines?: number;
}

const CardSkeleton: React.FC<CardSkeletonProps> = ({ showIcon = true, lines = 3 }) => {
  return (
    <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
      <div className="flex items-start space-x-4">
        {showIcon && <Skeleton className="h-12 w-12 rounded-lg" />}
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-3/4" />
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
};

interface StatsSkeletonProps {
  count?: number;
}

const StatsSkeleton: React.FC<StatsSkeletonProps> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <div className="rounded-lg border border-border bg-background p-4 lg:p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-8 w-1/2" />
              </div>
              <Skeleton className="h-8 w-8 lg:h-10 lg:w-10 rounded-lg ml-3" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="rounded-lg border border-border bg-background">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <motion.div
            key={rowIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: rowIndex * 0.05 }}
            className="p-4"
          >
            <div className="grid grid-cols-4 gap-4 items-center">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton
                  key={colIndex}
                  className={cn(
                    "h-4",
                    colIndex === 0 ? "w-3/4" : "w-full"
                  )}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

interface ListSkeletonProps {
  items?: number;
  showAvatar?: boolean;
}

const ListSkeleton: React.FC<ListSkeletonProps> = ({ items = 3, showAvatar = true }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex items-center space-x-4 p-4 rounded-lg border border-border bg-background"
        >
          {showAvatar && <Skeleton className="h-12 w-12 rounded-full" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </motion.div>
      ))}
    </div>
  );
};

// Animation de points pour les états de chargement
const LoadingDots: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("flex space-x-1", className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-current rounded-full"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
};

// Spinner de chargement amélioré
const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <motion.div
      className={cn(
        'rounded-full border-2 border-current border-t-transparent',
        sizeClasses[size],
        className
      )}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
};

export {
  Skeleton,
  CardSkeleton,
  StatsSkeleton,
  TableSkeleton,
  ListSkeleton,
  LoadingDots,
  LoadingSpinner,
};
