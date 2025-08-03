'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Shield,
  Stethoscope,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { useAuthStore, useThemeStore } from '@/store';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Button, 
  Input,
  LoadingOverlay,
} from '@/components/ui';
import { userService } from '@/lib/firebase/firestore';
import { auth } from '@/lib/firebase/config';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

const passwordSchema = yup.object({
  currentPassword: yup.string().required('Mot de passe temporaire requis'),
  newPassword: yup.string()
    .min(8, 'Minimum 8 caractères')
    .matches(/[A-Z]/, 'Au moins une majuscule')
    .matches(/[a-z]/, 'Au moins une minuscule')
    .matches(/[0-9]/, 'Au moins un chiffre')
    .matches(/[^A-Za-z0-9]/, 'Au moins un caractère spécial')
    .required('Nouveau mot de passe requis'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('newPassword')], 'Les mots de passe ne correspondent pas')
    .required('Confirmation requise'),
});

type PasswordForm = yup.InferType<typeof passwordSchema>;

const ChangementMotDePassePage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const { theme } = useThemeStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<PasswordForm>({
    resolver: yupResolver(passwordSchema),
  });

  const newPassword = watch('newPassword');

  // Critères de validation du mot de passe
  const getPasswordCriteria = (password: string) => [
    { label: 'Au moins 8 caractères', valid: password.length >= 8 },
    { label: 'Une majuscule', valid: /[A-Z]/.test(password) },
    { label: 'Une minuscule', valid: /[a-z]/.test(password) },
    { label: 'Un chiffre', valid: /[0-9]/.test(password) },
    { label: 'Un caractère spécial', valid: /[^A-Za-z0-9]/.test(password) },
  ];

  const onSubmit = async (data: PasswordForm) => {
    if (!user || !auth.currentUser) return;

    setLoading(true);
    try {
      // Réauthentifier l'utilisateur avec son mot de passe temporaire
      const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Mettre à jour le mot de passe Firebase
      await updatePassword(auth.currentUser, data.newPassword);

      // Mettre à jour le flag première connexion dans Firestore
      await userService.update(user.id, {
        premiere_connexion: false,
      });

      // Mettre à jour le store local
      setUser({
        ...user,
        premiere_connexion: false,
      });

      toast.success('Mot de passe modifié avec succès ! Bienvenue dans votre espace médecin.');
      
      // Rediriger vers le dashboard
      router.replace('/medecin/dashboard');
    } catch (error: any) {
      console.error('Erreur lors du changement de mot de passe:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('Mot de passe temporaire incorrect');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Le mot de passe est trop faible');
      } else {
        toast.error('Erreur lors du changement de mot de passe');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingOverlay isLoading={loading} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-8">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mx-auto mb-4"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                <Stethoscope className="w-8 h-8 text-white" />
              </div>
            </motion.div>
            <CardTitle>
              <h1 className="text-2xl font-bold text-foreground">
                Bienvenue Dr. {user?.prenom} {user?.nom}
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Changement de mot de passe obligatoire
              </p>
            </CardTitle>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            {/* Message d'information */}
            <div 
              className={`border-blue-200 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6 ${theme === 'light' ? 'info-box-light' : ''}`}
            >
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" style={theme === 'light' ? { color: 'white' } : {}} />
                <div>
                  <h4 className="font-medium text-blue-800 dark:text-blue-200" style={theme === 'light' ? { color: 'white' } : {}}>
                    Sécurité renforcée
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1" style={theme === 'light' ? { color: 'white' } : {}}>
                    Pour votre sécurité, vous devez changer le mot de passe temporaire généré automatiquement.
                    Utilisez un mot de passe fort et unique.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Mot de passe temporaire */}
              <div className="relative">
                <Input
                  {...register('currentPassword')}
                  type={showCurrentPassword ? 'text' : 'password'}
                  label="Mot de passe temporaire"
                  placeholder="Mot de passe reçu par email"
                  error={errors.currentPassword?.message}
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

              {/* Nouveau mot de passe */}
              <div className="relative">
                <Input
                  {...register('newPassword')}
                  type={showNewPassword ? 'text' : 'password'}
                  label="Nouveau mot de passe"
                  placeholder="••••••••"
                  error={errors.newPassword?.message}
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

              {/* Critères de validation en temps réel */}
              {newPassword && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Critères de sécurité :</p>
                  {getPasswordCriteria(newPassword).map((criterion, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      {criterion.valid ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className={`text-sm ${criterion.valid ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                        {criterion.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Confirmation mot de passe */}
              <div className="relative">
                <Input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  label="Confirmer le nouveau mot de passe"
                  placeholder="••••••••"
                  error={errors.confirmPassword?.message}
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
                loading={loading}
                disabled={loading}
              >
                <Shield className="w-4 h-4 mr-2" />
                Changer le mot de passe et continuer
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground">
                Ce changement est obligatoire pour accéder à votre espace médecin
              </p>
            </div>
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-6"
        >
          <p className="text-sm text-muted-foreground">
            Besoin d'aide ? Contactez votre secrétaire santé
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ChangementMotDePassePage;