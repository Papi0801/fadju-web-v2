# Intégration Mobile - Application Fadju

## Vue d'ensemble

L'application mobile Fadju permet aux patients de prendre des rendez-vous médicaux et de consulter leurs dossiers. Elle s'intègre parfaitement avec la plateforme web utilisée par les établissements de santé.

## Architecture de l'intégration

### 1. Base de données partagée
- **Firebase Firestore** : Base de données commune entre mobile et web
- **Firebase Auth** : Authentification unifiée
- **Synchronisation temps réel** : Mise à jour instantanée des données

### 2. Workflow patient-établissement

```
[Patient Mobile] → [Demande RDV] → [Base Firebase] → [Secrétaire Web] → [Médecin Web]
```

## Fonctionnalités Mobile (Patient)

### 1. Authentification
```typescript
// Firebase Auth integration
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

// Login patient
const loginPatient = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

// Inscription patient
const registerPatient = async (email: string, password: string, patientData: PatientData) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  
  // Créer le dossier patient
  await createDossierPatient(userCredential.user.uid, patientData);
  
  return userCredential.user;
};
```

### 2. Recherche d'établissements
```typescript
// Recherche d'établissements par localisation
const searchEtablissements = async (
  region?: string, 
  specialite?: string, 
  urgence?: boolean
) => {
  let query = collection(db, 'etablissements_sante');
  
  if (region) {
    query = query.where('region', '==', region);
  }
  
  if (specialite) {
    query = query.where('specialites', 'array-contains', specialite);
  }
  
  if (urgence) {
    query = query.where('service_urgence', '==', true);
  }
  
  query = query.where('statut_validation', '==', 'valide');
  
  const snapshot = await getDocs(query);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
```

### 3. Prise de rendez-vous
```typescript
interface RendezVousRequest {
  etablissement_id: string;
  patient_id: string;
  date_rdv: Date;
  heure_debut: string;
  heure_fin: string;
  motif: string;
  type: 'consultation' | 'analyse' | 'urgence' | 'suivi';
  specialite?: string;
  priorite?: 'normale' | 'urgente' | 'critique';
}

const createRendezVous = async (rdvData: RendezVousRequest) => {
  const rdv = {
    ...rdvData,
    date_rdv: Timestamp.fromDate(rdvData.date_rdv),
    date_creation: Timestamp.now(),
    statut: 'en_attente', // Toujours en attente pour les demandes patients
    medecin_id: null, // Sera attribué par la secrétaire
  };
  
  const docRef = await addDoc(collection(db, 'rendez_vous'), rdv);
  return docRef.id;
};
```

### 4. Suivi des rendez-vous
```typescript
// Écouter les mises à jour en temps réel
const subscribeToPatientRdv = (patientId: string, callback: (rdvs: RendezVous[]) => void) => {
  const q = query(
    collection(db, 'rendez_vous'),
    where('patient_id', '==', patientId),
    orderBy('date_rdv', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const rdvs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as RendezVous[];
    callback(rdvs);
  });
};

// États des rendez-vous visibles côté patient
const getStatutDisplay = (statut: string) => {
  switch (statut) {
    case 'en_attente': return 'En attente de confirmation';
    case 'confirmee': return 'Confirmé';
    case 'terminee': return 'Terminé';
    case 'annulee': return 'Annulé';
    case 'reportee': return 'Reporté';
    default: return statut;
  }
};
```

### 5. Consultation du dossier médical
```typescript
// Récupérer le dossier patient
const getPatientDossier = async (patientId: string) => {
  const q = query(
    collection(db, 'dossier_patient'),
    where('patient_id', '==', patientId)
  );
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
};

// Récupérer les résultats médicaux
const getPatientResultats = async (patientId: string) => {
  const q = query(
    collection(db, 'resultats_medicaux'),
    where('patient_id', '==', patientId),
    orderBy('date_resultat', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
```

## Interface Mobile Recommandée

