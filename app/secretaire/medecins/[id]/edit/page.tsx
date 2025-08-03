'use client';

import React, { useEffect, useState } from 'react';
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
  Save,
  AlertCircle,
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
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
import { SPECIALITES_MEDICALES } from '@/lib/constants';
import { User as UserType } from '@/types';

const editMedecinSchema = yup.object({
  prenom: yup.string().required('Prénom requis'),
  nom: yup.string().required('Nom requis'),
  email: yup.string().email('Email invalide').required('Email requis'),
  telephone: yup.string().required('Téléphone requis'),
  specialite: yup.string().required('Spécialité requise'),
});

type EditMedecinForm = yup.InferType<typeof editMedecinSchema>;

const EditMedecinPage: React.FC = () => {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const router = useRouter();
  const params = useParams();
  const medecinId = params.id as string;
  
  const [medecin, setMedecin] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<EditMedecinForm>({
    resolver: yupResolver(editMedecinSchema),
  });

  const selectedSpecialite = watch('specialite');

  useEffect(() => {
    fetchMedecinData();
  }, [medecinId]);

  const fetchMedecinData = async () => {
    try {
      const medecinData = await userService.getById(medecinId);
      if (medecinData) {
        setMedecin(medecinData);
        // Remplir le formulaire avec les données existantes
        reset({
          prenom: medecinData.prenom,
          nom: medecinData.nom,
          email: medecinData.email,
          telephone: medecinData.telephone || '',
          specialite: (medecinData as any).specialite || '',
        });
      } else {
        toast.error('Médecin non trouvé');
        router.push('/secretaire/medecins');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
      toast.error('Erreur lors du chargement des informations');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: EditMedecinForm) => {
    if (!medecin) return;

    setSaving(true);
    try {
      // Mettre à jour les informations du médecin
      await userService.update(medecin.id, {
        prenom: data.prenom,
        nom: data.nom,
        email: data.email,
        telephone: data.telephone,
        specialite: data.specialite,
      });

      toast.success('Informations mises à jour avec succès');
      router.push(`/secretaire/medecins/${medecin.id}`);
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
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

  if (!medecin) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Médecin non trouvé</h2>
          <Button onClick={() => router.push('/secretaire/medecins')}>
            Retour à la liste
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
        className="space-y-6 max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/secretaire/medecins/${medecin.id}`)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Modifier Dr. {medecin.prenom} {medecin.nom}
            </h1>
            <p className="text-muted-foreground">
              Modifiez les informations du médecin
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
                  <li>• La modification de l'email nécessitera une nouvelle connexion</li>
                  <li>• Le médecin sera notifié des changements par email</li>
                  <li>• Les rendez-vous existants seront conservés</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulaire */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Informations du médecin</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

              {/* Informations de statut (lecture seule) */}
              <div className="p-4 border rounded-lg bg-muted/30">
                <h3 className="font-medium mb-3">Informations du compte</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Statut</p>
                    <Badge variant={medecin.actif ? 'success' : 'secondary'}>
                      {medecin.actif ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Membre depuis</p>
                    <p className="text-foreground">
                      {medecin.date_creation.toDate().toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/secretaire/medecins/${medecin.id}`)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={saving}
                  disabled={saving}
                  className="min-w-[140px]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default EditMedecinPage;