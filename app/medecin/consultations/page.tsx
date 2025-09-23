'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  User,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarDays,
  MapPin,
  Phone,
  FileText,
  Eye,
  Edit,
  Plus,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { useAuthStore, useThemeStore } from '@/store';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Modal,
  Textarea,
} from '@/components/ui';
import { rendezVousService } from '@/lib/firebase/rendez-vous-service';
import { dossierPatientService } from '@/lib/firebase/dossier-patient';
import { resultatsMedicauxService } from '@/lib/firebase/resultats-medicaux-service';
import { RendezVous, DossierPatient } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ConsultationsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const router = useRouter();
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [filteredRendezVous, setFilteredRendezVous] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Map<string, DossierPatient>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [selectedRdv, setSelectedRdv] = useState<RendezVous | null>(null);
  const [consultationData, setConsultationData] = useState({
    observations: '',
    ordonnance: '',
    analyses: '',
    typeAnalyse: '',
    nomAnalyse: '',
    resultatsAnalyse: ''
  });

  useEffect(() => {
    fetchRendezVous();
  }, [user?.id]);

  useEffect(() => {
    filterRendezVous();
  }, [rendezVous, searchTerm, selectedStatut, selectedDate]);

  const fetchRendezVous = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const rdvList = await rendezVousService.getRendezVousByMedecin(user.id);
      setRendezVous(rdvList);

      // Récupérer les informations des patients
      const patientIds = [...new Set(rdvList.map(rdv => rdv.patient_id))];
      const patientsMap = new Map<string, DossierPatient>();
      
      for (const patientId of patientIds) {
        try {
          const dossier = await dossierPatientService.getByPatientId(patientId);
          if (dossier) {
            patientsMap.set(patientId, dossier);
          }
        } catch (error) {
          console.warn(`Impossible de récupérer le dossier du patient ${patientId}:`, error);
        }
      }
      
      setPatients(patientsMap);
    } catch (error) {
      console.error('Erreur lors de la récupération des rendez-vous:', error);
      toast.error('Erreur lors du chargement des consultations');
    } finally {
      setLoading(false);
    }
  };

  const getPatientName = (patientId: string): string => {
    const patient = patients.get(patientId);
    return patient ? `${patient.prenom} ${patient.nom}` : 'Patient inconnu';
  };

  const getPatientInfo = (patientId: string) => {
    return patients.get(patientId);
  };

  const filterRendezVous = () => {
    let filtered = rendezVous;

    if (searchTerm) {
      filtered = filtered.filter(rdv =>
        getPatientName(rdv.patient_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        rdv.motif?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatut) {
      filtered = filtered.filter(rdv => rdv.statut === selectedStatut);
    }

    if (selectedDate) {
      const selectedDateObj = new Date(selectedDate);
      filtered = filtered.filter(rdv => {
        const rdvDate = rdv.date_rendez_vous.toDate();
        return (
          rdvDate.getFullYear() === selectedDateObj.getFullYear() &&
          rdvDate.getMonth() === selectedDateObj.getMonth() &&
          rdvDate.getDate() === selectedDateObj.getDate()
        );
      });
    }

    setFilteredRendezVous(filtered);
  };

  const handleStatusChange = async (rdvId: string, newStatus: 'terminee' | 'annulee') => {
    try {
      if (newStatus === 'terminee') {
        // Vérifier si le rendez-vous est passé
        const rdv = rendezVous.find(r => r.id === rdvId);
        if (!rdv) return;
        
        const rdvDate = rdv.date_rendez_vous.toDate();
        const now = new Date();
        
        if (rdvDate > now) {
          toast.error('Impossible de marquer comme terminé un rendez-vous futur');
          return;
        }
        
        // Ouvrir le modal pour saisir les informations
        setSelectedRdv(rdv);
        setShowFinishModal(true);
      } else {
        // Annuler directement
        await rendezVousService.updateStatut(rdvId, 'annulee');
        toast.success('Consultation annulée');
        fetchRendezVous();
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const handleFinishConsultation = async () => {
    if (!selectedRdv || !user) return;
    
    try {
      // Mettre à jour le statut du rendez-vous
      await rendezVousService.updateStatut(selectedRdv.id, 'terminee');
      
      // Créer l'enregistrement dans les résultats médicaux
      const dateConsultation = selectedRdv.date_rendez_vous.toDate();
      
      if (consultationData.typeAnalyse && consultationData.resultatsAnalyse) {
        // Si c'est une analyse, créer un résultat d'analyse
        await resultatsMedicauxService.creerResultatAnalyse({
          patient_id: selectedRdv.patient_id,
          medecin_id: user.id,
          nom_medecin: `Dr. ${user.prenom} ${user.nom}`,
          rendez_vous_id: selectedRdv.id,
          date_consultation: dateConsultation,
          type_analyse: consultationData.typeAnalyse,
          nom_analyse: consultationData.nomAnalyse,
          resultats_analyse: consultationData.resultatsAnalyse,
          interpretation: consultationData.observations,
        });
      } else {
        // Sinon, créer un résultat de consultation
        await resultatsMedicauxService.creerResultatConsultation({
          patient_id: selectedRdv.patient_id,
          medecin_id: user.id,
          nom_medecin: `Dr. ${user.prenom} ${user.nom}`,
          rendez_vous_id: selectedRdv.id,
          date_consultation: dateConsultation,
          observations: consultationData.observations,
          ordonnance: consultationData.ordonnance || undefined,
          analyses_demandees: consultationData.analyses || undefined,
        });
      }
      
      // Mettre à jour le dossier patient avec les nouvelles informations
      const patient = patients.get(selectedRdv.patient_id);
      if (patient) {
        const updateData: any = {
          derniere_consultation: new Date(),
          derniere_observation: consultationData.observations,
        };
        
        // Ajouter l'ordonnance si renseignée
        if (consultationData.ordonnance) {
          updateData.dernieres_ordonnances = consultationData.ordonnance;
        }
        
        // Ajouter les analyses si c'est une analyse
        if (consultationData.typeAnalyse && consultationData.resultatsAnalyse) {
          updateData.derniers_resultats = {
            type: consultationData.typeAnalyse,
            nom: consultationData.nomAnalyse,
            resultats: consultationData.resultatsAnalyse,
            date: new Date(),
            medecin_id: user.id
          };
        }
        
        await dossierPatientService.update(patient.id, updateData);
      }
      
      toast.success('Consultation terminée et enregistrée dans l\'historique');
      setShowFinishModal(false);
      setSelectedRdv(null);
      setConsultationData({
        observations: '',
        ordonnance: '',
        analyses: '',
        typeAnalyse: '',
        nomAnalyse: '',
        resultatsAnalyse: ''
      });
      fetchRendezVous();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la finalisation de la consultation');
    }
  };

  const getStatutBadgeVariant = (statut: string) => {
    switch (statut) {
      case 'confirmee':
        return 'primary';
      case 'terminee':
        return 'success';
      case 'annulee':
        return 'destructive';
      case 'reportee':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'confirmee':
        return 'Confirmé';
      case 'terminee':
        return 'Terminé';
      case 'annulee':
        return 'Annulé';
      case 'reportee':
        return 'Reporté';
      default:
        return 'Inconnu';
    }
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'confirmee':
        return <CheckCircle className="w-4 h-4" />;
      case 'terminee':
        return <CheckCircle className="w-4 h-4" />;
      case 'annulee':
        return <XCircle className="w-4 h-4" />;
      case 'reportee':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const groupByDate = (rdvList: RendezVous[]) => {
    const grouped = rdvList.reduce((groups, rdv) => {
      const date = format(rdv.date_rendez_vous.toDate(), 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(rdv);
      return groups;
    }, {} as Record<string, RendezVous[]>);

    // Trier par date
    const sortedDates = Object.keys(grouped).sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime()
    );

    return sortedDates.map(date => ({
      date,
      rdvs: grouped[date].sort((a, b) => 
        a.date_rendez_vous.toDate().getTime() - b.date_rendez_vous.toDate().getTime()
      )
    }));
  };

  const stats = {
    total: rendezVous.length,
    confirmes: rendezVous.filter(rdv => rdv.statut === 'confirmee').length,
    termines: rendezVous.filter(rdv => rdv.statut === 'terminee').length,
    reportes: rendezVous.filter(rdv => rdv.statut === 'reportee').length,
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loading text="Chargement des consultations..." />
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
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mes Consultations</h1>
            <p className="text-muted-foreground mt-2">
              Consultez et gérez vos rendez-vous attribués
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => router.push('/medecin/consultations/add')}
            className="flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Ajouter une consultation</span>
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
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
                  <p className="text-muted-foreground text-sm font-medium">Confirmés</p>
                  <p className="text-2xl font-bold text-foreground">{stats.confirmes}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-100 text-green-600">
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Terminés</p>
                  <p className="text-2xl font-bold text-foreground">{stats.termines}</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Reportés</p>
                  <p className="text-2xl font-bold text-foreground">{stats.reportes}</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-100 text-orange-600">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Rechercher par patient ou motif..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="w-5 h-5 text-muted-foreground" />}
                />
              </div>
              <select
                value={selectedStatut}
                onChange={(e) => setSelectedStatut(e.target.value)}
                className="flex h-10 rounded-md border border-border bg-input px-3 py-2 text-sm"
              >
                <option value="">Tous les statuts</option>
                <option value="confirmee">Confirmé</option>
                <option value="termine">Terminé</option>
                <option value="terminee">Terminé (nouveau)</option>
                <option value="reportee">Reporté</option>
                <option value="annule">Annulé</option>
                <option value="annulee">Annulé (nouveau)</option>
              </select>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Liste des consultations groupées par date */}
        {filteredRendezVous.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune consultation</h3>
              <p className="text-muted-foreground mb-4">
                {rendezVous.length === 0 
                  ? 'Aucune consultation enregistrée pour le moment.'
                  : 'Aucune consultation ne correspond à vos critères de recherche.'
                }
              </p>
              {rendezVous.length === 0 && (
                <Button
                  variant="primary"
                  onClick={() => router.push('/medecin/consultations/add')}
                >
                  Ajouter une consultation
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {groupByDate(filteredRendezVous).map((group) => (
              <motion.div
                key={group.date}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    {format(new Date(group.date), 'EEEE dd MMMM yyyy', { locale: fr })}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {group.rdvs.length} consultation{group.rdvs.length > 1 ? 's' : ''}
                  </p>
                </div>
                
                <div className="space-y-3">
                  {group.rdvs.map((rdv) => (
                    <Card key={rdv.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                  <User className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-lg">{getPatientName(rdv.patient_id)}</h4>
                                  <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                                    <div className="flex items-center space-x-1">
                                      <Clock className="w-4 h-4" />
                                      <span>{rdv.heure_debut} - {rdv.heure_fin}</span>
                                    </div>
                                    {getPatientInfo(rdv.patient_id)?.telephone && (
                                      <div className="flex items-center space-x-1">
                                        <Phone className="w-4 h-4" />
                                        <span>{getPatientInfo(rdv.patient_id)?.telephone}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Badge variant={getStatutBadgeVariant(rdv.statut)} className="flex items-center space-x-1">
                                {getStatutIcon(rdv.statut)}
                                <span>{getStatutLabel(rdv.statut)}</span>
                              </Badge>
                            </div>
                            
                            {rdv.motif && (
                              <p className="text-sm text-muted-foreground mb-3 ml-15">
                                <span className="font-medium">Motif :</span> {rdv.motif}
                              </p>
                            )}

                            <div className="flex items-center justify-between ml-15">
                              <div className="flex items-center space-x-2">
                                {rdv.statut === 'confirmee' && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleStatusChange(rdv.id, 'terminee')}
                                      className="text-green-600 hover:text-green-700"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Marquer terminé
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleStatusChange(rdv.id, 'annulee')}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <XCircle className="w-4 h-4 mr-1" />
                                      Annuler
                                    </Button>
                                  </>
                                )}
                              </div>
                              
                              {/* Bouton test direct pour dossier médical */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  console.log('=== BOUTON DIRECT DOSSIER ===');
                                  const patient = patients.get(rdv.patient_id);
                                  console.log('Patient:', patient);
                                  if (patient && patient.patient_id) {
                                    router.push(`/medecin/patients/${patient.patient_id}`);
                                  } else {
                                    toast.error('Dossier patient introuvable');
                                  }
                                }}
                                className="mr-2 bg-blue-100 hover:bg-blue-200"
                              >
                                <FileText className="w-4 h-4 mr-1" />
                                Dossier
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => router.push(`/medecin/consultations/${rdv.id}`)}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Voir les détails
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => router.push(`/medecin/consultations/${rdv.id}/edit`)}
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Modifier
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      console.log('=== DEBUT DEBUG DOSSIER MEDICAL ===');
                                      console.log('RDV complet:', rdv);
                                      console.log('Patient ID:', rdv.patient_id);
                                      console.log('Map patients complète:', patients);
                                      const patient = patients.get(rdv.patient_id);
                                      console.log('Patient récupéré:', patient);
                                      
                                      if (patient) {
                                        console.log('Patient trouvé - patient_id:', patient.patient_id);
                                        if (patient.patient_id) {
                                          const url = `/medecin/patients/${patient.patient_id}`;
                                          console.log('Navigation vers:', url);
                                          router.push(url);
                                        } else {
                                          console.log('ERREUR: patient.patient_id est vide/undefined');
                                          toast.error('ID patient manquant');
                                        }
                                      } else {
                                        console.log('ERREUR: Patient non trouvé dans la map');
                                        console.log('Keys disponibles dans patients map:', Array.from(patients.keys()));
                                        toast.error('Dossier patient introuvable');
                                      }
                                      console.log('=== FIN DEBUG DOSSIER MEDICAL ===');
                                    }}
                                  >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Voir le dossier médical
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Modal de finalisation de consultation */}
        <Modal
          isOpen={showFinishModal}
          onClose={() => {
            setShowFinishModal(false);
            setSelectedRdv(null);
            setConsultationData({
              observations: '',
              ordonnance: '',
              analyses: '',
              typeAnalyse: '',
              nomAnalyse: '',
              resultatsAnalyse: ''
            });
          }}
          title="Finaliser la consultation"
          size="lg"
        >
          <div className="space-y-4">
            {selectedRdv && (
              <>
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold mb-2">Patient</h3>
                      <p className="text-sm">{getPatientName(selectedRdv.patient_id)}</p>
                      <p className="text-sm text-muted-foreground mt-1">Motif: {selectedRdv.motif}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const patient = patients.get(selectedRdv.patient_id);
                        if (patient && patient.patient_id) {
                          router.push(`/medecin/patients/${patient.patient_id}`);
                        } else {
                          toast.error('Dossier patient introuvable');
                        }
                      }}
                      className="flex items-center space-x-2"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Voir le dossier</span>
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Observations de la consultation *
                  </label>
                  <Textarea
                    value={consultationData.observations}
                    onChange={(e) => setConsultationData({...consultationData, observations: e.target.value})}
                    placeholder="Décrivez les observations de la consultation..."
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Ordonnance (si nécessaire)
                  </label>
                  <Textarea
                    value={consultationData.ordonnance}
                    onChange={(e) => setConsultationData({...consultationData, ordonnance: e.target.value})}
                    placeholder="Listez les médicaments prescrits..."
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Analyses à effectuer (si nécessaire)
                  </label>
                  <Textarea
                    value={consultationData.analyses}
                    onChange={(e) => setConsultationData({...consultationData, analyses: e.target.value})}
                    placeholder="Listez les analyses demandées..."
                    rows={2}
                  />
                </div>

                {/* Section pour les résultats d'analyse si c'est une analyse */}
                {selectedRdv.motif?.toLowerCase().includes('analyse') && (
                  <>
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3">Résultats d'analyse</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Type d'analyse
                          </label>
                          <Input
                            value={consultationData.typeAnalyse}
                            onChange={(e) => setConsultationData({...consultationData, typeAnalyse: e.target.value})}
                            placeholder="Ex: Sanguin, Urinaire..."
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Nom de l'analyse
                          </label>
                          <Input
                            value={consultationData.nomAnalyse}
                            onChange={(e) => setConsultationData({...consultationData, nomAnalyse: e.target.value})}
                            placeholder="Ex: NFS, Glycémie..."
                          />
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <label className="block text-sm font-medium mb-2">
                          Résultats
                        </label>
                        <Textarea
                          value={consultationData.resultatsAnalyse}
                          onChange={(e) => setConsultationData({...consultationData, resultatsAnalyse: e.target.value})}
                          placeholder="Détaillez les résultats de l'analyse..."
                          rows={3}
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowFinishModal(false);
                setSelectedRdv(null);
                setConsultationData({
                  observations: '',
                  ordonnance: '',
                  analyses: '',
                  typeAnalyse: '',
                  nomAnalyse: '',
                  resultatsAnalyse: ''
                });
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleFinishConsultation}
              disabled={!consultationData.observations}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Terminer la consultation
            </Button>
          </div>
        </Modal>
      </motion.div>
    </DashboardLayout>
  );
};

export default ConsultationsPage;