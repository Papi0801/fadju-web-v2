import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    doc,
    getDoc,
} from 'firebase/firestore';
import { db } from './config';
import { RendezVous, DossierPatient, User } from '@/types';
import { convertTimestamp } from './utils';

export interface EtablissementStats {
    etablissementId: string;
    etablissementNom: string;

    // Personnel
    totalMedecins: number;
    totalSecretaires: number;
    medecinActifs: number;

    // Patients
    totalPatients: number;
    nouveauPatients30j: number;
    patientsActifs: number;

    // Rendez-vous
    totalRendezVous: number;
    rdvConfirmes: number;
    rdvEnAttente: number;
    rdvAnnules: number;
    rdvTermines: number;
    rdv30j: number;
    rdv7j: number;

    // Performance
    tauxConfirmation: number; // Pourcentage de RDV confirmés
    moyenneRdvParJour: number;
    moyenneRdvParMedecin: number;

    // Tendances
    croissancePatients: number; // Pourcentage d'évolution sur 30j
    croissanceRdv: number; // Pourcentage d'évolution sur 30j

    // Dernière activité
    derniereActivite?: Date;
    dernierRdv?: Date;
}

class EtablissementStatsService {

    // Calculer les statistiques complètes d'un établissement
    async getEtablissementStats(etablissementId: string, etablissementNom: string): Promise<EtablissementStats> {
        try {
            const [
                medecins,
                secretaires,
                patients,
                rendezVous
            ] = await Promise.all([
                this.getMedecinsByEtablissement(etablissementId),
                this.getSecretairesByEtablissement(etablissementId),
                this.getPatientsByEtablissement(etablissementId),
                this.getRendezVousByEtablissement(etablissementId)
            ]);

            // Calculs des stats de base
            const now = new Date();
            const jour30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const jour7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const jour60Ago = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

            // Stats personnel
            const totalMedecins = medecins.length;
            const totalSecretaires = secretaires.length;
            const medecinActifs = medecins.filter(m => m.actif).length;

            // Stats patients
            const totalPatients = patients.length;
            const nouveauPatients30j = patients.filter(p =>
                p.date_creation && p.date_creation.toDate() > jour30Ago
            ).length;
            const patientsActifs = patients.filter(p => p.actif).length;

            // Stats rendez-vous
            const totalRendezVous = rendezVous.length;
            const rdvConfirmes = rendezVous.filter(rv => (rv.statut as any) === 'confirmee' || (rv.statut as any) === 'confirme').length;
            const rdvEnAttente = rendezVous.filter(rv => rv.statut === 'en_attente').length;
            const rdvAnnules = rendezVous.filter(rv => (rv.statut as any) === 'annulee' || (rv.statut as any) === 'annule').length;
            const rdvTermines = rendezVous.filter(rv => (rv.statut as any) === 'terminee' || (rv.statut as any) === 'termine').length;

            const rdv30j = rendezVous.filter(rv =>
                rv.date_rendez_vous && rv.date_rendez_vous.toDate() > jour30Ago
            ).length;
            const rdv7j = rendezVous.filter(rv =>
                rv.date_rendez_vous && rv.date_rendez_vous.toDate() > jour7Ago
            ).length;

            // Calculs de performance
            const tauxConfirmation = totalRendezVous > 0 ? Math.round((rdvConfirmes / totalRendezVous) * 100) : 0;
            const moyenneRdvParJour = rdv30j / 30;
            const moyenneRdvParMedecin = totalMedecins > 0 ? Math.round(totalRendezVous / totalMedecins) : 0;

            // Calculs de croissance
            const rdv60j = rendezVous.filter(rv =>
                rv.date_rendez_vous && rv.date_rendez_vous.toDate() > jour60Ago && rv.date_rendez_vous.toDate() <= jour30Ago
            ).length;
            const patients60j = patients.filter(p =>
                p.date_creation && p.date_creation.toDate() > jour60Ago && p.date_creation.toDate() <= jour30Ago
            ).length;

            const croissanceRdv = rdv60j > 0 ? Math.round(((rdv30j - rdv60j) / rdv60j) * 100) : 0;
            const croissancePatients = patients60j > 0 ? Math.round(((nouveauPatients30j - patients60j) / patients60j) * 100) : 0;

            // Dernières activités
            const derniereActivite = this.getDerniereActivite(medecins, secretaires);
            const dernierRdv = rendezVous.length > 0
                ? rendezVous.sort((a, b) => b.date_rendez_vous.toDate().getTime() - a.date_rendez_vous.toDate().getTime())[0].date_rendez_vous.toDate()
                : undefined;

            return {
                etablissementId,
                etablissementNom,
                totalMedecins,
                totalSecretaires,
                medecinActifs,
                totalPatients,
                nouveauPatients30j,
                patientsActifs,
                totalRendezVous,
                rdvConfirmes,
                rdvEnAttente,
                rdvAnnules,
                rdvTermines,
                rdv30j,
                rdv7j,
                tauxConfirmation,
                moyenneRdvParJour: Math.round(moyenneRdvParJour * 10) / 10,
                moyenneRdvParMedecin,
                croissancePatients,
                croissanceRdv,
                derniereActivite,
                dernierRdv
            };

        } catch (error) {
            console.error('Erreur lors du calcul des stats établissement:', error);
            throw error;
        }
    }

