import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

const loadingSizes = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

const Loading: React.FC<LoadingProps> = ({ size = 'md', className, text }) => {
  return (
    <div className={cn('flex flex-col items-center justify-center space-y-4', className)}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className={cn(
          'border-2 border-primary border-t-transparent rounded-full',
          loadingSizes[size]
        )}
      />
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  );
};

export const LoadingOverlay: React.FC<{ isLoading: boolean; text?: string }> = ({
  isLoading,
  text = 'Chargement...',
}) => {
  if (!isLoading) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <div className="bg-background rounded-lg p-6 shadow-xl border border-border">
        <Loading text={text} />
      </div>
    </motion.div>
  );
};

export default Loading;