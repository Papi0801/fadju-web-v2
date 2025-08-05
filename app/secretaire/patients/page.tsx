'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Plus,
  UserPlus,
  Eye,
  Calendar,
  Filter,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
} from 'lucide-react';
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
  Input,
} from '@/components/ui';
import Modal from '@/components/ui/modal';
import { DossierPatient } from '@/types';
import { dossierPatientService } from '@/lib/firebase/dossier-patient';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const PatientsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [patients, setPatients] = useState<DossierPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [addingPatient, setAddingPatient] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<DossierPatient | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      
      // Récupérer tous les patients affiliés à cet établissement
      const patientsData = await dossierPatientService.getPatientsByEtablissement(user?.etablissement_id || '');
      setPatients(patientsData);
    } catch (error) {
      console.error('Erreur lors de la récupération des patients:', error);
      toast.error('Erreur lors du chargement des patients');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPatient = async () => {
    if (!patientId.trim()) {
      toast.error('Veuillez saisir un ID patient');
      return;
    }

    setAddingPatient(true);
    try {
      // Vérifier si le patient existe
      const patientData = await dossierPatientService.getByPatientId(patientId.trim());
      
      if (!patientData) {
        toast.error('Aucun patient trouvé avec cet ID');
        return;
      }

      // Vérifier si le patient n'est pas déjà affilié
      const isAlreadyAffiliated = await dossierPatientService.isPatientAffiliatedToEtablissement(
        patientId.trim(), 
        user?.etablissement_id || ''
      );

      if (isAlreadyAffiliated) {
        toast.error('Ce patient est déjà affilié à votre établissement');
        return;
      }

      // Affilier le patient à l'établissement
      await dossierPatientService.affiliatePatientToEtablissement(
        patientId.trim(),
        user?.etablissement_id || ''
      );

      toast.success('Patient ajouté avec succès à votre établissement');
      setPatientId('');
      setIsAddModalOpen(false);
      fetchPatients(); // Rafraîchir la liste

    } catch (error) {
      console.error('Erreur lors de l\'ajout du patient:', error);
      toast.error('Erreur lors de l\'ajout du patient');
    } finally {
      setAddingPatient(false);
    }
  };


  const handleViewPatient = (patient: DossierPatient) => {
    setSelectedPatient(patient);
    setIsViewModalOpen(true);
  };

  const filteredPatients = patients.filter(patient =>
    patient.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPatientStats = () => {
    return {
      total: patients.length,
      nouveaux: patients.filter(p => {
        if (!p.date_creation) return false;
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return p.date_creation.toDate() > weekAgo;
      }).length,
      actifs: patients.filter(p => p.actif).length,
    };
  };

  const stats = getPatientStats();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loading text="Chargement des patients..." />
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Gestion des Patients
            </h1>
            <p className="text-muted-foreground">
              Gérez les patients affiliés à votre établissement
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center space-x-2"
            >
              <UserPlus className="w-5 h-5" />
              <span>Ajouter un patient</span>
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total patients
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.total}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Nouveaux (7j)
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.nouveaux}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foregreen">
                    Patients actifs
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.actifs}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barre de recherche et filtres */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Rechercher par nom, prénom, email ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtrer
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des patients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Patients affiliés ({filteredPatients.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPatients.length > 0 ? (
              <div className="space-y-4">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {patient.prenom[0]}{patient.nom[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-foreground truncate">
                            {patient.prenom} {patient.nom}
                          </h3>
                          <Badge variant={patient.actif ? 'success' : 'secondary'}>
                            {patient.actif ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {patient.email} • {patient.telephone}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ID: {patient.patient_id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">
                          {patient.genre} • {patient.date_naissance ? 
                            Math.floor((new Date().getTime() - patient.date_naissance.toDate().getTime()) / (365.25 * 24 * 60 * 60 * 1000)) 
                            : '?'} ans
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ajouté le {patient.date_creation ? format(patient.date_creation.toDate(), 'dd/MM/yyyy', { locale: fr }) : 'N/A'}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPatient(patient)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? 'Aucun patient trouvé' : 'Aucun patient affilié'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                    ? 'Essayez de modifier votre recherche'
                    : 'Commencez par ajouter des patients à votre établissement'
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={() => setIsAddModalOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Ajouter un patient
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal d'ajout de patient */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setPatientId('');
        }}
        title="Ajouter un patient par ID"
        size="md"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Comment obtenir l'ID patient ?</p>
                <p>Le patient peut trouver son ID unique dans la section "Profil" de l'application mobile Fadju.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              ID unique du patient
            </label>
            <Input
              placeholder="Ex: G90AefcLATRP97SawW4QhKYzHeK2"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              L'ID est sensible à la casse et doit être saisi exactement
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                setPatientId('');
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleAddPatient}
              loading={addingPatient}
              disabled={!patientId.trim() || addingPatient}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Ajouter le patient
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de visualisation patient */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedPatient(null);
        }}
        title={selectedPatient ? `${selectedPatient.prenom} ${selectedPatient.nom}` : ''}
        size="lg"
      >
        {selectedPatient && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nom complet</label>
                <p className="text-lg font-semibold">{selectedPatient.prenom} {selectedPatient.nom}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Genre</label>
                <p className="text-lg font-semibold">{selectedPatient.genre}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Date de naissance</label>
                <p className="text-lg font-semibold">
                  {selectedPatient.date_naissance ? 
                    format(selectedPatient.date_naissance.toDate(), 'dd MMMM yyyy', { locale: fr }) : 
                    'Non renseignée'
                  }
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Âge</label>
                <p className="text-lg font-semibold">
                  {selectedPatient.date_naissance ? 
                    Math.floor((new Date().getTime() - selectedPatient.date_naissance.toDate().getTime()) / (365.25 * 24 * 60 * 60 * 1000)) 
                    : '?'} ans
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-lg font-semibold">{selectedPatient.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Téléphone</label>
                <p className="text-lg font-semibold">{selectedPatient.telephone}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Adresse</label>
              <p className="text-lg font-semibold">{selectedPatient.adresse}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Groupe sanguin</label>
                <Badge variant="secondary" className="text-sm">
                  {selectedPatient.groupe_sanguin}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Statut</label>
                <Badge variant={selectedPatient.actif ? 'success' : 'secondary'}>
                  {selectedPatient.actif ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </div>

            <div className="pt-4 border-t">
              <label className="text-sm font-medium text-muted-foreground">ID Patient</label>
              <p className="font-mono text-sm bg-muted px-2 py-1 rounded">
                {selectedPatient.patient_id}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default PatientsPage;