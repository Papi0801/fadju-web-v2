'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  ArrowLeft,
  Mail,
  User,
  Phone,
  Stethoscope,
  Eye,
  EyeOff,
  UserPlus,
  AlertCircle,
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
} from '@/components/ui';
import { createUser } from '@/lib/firebase/auth';
import { SPECIALITES_MEDICALES } from '@/lib/constants';
import { MedecinForm } from '@/types';
import { EmailService } from '@/lib/email/email-service';
import { etablissementService } from '@/lib/firebase/firestore';

const addMedecinSchema = yup.object({
  prenom: yup.string().required('Prénom requis'),
  nom: yup.string().required('Nom requis'),
  email: yup.string().email('Email invalide').required('Email requis'),
  telephone: yup.string().required('Téléphone requis'),
  specialite: yup.string().required('Spécialité requise'),
  password: yup.string().min(8, 'Minimum 8 caractères').required('Mot de passe requis'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Les mots de passe ne correspondent pas')
    .required('Confirmation requise'),
});

type AddMedecinForm = yup.InferType<typeof addMedecinSchema>;

const AddMedecinPage: React.FC = () => {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<AddMedecinForm>({
    resolver: yupResolver(addMedecinSchema),
  });

  const selectedSpecialite = watch('specialite');
  const watchedEmail = watch('email');
  const watchedPassword = watch('password');

  const onSubmit = async (data: AddMedecinForm) => {
    if (!user?.etablissement_id) {
      toast.error('Établissement non identifié');
      return;
    }

    setLoading(true);
    try {
      // Créer le compte médecin
      const userData = {
        email: data.email,
        nom: data.nom,
        prenom: data.prenom,
        telephone: data.telephone,
        role: 'medecin' as const,
        etablissement_id: user.etablissement_id,
        specialite: data.specialite,
        actif: true,
        premiere_connexion: true, // Forcer changement de mot de passe à la première connexion
      };

      await createUser(data.email, data.password, userData);
      
      // Récupérer les informations de l'établissement pour l'email
      let etablissementNom = 'Votre établissement';
      try {
        if (user.etablissement_id) {
          const etablissement = await etablissementService.getById(user.etablissement_id);
          if (etablissement) {
            etablissementNom = etablissement.nom;
          }
        }
      } catch (error) {
        console.warn('Impossible de récupérer le nom de l\'établissement:', error);
      }

      // Envoyer l'email de bienvenue au médecin (ne pas faire échouer si l'email échoue)
      try {
        if (EmailService.isConfigured()) {
          await EmailService.sendWelcomeEmailToDoctor({
            doctorEmail: data.email,
            doctorName: `${data.prenom} ${data.nom}`,
            password: data.password,
            etablissementName: etablissementNom,
          });

          // Envoyer une notification au secrétaire
          if (user.email) {
            await EmailService.sendNotificationToSecretary({
              secretaryEmail: user.email,
              secretaryName: `${user.prenom} ${user.nom}`,
              doctorName: `${data.prenom} ${data.nom}`,
              etablissementName: etablissementNom,
            });
          }

          toast.success('Médecin ajouté avec succès ! Un email avec les identifiants a été envoyé.');
        } else {
          toast.success('Médecin ajouté avec succès ! Veuillez lui communiquer ses identifiants manuellement.');
          console.warn('EmailJS non configuré - email non envoyé');
        }
      } catch (emailError) {
        console.error('Erreur lors de l\'envoi de l\'email:', emailError);
        toast.success('Médecin ajouté avec succès ! Erreur lors de l\'envoi de l\'email - veuillez lui communiquer ses identifiants manuellement.');
      }
      
      router.push('/secretaire/medecins');
      
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout du médecin:', error);
      toast.error(error.message || 'Erreur lors de l\'ajout du médecin');
    } finally {
      setLoading(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword();
    
    // Utiliser setValue de React Hook Form pour mettre à jour les valeurs
    setValue('password', newPassword);
    setValue('confirmPassword', newPassword);
    
    setShowCredentials(true);
    toast.success('Mot de passe généré automatiquement');
  };

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
        className="space-y-6 max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/secretaire/medecins')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ajouter un médecin</h1>
            <p className="text-muted-foreground">
              Créez un compte pour un nouveau médecin de votre établissement
            </p>
          </div>
        </div>

        {/* Information Box */}
        <Card 
          className={`border-blue-200 bg-blue-50 dark:bg-blue-900/20 ${theme === 'light' ? 'info-box-light' : ''}`}
        >
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" style={theme === 'light' ? { color: 'white' } : {}} />
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-200" style={theme === 'light' ? { color: 'white' } : {}}>
                  Informations importantes
                </h3>
                <ul className="text-blue-700 dark:text-blue-300 mt-2 space-y-1 text-sm" style={theme === 'light' ? { color: 'white' } : {}}>
                  <li>• Le médecin recevra ses identifiants par email</li>
                  <li>• Il pourra se connecter immédiatement après création</li>
                  <li>• Vous pouvez générer un mot de passe automatiquement</li>
                  <li>• Le compte sera automatiquement lié à votre établissement</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulaire */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserPlus className="w-5 h-5" />
              <span>Informations du médecin</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form id="medecin-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Informations personnelles */}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  {...register('prenom')}
                  label="Prénom"
                  placeholder="Aminata"
                  error={errors.prenom?.message}
                  leftIcon={<User className="w-5 h-5 text-muted-foreground" />}
                />
                <Input
                  {...register('nom')}
                  label="Nom"
                  placeholder="Sall"
                  error={errors.nom?.message}
                  leftIcon={<User className="w-5 h-5 text-muted-foreground" />}
                />
              </div>

              <Input
                {...register('email')}
                type="email"
                label="Email professionnel"
                placeholder="dr.aminata.sall@etablissement.sn"
                error={errors.email?.message}
                leftIcon={<Mail className="w-5 h-5 text-muted-foreground" />}
              />

              <Input
                {...register('telephone')}
                label="Téléphone"
                placeholder="+221 77 123 45 67"
                error={errors.telephone?.message}
                leftIcon={<Phone className="w-5 h-5 text-muted-foreground" />}
              />

              {/* Spécialité */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Spécialité médicale *
                </label>
                <select
                  {...register('specialite')}
                  className="flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
                >
                  <option value="">Sélectionner une spécialité</option>
                  {SPECIALITES_MEDICALES.map(specialite => (
                    <option key={specialite} value={specialite}>
                      {specialite}
                    </option>
                  ))}
                </select>
                {errors.specialite && (
                  <p className="text-sm text-destructive mt-1">{errors.specialite.message}</p>
                )}
                {selectedSpecialite && (
                  <div className="mt-2">
                    <Badge variant="secondary" className="flex items-center space-x-1 w-fit">
                      <Stethoscope className="w-3 h-3" />
                      <span>{selectedSpecialite}</span>
                    </Badge>
                  </div>
                )}
              </div>

              {/* Mot de passe */}
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Identifiants de connexion</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGeneratePassword}
                  >
                    Générer automatiquement
                  </Button>
                </div>
                
                <div className="relative">
                  <Input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    label="Mot de passe"
                    placeholder="••••••••"
                    error={errors.password?.message}
                    leftIcon={<Mail className="w-5 h-5 text-muted-foreground" />}
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
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    label="Confirmer le mot de passe"
                    placeholder="••••••••"
                    error={errors.confirmPassword?.message}
                    leftIcon={<Mail className="w-5 h-5 text-muted-foreground" />}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-9 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Aperçu des identifiants */}
              {showCredentials && watchedEmail && watchedPassword && (
                <div className={`p-4 border rounded-lg bg-muted/30 ${theme === 'light' ? 'info-box-light' : ''}`}>
                  <h4 className="font-medium mb-3 flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>Identifiants générés</span>
                  </h4>
                  <div className="space-y-2 text-sm font-mono">
                    <div>
                      <span className="text-muted-foreground">Email :</span>
                      <span className="ml-2 font-semibold">{watchedEmail}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Mot de passe :</span>
                      <span className="ml-2 font-semibold">{watchedPassword}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Ces identifiants seront envoyés par email au médecin après création du compte.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/secretaire/medecins')}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  disabled={loading}
                  className="min-w-[140px]"
                >
                  Ajouter le médecin
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default AddMedecinPage;