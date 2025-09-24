'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Search,
  Filter,
  MapPin,
  Phone,
  Mail,
  Star,
  Users,
  Calendar,
  Plus,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useEtablissementStore } from '@/store';
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
import { EtablissementSante } from '@/types';
import { formatDate, phoneNumberFormat } from '@/lib/utils';
import { REGIONS_SENEGAL, ETABLISSEMENT_TYPES } from '@/lib/constants';

const EtablissementsPage: React.FC = () => {
  const {
    etablissements,
    fetchEtablissements,
    deleteEtablissement,
    loading,
  } = useEtablissementStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedEtablissement, setSelectedEtablissement] = useState<EtablissementSante | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchEtablissements();
  }, [fetchEtablissements]);

  // Filtrage des établissements
  const filteredEtablissements = etablissements.filter((etablissement) => {
    const matchesSearch =
      etablissement.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      etablissement.ville.toLowerCase().includes(searchTerm.toLowerCase()) ||
      etablissement.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRegion = !selectedRegion || etablissement.region === selectedRegion;
    const matchesType = !selectedType || etablissement.type === selectedType;

    return matchesSearch && matchesRegion && matchesType;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet établissement ?')) {
      return;
    }

    setDeleteLoading(id);
    try {
      await deleteEtablissement(id);
      toast.success('Établissement supprimé avec succès');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    } finally {
      setDeleteLoading(null);
    }
  };

  const openDetailModal = (etablissement: EtablissementSante) => {
    setSelectedEtablissement(etablissement);
    setIsDetailModalOpen(true);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loading text="Chargement des établissements..." />
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Gestion des Établissements
            </h1>
            <p className="text-muted-foreground mt-2">
              Gérez tous les établissements de santé validés
            </p>
          </div>
          <Badge variant="primary" size="lg">
            {filteredEtablissements.length} établissement(s)
          </Badge>
        </div>

        {/* Filtres */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Rechercher par nom, ville ou description..."
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
                  <option value="hopital">Hôpital</option>
                  <option value="clinique">Clinique</option>
                  <option value="cabinet">Cabinet</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des établissements */}
        {filteredEtablissements.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Aucun établissement trouvé
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedRegion || selectedType
                  ? 'Aucun établissement ne correspond à vos critères de recherche.'
                  : 'Aucun établissement n\'a été validé pour le moment.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredEtablissements.map((etablissement) => (
              <motion.div
                key={etablissement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
                          <Building2 className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">
                            {etablissement.nom}
                          </CardTitle>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {etablissement.ville}, {etablissement.region}
                            </span>
                            <span className="flex items-center">
                              <Star className="w-4 h-4 mr-1 text-yellow-500" />
                              {etablissement.note}/5 ({etablissement.nombre_avis} avis)
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="primary" className="capitalize">
                          {etablissement.type}
                        </Badge>
                        <Badge variant="success">
                          Validé
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      {/* Contact */}
                      <div>
                        <h4 className="font-semibold mb-2">Contact</h4>
                        <div className="space-y-1 text-sm">
                          <p className="flex items-center text-muted-foreground">
                            <Phone className="w-3 h-3 mr-2" />
                            {phoneNumberFormat(etablissement.telephone)}
                          </p>
                          <p className="flex items-center text-muted-foreground">
                            <Mail className="w-3 h-3 mr-2" />
                            {etablissement.email}
                          </p>
                        </div>
                      </div>

                      {/* Services */}
                      <div>
                        <h4 className="font-semibold mb-2">Services</h4>
                        <div className="flex flex-wrap gap-1">
                          {etablissement.services.slice(0, 3).map((service, index) => (
                            <Badge key={index} variant="secondary" size="sm">
                              {service}
                            </Badge>
                          ))}
                          {etablissement.services.length > 3 && (
                            <Badge variant="secondary" size="sm">
                              +{etablissement.services.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Caractéristiques */}
                      <div>
                        <h4 className="font-semibold mb-2">Caractéristiques</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${etablissement.ouvert_24h ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span className="text-muted-foreground">
                              {etablissement.ouvert_24h ? 'Ouvert 24h/24' : 'Horaires limités'}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${etablissement.service_urgence ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span className="text-muted-foreground">
                              {etablissement.service_urgence ? 'Service urgence' : 'Pas d\'urgence'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {etablissement.description}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Validé le {formatDate(etablissement.date_creation.toDate())}
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openDetailModal(etablissement)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Détails
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(etablissement.id)}
                          loading={deleteLoading === etablissement.id}
                          disabled={deleteLoading !== null}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Modal de détails */}
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Détails de l'établissement"
          size="xl"
        >
          {selectedEtablissement && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start space-x-4">
                <div className="w-20 h-20 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold">{selectedEtablissement.nom}</h3>
                  <p className="text-muted-foreground mt-1">
                    {selectedEtablissement.description}
                  </p>
                  <div className="flex items-center space-x-4 mt-3">
                    <Badge variant="primary" className="capitalize">
                      {selectedEtablissement.type}
                    </Badge>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-1 text-yellow-500" />
                      <span className="font-medium">{selectedEtablissement.note}/5</span>
                      <span className="text-muted-foreground ml-1">
                        ({selectedEtablissement.nombre_avis} avis)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informations détaillées */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Localisation */}
                <div>
                  <h4 className="font-semibold mb-3">Localisation</h4>
                  <div className="space-y-2">
                    <p><strong>Adresse:</strong> {selectedEtablissement.adresse}</p>
                    <p><strong>Ville:</strong> {selectedEtablissement.ville}</p>
                    <p><strong>Région:</strong> {selectedEtablissement.region}</p>
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <h4 className="font-semibold mb-3">Contact</h4>
                  <div className="space-y-2">
                    <p><strong>Téléphone:</strong> {phoneNumberFormat(selectedEtablissement.telephone)}</p>
                    <p><strong>Email:</strong> {selectedEtablissement.email}</p>
                    {selectedEtablissement.site_web && (
                      <p>
                        <strong>Site web:</strong>{' '}
                        <a
                          href={selectedEtablissement.site_web}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {selectedEtablissement.site_web}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Services et spécialités */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold mb-3">Services proposés</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEtablissement.services.map((service, index) => (
                      <Badge key={index} variant="secondary">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Spécialités médicales</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEtablissement.specialites.map((specialite, index) => (
                      <Badge key={index} variant="primary">
                        {specialite}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Horaires */}
              <div>
                <h4 className="font-semibold mb-3">Horaires de travail</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(selectedEtablissement.horaires_travail).map(([jour, horaire]) => (
                    <div key={jour} className="bg-muted p-3 rounded-lg">
                      <p className="font-medium capitalize">{jour}</p>
                      <p className="text-sm text-muted-foreground">{horaire}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Caractéristiques */}
              <div>
                <h4 className="font-semibold mb-3">Caractéristiques</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${selectedEtablissement.ouvert_24h ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span>Ouvert 24h/24</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${selectedEtablissement.service_urgence ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span>Service d'urgence</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </motion.div>
    </DashboardLayout>
  );
};

export default EtablissementsPage;