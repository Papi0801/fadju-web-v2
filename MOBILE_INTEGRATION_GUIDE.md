# Guide d'Intégration Mobile - Fadju Flutter App

## 🎯 Vue d'ensemble

Ce guide détaille l'implémentation côté mobile Flutter pour assurer une synchronisation parfaite avec la plateforme web Fadju.

## 📱 Architecture Mobile

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FLUTTER APP   │    │    FIREBASE     │    │    WEB ADMIN    │
│                 │    │                 │    │                 │
│ • Patient UI    │◄──►│ • Firestore     │◄──►│ • Secrétaire    │
│ • Médecin UI    │    │ • Auth          │    │ • Médecin       │
│ • Notifications │    │ • Functions     │    │ • Superadmin    │
│ • Géolocation   │    │ • Storage       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Étapes d'Implémentation

### 1. Configuration Firebase Mobile

#### pubspec.yaml
```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # Firebase
  firebase_core: ^2.24.2
  firebase_auth: ^4.15.3
  firebase_firestore: ^4.13.6
  firebase_messaging: ^14.7.10
  firebase_storage: ^11.5.6
  
  # État et navigation
  provider: ^6.1.1
  go_router: ^12.1.3
  
  # UI et utilitaires
  google_fonts: ^6.1.0
  cached_network_image: ^3.3.0
  flutter_local_notifications: ^16.3.0
  geolocator: ^10.1.0
  permission_handler: ^11.1.0
  
  # API et networking
  dio: ^5.4.0
  connectivity_plus: ^5.0.2
  
  # Stockage local
  shared_preferences: ^2.2.2
  hive: ^2.2.3
  hive_flutter: ^1.1.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  hive_generator: ^2.0.1
  build_runner: ^2.4.7
```

#### Configuration Firebase (android/app/google-services.json)
```json
{
  "project_info": {
    "project_number": "VOTRE_PROJECT_NUMBER",
    "project_id": "fadju-web-prod",
    "storage_bucket": "fadju-web-prod.appspot.com"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "VOTRE_APP_ID",
        "android_client_info": {
          "package_name": "com.fadju.mobile"
        }
      },
      "api_key": [
        {
          "current_key": "VOTRE_API_KEY"
        }
      ]
    }
  ]
}
```

### 2. Structure du Projet Flutter

```
lib/
├── main.dart
├── app/
│   ├── app.dart
│   └── router.dart
├── core/
│   ├── constants/
│   ├── utils/
│   ├── theme/
│   └── services/
│       ├── firebase_service.dart
│       ├── auth_service.dart
│       ├── firestore_service.dart
│       └── notification_service.dart
├── features/
│   ├── auth/
│   │   ├── models/
│   │   ├── providers/
│   │   ├── repositories/
│   │   └── screens/
│   ├── patient/
│   │   ├── dashboard/
│   │   ├── appointments/
│   │   ├── doctors/
│   │   └── profile/
│   ├── doctor/
│   │   ├── dashboard/
│   │   ├── appointments/
│   │   ├── patients/
│   │   └── consultations/
│   └── shared/
│       ├── models/
│       ├── widgets/
│       └── utils/
└── generated/
    └── l10n/
```

### 3. Configuration Initiale

#### main.dart
```dart
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'firebase_options.dart';
import 'app/app.dart';
import 'core/services/firebase_service.dart';
import 'core/services/notification_service.dart';
import 'features/auth/providers/auth_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Firebase
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  
  // Hive (cache local)
  await Hive.initFlutter();
  
  // Services
  await FirebaseService.initialize();
  await NotificationService.initialize();
  
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        // Autres providers...
      ],
      child: const FadjuApp(),
    ),
  );
}
```

### 4. Modèles de Données Partagés

