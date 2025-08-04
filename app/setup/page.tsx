'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { UserPlus, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { createUser } from '@/lib/firebase/auth';
import { User } from '@/types';

const setupSchema = yup.object({
  email: yup.string().email('Email invalide').required('Email requis'),
  password: yup.string().min(6, 'Minimum 6 caractères').required('Mot de passe requis'),
  nom: yup.string().required('Nom requis'),
  prenom: yup.string().required('Prénom requis'),
  role: yup.string().oneOf(['superadmin', 'secretaire', 'medecin']).required('Rôle requis'),
});

type SetupForm = yup.InferType<typeof setupSchema>;

const SetupPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetupForm>({
    resolver: yupResolver(setupSchema),
    defaultValues: {
      email: 'admin@fadju.com',
      password: 'admin123456',
      nom: 'Admin',
      prenom: 'Super',
      role: 'superadmin',
    },
  });

  const onSubmit = async (data: SetupForm) => {
    setLoading(true);
    try {
      const userData: Omit<User, 'id' | 'date_creation'> = {
        email: data.email,
        nom: data.nom,
        prenom: data.prenom,
        role: data.role as any,
        actif: true,
      };

      await createUser(data.email, data.password, userData);
      setSuccess(true);
      toast.success(`Compte ${data.role} créé avec succès !`);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-2xl border-border/50 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Compte créé avec succès !
              </h2>
              <p className="text-muted-foreground mb-6">
                Votre compte utilisateur a été créé. Vous pouvez maintenant vous connecter.
              </p>
              <div className="bg-muted p-4 rounded-lg mb-6">
                <p className="text-sm">
                  Utilisez ces identifiants pour vous connecter selon le rôle créé.
                </p>
              </div>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => window.location.href = '/auth/login'}
              >
                Aller à la connexion
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-border/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Configuration Initiale
              </h1>
              <p className="text-muted-foreground text-sm">
                Créez un compte utilisateur pour tester l'application
              </p>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  {...register('prenom')}
                  label="Prénom"
                  placeholder="Super"
                  error={errors.prenom?.message}
                  disabled={loading}
                />
                <Input
                  {...register('nom')}
                  label="Nom"
                  placeholder="Admin"
                  error={errors.nom?.message}
                  disabled={loading}
                />
              </div>

              <Input
                {...register('email')}
                type="email"
                label="Email"
                placeholder="admin@fadju.com"
                error={errors.email?.message}
                disabled={loading}
              />

              <Input
                {...register('password')}
                type="password"
                label="Mot de passe"
                placeholder="••••••••"
                error={errors.password?.message}
                disabled={loading}
              />

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Rôle <span className="text-destructive">*</span>
                </label>
                <select
                  {...register('role')}
                  className="flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  disabled={loading}
                >
                  <option value="superadmin">Superadministrateur</option>
                  <option value="secretaire">Secrétaire Santé</option>
                  <option value="medecin">Médecin</option>
                </select>
                {errors.role && (
                  <p className="text-sm text-destructive mt-1">{errors.role.message}</p>
                )}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">ℹ️ Information</h4>
                <p className="text-sm text-blue-700">
                  Chaque rôle accède à une interface différente. Vous pouvez créer plusieurs comptes pour tester les différents rôles.
                </p>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                loading={loading}
                disabled={loading}
              >
                Créer le compte utilisateur
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Déjà un compte ?{' '}
                <a href="/auth/login" className="text-primary hover:underline">
                  Se connecter
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SetupPage;
