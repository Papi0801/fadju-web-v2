'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { 
  Mail, 
  Lock, 
  User, 
  Building2, 
  Phone, 
  MapPin, 
  Globe,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Eye,
  EyeOff,
  Clock,
  Heart
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Image from 'next/image';

import { Button, Input, Card, CardContent, CardHeader, CardTitle, ConditionalThemeToggle, Badge } from '@/components/ui';
import { createUser } from '@/lib/firebase/auth';
import { etablissementService } from '@/lib/firebase/firestore';
import { REGIONS_SENEGAL, ETABLISSEMENT_TYPES, SPECIALITES_MEDICALES, SERVICES_MEDICAUX } from '@/lib/constants';
import { Timestamp } from 'firebase/firestore';
import { EmailService } from '@/lib/email/email-service';

// Schémas de validation
const step1Schema = yup.object({
  prenom: yup.string().required('Prénom requis'),
  nom: yup.string().required('Nom requis'),
  email: yup.string().email('Email invalide').required('Email requis'),
  telephone: yup.string().required('Téléphone requis'),
  password: yup.string().min(8, 'Minimum 8 caractères').required('Mot de passe requis'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Les mots de passe ne correspondent pas')
    .required('Confirmation requise'),
});

const step2Schema = yup.object({
  nom_etablissement: yup.string().required('Nom de l\'établissement requis'),
  type: yup.string().oneOf(['hopital', 'clinique', 'cabinet']).required('Type requis'),
  adresse: yup.string().required('Adresse requise'),
  ville: yup.string().required('Ville requise'),
  region: yup.string().required('Région requise'),
  telephone_etablissement: yup.string().required('Téléphone requis'),
  email_etablissement: yup.string().email('Email invalide').required('Email requis'),
  description: yup.string().required('Description requise'),
  site_web: yup.string().url('URL invalide').nullable(),
  service_urgence: yup.boolean(),
  ouvert_24h: yup.boolean(),
});

type Step1Form = yup.InferType<typeof step1Schema>;
type Step2Form = yup.InferType<typeof step2Schema>;

const HealthSecretaryRegisterPage: React.FC = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step1Data, setStep1Data] = useState<Step1Form | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedSpecialites, setSelectedSpecialites] = useState<string[]>([]);

  // Form pour l'étape 1
  const {
    register: registerStep1,
    handleSubmit: handleSubmitStep1,
    formState: { errors: errorsStep1 },
  } = useForm<Step1Form>({
    resolver: yupResolver(step1Schema),
  });

  // Form pour l'étape 2
  const {
    register: registerStep2,
    handleSubmit: handleSubmitStep2,
    formState: { errors: errorsStep2 },
    watch,
  } = useForm<Step2Form>({
    resolver: yupResolver(step2Schema),
    defaultValues: {
      service_urgence: false,
      ouvert_24h: false,
    }
  });

  const onSubmitStep1 = (data: Step1Form) => {
    setStep1Data(data);
    setCurrentStep(2);
  };

  const onSubmitStep2 = async (data: Step2Form) => {
    if (!step1Data) return;

    setLoading(true);
    try {
      // Créer l'établissement
      const etablissementData = {
        nom: data.nom_etablissement,
        type: data.type as 'hopital' | 'clinique' | 'cabinet',
        adresse: data.adresse,
        ville: data.ville,
        region: data.region,
        telephone: data.telephone_etablissement,
        email: data.email_etablissement,
        description: data.description,
        ...(data.site_web && data.site_web.trim() && { site_web: data.site_web }),
        service_urgence: data.service_urgence,
        ouvert_24h: data.ouvert_24h,
        services: selectedServices,
        specialites: selectedSpecialites,
        horaires_travail: {
          lundi: data.ouvert_24h ? '24h/24' : '08:00-18:00',
          mardi: data.ouvert_24h ? '24h/24' : '08:00-18:00',
          mercredi: data.ouvert_24h ? '24h/24' : '08:00-18:00',
          jeudi: data.ouvert_24h ? '24h/24' : '08:00-18:00',
          vendredi: data.ouvert_24h ? '24h/24' : '08:00-18:00',
          samedi: data.ouvert_24h ? '24h/24' : '08:00-12:00',
          dimanche: data.ouvert_24h ? '24h/24' : 'Fermé',
        },
        localisation: { latitude: 14.6928, longitude: -17.4467 } as any, // Coordonnées par défaut (Dakar)
        note: 0,
        nombre_avis: 0,
        statut_validation: 'en_attente' as const,
        date_creation: Timestamp.now(),
      };

      const etablissementId = await etablissementService.create(etablissementData);

      // Créer le compte secrétaire
      const userData = {
        email: step1Data.email,
        nom: step1Data.nom,
        prenom: step1Data.prenom,
        telephone: step1Data.telephone,
        role: 'secretaire' as const,
        etablissement_id: etablissementId,
        actif: true,
      };

      await createUser(step1Data.email, step1Data.password, userData);

      // Envoyer les emails de notification (ne pas faire échouer l'inscription si les emails échouent)
      try {
        if (EmailService.isConfigured()) {
          // 1. Envoyer confirmation de réception au secrétaire
          await EmailService.confirmRegistrationToSecretary({
            secretaryEmail: step1Data.email,
            secretaryName: `${step1Data.prenom} ${step1Data.nom}`,
            etablissementName: data.nom_etablissement,
          });

          // 2. Notifier les superadmins de la nouvelle demande
          // TODO: Récupérer les emails des superadmins depuis la configuration ou DB
          const ADMIN_EMAIL = 'admin@fadju.com'; // À remplacer par l'email réel du superadmin
          await EmailService.notifyAdminNewRequest({
            adminEmail: ADMIN_EMAIL,
            adminName: 'Équipe Fadju',
            secretaryName: `${step1Data.prenom} ${step1Data.nom}`,
            etablissementName: data.nom_etablissement,
            etablissementType: data.type,
            etablissementVille: data.ville,
            etablissementRegion: data.region,
          });

          console.log('Emails de notification envoyés avec succès');
        } else {
          console.warn('EmailJS non configuré - emails non envoyés');
        }
      } catch (emailError) {
        console.error('Erreur lors de l\'envoi des emails de notification:', emailError);
        // Ne pas faire échouer l'inscription si les emails échouent
      }

      toast.success('Inscription réussie ! Votre établissement est en attente de validation.');
      router.push('/auth/login');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const toggleSpecialite = (specialite: string) => {
    setSelectedSpecialites(prev =>
      prev.includes(specialite)
        ? prev.filter(s => s !== specialite)
        : [...prev, specialite]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="absolute top-4 left-4 z-10">
        <Button
          variant="ghost"
          onClick={() => currentStep > 1 ? setCurrentStep(1) : router.push('/health-secretary')}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour</span>
        </Button>
      </div>
      <div className="absolute top-4 right-4 z-10">
        <ConditionalThemeToggle />
      </div>

      <div className="flex min-h-screen">
        {/* Section gauche - Image */}
        <div className="hidden lg:block lg:w-2/5 relative">
          <Image
            src="/assets/images/resultats.jpg"
            alt="Inscription établissement"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40" />
          <div className="absolute inset-0 flex items-center p-12">
            <div className="text-white">
              <h2 className="text-4xl font-bold mb-6">
                Rejoignez Fadju Santé
              </h2>
              <p className="text-xl opacity-90 mb-8">
                Digitalisez votre établissement de santé en quelques minutes
              </p>
              
              {/* Progress steps */}
              <div className="space-y-4">
                <div className={`flex items-center space-x-3 ${currentStep >= 1 ? 'opacity-100' : 'opacity-50'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep > 1 ? 'bg-green-500' : 'bg-white/20'
                  }`}>
                    {currentStep > 1 ? (
                      <CheckCircle className="w-6 h-6 text-white" />
                    ) : (
                      <span className="text-white font-semibold">1</span>
                    )}
                  </div>
                  <p className="text-lg">Informations du responsable</p>
                </div>
                
                <div className={`flex items-center space-x-3 ${currentStep >= 2 ? 'opacity-100' : 'opacity-50'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep > 2 ? 'bg-green-500' : 'bg-white/20'
                  }`}>
                    <span className="text-white font-semibold">2</span>
                  </div>
                  <p className="text-lg">Informations de l'établissement</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section droite - Formulaires */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl">
            <AnimatePresence mode="wait">
              {/* Étape 1 : Informations personnelles */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="shadow-xl border-0">
                    <CardHeader className="text-center pb-6">
                      <div className="mx-auto mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                          <User className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <CardTitle className="text-2xl font-bold text-foreground">
                        Informations du responsable
                      </CardTitle>
                      <p className="text-muted-foreground mt-2">
                        Créez votre compte responsable d'établissement
                      </p>
                    </CardHeader>

                    <CardContent className="px-8 pb-8">
                      <form onSubmit={handleSubmitStep1(onSubmitStep1)} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            {...registerStep1('prenom')}
                            label="Prénom"
                            placeholder="Fatou"
                            error={errorsStep1.prenom?.message}
                          />
                          <Input
                            {...registerStep1('nom')}
                            label="Nom"
                            placeholder="Diop"
                            error={errorsStep1.nom?.message}
                          />
                        </div>

                        <Input
                          {...registerStep1('email')}
                          type="email"
                          label="Email professionnel"
                          placeholder="fatou.diop@clinique.sn"
                          error={errorsStep1.email?.message}
                          leftIcon={<Mail className="w-5 h-5 text-muted-foreground" />}
                        />

                        <Input
                          {...registerStep1('telephone')}
                          label="Téléphone"
                          placeholder="+221 77 123 45 67"
                          error={errorsStep1.telephone?.message}
                          leftIcon={<Phone className="w-5 h-5 text-muted-foreground" />}
                        />

                        <div className="relative">
                          <Input
                            {...registerStep1('password')}
                            type={showPassword ? 'text' : 'password'}
                            label="Mot de passe"
                            placeholder="••••••••"
                            error={errorsStep1.password?.message}
                            leftIcon={<Lock className="w-5 h-5 text-muted-foreground" />}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-9 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>

                        <div className="relative">
                          <Input
                            {...registerStep1('confirmPassword')}
                            type={showConfirmPassword ? 'text' : 'password'}
                            label="Confirmer le mot de passe"
                            placeholder="••••••••"
                            error={errorsStep1.confirmPassword?.message}
                            leftIcon={<Lock className="w-5 h-5 text-muted-foreground" />}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-9 text-muted-foreground hover:text-foreground"
                          >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>

                        <Button
                          type="submit"
                          variant="primary"
                          className="w-full"
                          disabled={loading}
                        >
                          Continuer
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Étape 2 : Informations de l'établissement */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="shadow-xl border-0">
                    <CardHeader className="text-center pb-6">
                      <div className="mx-auto mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                          <Building2 className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <CardTitle className="text-2xl font-bold text-foreground">
                        Informations de l'établissement
                      </CardTitle>
                      <p className="text-muted-foreground mt-2">
                        Enregistrez votre structure de santé
                      </p>
                    </CardHeader>

                    <CardContent className="px-8 pb-8">
                      <form onSubmit={handleSubmitStep2(onSubmitStep2)} className="space-y-6">
                        <Input
                          {...registerStep2('nom_etablissement')}
                          label="Nom de l'établissement"
                          placeholder="Clinique Médicale Diop"
                          error={errorsStep2.nom_etablissement?.message}
                          leftIcon={<Building2 className="w-5 h-5 text-muted-foreground" />}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Type d'établissement
                            </label>
                            <select
                              {...registerStep2('type')}
                              className="flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
                            >
                              <option value="">Sélectionner</option>
                              <option value="hopital">Hôpital</option>
                              <option value="clinique">Clinique</option>
                              <option value="cabinet">Cabinet médical</option>
                            </select>
                            {errorsStep2.type && (
                              <p className="text-sm text-destructive mt-1">{errorsStep2.type.message}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Région
                            </label>
                            <select
                              {...registerStep2('region')}
                              className="flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
                            >
                              <option value="">Sélectionner</option>
                              {REGIONS_SENEGAL.map(region => (
                                <option key={region} value={region}>{region}</option>
                              ))}
                            </select>
                            {errorsStep2.region && (
                              <p className="text-sm text-destructive mt-1">{errorsStep2.region.message}</p>
                            )}
                          </div>
                        </div>

                        <Input
                          {...registerStep2('adresse')}
                          label="Adresse complète"
                          placeholder="123 Avenue Cheikh Anta Diop"
                          error={errorsStep2.adresse?.message}
                          leftIcon={<MapPin className="w-5 h-5 text-muted-foreground" />}
                        />

                        <Input
                          {...registerStep2('ville')}
                          label="Ville"
                          placeholder="Dakar"
                          error={errorsStep2.ville?.message}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            {...registerStep2('telephone_etablissement')}
                            label="Téléphone établissement"
                            placeholder="+221 33 123 45 67"
                            error={errorsStep2.telephone_etablissement?.message}
                            leftIcon={<Phone className="w-5 h-5 text-muted-foreground" />}
                          />
                          <Input
                            {...registerStep2('email_etablissement')}
                            type="email"
                            label="Email établissement"
                            placeholder="contact@clinique.sn"
                            error={errorsStep2.email_etablissement?.message}
                            leftIcon={<Mail className="w-5 h-5 text-muted-foreground" />}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Description de l'établissement
                          </label>
                          <textarea
                            {...registerStep2('description')}
                            rows={3}
                            className="flex w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
                            placeholder="Décrivez brièvement votre établissement et ses spécialités..."
                          />
                          {errorsStep2.description && (
                            <p className="text-sm text-destructive mt-1">{errorsStep2.description.message}</p>
                          )}
                        </div>

                        <Input
                          {...registerStep2('site_web')}
                          label="Site web (optionnel)"
                          placeholder="https://www.clinique.sn"
                          error={errorsStep2.site_web?.message}
                          leftIcon={<Globe className="w-5 h-5 text-muted-foreground" />}
                        />

                        {/* Services */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Services proposés
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {SERVICES_MEDICAUX.map(service => (
                              <Badge
                                key={service}
                                variant={selectedServices.includes(service) ? 'primary' : 'secondary'}
                                className="cursor-pointer"
                                onClick={() => toggleService(service)}
                              >
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Spécialités */}
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Spécialités médicales
                          </label>
                          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                            {SPECIALITES_MEDICALES.map(specialite => (
                              <Badge
                                key={specialite}
                                variant={selectedSpecialites.includes(specialite) ? 'primary' : 'secondary'}
                                className="cursor-pointer"
                                onClick={() => toggleSpecialite(specialite)}
                              >
                                {specialite}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Options */}
                        <div className="space-y-3">
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              {...registerStep2('service_urgence')}
                              className="rounded border-border"
                            />
                            <span className="text-sm">Service d'urgence disponible</span>
                          </label>
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              {...registerStep2('ouvert_24h')}
                              className="rounded border-border"
                            />
                            <span className="text-sm">Ouvert 24h/24</span>
                          </label>
                        </div>

                        <Button
                          type="submit"
                          variant="primary"
                          className="w-full"
                          loading={loading}
                          disabled={loading}
                        >
                          Créer mon compte
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center mt-6"
            >
              <p className="text-sm text-muted-foreground">
                Déjà inscrit ?{' '}
                <a href="/auth/login" className="text-primary hover:underline">
                  Se connecter
                </a>
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthSecretaryRegisterPage;