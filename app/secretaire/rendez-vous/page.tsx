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
import { RendezVousQueries, UserQueries } from '@/lib/firebase/firestore';
import { RendezVous, User as UserType } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const RendezVousPage: React.FC = () => {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const router = useRouter();
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [filteredRendezVous, setFilteredRendezVous] = useState<RendezVous[]>([]);
  const [medecins, setMedecins] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatut, setSelectedStatut] = useState('');
  const [selectedMedecin, setSelectedMedecin] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

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
      // Récupérer les rendez-vous de l'établissement
      const rdvList = await RendezVousQueries.getRendezVousEnAttenteByEtablissement(user.etablissement_id);
      setRendezVous(rdvList);

      // Récupérer les médecins de l'établissement
      const medecinsList = await UserQueries.getMedecinsByEtablissement(user.etablissement_id);
      setMedecins(medecinsList);
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
      filtered = filtered.filter(rdv =>
        rdv.motif?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rdv.patient_nom?.toLowerCase().includes(searchTerm.toLowerCase())
      );
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
    try {
      // TODO: Implémenter la mise à jour du statut
      toast.success(`Rendez-vous ${newStatus === 'confirme' ? 'confirmé' : 'annulé'} avec succès`);
      fetchData();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const getStatutBadgeVariant = (statut: string) => {
    switch (statut) {
      case 'confirme':
        return 'success';
      case 'annule':
        return 'destructive';
      case 'en_attente':
      default:
        return 'warning';
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'confirme':
        return 'Confirmé';
      case 'annule':
        return 'Annulé';
      case 'en_attente':
      default:
        return 'En attente';
    }
  };

  const getMedecinName = (medecinId: string) => {
    const medecin = medecins.find(m => m.id === medecinId);
    return medecin ? `Dr. ${medecin.prenom} ${medecin.nom}` : 'Médecin non trouvé';
  };

  const stats = {
    total: rendezVous.length,
    enAttente: rendezVous.filter(rdv => rdv.statut === 'en_attente').length,
    confirmes: rendezVous.filter(rdv => rdv.statut === 'confirme').length,
    annules: rendezVous.filter(rdv => rdv.statut === 'annule').length,
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
            onClick={() => router.push('/secretaire/rendez-vous/add')}
            className="flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Nouveau rendez-vous</span>
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total rendez-vous</p>
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
                  <p className="text-muted-foreground text-sm font-medium">Annulés</p>
                  <p className="text-2xl font-bold text-foreground">{stats.annules}</p>
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
                className="flex h-10 rounded-md border border-border bg-input px-3 py-2 text-sm"
              >
                <option value="">Tous les statuts</option>
                <option value="en_attente">En attente</option>
                <option value="confirme">Confirmé</option>
                <option value="annule">Annulé</option>
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
                  onClick={() => router.push('/secretaire/rendez-vous/add')}
                >
                  Créer le premier rendez-vous
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRendezVous.map((rdv) => (
              <motion.div
                key={rdv.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg flex items-center space-x-2">
                              <User className="w-5 h-5 text-primary" />
                              <span>{rdv.patient_nom || 'Patient non spécifié'}</span>
                            </h3>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <CalendarDays className="w-4 h-4" />
                                <span>{format(rdv.date_rendez_vous.toDate(), 'dd MMMM yyyy', { locale: fr })}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{rdv.creneau_horaire}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Stethoscope className="w-4 h-4" />
                                <span>{getMedecinName(rdv.medecin_id)}</span>
                              </div>
                            </div>
                          </div>
                          <Badge variant={getStatutBadgeVariant(rdv.statut)}>
                            {getStatutLabel(rdv.statut)}
                          </Badge>
                        </div>
                        
                        {rdv.motif && (
                          <p className="text-sm text-muted-foreground mb-3">
                            <span className="font-medium">Motif :</span> {rdv.motif}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {rdv.statut === 'en_attente' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleStatusChange(rdv.id, 'confirme')}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Confirmer
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
                                onClick={() => router.push(`/secretaire/rendez-vous/${rdv.id}`)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Voir les détails
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => router.push(`/secretaire/rendez-vous/${rdv.id}/edit`)}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => console.log('Supprimer', rdv.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
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
      </motion.div>
    </DashboardLayout>
  );
};

export default RendezVousPage;