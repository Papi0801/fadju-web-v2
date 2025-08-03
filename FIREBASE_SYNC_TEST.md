# Test d'Interconnexion Web-Mobile via Firebase

## Vue d'ensemble

Ce document décrit les tests pour vérifier la synchronisation en temps réel entre l'application web Fadju et l'application mobile Flutter via Firebase Firestore.

## Configuration Firebase Partagée

### Collections Firebase Communes

```typescript
// Collections utilisées par Web ET Mobile
const COLLECTIONS = {
  users: 'users',
  etablissements: 'etablissements', 
  medecins: 'medecins',
  patients: 'patients',
  rendez_vous: 'rendez_vous',
  consultations: 'consultations',
  notifications: 'notifications'
};
```

### Structure des Documents

#### 1. Collection `users`
```typescript
interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone: string;
  role: 'superadmin' | 'secretaire' | 'medecin' | 'patient';
  etablissement_id?: string; // Pour secrétaires et médecins
  specialite?: string; // Pour médecins
  actif: boolean;
  date_creation: Timestamp;
  derniere_connexion?: Timestamp;
  // Mobile spécifique
  device_token?: string; // Pour notifications push
  localisation?: GeoPoint; // Position du patient/médecin
}
```

#### 2. Collection `rendez_vous`
```typescript
interface RendezVous {
  id: string;
  patient_id: string;
  medecin_id: string;
  etablissement_id: string;
  date_rendez_vous: Timestamp;
  heure_debut: string; // Format "HH:mm"
  heure_fin: string;
  statut: 'programme' | 'confirme' | 'en_cours' | 'termine' | 'annule';
  motif: string;
  notes_secretaire?: string;
  notes_medecin?: string;
  // Web créé, Mobile consulté
  cree_par: 'web' | 'mobile';
  derniere_modification: Timestamp;
  // Mobile spécifique
  rappel_envoye?: boolean;
  position_patient?: GeoPoint;
}
```

#### 3. Collection `consultations`
```typescript
interface Consultation {
  id: string;
  rendez_vous_id: string;
  patient_id: string;
  medecin_id: string;
  etablissement_id: string;
  date_consultation: Timestamp;
  diagnostic: string;
  prescription: string;
  notes: string;
  prochaine_visite?: Timestamp;
  // Médecin via Web, patient via Mobile
  statut: 'en_cours' | 'terminee';
  documents_joints?: string[]; // URLs Firebase Storage
}
```

## Scenarios de Test

### Test 1: Synchronisation des Rendez-vous

**Étapes :**
1. **Web :** Secrétaire crée un rendez-vous pour un patient
2. **Mobile :** Patient vérifie que le rendez-vous apparaît dans son agenda
3. **Mobile :** Patient modifie ses notes personnelles
4. **Web :** Secrétaire vérifie que les modifications sont visibles
5. **Web :** Médecin consulte la liste de ses rendez-vous du jour

**Données à vérifier :**
```typescript
// Listener temps réel côté Web
const unsubscribe = onSnapshot(
  query(
    collection(db, 'rendez_vous'),
    where('etablissement_id', '==', etablissementId),
    where('date_rendez_vous', '>=', startOfDay),
    where('date_rendez_vous', '<=', endOfDay)
  ),
  (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      console.log('Changement RDV:', change.type, change.doc.data());
    });
  }
);
```

### Test 2: Notifications Cross-Platform

**Flux :**
1. **Web :** Secrétaire programme un rendez-vous
2. **Système :** Trigger Firebase Functions
3. **Mobile :** Patient reçoit notification push
4. **Mobile :** Patient confirme le rendez-vous
5. **Web :** Secrétaire voit le statut "confirmé" en temps réel

