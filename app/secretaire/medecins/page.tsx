'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  Stethoscope,
  CheckCircle,
  XCircle,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';
import { UserQueries } from '@/lib/firebase/firestore';
import { User } from '@/types';

const MedecinsPage: React.FC = () => {
  const { user } = useAuthStore();
  const router = useRouter();
  const [medecins, setMedecins] = useState<User[]>([]);
  const [filteredMedecins, setFilteredMedecins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialite, setSelectedSpecialite] = useState('');

  useEffect(() => {
    fetchMedecins();
  }, [user?.etablissement_id]);

  useEffect(() => {
    filterMedecins();
  }, [medecins, searchTerm, selectedSpecialite]);

  const fetchMedecins = async () => {
    if (!user?.etablissement_id) {
      setLoading(false);
      return;
    }

    try {
      const medecinsList = await UserQueries.getAllMedecinsByEtablissement(user.etablissement_id);
      setMedecins(medecinsList);
    } catch (error) {
      console.error('Erreur lors de la récupération des médecins:', error);
      toast.error('Erreur lors du chargement des médecins');
    } finally {
      setLoading(false);
    }
  };

  const filterMedecins = () => {
    let filtered = medecins;

    if (searchTerm) {
      filtered = filtered.filter(medecin =>
        medecin.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medecin.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medecin.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedSpecialite) {
      filtered = filtered.filter(medecin =>
        (medecin as any).specialite === selectedSpecialite
      );
    }

    setFilteredMedecins(filtered);
  };

  const handleToggleStatus = async (medecinId: string, currentStatus: boolean) => {
    try {
      // TODO: Implémenter la mise à jour du statut
      toast.success(`Médecin ${currentStatus ? 'désactivé' : 'activé'} avec succès`);
      fetchMedecins();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du statut');
    }
  };

  const handleDelete = async (medecinId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce médecin ?')) {
      return;
    }

    try {
      // TODO: Implémenter la suppression
      toast.success('Médecin supprimé avec succès');
      fetchMedecins();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const getSpecialites = () => {
    const specialites = [...new Set(medecins.map(m => (m as any).specialite).filter(Boolean))];
    return specialites;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loading text="Chargement des médecins..." />
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
            <h1 className="text-3xl font-bold text-foreground">Gestion des Médecins</h1>
            <p className="text-muted-foreground mt-2">
              Gérez les médecins de votre établissement
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => router.push('/secretaire/medecins/add')}
            className="flex items-center space-x-2"
          >
            <UserPlus className="w-5 h-5" />
            <span>Ajouter un médecin</span>
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Total médecins</p>
                  <p className="text-2xl font-bold text-foreground">{medecins.length}</p>
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
                  <p className="text-muted-foreground text-sm font-medium">Actifs</p>
                  <p className="text-2xl font-bold text-foreground">
                    {medecins.filter(m => m.actif).length}
                  </p>
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
                  <p className="text-muted-foreground text-sm font-medium">Inactifs</p>
                  <p className="text-2xl font-bold text-foreground">
                    {medecins.filter(m => !m.actif).length}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-red-100 text-red-600">
                  <XCircle className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Spécialités</p>
                  <p className="text-2xl font-bold text-foreground">
                    {getSpecialites().length}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                  <Stethoscope className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et recherche */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Rechercher un médecin..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="w-5 h-5 text-muted-foreground" />}
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedSpecialite}
                  onChange={(e) => setSelectedSpecialite(e.target.value)}
                  className="flex h-10 rounded-md border border-border bg-input px-3 py-2 text-sm"
                >
                  <option value="">Toutes les spécialités</option>
                  {getSpecialites().map(specialite => (
                    <option key={specialite} value={specialite}>
                      {specialite}
                    </option>
                  ))}
                </select>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des médecins */}
        {filteredMedecins.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {medecins.length === 0 ? 'Aucun médecin ajouté' : 'Aucun résultat'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {medecins.length === 0 
                  ? 'Commencez par ajouter des médecins à votre établissement.'
                  : 'Aucun médecin ne correspond à vos critères de recherche.'
                }
              </p>
              {medecins.length === 0 && (
                <Button
                  variant="primary"
                  onClick={() => router.push('/secretaire/medecins/add')}
                >
                  Ajouter mon premier médecin
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredMedecins.map((medecin) => (
              <motion.div
                key={medecin.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <Stethoscope className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-foreground">
                              Dr. {medecin.prenom} {medecin.nom}
                            </h3>
                            <Badge variant={medecin.actif ? 'success' : 'secondary'}>
                              {medecin.actif ? 'Actif' : 'Inactif'}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {(medecin as any).specialite || 'Spécialité non renseignée'}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                              <Mail className="w-4 h-4" />
                              <span>{medecin.email}</span>
                            </div>
                            {medecin.telephone && (
                              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                <Phone className="w-4 h-4" />
                                <span>{medecin.telephone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/secretaire/medecins/${medecin.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => router.push(`/secretaire/medecins/${medecin.id}/edit`)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleStatus(medecin.id, medecin.actif)}
                            >
                              {medecin.actif ? (
                                <>
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Désactiver
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Activer
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(medecin.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default MedecinsPage;