### 1. Écran d'accueil
```typescript
// Composant principal patient
const PatientHomeScreen = () => {
  const [prochainRdv, setProchainRdv] = useState<RendezVous | null>(null);
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  
  return (
    <ScrollView>
      {/* Prochain rendez-vous */}
      {prochainRdv && (
        <Card>
          <Text>Prochain rendez-vous</Text>
          <Text>{formatDate(prochainRdv.date_rdv)}</Text>
          <Text>Statut: {getStatutDisplay(prochainRdv.statut)}</Text>
        </Card>
      )}
      
      {/* Actions rapides */}
      <View>
        <Button title="Prendre RDV" onPress={() => navigation.navigate('BookAppointment')} />
        <Button title="Mes RDV" onPress={() => navigation.navigate('MyAppointments')} />
        <Button title="Mon dossier" onPress={() => navigation.navigate('MedicalRecord')} />
      </View>
      
      {/* Établissements à proximité */}
      <FlatList
        data={etablissements}
        renderItem={({ item }) => <EtablissementCard etablissement={item} />}
      />
    </ScrollView>
  );
};
```

### 2. Prise de rendez-vous
```typescript
const BookAppointmentScreen = () => {
  const [selectedEtablissement, setSelectedEtablissement] = useState<Etablissement | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [motif, setMotif] = useState<string>('');
  const [type, setType] = useState<'consultation' | 'analyse'>('consultation');
  
  const handleSubmit = async () => {
    if (!selectedEtablissement || !selectedTime || !motif) {
      alert('Veuillez remplir tous les champs');
      return;
    }
    
    try {
      const rdvId = await createRendezVous({
        etablissement_id: selectedEtablissement.id,
        patient_id: auth.currentUser!.uid,
        date_rdv: selectedDate,
        heure_debut: selectedTime,
        heure_fin: calculateEndTime(selectedTime), // +30min par défaut
        motif,
        type,
      });
      
      alert('Demande de rendez-vous envoyée avec succès');
      navigation.goBack();
    } catch (error) {
      alert('Erreur lors de la création du rendez-vous');
    }
  };
  
  return (
    <ScrollView>
      <EtablissementPicker 
        value={selectedEtablissement}
        onChange={setSelectedEtablissement}
      />
      
      <DatePicker
        value={selectedDate}
        onChange={setSelectedDate}
        minimumDate={new Date()}
      />
      
      <TimePicker
        value={selectedTime}
        onChange={setSelectedTime}
      />
      
      <TextInput
        placeholder="Motif de consultation"
        value={motif}
        onChangeText={setMotif}
        multiline
      />
      
      <Picker
        selectedValue={type}
        onValueChange={setType}
      >
        <Picker.Item label="Consultation" value="consultation" />
        <Picker.Item label="Analyse" value="analyse" />
        <Picker.Item label="Suivi" value="suivi" />
      </Picker>
      
      <Button title="Demander le rendez-vous" onPress={handleSubmit} />
    </ScrollView>
  );
};
```

### 3. Suivi des rendez-vous
```typescript
const MyAppointmentsScreen = () => {
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = subscribeToPatientRdv(
      auth.currentUser!.uid,
      (rdvs) => {
        setRendezVous(rdvs);
        setLoading(false);
      }
    );
    
    return unsubscribe;
  }, []);
  
  const renderAppointment = ({ item }: { item: RendezVous }) => (
    <Card style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <Text style={styles.appointmentDate}>
          {formatDate(item.date_rdv)}
        </Text>
        <Badge status={item.statut}>{getStatutDisplay(item.statut)}</Badge>
      </View>
      
      <Text style={styles.appointmentTime}>
        {item.heure_debut} - {item.heure_fin}
      </Text>
      
      <Text style={styles.appointmentMotif}>{item.motif}</Text>
      
      {item.medecin_id && (
        <Text style={styles.appointmentMedecin}>
          Médecin attribué
        </Text>
      )}
      
      {item.statut === 'terminee' && (
        <Button
          title="Voir le compte-rendu"
          onPress={() => navigation.navigate('AppointmentDetails', { rdvId: item.id })}
        />
      )}
    </Card>
  );
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <FlatList
      data={rendezVous}
      renderItem={renderAppointment}
      keyExtractor={(item) => item.id}
      refreshing={loading}
      onRefresh={() => setLoading(true)}
    />
  );
};
```

## Notifications Push

