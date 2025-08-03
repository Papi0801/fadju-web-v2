# Fadju Web - Plateforme de Gestion Santé

Application web moderne pour la gestion des établissements de santé au Sénégal, construite avec Next.js 15, TypeScript, Firebase, et Tailwind CSS.

## 🎯 Vue d'ensemble

Fadju Web est une plateforme complète qui permet la gestion des établissements de santé avec trois types d'utilisateurs :

- **Superadministrateur** : Validation des établissements, gestion globale
- **Secrétaire Santé** : Gestion des rendez-vous, médecins de l'établissement
- **Médecin** : Consultation des dossiers patients, gestion du planning

## 🚀 Fonctionnalités

### Superadministrateur
- Validation/rejet des demandes d'inscription d'établissements
- Gestion complète des établissements validés
- Tableau de bord avec statistiques globales
- Gestion des contacts d'urgence

### Secrétaire Santé
- Confirmation des demandes de rendez-vous
- Attribution des médecins aux rendez-vous
- Gestion des médecins de l'établissement
- Gestion du profil de l'établissement

### Médecin
- Consultation des rendez-vous assignés
- Gestion des dossiers médicaux des patients
- Mise à jour des résultats médicaux
- Consultation du planning personnel

## 🛠️ Technologies

- **Framework** : Next.js 15 avec TypeScript
- **Authentification** : Firebase Auth
- **Base de données** : Cloud Firestore
- **Styling** : Tailwind CSS v4
- **Animations** : Framer Motion
- **Gestion d'état** : Zustand
- **UI Components** : Headless UI + Composants personnalisés
- **Formulaires** : React Hook Form + Yup
- **Icons** : Lucide React

## 📋 Prérequis

- Node.js 18+ 
- npm, yarn, ou pnpm
- Compte Firebase avec projet configuré

## 🔧 Installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd fadju-web
```

2. **Installer les dépendances**
```bash
npm install
# ou
yarn install
```

3. **Configuration Firebase**

   a. Créer un projet Firebase sur https://console.firebase.google.com
   
   b. Activer Firestore Database et Authentication
   
   c. Copier le fichier de configuration :
```bash
cp .env.local.example .env.local
```

   d. Remplir les variables d'environnement dans `.env.local` :
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. **Structure Firestore**

   Créer les collections suivantes dans Firestore :
   - `users` : Données des utilisateurs
   - `etablissements_sante` : Établissements de santé
   - `rendez_vous` : Rendez-vous médicaux
   - `resultats_medicaux` : Résultats et dossiers médicaux
   - `contacts_urgence` : Contacts d'urgence

   Voir `FIREBASE_SCHEMA.md` pour les détails de structure.

## 🚀 Démarrage

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans le navigateur.

## 📁 Structure du projet

```
fadju-web/
├── app/                          # App Router Next.js 15
│   ├── auth/login/              # Page de connexion
│   ├── dashboard/               # Pages du tableau de bord
│   │   ├── etablissements/      # Gestion établissements
│   │   ├── validation/          # Validation établissements
│   │   └── ...
│   ├── globals.css              # Styles globaux
│   └── layout.tsx               # Layout principal
├── src/
│   ├── components/              # Composants réutilisables
│   │   ├── ui/                  # Composants UI de base
│   │   ├── layout/              # Composants de mise en page
│   │   └── providers/           # Providers (Auth, Toast)
│   ├── lib/                     # Utilitaires et configurations
│   │   ├── firebase/            # Configuration Firebase
│   │   ├── constants/           # Constantes
│   │   └── utils.ts             # Fonctions utilitaires
│   ├── store/                   # Gestion d'état Zustand
│   │   ├── auth.ts              # Store authentification
│   │   ├── etablissement.ts     # Store établissements
│   │   └── rendez-vous.ts       # Store rendez-vous
│   └── types/                   # Types TypeScript
├── public/                      # Assets statiques
└── ...
```

## 🔐 Authentification

L'application utilise Firebase Auth avec gestion des rôles :

1. **Création d'utilisateur** : Se fait via l'interface d'administration
2. **Connexion** : Email + mot de passe
3. **Gestion des rôles** : Stockée dans Firestore (`users` collection)
4. **Protection des routes** : AuthProvider avec redirection automatique

## 🎨 Design System

### Couleurs
- **Primary** : Vert médical (#059669)
- **Secondary** : Gris neutre (#f3f4f6)
- **Accent** : Vert clair (#10b981)
- **Destructive** : Rouge (#ef4444)

### Composants UI
- Boutons avec variantes et animations
- Formulaires avec validation
- Modales et overlays
- Cards avec hover effects
- Badges et indicateurs de statut

## 📱 Responsive Design

- **Mobile First** : Design optimisé pour mobile
- **Breakpoints** : sm (640px), md (768px), lg (1024px), xl (1280px)
- **Navigation** : Sidebar responsive avec overlay mobile

## 🔄 Interconnexion Web-Mobile

L'application web partage la même base de données Firebase que l'application mobile Flutter, permettant :

- **Synchronisation en temps réel** des données
- **Notifications** entre plateformes
- **Gestion unifiée** des utilisateurs et établissements
- **Cohérence** des données patient/médecin

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests E2E
npm run test:e2e
```

## 🚀 Déploiement

### Vercel (Recommandé)
1. Connecter le repository à Vercel
2. Ajouter les variables d'environnement
3. Déployer automatiquement

### Autres plateformes
```bash
npm run build
npm run start
```

## 📚 Documentation

- [Schema Firebase](./FIREBASE_SCHEMA.md) - Structure des données
- [Guide Contributeur](./CONTRIBUTING.md) - Comment contribuer
- [Changelog](./CHANGELOG.md) - Historique des versions

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir `LICENSE` pour plus de détails.

## 👥 Équipe

- **Développement** : Équipe Fadju
- **Design** : Équipe UI/UX Fadju
- **Backend** : Firebase/Google Cloud

## 📞 Support

- Email : support@fadju.com
- Documentation : [docs.fadju.com](https://docs.fadju.com)
- Issues : [GitHub Issues](https://github.com/fadju/fadju-web/issues)