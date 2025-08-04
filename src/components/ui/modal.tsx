import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Button from './button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const modalSizes = {
  sm: 'max-w-sm sm:max-w-md',
  md: 'max-w-md sm:max-w-lg',
  lg: 'max-w-lg sm:max-w-2xl',
  xl: 'max-w-xl sm:max-w-4xl',
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Container with scroll */}
          <div className="relative min-h-screen w-full flex items-center justify-center p-2 sm:p-4 md:p-6">
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 500 }}
              className={cn(
                'relative w-full bg-background rounded-lg shadow-xl border border-border my-4 sm:my-8',
                'max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)] flex flex-col',
                modalSizes[size],
                className
              )}
            >
              {/* Header */}
              {title && (
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border flex-shrink-0">
                  <h2 className="text-base sm:text-lg font-semibold text-foreground pr-2">{title}</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-8 w-8 p-0 hover:bg-muted flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Content with scroll */}
              <div className={cn(
                'p-4 sm:p-6 overflow-y-auto flex-1',
                title && 'pt-4 sm:pt-6'
              )}>
                {children}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Modal;