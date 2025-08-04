'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  Filter,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  CalendarDays,
  Phone,
  Mail,
  MapPin,
  FileText,
  UserCheck,
  CalendarX,
  RotateCcw,
  Heart,
  Activity,
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
import { UserQueries } from '@/lib/firebase/firestore';
import { rendezVousService } from '@/lib/firebase/rendez-vous-service';
import { dossierPatientService } from '@/lib/firebase/dossier-patient';
import { RendezVous, User as UserType, DossierPatient } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const RendezVousPage: React.FC = () => {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const router = useRouter();
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [filteredRendezVous, setFilteredRendezVous] = useState<RendezVous[]>([]);
  const [medecins, setMedecins] = useState<UserType[]>([]);
  const [patients, setPatients] = useState<{[key: string]: DossierPatient}>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');
  const [selectedMedecin, setSelectedMedecin] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  
  // États pour les modals
  const [reportModal, setReportModal] = useState<{isOpen: boolean, rdv: RendezVous | null}>({
    isOpen: false,
    rdv: null
  });
  const [patientModal, setPatientModal] = useState<{isOpen: boolean, patient: DossierPatient | null}>({
    isOpen: false,
    patient: null
  });
  
  // États pour le formulaire de report
  const [reportForm, setReportForm] = useState({
    date: '',
    heureDebut: '',
    heureFin: '',
    motif: ''
  });

  useEffect(() => {
    fetchData();
  }, [user?.etablissement_id]);

  useEffect(() => {
    filterRendezVous();
  }, [rendezVous, searchTerm, selectedStatut, selectedMedecin, selectedDate]);

  const fetchData = async () => {
    if (!user?.etablissement_id) {
      setLoading(false);
      return;
    }

    try {
      // Récupérer tous les rendez-vous de l'établissement
      const rdvList = await rendezVousService.getRendezVousByEtablissement(user.etablissement_id);
      setRendezVous(rdvList);

      // Récupérer les médecins de l'établissement
      const medecinsList = await UserQueries.getMedecinsByEtablissement(user.etablissement_id);
      setMedecins(medecinsList);

      // Récupérer les informations des patients
      const patientsData: {[key: string]: DossierPatient} = {};
      for (const rdv of rdvList) {
        if (!patientsData[rdv.patient_id]) {
          try {
            const patient = await dossierPatientService.getByPatientId(rdv.patient_id);
            if (patient) {
              patientsData[rdv.patient_id] = patient;
            }
          } catch (error) {
            console.warn(`Patient ${rdv.patient_id} non trouvé:`, error);
          }
        }
      }
      setPatients(patientsData);
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const filterRendezVous = () => {
    let filtered = rendezVous;

    if (searchTerm) {
      filtered = filtered.filter(rdv => {
        const patient = patients[rdv.patient_id];
        const patientName = patient ? `${patient.prenom} ${patient.nom}` : '';
        return rdv.motif?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               patientName.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    if (selectedStatut) {
      filtered = filtered.filter(rdv => rdv.statut === selectedStatut);
    }

    if (selectedMedecin) {
      filtered = filtered.filter(rdv => rdv.medecin_id === selectedMedecin);
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

  const handleStatusChange = async (rdvId: string, newStatus: 'confirme' | 'annule') => {
    if (!user?.id) return;
    
    try {
      if (newStatus === 'annule') {
        await rendezVousService.annulerRendezVous(rdvId, user.id, 'Annulé par le secrétaire');
      } else {
        // Pour confirmer, il faut attribuer un médecin - rediriger vers la page de demandes
        router.push('/secretaire/rendez-vous/demandes');
        return;
      }
      toast.success(`Rendez-vous ${newStatus === 'confirme' ? 'confirmé' : 'annulé'} avec succès`);
      fetchData();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const getStatutBadgeVariant = (statut: string) => {
    switch (statut) {
      case 'confirmee':
      case 'confirme':
        return 'success';
      case 'annulee':
      case 'annule':
        return 'destructive';
      case 'reportee':
        return 'secondary';
      case 'terminee':
      case 'termine':
        return 'outline';
      case 'en_attente':
      default:
        return 'warning';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'confirmee':
      case 'confirme':
        return 'Confirmé';
      case 'annulee':
      case 'annule':
        return 'Annulé';
      case 'reportee':
        return 'Reporté';
      case 'terminee':
      case 'termine':
        return 'Terminé';
      case 'en_attente':
      default:
        return 'En attente';
    }
  };

  const getMedecinName = (medecinId?: string) => {
    if (!medecinId) return 'Non attribué';
    const medecin = medecins.find(m => m.id === medecinId);
    return medecin ? `Dr. ${medecin.prenom} ${medecin.nom}` : 'Médecin non trouvé';
  };

  const getPatientName = (patientId: string) => {
    const patient = patients[patientId];
    return patient ? `${patient.prenom} ${patient.nom}` : `Patient ${patientId}`;
  };

  const getPatientInfo = (patientId: string) => {
    return patients[patientId] || null;
  };

  const getHeureRdv = (rdv: RendezVous) => {
    // Nouveau format: heure_debut et heure_fin
    if (rdv.heure_debut && rdv.heure_fin) {
      return `${rdv.heure_debut} - ${rdv.heure_fin}`;
    }
    
    // Ancien format: creneau_horaire
    if ((rdv as any).creneau_horaire) {
      return (rdv as any).creneau_horaire;
    }
    
    // Fallback
    return 'Heure non définie';
  };

  const handleReportRdv = async () => {
    if (!reportModal.rdv || !user?.id) return;

    if (!reportForm.date || !reportForm.heureDebut || !reportForm.heureFin || !reportForm.motif) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      await rendezVousService.reporterRendezVous(
        reportModal.rdv.id,
        new Date(reportForm.date),
        reportForm.heureDebut,
        reportForm.heureFin,
        user.id,
        reportForm.motif
      );
      
      toast.success('Rendez-vous reporté avec succès');
      setReportModal({isOpen: false, rdv: null});
      setReportForm({date: '', heureDebut: '', heureFin: '', motif: ''});
      fetchData();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du report du rendez-vous');
    }
  };

  const handleConfirmRdv = async (rdvId: string) => {
    // Rediriger vers la page de demandes pour la confirmation avec attribution
    router.push(`/secretaire/rendez-vous/demandes`);
  };

  const handleViewPatient = (patientId: string) => {
    const patient = getPatientInfo(patientId);
    if (patient) {
      setPatientModal({isOpen: true, patient});
    }
  };

  const stats = {
    total: rendezVous.length,
    enAttente: rendezVous.filter(rdv => rdv.statut === 'en_attente').length,
    confirmes: rendezVous.filter(rdv => rdv.statut === 'confirmee' || rdv.statut === 'confirme').length,
    annules: rendezVous.filter(rdv => rdv.statut === 'annulee' || rdv.statut === 'annule').length,
    reportes: rendezVous.filter(rdv => rdv.statut === 'reportee').length,
    termines: rendezVous.filter(rdv => rdv.statut === 'terminee' || rdv.statut === 'termine').length,
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loading text="Chargement des rendez-vous..." />
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
            <h1 className="text-3xl font-bold text-foreground">Gestion des Rendez-vous</h1>
            <p className="text-muted-foreground mt-2">
              Gérez tous les rendez-vous de votre établissement
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => router.push('/secretaire/rendez-vous/nouveau')}
            className="flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Nouveau rendez-vous</span>
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Total RDV</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
                </div>
                <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                  <CalendarDays className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">En attente</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">{stats.enAttente}</p>
                </div>
                <div className="p-2 rounded-full bg-amber-100 text-amber-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Confirmés</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{stats.confirmes}</p>
                </div>
                <div className="p-2 rounded-full bg-green-100 text-green-600">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Reportés</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">{stats.reportes}</p>
                </div>
                <div className="p-2 rounded-full bg-orange-100 text-orange-600">
                  <RotateCcw className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Terminés</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">{stats.termines}</p>
                </div>
                <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Annulés</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">{stats.annules}</p>
                </div>
                <div className="p-2 rounded-full bg-red-100 text-red-600">
                  <XCircle className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et recherche */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                <option value="en_attente">En attente</option>
                <option value="confirmee">Confirmé</option>
                <option value="reportee">Reporté</option>
                <option value="terminee">Terminé</option>
                <option value="annulee">Annulé</option>
              </select>
              <select
                value={selectedMedecin}
                onChange={(e) => setSelectedMedecin(e.target.value)}
                className="flex h-10 rounded-md border border-border bg-input px-3 py-2 text-sm"
              >
                <option value="">Tous les médecins</option>
                {medecins.map(medecin => (
                  <option key={medecin.id} value={medecin.id}>
                    Dr. {medecin.prenom} {medecin.nom}
                  </option>
                ))}
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

        {/* Liste des rendez-vous */}
        {filteredRendezVous.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun rendez-vous</h3>
              <p className="text-muted-foreground mb-4">
                {rendezVous.length === 0 
                  ? 'Aucun rendez-vous enregistré pour le moment.'
                  : 'Aucun rendez-vous ne correspond à vos critères de recherche.'
                }
              </p>
              {rendezVous.length === 0 && (
                <Button
                  variant="primary"
                  onClick={() => router.push('/secretaire/rendez-vous/nouveau')}
                >
                  Créer le premier rendez-vous
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRendezVous.map((rdv) => {
              const patient = getPatientInfo(rdv.patient_id);
              return (
                <motion.div
                  key={rdv.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="hover:shadow-lg transition-shadow border-l-4 border-primary/20">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* En-tête avec patient et statut */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                              <User className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-foreground">
                                {getPatientName(rdv.patient_id)}
                              </h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant={getStatutBadgeVariant(rdv.statut)} className="text-xs">
                                  {getStatutLabel(rdv.statut)}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {rdv.type}
                                </Badge>
                                {rdv.specialite && (
                                  <Badge variant="outline" className="text-xs">
                                    {rdv.specialite}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-foreground">
                              {format(rdv.date_rendez_vous.toDate(), 'dd MMM yyyy', { locale: fr })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {getHeureRdv(rdv)}
                            </p>
                          </div>
                        </div>

                        {/* Informations patient */}
                        {patient && (
                          <div className="bg-muted/30 rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="flex items-center space-x-2">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                <span>{patient.telephone}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <span>{patient.email}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Heart className="w-4 h-4 text-red-500" />
                                <span>{patient.groupe_sanguin}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span>{dossierPatientService.calculateAge(patient.date_naissance.toDate())} ans • {patient.genre}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                <span>{patient.adresse}</span>
                              </div>
                              {patient.allergie && (
                                <div className="flex items-center space-x-2">
                                  <AlertCircle className="w-4 h-4 text-orange-500" />
                                  <span className="text-orange-600">Allergies: {patient.allergie}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Motif et médecin */}
                        <div className="space-y-2">
                          {rdv.motif && (
                            <div className="flex items-start space-x-2">
                              <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                              <div>
                                <span className="text-sm font-medium">Motif : </span>
                                <span className="text-sm text-muted-foreground">{rdv.motif}</span>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <Stethoscope className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              <span className="font-medium">Médecin : </span>
                              {rdv.statut === 'en_attente' ? 
                                <span className="text-amber-600">Non attribué</span> : 
                                getMedecinName(rdv.medecin_id)
                              }
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center space-x-2">
                            {rdv.statut === 'en_attente' && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleConfirmRdv(rdv.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <UserCheck className="w-4 h-4 mr-1" />
                                  Confirmer & Attribuer
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setReportModal({isOpen: true, rdv})}
                                >
                                  <CalendarX className="w-4 h-4 mr-1" />
                                  Reporter
                                </Button>
                              </>
                            )}
                            {(rdv.statut === 'confirmee' || rdv.statut === 'reportee') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setReportModal({isOpen: true, rdv})}
                              >
                                <RotateCcw className="w-4 h-4 mr-1" />
                                Reporter
                              </Button>
                            )}
                            {(rdv.statut === 'en_attente' || rdv.statut === 'confirmee') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusChange(rdv.id, 'annule')}
                                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Annuler
                              </Button>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewPatient(rdv.patient_id)}
                            >
                              <User className="w-4 h-4 mr-1" />
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
                                  onClick={() => router.push(`/secretaire/rendez-vous/${rdv.id}`)}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Voir détails RDV
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => router.push(`/secretaire/rendez-vous/${rdv.id}/edit`)}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Modifier RDV
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Message d'information pour établissement non validé */}
        {user?.etablissement_statut === 'en_attente' && (
          <Card 
            className={`border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 ${theme === 'light' ? 'info-box-light' : ''}`}
          >
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" style={theme === 'light' ? { color: 'white' } : {}} />
                <div>
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200" style={theme === 'light' ? { color: 'white' } : {}}>
                    Fonctionnalité limitée
                  </h3>
                  <p className="text-yellow-700 dark:text-yellow-300 mt-1" style={theme === 'light' ? { color: 'white' } : {}}>
                    La gestion complète des rendez-vous sera disponible après validation de votre établissement.
                    Pour le moment, vous pouvez consulter et préparer vos données.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal de report de RDV */}
        <Modal 
          isOpen={reportModal.isOpen} 
          onClose={() => {
            setReportModal({isOpen: false, rdv: null});
            setReportForm({date: '', heureDebut: '', heureFin: '', motif: ''});
          }}
          title="Reporter le rendez-vous"
          size="sm"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nouvelle date *</label>
              <Input
                type="date"
                value={reportForm.date}
                onChange={(e) => setReportForm({...reportForm, date: e.target.value})}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Heure début *</label>
                <Input
                  type="time"
                  value={reportForm.heureDebut}
                  onChange={(e) => setReportForm({...reportForm, heureDebut: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Heure fin *</label>
                <Input
                  type="time"
                  value={reportForm.heureFin}
                  onChange={(e) => setReportForm({...reportForm, heureFin: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Motif du report *</label>
              <Textarea
                value={reportForm.motif}
                onChange={(e) => setReportForm({...reportForm, motif: e.target.value})}
                placeholder="Expliquez pourquoi ce rendez-vous est reporté..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setReportModal({isOpen: false, rdv: null});
                setReportForm({date: '', heureDebut: '', heureFin: '', motif: ''});
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleReportRdv}>
              Reporter le rendez-vous
            </Button>
          </div>
        </Modal>

        {/* Modal du dossier patient */}
        <Modal 
          isOpen={patientModal.isOpen} 
          onClose={() => setPatientModal({isOpen: false, patient: null})}
          title="Dossier médical du patient"
          size="xl"
          className="max-h-[80vh] overflow-y-auto"
        >
          {patientModal.patient && (
            <div className="space-y-6">
              {/* Informations personnelles */}
              <div className="bg-muted/30 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3 flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Informations personnelles</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nom complet</p>
                    <p className="font-medium">{patientModal.patient.prenom} {patientModal.patient.nom}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Âge</p>
                    <p className="font-medium">{dossierPatientService.calculateAge(patientModal.patient.date_naissance.toDate())} ans ({patientModal.patient.genre})</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Téléphone</p>
                    <p className="font-medium">{patientModal.patient.telephone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="font-medium">{patientModal.patient.email}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Adresse</p>
                    <p className="font-medium">{patientModal.patient.adresse}</p>
                  </div>
                </div>
              </div>

              {/* Informations médicales */}
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3 flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  <span>Informations médicales</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Groupe sanguin</p>
                    <p className="font-medium text-red-600">{patientModal.patient.groupe_sanguin}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Poids</p>
                    <p className="font-medium">{patientModal.patient.poids} kg</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Taille</p>
                    <p className="font-medium">{patientModal.patient.taille} cm</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Personne à contacter</p>
                    <p className="font-medium">{patientModal.patient.personne_a_contacter}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Allergies</p>
                    <p className="font-medium text-orange-600">
                      {patientModal.patient.allergie || 'Aucune allergie connue'}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Maladies chroniques</p>
                    <p className="font-medium">
                      {patientModal.patient.maladie_chronique || 'Aucune maladie chronique'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes complémentaires */}
              {patientModal.patient.notes && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    <span>Notes complémentaires</span>
                  </h3>
                  <p className="text-sm">{patientModal.patient.notes}</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button 
              variant="outline"
              onClick={() => setPatientModal({isOpen: false, patient: null})}
            >
              Fermer
            </Button>
          </div>
        </Modal>
      </motion.div>
    </DashboardLayout>
  );
};

export default RendezVousPage;