**Configuration Firebase Functions :**
```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.notifyNewRendezVous = functions.firestore
  .document('rendez_vous/{rendezVousId}')
  .onCreate(async (snap, context) => {
    const rendezVous = snap.data();
    
    // Récupérer le token du patient
    const patientDoc = await admin.firestore()
      .collection('users')
      .doc(rendezVous.patient_id)
      .get();
    
    const deviceToken = patientDoc.data()?.device_token;
    
    if (deviceToken) {
      const message = {
        notification: {
          title: 'Nouveau rendez-vous',
          body: `RDV confirmé le ${rendezVous.date_rendez_vous.toDate().toLocaleDateString()}`
        },
        data: {
          type: 'rendez_vous',
          rendez_vous_id: context.params.rendezVousId
        },
        token: deviceToken
      };
      
      return admin.messaging().send(message);
    }
  });
```

### Test 3: Gestion des Médecins

**Synchronisation :**
1. **Web :** Secrétaire ajoute un nouveau médecin
2. **Mobile :** Médecin télécharge l'app et se connecte
3. **Mobile :** Médecin met à jour son profil et spécialités
4. **Web :** Secrétaire voit les modifications en temps réel
5. **Mobile :** Patients voient le nouveau médecin disponible

### Test 4: Consultations en Temps Réel

**Workflow :**
1. **Web :** Médecin commence une consultation
2. **Mobile :** Patient voit le statut "en cours"
3. **Web :** Médecin saisit diagnostic et prescription
4. **Mobile :** Patient reçoit la prescription instantanément
5. **Web :** Secrétaire voit la consultation terminée

## Tests Techniques

### 1. Test de Connectivité

```typescript
// Test de connexion Firebase
export const testFirebaseConnection = async () => {
  try {
    // Test lecture
    const testDoc = await getDoc(doc(db, 'test', 'connection'));
    console.log('✅ Lecture Firebase OK');
    
    // Test écriture
    await setDoc(doc(db, 'test', 'connection'), {
      timestamp: Timestamp.now(),
      source: 'web'
    });
    console.log('✅ Écriture Firebase OK');
    
    // Test écoute temps réel
    const unsubscribe = onSnapshot(doc(db, 'test', 'connection'), (doc) => {
      console.log('✅ Temps réel Firebase OK:', doc.data());
    });
    
    return true;
  } catch (error) {
    console.error('❌ Erreur Firebase:', error);
    return false;
  }
};
```

### 2. Test de Performance

```typescript
// Mesurer la latence de synchronisation
export const testSyncLatency = async () => {
  const startTime = Date.now();
  
  // Web écrit
  await setDoc(doc(db, 'test', 'latency'), {
    timestamp: Timestamp.now(),
    test_id: startTime
  });
  
  // Mobile lit (simulé)
  return new Promise((resolve) => {
    const unsubscribe = onSnapshot(doc(db, 'test', 'latency'), (doc) => {
      const data = doc.data();
      if (data?.test_id === startTime) {
        const latency = Date.now() - startTime;
        console.log(`📊 Latence de sync: ${latency}ms`);
        unsubscribe();
        resolve(latency);
      }
    });
  });
};
```

### 3. Test de Pagination

```typescript
// Test des requêtes paginées (important pour mobile)
export const testPagination = async () => {
  const pageSize = 10;
  
  // Première page
  let query = query(
    collection(db, 'rendez_vous'),
    orderBy('date_rendez_vous', 'desc'),
    limit(pageSize)
  );
  
  const firstPage = await getDocs(query);
  console.log(`✅ Première page: ${firstPage.size} éléments`);
  
  // Page suivante
  const lastDoc = firstPage.docs[firstPage.docs.length - 1];
  const nextQuery = query(
    collection(db, 'rendez_vous'),
    orderBy('date_rendez_vous', 'desc'),
    startAfter(lastDoc),
    limit(pageSize)
  );
  
  const nextPage = await getDocs(nextQuery);
  console.log(`✅ Page suivante: ${nextPage.size} éléments`);
};
```

## Validation des Données

