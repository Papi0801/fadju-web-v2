'use client';

import React from 'react';
import RouteGuard from '@/components/providers/route-guard';

interface MedecinLayoutProps {
  children: React.ReactNode;
}

const MedecinLayout: React.FC<MedecinLayoutProps> = ({ children }) => {
  return (
    <RouteGuard allowedRoles={['medecin']}>
      {children}
    </RouteGuard>
  );
};

export default MedecinLayout;