'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  MapPin,
  Clock,
} from 'lucide-react';

import { useAuthStore, useEtablissementStore } from '@/store';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';

// Composant de statistique pour superadmin
interface SuperAdminStatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'success' | 'warning' | 'destructive';
}

const SuperAdminStatCard: React.FC<SuperAdminStatCardProps> = ({
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
            <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
            {trend && (
              <div className="flex items-center mt-3">
                <TrendingUp
                  className={`w-4 h-4 mr-1 ${
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
                <span className="text-muted-foreground text-sm ml-1">ce mois</span>
              </div>
            )}
          </div>
          <div className={`p-4 rounded-xl ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SuperAdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { 
    etablissements, 
    etablissementsEnAttente, 
    fetchEtablissements, 
    fetchEtablissementsEnAttente 
  } = useEtablissementStore();

  useEffect(() => {
    fetchEtablissements();
    fetchEtablissementsEnAttente();
  }, [fetchEtablissements, fetchEtablissementsEnAttente]);

  // Calcul des statistiques avancées
  const stats = {
    totalEtablissements: etablissements.length,
    etablissementsEnAttente: etablissementsEnAttente.length,
    etablissementsActifs: etablissements.filter(e => e.statut_validation === 'valide').length,
    moyenneNote: etablissements.length > 0 
      ? (etablissements.reduce((acc, e) => acc + e.note, 0) / etablissements.length).toFixed(1)
      : '0',
    etablissementsParRegion: etablissements.reduce((acc, e) => {
      acc[e.region] = (acc[e.region] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    etablissementsParType: etablissements.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  // Top 3 des régions avec le plus d'établissements
  const topRegions = Object.entries(stats.etablissementsParRegion)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Tableau de Bord Superadministrateur
            </h1>
            <p className="text-muted-foreground mt-2">
              Bienvenue, {user?.prenom} {user?.nom} - Vue d'ensemble du système
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Badge variant="primary" size="lg" className="px-4 py-2">
              Système National
            </Badge>
          </div>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SuperAdminStatCard
            title="Total Établissements"
            value={stats.totalEtablissements}
            icon={<Building2 className="w-7 h-7" />}
            color="primary"
            trend={{ value: 12, isPositive: true }}
          />
          <SuperAdminStatCard
            title="En Attente Validation"
            value={stats.etablissementsEnAttente}
            icon={<Clock className="w-7 h-7" />}
            color="warning"
          />
          <SuperAdminStatCard
            title="Établissements Actifs"
            value={stats.etablissementsActifs}
            icon={<CheckCircle className="w-7 h-7" />}
            color="success"
            trend={{ value: 8, isPositive: true }}
          />
          <SuperAdminStatCard
            title="Note Moyenne Système"
            value={`${stats.moyenneNote}/5`}
            icon={<TrendingUp className="w-7 h-7" />}
            color="primary"
            trend={{ value: 3, isPositive: true }}
          />
        </div>

        {/* Actions et alertes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Actions prioritaires */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-warning" />
                Actions Prioritaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.etablissementsEnAttente > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200"
                  >
                    <div>
                      <p className="font-semibold text-yellow-800">
                        Nouvelles demandes d'inscription
                      </p>
                      <p className="text-sm text-yellow-600">
                        {stats.etablissementsEnAttente} établissement(s) en attente de validation
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="warning" size="lg">
                        {stats.etablissementsEnAttente}
                      </Badge>
                    </div>
                  </motion.div>
                )}

                {/* Alertes système */}
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <p className="font-semibold text-blue-800">
                      Rapport mensuel disponible
                    </p>
                    <p className="text-sm text-blue-600">
                      Consultez les statistiques détaillées du mois
                    </p>
                  </div>
                  <Badge variant="primary">Nouveau</Badge>
                </div>

                {stats.etablissementsEnAttente === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                    <p className="font-medium">Système à jour</p>
                    <p className="text-sm">Aucune action urgente requise</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Répartition par type */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition par Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats.etablissementsParType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-primary rounded-full" />
                      <span className="font-medium capitalize">{type}</span>
                    </div>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vue géographique et établissements récents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top régions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Top Régions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topRegions.map(([region, count], index) => (
                  <div
                    key={region}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
                        {index + 1}
                      </div>
                      <span className="font-medium">{region}</span>
                    </div>
                    <div className="text-right">
                      <Badge variant="primary">{count}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {((count / stats.totalEtablissements) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Établissements récents */}
          <Card>
            <CardHeader>
              <CardTitle>Derniers Établissements Validés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {etablissements.slice(0, 5).map((etablissement) => (
                  <div
                    key={etablissement.id}
                    className="flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm line-clamp-1">
                          {etablissement.nom}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {etablissement.ville}, {etablissement.region}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="success" size="sm">
                        Validé
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Note: {etablissement.note}/5
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default SuperAdminDashboard;