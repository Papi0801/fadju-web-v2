'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Edit,
  Save,
  AlertCircle,
  CheckCircle,
  Stethoscope,
  Shield,
  Calendar,
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
} from '@/components/ui';
import { etablissementService } from '@/lib/firebase/firestore';
import { EtablissementSante } from '@/types';
import { REGIONS_SENEGAL, SERVICES_MEDICAUX, SPECIALITES_MEDICALES } from '@/lib/constants';

const EtablissementPage: React.FC = () => {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const router = useRouter();
  const [etablissement, setEtablissement] = useState<EtablissementSante | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // États pour l'édition
  const [formData, setFormData] = useState({
    adresse: '',
    telephone: '',
    email: '',
    site_web: '',
    description: '',
    service_urgence: false,
    ouvert_24h: false,
    services: [] as string[],
    specialites: [] as string[],
    horaires_travail: {} as Record<string, string>,
  });

  useEffect(() => {
    fetchEtablissement();
  }, [user?.etablissement_id]);

  const fetchEtablissement = async () => {
    if (!user?.etablissement_id) {
      setLoading(false);
      return;
    }

    try {
      const etablissementData = await etablissementService.getById(user.etablissement_id);
      if (etablissementData) {
        setEtablissement(etablissementData);
        setFormData({
          adresse: etablissementData.adresse,
          telephone: etablissementData.telephone,
          email: etablissementData.email,
          site_web: etablissementData.site_web || '',
          description: etablissementData.description,
          service_urgence: etablissementData.service_urgence,
          ouvert_24h: etablissementData.ouvert_24h,
          services: etablissementData.services || [],
          specialites: etablissementData.specialites || [],
          horaires_travail: etablissementData.horaires_travail || {},
        });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'établissement:', error);
      toast.error('Erreur lors du chargement des informations');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!etablissement) return;

    setSaving(true);
    try {
      await etablissementService.update(etablissement.id, {
        ...formData,
        site_web: formData.site_web || undefined,
      });
      
      toast.success('Informations mises à jour avec succès');
      setEditing(false);
      fetchEtablissement();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const toggleService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const toggleSpecialite = (specialite: string) => {
    setFormData(prev => ({
      ...prev,
      specialites: prev.specialites.includes(specialite)
        ? prev.specialites.filter(s => s !== specialite)
        : [...prev.specialites, specialite]
    }));
  };

  const getStatutBadge = () => {
    if (!etablissement?.statut_validation) return null;

    const config = {
      en_attente: { variant: 'warning' as const, icon: Clock, label: 'En attente de validation' },
      valide: { variant: 'success' as const, icon: CheckCircle, label: 'Établissement validé' },
      rejete: { variant: 'destructive' as const, icon: AlertCircle, label: 'Validation refusée' },
    };

    const { variant, icon: Icon, label } = config[etablissement.statut_validation];

    return (
      <Badge variant={variant} className="flex items-center space-x-1">
        <Icon className="w-3 h-3" />
        <span>{label}</span>
      </Badge>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loading text="Chargement des informations..." />
        </div>
      </DashboardLayout>
    );
  }

  if (!etablissement) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Établissement non trouvé</h2>
          <Button onClick={() => router.push('/secretaire/dashboard')}>
            Retour au tableau de bord
          </Button>
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
            <h1 className="text-3xl font-bold text-foreground">Informations de l'Établissement</h1>
            <p className="text-muted-foreground mt-2">
              Gérez les informations de votre établissement de santé
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {getStatutBadge()}
            {!editing && etablissement.statut_validation === 'valide' && (
              <Button
                variant="primary"
                onClick={() => setEditing(true)}
                className="flex items-center space-x-2"
              >
                <Edit className="w-5 h-5" />
                <span>Modifier</span>
              </Button>
            )}
          </div>
        </div>

        {/* Message pour établissement en attente */}
        {etablissement.statut_validation === 'en_attente' && (
          <Card 
            className={`border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 ${theme === 'light' ? 'info-box-light' : ''}`}
          >
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" style={theme === 'light' ? { color: 'white' } : {}} />
                <div>
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200" style={theme === 'light' ? { color: 'white' } : {}}>
                    Établissement en cours de validation
                  </h3>
                  <p className="text-yellow-700 dark:text-yellow-300 mt-1" style={theme === 'light' ? { color: 'white' } : {}}>
                    Les modifications seront possibles après validation de votre établissement par notre équipe.
                    Délai estimé : 24-48h.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="w-5 h-5" />
              <span>Informations générales</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Nom de l'établissement
                </label>
                <p className="text-foreground font-medium">{etablissement.nom}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Type d'établissement
                </label>
                <p className="text-foreground font-medium capitalize">{etablissement.type}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Région
                </label>
                <p className="text-foreground font-medium">{etablissement.region}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Ville
                </label>
                <p className="text-foreground font-medium">{etablissement.ville}</p>
              </div>

              {editing ? (
                <div className="md:col-span-2">
                  <Input
                    label="Adresse complète"
                    value={formData.adresse}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                    leftIcon={<MapPin className="w-5 h-5 text-muted-foreground" />}
                  />
                </div>
              ) : (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Adresse complète
                  </label>
                  <p className="text-foreground flex items-start">
                    <MapPin className="w-4 h-4 mr-2 mt-0.5 text-muted-foreground" />
                    {etablissement.adresse}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informations de contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="w-5 h-5" />
              <span>Informations de contact</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {editing ? (
                <>
                  <Input
                    label="Téléphone"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    leftIcon={<Phone className="w-5 h-5 text-muted-foreground" />}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    leftIcon={<Mail className="w-5 h-5 text-muted-foreground" />}
                  />
                  <Input
                    label="Site web (optionnel)"
                    value={formData.site_web}
                    onChange={(e) => setFormData({ ...formData, site_web: e.target.value })}
                    leftIcon={<Globe className="w-5 h-5 text-muted-foreground" />}
                  />
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Téléphone
                    </label>
                    <p className="text-foreground flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                      {etablissement.telephone}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Email
                    </label>
                    <p className="text-foreground flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                      {etablissement.email}
                    </p>
                  </div>
                  {etablissement.site_web && (
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Site web
                      </label>
                      <p className="text-foreground flex items-center">
                        <Globe className="w-4 h-4 mr-2 text-muted-foreground" />
                        <a href={etablissement.site_web} target="_blank" rel="noopener noreferrer" 
                           className="text-primary hover:underline">
                          {etablissement.site_web}
                        </a>
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            {editing ? (
              <div>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="flex w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
                  placeholder="Décrivez votre établissement..."
                />
              </div>
            ) : (
              <p className="text-foreground">{etablissement.description}</p>
            )}
          </CardContent>
        </Card>

        {/* Services et spécialités */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Stethoscope className="w-5 h-5" />
                <span>Services proposés</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="flex flex-wrap gap-2">
                  {SERVICES_MEDICAUX.map(service => (
                    <Badge
                      key={service}
                      variant={formData.services.includes(service) ? 'primary' : 'secondary'}
                      className="cursor-pointer"
                      onClick={() => toggleService(service)}
                    >
                      {service}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {etablissement.services?.map(service => (
                    <Badge key={service} variant="secondary">
                      {service}
                    </Badge>
                  ))}
                  {(!etablissement.services || etablissement.services.length === 0) && (
                    <p className="text-muted-foreground">Aucun service renseigné</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Spécialités médicales</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                  {SPECIALITES_MEDICALES.map(specialite => (
                    <Badge
                      key={specialite}
                      variant={formData.specialites.includes(specialite) ? 'primary' : 'secondary'}
                      className="cursor-pointer"
                      onClick={() => toggleSpecialite(specialite)}
                    >
                      {specialite}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {etablissement.specialites?.map(specialite => (
                    <Badge key={specialite} variant="secondary">
                      {specialite}
                    </Badge>
                  ))}
                  {(!etablissement.specialites || etablissement.specialites.length === 0) && (
                    <p className="text-muted-foreground">Aucune spécialité renseignée</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Options */}
        <Card>
          <CardHeader>
            <CardTitle>Options et disponibilité</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {editing ? (
                <>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.service_urgence}
                      onChange={(e) => setFormData({ ...formData, service_urgence: e.target.checked })}
                      className="rounded border-border"
                    />
                    <span className="text-sm">Service d'urgence disponible</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.ouvert_24h}
                      onChange={(e) => setFormData({ ...formData, ouvert_24h: e.target.checked })}
                      className="rounded border-border"
                    />
                    <span className="text-sm">Ouvert 24h/24</span>
                  </label>
                </>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Badge variant={etablissement.service_urgence ? 'success' : 'secondary'}>
                      {etablissement.service_urgence ? 'Service urgence disponible' : 'Pas de service urgence'}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={etablissement.ouvert_24h ? 'success' : 'secondary'}>
                      {etablissement.ouvert_24h ? 'Ouvert 24h/24' : 'Horaires standards'}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        {editing && (
          <div className="flex justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => {
                setEditing(false);
                fetchEtablissement();
              }}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              loading={saving}
              disabled={saving}
              className="min-w-[120px]"
            >
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </Button>
          </div>
        )}

        {/* Date de création */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>
                  Établissement créé le {etablissement.date_creation.toDate().toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              {etablissement.statut_validation === 'valide' && (
                <Badge variant="outline" className="text-xs">
                  Visible sur l'application mobile
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default EtablissementPage;