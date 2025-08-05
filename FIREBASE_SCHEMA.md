# Structure Firebase - Projet Fadju

## Collections Firestore

### 1. etablissements_sante
Structure pour les hôpitaux et cabinets médicaux
```typescript
{
  id: string; // ID du document
  nom: string; // "Centre Hospitalier de Fann"
  adresse: string; // "Fann Résidence, Dakar"
  date_creation: Timestamp;
  description: string; // "Centre hospitalier universitaire de Fann"
  email: string; // "chu.fann@orange.sn"
  localisation: GeoPoint; // [14.6845° N, 17.4512° W]
  nombre_avis: number; // 198
  note: number; // 4.6
  ouvert_24h: boolean;
  region: string; // "Dakar"
  service_urgence: boolean;
  site_web: string; // "www.chu-fann.sn"
  telephone: string; // "+221 33 869 20 20"
  type: string; // "hopital"
  ville: string; // "Dakar"
  statut_validation: 'en_attente' | 'valide' | 'rejete'; // Statut de validation
  
  // Sous-collections
  horaires_travail: {
    [jour: string]: string; // "24h/24"
  };
  
  services: string[]; // ["Consultations spécialisées", "Urgences", "Réanimation"]
  specialites: string[]; // ["Psychiatrie", "Neurologie", "Réanimation"]
}
```

### 2. users
Gestion des utilisateurs (médecins, secrétaires)
```typescript
{
  id: string; // UID Firebase Auth
  nom: string; // "Sow"
  prenom: string; // "Fatou"
  email: string; // "fatou.sow@fadju.sn"
  telephone: string; // "+221 77 123 45 67"
  role: 'medecin' | 'secretaire' | 'superadmin';
  etablissement_id: string; // Référence vers etablissements_sante
  specialite?: string; // Pour les médecins
  numero_ordre?: string; // Numéro d'ordre des médecins
  date_creation: Timestamp;
  actif: boolean; // Compte actif/inactif
  derniere_connexion?: Timestamp;
  
  // Champs spécifiques médecins
  numero_ordre?: string; // "M-2024-001"
  diplomes?: string[]; // ["Doctorat en Médecine", "Spécialité Cardiologie"]
  experience?: number; // Années d'expérience
  
  // Champs spécifiques secrétaires
  permissions?: string[]; // ["gestion_medecins", "gestion_rdv"]
}
```

### 3. rendez_vous
Gestion des rendez-vous médicaux - **STRUCTURE MISE À JOUR**
```typescript
{
  id: string; // "rdv-001"
  
  // Informations temporelles
  date_rdv: Timestamp; // Date du rendez-vous
  date_creation: Timestamp; // Date de création
  
  // Nouveau format horaire (remplace creneau_horaire)
  heure_debut: string; // "10:30"
  heure_fin: string; // "11:00"
  creneau_horaire?: string; // DEPRECATED - maintenu pour compatibilité
  
  // Participants et lieu
  patient_id: string; // "G90AefcLATRP97SawW4QhKYzHeK2"
  medecin_id?: string; // "dr-fatou-sow" - OPTIONNEL pour statut en_attente
  etablissement_id: string; // OBLIGATOIRE - "etab-001"
  secretaire_id?: string; // Secrétaire qui a traité la demande
  
  // Informations médicales
  motif: string; // "Contrôle cardiaque"
  type: 'consultation' | 'analyse' | 'urgence' | 'suivi';
  specialite?: string; // "Cardiologue"
  
  // Statut et workflow
  statut: 'en_attente' | 'confirmee' | 'terminee' | 'annulee' | 'reportee';
  
  // Métadonnées
  notes?: string;
  priorite?: 'normale' | 'urgente' | 'critique';
  
  // Informations de finalisation (ajoutées lors du marquage comme terminé)
  observations?: string; // Observations du médecin
  ordonnance?: string; // Ordonnance prescrite
  analyses_demandees?: string; // Analyses à effectuer
  
  // Pour les analyses - résultats
  type_analyse?: string; // "Sanguin", "Urinaire"
  nom_analyse?: string; // "NFS", "Glycémie"
  resultats_analyse?: string; // Résultats détaillés
  
  // Historique des modifications
  historique_modifications?: {
    date: Timestamp;
    action: string; // "creation", "confirmation", "report", "annulation", "terminaison"
    utilisateur_id: string;
    ancien_statut?: string;
    nouveau_statut?: string;
    raison?: string;
  }[];
}
```

