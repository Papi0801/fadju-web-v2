'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Calendar,
  User,
  Search,
  Filter,
  Eye,
  Download,
  Stethoscope,
  TestTube,
  Pill,
  Activity,
  Clock,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { useAuthStore } from '@/store';
import { DashboardLayout } from '@/components/layout';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Button, 
  Input,
  Badge,
  Loading,
  Modal,
} from '@/components/ui';
import { resultatsMedicauxService, ResultatMedical } from '@/lib/firebase/resultats-medicaux-service';
import { dossierPatientService } from '@/lib/firebase/dossier-patient';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const HistoriqueMedicalPage: React.FC = () => {
  const { user } = useAuthStore();
  const router = useRouter();
  const [resultats, setResultats] = useState<ResultatMedical[]>([]);
  const [filteredResultats, setFilteredResultats] = useState<ResultatMedical[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedResultat, setSelectedResultat] = useState<ResultatMedical | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [patientNames, setPatientNames] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    fetchResultats();
  }, [user?.id]);

  useEffect(() => {
    filterResultats();
  }, [resultats, searchTerm, selectedType]);

  const fetchResultats = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const resultatsData = await resultatsMedicauxService.getResultatsByMedecin(user.id);
      setResultats(resultatsData);

      // Récupérer les noms des patients
      const patientIds = [...new Set(resultatsData.map(r => r.patient_id))];
      const namesMap = new Map<string, string>();
      
      for (const patientId of patientIds) {
        try {
          const patient = await dossierPatientService.getByPatientId(patientId);
          if (patient) {
            namesMap.set(patientId, `${patient.prenom} ${patient.nom}`);
          }
        } catch (error) {
          console.warn(`Patient ${patientId} non trouvé:`, error);
          namesMap.set(patientId, 'Patient inconnu');
        }
      }
      
      setPatientNames(namesMap);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      toast.error('Erreur lors du chargement de l\'historique médical');
    } finally {
      setLoading(false);
    }
  };

  const filterResultats = () => {
    let filtered = resultats;

    if (searchTerm) {
      filtered = filtered.filter(resultat =>
        resultat.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resultat.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patientNames.get(resultat.patient_id)?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedType) {
      filtered = filtered.filter(resultat => resultat.type === selectedType);
    }

    setFilteredResultats(filtered);
  };

  const getPatientName = (patientId: string): string => {
    return patientNames.get(patientId) || 'Patient inconnu';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'consultation':
        return <Stethoscope className="w-5 h-5 text-blue-600" />;
      case 'analyse':
        return <TestTube className="w-5 h-5 text-green-600" />;
      case 'ordonnance':
        return <Pill className="w-5 h-5 text-purple-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'consultation':
        return 'default';
      case 'analyse':
        return 'success';
      case 'ordonnance':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const handleViewDetails = (resultat: ResultatMedical) => {
    setSelectedResultat(resultat);
    setShowDetailModal(true);
  };

  const stats = {
    total: resultats.length,
    consultations: resultats.filter(r => r.type === 'consultation').length,
    analyses: resultats.filter(r => r.type === 'analyse').length,
    ce_mois: resultats.filter(r => {
      if (!r.date_consultation) return false;
      const resultDate = r.date_consultation.toDate();
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return resultDate >= startOfMonth;
    }).length,
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loading text="Chargement de l'historique médical..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Historique Médical
            </h1>
            <p className="text-muted-foreground mt-2">
              Consultez tous les résultats médicaux que vous avez créés
            </p>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                  <FileText className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Consultations</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.consultations}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-100 text-green-600">
                  <Stethoscope className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Analyses</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.analyses}</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                  <TestTube className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Ce mois</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.ce_mois}</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-100 text-orange-600">
                  <Activity className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Rechercher par patient, titre ou description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="w-5 h-5 text-muted-foreground" />}
                />
              </div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="flex h-10 rounded-md border border-border bg-input px-3 py-2 text-sm"
              >
                <option value="">Tous les types</option>
                <option value="consultation">Consultations</option>
                <option value="analyse">Analyses</option>
                <option value="ordonnance">Ordonnances</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Liste des résultats */}
        {filteredResultats.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun résultat médical</h3>
              <p className="text-muted-foreground mb-4">
                {resultats.length === 0 
                  ? 'Vous n\'avez pas encore créé de résultats médicaux.'
                  : 'Aucun résultat ne correspond à vos critères de recherche.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredResultats.map((resultat) => (
              <motion.div
                key={resultat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="p-2 rounded-lg bg-muted">
                          {getTypeIcon(resultat.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-lg">{resultat.titre}</h3>
                            <Badge variant={getTypeBadgeVariant(resultat.type)}>
                              {(resultat.type as any) === 'consultation' ? 'Consultation' :
                               (resultat.type as any) === 'analyse' ? 'Analyse' :
                               (resultat.type as any) === 'ordonnance' ? 'Ordonnance' : resultat.type}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-1">
                                <User className="w-4 h-4" />
                                <span>{getPatientName(resultat.patient_id)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {resultat.date_consultation ? format(resultat.date_consultation.toDate(), 'dd MMMM yyyy', { locale: fr }) : 'Date non disponible'}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>
                                  {resultat.date_consultation ? format(resultat.date_consultation.toDate(), 'HH:mm') : 'Heure non disponible'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {resultat.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(resultat)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Voir
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Modal de détails */}
        <Modal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedResultat(null);
          }}
          title="Détails du résultat médical"
          size="lg"
        >
          {selectedResultat && (
            <div className="space-y-6">
              {/* En-tête */}
              <div className="border-b pb-4">
                <div className="flex items-center space-x-3 mb-2">
                  {getTypeIcon(selectedResultat.type)}
                  <h3 className="text-xl font-semibold">{selectedResultat.titre}</h3>
                  <Badge variant={getTypeBadgeVariant(selectedResultat.type)}>
                    {selectedResultat.type}
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>Patient: {getPatientName(selectedResultat.patient_id)}</span>
                  <span>
                    Date: {selectedResultat.date_consultation ? format(selectedResultat.date_consultation.toDate(), 'dd MMMM yyyy à HH:mm', { locale: fr }) : 'Date non disponible'}
                  </span>
                </div>
              </div>

              {/* Contenu selon le type */}
              {selectedResultat.type === 'consultation' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Observations</h4>
                    <p className="text-sm bg-muted/30 p-3 rounded-lg">
                      {(selectedResultat as any).observations || selectedResultat.description}
                    </p>
                  </div>
                  
                  {(selectedResultat as any).traitement_prescrit && (
                    <div>
                      <h4 className="font-medium mb-2">Traitement prescrit</h4>
                      <p className="text-sm bg-muted/30 p-3 rounded-lg">
                        {(selectedResultat as any).traitement_prescrit}
                      </p>
                    </div>
                  )}
                  
                  {(selectedResultat as any).analyses_demandees && (
                    <div>
                      <h4 className="font-medium mb-2">Analyses demandées</h4>
                      <p className="text-sm bg-muted/30 p-3 rounded-lg">
                        {(selectedResultat as any).analyses_demandees}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {selectedResultat.type === 'analyse' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Type d'analyse</h4>
                      <p className="text-sm bg-muted/30 p-3 rounded-lg">
                        {(selectedResultat as any).type_analyse}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Nom de l'analyse</h4>
                      <p className="text-sm bg-muted/30 p-3 rounded-lg">
                        {(selectedResultat as any).nom_analyse}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Résultats</h4>
                    <p className="text-sm bg-muted/30 p-3 rounded-lg">
                      {(selectedResultat as any).resultats_analyse || (selectedResultat as any).observations}
                    </p>
                  </div>
                  
                  {(selectedResultat as any).interpretation && (
                    <div>
                      <h4 className="font-medium mb-2">Interprétation</h4>
                      <p className="text-sm bg-muted/30 p-3 rounded-lg">
                        {(selectedResultat as any).interpretation}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {(selectedResultat as any).recommandations && (
                <div>
                  <h4 className="font-medium mb-2">Recommandations</h4>
                  <p className="text-sm bg-muted/30 p-3 rounded-lg">
                    {(selectedResultat as any).recommandations}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDetailModal(false);
                setSelectedResultat(null);
              }}
            >
              Fermer
            </Button>
          </div>
        </Modal>
      </motion.div>
    </DashboardLayout>
  );
};

export default HistoriqueMedicalPage;