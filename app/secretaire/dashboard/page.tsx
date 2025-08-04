'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Users,
  Calendar,
  Clock,
  UserPlus,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  FileText,
  User
} from 'lucide-react';

import { useAuthStore, useThemeStore } from '@/store';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Loading } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { etablissementService, UserQueries, RendezVousQueries } from '@/lib/firebase/firestore';
import { rendezVousService } from '@/lib/firebase/rendez-vous-service';
import { dossierPatientService } from '@/lib/firebase/dossier-patient';
import { EtablissementSante } from '@/types';

const SecretaireDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const router = useRouter();
  const [etablissement, setEtablissement] = useState<EtablissementSante | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    rendezVousAujourdhui: 0,
    enAttente: 0,
    medecinActifs: 0,
    patientsSuivis: 0,
  });

  // Récupérer les informations de l'établissement et les statistiques
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.etablissement_id) {
        setLoading(false);
        return;
      }

      try {
        // Récupérer les informations de l'établissement
        const etablissementData = await etablissementService.getById(user.etablissement_id);
        setEtablissement(etablissementData);

        // Récupérer les statistiques réelles
        const [medecins, tousLesRdv, tousPatients] = await Promise.all([
          UserQueries.getMedecinsByEtablissement(user.etablissement_id),
          rendezVousService.getRendezVousByEtablissement(user.etablissement_id),
          dossierPatientService.getAll()
        ]);

        // Calculer les statistiques
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const rendezVousAujourdhui = tousLesRdv.filter(rdv => {
          const rdvDate = rdv.date_rendez_vous.toDate();
          return rdvDate >= today && rdvDate < tomorrow;
        }).length;

        const enAttente = tousLesRdv.filter(rdv => rdv.statut === 'en_attente').length;

        // Compter les patients uniques
        const patientsUniques = new Set(tousLesRdv.map(rdv => rdv.patient_id));

        setStats({
          rendezVousAujourdhui,
          enAttente,
          medecinActifs: medecins.length,
          patientsSuivis: patientsUniques.size,
        });
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.etablissement_id]);

  const handleNettoyageRdv = async () => {
    if (!user?.etablissement_id) {
      alert('Etablissement non défini');
      return;
    }

    if (!confirm('Migrer et nettoyer tous les rendez-vous de cet établissement ?\n\nCela va :\n- Ajouter le champ etablissement_id manquant\n- Supprimer medecin_id des RDV en attente\n- Migrer creneau_horaire vers heure_debut/heure_fin\n- Conserver un historique des modifications')) {
      return;
    }

    try {
      const count = await rendezVousService.nettoyerEtMigrerRdv(user.etablissement_id);
      if (count > 0) {
        alert(`✅ Migration réussie !\n\n${count} rendez-vous ont été nettoyés et migrés :\n- Champ etablissement_id ajouté si manquant\n- medecin_id supprimé des RDV en attente\n- Horaires migrés vers nouveau format\n- Historique des modifications conservé`);
        // Recharger les données
        window.location.reload();
      } else {
        alert('ℹ️ Aucun rendez-vous à migrer ou nettoyer pour cet établissement');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur lors de la migration/nettoyage');
    }
  };

  const etablissementStatus = etablissement?.statut_validation || 'en_attente';


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
        .warning-box-light {
          background-color: #166534 !important;
          border-color: #166534 !important;
          color: white !important;
          border: 2px solid #166534 !important;
        }
        .warning-box-light * {
          color: white !important;
        }
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
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Tableau de Bord Secrétaire
            </h1>
            <p className="text-muted-foreground mt-2">
              Bienvenue, {user?.prenom} {user?.nom} - {etablissement?.nom || 'Gestion de votre établissement'}
            </p>
          </div>
          {/* Bouton temporaire de migration/nettoyage */}
          <Button
            variant="outline"
            onClick={handleNettoyageRdv}
            className="bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100"
          >
            🔄 Migrer RDV
          </Button>
        </div>

        {/* Statut de validation */}
        {etablissementStatus === 'en_attente' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card 
              className={`border-2 border-yellow-200 bg-yellow-50 dark:border-yellow-400 dark:bg-yellow-800/30 ${theme === 'light' ? 'info-box-light' : ''}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-300 flex-shrink-0 mt-1" style={theme === 'light' ? { color: 'white' } : {}} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-yellow-800 dark:text-yellow-100" style={theme === 'light' ? { color: 'white' } : {}}>
                      Établissement en attente de validation
                    </h3>
                    <p className="text-yellow-700 dark:text-yellow-200 mt-1" style={theme === 'light' ? { color: 'white' } : {}}>
                      Votre établissement a été soumis avec succès et est actuellement en cours de validation
                      par notre équipe. Vous recevrez une notification une fois la validation terminée.
                    </p>
                    <div className="flex items-center mt-4 space-x-4">
                      <Badge variant="warning" className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>En attente</span>
                      </Badge>
                      <p className="text-sm text-yellow-600 dark:text-yellow-300" style={theme === 'light' ? { color: 'white' } : {}}>
                        Délai estimé : 24-48h
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}


        {etablissementStatus === 'rejete' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-800 dark:text-red-200">
                      Validation refusée
                    </h3>
                    <p className="text-red-700 dark:text-red-300 mt-1">
                      Votre demande de validation a été refusée. Veuillez vérifier les informations
                      de votre établissement et contactez notre support si nécessaire.
                    </p>
                    <div className="flex items-center mt-4 space-x-4">
                      <Badge variant="destructive" className="flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Refusé</span>
                      </Badge>
                      <Button variant="outline" size="sm">
                        Contacter le support
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <Card hover className={etablissementStatus !== 'valide' ? 'opacity-60' : ''}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Rendez-vous aujourd'hui</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {etablissementStatus === 'valide' ? stats.rendezVousAujourdhui : '-'}
                  </p>
                  {etablissementStatus !== 'valide' && (
                    <p className="text-xs text-muted-foreground mt-1">Disponible après validation</p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${etablissementStatus === 'valide' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  <Calendar className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card hover className={etablissementStatus !== 'valide' ? 'opacity-60' : ''}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">En attente confirmation</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {etablissementStatus === 'valide' ? stats.enAttente : '-'}
                  </p>
                  {etablissementStatus !== 'valide' && (
                    <p className="text-xs text-muted-foreground mt-1">Disponible après validation</p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${etablissementStatus === 'valide' ? 'bg-yellow-100 text-yellow-600' : 'bg-muted text-muted-foreground'}`}>
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card hover>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Médecins actifs</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.medecinActifs}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {etablissementStatus === 'valide' ? 'Aucun médecin ajouté' : 'Ajout possible après validation'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-100 text-green-600">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card hover className={etablissementStatus !== 'valide' ? 'opacity-60' : ''}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Patients suivis</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {etablissementStatus === 'valide' ? stats.patientsSuivis : '-'}
                  </p>
                  {etablissementStatus !== 'valide' && (
                    <p className="text-xs text-muted-foreground mt-1">Disponible après validation</p>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${etablissementStatus === 'valide' ? 'bg-blue-100 text-blue-600' : 'bg-muted text-muted-foreground'}`}>
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5" />
                <span>Gestion des médecins</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Ajoutez et gérez les médecins de votre établissement.
              </p>
              <Button
                variant="primary"
                onClick={() => router.push('/secretaire/medecins')}
                className="w-full"
                disabled={etablissementStatus !== 'valide'}
              >
                {etablissementStatus === 'valide' ? 'Gérer les médecins' : 'Disponible après validation'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Rendez-vous</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Gérez tous les rendez-vous de votre établissement.
              </p>
              <Button
                variant="primary"
                onClick={() => router.push('/secretaire/rendez-vous')}
                className="w-full"
                disabled={etablissementStatus !== 'valide'}
              >
                {etablissementStatus === 'valide' ? 'Voir les rendez-vous' : 'Disponible après validation'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="w-5 h-5" />
                <span>Mon établissement</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Consultez et modifiez les informations de votre établissement.
              </p>
              <Button
                variant="outline"
                onClick={() => router.push('/secretaire/etablissement')}
                className="w-full"
              >
                Voir les détails
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Informations de l'établissement */}
        {etablissement && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="w-5 h-5" />
                <span>Informations de l'établissement</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nom</p>
                    <p className="text-foreground">{etablissement.nom}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Type</p>
                    <p className="text-foreground capitalize">{etablissement.type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Adresse</p>
                    <p className="text-foreground">{etablissement.adresse}, {etablissement.ville}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Région</p>
                    <p className="text-foreground">{etablissement.region}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Téléphone</p>
                    <p className="text-foreground">{etablissement.telephone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-foreground">{etablissement.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Services</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {etablissement.services?.map((service, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Urgences</p>
                    <Badge variant={etablissement.service_urgence ? "success" : "secondary"}>
                      {etablissement.service_urgence ? "Disponible" : "Non disponible"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Message d'information si pas de médecins */}
        {stats.medecinActifs === 0 && etablissementStatus === 'valide' && (
          <Card 
            className={`border-blue-200 bg-blue-50 dark:bg-blue-900/20 ${theme === 'light' ? 'info-box-light' : ''}`}
          >
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <UserPlus className="w-6 h-6 text-blue-600 dark:text-blue-600 flex-shrink-0 mt-1" style={theme === 'light' ? { color: 'white' } : {}} />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200" style={theme === 'light' ? { color: 'white' } : {}}>
                    Commencez par ajouter vos médecins
                  </h3>
                  <p className="text-blue-700 dark:text-blue-300 mt-1" style={theme === 'light' ? { color: 'white' } : {}}>
                    Pour commencer à utiliser la plateforme, ajoutez les médecins de votre établissement.
                    Ils recevront leurs identifiants par email et pourront commencer à gérer leurs consultations.
                  </p>
                  <Button
                    variant="primary"
                    className="mt-4"
                    onClick={() => router.push('/secretaire/medecins/add')}
                  >
                    Ajouter mon premier médecin
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Raccourcis utiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Mon profil</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Gérez vos informations personnelles et paramètres de sécurité.
              </p>
              <Button
                variant="outline"
                onClick={() => router.push('/secretaire/profil')}
                className="w-full"
              >
                Accéder au profil
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Aide et documentation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Consultez la documentation pour utiliser efficacement la plateforme.
              </p>
              <Button
                variant="outline"
                className="w-full"
                disabled
              >
                Bientôt disponible
              </Button>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default SecretaireDashboardPage;
