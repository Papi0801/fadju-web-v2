'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Eye, EyeOff, Mail, Lock, Heart, Stethoscope, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

import { useAuthStore } from '@/store';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, LoadingOverlay, ConditionalThemeToggle } from '@/components/ui';
import { LoginForm } from '@/types';

const loginSchema = yup.object({
  email: yup.string().email('Email invalide').required('Email requis'),
  password: yup.string().required('Mot de passe requis'),
});

const SharedLoginPage: React.FC = () => {
  const router = useRouter();
  const { login, loading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: yupResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const user = await login(data.email, data.password);

      // Redirection selon le rôle
      if (user?.role === 'secretaire') {
        toast.success('Connexion réussie !');
        router.replace('/secretaire/dashboard');
      } else if (user?.role === 'medecin') {
        toast.success('Connexion réussie !');
        // Vérifier si c'est la première connexion
        if (user.premiere_connexion) {
          router.replace('/medecin/changement-mot-de-passe');
        } else {
          router.replace('/medecin/dashboard');
        }
      } else if (user?.role === 'superadmin') {
        // Redirection vers le portail superadmin
        toast.error('Veuillez utiliser le portail superadministrateur pour vous connecter.');
        await useAuthStore.getState().logout();
        setTimeout(() => router.replace('/superadmin-login'), 2000);
        return;
      } else {
        toast.error('Rôle utilisateur non reconnu.');
        await useAuthStore.getState().logout();
        return;
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur de connexion');
    }
  };

  if (loading) {
    return <LoadingOverlay isLoading={loading} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex">
      {/* Bouton retour et Theme Toggle */}
      <div className="absolute top-4 left-4 z-10">
        <Button
          variant="ghost"
          onClick={() => router.push('/health-secretary')}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour</span>
        </Button>
      </div>
      <div className="absolute top-4 right-4 z-10">
        <ConditionalThemeToggle />
      </div>

      {/* Section gauche - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <Image
          src="/assets/images/teleconsultation.jpg"
          alt="Professionnels de santé"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-black/30" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-white">
            <h2 className="text-4xl font-bold mb-4">
              Espace Professionnel
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Connexion pour les secrétaires de santé et médecins
            </p>

            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Heart className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Secrétaires de Santé</h3>
                  <p className="text-sm opacity-80">Gestion complète de votre établissement</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Médecins</h3>
                  <p className="text-sm opacity-80">Suivi et gestion de vos patients</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section droite - Formulaire */}
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
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
                  <Heart className="w-8 h-8 text-white" />
                </div>
              </motion.div>
              <CardTitle className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  Connexion Professionnelle
                </div>
                <p className="text-muted-foreground mt-2">
                  Secrétaires & Médecins
                </p>
              </CardTitle>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Input
                  {...register('email')}
                  type="email"
                  label="Email professionnel"
                  placeholder="votre.email@etablissement.sn"
                  error={errors.email?.message}
                  leftIcon={<Mail className="w-5 h-5 text-muted-foreground" />}
                />

                <div className="relative">
                  <Input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    label="Mot de passe"
                    placeholder="••••••••"
                    error={errors.password?.message}
                    leftIcon={<Lock className="w-5 h-5 text-muted-foreground" />}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-border" />
                    <span className="text-sm text-muted-foreground">Se souvenir de moi</span>
                  </label>
                  <a href="#" className="text-sm text-primary hover:underline">
                    Mot de passe oublié ?
                  </a>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  loading={loading}
                  disabled={loading}
                >
                  Se connecter
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-card text-muted-foreground">
                      Nouveau ?
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push('/health-secretary/register')}
                  >
                    Inscrire un établissement de santé
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    <strong>Médecins :</strong> Votre compte est créé automatiquement par votre établissement
                  </p>
                </div>
              </form>

              <div className="mt-6 text-center">
                <p className="text-xs text-muted-foreground">
                  En vous connectant, vous acceptez nos{' '}
                  <a href="#" className="text-primary hover:underline">conditions d'utilisation</a>
                  {' '}et notre{' '}
                  <a href="#" className="text-primary hover:underline">politique de confidentialité</a>
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
              Une plateforme conçue pour les professionnels de santé du Sénégal
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default SharedLoginPage;
