// Collections Firestore
export const COLLECTIONS = {
  USERS: 'users',
  ETABLISSEMENTS_SANTE: 'etablissements_sante',
  RENDEZ_VOUS: 'rendez_vous',
  RESULTATS_MEDICAUX: 'resultats_medicaux',
  CONTACTS_URGENCE: 'contacts_urgence',
} as const;

// Rôles utilisateurs
export const USER_ROLES = {
  SUPERADMIN: 'superadmin',
  SECRETAIRE: 'secretaire',
  MEDECIN: 'medecin',
} as const;

// Statuts des rendez-vous
export const RENDEZ_VOUS_STATUS = {
  EN_ATTENTE: 'en_attente',
  CONFIRME: 'confirme',
  ANNULE: 'annule',
  TERMINE: 'termine',
} as const;

// Types d'établissements
export const ETABLISSEMENT_TYPES = {
  HOPITAL: 'hopital',
  CLINIQUE: 'clinique',
  CABINET: 'cabinet',
} as const;

// Statuts de validation
export const VALIDATION_STATUS = {
  EN_ATTENTE: 'en_attente',
  VALIDE: 'valide',
  REJETE: 'rejete',
} as const;

// Spécialités médicales
export const SPECIALITES_MEDICALES = [
  'Cardiologie',
  'Neurologie',
  'Psychiatrie',
  'Pédiatrie',
  'Gynécologie',
  'Urologie',
  'Dermatologie',
  'Ophtalmologie',
  'ORL',
  'Orthopédie',
  'Radiologie',
  'Anesthésie',
  'Médecine générale',
  'Urgences',
  'Réanimation',
] as const;

// Services médicaux
export const SERVICES_MEDICAUX = [
  'Consultations spécialisées',
  'Urgences',
  'Hospitalisation',
  'Chirurgie',
  'Imagerie médicale',
  'Laboratoire',
  'Pharmacie',
  'Réanimation',
  'Maternité',
  'Pédiatrie',
] as const;

// Régions du Sénégal
export const REGIONS_SENEGAL = [
  'Dakar',
  'Thiès',
  'Saint-Louis',
  'Diourbel',
  'Louga',
  'Fatick',
  'Kaolack',
  'Kolda',
  'Ziguinchor',
  'Tambacounda',
  'Kaffrine',
  'Kédougou',
  'Matam',
  'Sédhiou',
] as const;