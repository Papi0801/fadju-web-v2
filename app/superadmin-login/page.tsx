'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Lock, Mail, Shield, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { useAuthStore } from '@/store';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Loading, LoadingOverlay, ConditionalThemeToggle } from '@/components/ui';
import { LoginForm } from '@/types';

const loginSchema = yup.object({
  email: yup.string().email('Email invalide').required('Email requis'),
  password: yup.string().required('Mot de passe requis'),
});

const SuperAdminLoginPage: React.FC = () => {
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
      
      if (user?.role !== 'superadmin') {
        toast.error('Accès refusé. Cette page est réservée aux superadministrateurs.');
        await useAuthStore.getState().logout();
        return;
      }

      toast.success('Connexion réussie !');
      router.replace('/superadmin');
    } catch (error: any) {
      toast.error(error.message || 'Erreur de connexion');
    }
  };

  if (loading) {
    return <LoadingOverlay isLoading={loading} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-black dark:via-purple-950 dark:to-black flex flex-col">
      {/* Header avec Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ConditionalThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-purple-800/20 bg-white/10 dark:bg-black/30 backdrop-blur-xl">
            <CardHeader className="text-center pb-8">
              <motion.div
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.2 }}
                className="mx-auto mb-6"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-xl">
                  <Shield className="w-10 h-10 text-white" />
                </div>
              </motion.div>
              <CardTitle>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                  Portail Superadmin
                </h1>
                <p className="text-gray-300 dark:text-gray-400 mt-3">
                  Accès sécurisé réservé aux administrateurs système
                </p>
              </CardTitle>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Input
                  {...register('email')}
                  type="email"
                  label="Email administrateur"
                  placeholder="admin@fadju.com"
                  error={errors.email?.message}
                  leftIcon={<Mail className="w-5 h-5 text-purple-400" />}
                  className="bg-white/10 dark:bg-black/20 border-purple-800/30 focus:border-purple-500 text-white placeholder:text-gray-400"
                />

                <div className="relative">
                  <Input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    label="Mot de passe"
                    placeholder="••••••••"
                    error={errors.password?.message}
                    leftIcon={<Lock className="w-5 h-5 text-purple-400" />}
                    className="bg-white/10 dark:bg-black/20 border-purple-800/30 focus:border-purple-500 text-white placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-purple-400 hover:text-purple-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="space-y-4">
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
                    loading={loading}
                    disabled={loading}
                  >
                    Connexion sécurisée
                  </Button>

                  <div className="text-center">
                    <a
                      href="/setup"
                      className="text-sm text-purple-300 hover:text-purple-200 transition-colors"
                    >
                      Créer un compte test
                    </a>
                  </div>
                </div>
              </form>

              <div className="mt-8 pt-6 border-t border-purple-800/30">
                <p className="text-xs text-center text-gray-400">
                  Cette interface est strictement réservée aux administrateurs système autorisés. 
                  Toute tentative d'accès non autorisée sera enregistrée.
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
            <p className="text-sm text-gray-400">
              Plateforme de gestion Fadju © {new Date().getFullYear()}
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default SuperAdminLoginPage;