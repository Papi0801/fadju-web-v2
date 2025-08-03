'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Lock,
  Bell,
  Shield,
  Database,
  Download,
  Upload,
  Settings,
  Save,
  Eye,
  EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { useAuthStore } from '@/store';
import { DashboardLayout } from '@/components/layout';
import {
  Button,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Loading,
} from '@/components/ui';

// Schemas de validation
const profileSchema = yup.object({
  nom: yup.string().required('Le nom est requis'),
  prenom: yup.string().required('Le prénom est requis'),
  email: yup.string().email('Email invalide').required('L\'email est requis'),
  telephone: yup.string(),
});

const passwordSchema = yup.object({
  currentPassword: yup.string().required('Le mot de passe actuel est requis'),
  newPassword: yup.string().min(6, 'Minimum 6 caractères').required('Le nouveau mot de passe est requis'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('newPassword')], 'Les mots de passe doivent correspondre')
    .required('Confirmation requise'),
});

type ProfileForm = yup.InferType<typeof profileSchema>;
type PasswordForm = yup.InferType<typeof passwordSchema>;

const SuperAdminSettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'system'>('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Formulaire profil
  const profileForm = useForm<ProfileForm>({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      nom: user?.nom || '',
      prenom: user?.prenom || '',
      email: user?.email || '',
      telephone: user?.telephone || '',
    },
  });

  // Formulaire mot de passe
  const passwordForm = useForm<PasswordForm>({
    resolver: yupResolver(passwordSchema),
  });

  const onProfileSubmit = async (data: ProfileForm) => {
    setActionLoading('profile');
    try {
      // Simulation d'une mise à jour
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Profil mis à jour avec succès');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du profil');
    } finally {
      setActionLoading(null);
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    setActionLoading('password');
    try {
      // Simulation d'une mise à jour
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Mot de passe modifié avec succès');
      passwordForm.reset();
    } catch (error) {
      toast.error('Erreur lors de la modification du mot de passe');
    } finally {
      setActionLoading(null);
    }
  };

  const exportSystemData = async () => {
    setActionLoading('export');
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Export des données terminé');
    } catch (error) {
      toast.error('Erreur lors de l\'export');
    } finally {
      setActionLoading(null);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profil', icon: User },
    { id: 'security', name: 'Sécurité', icon: Shield },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'system', name: 'Système', icon: Database },
  ];

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Paramètres Superadministrateur
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos paramètres personnels et les configurations système
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Onglet Profil */}
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Informations du Profil
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input
                        {...profileForm.register('prenom')}
                        label="Prénom"
                        placeholder="Votre prénom"
                        error={profileForm.formState.errors.prenom?.message}
                        required
                      />

                      <Input
                        {...profileForm.register('nom')}
                        label="Nom"
                        placeholder="Votre nom"
                        error={profileForm.formState.errors.nom?.message}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input
                        {...profileForm.register('email')}
                        type="email"
                        label="Adresse email"
                        placeholder="votre@email.com"
                        leftIcon={<Mail className="w-4 h-4" />}
                        error={profileForm.formState.errors.email?.message}
                        required
                      />

                      <Input
                        {...profileForm.register('telephone')}
                        type="tel"
                        label="Téléphone"
                        placeholder="+221 XX XXX XX XX"
                        leftIcon={<Phone className="w-4 h-4" />}
                        error={profileForm.formState.errors.telephone?.message}
                      />
                    </div>

                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Informations du compte</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Rôle</p>
                          <Badge variant="primary" className="mt-1">Superadministrateur</Badge>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Statut</p>
                          <Badge variant="success" className="mt-1">Actif</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        variant="primary"
                        loading={actionLoading === 'profile'}
                        disabled={actionLoading !== null}
                        className="flex items-center space-x-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>Sauvegarder</span>
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Onglet Sécurité */}
          {activeTab === 'security' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lock className="w-5 h-5 mr-2" />
                    Modifier le Mot de Passe
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                    <Input
                      {...passwordForm.register('currentPassword')}
                      type={showCurrentPassword ? 'text' : 'password'}
                      label="Mot de passe actuel"
                      placeholder="••••••••"
                      leftIcon={<Lock className="w-4 h-4" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="hover:text-foreground transition-colors"
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      }
                      error={passwordForm.formState.errors.currentPassword?.message}
                      required
                    />

                    <Input
                      {...passwordForm.register('newPassword')}
                      type={showNewPassword ? 'text' : 'password'}
                      label="Nouveau mot de passe"
                      placeholder="••••••••"
                      leftIcon={<Lock className="w-4 h-4" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="hover:text-foreground transition-colors"
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      }
                      error={passwordForm.formState.errors.newPassword?.message}
                      required
                    />

                    <Input
                      {...passwordForm.register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      label="Confirmer le nouveau mot de passe"
                      placeholder="••••••••"
                      leftIcon={<Lock className="w-4 h-4" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="hover:text-foreground transition-colors"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      }
                      error={passwordForm.formState.errors.confirmPassword?.message}
                      required
                    />

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">Conseils de sécurité</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Utilisez au moins 8 caractères</li>
                        <li>• Incluez des majuscules et minuscules</li>
                        <li>• Ajoutez des chiffres et caractères spéciaux</li>
                        <li>• Évitez les informations personnelles</li>
                      </ul>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        variant="primary"
                        loading={actionLoading === 'password'}
                        disabled={actionLoading !== null}
                        className="flex items-center space-x-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>Modifier le mot de passe</span>
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Onglet Notifications */}
          {activeTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="w-5 h-5 mr-2" />
                    Préférences de Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-4">Notifications par email</h4>
                      <div className="space-y-4">
                        {[
                          { key: 'new_establishment', label: 'Nouvelles demandes d\'établissement', desc: 'Recevoir un email pour chaque nouvelle demande' },
                          { key: 'system_alerts', label: 'Alertes système', desc: 'Notifications importantes du système' },
                          { key: 'weekly_reports', label: 'Rapports hebdomadaires', desc: 'Résumé hebdomadaire des activités' },
                          { key: 'security_alerts', label: 'Alertes de sécurité', desc: 'Tentatives de connexion suspectes' },
                        ].map((item) => (
                          <div key={item.key} className="flex items-start justify-between p-4 border border-border rounded-lg">
                            <div className="flex-1">
                              <h5 className="font-medium">{item.label}</h5>
                              <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" defaultChecked />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button variant="primary" className="flex items-center space-x-2">
                        <Save className="w-4 h-4" />
                        <span>Sauvegarder les préférences</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Onglet Système */}
          {activeTab === 'system' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="w-5 h-5 mr-2" />
                    Gestion des Données
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold">Export des données</h4>
                        <p className="text-sm text-muted-foreground">
                          Exportez toutes les données du système pour sauvegarde ou analyse.
                        </p>
                        <Button
                          variant="outline"
                          onClick={exportSystemData}
                          loading={actionLoading === 'export'}
                          disabled={actionLoading !== null}
                          className="w-full flex items-center space-x-2"
                        >
                          <Download className="w-4 h-4" />
                          <span>Exporter les données</span>
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold">Import de données</h4>
                        <p className="text-sm text-muted-foreground">
                          Importez des données depuis un fichier de sauvegarde.
                        </p>
                        <Button variant="outline" className="w-full flex items-center space-x-2">
                          <Upload className="w-4 h-4" />
                          <span>Importer des données</span>
                        </Button>
                      </div>
                    </div>

                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                        <Settings className="w-4 h-4 mr-2" />
                        Configuration système
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-yellow-800">Version de l'application</p>
                          <p className="text-yellow-700">v1.0.0</p>
                        </div>
                        <div>
                          <p className="font-medium text-yellow-800">Base de données</p>
                          <p className="text-yellow-700">Firebase Firestore</p>
                        </div>
                        <div>
                          <p className="font-medium text-yellow-800">Dernière sauvegarde</p>
                          <p className="text-yellow-700">Il y a 2 heures</p>
                        </div>
                        <div>
                          <p className="font-medium text-yellow-800">Espace utilisé</p>
                          <p className="text-yellow-700">2.3 GB / 10 GB</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <h4 className="font-semibold text-red-800 mb-2">Zone de danger</h4>
                      <p className="text-sm text-red-700 mb-4">
                        Les actions suivantes sont irréversibles. Procédez avec précaution.
                      </p>
                      <div className="space-y-3">
                        <Button variant="destructive" size="sm">
                          Purger les données expirées
                        </Button>
                        <Button variant="destructive" size="sm">
                          Réinitialiser les statistiques
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default SuperAdminSettingsPage;