### 4. dossier_patient
Dossiers médicaux des patients - **STRUCTURE MISE À JOUR AVEC AFFILIATIONS**
```typescript
{
  id: string; // ID du document
  patient_id: string; // UID Firebase Auth du patient
  
  // Informations personnelles
  nom: string; // "Diop"
  prenom: string; // "Aminata"
  date_naissance: Timestamp;
  genre: 'masculin' | 'feminin';
  telephone: string; // "+221 77 123 45 67"
  email: string; // "aminata.diop@email.com"
  adresse: string; // "Parcelles Assainies, Dakar"
  
  // Informations médicales de base
  groupe_sanguin: string; // "A+"
  poids: number; // 65
  taille: number; // 165
  allergie?: string; // "Pénicilline"
  maladie_chronique?: string; // "Diabète de type 2"
  personne_a_contacter: string; // "Fatou Diop - 77 987 65 43"
  
  // NOUVEAU: Système d'affiliation aux établissements
  etablissements_affilies: string[]; // ["etab-001", "etab-002"] - Liste des établissements où le patient peut être suivi
  
  // Informations de suivi médical (mises à jour par les médecins)
  derniere_consultation?: Timestamp;
  derniere_observation?: string; // Dernière observation médicale
  dernieres_ordonnances?: string; // Dernières prescriptions
  derniers_resultats?: {
    type: string; // "Sanguin"
    nom: string; // "NFS"
    resultats: string; // "Résultats détaillés"
    date: Timestamp;
    medecin_id: string;
  };
  
  // Métadonnées
  date_creation: Timestamp;
  date_modification?: Timestamp; // Date de dernière modification
  notes?: string; // Notes générales
  actif: boolean; // Dossier actif/archivé
}
```

### 5. resultats_medicaux
Résultats d'examens et analyses - **STRUCTURE MISE À JOUR**
```typescript
{
  id: string; // "resultat-001"
  
  // Informations de base
  patient_id: string; // "test1234"
  medecin_id: string; // "mjh9zEKGEoQYOGRjvib6q34aUYO2"
  nom_medecin: string; // "Dr. Aissatou Salimata"
  rendez_vous_id: string; // "rdv-001"
  
  // Informations temporelles
  date_consultation: Timestamp; // Date de la consultation
  date_creation: Timestamp; // Date de création du résultat
  
  // Type et description
  type: 'consultation' | 'analyse' | 'ordonnance' | 'suivi';
  titre: string; // "Consultation du 31/07/2025"
  description: string; // Description détaillée
  
  // Données de consultation
  observations?: string; // Observations du médecin
  diagnostic?: string; // Diagnostic posé
  traitement_prescrit?: string; // Traitement prescrit
  ordonnance?: string; // Ordonnance détaillée
  analyses_demandees?: string; // Analyses à effectuer
  recommandations?: string; // Recommandations du médecin
  
  // Données d'analyse (si type = 'analyse')
  type_analyse?: string; // "Sanguin", "Urinaire", etc.
  nom_analyse?: string; // "NFS", "Glycémie", etc.
  resultats_analyse?: string; // Résultats détaillés
  valeurs_normales?: string; // Valeurs de référence
  interpretation?: string; // Interprétation des résultats
  
  // Statut et métadonnées
  statut: 'brouillon' | 'finalise' | 'transmis';
  notes?: string; // Notes additionnelles
  
  // Données techniques (pour compatibilité)
  donnees?: Record<string, any>; // Données structurées
  fichiers_joints?: Record<string, any>; // Fichiers attachés
}
```

### 6. contacts_urgence
Services d'urgence disponibles
```typescript
{
  id: string; // "centre-antipoison"
  actif: boolean;
  description: string; // "Centre National d'Information Toxicologique"
  nom: string; // "Centre Antipoison"
  priorite: number; // 4
  region: string; // "National"
  telephone: string; // "+221 33 889 50 50"
  type: string; // "medical"
}
```

## Workflow de Gestion des Rendez-vous

### 1. Création de RDV (Patient mobile)
```
Statut: en_attente
- patient_id: renseigné
- etablissement_id: renseigné
- medecin_id: NULL (pas encore attribué)
- date_rdv, motif, type: renseignés
```

### 2. Confirmation par Secrétaire (Web)
```
Statut: en_attente → confirmee
- medecin_id: attribué par la secrétaire
- secretaire_id: ID de la secrétaire
- historique_modifications: ajout de l'action
```