    // Calculer les stats de tous les établissements
    async getAllEtablissementsStats(): Promise<Map<string, EtablissementStats>> {
        try {
            // Récupérer tous les établissements
            const etablissementsQuery = query(
                collection(db, 'etablissements_sante'),
                where('statut_validation', '==', 'valide')
            );

            const etablissementsSnapshot = await getDocs(etablissementsQuery);
            const statsMap = new Map<string, EtablissementStats>();

            // Calculer les stats pour chaque établissement
            await Promise.all(
                etablissementsSnapshot.docs.map(async (etabDoc) => {
                    const etabData = etabDoc.data();
                    const stats = await this.getEtablissementStats(etabDoc.id, etabData.nom);
                    statsMap.set(etabDoc.id, stats);
                })
            );

            return statsMap;
        } catch (error) {
            console.error('Erreur lors du calcul des stats de tous les établissements:', error);
            throw error;
        }
    }

    // Méthodes privées

    private async getMedecinsByEtablissement(etablissementId: string): Promise<User[]> {
        const q = query(
            collection(db, 'users'),
            where('etablissement_id', '==', etablissementId),
            where('role', '==', 'medecin')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...convertTimestamp(doc.data())
        })) as User[];
    }

    private async getSecretairesByEtablissement(etablissementId: string): Promise<User[]> {
        const q = query(
            collection(db, 'users'),
            where('etablissement_id', '==', etablissementId),
            where('role', '==', 'secretaire')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...convertTimestamp(doc.data())
        })) as User[];
    }

    private async getPatientsByEtablissement(etablissementId: string): Promise<DossierPatient[]> {
        // Récupérer les patients affiliés à cet établissement
        const q = query(
            collection(db, 'dossier_patient'),
            where('etablissements_affilies', 'array-contains', etablissementId),
            where('actif', '==', true)
        );

        const snapshot = await getDocs(q);
        const patients = snapshot.docs.map(doc => ({
            id: doc.id,
            ...convertTimestamp(doc.data())
        })) as DossierPatient[];

        // Fallback : si aucun patient avec affiliations, récupérer tous les patients
        if (patients.length === 0) {
            const allPatientsQuery = query(
                collection(db, 'dossier_patient'),
                where('actif', '==', true)
            );
            const allSnapshot = await getDocs(allPatientsQuery);
            return allSnapshot.docs.map(doc => ({
                id: doc.id,
                ...convertTimestamp(doc.data())
            })) as DossierPatient[];
        }

        return patients;
    }

    private async getRendezVousByEtablissement(etablissementId: string): Promise<RendezVous[]> {
        const q = query(
            collection(db, 'rendez_vous'),
            where('etablissement_id', '==', etablissementId)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...convertTimestamp(doc.data())
        })) as RendezVous[];
    }

    private getDerniereActivite(medecins: User[], secretaires: User[]): Date | undefined {
        const allUsers = [...medecins, ...secretaires];
        const lastLogins = allUsers
            .filter(user => (user as any).derniere_connexion)
            .map(user => (user as any).derniere_connexion!.toDate())
            .sort((a, b) => b.getTime() - a.getTime());

        return lastLogins.length > 0 ? lastLogins[0] : undefined;
    }
}

export const etablissementStatsService = new EtablissementStatsService();
