'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Users,
  Activity,
  TrendingUp,
  UserCheck,
  CalendarDays,
  Stethoscope,
  FileText,
  Bell,
  ChevronRight,
  User
} from 'lucide-react';

import { useAuthStore, useThemeStore } from '@/store';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Loading } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { RendezVousQueries } from '@/lib/firebase/firestore';
import { RendezVous } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const MedecinDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [stats, setStats] = useState({
    consultationsAujourdhui: 0,
    patientsVus: 0,
    prochainRdv: null as RendezVous | null,
    patientsTotaux: 0,
  });

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    if (!user?.id || !user?.etablissement_id) {
      setLoading(false);
      return;
    }

    try {
      // Récupérer les rendez-vous du médecin
      const rdvList = await RendezVousQueries.getRendezVousByMedecin(user.id);
      setRendezVous(rdvList);

      // Calculer les statistiques
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const consultationsAujourdhui = rdvList.filter(rdv => {
        const rdvDate = rdv.date_rendez_vous.toDate();
        return rdvDate >= today && rdvDate < tomorrow && rdv.statut === 'confirme';
      }).length;

      const patientsVus = rdvList.filter(rdv => rdv.statut === 'termine').length;

      // Prochain RDV (le plus proche dans le futur)
      const futureRdv = rdvList
        .filter(rdv => rdv.date_rendez_vous.toDate() > new Date() && rdv.statut === 'confirme')
        .sort((a, b) => a.date_rendez_vous.toMillis() - b.date_rendez_vous.toMillis());
      
      const prochainRdv = futureRdv.length > 0 ? futureRdv[0] : null;

      // Patients uniques
      const patientsUniques = new Set(rdvList.map(rdv => rdv.patient_id)).size;

      setStats({
        consultationsAujourdhui,
        patientsVus,
        prochainRdv,
        patientsTotaux: patientsUniques,
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const getNextAppointments = () => {
    const today = new Date();
    return rendezVous
      .filter(rdv => rdv.date_rendez_vous.toDate() > today && rdv.statut === 'confirme')
      .sort((a, b) => a.date_rendez_vous.toMillis() - b.date_rendez_vous.toMillis())
      .slice(0, 3);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loading text="Chargement du tableau de bord..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <style jsx>{`
        .info-box-light {
          background-color: #166534 !important;
          border-color: #166534 !important;
          color: white !important;
          border: 2px solid #166534 !important;
        }
        .info-box-light * {
          color: white !important;
        }
      `}</style>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header avec salutation */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {getGreeting()}, Dr. {user?.prenom} {user?.nom}
            </h1>
            <p className="text-muted-foreground mt-2 flex items-center space-x-2">
              <Stethoscope className="w-4 h-4" />
              <span>{user?.specialite}</span>
              <span>•</span>
              <span>{format(new Date(), 'EEEE dd MMMM yyyy', { locale: fr })}</span>
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => router.push('/medecin/consultations')}
            className="flex items-center space-x-2"
          >
            <CalendarDays className="w-5 h-5" />
            <span>Mes consultations</span>
          </Button>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Consultations aujourd'hui</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.consultationsAujourdhui}</p>
                  <p className="text-xs text-muted-foreground mt-1">Rendez-vous confirmés</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Patients vus</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.patientsVus}</p>
                  <p className="text-xs text-muted-foreground mt-1">Consultations terminées</p>
                </div>
                <div className="p-3 rounded-lg bg-green-100 text-green-600">
                  <UserCheck className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total patients</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.patientsTotaux}</p>
                  <p className="text-xs text-muted-foreground mt-1">Patients uniques</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Activité</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {rendezVous.length > 0 ? 'Actif' : 'Inactif'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {rendezVous.length} RDV total
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${rendezVous.length > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                  <Activity className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Prochain rendez-vous */}
        {stats.prochainRdv && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Prochain rendez-vous</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{stats.prochainRdv.patient_nom}</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(stats.prochainRdv.date_rendez_vous.toDate(), 'EEEE dd MMMM yyyy à HH:mm', { locale: fr })}
                    </p>
                    {stats.prochainRdv.motif && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Motif: {stats.prochainRdv.motif}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => router.push('/medecin/consultations')}
                >
                  Voir détails
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions rapides et prochains RDV */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                onClick={() => router.push('/medecin/consultations')}
                className="w-full justify-between"
              >
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Voir mes consultations</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                onClick={() => router.push('/medecin/patients')}
                className="w-full justify-between"
              >
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Gérer mes patients</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                onClick={() => router.push('/medecin/profil')}
                className="w-full justify-between"
              >
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Mon profil</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Prochains rendez-vous */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Prochains rendez-vous</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/medecin/consultations')}
                >
                  Voir tout
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getNextAppointments().length > 0 ? (
                <div className="space-y-3">
                  {getNextAppointments().map((rdv) => (
                    <div
                      key={rdv.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{rdv.patient_nom}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(rdv.date_rendez_vous.toDate(), 'dd/MM à HH:mm')}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {rdv.creneau_horaire}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Aucun rendez-vous programmé</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Message d'information pour nouveau médecin */}
        {rendezVous.length === 0 && (
          <Card 
            className={`border-blue-200 bg-blue-50 dark:bg-blue-900/20 ${theme === 'light' ? 'info-box-light' : ''}`}
          >
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Stethoscope className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" style={theme === 'light' ? { color: 'white' } : {}} />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200" style={theme === 'light' ? { color: 'white' } : {}}>
                    Bienvenue sur votre espace médecin !
                  </h3>
                  <p className="text-blue-700 dark:text-blue-300 mt-1" style={theme === 'light' ? { color: 'white' } : {}}>
                    Votre compte a été créé avec succès. Les patients pourront bientôt prendre rendez-vous avec vous via l'application mobile.
                    En attendant, vous pouvez consulter et mettre à jour votre profil.
                  </p>
                  <Button
                    variant="primary"
                    className="mt-4"
                    onClick={() => router.push('/medecin/profil')}
                  >
                    Compléter mon profil
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default MedecinDashboardPage;