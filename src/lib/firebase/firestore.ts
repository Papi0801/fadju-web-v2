import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './config';
import { COLLECTIONS } from '@/lib/constants';
import {
  EtablissementSante,
  RendezVous,
  ResultatMedical,
  ContactUrgence,
  User,
} from '@/types';

// Generic CRUD operations
export class FirestoreService<T> {
  constructor(private collectionName: string) {}

  async create(data: Omit<T, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...data,
        date_creation: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error(`Erreur lors de la création dans ${this.collectionName}:`, error);
      throw error;
    }
  }

  async getById(id: string): Promise<T | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }
      return null;
    } catch (error) {
      console.error(`Erreur lors de la récupération de ${id} dans ${this.collectionName}:`, error);
      throw error;
    }
  }

  async getAll(constraints: QueryConstraint[] = []): Promise<T[]> {
    try {
      const q = query(collection(db, this.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as T[];
    } catch (error) {
      console.error(`Erreur lors de la récupération de ${this.collectionName}:`, error);
      throw error;
    }
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, data as any);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de ${id} dans ${this.collectionName}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Erreur lors de la suppression de ${id} dans ${this.collectionName}:`, error);
      throw error;
    }
  }
}

// Services spécialisés
export const etablissementService = new FirestoreService<EtablissementSante>(
  COLLECTIONS.ETABLISSEMENTS_SANTE
);

export const rendezVousService = new FirestoreService<RendezVous>(
  COLLECTIONS.RENDEZ_VOUS
);

export const resultatMedicalService = new FirestoreService<ResultatMedical>(
  COLLECTIONS.RESULTATS_MEDICAUX
);

export const contactUrgenceService = new FirestoreService<ContactUrgence>(
  COLLECTIONS.CONTACTS_URGENCE
);

export const userService = new FirestoreService<User>(COLLECTIONS.USERS);

// Méthodes spécialisées pour les établissements
export const EtablissementQueries = {
  // Récupérer les établissements en attente de validation
  async getEtablissementsEnAttente(): Promise<EtablissementSante[]> {
    return etablissementService.getAll([
      where('statut_validation', '==', 'en_attente'),
      orderBy('date_creation', 'desc'),
    ]);
  },

  // Récupérer les établissements validés (inclut ceux sans statut_validation pour compatibilité mobile)
  async getEtablissementsValides(): Promise<EtablissementSante[]> {
    try {
      // Récupérer d'abord tous les établissements
      const allEtablissements = await etablissementService.getAll([
        orderBy('nom', 'asc'),
      ]);
      
      // Filtrer localement pour inclure les établissements validés ET ceux sans statut_validation
      return allEtablissements.filter(etablissement => 
        !etablissement.statut_validation || etablissement.statut_validation === 'valide'
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des établissements validés:', error);
      
      // Fallback: essayer de récupérer uniquement ceux avec statut 'valide'
      try {
        return await etablissementService.getAll([
          where('statut_validation', '==', 'valide'),
          orderBy('nom', 'asc'),
        ]);
      } catch (fallbackError) {
        console.error('Erreur fallback:', fallbackError);
        throw fallbackError;
      }
    }
  },

  // Récupérer les établissements par région (inclut ceux sans statut_validation)
  async getEtablissementsByRegion(region: string): Promise<EtablissementSante[]> {
    try {
      // Récupérer tous les établissements de la région
      const allEtablissements = await etablissementService.getAll([
        where('region', '==', region),
        orderBy('nom', 'asc'),
      ]);
      
      // Filtrer localement pour inclure les établissements validés ET ceux sans statut_validation
      return allEtablissements.filter(etablissement => 
        !etablissement.statut_validation || etablissement.statut_validation === 'valide'
      );
    } catch (error) {
      console.error('Erreur lors de la récupération des établissements par région:', error);
      throw error;
    }
  },

  // Récupérer TOUS les établissements (pour debug)
  async getAllEtablissements(): Promise<EtablissementSante[]> {
    return etablissementService.getAll([
      orderBy('date_creation', 'desc'),
    ]);
  },
};

// Méthodes spécialisées pour les rendez-vous
export const RendezVousQueries = {
  // Récupérer les rendez-vous par médecin
  async getRendezVousByMedecin(medecinId: string): Promise<RendezVous[]> {
    return rendezVousService.getAll([
      where('medecin_id', '==', medecinId),
      orderBy('date_rendez_vous', 'desc'),
    ]);
  },

  // Récupérer les rendez-vous en attente pour un établissement
  async getRendezVousEnAttenteByEtablissement(etablissementId: string): Promise<RendezVous[]> {
    return rendezVousService.getAll([
      where('lieu', '==', etablissementId),
      where('statut', '==', 'en_attente'),
      orderBy('date_creation', 'desc'),
    ]);
  },

  // Récupérer les rendez-vous par patient
  async getRendezVousByPatient(patientId: string): Promise<RendezVous[]> {
    return rendezVousService.getAll([
      where('patient_id', '==', patientId),
      orderBy('date_rendez_vous', 'desc'),
    ]);
  },

  // Récupérer les rendez-vous d'aujourd'hui pour un médecin
  async getRendezVousAujourdhui(medecinId: string): Promise<RendezVous[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return rendezVousService.getAll([
      where('medecin_id', '==', medecinId),
      where('date_rendez_vous', '>=', Timestamp.fromDate(today)),
      where('date_rendez_vous', '<', Timestamp.fromDate(tomorrow)),
      orderBy('date_rendez_vous', 'asc'),
    ]);
  },
};

// Méthodes spécialisées pour les résultats médicaux
export const ResultatMedicalQueries = {
  // Récupérer les résultats par patient
  async getResultatsByPatient(patientId: string): Promise<ResultatMedical[]> {
    return resultatMedicalService.getAll([
      where('patient_id', '==', patientId),
      orderBy('date_resultat', 'desc'),
    ]);
  },

  // Récupérer les résultats par médecin
  async getResultatsByMedecin(medecinId: string): Promise<ResultatMedical[]> {
    return resultatMedicalService.getAll([
      where('medecin_id', '==', medecinId),
      orderBy('date_resultat', 'desc'),
    ]);
  },

  // Récupérer les résultats par rendez-vous
  async getResultatsByRendezVous(rendezVousId: string): Promise<ResultatMedical[]> {
    return resultatMedicalService.getAll([
      where('rendez_vous_id', '==', rendezVousId),
      orderBy('date_resultat', 'desc'),
    ]);
  },
};

// Méthodes spécialisées pour les utilisateurs
export const UserQueries = {
  // Récupérer les médecins d'un établissement (actifs seulement)
  async getMedecinsByEtablissement(etablissementId: string): Promise<User[]> {
    return userService.getAll([
      where('role', '==', 'medecin'),
      where('etablissement_id', '==', etablissementId),
      where('actif', '==', true),
      orderBy('nom', 'asc'),
    ]);
  },

  // Récupérer TOUS les médecins d'un établissement (actifs et inactifs)
  async getAllMedecinsByEtablissement(etablissementId: string): Promise<User[]> {
    return userService.getAll([
      where('role', '==', 'medecin'),
      where('etablissement_id', '==', etablissementId),
      orderBy('nom', 'asc'),
    ]);
  },

  // Récupérer les secrétaires d'un établissement
  async getSecretairesByEtablissement(etablissementId: string): Promise<User[]> {
    return userService.getAll([
      where('role', '==', 'secretaire'),
      where('etablissement_id', '==', etablissementId),
      where('actif', '==', true),
      orderBy('nom', 'asc'),
    ]);
  },

  // Récupérer un utilisateur par email
  async getUserByEmail(email: string): Promise<User | null> {
    const users = await userService.getAll([
      where('email', '==', email),
      limit(1),
    ]);
    return users.length > 0 ? users[0] : null;
  },
};