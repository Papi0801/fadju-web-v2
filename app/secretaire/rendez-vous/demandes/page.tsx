'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  UserCheck,
  CalendarX,
  RotateCcw,
  History,
  Phone,
  Mail,
  MapPin,
  FileText,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Textarea,
} from '@/components/ui';
import { rendezVousService } from '@/lib/firebase/rendez-vous-service';
import { dossierPatientService } from '@/lib/firebase/dossier-patient';
import { UserQueries } from '@/lib/firebase/firestore';
import { RendezVous, User as UserType, DossierPatient } from '@/types';

interface ConfirmationModalProps {
  rdv: RendezVous | null;
  isOpen: boolean;
  onClose: () => void;
  medecins: UserType[];
  onConfirm: (medecinId: string, notes?: string) => Promise<void>;
}

interface ReportModalProps {
  rdv: RendezVous | null;
  isOpen: boolean;
  onClose: () => void;
  onReport: (nouvelleDate: Date, nouvelleHeureDebut: string, nouvelleHeureFin: string, motif: string) => Promise<void>;
}

interface ReassignModalProps {
  rdv: RendezVous | null;
  isOpen: boolean;
  onClose: () => void;
  medecins: UserType[];
  onReassign: (nouveauMedecinId: string, motif: string) => Promise<void>;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ rdv, isOpen, onClose, medecins, onConfirm }) => {
  const [selectedMedecin, setSelectedMedecin] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!selectedMedecin) {
      toast.error('Veuillez sélectionner un médecin');
      return;
    }

    setLoading(true);
    try {
      await onConfirm(selectedMedecin, notes);
      onClose();
      setSelectedMedecin('');
      setNotes('');
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmer & Attribuer le rendez-vous</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Attribuer à un médecin *
            </label>
            <select
              value={selectedMedecin}
              onChange={(e) => setSelectedMedecin(e.target.value)}
              className="w-full flex h-10 rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="" className="text-foreground bg-background">Sélectionner un médecin</option>
              {medecins.map(medecin => (
                <option key={medecin.id} value={medecin.id} className="text-foreground bg-background">
                  Dr. {medecin.prenom} {medecin.nom} - {medecin.specialite}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Notes du secrétaire (optionnel)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ajoutez des notes concernant ce rendez-vous..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleConfirm} loading={loading}>
            Confirmer & Attribuer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ReportModal: React.FC<ReportModalProps> = ({ rdv, isOpen, onClose, onReport }) => {
  const [nouvelleDate, setNouvelleDate] = useState('');
  const [nouvelleHeureDebut, setNouvelleHeureDebut] = useState('');
  const [nouvelleHeureFin, setNouvelleHeureFin] = useState('');
  const [motif, setMotif] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReport = async () => {
    if (!nouvelleDate || !nouvelleHeureDebut || !nouvelleHeureFin || !motif) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      const dateObj = new Date(nouvelleDate);
      await onReport(dateObj, nouvelleHeureDebut, nouvelleHeureFin, motif);
      onClose();
      setNouvelleDate('');
      setNouvelleHeureDebut('');
      setNouvelleHeureFin('');
      setMotif('');
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reporter le rendez-vous</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Nouvelle date *
            </label>
            <Input
              type="date"
              value={nouvelleDate}
              onChange={(e) => setNouvelleDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Heure début *
              </label>
              <Input
                type="time"
                value={nouvelleHeureDebut}
                onChange={(e) => setNouvelleHeureDebut(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Heure fin *
              </label>
              <Input
                type="time"
                value={nouvelleHeureFin}
                onChange={(e) => setNouvelleHeureFin(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Motif du report *
            </label>
            <Textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Expliquez pourquoi ce rendez-vous est reporté..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleReport} loading={loading}>
            Reporter le rendez-vous
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ReassignModal: React.FC<ReassignModalProps> = ({ rdv, isOpen, onClose, medecins, onReassign }) => {
  const [nouveauMedecin, setNouveauMedecin] = useState('');
  const [motif, setMotif] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReassign = async () => {
    if (!nouveauMedecin || !motif) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      await onReassign(nouveauMedecin, motif);
      onClose();
      setNouveauMedecin('');
      setMotif('');
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Réattribuer le médecin</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Nouveau médecin *
            </label>
            <select
              value={nouveauMedecin}
              onChange={(e) => setNouveauMedecin(e.target.value)}
              className="w-full flex h-10 rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="" className="text-foreground bg-background">Sélectionner un médecin</option>
              {medecins.filter(m => m.id !== rdv?.medecin_id).map(medecin => (
                <option key={medecin.id} value={medecin.id} className="text-foreground bg-background">
                  Dr. {medecin.prenom} {medecin.nom} - {medecin.specialite}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Motif de la réattribution *
            </label>
            <Textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Expliquez pourquoi ce rendez-vous est réattribué..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleReassign} loading={loading}>
            Réattribuer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const DemandesRendezVousPage: React.FC = () => {
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
  
  // Modals
  const [confirmationModal, setConfirmationModal] = useState<{isOpen: boolean, rdv: RendezVous | null}>({
    isOpen: false,
    rdv: null
  });
  const [reportModal, setReportModal] = useState<{isOpen: boolean, rdv: RendezVous | null}>({
    isOpen: false,
    rdv: null
  });
  const [reassignModal, setReassignModal] = useState<{isOpen: boolean, rdv: RendezVous | null}>({
    isOpen: false,
    rdv: null
  });

  useEffect(() => {
    fetchData();
  }, [user?.etablissement_id]);

  useEffect(() => {
    filterRendezVous();
  }, [rendezVous, searchTerm, selectedStatut, selectedMedecin, selectedDate]);

  useEffect(() => {
    console.log('État du modal confirmation:', confirmationModal);
  }, [confirmationModal]);

  const fetchData = async () => {
    if (!user?.etablissement_id) {
      setLoading(false);
      return;
    }

    try {
      // Récupérer toutes les demandes en attente pour l'établissement
      const rdvList = await rendezVousService.getDemandesEnAttente(user.etablissement_id);
      
      // Récupérer tous les RDV de l'établissement pour avoir une vue complète
      const allRdvList = await rendezVousService.getRendezVousByEtablissement(user.etablissement_id);
      
      // Combiner les deux listes en évitant les doublons
      const combinedRdvList = [...rdvList];
      allRdvList.forEach(rdv => {
        if (!combinedRdvList.find(r => r.id === rdv.id)) {
          combinedRdvList.push(rdv);
        }
      });
      
      setRendezVous(combinedRdvList);

      // Récupérer les médecins de l'établissement
      const medecinsList = await UserQueries.getMedecinsByEtablissement(user.etablissement_id);
      setMedecins(medecinsList);

      // Récupérer les informations des patients
      const patientsData: {[key: string]: DossierPatient} = {};
      for (const rdv of combinedRdvList) {
        try {
          const patient = await dossierPatientService.getByPatientId(rdv.patient_id);
          if (patient) {
            patientsData[rdv.patient_id] = patient;
          }
        } catch (error) {
          console.warn(`Patient ${rdv.patient_id} non trouvé:`, error);
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
        if (!rdv.date_rendez_vous) return false;
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

  const handleConfirmation = async (medecinId: string, notes?: string) => {
    if (!confirmationModal.rdv || !user?.id) return;

    try {
      await rendezVousService.confirmerEtAttribuer(
        confirmationModal.rdv.id,
        medecinId,
        user.id,
        notes
      );
      toast.success('Rendez-vous confirmé et attribué avec succès');
      fetchData();
    } catch (error) {
      console.error('Erreur lors de la confirmation:', error);
      toast.error('Erreur lors de la confirmation du rendez-vous');
      throw error;
    }
  };

  const handleReport = async (nouvelleDate: Date, nouvelleHeureDebut: string, nouvelleHeureFin: string, motif: string) => {
    if (!reportModal.rdv || !user?.id) return;

    try {
      await rendezVousService.reporterRendezVous(
        reportModal.rdv.id,
        nouvelleDate,
        nouvelleHeureDebut,
        nouvelleHeureFin,
        user.id,
        motif
      );
      toast.success('Rendez-vous reporté avec succès');
      fetchData();
    } catch (error) {
      console.error('Erreur lors du report:', error);
      toast.error('Erreur lors du report du rendez-vous');
      throw error;
    }
  };

  const handleReassign = async (nouveauMedecinId: string, motif: string) => {
    if (!reassignModal.rdv || !user?.id) return;

    try {
      await rendezVousService.reattribuerMedecin(
        reassignModal.rdv.id,
        nouveauMedecinId,
        user.id,
        motif
      );
      toast.success('Médecin réattribué avec succès');
      fetchData();
    } catch (error) {
      console.error('Erreur lors de la réattribution:', error);
      toast.error('Erreur lors de la réattribution du médecin');
      throw error;
    }
  };

  const handleAnnulation = async (rdvId: string, motif: string) => {
    if (!user?.id) return;

    try {
      await rendezVousService.annulerRendezVous(rdvId, user.id, motif);
      toast.success('Rendez-vous annulé avec succès');
      fetchData();
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error);
      toast.error('Erreur lors de l\'annulation du rendez-vous');
    }
  };

  const getStatutBadgeVariant = (statut: string) => {
    switch (statut) {
      case 'confirmee':
        return 'default';
      case 'annulee':
        return 'destructive';
      case 'reportee':
        return 'secondary';
      case 'terminee':
        return 'secondary';
      case 'en_attente':
      default:
        return 'secondary';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'confirmee':
        return 'Confirmé';
      case 'annulee':
        return 'Annulé';
      case 'reportee':
        return 'Reporté';
      case 'terminee':
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
    return patient ? `${patient.prenom} ${patient.nom}` : 'Patient non trouvé';
  };

  const getPatientInfo = (patientId: string) => {
    return patients[patientId] || null;
  };

  const stats = {
    total: rendezVous.length,
    enAttente: rendezVous.filter(rdv => rdv.statut === 'en_attente').length,
    confirmees: rendezVous.filter(rdv => rdv.statut === 'confirmee').length,
    reportees: rendezVous.filter(rdv => rdv.statut === 'reportee').length,
    annulees: rendezVous.filter(rdv => rdv.statut === 'annulee').length,
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loading text="Chargement des demandes de rendez-vous..." />
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
            <h1 className="text-3xl font-bold text-foreground">Demandes de Rendez-vous</h1>
            <p className="text-muted-foreground mt-2">
              Gérez les demandes de rendez-vous et attribuez-les aux médecins
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={() => router.push('/secretaire/rendez-vous')}
              className="flex items-center space-x-2"
            >
              <Eye className="w-5 h-5" />
              <span>Tous les RDV</span>
            </Button>
            <Button
              variant="primary"
              onClick={() => router.push('/secretaire/rendez-vous/nouveau')}
              className="flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Créer un RDV</span>
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                  <p className="text-muted-foreground text-sm font-medium">En attente</p>
                  <p className="text-2xl font-bold text-foreground">{stats.enAttente}</p>
                </div>
                <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Confirmés</p>
                  <p className="text-2xl font-bold text-foreground">{stats.confirmees}</p>
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
                  <p className="text-muted-foreground text-sm font-medium">Reportés</p>
                  <p className="text-2xl font-bold text-foreground">{stats.reportees}</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-100 text-orange-600">
                  <RotateCcw className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Annulés</p>
                  <p className="text-2xl font-bold text-foreground">{stats.annulees}</p>
                </div>
                <div className="p-3 rounded-lg bg-red-100 text-red-600">
                  <XCircle className="w-6 h-6" />
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
                className="flex h-10 rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="" className="text-foreground bg-background">Tous les statuts</option>
                <option value="en_attente" className="text-foreground bg-background">En attente</option>
                <option value="confirmee" className="text-foreground bg-background">Confirmé</option>
                <option value="reportee" className="text-foreground bg-background">Reporté</option>
                <option value="annulee" className="text-foreground bg-background">Annulé</option>
                <option value="terminee" className="text-foreground bg-background">Terminé</option>
              </select>
              <select
                value={selectedMedecin}
                onChange={(e) => setSelectedMedecin(e.target.value)}
                className="flex h-10 rounded-md border border-border bg-background text-foreground px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="" className="text-foreground bg-background">Tous les médecins</option>
                <option value="none" className="text-foreground bg-background">Non attribué</option>
                {medecins.map(medecin => (
                  <option key={medecin.id} value={medecin.id} className="text-foreground bg-background">
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
              <h3 className="text-lg font-semibold mb-2">Aucune demande de rendez-vous</h3>
              <p className="text-muted-foreground mb-4">
                {rendezVous.length === 0 
                  ? 'Aucune demande de rendez-vous pour le moment.'
                  : 'Aucune demande ne correspond à vos critères de recherche.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredRendezVous.map((rdv) => {
                const patient = getPatientInfo(rdv.patient_id);
                return (
                  <motion.div
                    key={rdv.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg flex items-center space-x-2 mb-2">
                                  <User className="w-5 h-5 text-primary" />
                                  <span>{getPatientName(rdv.patient_id)}</span>
                                  <Badge variant={getStatutBadgeVariant(rdv.statut)}>
                                    {getStatutLabel(rdv.statut)}
                                  </Badge>
                                </h3>
                                
                                {/* Informations patient */}
                                {patient && (
                                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                                    <div className="flex items-center space-x-1">
                                      <Phone className="w-4 h-4" />
                                      <span>{patient.telephone}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Mail className="w-4 h-4" />
                                      <span>{patient.email}</span>
                                    </div>
                                  </div>
                                )}

                                {/* Informations RDV */}
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                                  <div className="flex items-center space-x-1">
                                    <CalendarDays className="w-4 h-4" />
                                    <span>{rdv.date_rendez_vous && format(rdv.date_rendez_vous.toDate(), 'dd MMMM yyyy', { locale: fr })}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-4 h-4" />
                                    <span>{rdv.heure_debut} - {rdv.heure_fin}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Stethoscope className="w-4 h-4" />
                                    <span>
                                      {rdv.statut === 'en_attente' ? 'Non attribué' : getMedecinName(rdv.medecin_id)}
                                    </span>
                                  </div>
                                </div>

                                {/* Type et spécialité */}
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                                  <Badge variant="secondary" className="text-xs">
                                    {rdv.type}
                                  </Badge>
                                  {rdv.specialite && (
                                    <Badge variant="secondary" className="text-xs">
                                      {rdv.specialite}
                                    </Badge>
                                  )}
                                  <span className="text-xs">
                                    Créé par: {rdv.cree_par}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {rdv.motif && (
                              <div className="mb-3">
                                <p className="text-sm">
                                  <span className="font-medium">Motif :</span> {rdv.motif}
                                </p>
                              </div>
                            )}

                            {/* Notes */}
                            {rdv.notes_secretaire && (
                              <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                  <span className="font-medium">Notes secrétaire :</span> {rdv.notes_secretaire}
                                </p>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-3 border-t">
                              <div className="flex items-center space-x-2">
                                {rdv.statut === 'en_attente' && (
                                  <>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        console.log('Bouton cliqué, ouverture du modal');
                                        setConfirmationModal({isOpen: true, rdv});
                                      }}
                                      className="text-white"
                                    >
                                      <UserCheck className="w-4 h-4 mr-1" />
                                      Confirmer & Attribuer
                                    </Button>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => setReportModal({isOpen: true, rdv})}
                                    >
                                      <CalendarX className="w-4 h-4 mr-1" />
                                      Reporter
                                    </Button>
                                  </>
                                )}

                                {rdv.statut === 'confirmee' && (
                                  <>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => setReassignModal({isOpen: true, rdv})}
                                    >
                                      <RotateCcw className="w-4 h-4 mr-1" />
                                      Réattribuer
                                    </Button>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => setReportModal({isOpen: true, rdv})}
                                    >
                                      <CalendarX className="w-4 h-4 mr-1" />
                                      Reporter
                                    </Button>
                                  </>
                                )}

                                {(rdv.statut === 'en_attente' || rdv.statut === 'confirmee') && (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleAnnulation(rdv.id, 'Annulé par le secrétaire')}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Annuler
                                  </Button>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                {rdv.historique_modifications && rdv.historique_modifications.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => console.log('Voir historique', rdv.historique_modifications)}
                                  >
                                    <History className="w-4 h-4" />
                                  </Button>
                                )}
                                
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
                                      Voir les détails
                                    </DropdownMenuItem>
                                    {patient && (
                                      <DropdownMenuItem
                                        onClick={() => router.push(`/secretaire/patients/${patient.patient_id}`)}
                                      >
                                        <User className="w-4 h-4 mr-2" />
                                        Dossier patient
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      onClick={() => router.push(`/secretaire/rendez-vous/${rdv.id}/edit`)}
                                    >
                                      <Edit className="w-4 h-4 mr-2" />
                                      Modifier
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Modals */}
        <ConfirmationModal
          rdv={confirmationModal.rdv}
          isOpen={confirmationModal.isOpen}
          onClose={() => {
            console.log('Fermeture du modal');
            setConfirmationModal({isOpen: false, rdv: null});
          }}
          medecins={medecins}
          onConfirm={handleConfirmation}
        />

        <ReportModal
          rdv={reportModal.rdv}
          isOpen={reportModal.isOpen}
          onClose={() => setReportModal({isOpen: false, rdv: null})}
          onReport={handleReport}
        />

        <ReassignModal
          rdv={reassignModal.rdv}
          isOpen={reassignModal.isOpen}
          onClose={() => setReassignModal({isOpen: false, rdv: null})}
          medecins={medecins}
          onReassign={handleReassign}
        />
      </motion.div>
    </DashboardLayout>
  );
};

export default DemandesRendezVousPage;