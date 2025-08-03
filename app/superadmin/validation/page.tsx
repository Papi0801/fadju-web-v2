'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  MapPin,
  Phone,
  Mail,
  Globe,
  Building2,
  Star,
  Clock,
  Eye,
  AlertCircle,
  Filter,
  Search,
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
import { REGIONS_SENEGAL } from '@/lib/constants';
import { EmailService } from '@/lib/email/email-service';

const SuperAdminValidationPage: React.FC = () => {
  const {
    etablissementsEnAttente,
    fetchEtablissementsEnAttente,
    validateEtablissement,
    loading,
  } = useEtablissementStore();

  const [selectedEtablissement, setSelectedEtablissement] = useState<EtablissementSante | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    fetchEtablissementsEnAttente();
  }, [fetchEtablissementsEnAttente]);

  // Filtrage des établissements
  const filteredEtablissements = etablissementsEnAttente.filter((etablissement) => {
    const matchesSearch =
      etablissement.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      etablissement.ville.toLowerCase().includes(searchTerm.toLowerCase()) ||
      etablissement.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRegion = !selectedRegion || etablissement.region === selectedRegion;
    const matchesType = !selectedType || etablissement.type === selectedType;

    return matchesSearch && matchesRegion && matchesType;
  });

  const handleValidation = async (id: string, statut: 'valide' | 'rejete', rejectionReason?: string) => {
    setActionLoading(id);
    try {
      // Récupérer les informations de l'établissement avant validation
      const etablissement = etablissementsEnAttente.find(e => e.id === id);
      if (!etablissement) {
        throw new Error('Établissement non trouvé');
      }

      await validateEtablissement(id, statut);

      // Envoyer les emails de notification (ne pas faire échouer la validation si les emails échouent)
      try {
        if (EmailService.isConfigured()) {
          if (statut === 'valide') {
            // Notifier le secrétaire de l'approbation
            await EmailService.notifySecretaryApproval({
              secretaryEmail: etablissement.email, // Utiliser l'email de l'établissement
              secretaryName: 'Secrétaire de santé', // TODO: Récupérer le nom réel du secrétaire
              etablissementName: etablissement.nom,
              adminName: 'Équipe Fadju', // TODO: Récupérer le nom réel de l'admin connecté
            });
          } else if (statut === 'rejete') {
            // Notifier le secrétaire du refus
            await EmailService.notifySecretaryRejection({
              secretaryEmail: etablissement.email, // Utiliser l'email de l'établissement
              secretaryName: 'Secrétaire de santé', // TODO: Récupérer le nom réel du secrétaire
              etablissementName: etablissement.nom,
              rejectionReason: rejectionReason || 'Informations non conformes aux exigences',
              adminName: 'Équipe Fadju', // TODO: Récupérer le nom réel de l'admin connecté
            });
          }
          console.log('Email de notification envoyé avec succès');
        } else {
          console.warn('EmailJS non configuré - email non envoyé');
        }
      } catch (emailError) {
        console.error('Erreur lors de l\'envoi de l\'email de notification:', emailError);
        // Ne pas faire échouer la validation si l'email échoue
      }

      toast.success(
        `Établissement ${statut === 'valide' ? 'validé' : 'rejeté'} avec succès`
      );
      setIsModalOpen(false);
      setSelectedEtablissement(null);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la validation');
    } finally {
      setActionLoading(null);
    }
  };

  const openDetailModal = (etablissement: EtablissementSante) => {
    setSelectedEtablissement(etablissement);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loading text="Chargement des demandes..." />
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
              Validation des Établissements
            </h1>
            <p className="text-muted-foreground mt-2">
              Gérez les demandes d'inscription des établissements de santé
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="warning" size="lg" className="px-4 py-2">
              <AlertCircle className="w-4 h-4 mr-2" />
              {filteredEtablissements.length} en attente
            </Badge>
          </div>
        </div>

        {/* Filtres et recherche */}
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

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total en attente</p>
                  <p className="text-2xl font-bold">{etablissementsEnAttente.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Filter className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Filtrés</p>
                  <p className="text-2xl font-bold">{filteredEtablissements.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nouveaux cette semaine</p>
                  <p className="text-2xl font-bold">
                    {etablissementsEnAttente.filter(e => {
                      const oneWeekAgo = new Date();
                      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                      return e.date_creation.toDate() > oneWeekAgo;
                    }).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des établissements en attente */}
        {filteredEtablissements.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              {etablissementsEnAttente.length === 0 ? (
                <>
                  <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Aucune demande en attente
                  </h3>
                  <p className="text-muted-foreground">
                    Toutes les demandes d'inscription ont été traitées.
                  </p>
                </>
              ) : (
                <>
                  <Filter className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Aucun résultat
                  </h3>
                  <p className="text-muted-foreground">
                    Aucun établissement ne correspond à vos critères de recherche.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredEtablissements.map((etablissement, index) => (
              <motion.div
                key={etablissement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.005 }}
              >
                <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-warning">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center">
                          <Building2 className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-xl mb-1">
                            {etablissement.nom}
                          </CardTitle>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {etablissement.ville}, {etablissement.region}
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              Demandé le {formatDate(etablissement.date_creation.toDate())}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="warning" className="flex items-center space-x-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>En attente</span>
                        </Badge>
                        <Badge variant="secondary" className="capitalize">
                          {etablissement.type}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                      {/* Informations de base */}
                      <div>
                        <h4 className="font-semibold mb-3 text-foreground">Informations</h4>
                        <div className="space-y-2">
                          <p className="text-sm">
                            <strong>Type:</strong> <span className="capitalize">{etablissement.type}</span>
                          </p>
                          <p className="text-sm">
                            <strong>Services:</strong> {etablissement.services.length}
                          </p>
                          <p className="text-sm">
                            <strong>Spécialités:</strong> {etablissement.specialites.length}
                          </p>
                        </div>
                      </div>

                      {/* Contact */}
                      <div>
                        <h4 className="font-semibold mb-3 text-foreground">Contact</h4>
                        <div className="space-y-2">
                          <p className="text-sm flex items-center">
                            <Phone className="w-3 h-3 mr-2 text-muted-foreground" />
                            {phoneNumberFormat(etablissement.telephone)}
                          </p>
                          <p className="text-sm flex items-center">
                            <Mail className="w-3 h-3 mr-2 text-muted-foreground" />
                            {etablissement.email}
                          </p>
                          {etablissement.site_web && (
                            <p className="text-sm flex items-center">
                              <Globe className="w-3 h-3 mr-2 text-muted-foreground" />
                              <a 
                                href={etablissement.site_web} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                Site web
                              </a>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Caractéristiques */}
                      <div>
                        <h4 className="font-semibold mb-3 text-foreground">Caractéristiques</h4>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              etablissement.ouvert_24h ? 'bg-green-500' : 'bg-gray-300'
                            }`} />
                            <span>{etablissement.ouvert_24h ? 'Ouvert 24h/24' : 'Horaires limités'}</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              etablissement.service_urgence ? 'bg-green-500' : 'bg-gray-300'
                            }`} />
                            <span>{etablissement.service_urgence ? 'Service urgence' : 'Pas d\'urgence'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                      <h4 className="font-semibold mb-2 text-foreground">Description</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {etablissement.description}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-border">
                      <Button
                        variant="outline"
                        onClick={() => openDetailModal(etablissement)}
                        className="flex items-center space-x-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Voir détails complets</span>
                      </Button>

                      <div className="flex items-center space-x-3">
                        <Button
                          variant="destructive"
                          onClick={() => handleValidation(etablissement.id, 'rejete')}
                          loading={actionLoading === etablissement.id}
                          disabled={actionLoading !== null}
                          className="flex items-center space-x-2"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Rejeter</span>
                        </Button>

                        <Button
                          variant="primary"
                          onClick={() => handleValidation(etablissement.id, 'valide')}
                          loading={actionLoading === etablissement.id}
                          disabled={actionLoading !== null}
                          className="flex items-center space-x-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Valider</span>
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
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Validation - Détails complets"
          size="xl"
        >
          {selectedEtablissement && (
            <div className="space-y-6">
              {/* Header du modal */}
              <div className="flex items-start space-x-4 p-4 bg-muted rounded-lg">
                <div className="w-20 h-20 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold">{selectedEtablissement.nom}</h3>
                  <p className="text-muted-foreground mt-1">
                    {selectedEtablissement.description}
                  </p>
                  <div className="flex items-center space-x-4 mt-3">
                    <Badge variant="warning">En attente de validation</Badge>
                    <Badge variant="secondary" className="capitalize">
                      {selectedEtablissement.type}
                    </Badge>
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

              {/* Date de demande */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Informations de la demande</h4>
                <p className="text-sm">
                  <strong>Date de soumission:</strong> {formatDate(selectedEtablissement.date_creation.toDate())}
                </p>
              </div>

              {/* Actions dans le modal */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Fermer
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleValidation(selectedEtablissement.id, 'rejete')}
                  loading={actionLoading === selectedEtablissement.id}
                  disabled={actionLoading !== null}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejeter
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleValidation(selectedEtablissement.id, 'valide')}
                  loading={actionLoading === selectedEtablissement.id}
                  disabled={actionLoading !== null}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Valider
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </motion.div>
    </DashboardLayout>
  );
};

export default SuperAdminValidationPage;