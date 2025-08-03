'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { LoadingOverlay } from '@/components/ui';

interface ChangementMotDePasseLayoutProps {
  children: React.ReactNode;
}

const ChangementMotDePasseLayout: React.FC<ChangementMotDePasseLayoutProps> = ({ children }) => {
  const router = useRouter();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (!loading) {
      // Pas d'utilisateur connecté
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Pas un médecin
      if (user.role !== 'medecin') {
        router.push('/auth/login');
        return;
      }

      // Médecin qui n'a plus besoin de changer son mot de passe
      if (!user.premiere_connexion) {
        router.push('/medecin/dashboard');
        return;
      }
    }
  }, [user, loading, router]);

  // Afficher le loader pendant la vérification
  if (loading) {
    return <LoadingOverlay isLoading={true} text="Vérification des permissions..." />;
  }

  // Utilisateur non autorisé ou pas médecin
  if (!user || user.role !== 'medecin') {
    return <LoadingOverlay isLoading={true} text="Redirection en cours..." />;
  }

  // Médecin qui n'a plus besoin de changer son mot de passe  
  if (!user.premiere_connexion) {
    return <LoadingOverlay isLoading={true} text="Redirection vers le dashboard..." />;
  }

  // Médecin autorisé avec première connexion
  return <>{children}</>;
};

export default ChangementMotDePasseLayout;