import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';
import { DossierPatient, ResultatMedical } from '@/types';
import { convertTimestamp } from './utils';

const COLLECTION_NAME = 'dossier_patient';
const RESULTATS_COLLECTION = 'resultats_medicaux';

export const dossierPatientService = {
  // Créer un nouveau dossier patient
  async create(data: Omit<DossierPatient, 'id' | 'date_creation' | 'date_modification'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...data,
        date_creation: serverTimestamp(),
        date_modification: serverTimestamp(),
        actif: true,
      });
      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de la création du dossier patient:', error);
      throw error;
    }
  },

  // Récupérer un dossier patient par ID
  async getById(id: string): Promise<DossierPatient | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...convertTimestamp(data),
        } as DossierPatient;
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération du dossier patient:', error);
      throw error;
    }
  },

  // Récupérer un dossier patient par patient_id
  async getByPatientId(patientId: string): Promise<DossierPatient | null> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('patient_id', '==', patientId),
        where('actif', '==', true),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          ...convertTimestamp(data),
        } as DossierPatient;
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération du dossier patient par patient_id:', error);
      throw error;
    }
  },

  // Mettre à jour un dossier patient
  async update(id: string, data: Partial<Omit<DossierPatient, 'id' | 'date_creation'>>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...data,
        date_modification: serverTimestamp(),
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du dossier patient:', error);
      throw error;
    }
  },

  // Récupérer tous les dossiers patients (pour admin)
  async getAll(): Promise<DossierPatient[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('actif', '==', true),
        orderBy('date_creation', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestamp(doc.data()),
      })) as DossierPatient[];
    } catch (error) {
      console.error('Erreur lors de la récupération des dossiers patients:', error);
      throw error;
    }
  },

  // Récupérer les résultats médicaux d'un patient
  async getResultatsMedicaux(patientId: string): Promise<any[]> {
    try {
      // Utiliser le nouveau service de résultats médicaux
      const { resultatsMedicauxService } = await import('./resultats-medicaux-service');
      return await resultatsMedicauxService.getResultatsByPatient(patientId);
    } catch (error) {
      console.error('Erreur lors de la récupération des résultats médicaux:', error);
      // Fallback vers l'ancien système si le nouveau n'est pas disponible
      try {
        const q = query(
          collection(db, RESULTATS_COLLECTION),
          where('patient_id', '==', patientId),
          orderBy('date_creation', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...convertTimestamp(doc.data()),
        }));
      } catch (fallbackError) {
        console.error('Erreur fallback:', fallbackError);
        return [];
      }
    }
  },

  // Écouter les changements d'un dossier patient
  onDossierChange(patientId: string, callback: (dossier: DossierPatient | null) => void): Unsubscribe {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('patient_id', '==', patientId),
      where('actif', '==', true),
      limit(1)
    );

    return onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        callback({
          id: doc.id,
          ...convertTimestamp(data),
        } as DossierPatient);
      } else {
        callback(null);
      }
    });
  },

  // Supprimer un dossier patient (soft delete)
  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        actif: false,
        date_modification: serverTimestamp(),
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du dossier patient:', error);
      throw error;
    }
  },

  // Rechercher des patients par nom ou email
  async search(searchTerm: string): Promise<DossierPatient[]> {
    try {
      const searchLower = searchTerm.toLowerCase();
      
      // Note: Firestore ne supporte pas la recherche full-text native
      // Cette approche est limitée mais fonctionnelle pour les petites bases de données
      const q = query(
        collection(db, COLLECTION_NAME),
        where('actif', '==', true),
        orderBy('nom')
      );
      
      const querySnapshot = await getDocs(q);
      const allPatients = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestamp(doc.data()),
      })) as DossierPatient[];

      // Filtrer côté client (non optimal mais fonctionnel)
      return allPatients.filter(patient => 
        patient.nom.toLowerCase().includes(searchLower) ||
        patient.prenom.toLowerCase().includes(searchLower) ||
        patient.email.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error('Erreur lors de la recherche de patients:', error);
      throw error;
    }
  },

  // Créer des résultats médicaux de test
  async createTestResultats(patientId: string, medecinId: string): Promise<void> {
    try {
      const testResultats = [
        {
          patient_id: patientId,
          medecin_id: medecinId,
          nom_medecin: 'Mamadou Diop',
          rendez_vous_id: 'rdv_test_001',
          titre: 'Analyse de sang complète',
          type: 'analyse' as const,
          description: 'Bilan sanguin complet avec formule sanguine, glycémie, cholestérol et fonction rénale.',
          donnees: {
            'Hémoglobine': '14.2 g/dL (Normal)',
            'Globules_blancs': '6800 /mm³ (Normal)',
            'Plaquettes': '285 000 /mm³ (Normal)',
            'Glycémie': '1.25 g/L (Élevé)',
            'Cholestérol_total': '2.8 g/L (Élevé)',
            'HDL': '0.45 g/L (Bas)',
            'LDL': '1.95 g/L (Élevé)',
            'Triglycérides': '2.1 g/L (Élevé)',
            'Créatinine': '0.9 mg/dL (Normal)',
            'Urée': '0.35 g/L (Normal)',
          },
          notes: 'Résultats montrant un déséquilibre lipidique et une glycémie légèrement élevée. Recommandation de suivi diététique et contrôle dans 3 mois. Patient diabétique connu, ajustement possible du traitement.',
          statut: 'disponible' as const,
          date_resultat: new Date('2024-01-15T09:30:00'),
          date_consultation: new Date('2024-01-10T14:00:00'),
          date_creation: new Date('2024-01-15T10:00:00'),
        },
        {
          patient_id: patientId,
          medecin_id: medecinId,
          nom_medecin: 'Fatou Ndiaye',
          rendez_vous_id: 'rdv_test_002',
          titre: 'Radiographie thoracique',
          type: 'radiologie' as const,
          description: 'Radiographie pulmonaire de face et de profil pour contrôle de routine.',
          donnees: {
            'Technique': 'Radiographie numérique',
            'Position': 'Debout, face et profil',
            'Qualité_technique': 'Bonne',
            'Cœur': 'Taille normale, contours réguliers',
            'Poumons': 'Parenchyme pulmonaire d\'aspect normal',
            'Plèvre': 'Libre',
            'Diaphragme': 'Coupoles normales et mobiles',
            'Os': 'Pas d\'anomalie osseuse visible',
          },
          notes: 'Radiographie thoracique normale. Pas de signe pathologique décelable. Cœur et poumons d\'aspect normal pour l\'âge.',
          statut: 'disponible' as const,
          date_resultat: new Date('2024-02-08T11:15:00'),
          date_consultation: new Date('2024-02-08T10:00:00'),
          date_creation: new Date('2024-02-08T11:30:00'),
        },
        {
          patient_id: patientId,
          medecin_id: medecinId,
          nom_medecin: 'Amadou Fall',
          rendez_vous_id: 'rdv_test_003',
          titre: 'Consultation de suivi diabète',
          type: 'consultation' as const,
          description: 'Consultation de suivi pour diabète type 2 avec évaluation de l\'équilibre glycémique.',
          donnees: {
            'Poids': '67 kg (+2kg depuis dernière visite)',
            'Tension_arterielle': '14/9 mmHg (Hypertension légère)',
            'Glycémie_capillaire': '1.45 g/L (Élevé)',
            'HbA1c': '7.8% (Déséquilibre)',
            'Tour_de_taille': '98 cm',
            'IMC': '24.6 (Normal)',
            'Examen_pieds': 'Pas de lésion, sensibilité conservée',
            'Fond_œil': 'Pas de rétinopathie',
          },
          notes: 'Patient diabétique avec équilibre glycémique insuffisant. HbA1c à 7.8% nécessite une intensification du traitement. Hypertension artérielle concomitante bien contrôlée. Surveillance du poids recommandée. Prochain contrôle dans 3 mois avec bilan lipidique.',
          statut: 'disponible' as const,
          date_resultat: new Date('2024-03-22T15:45:00'),
          date_consultation: new Date('2024-03-22T15:00:00'),
          date_creation: new Date('2024-03-22T16:00:00'),
        },
        {
          patient_id: patientId,
          medecin_id: medecinId,
          nom_medecin: 'Khadija Sow',
          rendez_vous_id: 'rdv_test_004',
          titre: 'Échographie abdominale',
          type: 'radiologie' as const,
          description: 'Échographie abdominale de contrôle pour surveillance hépatique et rénale.',
          donnees: {
            'Foie': 'Taille normale, contours réguliers, parenchyme homogène',
            'Vésicule_biliaire': 'Libre, parois fines',
            'Voies_biliaires': 'Non dilatées',
            'Pancréas': 'Visible partiellement, aspect normal',
            'Rate': 'Taille et structure normales',
            'Reins': 'Bilatéraux de taille normale, pas de dilatation',
            'Vessie': 'Parois régulières, contenu anéchogène',
            'Aorte': 'Calibre normal',
            'Ascite': 'Absente',
          },
          notes: 'Échographie abdominale normale. Tous les organes examinés présentent un aspect échographique normal. Pas de signe de complications liées au diabète au niveau des organes visualisés.',
          statut: 'disponible' as const,
          date_resultat: new Date('2024-04-10T16:20:00'),
          date_consultation: new Date('2024-04-10T15:30:00'),
          date_creation: new Date('2024-04-10T16:45:00'),
          fichiers_joints: {
            id: 'echo_abd_20240410',
            nom: 'echographie_abdominale.pdf',
            type: 'application/pdf'
          }
        }
      ];

      for (const resultat of testResultats) {
        await addDoc(collection(db, RESULTATS_COLLECTION), {
          ...resultat,
          date_resultat: serverTimestamp(),
          date_consultation: serverTimestamp(),
          date_creation: serverTimestamp(),
        });
      }

      console.log('Résultats médicaux de test créés avec succès');
    } catch (error) {
      console.error('Erreur lors de la création des résultats de test:', error);
      throw error;
    }
  },

  // Créer un seed de test
  async createTestSeed(): Promise<void> {
    try {
      const testPatient: Omit<DossierPatient, 'id' | 'date_creation' | 'date_modification'> = {
        patient_id: 'test1234',
        prenom: 'Aminata',
        nom: 'Diallo',
        email: 'aminata.diallo@email.sn',
        telephone: '+221 77 123 45 67',
        adresse: 'Dakar, Plateau, Rue 15 x Rue 20',
        date_naissance: new Date('1985-03-15').getTime() as any, // Sera converti par Firestore
        genre: 'Femme',
        allergie: 'Pénicilline, Arachides',
        maladies_chroniques: 'Hypertension artérielle',
        groupe_sanguin: 'A+',
        poids: 65,
        taille: 165,
        traitement_regulier: 'Amlodipine 5mg (1x/jour), Metformine 500mg (2x/jour)',
        actif: true,
      };

      await this.create(testPatient);
      console.log('Seed de test créé avec succès pour patient_id: test1234');
    } catch (error) {
      console.error('Erreur lors de la création du seed de test:', error);
      throw error;
    }
  },

  // Vérifier si un patient existe
  async exists(patientId: string): Promise<boolean> {
    try {
      const dossier = await this.getByPatientId(patientId);
      return dossier !== null;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'existence du patient:', error);
      return false;
    }
  },

  // Calculer l'âge d'un patient
  calculateAge(dateNaissance: Date): number {
    const today = new Date();
    const birthDate = new Date(dateNaissance);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  },

  // Calculer l'IMC (Indice de Masse Corporelle)
  calculateIMC(poids: number, taille: number): number {
    const tailleM = taille / 100; // Convertir cm en m
    return Number((poids / (tailleM * tailleM)).toFixed(1));
  },

  // Interpréter l'IMC
  interpretIMC(imc: number): string {
    if (imc < 18.5) return 'Insuffisance pondérale';
    if (imc < 25) return 'Poids normal';
    if (imc < 30) return 'Surpoids';
    if (imc < 35) return 'Obésité modérée';
    if (imc < 40) return 'Obésité sévère';
    return 'Obésité morbide';
  },

  // Récupérer tous les patients affiliés à un établissement
  async getPatientsByEtablissement(etablissementId: string): Promise<DossierPatient[]> {
    try {
      // D'abord essayer la nouvelle requête avec etablissements_affilies
      try {
        const q = query(
          collection(db, COLLECTION_NAME),
          where('etablissements_affilies', 'array-contains', etablissementId),
          where('actif', '==', true),
          orderBy('date_creation', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const patientsAffiliés = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...convertTimestamp(doc.data()),
        })) as DossierPatient[];

        // Si on trouve des patients avec le nouveau système, les retourner
        if (patientsAffiliés.length > 0) {
          return patientsAffiliés;
        }
      } catch (indexError) {
        console.log('Index pour etablissements_affilies pas encore créé, utilisation de la méthode de fallback');
      }

      // Fallback: récupérer tous les patients et filtrer côté client (temporaire)
      console.log('Utilisation du fallback pour récupérer tous les patients');
      const allPatientsQuery = query(
        collection(db, COLLECTION_NAME),
        where('actif', '==', true),
        orderBy('date_creation', 'desc')
      );
      
      const allPatientsSnapshot = await getDocs(allPatientsQuery);
      const allPatients = allPatientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestamp(doc.data()),
      })) as DossierPatient[];

      // Filtrer les patients qui ont cet établissement dans leurs affiliations
      const patientsAffiliés = allPatients.filter(patient => {
        const etablissements = (patient as any).etablissements_affilies;
        if (etablissements && Array.isArray(etablissements)) {
          return etablissements.includes(etablissementId);
        }
        return false;
      });

      // Si aucun patient affilié n'est trouvé ET qu'il n'y a pas de champ etablissements_affilies
      // sur les patients existants, retourner tous les patients (migration en cours)
      if (patientsAffiliés.length === 0 && allPatients.length > 0) {
        const hasAnyAffiliations = allPatients.some(patient => 
          (patient as any).etablissements_affilies && 
          Array.isArray((patient as any).etablissements_affilies)
        );
        
        if (!hasAnyAffiliations) {
          console.log('⚠️ Aucune affiliation détectée, retour de tous les patients (migration nécessaire)');
          return allPatients;
        }
      }

      return patientsAffiliés;
      
    } catch (error) {
      console.error('Erreur lors de la récupération des patients par établissement:', error);
      return []; // Retourner un tableau vide au lieu de throw
    }
  },

  // Vérifier si un patient est affilié à un établissement
  async isPatientAffiliatedToEtablissement(patientId: string, etablissementId: string): Promise<boolean> {
    try {
      const patient = await this.getByPatientId(patientId);
      if (!patient) return false;
      
      const etablissements = (patient as any).etablissements_affilies || [];
      return etablissements.includes(etablissementId);
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'affiliation:', error);
      return false;
    }
  },

  // Affilier un patient à un établissement
  async affiliatePatientToEtablissement(patientId: string, etablissementId: string): Promise<void> {
    try {
      const patient = await this.getByPatientId(patientId);
      if (!patient) {
        throw new Error('Patient non trouvé');
      }

      // Vérifier si déjà affilié
      const isAlreadyAffiliated = await this.isPatientAffiliatedToEtablissement(patientId, etablissementId);
      if (isAlreadyAffiliated) {
        throw new Error('Patient déjà affilié à cet établissement');
      }

      // Ajouter l'établissement à la liste des affiliations
      const etablissements = (patient as any).etablissements_affilies || [];
      const newEtablissements = [...etablissements, etablissementId];

      await this.update(patient.id, {
        etablissements_affilies: newEtablissements,
      } as any);
    } catch (error) {
      console.error('Erreur lors de l\'affiliation du patient:', error);
      throw error;
    }
  },

  // Désaffilier un patient d'un établissement
  async disaffiliatePatientFromEtablissement(patientId: string, etablissementId: string): Promise<void> {
    try {
      const patient = await this.getByPatientId(patientId);
      if (!patient) {
        throw new Error('Patient non trouvé');
      }

      const etablissements = (patient as any).etablissements_affilies || [];
      const newEtablissements = etablissements.filter((id: string) => id !== etablissementId);

      await this.update(patient.id, {
        etablissements_affilies: newEtablissements,
      } as any);
    } catch (error) {
      console.error('Erreur lors de la désaffiliation du patient:', error);
      throw error;
    }
  },

  // Récupérer les établissements affiliés d'un patient
  async getPatientEtablissements(patientId: string): Promise<string[]> {
    try {
      const patient = await this.getByPatientId(patientId);
      if (!patient) return [];
      
      return (patient as any).etablissements_affilies || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des établissements du patient:', error);
      return [];
    }
  },
};