#### lib/features/shared/models/user.dart
```dart
import 'package:cloud_firestore/cloud_firestore.dart';

class User {
  final String id;
  final String email;
  final String nom;
  final String prenom;
  final String telephone;
  final UserRole role;
  final String? etablissementId;
  final String? specialite;
  final bool actif;
  final DateTime dateCreation;
  final DateTime? derniereConnexion;
  final String? deviceToken;
  final GeoPoint? localisation;

  User({
    required this.id,
    required this.email,
    required this.nom,
    required this.prenom,
    required this.telephone,
    required this.role,
    this.etablissementId,
    this.specialite,
    this.actif = true,
    required this.dateCreation,
    this.derniereConnexion,
    this.deviceToken,
    this.localisation,
  });

  factory User.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return User(
      id: doc.id,
      email: data['email'] ?? '',
      nom: data['nom'] ?? '',
      prenom: data['prenom'] ?? '',
      telephone: data['telephone'] ?? '',
      role: UserRole.values.firstWhere(
        (r) => r.name == data['role'],
        orElse: () => UserRole.patient,
      ),
      etablissementId: data['etablissement_id'],
      specialite: data['specialite'],
      actif: data['actif'] ?? true,
      dateCreation: (data['date_creation'] as Timestamp).toDate(),
      derniereConnexion: data['derniere_connexion'] != null
          ? (data['derniere_connexion'] as Timestamp).toDate()
          : null,
      deviceToken: data['device_token'],
      localisation: data['localisation'],
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'email': email,
      'nom': nom,
      'prenom': prenom,
      'telephone': telephone,
      'role': role.name,
      'etablissement_id': etablissementId,
      'specialite': specialite,
      'actif': actif,
      'date_creation': Timestamp.fromDate(dateCreation),
      'derniere_connexion': derniereConnexion != null
          ? Timestamp.fromDate(derniereConnexion!)
          : null,
      'device_token': deviceToken,
      'localisation': localisation,
    };
  }
}

enum UserRole { superadmin, secretaire, medecin, patient }
```

#### lib/features/shared/models/rendez_vous.dart
```dart
import 'package:cloud_firestore/cloud_firestore.dart';

class RendezVous {
  final String id;
  final String patientId;
  final String medecinId;
  final String etablissementId;
  final DateTime dateRendezVous;
  final String heureDebut;
  final String heureFin;
  final RendezVousStatut statut;
  final String motif;
  final String? notesSecretaire;
  final String? notesMedecin;
  final String creePar;
  final DateTime derniereModification;
  final bool? rappelEnvoye;
  final GeoPoint? positionPatient;

  RendezVous({
    required this.id,
    required this.patientId,
    required this.medecinId,
    required this.etablissementId,
    required this.dateRendezVous,
    required this.heureDebut,
    required this.heureFin,
    required this.statut,
    required this.motif,
    this.notesSecretaire,
    this.notesMedecin,
    required this.creePar,
    required this.derniereModification,
    this.rappelEnvoye,
    this.positionPatient,
  });

  factory RendezVous.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return RendezVous(
      id: doc.id,
      patientId: data['patient_id'] ?? '',
      medecinId: data['medecin_id'] ?? '',
      etablissementId: data['etablissement_id'] ?? '',
      dateRendezVous: (data['date_rendez_vous'] as Timestamp).toDate(),
      heureDebut: data['heure_debut'] ?? '',
      heureFin: data['heure_fin'] ?? '',
      statut: RendezVousStatut.values.firstWhere(
        (s) => s.name == data['statut'],
        orElse: () => RendezVousStatut.programme,
      ),
      motif: data['motif'] ?? '',
      notesSecretaire: data['notes_secretaire'],
      notesMedecin: data['notes_medecin'],
      creePar: data['cree_par'] ?? 'mobile',
      derniereModification: (data['derniere_modification'] as Timestamp).toDate(),
      rappelEnvoye: data['rappel_envoye'],
      positionPatient: data['position_patient'],
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'patient_id': patientId,
      'medecin_id': medecinId,
      'etablissement_id': etablissementId,
      'date_rendez_vous': Timestamp.fromDate(dateRendezVous),
      'heure_debut': heureDebut,
      'heure_fin': heureFin,
      'statut': statut.name,
      'motif': motif,
      'notes_secretaire': notesSecretaire,
      'notes_medecin': notesMedecin,
      'cree_par': creePar,
      'derniere_modification': Timestamp.fromDate(derniereModification),
      'rappel_envoye': rappelEnvoye,
      'position_patient': positionPatient,
    };
  }
}

enum RendezVousStatut {
  programme,
  confirme,
  enCours,
  termine,
  annule,
}
```

### 5. Services Firebase

