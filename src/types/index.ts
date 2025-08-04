import { Timestamp, GeoPoint } from 'firebase/firestore';

// Types d'utilisateurs
export type UserRole = 'superadmin' | 'secretaire' | 'medecin' | 'patient';

export interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: UserRole;
  etablissement_id?: string; // Pour secrétaire et médecin
  telephone?: string;
  specialite?: string; // Pour médecin uniquement
  date_creation: Timestamp;
  actif: boolean;
  premiere_connexion?: boolean; // Pour médecin créé par secrétaire
}

// Établissement de santé
export interface EtablissementSante {
  id: string;
  nom: string;
  adresse: string;
  date_creation: Timestamp;
  description: string;
  email: string;
  localisation: GeoPoint;
  nombre_avis: number;
  note: number;
  ouvert_24h: boolean;
  region: string;
  service_urgence: boolean;
  services: string[];
  site_web?: string;
  specialites: string[];
  telephone: string;
  type: 'hopital' | 'clinique' | 'cabinet';
  ville: string;
  horaires_travail: {
    [jour: string]: string;
  };
  statut_validation?: 'en_attente' | 'valide' | 'rejete';
}

// Rendez-vous
export interface RendezVous {
  id: string;
  patient_id: string;
  medecin_id?: string; // Optionnel jusqu'à attribution par secrétaire
  etablissement_id: string;
  date_rendez_vous: Timestamp;
  heure_debut: string;
  heure_fin: string;
  motif: string;
  statut: 'en_attente' | 'confirmee' | 'annulee' | 'reportee' | 'terminee';
  type: 'consultation' | 'urgence' | 'suivi';
  specialite?: string;
  lieu?: string;
  notes_secretaire?: string | null; // Notes du secrétaire
  notes_medecin?: string | null; // Notes du médecin
  cree_par: 'patient' | 'secretaire' | 'medecin'; // Qui a créé le RDV
  date_creation: Timestamp;
  date_modification: Timestamp;
  // Historique des modifications
  historique_modifications?: {
    date: Timestamp;
    action: 'creation' | 'confirmation' | 'attribution' | 'report' | 'annulation';
    ancien_medecin_id?: string;
    nouveau_medecin_id?: string;
    ancienne_date?: Timestamp;
    nouvelle_date?: Timestamp;
    motif_modification?: string;
    modifie_par: string; // ID de l'utilisateur
  }[];
}

// Dossier Patient
export interface DossierPatient {
  id: string; // Identifiant unique du patient
  patient_id: string; // Référence vers l'utilisateur patient
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  date_naissance: Timestamp;
  genre: 'Homme' | 'Femme';
  allergie?: string | null;
  maladies_chroniques?: string | null;
  groupe_sanguin: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  poids: number; // en kg
  taille: number; // en cm
  traitement_regulier?: string | null; // Noms des médicaments séparés par des virgules
  date_creation: Timestamp;
  date_modification: Timestamp;
  actif: boolean;
}

// Résultats médicaux
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

// Contacts d'urgence
export interface ContactUrgence {
  id: string;
  actif: boolean;
  description: string;
  nom: string;
  priorite: number;
  region: string;
  telephone: string;
  type: 'medical' | 'pompier' | 'police';
}

// Types pour les formulaires
export interface LoginForm {
  email: string;
  password: string;
}

export interface EtablissementForm {
  nom: string;
  adresse: string;
  description: string;
  email: string;
  telephone: string;
  type: 'hopital' | 'clinique' | 'cabinet';
  region: string;
  ville: string;
  site_web?: string;
  service_urgence: boolean;
  ouvert_24h: boolean;
  services: string[];
  specialites: string[];
}

export interface MedecinForm {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  specialite: string;
  etablissement_id: string;
}

// Types pour les états de l'application
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface DashboardStats {
  total_etablissements: number;
  total_rendez_vous: number;
  total_medecins: number;
  rendez_vous_en_attente: number;
}