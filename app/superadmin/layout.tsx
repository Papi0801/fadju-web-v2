'use client';

import React from 'react';
import RouteGuard from '@/components/providers/route-guard';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({ children }) => {
  return (
    <RouteGuard allowedRoles={['superadmin']}>
      {children}
    </RouteGuard>
  );
};

export default SuperAdminLayout;