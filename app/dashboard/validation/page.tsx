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
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useEtablissementStore } from '@/store';
import { DashboardLayout } from '@/components/layout';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Modal,
  Loading,
} from '@/components/ui';
import { EtablissementSante } from '@/types';
import { formatDate, getStatusColor, phoneNumberFormat } from '@/lib/utils';

const ValidationPage: React.FC = () => {
  const {
    etablissementsEnAttente,
    fetchEtablissementsEnAttente,
    validateEtablissement,
    loading,
  } = useEtablissementStore();

  const [selectedEtablissement, setSelectedEtablissement] = useState<EtablissementSante | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchEtablissementsEnAttente();
  }, [fetchEtablissementsEnAttente]);

  const handleValidation = async (id: string, statut: 'valide' | 'rejete') => {
    setActionLoading(id);
    try {
      await validateEtablissement(id, statut);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Validation des Établissements
            </h1>
            <p className="text-muted-foreground mt-2">
              Gérez les demandes d'inscription des établissements de santé
            </p>
          </div>
          <Badge variant="warning" size="lg">
            {etablissementsEnAttente.length} en attente
          </Badge>
        </div>

        {/* Liste des établissements en attente */}
        {etablissementsEnAttente.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Aucune demande en attente
              </h3>
              <p className="text-muted-foreground">
                Toutes les demandes d'inscription ont été traitées.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {etablissementsEnAttente.map((etablissement) => (
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
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">
                            {etablissement.nom}
                          </CardTitle>
                          <p className="text-muted-foreground flex items-center mt-1">
                            <MapPin className="w-4 h-4 mr-1" />
                            {etablissement.ville}, {etablissement.region}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="warning"
                          className="flex items-center space-x-1"
                        >
                          <Clock className="w-3 h-3" />
                          <span>En attente</span>
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {/* Type et services */}
                      <div>
                        <p className="text-sm font-medium text-foreground mb-2">
                          Type et Services
                        </p>
                        <div className="space-y-1">
                          <Badge variant="secondary" className="capitalize">
                            {etablissement.type}
                          </Badge>
                          <p className="text-sm text-muted-foreground">
                            {etablissement.services.slice(0, 2).join(', ')}
                            {etablissement.services.length > 2 && ' ...'}
                          </p>
                        </div>
                      </div>

                      {/* Contact */}
                      <div>
                        <p className="text-sm font-medium text-foreground mb-2">
                          Contact
                        </p>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {phoneNumberFormat(etablissement.telephone)}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {etablissement.email}
                          </p>
                        </div>
                      </div>

                      {/* Informations */}
                      <div>
                        <p className="text-sm font-medium text-foreground mb-2">
                          Informations
                        </p>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Demande créée le {formatDate(etablissement.date_creation.toDate())}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Spécialités: {etablissement.specialites.length}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mb-6">
                      <p className="text-sm font-medium text-foreground mb-2">
                        Description
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {etablissement.description}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        onClick={() => openDetailModal(etablissement)}
                        className="flex items-center space-x-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Voir détails</span>
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
          title="Détails de l'établissement"
          size="lg"
        >
          {selectedEtablissement && (
            <div className="space-y-6">
              {/* Informations générales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Informations générales</h4>
                  <div className="space-y-2">
                    <p><strong>Nom:</strong> {selectedEtablissement.nom}</p>
                    <p><strong>Type:</strong> <span className="capitalize">{selectedEtablissement.type}</span></p>
                    <p><strong>Adresse:</strong> {selectedEtablissement.adresse}</p>
                    <p><strong>Ville:</strong> {selectedEtablissement.ville}</p>
                    <p><strong>Région:</strong> {selectedEtablissement.region}</p>
                  </div>
                </div>

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

              {/* Services et horaires */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <h4 className="font-semibold mb-3">Spécialités</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEtablissement.specialites.map((specialite, index) => (
                      <Badge key={index} variant="primary">
                        {specialite}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Caractéristiques */}
              <div>
                <h4 className="font-semibold mb-3">Caractéristiques</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${selectedEtablissement.ouvert_24h ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm">Ouvert 24h/24</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${selectedEtablissement.service_urgence ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm">Service d'urgence</span>
                  </div>
                </div>
              </div>

              {/* Actions dans le modal */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="destructive"
                  onClick={() => handleValidation(selectedEtablissement.id, 'rejete')}
                  loading={actionLoading === selectedEtablissement.id}
                  disabled={actionLoading !== null}
                >
                  Rejeter
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleValidation(selectedEtablissement.id, 'valide')}
                  loading={actionLoading === selectedEtablissement.id}
                  disabled={actionLoading !== null}
                >
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

export default ValidationPage;