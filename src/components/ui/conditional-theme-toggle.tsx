'use client';

import React from 'react';
import { useAuthStore } from '@/store';
import { ThemeToggle } from './theme-toggle';

export const ConditionalThemeToggle: React.FC = () => {
  const { user } = useAuthStore();

  // Afficher le toggle uniquement si l'utilisateur est connecté
  if (!user) {
    return null;
  }

  return <ThemeToggle />;
};