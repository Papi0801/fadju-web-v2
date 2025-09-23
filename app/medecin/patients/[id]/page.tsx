'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Heart,
  Activity,
  Weight,
  Ruler,
  Droplets,
  Pill,
  AlertTriangle,
  FileText,
  Clock,
  Stethoscope
} from 'lucide-react';

import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Loading } from '@/components/ui';
import Modal from '@/components/ui/modal';
import { dossierPatientService } from '@/lib/firebase/dossier-patient';
import { DossierPatient, ResultatMedical } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

const PatientDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [dossier, setDossier] = useState<DossierPatient | null>(null);
  const [resultats, setResultats] = useState<ResultatMedical[]>([]);
  const [selectedResultat, setSelectedResultat] = useState<ResultatMedical | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);

      // Récupérer le dossier patient
      const dossierData = await dossierPatientService.getByPatientId(patientId);
      if (!dossierData) {
        toast.error('Dossier patient non trouvé');
        router.push('/medecin/dashboard');
        return;
      }
      setDossier(dossierData);

      // Récupérer les résultats médicaux depuis le service approprié
      const { resultatsMedicauxService } = await import('@/lib/firebase/resultats-medicaux-service');
      const resultatsData = await resultatsMedicauxService.getResultatsByPatient(patientId);
      setResultats(resultatsData);

    } catch (error) {
      console.error('Erreur lors de la récupération du dossier patient:', error);
      toast.error('Erreur lors du chargement du dossier patient');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loading text="Chargement du dossier patient..." />
        </div>
      </DashboardLayout>
    );
  }

  if (!dossier) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Dossier patient non trouvé</p>
          <Button onClick={() => router.push('/medecin/dashboard')} className="mt-4">
            Retour au dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const age = dossier.date_naissance ? dossierPatientService.calculateAge(dossier.date_naissance.toDate()) : 0;
  const imc = dossierPatientService.calculateIMC(dossier.poids, dossier.taille);
  const interpretationIMC = dossierPatientService.interpretIMC(imc);

  const handleViewResultat = (resultat: ResultatMedical) => {
    setSelectedResultat(resultat);
    setIsModalOpen(true);
  };

  return (
    <DashboardLayout>
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/medecin/dashboard')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Dossier patient
            </h1>
            <p className="text-muted-foreground">
              Informations médicales complètes
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations personnelles */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Informations personnelles</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nom complet</label>
                    <p className="text-lg font-semibold">{dossier.prenom} {dossier.nom}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Âge</label>
                    <p className="text-lg font-semibold">{age} ans</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Genre</label>
                    <p className="text-lg font-semibold">{dossier.genre}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date de naissance</label>
                    <p className="text-lg font-semibold">
                      {dossier.date_naissance ? format(dossier.date_naissance.toDate(), 'dd MMMM yyyy', { locale: fr }) : 'Non renseigné'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                      <Mail className="w-4 h-4" />
                      <span>Email</span>
                    </label>
                    <p className="text-lg font-semibold">{dossier.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                      <Phone className="w-4 h-4" />
                      <span>Téléphone</span>
                    </label>
                    <p className="text-lg font-semibold">{dossier.telephone}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>Adresse</span>
                  </label>
                  <p className="text-lg font-semibold">{dossier.adresse}</p>
                </div>
              </CardContent>
            </Card>

            {/* Informations médicales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Stethoscope className="w-5 h-5" />
                  <span>Informations médicales</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                      <Droplets className="w-4 h-4" />
                      <span>Groupe sanguin</span>
                    </label>
                    <Badge variant="secondary" className="text-lg font-semibold border border-border">
                      {dossier.groupe_sanguin}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                      <Weight className="w-4 h-4" />
                      <span>Poids</span>
                    </label>
                    <p className="text-lg font-semibold">{dossier.poids} kg</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                      <Ruler className="w-4 h-4" />
                      <span>Taille</span>
                    </label>
                    <p className="text-lg font-semibold">{dossier.taille} cm</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                      <Activity className="w-4 h-4" />
                      <span>IMC</span>
                    </label>
                    <div className="space-y-1">
                      <p className="text-lg font-semibold">{imc}</p>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          imc < 18.5 ? 'bg-blue-100 text-blue-800' :
                          imc < 25 ? 'bg-green-100 text-green-800' :
                          imc < 30 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}
                      >
                        {interpretationIMC}
                      </Badge>
                    </div>
                  </div>
                </div>

                {dossier.allergie && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <span>Allergies</span>
                    </label>
                    <p className="text-lg font-semibold text-red-600">{dossier.allergie}</p>
                  </div>
                )}

                {dossier.maladies_chroniques && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                      <Heart className="w-4 h-4 text-orange-500" />
                      <span>Maladies chroniques</span>
                    </label>
                    <p className="text-lg font-semibold text-orange-600">{dossier.maladies_chroniques}</p>
                  </div>
                )}

                {dossier.traitement_regulier && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                      <Pill className="w-4 h-4 text-blue-500" />
                      <span>Traitement régulier</span>
                    </label>
                    <p className="text-lg font-semibold text-blue-600">{dossier.traitement_regulier}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Résultats médicaux */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Historique médical</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {resultats.length > 0 ? (
                  <div className="space-y-3">
                    {resultats.slice(0, 5).map((resultat) => (
                      <div
                        key={resultat.id}
                        className="p-3 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => handleViewResultat(resultat)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{resultat.titre}</h4>
                            <p className="text-xs text-muted-foreground">
                              {resultat.type === 'consultation' ? 'Consultation' : 
                               resultat.type === 'analyse' ? `Analyse - ${resultat.donnees?.nom_analyse || 'Analyse médicale'}` : 
                               resultat.type} • {resultat.nom_medecin}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center space-x-1 mt-1">
                              <Clock className="w-3 h-3" />
                              <span>
                                {resultat.date_resultat && format(resultat.date_resultat.toDate(), 'dd/MM/yyyy', { locale: fr })}
                              </span>
                            </p>
                            {/* Aperçu du contenu */}
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {resultat.donnees?.diagnostic || 
                               (resultat.donnees?.observations && resultat.donnees.observations.substring(0, 100) + '...') ||
                               (resultat.donnees?.resultats && resultat.donnees.resultats.substring(0, 100) + '...') ||
                               resultat.description || 'Résultat médical'}
                            </p>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${
                                resultat.statut === 'disponible' ? 'bg-green-100 text-green-800' :
                                resultat.statut === 'en_cours' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {resultat.statut}
                            </Badge>
                            <span className="text-xs text-blue-600 hover:underline">
                              Voir détails →
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {resultats.length > 5 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          // TODO: Naviguer vers la page complète des résultats
                          toast('Fonctionnalité en cours de développement', { icon: 'ℹ️' });
                        }}
                      >
                        Voir tous les résultats ({resultats.length})
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground text-sm">
                      Aucun résultat médical
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Métadonnées du dossier */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Informations du dossier</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Créé le</label>
                  <p className="text-sm">
                    {dossier.date_creation ? format(dossier.date_creation.toDate(), 'dd MMMM yyyy à HH:mm', { locale: fr }) : 'Non disponible'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Dernière modification</label>
                  <p className="text-sm">
                    {dossier.date_modification ? format(dossier.date_modification.toDate(), 'dd MMMM yyyy à HH:mm', { locale: fr }) : 'Non disponible'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID Patient</label>
                  <p className="text-xs font-mono bg-muted px-2 py-1 rounded">
                    {dossier.patient_id}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>

      {/* Modal pour les détails du résultat médical */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedResultat ? `Détails - ${selectedResultat.titre}` : ''}
        size="xl"
      >
        {selectedResultat && (
          <div className="space-y-6">
            {/* Informations générales */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Type d'examen</label>
                <p className="text-lg font-semibold capitalize">{selectedResultat.type}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Statut</label>
                <Badge 
                  variant="secondary" 
                  className={`text-sm ${
                    selectedResultat.statut === 'disponible' ? 'bg-green-100 text-green-800' :
                    selectedResultat.statut === 'en_cours' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}
                >
                  {selectedResultat.statut}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Médecin prescripteur</label>
                <p className="text-lg font-semibold">{selectedResultat.nom_medecin}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Date de création</label>
                <p className="text-lg font-semibold">
                  {selectedResultat.date_creation ? format(selectedResultat.date_creation.toDate(), 'dd MMMM yyyy à HH:mm', { locale: fr }) : 'Non disponible'}
                </p>
              </div>
              {selectedResultat.date_resultat && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Date de résultat</label>
                  <p className="text-lg font-semibold">
                    {selectedResultat.date_resultat ? format(selectedResultat.date_resultat.toDate(), 'dd MMMM yyyy à HH:mm', { locale: fr }) : 'Non disponible'}
                  </p>
                </div>
              )}
            </div>

            {/* Observations du médecin */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Observations du médecin</label>
              <div className="mt-2 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">
                  {selectedResultat.donnees?.observations || selectedResultat.description || 'Aucune observation spécifique pour cette consultation.'}
                </p>
              </div>
            </div>

            {/* Ordonnance prescrite */}
            {(selectedResultat.donnees?.ordonnance || selectedResultat.notes) && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Ordonnance prescrite</label>
                <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
                  <div className="flex items-start space-x-2">
                    <Pill className="w-5 h-5 text-blue-600 mt-0.5" />
                    <p className="text-sm whitespace-pre-wrap text-blue-800 dark:text-blue-200">
                      {selectedResultat.donnees?.ordonnance || selectedResultat.notes}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Analyses demandées */}
            {selectedResultat.donnees?.analyses && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Analyses demandées</label>
                <div className="mt-2 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200">
                  <div className="flex items-start space-x-2">
                    <FileText className="w-5 h-5 text-amber-600 mt-0.5" />
                    <p className="text-sm whitespace-pre-wrap text-amber-800 dark:text-amber-200">
                      {selectedResultat.donnees.analyses}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Diagnostic (si disponible) */}
            {selectedResultat.donnees?.diagnostic && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Diagnostic</label>
                <div className="mt-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200">
                  <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                    {selectedResultat.donnees.diagnostic}
                  </p>
                </div>
              </div>
            )}

            {/* Recommandations */}
            {selectedResultat.donnees?.recommandations && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Recommandations</label>
                <div className="mt-2 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    {selectedResultat.donnees.recommandations}
                  </p>
                </div>
              </div>
            )}

            {/* Données spécifiques d'analyse */}
            {selectedResultat.type === 'analyse' && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Résultats de l'analyse</label>
                <div className="mt-2 space-y-3">
                  {selectedResultat.donnees?.type_analyse && (
                    <div className="p-3 bg-muted/20 rounded-lg">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Type d'analyse
                      </label>
                      <p className="text-sm font-semibold mt-1">{selectedResultat.donnees.type_analyse}</p>
                    </div>
                  )}
                  {selectedResultat.donnees?.nom_analyse && (
                    <div className="p-3 bg-muted/20 rounded-lg">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Nom de l'analyse
                      </label>
                      <p className="text-sm font-semibold mt-1">{selectedResultat.donnees.nom_analyse}</p>
                    </div>
                  )}
                  {selectedResultat.donnees?.resultats && (
                    <div className="p-3 bg-muted/20 rounded-lg">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Résultats
                      </label>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{selectedResultat.donnees.resultats}</p>
                    </div>
                  )}
                  {selectedResultat.donnees?.interpretation && (
                    <div className="p-3 bg-muted/20 rounded-lg">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Interprétation
                      </label>
                      <p className="text-sm mt-1">{selectedResultat.donnees.interpretation}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Fichiers joints */}
            {selectedResultat.fichiers_joints && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Fichiers joints</label>
                <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Fichier ID: {selectedResultat.fichiers_joints.id}
                    </p>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                    Les fichiers joints seront bientôt disponibles pour téléchargement
                  </p>
                </div>
              </div>
            )}

            {/* Métadonnées */}
            <div className="pt-4 border-t">
              <h4 className="font-medium text-muted-foreground mb-3">Informations techniques</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Créé le</label>
                  <p>{selectedResultat.date_creation ? format(selectedResultat.date_creation.toDate(), 'dd/MM/yyyy à HH:mm', { locale: fr }) : 'Non disponible'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">ID Résultat</label>
                  <p className="font-mono text-xs bg-muted px-2 py-1 rounded">{selectedResultat.id}</p>
                </div>
                {selectedResultat.rendez_vous_id && (
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">ID Rendez-vous associé</label>
                    <p className="font-mono text-xs bg-muted px-2 py-1 rounded">{selectedResultat.rendez_vous_id}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default PatientDetailPage;