#### lib/core/services/firestore_service.dart
```dart
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../features/shared/models/user.dart';
import '../../features/shared/models/rendez_vous.dart';

class FirestoreService {
  static final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Collections
  static const String USERS_COLLECTION = 'users';
  static const String ETABLISSEMENTS_COLLECTION = 'etablissements';
  static const String RENDEZ_VOUS_COLLECTION = 'rendez_vous';
  static const String CONSULTATIONS_COLLECTION = 'consultations';
  static const String NOTIFICATIONS_COLLECTION = 'notifications';

  // Utilisateurs
  static Future<User?> getUser(String uid) async {
    try {
      final doc = await _firestore.collection(USERS_COLLECTION).doc(uid).get();
      return doc.exists ? User.fromFirestore(doc) : null;
    } catch (e) {
      print('Erreur getUser: $e');
      return null;
    }
  }

  static Future<void> updateUser(String uid, Map<String, dynamic> data) async {
    await _firestore.collection(USERS_COLLECTION).doc(uid).update(data);
  }

  // Rendez-vous
  static Stream<List<RendezVous>> getRendezVousStream(String userId, UserRole role) {
    Query query;
    
    switch (role) {
      case UserRole.patient:
        query = _firestore
            .collection(RENDEZ_VOUS_COLLECTION)
            .where('patient_id', isEqualTo: userId);
        break;
      case UserRole.medecin:
        query = _firestore
            .collection(RENDEZ_VOUS_COLLECTION)
            .where('medecin_id', isEqualTo: userId);
        break;
      default:
        throw Exception('Role non supporté pour les rendez-vous');
    }

    return query
        .orderBy('date_rendez_vous', descending: false)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => RendezVous.fromFirestore(doc))
            .toList());
  }

  static Future<String> createRendezVous(RendezVous rendezVous) async {
    final docRef = await _firestore
        .collection(RENDEZ_VOUS_COLLECTION)
        .add(rendezVous.toFirestore());
    return docRef.id;
  }

  static Future<void> updateRendezVous(String id, Map<String, dynamic> data) async {
    await _firestore
        .collection(RENDEZ_VOUS_COLLECTION)
        .doc(id)
        .update(data);
  }

  // Médecins par établissement
  static Stream<List<User>> getMedecinsStream(String etablissementId) {
    return _firestore
        .collection(USERS_COLLECTION)
        .where('role', isEqualTo: 'medecin')
        .where('etablissement_id', isEqualTo: etablissementId)
        .where('actif', isEqualTo: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => User.fromFirestore(doc))
            .toList());
  }

  // Établissements
  static Stream<QuerySnapshot> getEtablissementsStream() {
    return _firestore
        .collection(ETABLISSEMENTS_COLLECTION)
        .where('statut_validation', isEqualTo: 'valide')
        .snapshots();
  }

  // Notifications
  static Future<void> createNotification({
    required String userId,
    required String type,
    required String title,
    required String message,
    Map<String, dynamic>? data,
  }) async {
    await _firestore.collection(NOTIFICATIONS_COLLECTION).add({
      'user_id': userId,
      'type': type,
      'title': title,
      'message': message,
      'data': data,
      'lu': false,
      'timestamp': FieldValue.serverTimestamp(),
    });
  }

  static Stream<QuerySnapshot> getNotificationsStream(String userId) {
    return _firestore
        .collection(NOTIFICATIONS_COLLECTION)
        .where('user_id', isEqualTo: userId)
        .orderBy('timestamp', descending: true)
        .limit(50)
        .snapshots();
  }
}
```

### 6. Authentification Mobile

