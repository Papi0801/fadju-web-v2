'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Clock,
  FileText,
  Eye,
  Edit,
  Plus,
  Activity,
  TrendingUp,
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
} from '@/components/ui';
import { RendezVousQueries } from '@/lib/firebase/firestore';
import { RendezVous } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Patient {
  id: string;
  nom: string;
  prenom?: string;
  telephone?: string;
  email?: string;
  dernierRdv?: Date;
  nombreConsultations: number;
  statut: 'actif' | 'inactif';
}

const PatientsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');

  useEffect(() => {
    fetchPatients();
  }, [user?.id]);

  useEffect(() => {
    filterPatients();
  }, [patients, searchTerm, selectedStatut]);

  const fetchPatients = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Récupérer tous les rendez-vous du médecin
      const rendezVous = await RendezVousQueries.getRendezVousByMedecin(user.id);
      
      // Grouper par patient
      const patientsMap = new Map<string, Patient>();
      
      rendezVous.forEach((rdv) => {
        if (!rdv.patient_id || !rdv.patient_nom) return;
        
        const existingPatient = patientsMap.get(rdv.patient_id);
        const rdvDate = rdv.date_rendez_vous.toDate();
        
        if (existingPatient) {
          existingPatient.nombreConsultations++;
          if (!existingPatient.dernierRdv || rdvDate > existingPatient.dernierRdv) {
            existingPatient.dernierRdv = rdvDate;
            existingPatient.telephone = rdv.patient_telephone || existingPatient.telephone;
            existingPatient.email = rdv.patient_email || existingPatient.email;
          }
        } else {
          // Séparer nom et prénom si possible
          const nomComplet = rdv.patient_nom.split(' ');
          const prenom = nomComplet.length > 1 ? nomComplet[0] : undefined;
          const nom = nomComplet.length > 1 ? nomComplet.slice(1).join(' ') : rdv.patient_nom;
          
          patientsMap.set(rdv.patient_id, {
            id: rdv.patient_id,
            nom,
            prenom,
            telephone: rdv.patient_telephone,
            email: rdv.patient_email,
            dernierRdv: rdvDate,
            nombreConsultations: 1,
            statut: 'actif', // TODO: Calculer selon la date du dernier RDV
          });
        }
      });
      
      const patientsList = Array.from(patientsMap.values());
      
      // Déterminer le statut (actif si consultation dans les 6 derniers mois)
      const sixMoisAgo = new Date();
      sixMoisAgo.setMonth(sixMoisAgo.getMonth() - 6);
      
      patientsList.forEach(patient => {
        patient.statut = patient.dernierRdv && patient.dernierRdv > sixMoisAgo ? 'actif' : 'inactif';
      });
      
      // Trier par dernière consultation (plus récente en premier)
      patientsList.sort((a, b) => {
        if (!a.dernierRdv && !b.dernierRdv) return 0;
        if (!a.dernierRdv) return 1;
        if (!b.dernierRdv) return -1;
        return b.dernierRdv.getTime() - a.dernierRdv.getTime();
      });
      
      setPatients(patientsList);
    } catch (error) {
      console.error('Erreur lors de la récupération des patients:', error);
      toast.error('Erreur lors du chargement des patients');
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    let filtered = patients;

    if (searchTerm) {
      filtered = filtered.filter(patient =>
        patient.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.telephone?.includes(searchTerm) ||
        patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatut) {
      filtered = filtered.filter(patient => patient.statut === selectedStatut);
    }

    setFilteredPatients(filtered);
  };

  const stats = {
    total: patients.length,
    actifs: patients.filter(p => p.statut === 'actif').length,
    inactifs: patients.filter(p => p.statut === 'inactif').length,
    consultationsTotales: patients.reduce((sum, p) => sum + p.nombreConsultations, 0),
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
            <h1 className="text-3xl font-bold text-foreground">Mes Patients</h1>
            <p className="text-muted-foreground mt-2">
              Gérez vos patients et leur suivi médical
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => router.push('/medecin/patients/add')}
            className="flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Nouveau patient</span>
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total patients</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
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
                  <p className="text-muted-foreground text-sm font-medium">Patients actifs</p>
                  <p className="text-2xl font-bold text-foreground">{stats.actifs}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-100 text-green-600">
                  <Activity className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Patients inactifs</p>
                  <p className="text-2xl font-bold text-foreground">{stats.inactifs}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-100 text-gray-600">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Consultations</p>
                  <p className="text-2xl font-bold text-foreground">{stats.consultationsTotales}</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                  <TrendingUp className="w-6 h-6" />
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
                  placeholder="Rechercher par nom, téléphone ou email..."
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
                <option value="actif">Actifs</option>
                <option value="inactif">Inactifs</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Liste des patients */}
        {filteredPatients.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun patient</h3>
              <p className="text-muted-foreground mb-4">
                {patients.length === 0 
                  ? 'Aucun patient enregistré pour le moment.'
                  : 'Aucun patient ne correspond à vos critères de recherche.'
                }
              </p>
              {patients.length === 0 && (
                <Button
                  variant="primary"
                  onClick={() => router.push('/medecin/patients/add')}
                >
                  Ajouter le premier patient
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatients.map((patient) => (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {patient.prenom} {patient.nom}
                          </h3>
                          <Badge 
                            variant={patient.statut === 'actif' ? 'success' : 'secondary'}
                            className="text-xs"
                          >
                            {patient.statut === 'actif' ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => router.push(`/medecin/patients/${patient.id}`)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Voir le dossier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/medecin/patients/${patient.id}/edit`)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/medecin/consultations/add?patient=${patient.id}`)}
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Nouveau RDV
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-2 text-sm">
                      {patient.telephone && (
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          <span>{patient.telephone}</span>
                        </div>
                      )}
                      
                      {patient.email && (
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{patient.email}</span>
                        </div>
                      )}
                      
                      {patient.dernierRdv && (
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Dernière visite: {format(patient.dernierRdv, 'dd/MM/yyyy')}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Consultations</span>
                        <Badge variant="outline">
                          {patient.nombreConsultations}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4 flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/medecin/patients/${patient.id}`)}
                        className="flex-1"
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        Dossier
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => router.push(`/medecin/consultations/add?patient=${patient.id}`)}
                        className="flex-1"
                      >
                        <Calendar className="w-4 h-4 mr-1" />
                        RDV
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Message d'information pour nouveau médecin */}
        {patients.length === 0 && (
          <Card 
            className={`border-blue-200 bg-blue-50 dark:bg-blue-900/20 ${theme === 'light' ? 'info-box-light' : ''}`}
          >
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Users className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" style={theme === 'light' ? { color: 'white' } : {}} />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200" style={theme === 'light' ? { color: 'white' } : {}}>
                    Vos patients apparaîtront ici
                  </h3>
                  <p className="text-blue-700 dark:text-blue-300 mt-1" style={theme === 'light' ? { color: 'white' } : {}}>
                    Les patients qui prennent rendez-vous avec vous via l'application mobile seront automatiquement ajoutés à cette liste.
                    Vous pourrez ainsi suivre leur historique et gérer leurs consultations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default PatientsPage;