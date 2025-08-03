'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { LoadingOverlay } from '@/components/ui';

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const router = useRouter();
  const { user, loading, initializeAuth } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const unsubscribe = initializeAuth();
    setIsInitialized(true);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized && !loading) {
      const pathname = window.location.pathname;
      
      // Routes publiques qui ne nécessitent pas d'authentification
      const publicRoutes = [
        '/',
        '/health-secretary',
        '/health-secretary/register',
        '/health-secretary/login',
        '/auth/login',
        '/superadmin-login',
        '/setup'
      ];
      
      const isPublicRoute = publicRoutes.some(route => 
        pathname === route || pathname.startsWith(route + '/')
      );
      
      // Redirection vers login si pas connecté et pas sur une route publique
      if (!user && !isPublicRoute) {
        router.replace('/auth/login');
      }
      // Redirection vers le bon dashboard selon le rôle si connecté et sur une page de login
      // mais seulement si on n'est pas en train de se connecter (évite les conflits)
      else if (user?.role && (pathname.includes('/auth/login') || pathname.includes('/health-secretary/login')) && !loading) {
        // Petite temporisation pour éviter les conflits avec les redirections de la page de login
        setTimeout(() => {
          switch (user.role) {
            case 'superadmin':
              router.replace('/superadmin');
              break;
            case 'secretaire':
              router.replace('/secretaire/dashboard');
              break;
            case 'medecin':
              router.replace('/medecin/dashboard');
              break;
            default:
              router.replace('/auth/login');
          }
        }, 100);
      }
    }
  }, [user, loading, isInitialized, router]);

  // Afficher le loader pendant l'initialisation
  if (!isInitialized || loading) {
    return <LoadingOverlay isLoading={true} text="Initialisation..." />;
  }

  return <>{children}</>;
};

export default AuthProvider;