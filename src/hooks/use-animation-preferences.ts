import { useState, useEffect } from 'react';

interface AnimationPreferences {
  reduceMotion: boolean;
  enableHaptics: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
}

export const useAnimationPreferences = () => {
  const [preferences, setPreferences] = useState<AnimationPreferences>({
    reduceMotion: false,
    enableHaptics: true,
    animationSpeed: 'normal',
  });

  useEffect(() => {
    // Détecter la préférence système pour les animations réduites
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const updateReduceMotion = (e: MediaQueryListEvent | MediaQueryList) => {
      setPreferences(prev => ({
        ...prev,
        reduceMotion: e.matches,
      }));
    };

    // Initial check
    updateReduceMotion(mediaQuery);

    // Listen for changes
    mediaQuery.addEventListener('change', updateReduceMotion);

    // Cleanup
    return () => mediaQuery.removeEventListener('change', updateReduceMotion);
  }, []);

  // Adapter les durées d'animation selon les préférences
  const getAnimationDuration = (baseDuration: number) => {
    if (preferences.reduceMotion) return 0;
    
    switch (preferences.animationSpeed) {
      case 'slow':
        return baseDuration * 1.5;
      case 'fast':
        return baseDuration * 0.7;
      default:
        return baseDuration;
    }
  };

  // Adapter les transitions selon les préférences
  const getTransition = (baseTransition: any) => {
    if (preferences.reduceMotion) {
      return { duration: 0 };
    }
    
    return {
      ...baseTransition,
      duration: getAnimationDuration(baseTransition.duration || 0.3),
    };
  };

  // Variants d'animation adaptés
  const getAnimationVariants = () => {
    if (preferences.reduceMotion) {
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 },
      };
    }

    return {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
    };
  };

  return {
    preferences,
    setPreferences,
    getAnimationDuration,
    getTransition,
    getAnimationVariants,
  };
};

// Hook pour les micro-interactions
export const useMicroInteractions = () => {
  const { preferences } = useAnimationPreferences();

  const hoverScale = preferences.reduceMotion ? 1 : 1.05;
  const tapScale = preferences.reduceMotion ? 1 : 0.95;

  const buttonInteractions = preferences.reduceMotion ? {} : {
    whileHover: { scale: hoverScale },
    whileTap: { scale: tapScale },
    transition: { duration: 0.1 },
  };

  const cardInteractions = preferences.reduceMotion ? {} : {
    whileHover: { y: -4, scale: 1.02 },
    transition: { duration: 0.2 },
  };

  return {
    buttonInteractions,
    cardInteractions,
    hoverScale,
    tapScale,
  };
};

// Hook pour les animations de liste staggerées
export const useStaggerAnimation = (itemCount: number, baseDelay: number = 0.1) => {
  const { preferences, getAnimationDuration } = useAnimationPreferences();

  const getStaggerVariants = () => {
    if (preferences.reduceMotion) {
      return {
        container: {},
        item: {
          initial: { opacity: 1 },
          animate: { opacity: 1 },
        },
      };
    }

    return {
      container: {
        animate: {
          transition: {
            staggerChildren: getAnimationDuration(baseDelay),
          },
        },
      },
      item: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
      },
    };
  };

  return getStaggerVariants();
};

// Hook pour les animations de chargement
export const useLoadingAnimation = () => {
  const { preferences } = useAnimationPreferences();

  const pulseAnimation = preferences.reduceMotion ? {} : {
    animate: {
      opacity: [0.4, 0.8, 0.4],
    },
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  };

  const spinAnimation = preferences.reduceMotion ? {} : {
    animate: { rotate: 360 },
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  };

  return {
    pulseAnimation,
    spinAnimation,
  };
};