### 1. Configuration Firebase Cloud Messaging
```typescript
import messaging from '@react-native-firebase/messaging';

// Demander permission pour notifications
const requestUserPermission = async () => {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    
  if (enabled) {
    const token = await messaging().getToken();
    // Sauvegarder le token pour envoyer des notifications
    await saveNotificationToken(token);
  }
};

// Écouter les notifications
const setupNotificationListeners = () => {
  // App en premier plan
  messaging().onMessage(async remoteMessage => {
    showInAppNotification(remoteMessage);
  });
  
  // App fermée
  messaging().onNotificationOpenedApp(remoteMessage => {
    handleNotificationTap(remoteMessage);
  });
  
  // App tuée
  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        handleNotificationTap(remoteMessage);
      }
    });
};
```

### 2. Types de notifications
```typescript
interface NotificationPayload {
  type: 'rdv_confirmed' | 'rdv_cancelled' | 'rdv_reminder' | 'results_available';
  rdv_id?: string;
  message: string;
  title: string;
}

// Notifications déclenchées côté web
const sendNotificationToPatient = async (
  patientId: string, 
  payload: NotificationPayload
) => {
  // Récupérer le token de notification du patient
  const patientDoc = await getDoc(doc(db, 'users', patientId));
  const notificationToken = patientDoc.data()?.notificationToken;
  
  if (notificationToken) {
    await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${SERVER_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: notificationToken,
        notification: {
          title: payload.title,
          body: payload.message,
        },
        data: payload,
      }),
    });
  }
};
```

## Synchronisation des données

### 1. Gestion hors ligne
```typescript
// Enabler la persistance Firestore
import { enableNetwork, disableNetwork } from 'firebase/firestore';

// Cache local pour données hors ligne
const CacheManager = {
  saveToCache: async (key: string, data: any) => {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  },
  
  getFromCache: async (key: string) => {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },
  
  clearCache: async () => {
    const keys = await AsyncStorage.getAllKeys();
    const fadju_keys = keys.filter(key => key.startsWith('fadju_'));
    await AsyncStorage.multiRemove(fadju_keys);
  }
};

// Hook pour synchronisation automatique
const useSyncData = (collection: string, query: any) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    let unsubscribe: () => void;
    
    const setupSync = async () => {
      try {
        // Charger depuis le cache d'abord
        const cachedData = await CacheManager.getFromCache(`${collection}_data`);
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
        }
        
        // Ensuite écouter les mises à jour en temps réel
        unsubscribe = onSnapshot(query, 
          (snapshot) => {
            const newData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setData(newData);
            setLoading(false);
            
            // Mettre à jour le cache
            CacheManager.saveToCache(`${collection}_data`, newData);
          },
          (err) => {
            setError(err);
            setLoading(false);
          }
        );
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };
    
    setupSync();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);
  
  return { data, loading, error };
};
```

## Déploiement et configuration

### 1. Variables d'environnement
```typescript
// config/firebase.ts
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

export default firebaseConfig;
```

### 2. Build et déploiement
```bash
# Android
npx react-native run-android --mode=release

# iOS  
npx react-native run-ios --configuration Release

# Génération APK/IPA pour stores
cd android && ./gradlew assembleRelease
# ou pour iOS dans Xcode: Product > Archive
```

## Bonnes pratiques d'intégration

### 1. Gestion d'erreurs
```typescript
const handleFirebaseError = (error: any) => {
  switch (error.code) {
    case 'auth/user-not-found':
      return 'Utilisateur non trouvé';
    case 'auth/wrong-password':
      return 'Mot de passe incorrect';
    case 'firestore/permission-denied':
      return 'Accès refusé';
    case 'firestore/unavailable':
      return 'Service temporairement indisponible';
    default:
      return 'Une erreur est survenue';
  }
};
```

### 2. Optimisation des performances
```typescript
// Pagination pour grandes listes
const usePaginatedData = (collection: string, pageSize: number = 10) => {
  const [data, setData] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const loadMore = async () => {
    if (loading) return;
    
    setLoading(true);
    let q = query(
      collection(db, collection),
      orderBy('date_creation', 'desc'),
      limit(pageSize)
    );
    
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    
    const snapshot = await getDocs(q);
    const newData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    setData(prev => [...prev, ...newData]);
    setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
    setLoading(false);
  };
  
  return { data, loadMore, loading, hasMore: !!lastDoc };
};
```

Cette documentation complète guide l'intégration entre l'application mobile patient et la plateforme web des établissements de santé, assurant une synchronisation parfaite des données et une expérience utilisateur fluide.