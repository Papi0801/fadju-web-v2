'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Mail,
  Phone,
  Stethoscope,
  Calendar,
  Clock,
  User,
  Edit,
  UserCheck,
  UserX,
  AlertCircle,
  CheckCircle,
  Activity,
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';

import { useAuthStore } from '@/store';
import { DashboardLayout } from '@/components/layout';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Button, 
  Badge,
  Loading,
} from '@/components/ui';
import { userService } from '@/lib/firebase/firestore';
import { rendezVousService } from '@/lib/firebase/rendez-vous-service';
import { User as UserType, RendezVous } from '@/types';

const MedecinDetailPage: React.FC = () => {
  const { user } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const medecinId = params.id as string;
  
  const [medecin, setMedecin] = useState<UserType | null>(null);
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchMedecinDetails();
  }, [medecinId]);

  const fetchMedecinDetails = async () => {
    try {
      // Récupérer les informations du médecin
      const medecinData = await userService.getById(medecinId);
      if (medecinData) {
        setMedecin(medecinData);
        
        // Récupérer les rendez-vous du médecin
        const rendezVousData = await rendezVousService.getRendezVousByMedecin(medecinId);
        setRendezVous(rendezVousData);
      } else {
        toast.error('Médecin non trouvé');
        router.push('/secretaire/medecins');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des détails:', error);
      toast.error('Erreur lors du chargement des informations');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!medecin) return;

    setActionLoading(true);
    try {
      await userService.update(medecin.id, { actif: !medecin.actif });
      setMedecin({ ...medecin, actif: !medecin.actif });
      toast.success(`Médecin ${medecin.actif ? 'désactivé' : 'activé'} avec succès`);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!medecin) return;
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le compte du Dr. ${medecin.prenom} ${medecin.nom} ?`)) {
      return;
    }

    setActionLoading(true);
    try {
      await userService.delete(medecin.id);
      toast.success('Médecin supprimé avec succès');
      router.push('/secretaire/medecins');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setActionLoading(false);
    }
  };

  const getRendezVousStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayRdv = rendezVous.filter(rdv => {
      if (!rdv.date_rendez_vous) return false;
      const rdvDate = rdv.date_rendez_vous.toDate();
      return rdvDate >= today && rdvDate < tomorrow;
    });

    const weekRdv = rendezVous.filter(rdv => {
      if (!rdv.date_rendez_vous) return false;
      const rdvDate = rdv.date_rendez_vous.toDate();
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return rdvDate >= today && rdvDate < weekFromNow;
    });

    return {
      total: rendezVous.length,
      today: todayRdv.length,
      thisWeek: weekRdv.length,
      terminated: rendezVous.filter(rdv => rdv.statut === 'terminee' || rdv.statut === 'termine').length,
    };
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loading text="Chargement des informations..." />
        </div>
      </DashboardLayout>
    );
  }

  if (!medecin) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Médecin non trouvé</h2>
          <Button onClick={() => router.push('/secretaire/medecins')}>
            Retour à la liste
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const stats = getRendezVousStats();

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/secretaire/medecins')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Retour</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Dr. {medecin.prenom} {medecin.nom}
              </h1>
              <p className="text-muted-foreground">
                {(medecin as any).specialite || 'Spécialité non renseignée'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={medecin.actif ? 'success' : 'secondary'}>
              {medecin.actif ? 'Actif' : 'Inactif'}
            </Badge>
            <Button
              variant="secondary"
              onClick={() => router.push(`/secretaire/medecins/${medecin.id}/edit`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          </div>
        </div>

        {/* Informations principales */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profil médecin */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Informations personnelles</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Stethoscope className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">
                    Dr. {medecin.prenom} {medecin.nom}
                  </h3>
                  <p className="text-muted-foreground">
                    {(medecin as any).specialite}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="text-foreground">{medecin.email}</p>
                    </div>
                  </div>
                  {medecin.telephone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Téléphone</p>
                        <p className="text-foreground">{medecin.telephone}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Stethoscope className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Spécialité</p>
                      <p className="text-foreground">{(medecin as any).specialite}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Membre depuis</p>
                      <p className="text-foreground">
                        {medecin.date_creation.toDate().toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => router.push(`/secretaire/medecins/${medecin.id}/edit`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier les informations
              </Button>
              
              <Button
                variant={medecin.actif ? "outline" : "default"}
                className="w-full justify-start"
                onClick={handleToggleStatus}
                disabled={actionLoading}
              >
                {medecin.actif ? (
                  <>
                    <UserX className="w-4 h-4 mr-2" />
                    Désactiver le compte
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 mr-2" />
                    Activer le compte
                  </>
                )}
              </Button>

              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={handleDelete}
                disabled={actionLoading}
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Supprimer le compte
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Statistiques des rendez-vous */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Activité et rendez-vous</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      Total rendez-vous
                    </p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {stats.total}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      Aujourd'hui
                    </p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {stats.today}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                      Cette semaine
                    </p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {stats.thisWeek}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-purple-500" />
                </div>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                      Terminés
                    </p>
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                      {stats.terminated}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Derniers rendez-vous terminés */}
        {(() => {
          const rendezVousTermines = rendezVous.filter(rdv => 
            rdv.statut === 'termine' || rdv.statut === 'terminee'
          ).sort((a, b) => 
            (b.date_rendez_vous?.toDate().getTime() || 0) - (a.date_rendez_vous?.toDate().getTime() || 0)
          );
          
          return (
            <Card>
              <CardHeader>
                <CardTitle>Historique des consultations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rendezVousTermines.length > 0 ? (
                    rendezVousTermines.slice(0, 5).map((rdv) => (
                      <div key={rdv.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <div>
                            <p className="font-medium">
                              {rdv.date_rendez_vous?.toDate().toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {rdv.heure_debut ? `${rdv.heure_debut} - ${rdv.heure_fin}` : (rdv as any).creneau_horaire || 'Heure non définie'} • {rdv.motif}
                            </p>
                          </div>
                        </div>
                        <Badge variant="default">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Terminé
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      Aucune consultation terminée pour le moment
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })()}
      </motion.div>
    </DashboardLayout>
  );
};

export default MedecinDetailPage;