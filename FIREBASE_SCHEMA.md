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
  
  // Sous-collections
  horaires_travail: {
    [jour: string]: string; // "24h/24"
  };
  
  services: string[]; // ["Consultations spécialisées", "Urgences", "Réanimation"]
  specialites: string[]; // ["Psychiatrie", "Neurologie", "Réanimation"]
}
```

### 2. rendez_vous
Gestion des rendez-vous médicaux
```typescript
{
  id: string; // "rdv-001"
  creneau_horaire: string; // "10:30"
  date_creation: Timestamp;
  date_rendez_vous: Timestamp;
  lieu: string; // "Clinique Pasteur, Dakar"
  medecin_id: string; // "dr-fatou-sow"
  motif: string; // "Contrôle cardiaque"
  nom_medecin: string; // "Dr. Fatou Sow"
  notes?: string | null;
  patient_id: string; // "G90AefcLATRP97SawW4QhKYzHeK2"
  specialite: string; // "Cardiologue"
  statut: string; // "confirme"
  type: string; // "consultation"
}
```

### 3. resultats_medicaux
Dossiers médicaux des patients
```typescript
{
  id: string; // "resultat-001"
  date_consultation?: Timestamp | null;
  date_creation: Timestamp;
  date_resultat: Timestamp;
  description: string; // "Bilan sanguin complet avec dosages"
  medecin_id: string; // "dr-fatou-sow"
  nom_medecin: string; // "Dr. Fatou Sow"
  notes: string; // "Résultats dans les normes"
  patient_id: string; // "G90AefcLATRP97SawW4QhKYzHeK2"
  rendez_vous_id: string; // "rdv-001"
  statut: string; // "disponible"
  titre: string; // "Analyses sanguines complètes"
  type: string; // "analyse"
  
  // Données médicales
  donnees: {
    cholesterol: string; // "1.8 g/l"
    glycemie: string; // "0.95 g/l"
    hemoglobine: string; // "14.2 g/dl"
    leucocytes: string; // "7200/mm³"
    plaquettes: string; // "350000/mm³"
  };
  
  // Fichiers joints
  fichiers_joints: {
    id: string; // "resultat-001"
    [key: string]: any;
  };
}
```

### 4. contacts_urgence
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

## Rôles et Permissions

### Superadministrateur
- Gestion globale des établissements
- Validation des inscriptions
- Accès complet aux données

### Secrétaire Santé
- Gestion de l'établissement attribué
- Gestion des médecins de l'établissement
- Confirmation des rendez-vous
- Attribution des médecins aux rendez-vous

### Médecin
- Consultation des rendez-vous assignés
- Gestion des dossiers médicaux patients
- Mise à jour des résultats médicaux
- Consultation du planning personnel