#### lib/features/auth/providers/auth_provider.dart
```dart
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
import 'package:firebase_messaging/firebase_messaging.dart';
import '../../../core/services/firestore_service.dart';
import '../../shared/models/user.dart';

class AuthProvider extends ChangeNotifier {
  final firebase_auth.FirebaseAuth _auth = firebase_auth.FirebaseAuth.instance;
  User? _currentUser;
  bool _isLoading = false;

  User? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _currentUser != null;

  AuthProvider() {
    _init();
  }

  void _init() {
    _auth.authStateChanges().listen(_onAuthStateChanged);
  }

  Future<void> _onAuthStateChanged(firebase_auth.User? firebaseUser) async {
    if (firebaseUser != null) {
      _currentUser = await FirestoreService.getUser(firebaseUser.uid);
      
      // Mettre à jour le token FCM
      await _updateDeviceToken();
      
      // Mettre à jour la dernière connexion
      await FirestoreService.updateUser(firebaseUser.uid, {
        'derniere_connexion': FieldValue.serverTimestamp(),
      });
    } else {
      _currentUser = null;
    }
    notifyListeners();
  }

  Future<void> _updateDeviceToken() async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null && _currentUser != null) {
        await FirestoreService.updateUser(_currentUser!.id, {
          'device_token': token,
        });
      }
    } catch (e) {
      print('Erreur mise à jour token: $e');
    }
  }

  Future<bool> signIn(String email, String password) async {
    try {
      _isLoading = true;
      notifyListeners();

      final credential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );

      return credential.user != null;
    } on firebase_auth.FirebaseAuthException catch (e) {
      print('Erreur connexion: ${e.message}');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> signUp({
    required String email,
    required String password,
    required String nom,
    required String prenom,
    required String telephone,
  }) async {
    try {
      _isLoading = true;
      notifyListeners();

      final credential = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );

      if (credential.user != null) {
        // Créer le profil utilisateur
        final user = User(
          id: credential.user!.uid,
          email: email,
          nom: nom,
          prenom: prenom,
          telephone: telephone,
          role: UserRole.patient,
          dateCreation: DateTime.now(),
        );

        await FirestoreService._firestore
            .collection(FirestoreService.USERS_COLLECTION)
            .doc(credential.user!.uid)
            .set(user.toFirestore());

        return true;
      }
      return false;
    } catch (e) {
      print('Erreur inscription: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> signOut() async {
    await _auth.signOut();
  }

  Future<void> updateLocation(double latitude, double longitude) async {
    if (_currentUser != null) {
      await FirestoreService.updateUser(_currentUser!.id, {
        'localisation': GeoPoint(latitude, longitude),
      });
    }
  }
}
```

### 7. Interface Patient

#### lib/features/patient/screens/dashboard_screen.dart
```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/services/firestore_service.dart';
import '../../auth/providers/auth_provider.dart';
import '../../shared/models/rendez_vous.dart';

class PatientDashboardScreen extends StatelessWidget {
  const PatientDashboardScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, auth, child) {
        if (auth.currentUser == null) {
          return const Center(child: CircularProgressIndicator());
        }

        return Scaffold(
          appBar: AppBar(
            title: Text('Bonjour ${auth.currentUser!.prenom}'),
            backgroundColor: const Color(0xFF10B981),
            foregroundColor: Colors.white,
          ),
          body: RefreshIndicator(
            onRefresh: () async {
              // Refresh logic
            },
            child: CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildQuickActions(context),
                        const SizedBox(height: 24),
                        _buildUpcomingAppointments(auth.currentUser!.id),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Actions rapides',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildQuickAction(
                  icon: Icons.calendar_today,
                  label: 'Prendre RDV',
                  onTap: () {
                    Navigator.pushNamed(context, '/patient/book-appointment');
                  },
                ),
                _buildQuickAction(
                  icon: Icons.local_hospital,
                  label: 'Établissements',
                  onTap: () {
                    Navigator.pushNamed(context, '/patient/establishments');
                  },
                ),
                _buildQuickAction(
                  icon: Icons.person,
                  label: 'Médecins',
                  onTap: () {
                    Navigator.pushNamed(context, '/patient/doctors');
                  },
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickAction({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF10B981).withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              icon,
              size: 32,
              color: const Color(0xFF10B981),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUpcomingAppointments(String userId) {
    return StreamBuilder<List<RendezVous>>(
      stream: FirestoreService.getRendezVousStream(userId, UserRole.patient),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return const Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Text('Aucun rendez-vous programmé'),
            ),
          );
        }

        final upcomingAppointments = snapshot.data!
            .where((rdv) => rdv.dateRendezVous.isAfter(DateTime.now()))
            .take(3)
            .toList();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Prochains rendez-vous',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ...upcomingAppointments.map((rdv) => _buildAppointmentCard(rdv)),
          ],
        );
      },
    );
  }

  Widget _buildAppointmentCard(RendezVous rendezVous) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: _getStatusColor(rendezVous.statut),
          child: Icon(
            Icons.calendar_today,
            color: Colors.white,
            size: 20,
          ),
        ),
        title: Text(
          '${rendezVous.dateRendezVous.day}/${rendezVous.dateRendezVous.month} à ${rendezVous.heureDebut}',
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Text(rendezVous.motif),
        trailing: Chip(
          label: Text(
            _getStatusText(rendezVous.statut),
            style: const TextStyle(fontSize: 12),
          ),
          backgroundColor: _getStatusColor(rendezVous.statut).withOpacity(0.1),
        ),
      ),
    );
  }

  Color _getStatusColor(RendezVousStatut statut) {
    switch (statut) {
      case RendezVousStatut.programme:
        return Colors.orange;
      case RendezVousStatut.confirme:
        return Colors.green;
      case RendezVousStatut.enCours:
        return Colors.blue;
      case RendezVousStatut.termine:
        return Colors.grey;
      case RendezVousStatut.annule:
        return Colors.red;
    }
  }

  String _getStatusText(RendezVousStatut statut) {
    switch (statut) {
      case RendezVousStatut.programme:
        return 'Programmé';
      case RendezVousStatut.confirme:
        return 'Confirmé';
      case RendezVousStatut.enCours:
        return 'En cours';
      case RendezVousStatut.termine:
        return 'Terminé';
      case RendezVousStatut.annule:
        return 'Annulé';
    }
  }
}
```

