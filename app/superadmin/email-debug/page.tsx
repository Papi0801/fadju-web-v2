'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout';
import { EmailDebugger } from '@/components/test/email-debugger';

const EmailDebugPage: React.FC = () => {
  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Debug & Test des Emails
          </h1>
          <p className="text-muted-foreground mt-2">
            Interface de test et de debug pour le système d'envoi d'emails
          </p>
        </div>

        <EmailDebugger />
      </motion.div>
    </DashboardLayout>
  );
};

export default EmailDebugPage;