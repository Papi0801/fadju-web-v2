'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Save,
  Building2,
  Calendar,
  Shield,
  AlertCircle,
  Camera,
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
import { userService } from '@/lib/firebase/firestore';
import { auth } from '@/lib/firebase/config';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

// Schémas de validation
const profileSchema = yup.object({
  prenom: yup.string().required('Prénom requis'),
  nom: yup.string().required('Nom requis'),
  email: yup.string().email('Email invalide').required('Email requis'),
  telephone: yup.string().required('Téléphone requis'),
});

const passwordSchema = yup.object({
  currentPassword: yup.string().required('Mot de passe actuel requis'),
  newPassword: yup.string().min(8, 'Minimum 8 caractères').required('Nouveau mot de passe requis'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('newPassword')], 'Les mots de passe ne correspondent pas')
    .required('Confirmation requise'),
});

type ProfileForm = yup.InferType<typeof profileSchema>;
type PasswordForm = yup.InferType<typeof passwordSchema>;

const ProfilPage: React.FC = () => {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Form pour les informations du profil
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: errorsProfile },
  } = useForm<ProfileForm>({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      prenom: user?.prenom || '',
      nom: user?.nom || '',
      email: user?.email || '',
      telephone: user?.telephone || '',
    },
  });

  // Form pour le changement de mot de passe
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: errorsPassword },
    reset: resetPassword,
  } = useForm<PasswordForm>({
    resolver: yupResolver(passwordSchema),
  });

  const onSubmitProfile = async (data: ProfileForm) => {
    if (!user) return;

    setLoading(true);
    try {
      await userService.update(user.id, {
        prenom: data.prenom,
        nom: data.nom,
        telephone: data.telephone,
      });

      // Mettre à jour le store local
      useAuthStore.getState().setUser({
        ...user,
        prenom: data.prenom,
        nom: data.nom,
        telephone: data.telephone,
      });

      toast.success('Profil mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitPassword = async (data: PasswordForm) => {
    if (!user || !auth.currentUser) return;

    setLoading(true);
    try {
      // Réauthentifier l'utilisateur avec son mot de passe actuel
      const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Mettre à jour le mot de passe
      await updatePassword(auth.currentUser, data.newPassword);

      toast.success('Mot de passe mis à jour avec succès');
      resetPassword();
    } catch (error: any) {
      console.error('Erreur lors du changement de mot de passe:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('Mot de passe actuel incorrect');
      } else {
        toast.error('Erreur lors du changement de mot de passe');
      }
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = () => {
    const roleConfig = {
      secretaire: { label: 'Secrétaire Santé', variant: 'primary' as const },
      medecin: { label: 'Médecin', variant: 'secondary' as const },
      superadmin: { label: 'Super Admin', variant: 'destructive' as const },
    };

    const config = user?.role ? roleConfig[user.role] : null;
    if (!config) return null;

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Utilisateur non connecté</h2>
          <Button onClick={() => router.push('/auth/login')}>
            Se connecter
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
        className="space-y-6 max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Mon Profil</h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos informations personnelles et paramètres de sécurité
          </p>
        </div>

        {/* Photo de profil et infos générales */}
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
                  <User className="w-12 h-12 text-white" />
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-background rounded-full border shadow-sm hover:shadow-md transition-shadow">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-semibold">
                  {user.prenom} {user.nom}
                </h2>
                <p className="text-muted-foreground">{user.email}</p>
                <div className="flex items-center space-x-3 mt-3">
                  {getRoleBadge()}
                  <Badge variant="outline">
                    <Calendar className="w-3 h-3 mr-1" />
                    Membre depuis {user.date_creation && typeof user.date_creation.toDate === 'function' 
                      ? user.date_creation.toDate().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })
                      : new Date(user.date_creation).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })
                    }
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'profile'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Informations personnelles
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'security'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sécurité
          </button>
        </div>

        {/* Contenu des tabs */}
        {activeTab === 'profile' ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Informations personnelles</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    {...registerProfile('prenom')}
                    label="Prénom"
                    error={errorsProfile.prenom?.message}
                    leftIcon={<User className="w-5 h-5 text-muted-foreground" />}
                  />
                  <Input
                    {...registerProfile('nom')}
                    label="Nom"
                    error={errorsProfile.nom?.message}
                    leftIcon={<User className="w-5 h-5 text-muted-foreground" />}
                  />
                </div>

                <Input
                  {...registerProfile('email')}
                  type="email"
                  label="Email"
                  error={errorsProfile.email?.message}
                  leftIcon={<Mail className="w-5 h-5 text-muted-foreground" />}
                  disabled
                  helperText="L'email ne peut pas être modifié"
                />

                <Input
                  {...registerProfile('telephone')}
                  label="Téléphone"
                  error={errorsProfile.telephone?.message}
                  leftIcon={<Phone className="w-5 h-5 text-muted-foreground" />}
                />

                {user.etablissement_id && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center space-x-2 text-sm">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Établissement :</span>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="p-0 h-auto"
                        onClick={() => router.push('/secretaire/etablissement')}
                      >
                        Voir les détails
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    disabled={loading}
                    className="min-w-[140px]"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Sécurité</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-6">
                <div 
                  className={`border-blue-200 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg ${theme === 'light' ? 'info-box-light' : ''}`}
                >
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" style={theme === 'light' ? { color: 'white' } : {}} />
                    <div>
                      <h4 className="font-medium text-blue-800 dark:text-blue-200" style={theme === 'light' ? { color: 'white' } : {}}>
                        Changement de mot de passe
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1" style={theme === 'light' ? { color: 'white' } : {}}>
                        Assurez-vous d'utiliser un mot de passe fort d'au moins 8 caractères
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <Input
                    {...registerPassword('currentPassword')}
                    type={showCurrentPassword ? 'text' : 'password'}
                    label="Mot de passe actuel"
                    placeholder="••••••••"
                    error={errorsPassword.currentPassword?.message}
                    leftIcon={<Lock className="w-5 h-5 text-muted-foreground" />}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-9 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    {...registerPassword('newPassword')}
                    type={showNewPassword ? 'text' : 'password'}
                    label="Nouveau mot de passe"
                    placeholder="••••••••"
                    error={errorsPassword.newPassword?.message}
                    leftIcon={<Lock className="w-5 h-5 text-muted-foreground" />}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-9 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    {...registerPassword('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    label="Confirmer le nouveau mot de passe"
                    placeholder="••••••••"
                    error={errorsPassword.confirmPassword?.message}
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

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                    disabled={loading}
                    className="min-w-[180px]"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Changer le mot de passe
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Section déconnexion */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Déconnexion</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Vous serez déconnecté de votre compte
                </p>
              </div>
              <Button
                variant="outline"
                onClick={async () => {
                  await useAuthStore.getState().logout();
                  router.push('/');
                }}
              >
                Se déconnecter
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default ProfilPage;