### 3. Finalisation par Médecin (Web)
```
Statut: confirmee → terminee
- observations: obligatoire
- ordonnance: optionnel
- analyses_demandees: optionnel
- Mise à jour du dossier_patient automatique
```

## Workflow d'Affiliation des Patients

### 1. Affichage de l'ID Patient (Application Mobile)
```
- Le patient peut voir son ID unique dans la section "Profil"
- Cet ID correspond au patient_id dans la collection dossier_patient
- Format: "G90AefcLATRP97SawW4QhKYzHeK2" (UID Firebase Auth)
```

### 2. Ajout par Secrétaire (Interface Web)
```
Processus:
1. Secrétaire saisit l'ID patient fourni par le patient
2. Système vérifie l'existence du patient dans dossier_patient
3. Système vérifie que le patient n'est pas déjà affilié
4. Ajout de l'etablissement_id dans etablissements_affilies[]
5. Patient devient visible dans la liste des patients de l'établissement
```

### 3. Gestion des Rendez-vous
```
- Seuls les patients affiliés apparaissent lors de la création de RDV
- Le secrétaire peut créer des RDV pour ces patients
- Les médecins voient les patients de leur établissement
```

### 4. Avantages du Système d'Affiliation
```
- Un patient peut être suivi dans plusieurs établissements
- Contrôle d'accès par établissement
- Historique médical centralisé mais accès sélectif
- Pas de duplication de données patient
```

## Rôles et Permissions

### Superadministrateur
- Gestion globale des établissements
- Validation des inscriptions (`statut_validation`)
- Accès complet aux données
- Création de comptes secrétaires

### Secrétaire Santé
- Gestion de l'établissement attribué uniquement
- Création et gestion des comptes médecins de l'établissement
- Confirmation des rendez-vous (`en_attente` → `confirmee`)
- Attribution des médecins aux rendez-vous
- Report et annulation des rendez-vous
- Accès en lecture aux dossiers patients pour consultation

### Médecin
- Consultation des rendez-vous assignés uniquement
- Finalisation des consultations (`confirmee` → `terminee`)
- Gestion complète des dossiers médicaux de ses patients
- Mise à jour des résultats médicaux
- Consultation du planning personnel
- **Restriction**: Ne peut pas modifier les dossiers d'autres médecins

### Patient (Mobile uniquement)
- Création de demandes de rendez-vous
- Consultation de ses propres rendez-vous
- Accès à ses résultats médicaux
- Consultation des établissements disponibles

## Règles de Sécurité Firebase

### Collection rendez_vous
```javascript
// Lecture
allow read: if request.auth != null && (
  // Patient peut voir ses propres RDV
  (resource.data.patient_id == request.auth.uid) ||
  // Médecin peut voir ses RDV attribués
  (resource.data.medecin_id == request.auth.uid) ||
  // Secrétaire peut voir les RDV de son établissement
  (getUserRole(request.auth.uid) == 'secretaire' && 
   resource.data.etablissement_id == getUserEtablissement(request.auth.uid))
);

// Écriture
allow write: if request.auth != null && (
  // Patient peut créer des RDV
  (request.auth.uid == resource.data.patient_id && 
   resource.data.statut == 'en_attente') ||
  // Secrétaire peut modifier les RDV de son établissement
  (getUserRole(request.auth.uid) == 'secretaire' && 
   resource.data.etablissement_id == getUserEtablissement(request.auth.uid)) ||
  // Médecin peut finaliser ses propres RDV
  (getUserRole(request.auth.uid) == 'medecin' && 
   resource.data.medecin_id == request.auth.uid)
);
```

### Collection dossier_patient
```javascript
// Lecture
allow read: if request.auth != null && (
  // Patient peut voir son propre dossier
  (resource.data.patient_id == request.auth.uid) ||
  // Médecin peut voir les dossiers de ses patients (via RDV)
  (getUserRole(request.auth.uid) == 'medecin' && 
   hasRendezVousWithPatient(request.auth.uid, resource.data.patient_id)) ||
  // Secrétaire peut consulter (lecture seule) les dossiers de son établissement
  (getUserRole(request.auth.uid) == 'secretaire' && 
   patientHasRdvInEtablissement(resource.data.patient_id, getUserEtablissement(request.auth.uid)))
);

// Écriture (seuls les médecins peuvent modifier)
allow write: if request.auth != null && 
  getUserRole(request.auth.uid) == 'medecin' && 
  hasRendezVousWithPatient(request.auth.uid, resource.data.patient_id);
```