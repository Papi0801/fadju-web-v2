'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  User,
  Calendar,
  Phone,
  Mail,
  Eye,
  Filter,
  RefreshCw
} from 'lucide-react';

import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Loading } from '@/components/ui';
import { useAuthStore } from '@/store';
import { rendezVousService } from '@/lib/firebase/rendez-vous-service';
import { dossierPatientService } from '@/lib/firebase/dossier-patient';
import { RendezVous, DossierPatient } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface PatientWithRdv extends DossierPatient {
  dernierRdv?: Date;
  prochainRdv?: Date;
  nombreRdv: number;
}

const MedecinPatientsPage: React.FC = () => {
  const { user } = useAuthStore();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<PatientWithRdv[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientWithRdv[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'tous' | 'recents' | 'programmes'>('tous');

  useEffect(() => {
    fetchPatients();
  }, [user?.id]);

  useEffect(() => {
    filterPatients();
  }, [patients, searchTerm, filter]);

  const fetchPatients = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Récupérer tous les rendez-vous du médecin
      const rendezVous = await rendezVousService.getRendezVousByMedecin(user.id);
      
      // Extraire les IDs patients uniques
      const patientIds = [...new Set(rendezVous.map(rdv => rdv.patient_id))];
      
      // Récupérer les dossiers patients
      const patientsData: PatientWithRdv[] = [];
      
      for (const patientId of patientIds) {
        const dossier = await dossierPatientService.getByPatientId(patientId);
        if (dossier) {
          // Calculer les statistiques pour ce patient
          const rdvPatient = rendezVous.filter(rdv => rdv.patient_id === patientId);
          const rdvPasses = rdvPatient.filter(rdv => rdv.date_rendez_vous && rdv.date_rendez_vous.toDate() < new Date());
          const rdvFuturs = rdvPatient.filter(rdv => rdv.date_rendez_vous && rdv.date_rendez_vous.toDate() > new Date());
          
          const dernierRdv = rdvPasses.length > 0 
            ? rdvPasses.sort((a, b) => b.date_rendez_vous.toDate().getTime() - a.date_rendez_vous.toDate().getTime())[0].date_rendez_vous.toDate()
            : undefined;
            
          const prochainRdv = rdvFuturs.length > 0
            ? rdvFuturs.sort((a, b) => a.date_rendez_vous.toDate().getTime() - b.date_rendez_vous.toDate().getTime())[0].date_rendez_vous.toDate()
            : undefined;

          patientsData.push({
            ...dossier,
            dernierRdv,
            prochainRdv,
            nombreRdv: rdvPatient.length,
          });
        }
      }

      // Trier par nom
      patientsData.sort((a, b) => a.nom.localeCompare(b.nom));
      setPatients(patientsData);

    } catch (error) {
      console.error('Erreur lors de la récupération des patients:', error);
      toast.error('Erreur lors du chargement des patients');
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    let filtered = patients;

    // Filtrer par terme de recherche
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(patient =>
        patient.nom.toLowerCase().includes(searchLower) ||
        patient.prenom.toLowerCase().includes(searchLower) ||
        patient.email.toLowerCase().includes(searchLower) ||
        patient.telephone.includes(searchTerm)
      );
    }

    // Filtrer par catégorie
    switch (filter) {
      case 'recents':
        filtered = filtered.filter(patient => 
          patient.dernierRdv && 
          patient.dernierRdv > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 jours
        );
        break;
      case 'programmes':
        filtered = filtered.filter(patient => patient.prochainRdv);
        break;
      default:
        // 'tous' - pas de filtre supplémentaire
        break;
    }

    setFilteredPatients(filtered);
  };

  const getPatientAge = (dateNaissance: Date) => {
    return dossierPatientService.calculateAge(dateNaissance);
  };

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
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mes patients</h1>
            <p className="text-muted-foreground mt-2">
              Gérez les dossiers de vos patients
            </p>
          </div>
          <Button
            onClick={() => fetchPatients()}
            variant="secondary"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Actualiser</span>
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total patients</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{patients.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Patients récents</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {patients.filter(p => p.dernierRdv && p.dernierRdv > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-100 text-green-600">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">RDV programmés</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {patients.filter(p => p.prochainRdv).length}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Consultations totales</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {patients.reduce((total, patient) => total + patient.nombreRdv, 0)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-orange-100 text-orange-600">
                  <User className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et recherche */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Rechercher un patient (nom, prénom, email, téléphone...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="w-5 h-5 text-muted-foreground" />}
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  variant={filter === 'tous' ? 'primary' : 'outline'}
                  onClick={() => setFilter('tous')}
                  size="sm"
                >
                  Tous ({patients.length})
                </Button>
                <Button
                  variant={filter === 'recents' ? 'primary' : 'outline'}
                  onClick={() => setFilter('recents')}
                  size="sm"
                >
                  Récents ({patients.filter(p => p.dernierRdv && p.dernierRdv > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length})
                </Button>
                <Button
                  variant={filter === 'programmes' ? 'primary' : 'outline'}
                  onClick={() => setFilter('programmes')}
                  size="sm"
                >
                  Programmés ({patients.filter(p => p.prochainRdv).length})
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
              <span>Patients ({filteredPatients.length})</span>
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
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-lg">
                            {patient.prenom} {patient.nom}
                          </h3>
                          <Badge variant="secondary">
                            {getPatientAge(patient.date_naissance.toDate())} ans • {patient.genre}
                          </Badge>
                          {patient.groupe_sanguin && (
                            <Badge variant="secondary" className="text-red-600 border-red-200">
                              {patient.groupe_sanguin}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Mail className="w-4 h-4" />
                            <span>{patient.email}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Phone className="w-4 h-4" />
                            <span>{patient.telephone}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-sm">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span className="text-blue-600">
                              {patient.nombreRdv} consultation{patient.nombreRdv > 1 ? 's' : ''}
                            </span>
                          </div>
                          {patient.dernierRdv && (
                            <div className="text-muted-foreground">
                              Dernière visite: {format(patient.dernierRdv, 'dd/MM/yyyy')}
                            </div>
                          )}
                          {patient.prochainRdv && (
                            <div className="text-green-600">
                              Prochain RDV: {format(patient.prochainRdv, 'dd/MM/yyyy')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => router.push(`/medecin/patients/${patient.patient_id}`)}
                      className="flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Voir dossier</span>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {searchTerm || filter !== 'tous' ? 'Aucun patient trouvé' : 'Aucun patient'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm || filter !== 'tous' 
                    ? 'Essayez de modifier vos critères de recherche'
                    : 'Les patients apparaîtront ici dès qu\'ils prendront rendez-vous avec vous'
                  }
                </p>
                {(searchTerm || filter !== 'tous') && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSearchTerm('');
                      setFilter('tous');
                    }}
                  >
                    Effacer les filtres
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default MedecinPatientsPage;