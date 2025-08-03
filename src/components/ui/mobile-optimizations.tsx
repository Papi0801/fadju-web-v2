import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Hook pour détecter si on est sur mobile
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

// Container responsive avec padding adaptatif
interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
  size = 'lg'
}) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full'
  };

  return (
    <div className={cn(
      'mx-auto px-4 sm:px-6 lg:px-8',
      sizeClasses[size],
      className
    )}>
      {children}
    </div>
  );
};

// Grid responsive adaptatif
interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    base?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className,
  cols = { base: 1, sm: 2, lg: 3 },
  gap = 4
}) => {
  const getGridCols = () => {
    const classes = [];
    if (cols.base) classes.push(`grid-cols-${cols.base}`);
    if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
    if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
    if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
    if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);
    return classes.join(' ');
  };

  return (
    <div className={cn(
      'grid',
      getGridCols(),
      `gap-${gap}`,
      className
    )}>
      {children}
    </div>
  );
};

// Stack vertical avec espacement adaptatif
interface StackProps {
  children: React.ReactNode;
  className?: string;
  spacing?: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
}

export const Stack: React.FC<StackProps> = ({
  children,
  className,
  spacing = 4,
  align = 'stretch'
}) => {
  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  return (
    <div className={cn(
      'flex flex-col',
      alignClasses[align],
      `space-y-${spacing}`,
      className
    )}>
      {children}
    </div>
  );
};

// Texte responsive avec tailles adaptatives
interface ResponsiveTextProps {
  children: React.ReactNode;
  className?: string;
  variant: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption';
}

export const ResponsiveText: React.FC<ResponsiveTextProps> = ({
  children,
  className,
  variant
}) => {
  const variantClasses = {
    h1: 'text-2xl sm:text-3xl lg:text-4xl font-bold',
    h2: 'text-xl sm:text-2xl lg:text-3xl font-semibold',
    h3: 'text-lg sm:text-xl lg:text-2xl font-semibold',
    h4: 'text-base sm:text-lg lg:text-xl font-medium',
    body: 'text-sm sm:text-base',
    caption: 'text-xs sm:text-sm'
  };

  const Component = variant.startsWith('h') ? variant as keyof JSX.IntrinsicElements : 'p';

  return (
    <Component className={cn(variantClasses[variant], className)}>
      {children}
    </Component>
  );
};

// Modal bottom sheet pour mobile
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  title
}) => {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null; // Utiliser Modal classique sur desktop
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-background rounded-t-xl z-50 max-h-[80vh] overflow-hidden"
          >
            <div className="p-4 border-b border-border">
              <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
              {title && (
                <h3 className="text-lg font-semibold text-center">{title}</h3>
              )}
            </div>
            <div className="overflow-y-auto max-h-[calc(80vh-5rem)]">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Bouton flottant pour mobile
interface FloatingActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  icon,
  className,
  position = 'bottom-right'
}) => {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 transform -translate-x-1/2'
  };

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'fixed z-50 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center',
        positionClasses[position],
        className
      )}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {icon}
    </motion.button>
  );
};

// Safe area pour mobile (éviter les encoches)
interface SafeAreaProps {
  children: React.ReactNode;
  className?: string;
}

export const SafeArea: React.FC<SafeAreaProps> = ({ children, className }) => {
  return (
    <div className={cn('pb-safe-area-inset-bottom pt-safe-area-inset-top', className)}>
      {children}
    </div>
  );
};

// Touch feedback pour les interactions mobiles
interface TouchableProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  feedback?: 'scale' | 'opacity' | 'both';
}

export const Touchable: React.FC<TouchableProps> = ({
  children,
  className,
  feedback = 'scale',
  ...props
}) => {
  const getWhileTap = () => {
    switch (feedback) {
      case 'scale':
        return { scale: 0.95 };
      case 'opacity':
        return { opacity: 0.7 };
      case 'both':
        return { scale: 0.95, opacity: 0.7 };
      default:
        return { scale: 0.95 };
    }
  };

  return (
    <motion.button
      className={cn('touch-manipulation', className)}
      whileTap={getWhileTap()}
      transition={{ duration: 0.1 }}
      {...props}
    >
      {children}
    </motion.button>
  );
};

// Swipe pour mobile
interface SwipeableProps {
  children: React.ReactNode;
  className?: string;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

export const Swipeable: React.FC<SwipeableProps> = ({
  children,
  className,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50
}) => {
  const [startPos, setStartPos] = React.useState({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setStartPos({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startPos.x;
    const deltaY = touch.clientY - startPos.y;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Swipe horizontal
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      }
    } else {
      // Swipe vertical
      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
    }
  };

  return (
    <div
      className={cn('touch-pan-y', className)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
};