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
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { convertTimestamp, normalizeResultatMedical } from './utils';

const COLLECTION_NAME = 'resultats_medicaux';

// Interface ResultatMedical pour compatibilité
export interface ResultatMedical {
  id: string;
  date_consultation?: Timestamp | null;
  date_creation: Timestamp;
  date_resultat: Timestamp;
  description: string;
  donnees: {
    [key: string]: string;
  };
  fichiers_joints?: {
    id: string;
    [key: string]: any;
  };
  medecin_id: string;
  nom_medecin: string;
  notes: string;
  patient_id: string;
  rendez_vous_id: string;
  statut: 'en_cours' | 'disponible' | 'archive';
  titre: string;
  type: 'analyse' | 'radiologie' | 'consultation';
}

export const resultatsMedicauxService = {
  // Créer un résultat médical à partir d'une consultation finalisée
  async creerResultatConsultation(data: {
    patient_id: string;
    medecin_id: string;
    nom_medecin: string;
    rendez_vous_id: string;
    date_consultation: Date;
    observations: string;
    ordonnance?: string;
    analyses_demandees?: string;
    diagnostic?: string;
    recommandations?: string;
  }): Promise<string> {
    try {
      const resultat: Omit<ResultatMedical, 'id'> = {
        patient_id: data.patient_id,
        medecin_id: data.medecin_id,
        nom_medecin: data.nom_medecin,
        rendez_vous_id: data.rendez_vous_id,
        date_consultation: Timestamp.fromDate(data.date_consultation),
        date_creation: serverTimestamp() as Timestamp,
        date_resultat: serverTimestamp() as Timestamp,
        type: 'consultation',
        titre: `Consultation du ${data.date_consultation.toLocaleDateString('fr-FR')}`,
        description: data.observations,
        donnees: {
          traitement_prescrit: data.ordonnance || '',
          analyses_demandees: data.analyses_demandees || '',
          diagnostic: data.diagnostic || '',
          recommandations: data.recommandations || '',
          observations: data.observations
        },
        notes: data.observations,
        statut: 'disponible' as any,
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), resultat);
      console.log('Résultat de consultation créé:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de la création du résultat de consultation:', error);
      throw error;
    }
  },

  // Créer un résultat d'analyse
  async creerResultatAnalyse(data: {
    patient_id: string;
    medecin_id: string;
    nom_medecin: string;
    rendez_vous_id: string;
    date_consultation: Date;
    type_analyse: string;
    nom_analyse: string;
    resultats_analyse: string;
    interpretation?: string;
    recommandations?: string;
  }): Promise<string> {
    try {
      const resultat: Omit<ResultatMedical, 'id'> = {
        patient_id: data.patient_id,
        medecin_id: data.medecin_id,
        nom_medecin: data.nom_medecin,
        rendez_vous_id: data.rendez_vous_id,
        date_consultation: Timestamp.fromDate(data.date_consultation),
        date_creation: serverTimestamp() as Timestamp,
        date_resultat: serverTimestamp() as Timestamp,
        type: 'analyse',
        titre: `${data.nom_analyse} - ${data.date_consultation.toLocaleDateString('fr-FR')}`,
        description: `Résultats de l'analyse ${data.nom_analyse} (${data.type_analyse})`,
        donnees: {
          type_analyse: data.type_analyse,
          nom_analyse: data.nom_analyse,
          resultats_analyse: data.resultats_analyse,
          interpretation: data.interpretation || '',
          recommandations: data.recommandations || ''
        },
        notes: data.resultats_analyse,
        statut: 'disponible' as any,
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), resultat);
      console.log('Résultat d\'analyse créé:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de la création du résultat d\'analyse:', error);
      throw error;
    }
  },

  // Récupérer tous les résultats d'un patient
  async getResultatsByPatient(patientId: string): Promise<ResultatMedical[]> {
    try {
      console.log('Recherche des résultats pour patient:', patientId);
      
      // Essayons d'abord sans le filtre de statut pour voir tous les résultats
      const q = query(
        collection(db, COLLECTION_NAME),
        where('patient_id', '==', patientId),
        orderBy('date_consultation', 'desc')
      );

      const querySnapshot = await getDocs(q);
      console.log('Nombre de documents trouvés:', querySnapshot.size);
      
      const results = querySnapshot.docs.map(doc => {
        console.log('Document trouvé:', doc.id, doc.data());
        return {
          id: doc.id,
          ...convertTimestamp(normalizeResultatMedical(doc.data())),
        };
      }) as ResultatMedical[];
      
      console.log('Résultats finaux:', results);
      return results;
    } catch (error) {
      console.error('Erreur lors de la récupération des résultats du patient:', error);
      // Retourner un tableau vide au lieu de throw pour éviter de casser l'interface
      return [];
    }
  },

  // Récupérer les résultats créés par un médecin
  async getResultatsByMedecin(medecinId: string, limit_count?: number): Promise<ResultatMedical[]> {
    try {
      let q = query(
        collection(db, COLLECTION_NAME),
        where('medecin_id', '==', medecinId),
        orderBy('date_consultation', 'desc')
      );

      if (limit_count) {
        q = query(q, limit(limit_count));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestamp(normalizeResultatMedical(doc.data())),
      })) as ResultatMedical[];
    } catch (error) {
      console.error('Erreur lors de la récupération des résultats du médecin:', error);
      throw error;
    }
  },

  // Récupérer un résultat spécifique
  async getResultatById(resultatId: string): Promise<ResultatMedical | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, resultatId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...convertTimestamp(docSnap.data()),
      } as ResultatMedical;
    } catch (error) {
      console.error('Erreur lors de la récupération du résultat:', error);
      throw error;
    }
  },

  // Mettre à jour un résultat médical
  async updateResultat(resultatId: string, updateData: Partial<ResultatMedical>): Promise<void> {
    try {
      const resultatRef = doc(db, COLLECTION_NAME, resultatId);
      const dataToUpdate = {
        ...updateData,
        date_modification: serverTimestamp(),
      };

      await updateDoc(resultatRef, dataToUpdate);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du résultat:', error);
      throw error;
    }
  },

  // Supprimer un résultat médical
  async deleteResultat(resultatId: string): Promise<void> {
    try {
      const resultatRef = doc(db, COLLECTION_NAME, resultatId);
      await deleteDoc(resultatRef);
    } catch (error) {
      console.error('Erreur lors de la suppression du résultat:', error);
      throw error;
    }
  },

  // Obtenir les statistiques des résultats pour un médecin
  async getStatistiquesMedecin(medecinId: string): Promise<{
    total: number;
    consultations: number;
    analyses: number;
    ce_mois: number;
  }> {
    try {
      const resultats = await this.getResultatsByMedecin(medecinId);
      
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      return {
        total: resultats.length,
        consultations: resultats.filter(r => r.type === 'consultation').length,
        analyses: resultats.filter(r => r.type === 'analyse').length,
        ce_mois: resultats.filter(r => {
          if (!r.date_consultation) return false;
          const resultDate = r.date_consultation.toDate();
          return resultDate >= startOfMonth;
        }).length,
      };
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      throw error;
    }
  },
};