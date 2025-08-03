'use client';

import React from 'react';
import RouteGuard from '@/components/providers/route-guard';

interface SecretaireLayoutProps {
  children: React.ReactNode;
}

const SecretaireLayout: React.FC<SecretaireLayoutProps> = ({ children }) => {
  return (
    <RouteGuard allowedRoles={['secretaire']}>
      {children}
    </RouteGuard>
  );
};

export default SecretaireLayout;