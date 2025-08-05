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
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { RendezVous } from '@/types';
import { convertTimestamp } from './utils';

const COLLECTION_NAME = 'rendez_vous';

// Fonction utilitaire pour nettoyer les valeurs undefined
const cleanUndefinedFields = (obj: Record<string, any>): Record<string, any> => {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

export const rendezVousService = {
  // Créer une demande de rendez-vous (par patient ou secrétaire)
  async createDemandeRendezVous(data: {
    patient_id: string;
    etablissement_id: string;
    date_rdv: Date;
    heure_debut: string;
    heure_fin: string;
    motif: string;
    type: 'consultation' | 'urgence' | 'suivi';
    specialite?: string;
    cree_par: 'patient' | 'secretaire';
    medecin_id?: string; // Si le secrétaire attribue directement
    notes_secretaire?: string;
  }): Promise<string> {
    try {
      const rdvData = cleanUndefinedFields({
        ...data,
        date_rdv: Timestamp.fromDate(data.date_rdv),
        statut: data.cree_par === 'secretaire' && data.medecin_id ? 'confirmee' : 'en_attente',
        date_creation: serverTimestamp(),
        date_modification: serverTimestamp(),
        historique_modifications: [{
          date: new Date(),
          action: 'creation',
          modifie_par: data.cree_par,
          motif_modification: `Demande de rendez-vous créée par ${data.cree_par}`
        }]
      });

      const docRef = await addDoc(collection(db, COLLECTION_NAME), rdvData);
      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de la création de la demande de RDV:', error);
      throw error;
    }
  },

  // Récupérer toutes les demandes en attente pour un établissement
  async getDemandesEnAttente(etablissementId: string): Promise<RendezVous[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('etablissement_id', '==', etablissementId),
        where('statut', '==', 'en_attente'),
        orderBy('date_creation', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestamp(doc.data()),
      })) as RendezVous[];
    } catch (error) {
      console.error('Erreur lors de la récupération des demandes en attente:', error);
      throw error;
    }
  },

  // Récupérer tous les rendez-vous pour un établissement
  async getRendezVousByEtablissement(etablissementId: string): Promise<RendezVous[]> {
    try {
      // D'abord récupérer les médecins de l'établissement
      const medecinsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'medecin'),
        where('etablissement_id', '==', etablissementId),
        where('actif', '==', true)
      );
      
      const medecinsSnapshot = await getDocs(medecinsQuery);
      const medecinIds = medecinsSnapshot.docs.map(doc => doc.id);

      if (medecinIds.length === 0) {
        return [];
      }

      // Récupérer tous les RDV
      const rdvQuery = query(
        collection(db, COLLECTION_NAME),
        orderBy('date_rdv', 'desc')
      );
      
      const rdvSnapshot = await getDocs(rdvQuery);
      const tousLesRdv = rdvSnapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestamp(doc.data()),
      }));

      // Filtrer les RDV par médecins de l'établissement
      const rdvs = tousLesRdv.filter((rdv: any) => {
        // Nouveau système : etablissement_id correspond
        if (rdv.etablissement_id === etablissementId) {
          return true;
        }
        
        // Ancien système : medecin_id appartient à l'établissement
        if (rdv.medecin_id && medecinIds.includes(rdv.medecin_id)) {
          return true;
        }
        
        return false;
      }) as RendezVous[];

      return rdvs;
    } catch (error) {
      console.error('Erreur lors de la récupération des RDV par établissement:', error);
      throw error;
    }
  },

  // Récupérer les rendez-vous d'un médecin (seulement confirmés)
  async getRendezVousByMedecin(medecinId: string): Promise<RendezVous[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('medecin_id', '==', medecinId),
        where('statut', 'in', ['confirmee', 'terminee', 'confirme', 'termine']),
        orderBy('date_rdv', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestamp(doc.data()),
      })) as RendezVous[];
    } catch (error) {
      console.error('Erreur lors de la récupération des RDV par médecin:', error);
      throw error;
    }
  },

  // Confirmer et attribuer un rendez-vous à un médecin
  async confirmerEtAttribuer(
    rdvId: string, 
    medecinId: string, 
    secretaireId: string,
    notes_secretaire?: string
  ): Promise<void> {
    try {
      const rdvRef = doc(db, COLLECTION_NAME, rdvId);
      const rdvDoc = await getDoc(rdvRef);
      
      if (!rdvDoc.exists()) {
        throw new Error('Rendez-vous non trouvé');
      }

      const currentData = rdvDoc.data();
      
      const updateData = cleanUndefinedFields({
        medecin_id: medecinId,
        statut: 'confirmee',
        notes_secretaire,
        date_modification: serverTimestamp(),
        historique_modifications: [
          ...(currentData.historique_modifications || []),
          {
            date: new Date(),
            action: 'confirmation',
            nouveau_medecin_id: medecinId,
            modifie_par: secretaireId,
            motif_modification: 'Rendez-vous confirmé et attribué au médecin'
          }
        ]
      });

      await updateDoc(rdvRef, updateData);
    } catch (error) {
      console.error('Erreur lors de la confirmation du RDV:', error);
      throw error;
    }
  },

  // Reporter un rendez-vous
  async reporterRendezVous(
    rdvId: string,
    nouvelleDate: Date,
    nouvelleHeureDebut: string,
    nouvelleHeureFin: string,
    secretaireId: string,
    motifReport: string
  ): Promise<void> {
    try {
      const rdvRef = doc(db, COLLECTION_NAME, rdvId);
      const rdvDoc = await getDoc(rdvRef);
      
      if (!rdvDoc.exists()) {
        throw new Error('Rendez-vous non trouvé');
      }

      const currentData = rdvDoc.data();
      
      await updateDoc(rdvRef, {
        date_rdv: Timestamp.fromDate(nouvelleDate),
        heure_debut: nouvelleHeureDebut,
        heure_fin: nouvelleHeureFin,
        statut: 'reportee',
        date_modification: serverTimestamp(),
        historique_modifications: [
          ...(currentData.historique_modifications || []),
          {
            date: new Date(),
            action: 'report',
            ancienne_date: currentData.date_rdv,
            nouvelle_date: Timestamp.fromDate(nouvelleDate),
            modifie_par: secretaireId,
            motif_modification: motifReport
          }
        ]
      });
    } catch (error) {
      console.error('Erreur lors du report du RDV:', error);
      throw error;
    }
  },

  // Réattribuer un rendez-vous à un autre médecin
  async reattribuerMedecin(
    rdvId: string,
    nouveauMedecinId: string,
    secretaireId: string,
    motifReattribution: string
  ): Promise<void> {
    try {
      const rdvRef = doc(db, COLLECTION_NAME, rdvId);
      const rdvDoc = await getDoc(rdvRef);
      
      if (!rdvDoc.exists()) {
        throw new Error('Rendez-vous non trouvé');
      }

      const currentData = rdvDoc.data();
      
      await updateDoc(rdvRef, {
        medecin_id: nouveauMedecinId,
        date_modification: serverTimestamp(),
        historique_modifications: [
          ...(currentData.historique_modifications || []),
          {
            date: new Date(),
            action: 'attribution',
            ancien_medecin_id: currentData.medecin_id,
            nouveau_medecin_id: nouveauMedecinId,
            modifie_par: secretaireId,
            motif_modification: motifReattribution
          }
        ]
      });
    } catch (error) {
      console.error('Erreur lors de la réattribution du médecin:', error);
      throw error;
    }
  },

  // Annuler un rendez-vous
  async annulerRendezVous(
    rdvId: string,
    userId: string,
    motifAnnulation: string
  ): Promise<void> {
    try {
      const rdvRef = doc(db, COLLECTION_NAME, rdvId);
      const rdvDoc = await getDoc(rdvRef);
      
      if (!rdvDoc.exists()) {
        throw new Error('Rendez-vous non trouvé');
      }

      const currentData = rdvDoc.data();
      
      await updateDoc(rdvRef, {
        statut: 'annulee',
        date_modification: serverTimestamp(),
        historique_modifications: [
          ...(currentData.historique_modifications || []),
          {
            date: new Date(),
            action: 'annulation',
            modifie_par: userId,
            motif_modification: motifAnnulation
          }
        ]
      });
    } catch (error) {
      console.error('Erreur lors de l\'annulation du RDV:', error);
      throw error;
    }
  },

  // Marquer un rendez-vous comme terminé
  async terminerRendezVous(
    rdvId: string,
    medecinId: string,
    notesMedecin?: string
  ): Promise<void> {
    try {
      const rdvRef = doc(db, COLLECTION_NAME, rdvId);
      const rdvDoc = await getDoc(rdvRef);
      
      if (!rdvDoc.exists()) {
        throw new Error('Rendez-vous non trouvé');
      }

      const currentData = rdvDoc.data();
      
      const updateData = cleanUndefinedFields({
        statut: 'terminee',
        notes_medecin: notesMedecin,
        date_modification: serverTimestamp(),
        historique_modifications: [
          ...(currentData.historique_modifications || []),
          {
            date: new Date(),
            action: 'terminaison',
            modifie_par: medecinId,
            motif_modification: 'Consultation terminée'
          }
        ]
      });

      await updateDoc(rdvRef, updateData);
    } catch (error) {
      console.error('Erreur lors de la terminaison du RDV:', error);
      throw error;
    }
  },

  // Écouter les changements en temps réel pour un établissement
  onRendezVousChange(etablissementId: string, callback: (rdvs: RendezVous[]) => void): Unsubscribe {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('etablissement_id', '==', etablissementId),
      orderBy('date_creation', 'desc')
    );

    return onSnapshot(q, (querySnapshot) => {
      const rdvs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestamp(doc.data()),
      })) as RendezVous[];
      callback(rdvs);
    });
  },

  // Récupérer un rendez-vous par ID
  async getById(rdvId: string): Promise<RendezVous | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, rdvId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...convertTimestamp(docSnap.data()),
        } as RendezVous;
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération du RDV:', error);
      throw error;
    }
  },

  // Obtenir les statistiques pour le dashboard secrétaire
  async getStatistiquesEtablissement(etablissementId: string) {
    try {
      const rdvs = await this.getRendezVousByEtablissement(etablissementId);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return {
        total: rdvs.length,
        en_attente: rdvs.filter(rdv => rdv.statut === 'en_attente').length,
        confirmees: rdvs.filter(rdv => rdv.statut === 'confirmee').length,
        aujourdhui: rdvs.filter(rdv => {
          const rdvDate = rdv.date_rdv.toDate();
          return rdvDate >= today && rdvDate < tomorrow;
        }).length,
        reportees: rdvs.filter(rdv => rdv.statut === 'reportee').length,
        annulees: rdvs.filter(rdv => rdv.statut === 'annulee').length,
      };
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      throw error;
    }
  },

  // Nettoyer et migrer tous les RDV (ajouter etablissement_id manquant et corriger les incohérences)
  async nettoyerEtMigrerRdv(etablissementId: string) {
    try {
      // Récupérer tous les RDV sans filtre pour une migration complète
      const allRdvQuery = query(collection(db, COLLECTION_NAME));
      const allRdvSnapshot = await getDocs(allRdvQuery);
      
      // Récupérer les médecins de cet établissement pour identifier les RDV à migrer
      const medecinsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'medecin'),
        where('etablissement_id', '==', etablissementId),
        where('actif', '==', true)
      );
      const medecinsSnapshot = await getDocs(medecinsQuery);
      const medecinIds = medecinsSnapshot.docs.map(doc => doc.id);

      const batch = writeBatch(db);
      let updateCount = 0;
      const now = new Date();

      allRdvSnapshot.docs.forEach(docSnap => {
        const rdv = docSnap.data();
        let needsUpdate = false;
        let updateData: any = {};
        let modifications = [];

        // 1. Vérifier si le RDV appartient à cet établissement
        const belongsToEtablissement = 
          rdv.etablissement_id === etablissementId || 
          (rdv.medecin_id && medecinIds.includes(rdv.medecin_id));

        if (!belongsToEtablissement) {
          return; // Passer au RDV suivant
        }

        // 2. Ajouter etablissement_id si manquant
        if (!rdv.etablissement_id) {
          updateData.etablissement_id = etablissementId;
          needsUpdate = true;
          modifications.push({
            date: now,
            action: 'migration',
            champ_modifie: 'etablissement_id',
            ancienne_valeur: null,
            nouvelle_valeur: etablissementId,
            modifie_par: 'system',
            motif_modification: 'Migration - Ajout du champ etablissement_id manquant'
          });
        }

        // 3. Nettoyer les RDV en attente qui ont un medecin_id
        if (rdv.statut === 'en_attente' && rdv.medecin_id) {
          updateData.medecin_id = null;
          needsUpdate = true;
          modifications.push({
            date: now,
            action: 'nettoyage',
            champ_modifie: 'medecin_id',
            ancienne_valeur: rdv.medecin_id,
            nouvelle_valeur: null,
            modifie_par: 'system',
            motif_modification: 'Nettoyage données incohérentes - RDV en attente ne doit pas avoir de médecin attribué'
          });
        }

        // 4. Migrer creneau_horaire vers heure_debut/heure_fin si nécessaire
        if (rdv.creneau_horaire && (!rdv.heure_debut || !rdv.heure_fin)) {
          // Essayer de parser le creneau_horaire (ex: "14:30 - 15:00")
          const creneauMatch = rdv.creneau_horaire.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
          if (creneauMatch) {
            updateData.heure_debut = creneauMatch[1];
            updateData.heure_fin = creneauMatch[2];
            needsUpdate = true;
            modifications.push({
              date: now,
              action: 'migration',
              champ_modifie: 'heure_debut_fin',
              ancienne_valeur: rdv.creneau_horaire,
              nouvelle_valeur: `${creneauMatch[1]} - ${creneauMatch[2]}`,
              modifie_par: 'system',
              motif_modification: 'Migration creneau_horaire vers heure_debut/heure_fin'
            });
          }
        }

        // 5. Appliquer les modifications si nécessaire
        if (needsUpdate) {
          updateData.date_modification = serverTimestamp();
          updateData.historique_modifications = [
            ...(rdv.historique_modifications || []),
            ...modifications
          ];

          batch.update(docSnap.ref, updateData);
          updateCount++;
        }
      });

      if (updateCount > 0) {
        await batch.commit();
        console.log(`${updateCount} RDV nettoyés et migrés pour l'établissement ${etablissementId}`);
      }
      
      return updateCount;
    } catch (error) {
      console.error('Erreur lors du nettoyage et migration des RDV:', error);
      throw error;
    }
  },

  // Mettre à jour le statut d'un rendez-vous
  async updateStatut(
    rdvId: string,
    nouveauStatut: 'en_attente' | 'confirmee' | 'terminee' | 'annulee' | 'reportee',
    userId?: string,
    motif?: string
  ): Promise<void> {
    try {
      const rdvRef = doc(db, COLLECTION_NAME, rdvId);
      const rdvDoc = await getDoc(rdvRef);
      
      if (!rdvDoc.exists()) {
        throw new Error('Rendez-vous non trouvé');
      }

      const currentData = rdvDoc.data();
      const updateData: any = {
        statut: nouveauStatut,
        date_modification: serverTimestamp(),
      };

      // Ajouter à l'historique des modifications
      const modification = {
        date: new Date(),
        action: 'changement_statut',
        ancien_statut: currentData.statut,
        nouveau_statut: nouveauStatut,
        modifie_par: userId || 'system',
        motif_modification: motif || `Changement de statut vers ${nouveauStatut}`
      };

      updateData.historique_modifications = [
        ...(currentData.historique_modifications || []),
        modification
      ];

      await updateDoc(rdvRef, updateData);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      throw error;
    }
  },
};