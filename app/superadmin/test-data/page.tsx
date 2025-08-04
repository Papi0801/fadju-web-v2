'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Database,
  Users,
  Calendar,
  Trash2,
  Plus,
  RefreshCw,
  Check,
  AlertTriangle,
  User,
  Stethoscope
} from 'lucide-react';

import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui';
import { dossierPatientService } from '@/lib/firebase/dossier-patient';
import toast from 'react-hot-toast';

const TestDataPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [createdPatients, setCreatedPatients] = useState<string[]>([]);

  const testPatients = [
    {
      patient_id: 'test1234',
      prenom: 'Aminata',
      nom: 'Diallo',
      email: 'aminata.diallo@email.sn',
      telephone: '+221 77 123 45 67',
      adresse: 'Dakar, Plateau, Rue 15 x Rue 20, Appartement 3B',
      date_naissance: new Date('1985-03-15'),
      genre: 'Femme' as const,
      allergie: 'Pénicilline, Arachides, Pollen de graminées',
      maladies_chroniques: 'Hypertension artérielle, Diabète type 2',
      groupe_sanguin: 'A+' as const,
      poids: 65,
      taille: 165,
      traitement_regulier: 'Amlodipine 5mg (1x/jour matin), Metformine 500mg (2x/jour), Aspirine 100mg (1x/jour)',
      description: 'Patient type avec pathologies chroniques courantes',
    },
    {
      patient_id: 'test5678',
      prenom: 'Moussa',
      nom: 'Sarr',
      email: 'moussa.sarr@email.sn',
      telephone: '+221 76 987 65 43',
      adresse: 'Thiès, Quartier Randoulène, Villa 45',
      date_naissance: new Date('1978-08-22'),
      genre: 'Homme' as const,
      allergie: 'Iode, Latex',
      maladies_chroniques: 'Asthme bronchique',
      groupe_sanguin: 'O+' as const,
      poids: 78,
      taille: 175,
      traitement_regulier: 'Ventoline (selon besoin), Symbicort 160/4.5 (2x/jour)',
      description: 'Patient avec pathologie respiratoire',
    },
    {
      patient_id: 'test9012',
      prenom: 'Fatou',
      nom: 'Ba',
      email: 'fatou.ba@email.sn',
      telephone: '+221 78 456 12 34',
      adresse: 'Saint-Louis, Sor, Rue Khalifa Ababacar Sy, Maison 12',
      date_naissance: new Date('1992-11-07'),
      genre: 'Femme' as const,
      allergie: null,
      maladies_chroniques: null,
      groupe_sanguin: 'B-' as const,
      poids: 58,
      taille: 160,
      traitement_regulier: null,
      description: 'Patient jeune sans pathologie particulière',
    },
    {
      patient_id: 'test3456',
      prenom: 'Ibrahima',
      nom: 'Fall',
      email: 'ibrahima.fall@email.sn',
      telephone: '+221 77 654 32 10',
      adresse: 'Kaolack, Médina Baye, Quartier Léona',
      date_naissance: new Date('1965-05-14'),
      genre: 'Homme' as const,
      allergie: 'Sulfamides',
      maladies_chroniques: 'Insuffisance cardiaque, Arthrose du genou',
      groupe_sanguin: 'AB+' as const,
      poids: 85,
      taille: 170,
      traitement_regulier: 'Lisinopril 10mg (1x/jour), Furosémide 40mg (1x/jour), Glucosamine (2x/jour)',
      description: 'Patient âgé avec pathologies multiples',
    },
  ];

  const createAllTestPatients = async () => {
    setLoading(true);
    const created: string[] = [];

    try {
      for (const patient of testPatients) {
        // Vérifier si le patient existe déjà
        const exists = await dossierPatientService.exists(patient.patient_id);
        
        if (!exists) {
          const { description, ...patientData } = patient;
          await dossierPatientService.create(patientData);
          created.push(patient.patient_id);
          toast.success(`Patient ${patient.prenom} ${patient.nom} créé !`);

          // Créer des résultats médicaux de test pour Aminata Diallo (test1234)
          if (patient.patient_id === 'test1234') {
            try {
              await dossierPatientService.createTestResultats('test1234', 'medecin_test_001');
              toast.success('Historique médical créé pour Aminata Diallo !');
            } catch (error) {
              console.warn('Erreur lors de la création de l\'historique médical:', error);
            }
          }
        } else {
          toast.info(`Patient ${patient.prenom} ${patient.nom} existe déjà`);
        }
      }

      setCreatedPatients(prev => [...prev, ...created]);
      
      if (created.length > 0) {
        toast.success(`${created.length} patient(s) de test créé(s) avec succès !`);
      }

    } catch (error) {
      console.error('Erreur lors de la création des patients de test:', error);
      toast.error('Erreur lors de la création des patients de test');
    } finally {
      setLoading(false);
    }
  };

  const createSinglePatient = async (patient: typeof testPatients[0]) => {
    setLoading(true);

    try {
      // Vérifier si le patient existe déjà
      const exists = await dossierPatientService.exists(patient.patient_id);
      
      if (!exists) {
        const { description, ...patientData } = patient;
        await dossierPatientService.create(patientData);
        setCreatedPatients(prev => [...prev, patient.patient_id]);
        toast.success(`Patient ${patient.prenom} ${patient.nom} créé avec succès !`);
      } else {
        toast.info(`Patient ${patient.prenom} ${patient.nom} existe déjà`);
      }

    } catch (error) {
      console.error('Erreur lors de la création du patient:', error);
      toast.error(`Erreur lors de la création du patient ${patient.prenom} ${patient.nom}`);
    } finally {
      setLoading(false);
    }
  };

  const checkPatientExists = async (patientId: string) => {
    try {
      return await dossierPatientService.exists(patientId);
    } catch (error) {
      console.error('Erreur lors de la vérification du patient:', error);
      return false;
    }
  };

  const getPatientAge = (dateNaissance: Date) => {
    return dossierPatientService.calculateAge(dateNaissance);
  };

  const getIMC = (poids: number, taille: number) => {
    return dossierPatientService.calculateIMC(poids, taille);
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Données de test
            </h1>
            <p className="text-muted-foreground mt-2">
              Créez des patients de test pour développer et tester les fonctionnalités
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={createAllTestPatients}
              loading={loading}
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Créer tous les patients</span>
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <AlertTriangle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  Instructions pour tester les patients
                </h3>
                <div className="text-blue-700 dark:text-blue-300 space-y-2 text-sm">
                  <p>1. <strong>Créez les patients de test</strong> en cliquant sur les boutons ci-dessous</p>
                  <p>2. <strong>Créez des rendez-vous</strong> depuis l'interface secrétaire en utilisant les patient_id</p>
                  <p>3. <strong>Connectez-vous en tant que médecin</strong> pour voir les informations patient complètes</p>
                  <p>4. <strong>Consultez l'historique médical</strong> : Aminata Diallo aura 4 résultats détaillés (analyses, radiologie, consultations)</p>
                  <p>5. <strong>Testez la synchronisation</strong> entre web et mobile avec ces données</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des patients de test */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {testPatients.map((patient) => (
            <Card key={patient.patient_id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>{patient.prenom} {patient.nom}</span>
                  </div>
                  <Badge 
                    variant={createdPatients.includes(patient.patient_id) ? 'default' : 'secondary'}
                    className={createdPatients.includes(patient.patient_id) ? 'bg-green-100 text-green-800' : ''}
                  >
                    {createdPatients.includes(patient.patient_id) ? (
                      <div className="flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span>Créé</span>
                      </div>
                    ) : (
                      'À créer'
                    )}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Informations de base */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="font-medium text-muted-foreground">Patient ID</label>
                    <p className="font-mono bg-muted px-2 py-1 rounded text-xs">
                      {patient.patient_id}
                    </p>
                  </div>
                  <div>
                    <label className="font-medium text-muted-foreground">Âge / Genre</label>
                    <p>{getPatientAge(patient.date_naissance)} ans • {patient.genre}</p>
                  </div>
                  <div>
                    <label className="font-medium text-muted-foreground">Contact</label>
                    <p className="text-xs">{patient.telephone}</p>
                  </div>
                  <div>
                    <label className="font-medium text-muted-foreground">Groupe sanguin</label>
                    <Badge variant="outline" className="text-red-600 border-red-200">
                      {patient.groupe_sanguin}
                    </Badge>
                  </div>
                </div>

                {/* Informations médicales */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="font-medium text-muted-foreground">Poids / Taille</label>
                      <p>{patient.poids} kg • {patient.taille} cm</p>
                    </div>
                    <div>
                      <label className="font-medium text-muted-foreground">IMC</label>
                      <p>{getIMC(patient.poids, patient.taille)}</p>
                    </div>
                  </div>

                  {patient.allergie && (
                    <div>
                      <label className="font-medium text-muted-foreground text-xs">Allergies</label>
                      <p className="text-sm text-red-600">{patient.allergie}</p>
                    </div>
                  )}

                  {patient.maladies_chroniques && (
                    <div>
                      <label className="font-medium text-muted-foreground text-xs">Maladies chroniques</label>
                      <p className="text-sm text-orange-600">{patient.maladies_chroniques}</p>
                    </div>
                  )}

                  {patient.traitement_regulier && (
                    <div>
                      <label className="font-medium text-muted-foreground text-xs">Traitement régulier</label>
                      <p className="text-sm text-blue-600">{patient.traitement_regulier}</p>
                    </div>
                  )}
                </div>

                {/* Description du cas */}
                <div className="pt-2 border-t">
                  <label className="font-medium text-muted-foreground text-xs">Cas type</label>
                  <p className="text-sm italic">{patient.description}</p>
                  {patient.patient_id === 'test1234' && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-xs text-blue-800 dark:text-blue-200 font-medium">
                        ⭐ Ce patient aura un historique médical complet avec 4 résultats détaillés :
                      </p>
                      <ul className="text-xs text-blue-700 dark:text-blue-300 mt-1 ml-2">
                        <li>• Analyse de sang complète</li>
                        <li>• Radiographie thoracique</li>
                        <li>• Consultation de suivi diabète</li>
                        <li>• Échographie abdominale</li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 border-t">
                  <Button
                    onClick={() => createSinglePatient(patient)}
                    loading={loading}
                    disabled={loading || createdPatients.includes(patient.patient_id)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    {createdPatients.includes(patient.patient_id) ? (
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4" />
                        <span>Patient créé</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Plus className="w-4 h-4" />
                        <span>Créer ce patient</span>
                      </div>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Instructions pour les rendez-vous */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Étapes suivantes</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">1</span>
                  </div>
                  <h4 className="font-semibold">Créer des rendez-vous</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Allez sur la page "Rendez-vous" et créez des RDV en utilisant les patient_id ci-dessus
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">2</span>
                  </div>
                  <h4 className="font-semibold">Tester l'interface médecin</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Connectez-vous comme médecin pour voir les dossiers patients complets
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-sm">3</span>
                  </div>
                  <h4 className="font-semibold">Synchronisation mobile</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Utilisez ces données pour tester la synchronisation avec l'app mobile
                </p>
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Patient IDs pour les rendez-vous :</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {testPatients.map(patient => (
                  <div key={patient.patient_id} className="font-mono text-sm bg-background p-2 rounded border">
                    {patient.patient_id}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default TestDataPage;