### 8. Notifications Push

#### lib/core/services/notification_service.dart
```dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  static Future<void> initialize() async {
    // Demander les permissions
    await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    // Configuration notifications locales
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings();
    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );
    
    await _localNotifications.initialize(initSettings);

    // Écouter les messages en foreground
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Écouter les messages quand l'app est en background
    FirebaseMessaging.onMessageOpenedApp.listen(_handleBackgroundMessage);

    // Message initial si l'app est ouverte depuis une notification
    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      _handleBackgroundMessage(initialMessage);
    }
  }

  static Future<void> _handleForegroundMessage(RemoteMessage message) async {
    // Afficher une notification locale
    await _localNotifications.show(
      message.hashCode,
      message.notification?.title,
      message.notification?.body,
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'fadju_channel',
          'Fadju Notifications',
          channelDescription: 'Notifications de l\'app Fadju',
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: DarwinNotificationDetails(),
      ),
    );
  }

  static void _handleBackgroundMessage(RemoteMessage message) {
    // Naviguer vers l'écran approprié selon le type de notification
    final data = message.data;
    final type = data['type'];
    
    switch (type) {
      case 'rendez_vous':
        // Naviguer vers les rendez-vous
        break;
      case 'consultation':
        // Naviguer vers les consultations
        break;
      default:
        // Dashboard par défaut
        break;
    }
  }

  static Future<String?> getToken() async {
    return await _messaging.getToken();
  }
}
```

### 9. Configuration Android

#### android/app/src/main/AndroidManifest.xml
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
    
    <application
        android:label="Fadju"
        android:name="${applicationName}"
        android:icon="@mipmap/ic_launcher">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:theme="@style/LaunchTheme">
            
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
        
        <!-- Firebase Messaging -->
        <service
            android:name="com.google.firebase.messaging.FirebaseMessagingService"
            android:exported="false">
            <intent-filter>
                <action android:name="com.google.firebase.MESSAGING_EVENT" />
            </intent-filter>
        </service>
    </application>
</manifest>
```

### 10. Tests de Synchronisation

#### lib/features/debug/sync_test_screen.dart
```dart
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class SyncTestScreen extends StatefulWidget {
  @override
  _SyncTestScreenState createState() => _SyncTestScreenState();
}

class _SyncTestScreenState extends State<SyncTestScreen> {
  final List<String> _testResults = [];
  bool _isRunning = false;

  Future<void> _runSyncTests() async {
    setState(() {
      _isRunning = true;
      _testResults.clear();
    });

    await _testFirebaseConnection();
    await _testRealtimeSync();
    await _testRendezVousCreation();

    setState(() {
      _isRunning = false;
    });
  }

