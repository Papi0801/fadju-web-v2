'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Calendar,
  Users,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';

import { useAuthStore, useEtablissementStore, useRendezVousStore } from '@/store';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';

// Composant de statistique
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'success' | 'warning' | 'destructive';
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = 'primary',
}) => {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-yellow-100 text-yellow-600',
    destructive: 'bg-red-100 text-red-600',
  };

  return (
    <Card hover>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
            {trend && (
              <div className="flex items-center mt-2">
                <TrendingUp
                  className={`w-4 h-4 mr-1 ${
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}
                />
                <span
                  className={`text-sm ${
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { etablissements, etablissementsEnAttente, fetchEtablissements, fetchEtablissementsEnAttente } = useEtablissementStore();

  useEffect(() => {
    // Charger les données selon le rôle
    if (user?.role === 'superadmin') {
      fetchEtablissements();
      fetchEtablissementsEnAttente();
    }
  }, [user, fetchEtablissements, fetchEtablissementsEnAttente]);

  // Calcul des statistiques
  const stats = {
    totalEtablissements: etablissements.length,
    etablissementsEnAttente: etablissementsEnAttente.length,
    etablissementsActifs: etablissements.filter(e => e.statut_validation === 'valide').length,
    moyenneNote: etablissements.length > 0 
      ? (etablissements.reduce((acc, e) => acc + e.note, 0) / etablissements.length).toFixed(1)
      : '0',
  };

  // Contenu selon le rôle
  const renderRoleSpecificContent = () => {
    switch (user?.role) {
      case 'superadmin':
        return (
          <div className="space-y-6">
            {/* Statistiques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Établissements"
                value={stats.totalEtablissements}
                icon={<Building2 className="w-6 h-6" />}
                color="primary"
              />
              <StatCard
                title="En Attente Validation"
                value={stats.etablissementsEnAttente}
                icon={<Clock className="w-6 h-6" />}
                color="warning"
              />
              <StatCard
                title="Établissements Actifs"
                value={stats.etablissementsActifs}
                icon={<CheckCircle className="w-6 h-6" />}
                color="success"
              />
              <StatCard
                title="Note Moyenne"
                value={`${stats.moyenneNote}/5`}
                icon={<TrendingUp className="w-6 h-6" />}
                color="primary"
              />
            </div>

            {/* Actions rapides et notifications */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-warning" />
                    Actions Requises
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {etablissementsEnAttente.length > 0 && (
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div>
                          <p className="font-medium text-yellow-800">
                            Nouvelles demandes d'inscription
                          </p>
                          <p className="text-sm text-yellow-600">
                            {etablissementsEnAttente.length} établissement(s) en attente
                          </p>
                        </div>
                        <Badge variant="warning">
                          {etablissementsEnAttente.length}
                        </Badge>
                      </div>
                    )}
                    
                    {etablissementsEnAttente.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                        <p>Aucune action requise pour le moment</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Établissements Récents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {etablissements.slice(0, 5).map((etablissement) => (
                      <div
                        key={etablissement.id}
                        className="flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors"
                      >
                        <div>
                          <p className="font-medium text-foreground">
                            {etablissement.nom}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {etablissement.ville}, {etablissement.region}
                          </p>
                        </div>
                        <Badge
                          variant={
                            etablissement.statut_validation === 'valide'
                              ? 'success'
                              : etablissement.statut_validation === 'en_attente'
                              ? 'warning'
                              : 'destructive'
                          }
                        >
                          {etablissement.statut_validation}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'secretaire':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Rendez-vous Aujourd'hui"
                value="12"
                icon={<Calendar className="w-6 h-6" />}
                color="primary"
              />
              <StatCard
                title="En Attente Confirmation"
                value="5"
                icon={<Clock className="w-6 h-6" />}
                color="warning"
              />
              <StatCard
                title="Médecins Actifs"
                value="8"
                icon={<Users className="w-6 h-6" />}
                color="success"
              />
            </div>
          </div>
        );

      case 'medecin':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Rendez-vous Aujourd'hui"
                value="6"
                icon={<Calendar className="w-6 h-6" />}
                color="primary"
              />
              <StatCard
                title="Patients Suivis"
                value="45"
                icon={<Users className="w-6 h-6" />}
                color="success"
              />
              <StatCard
                title="Résultats en Attente"
                value="3"
                icon={<FileText className="w-6 h-6" />}
                color="warning"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Tableau de bord
          </h1>
          <p className="text-muted-foreground mt-2">
            Bienvenue, {user?.prenom} {user?.nom} - {user?.role}
          </p>
        </div>

        {/* Contenu spécifique au rôle */}
        {renderRoleSpecificContent()}
      </motion.div>
    </DashboardLayout>
  );
};

export default DashboardPage;