### 1. Règles de Sécurité Firestore

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users peuvent lire leur propre profil
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Rendez-vous accessibles aux patients, médecins et secrétaires
    match /rendez_vous/{rendezVousId} {
      allow read: if request.auth != null && (
        resource.data.patient_id == request.auth.uid ||
        resource.data.medecin_id == request.auth.uid ||
        request.auth.token.role == 'secretaire'
      );
      
      allow write: if request.auth != null && (
        request.auth.token.role in ['secretaire', 'medecin']
      );
    }
    
    // Établissements lisibles par tous les utilisateurs connectés
    match /etablissements/{etablissementId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.token.role in ['superadmin', 'secretaire'];
    }
  }
}
```

### 2. Validation des Types

```typescript
// Zod schemas pour validation
import { z } from 'zod';

export const RendezVousSchema = z.object({
  patient_id: z.string(),
  medecin_id: z.string(),
  etablissement_id: z.string(),
  date_rendez_vous: z.date(),
  heure_debut: z.string().regex(/^\d{2}:\d{2}$/),
  heure_fin: z.string().regex(/^\d{2}:\d{2}$/),
  statut: z.enum(['programme', 'confirme', 'en_cours', 'termine', 'annule']),
  motif: z.string().min(1),
});

export const validateRendezVous = (data: unknown) => {
  return RendezVousSchema.safeParse(data);
};
```

## Métriques à Surveiller

### 1. Performance

- **Latence de synchronisation :** < 500ms
- **Temps de chargement initial :** < 2s
- **Taille des requêtes :** < 1MB par page
- **Utilisation offline :** Support cache local

### 2. Fiabilité

- **Taux de succès des écritures :** > 99.9%
- **Disponibilité du service :** > 99.95%
- **Gestion des conflits :** Résolution automatique
- **Recovery après déconnexion :** < 5s

### 3. Utilisation

- **Nombre d'opérations/jour :** Suivi quotidien
- **Pics de charge :** Gestion des heures de pointe
- **Erreurs utilisateur :** < 1% des opérations
- **Satisfaction UX :** Feedback utilisateurs

## Outils de Monitoring

### 1. Firebase Console

- **Firestore :** Utilisation, performance, erreurs
- **Authentication :** Connexions, erreurs auth
- **Functions :** Executions, erreurs, latence
- **Crashlytics :** Crashes mobile

### 2. Logging Custom

```typescript
// Service de logging
export class SyncLogger {
  static log(event: string, data: any, source: 'web' | 'mobile') {
    const logEntry = {
      event,
      data,
      source,
      timestamp: Timestamp.now(),
      session_id: sessionStorage.getItem('session_id')
    };
    
    // Log local pour debug
    console.log('📱📊', logEntry);
    
    // Log distant pour analytics
    addDoc(collection(db, 'sync_logs'), logEntry);
  }
}
```

## Checklist de Validation

### ✅ Tests Fonctionnels

- [ ] Création de rendez-vous (Web → Mobile)
- [ ] Modification de rendez-vous (Mobile → Web)
- [ ] Notifications push (Web → Mobile)
- [ ] Sync profils médecins (Bidirectionnel)
- [ ] Consultations temps réel (Web → Mobile)
- [ ] Gestion offline-online (Mobile)

### ✅ Tests de Performance  

- [ ] Latence < 500ms
- [ ] Chargement initial < 2s
- [ ] Pagination efficace
- [ ] Cache intelligent
- [ ] Gestion mémoire

### ✅ Tests de Sécurité

- [ ] Règles Firestore respectées
- [ ] Authentification vérifiée
- [ ] Données sensibles protégées
- [ ] Audit des accès
- [ ] Validation des entrées

### ✅ Tests UX

- [ ] États de chargement
- [ ] Gestion des erreurs
- [ ] Feedback visuel
- [ ] Mode offline
- [ ] Récupération automatique

Cette approche méthodique garantit une interconnexion fiable et performante entre les plateformes Web et Mobile via Firebase.