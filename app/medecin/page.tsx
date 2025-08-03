'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, FileText, Stethoscope } from 'lucide-react';

import { useAuthStore } from '@/store';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';

const MedecinPage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Tableau de Bord Médecin
          </h1>
          <p className="text-muted-foreground mt-2">
            Bienvenue, Dr. {user?.prenom} {user?.nom} - Gestion des patients
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card hover>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Rendez-vous aujourd'hui</p>
                  <p className="text-2xl font-bold text-foreground mt-1">6</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Patients suivis</p>
                  <p className="text-2xl font-bold text-foreground mt-1">45</p>
                </div>
                <div className="p-3 rounded-lg bg-green-100 text-green-600">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Résultats en attente</p>
                  <p className="text-2xl font-bold text-foreground mt-1">3</p>
                </div>
                <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
                  <FileText className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Consultations ce mois</p>
                  <p className="text-2xl font-bold text-foreground mt-1">124</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                  <Stethoscope className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message d'information */}
        <Card>
          <CardHeader>
            <CardTitle>Interface Médecin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Stethoscope className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Interface en cours de développement
              </h3>
              <p className="text-muted-foreground mb-4">
                Les fonctionnalités spécifiques au médecin seront bientôt disponibles.
              </p>
              <Badge variant="primary">Rôle: Médecin</Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default MedecinPage;