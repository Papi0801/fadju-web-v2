'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Phone,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  Shield,
  Zap,
  Search,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { DashboardLayout } from '@/components/layout';
import {
  Button,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Modal,
  Loading,
} from '@/components/ui';
import { ContactUrgence } from '@/types';
import { FirestoreService } from '@/lib/firebase/firestore';
import { COLLECTIONS, REGIONS_SENEGAL } from '@/lib/constants';

// Schema de validation pour les contacts d'urgence
const contactUrgenceSchema = yup.object({
  nom: yup.string().required('Le nom est requis'),
  description: yup.string().required('La description est requise'),
  telephone: yup.string().required('Le téléphone est requis'),
  type: yup.string().oneOf(['medical', 'pompier', 'police']).required('Le type est requis'),
  region: yup.string().required('La région est requise'),
  priorite: yup.number().min(1).max(5).required('La priorité est requise'),
  actif: yup.boolean().required(),
});

type ContactUrgenceForm = yup.InferType<typeof contactUrgenceSchema>;

const contactUrgenceService = new FirestoreService<ContactUrgence>(COLLECTIONS.CONTACTS_URGENCE);

const SuperAdminUrgencesPage: React.FC = () => {
  const [contacts, setContacts] = useState<ContactUrgence[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactUrgence | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ContactUrgenceForm>({
    resolver: yupResolver(contactUrgenceSchema),
    defaultValues: {
      actif: true,
      priorite: 3,
    },
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const data = await contactUrgenceService.getAll();
      setContacts(data);
    } catch (error) {
      console.error('Erreur lors du chargement des contacts:', error);
      toast.error('Erreur lors du chargement des contacts');
    } finally {
      setLoading(false);
    }
  };

  // Filtrage des contacts
  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.telephone.includes(searchTerm);

    const matchesRegion = !selectedRegion || contact.region === selectedRegion;
    const matchesType = !selectedType || contact.type === selectedType;

    return matchesSearch && matchesRegion && matchesType;
  });

  // Tri par priorité puis par nom
  const sortedContacts = filteredContacts.sort((a, b) => {
    if (a.priorite !== b.priorite) {
      return b.priorite - a.priorite; // Priorité décroissante
    }
    return a.nom.localeCompare(b.nom);
  });

  const openCreateModal = () => {
    setEditingContact(null);
    reset({
      actif: true,
      priorite: 3,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (contact: ContactUrgence) => {
    setEditingContact(contact);
    setValue('nom', contact.nom);
    setValue('description', contact.description);
    setValue('telephone', contact.telephone);
    setValue('type', contact.type);
    setValue('region', contact.region);
    setValue('priorite', contact.priorite);
    setValue('actif', contact.actif);
    setIsModalOpen(true);
  };

  const onSubmit = async (data: ContactUrgenceForm) => {
    setActionLoading('submit');
    try {
      if (editingContact) {
        await contactUrgenceService.update(editingContact.id, data);
        toast.success('Contact mis à jour avec succès');
      } else {
        await contactUrgenceService.create(data);
        toast.success('Contact créé avec succès');
      }
      
      await fetchContacts();
      setIsModalOpen(false);
      reset();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string, nom: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${nom}" ?`)) {
      return;
    }

    setActionLoading(id);
    try {
      await contactUrgenceService.delete(id);
      toast.success('Contact supprimé avec succès');
      await fetchContacts();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleStatus = async (contact: ContactUrgence) => {
    setActionLoading(contact.id);
    try {
      await contactUrgenceService.update(contact.id, { actif: !contact.actif });
      toast.success(`Contact ${!contact.actif ? 'activé' : 'désactivé'} avec succès`);
      await fetchContacts();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setActionLoading(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'medical':
        return <Phone className="w-5 h-5 text-green-600" />;
      case 'pompier':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'police':
        return <Shield className="w-5 h-5 text-blue-600" />;
      default:
        return <Phone className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'medical':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pompier':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'police':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priorite: number) => {
    if (priorite >= 4) return 'bg-red-100 text-red-800 border-red-200';
    if (priorite >= 3) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loading text="Chargement des contacts d'urgence..." />
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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Gestion des Contacts d'Urgence
            </h1>
            <p className="text-muted-foreground mt-2">
              Gérez les numéros d'urgence disponibles dans l'application
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="primary" size="lg" className="px-4 py-2">
              {filteredContacts.length} contact(s)
            </Badge>
            <Button
              variant="primary"
              onClick={openCreateModal}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter</span>
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Médical</p>
                  <p className="text-2xl font-bold">{contacts.filter(c => c.type === 'medical').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pompiers</p>
                  <p className="text-2xl font-bold">{contacts.filter(c => c.type === 'pompier').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Police</p>
                  <p className="text-2xl font-bold">{contacts.filter(c => c.type === 'police').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Actifs</p>
                  <p className="text-2xl font-bold">{contacts.filter(c => c.actif).length}</p>
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
                  placeholder="Rechercher par nom, description ou téléphone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>
              
              <div>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Toutes les régions</option>
                  <option value="National">National</option>
                  {REGIONS_SENEGAL.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Tous les types</option>
                  <option value="medical">Médical</option>
                  <option value="pompier">Pompiers</option>
                  <option value="police">Police</option>
                </select>
              </div>
            </div>

            {(searchTerm || selectedRegion || selectedType) && (
              <div className="mt-4 flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Filtres actifs:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="text-xs">
                    Recherche: "{searchTerm}"
                  </Badge>
                )}
                {selectedRegion && (
                  <Badge variant="secondary" className="text-xs">
                    Région: {selectedRegion}
                  </Badge>
                )}
                {selectedType && (
                  <Badge variant="secondary" className="text-xs">
                    Type: {selectedType}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedRegion('');
                    setSelectedType('');
                  }}
                  className="text-xs"
                >
                  Effacer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Liste des contacts */}
        {sortedContacts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Phone className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Aucun contact trouvé
              </h3>
              <p className="text-muted-foreground mb-4">
                {contacts.length === 0 
                  ? 'Aucun contact d\'urgence n\'a été configuré.'
                  : 'Aucun contact ne correspond à vos critères de recherche.'}
              </p>
              <Button variant="primary" onClick={openCreateModal}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter le premier contact
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sortedContacts.map((contact, index) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.005 }}
              >
                <Card className={`hover:shadow-lg transition-all duration-300 ${
                  !contact.actif ? 'opacity-60' : ''
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center">
                          {getTypeIcon(contact.type)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-bold text-foreground mb-1">
                                {contact.nom}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-2">
                                {contact.description}
                              </p>
                              <div className="flex items-center space-x-4 text-sm">
                                <span className="flex items-center text-primary font-medium">
                                  <Phone className="w-4 h-4 mr-1" />
                                  {contact.telephone}
                                </span>
                                <span className="flex items-center text-muted-foreground">
                                  <MapPin className="w-4 h-4 mr-1" />
                                  {contact.region}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Badge className={getTypeColor(contact.type)} variant="secondary">
                                {contact.type}
                              </Badge>
                              <Badge className={getPriorityColor(contact.priorite)} variant="secondary">
                                Priorité {contact.priorite}
                              </Badge>
                              <Badge variant={contact.actif ? "success" : "destructive"}>
                                {contact.actif ? 'Actif' : 'Inactif'}
                              </Badge>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleStatus(contact)}
                                loading={actionLoading === contact.id}
                                disabled={actionLoading !== null}
                                className="flex items-center space-x-1"
                              >
                                {contact.actif ? (
                                  <XCircle className="w-4 h-4" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                                <span>{contact.actif ? 'Désactiver' : 'Activer'}</span>
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditModal(contact)}
                                className="flex items-center space-x-1"
                              >
                                <Edit className="w-4 h-4" />
                                <span>Modifier</span>
                              </Button>

                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(contact.id, contact.nom)}
                                loading={actionLoading === contact.id}
                                disabled={actionLoading !== null}
                                className="flex items-center space-x-1"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Supprimer</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Modal de création/édition */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingContact ? 'Modifier le contact' : 'Ajouter un contact d\'urgence'}
          size="md"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                {...register('nom')}
                label="Nom du service"
                placeholder="Centre Antipoison"
                error={errors.nom?.message}
                required
              />

              <Input
                {...register('telephone')}
                label="Numéro de téléphone"
                placeholder="+221 33 XXX XX XX"
                error={errors.telephone?.message}
                required
              />
            </div>

            <Input
              {...register('description')}
              label="Description"
              placeholder="Centre National d'Information Toxicologique"
              error={errors.description?.message}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Type de service <span className="text-destructive">*</span>
                </label>
                <select
                  {...register('type')}
                  className="flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Sélectionner...</option>
                  <option value="medical">Médical</option>
                  <option value="pompier">Pompiers</option>
                  <option value="police">Police</option>
                </select>
                {errors.type && (
                  <p className="text-sm text-destructive mt-1">{errors.type.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Région <span className="text-destructive">*</span>
                </label>
                <select
                  {...register('region')}
                  className="flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Sélectionner...</option>
                  <option value="National">National</option>
                  {REGIONS_SENEGAL.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
                {errors.region && (
                  <p className="text-sm text-destructive mt-1">{errors.region.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Priorité <span className="text-destructive">*</span>
                </label>
                <select
                  {...register('priorite', { valueAsNumber: true })}
                  className="flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value={5}>5 - Très haute</option>
                  <option value={4}>4 - Haute</option>
                  <option value={3}>3 - Moyenne</option>
                  <option value={2}>2 - Basse</option>
                  <option value={1}>1 - Très basse</option>
                </select>
                {errors.priorite && (
                  <p className="text-sm text-destructive mt-1">{errors.priorite.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                {...register('actif')}
                type="checkbox"
                id="actif"
                className="rounded border-border"
              />
              <label htmlFor="actif" className="text-sm font-medium">
                Contact actif
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={actionLoading === 'submit'}
                disabled={actionLoading !== null}
              >
                {editingContact ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </form>
        </Modal>
      </motion.div>
    </DashboardLayout>
  );
};

export default SuperAdminUrgencesPage;