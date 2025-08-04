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
} from '@/components/ui';
import { rendezVousService } from '@/lib/firebase/rendez-vous-service';
import { dossierPatientService } from '@/lib/firebase/dossier-patient';
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

  const handleStatusChange = async (rdvId: string, newStatus: 'termine' | 'annule') => {
    try {
      // TODO: Implémenter la mise à jour du statut
      toast.success(`Consultation ${newStatus === 'termine' ? 'marquée comme terminée' : 'annulée'}`);
      fetchRendezVous();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const getStatutBadgeVariant = (statut: string) => {
    switch (statut) {
      case 'confirme':
      case 'confirmee':
        return 'primary';
      case 'termine':
      case 'terminee':
        return 'success';
      case 'annule':
      case 'annulee':
        return 'destructive';
      case 'reportee':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'confirme':
      case 'confirmee':
        return 'Confirmé';
      case 'termine':
      case 'terminee':
        return 'Terminé';
      case 'annule':
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
      case 'confirme':
      case 'confirmee':
        return <CheckCircle className="w-4 h-4" />;
      case 'termine':
      case 'terminee':
        return <CheckCircle className="w-4 h-4" />;
      case 'annule':
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
        a.date_rendez_vous.toMillis() - b.date_rendez_vous.toMillis()
      )
    }));
  };

  const stats = {
    total: rendezVous.length,
    confirmes: rendezVous.filter(rdv => rdv.statut === 'confirme' || rdv.statut === 'confirmee').length,
    termines: rendezVous.filter(rdv => rdv.statut === 'termine' || rdv.statut === 'terminee').length,
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
              Gérez vos rendez-vous et consultations
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => router.push('/medecin/consultations/add')}
            className="flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Nouveau RDV</span>
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
                <option value="confirme">Confirmé</option>
                <option value="confirmee">Confirmé (nouveau)</option>
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
                  ? 'Aucun rendez-vous programmé pour le moment.'
                  : 'Aucun rendez-vous ne correspond à vos critères de recherche.'
                }
              </p>
              {rendezVous.length === 0 && (
                <Button
                  variant="primary"
                  onClick={() => router.push('/medecin/consultations/add')}
                >
                  Créer le premier rendez-vous
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
                                      <span>{rdv.creneau_horaire}</span>
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
                                {rdv.statut === 'confirme' && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleStatusChange(rdv.id, 'termine')}
                                      className="text-green-600 hover:text-green-700"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Marquer terminé
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleStatusChange(rdv.id, 'annule')}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <XCircle className="w-4 h-4 mr-1" />
                                      Annuler
                                    </Button>
                                  </>
                                )}
                              </div>
                              
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
                                    onClick={() => router.push(`/medecin/patients/${rdv.patient_id}`)}
                                  >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Dossier patient
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
      </motion.div>
    </DashboardLayout>
  );
};

export default ConsultationsPage;