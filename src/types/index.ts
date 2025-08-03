import { Timestamp, GeoPoint } from 'firebase/firestore';

// Types d'utilisateurs
export type UserRole = 'superadmin' | 'secretaire' | 'medecin';

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
  creneau_horaire: string;
  date_creation: Timestamp;
  date_rendez_vous: Timestamp;
  lieu: string;
  medecin_id: string;
  motif: string;
  nom_medecin: string;
  notes?: string | null;
  patient_id: string;
  specialite: string;
  statut: 'en_attente' | 'confirme' | 'annule' | 'termine';
  type: 'consultation' | 'urgence' | 'suivi';
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