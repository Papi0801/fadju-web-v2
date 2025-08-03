'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout';
import { FirebaseSyncTester } from '@/components/test/firebase-sync-tester';

const SyncTestPage: React.FC = () => {
  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Test Synchronisation Firebase
          </h1>
          <p className="text-muted-foreground mt-2">
            Validation de l'interconnexion entre la plateforme web et l'application mobile
          </p>
        </div>

        <FirebaseSyncTester />
      </motion.div>
    </DashboardLayout>
  );
};

export default SyncTestPage;