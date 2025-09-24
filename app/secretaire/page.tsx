'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const SecretairePage: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/secretaire/dashboard');
  }, [router]);

  return null;
};

export default SecretairePage;