  Future<void> _testFirebaseConnection() async {
    try {
      await FirebaseFirestore.instance
          .collection('test')
          .doc('connection')
          .set({'timestamp': FieldValue.serverTimestamp()});
      
      _addResult('✅ Connexion Firebase OK');
    } catch (e) {
      _addResult('❌ Connexion Firebase échouée: $e');
    }
  }

  Future<void> _testRealtimeSync() async {
    try {
      final testId = DateTime.now().millisecondsSinceEpoch.toString();
      final docRef = FirebaseFirestore.instance
          .collection('sync_test')
          .doc(testId);

      // Écouter les changements
      final subscription = docRef.snapshots().listen((snapshot) {
        if (snapshot.exists) {
          _addResult('✅ Synchronisation temps réel OK');
        }
      });

      // Écrire le document
      await docRef.set({
        'test_id': testId,
        'timestamp': FieldValue.serverTimestamp(),
        'source': 'mobile',
      });

      // Attendre 2 secondes puis nettoyer
      await Future.delayed(const Duration(seconds: 2));
      subscription.cancel();
      await docRef.delete();
    } catch (e) {
      _addResult('❌ Test temps réel échoué: $e');
    }
  }

  Future<void> _testRendezVousCreation() async {
    try {
      final testRdv = {
        'patient_id': 'test_patient',
        'medecin_id': 'test_medecin',
        'etablissement_id': 'test_etablissement',
        'date_rendez_vous': Timestamp.fromDate(DateTime.now().add(const Duration(days: 1))),
        'heure_debut': '14:00',
        'heure_fin': '14:30',
        'statut': 'programme',
        'motif': 'Test synchronisation mobile',
        'cree_par': 'mobile',
        'derniere_modification': FieldValue.serverTimestamp(),
      };

      final docRef = await FirebaseFirestore.instance
          .collection('rendez_vous')
          .add(testRdv);

      _addResult('✅ Création rendez-vous OK (${docRef.id})');

      // Nettoyer
      await docRef.delete();
      _addResult('✅ Nettoyage test OK');
    } catch (e) {
      _addResult('❌ Test rendez-vous échoué: $e');
    }
  }

  void _addResult(String result) {
    setState(() {
      _testResults.add(result);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Test de Synchronisation'),
        backgroundColor: const Color(0xFF10B981),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            ElevatedButton(
              onPressed: _isRunning ? null : _runSyncTests,
              child: _isRunning
                  ? const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        SizedBox(width: 8),
                        Text('Tests en cours...'),
                      ],
                    )
                  : const Text('Lancer les tests'),
            ),
            const SizedBox(height: 20),
            Expanded(
              child: ListView.builder(
                itemCount: _testResults.length,
                itemBuilder: (context, index) {
                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Text(
                        _testResults[index],
                        style: const TextStyle(fontFamily: 'monospace'),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

## 🚀 Plan de Déploiement Mobile

### Phase 1: MVP (2-3 semaines)
- [ ] Configuration Firebase
- [ ] Authentification (connexion/inscription)
- [ ] Interface patient basique
- [ ] Prise de rendez-vous
- [ ] Notifications push

### Phase 2: Fonctionnalités Avancées (2-3 semaines)
- [ ] Interface médecin
- [ ] Géolocalisation
- [ ] Consultations en ligne
- [ ] Cache offline avec Hive
- [ ] Synchronisation bidirectionnelle

### Phase 3: Optimisations (1-2 semaines)
- [ ] Tests automatisés
- [ ] Performance et optimisations
- [ ] Publication Play Store/App Store
- [ ] Monitoring et analytics

## 📊 Points de Synchronisation Web-Mobile

| Fonctionnalité | Web (Admin) | Mobile (Utilisateur) | Synchronisation |
|---|---|---|---|
| **Rendez-vous** | Création par secrétaire | Visualisation patient/médecin | Temps réel |
| **Médecins** | Gestion par secrétaire | Liste pour patients | Temps réel |
| **Consultations** | Saisie par médecin | Visualisation patient | Temps réel |
| **Notifications** | Déclenchement système | Réception push | Instantané |
| **Profils** | Validation admin | Mise à jour utilisateur | Bidirectionnelle |

Cette architecture garantit une synchronisation parfaite entre la plateforme web d'administration et l'application mobile des utilisateurs finaux !