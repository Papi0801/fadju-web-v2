'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  MapPin,
  FileText,
  Save,
  ArrowLeft,
  Search,
  Plus,
  AlertCircle,
  Phone,
  Mail,
  UserPlus,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui';
import { rendezVousService } from '@/lib/firebase/rendez-vous-service';
import { dossierPatientService } from '@/lib/firebase/dossier-patient';
import { UserQueries } from '@/lib/firebase/firestore';
import { User as UserType, DossierPatient } from '@/types';

interface PatientSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (patient: DossierPatient) => void;
}

const PatientSelectionModal: React.FC<PatientSelectionModalProps> = ({ isOpen, onClose, onSelect }) => {
  const { user } = useAuthStore();
  const [patients, setPatients] = useState<DossierPatient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPatients();
    }
  }, [isOpen]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      // Récupérer seulement les patients affiliés à cet établissement
      const patientsAffiliés = await dossierPatientService.getPatientsByEtablissement(user?.etablissement_id || '');
      setPatients(patientsAffiliés);
    } catch (error) {
      console.error('Erreur lors de la récupération des patients:', error);
      toast.error('Erreur lors du chargement des patients');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.telephone.includes(searchTerm)
  );

  const handleSelect = (patient: DossierPatient) => {
    onSelect(patient);
    onClose();
    setSearchTerm('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Sélectionner un patient</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div>
            <Input
              placeholder="Rechercher par nom, prénom, email ou téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-5 h-5 text-muted-foreground" />}
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loading text="Chargement des patients..." />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredPatients.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ? 'Aucun patient trouvé' : 'Aucun patient affilié à votre établissement'}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      onClose();
                      window.open('/secretaire/patients', '_blank');
                    }}
                    className="flex items-center space-x-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Ajouter un patient par ID</span>
                  </Button>
                </div>
              ) : (
                filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => handleSelect(patient)}
                    className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{patient.prenom} {patient.nom}</h4>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center space-x-1">
                            <Phone className="w-3 h-3" />
                            <span>{patient.telephone}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Mail className="w-3 h-3" />
                            <span>{patient.email}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {patient.genre}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {dossierPatientService.calculateAge(patient.date_naissance.toDate())} ans
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {patient.groupe_sanguin}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              onClose();
              window.open('/secretaire/patients', '_blank');
            }}
            className="flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Gérer les patients</span>
          </Button>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const NouveauRendezVousPage: React.FC = () => {
  const { user } = useAuthStore();
  const router = useRouter();
  
  const [medecins, setMedecins] = useState<UserType[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<DossierPatient | null>(null);
  const [loading, setLoading] = useState(false);
  const [patientModalOpen, setPatientModalOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    date_rendez_vous: '',
    heure_debut: '',
    heure_fin: '',
    motif: '',
    type: 'consultation' as 'consultation' | 'urgence' | 'suivi',
    specialite: '',
    medecin_id: '',
    notes_secretaire: '',
  });

  useEffect(() => {
    fetchMedecins();
  }, [user?.etablissement_id]);

  const fetchMedecins = async () => {
    if (!user?.etablissement_id) return;

    try {
      const medecinsList = await UserQueries.getMedecinsByEtablissement(user.etablissement_id);
      setMedecins(medecinsList);
    } catch (error) {
      console.error('Erreur lors de la récupération des médecins:', error);
      toast.error('Erreur lors du chargement des médecins');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePatientSelect = (patient: DossierPatient) => {
    setSelectedPatient(patient);
  };

  const validateForm = () => {
    if (!selectedPatient) {
      toast.error('Veuillez sélectionner un patient');
      return false;
    }

    if (!formData.date_rendez_vous) {
      toast.error('Veuillez sélectionner une date');
      return false;
    }

    if (!formData.heure_debut || !formData.heure_fin) {
      toast.error('Veuillez renseigner les heures de début et fin');
      return false;
    }

    if (formData.heure_debut >= formData.heure_fin) {
      toast.error('L\'heure de fin doit être postérieure à l\'heure de début');
      return false;
    }

    if (!formData.motif.trim()) {
      toast.error('Veuillez renseigner le motif du rendez-vous');
      return false;
    }

    if (!formData.medecin_id) {
      toast.error('Veuillez sélectionner un médecin');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !selectedPatient || !user?.etablissement_id) return;

    setLoading(true);
    try {
      // Vérifier que la date est valide avant de créer l'objet Date
      const dateRdv = new Date(formData.date_rendez_vous);
      if (isNaN(dateRdv.getTime())) {
        toast.error('Date de rendez-vous invalide');
        setLoading(false);
        return;
      }

      await rendezVousService.createDemandeRendezVous({
        patient_id: selectedPatient.patient_id,
        etablissement_id: user.etablissement_id,
        date_rendez_vous: dateRdv,
        heure_debut: formData.heure_debut,
        heure_fin: formData.heure_fin,
        motif: formData.motif,
        type: formData.type,
        specialite: formData.specialite || undefined,
        cree_par: 'secretaire',
        medecin_id: formData.medecin_id,
        notes_secretaire: formData.notes_secretaire || undefined,
      });

      toast.success('Rendez-vous créé avec succès !');
      router.push('/secretaire/rendez-vous/demandes');
    } catch (error) {
      console.error('Erreur lors de la création du rendez-vous:', error);
      toast.error('Erreur lors de la création du rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();
  const selectedMedecin = medecins.find(m => m.id === formData.medecin_id);

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Nouveau Rendez-vous</h1>
            <p className="text-muted-foreground mt-2">
              Créer un rendez-vous et l'attribuer directement à un médecin
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sélection du patient */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Patient</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedPatient ? (
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-lg">
                          {selectedPatient.prenom} {selectedPatient.nom}
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mt-2">
                          <div className="flex items-center space-x-1">
                            <Phone className="w-4 h-4" />
                            <span>{selectedPatient.telephone}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Mail className="w-4 h-4" />
                            <span>{selectedPatient.email}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{selectedPatient.adresse}</span>
                          </div>
                          <div>
                            {dossierPatientService.calculateAge(selectedPatient.date_naissance.toDate())} ans • {selectedPatient.genre}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-3">
                          <Badge variant="outline">
                            {selectedPatient.groupe_sanguin}
                          </Badge>
                          {selectedPatient.allergie && (
                            <Badge variant="destructive" className="text-xs">
                              Allergies: {selectedPatient.allergie}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setPatientModalOpen(true)}
                        size="sm"
                      >
                        Changer
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucun patient sélectionné</h3>
                    <p className="text-muted-foreground mb-4">
                      Sélectionnez un patient pour créer le rendez-vous
                    </p>
                    <Button
                      type="button"
                      onClick={() => setPatientModalOpen(true)}
                      className="flex items-center space-x-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Sélectionner un patient</span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informations rapides */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5" />
                  <span>Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-blue-800 dark:text-blue-200">
                      <strong>Workflow:</strong> Ce rendez-vous sera créé avec le statut "confirmé" 
                      et sera directement attribué au médecin sélectionné.
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-green-800 dark:text-green-200">
                      <strong>Avantage:</strong> Pas besoin de confirmation manuelle, 
                      le rendez-vous apparaîtra directement dans l'agenda du médecin.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {selectedPatient && (
            <>
              {/* Informations du rendez-vous */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>Informations du rendez-vous</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Date du rendez-vous *
                      </label>
                      <Input
                        type="date"
                        value={formData.date_rendez_vous}
                        onChange={(e) => handleInputChange('date_rendez_vous', e.target.value)}
                        min={format(new Date(), 'yyyy-MM-dd')}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Heure de début *
                      </label>
                      <select
                        value={formData.heure_debut}
                        onChange={(e) => handleInputChange('heure_debut', e.target.value)}
                        className="w-full flex h-10 rounded-md border border-border bg-input px-3 py-2 text-sm"
                        required
                      >
                        <option value="">Sélectionner l'heure</option>
                        {timeSlots.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Heure de fin *
                      </label>
                      <select
                        value={formData.heure_fin}
                        onChange={(e) => handleInputChange('heure_fin', e.target.value)}
                        className="w-full flex h-10 rounded-md border border-border bg-input px-3 py-2 text-sm"
                        required
                      >
                        <option value="">Sélectionner l'heure</option>
                        {timeSlots.filter(time => time > formData.heure_debut).map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Type de rendez-vous *
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => handleInputChange('type', e.target.value)}
                        className="w-full flex h-10 rounded-md border border-border bg-input px-3 py-2 text-sm"
                        required
                      >
                        <option value="consultation">Consultation</option>
                        <option value="suivi">Suivi</option>
                        <option value="urgence">Urgence</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Spécialité (optionnel)
                      </label>
                      <Input
                        value={formData.specialite}
                        onChange={(e) => handleInputChange('specialite', e.target.value)}
                        placeholder="Ex: Cardiologie, Dermatologie..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Motif du rendez-vous *
                    </label>
                    <Textarea
                      value={formData.motif}
                      onChange={(e) => handleInputChange('motif', e.target.value)}
                      placeholder="Décrivez le motif de consultation..."
                      rows={3}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Attribution du médecin */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Stethoscope className="w-5 h-5" />
                    <span>Attribution du médecin</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Médecin attribué *
                    </label>
                    <select
                      value={formData.medecin_id}
                      onChange={(e) => handleInputChange('medecin_id', e.target.value)}
                      className="w-full flex h-10 rounded-md border border-border bg-input px-3 py-2 text-sm"
                      required
                    >
                      <option value="">Sélectionner un médecin</option>
                      {medecins.map(medecin => (
                        <option key={medecin.id} value={medecin.id}>
                          Dr. {medecin.prenom} {medecin.nom} - {medecin.specialite}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedMedecin && (
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Stethoscope className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">
                            Dr. {selectedMedecin.prenom} {selectedMedecin.nom}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {selectedMedecin.specialite}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Notes du secrétaire (optionnel)
                    </label>
                    <Textarea
                      value={formData.notes_secretaire}
                      onChange={(e) => handleInputChange('notes_secretaire', e.target.value)}
                      placeholder="Ajoutez des informations importantes pour le médecin..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  className="flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Créer le rendez-vous</span>
                </Button>
              </div>
            </>
          )}
        </form>

        {/* Modal de sélection du patient */}
        <PatientSelectionModal
          isOpen={patientModalOpen}
          onClose={() => setPatientModalOpen(false)}
          onSelect={handlePatientSelect}
        />
      </motion.div>
    </DashboardLayout>
  );
};

export default NouveauRendezVousPage;