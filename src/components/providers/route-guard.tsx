'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store';
import { LoadingOverlay } from '@/components/ui';
import { UserRole } from '@/types';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

const RouteGuard: React.FC<RouteGuardProps> = ({ children, allowedRoles }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (!loading) {
      // Pas d'utilisateur connecté
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Vérifier si c'est un médecin avec première connexion
      if (user.role === 'medecin' && user.premiere_connexion && pathname !== '/medecin/changement-mot-de-passe') {
        router.push('/medecin/changement-mot-de-passe');
        return;
      }

      // Si on est sur la page de changement de mot de passe mais que ce n'est plus nécessaire
      if (user.role === 'medecin' && !user.premiere_connexion && pathname === '/medecin/changement-mot-de-passe') {
        router.push('/medecin/dashboard');
        return;
      }

      // Utilisateur connecté mais pas le bon rôle
      if (user?.role && !allowedRoles.includes(user.role)) {
        // Rediriger vers le bon dashboard selon son rôle
        switch (user.role) {
          case 'superadmin':
            router.push('/superadmin');
            break;
          case 'secretaire':
            router.push('/secretaire/dashboard');
            break;
          case 'medecin':
            // Vérifier première connexion pour les médecins
            if (user.premiere_connexion) {
              router.push('/medecin/changement-mot-de-passe');
            } else {
              router.push('/medecin/dashboard');
            }
            break;
          default:
            router.push('/auth/login');
        }
      }
    }
  }, [user, loading, allowedRoles, router, pathname]);

  // Afficher le loader pendant la vérification
  if (loading) {
    return <LoadingOverlay isLoading={true} text="Vérification des autorisations..." />;
  }

  // Pas d'utilisateur ou mauvais rôle
  if (!user || !user.role || !allowedRoles.includes(user.role)) {
    return <LoadingOverlay isLoading={true} text="Redirection en cours..." />;
  }

  // Utilisateur autorisé
  return <>{children}</>;
};

export default RouteGuard;