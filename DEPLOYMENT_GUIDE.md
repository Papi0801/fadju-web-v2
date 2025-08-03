# Guide de Déploiement - Fadju Web Platform

## Vue d'ensemble

Ce guide détaille le processus de déploiement complet de la plateforme web Fadju, de l'environnement de développement à la production.

## Architecture de Déploiement

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FRONTEND      │    │    BACKEND      │    │    DATABASE     │
│                 │    │                 │    │                 │
│ Next.js 15      │◄──►│ Firebase        │◄──►│ Firestore       │
│ Vercel/Netlify  │    │ Functions       │    │ Authentication  │
│ CDN Global      │    │ Node.js         │    │ Storage         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MONITORING    │    │      EMAIL      │    │     MOBILE      │
│                 │    │                 │    │                 │
│ Vercel Analytics│    │ EmailJS         │    │ Flutter App     │
│ Sentry/LogRocket│    │ SendGrid (opt)  │    │ Firebase SDK    │
│ Lighthouse CI   │    │ Notifications   │    │ App/Play Store  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Prérequis

### 1. Outils Nécessaires

```bash
# Node.js (version 18+)
node --version  # v18.17.0+

# npm ou yarn
npm --version   # 9.0.0+

# Git
git --version  # 2.30.0+

# Firebase CLI
npm install -g firebase-tools
firebase --version  # 12.0.0+
```

### 2. Comptes Requis

- [ ] **Firebase Project** (gratuit pour commencer)
- [ ] **Vercel Account** (déploiement frontend)
- [ ] **EmailJS Account** (envoi d'emails)
- [ ] **Domain Name** (optionnel, Namecheap/Gandi)

## Configuration Firebase

### 1. Création du Projet

```bash
# Se connecter à Firebase
firebase login

# Créer un nouveau projet
firebase projects:create fadju-web-prod

# Initialiser le projet local
firebase init
# Sélectionner: Firestore, Functions, Hosting, Storage
```

### 2. Configuration Firestore

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users peuvent lire leur propre profil
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && 
        request.auth.token.role in ['superadmin', 'secretaire', 'medecin'];
    }
    
    // Établissements
    match /etablissements/{etablissementId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.token.role in ['superadmin', 'secretaire'];
    }
    
    // Rendez-vous
    match /rendez_vous/{rendezVousId} {
      allow read: if request.auth != null && (
        resource.data.patient_id == request.auth.uid ||
        resource.data.medecin_id == request.auth.uid ||
        request.auth.token.role in ['secretaire', 'superadmin']
      );
      
      allow write: if request.auth != null && 
        request.auth.token.role in ['secretaire', 'medecin', 'patient'];
    }
    
    // Consultations
    match /consultations/{consultationId} {
      allow read: if request.auth != null && (
        resource.data.patient_id == request.auth.uid ||
        resource.data.medecin_id == request.auth.uid ||
        request.auth.token.role == 'secretaire'
      );
      
      allow write: if request.auth != null && 
        request.auth.token.role in ['medecin', 'secretaire'];
    }
  }
}
```

### 3. Firebase Functions

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Notification nouveau rendez-vous
exports.notifyNewRendezVous = functions.firestore
  .document('rendez_vous/{rendezVousId}')
  .onCreate(async (snap, context) => {
    const rendezVous = snap.data();
    
    // Logique de notification...
    console.log('Nouveau RDV créé:', context.params.rendezVousId);
  });

// Validation établissement
exports.onEtablissementValidation = functions.firestore
  .document('etablissements/{etablissementId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    if (before.statut_validation !== after.statut_validation) {
      // Envoyer email de notification
      console.log('Statut changé:', before.statut_validation, '->', after.statut_validation);
    }
  });
```

## Variables d'Environnement

### 1. Développement (.env.local)

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_dev_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=fadju-web-dev.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=fadju-web-dev
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=fadju-web-dev.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# EmailJS Configuration
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_dev123
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_dev123
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=user_dev123456

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=development
```

### 2. Production (.env.production)

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_prod_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=fadju-web-prod.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=fadju-web-prod
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=fadju-web-prod.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=987654321
NEXT_PUBLIC_FIREBASE_APP_ID=1:987654321:web:fedcba

# EmailJS Configuration
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_prod123
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_prod123
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=user_prod123456

# Application
NEXT_PUBLIC_APP_URL=https://fadju.sn
NEXT_PUBLIC_APP_ENV=production
```

## Déploiement Frontend (Vercel)

### 1. Configuration Vercel

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "next.config.js",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID": "@firebase-project-id",
    "NEXT_PUBLIC_FIREBASE_API_KEY": "@firebase-api-key"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

### 2. Déploiement Automatique

```bash
# Installer Vercel CLI
npm install -g vercel

# Se connecter
vercel login

# Premier déploiement
vercel

# Déploiements suivants
vercel --prod

# Configuration du domaine
vercel domains add fadju.sn
vercel alias set your-deployment-url.vercel.app fadju.sn
```

### 3. GitHub Actions (CI/CD)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test
      
      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Déploiement Backend (Firebase)

### 1. Déploiement Functions

```bash
# Build et déploiement
cd functions
npm install
npm run build

# Déployer les functions
firebase deploy --only functions

# Déployer Firestore rules
firebase deploy --only firestore:rules

# Déploiement complet
firebase deploy
```

### 2. Configuration des Triggers

```javascript
// Configuration automatique des Custom Claims
exports.setCustomClaims = functions.auth.user().onCreate(async (user) => {
  const userDoc = await admin.firestore()
    .collection('users')
    .doc(user.uid)
    .get();
  
  if (userDoc.exists) {
    const userData = userDoc.data();
    await admin.auth().setCustomUserClaims(user.uid, {
      role: userData.role,
      etablissement_id: userData.etablissement_id
    });
  }
});
```

## Configuration DNS et Domaine

### 1. Configuration Domaine

```bash
# Enregistrements DNS requis
Type    Name    Value                       TTL
A       @       76.76.19.61                300
CNAME   www     cname.vercel-dns.com       300
TXT     @       "v=spf1 include:_spf.google.com ~all"  300
```

### 2. SSL/HTTPS

```javascript
// Configuration force HTTPS dans next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          }
        ]
      }
    ];
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'x-forwarded-proto',
            value: 'http'
          }
        ],
        destination: 'https://fadju.sn/:path*',
        permanent: true
      }
    ];
  }
};
```

## Tests de Production

### 1. Checklist Pré-déploiement

- [ ] **Build sans erreurs**
  ```bash
  npm run build
  npm run start
  ```

- [ ] **Tests passent**
  ```bash
  npm run test
  npm run test:e2e
  ```

- [ ] **Audit de sécurité**
  ```bash
  npm audit
  npm audit fix
  ```

- [ ] **Performance**
  ```bash
  npm run lighthouse
  # Score > 90 sur Performance, Accessibility, SEO
  ```

### 2. Tests Post-déploiement

```javascript
// Script de test automatique
const testDeployment = async () => {
  const tests = [
    { name: 'Homepage', url: 'https://fadju.sn' },
    { name: 'Login', url: 'https://fadju.sn/auth/login' },
    { name: 'API Health', url: 'https://fadju.sn/api/health' }
  ];
  
  for (const test of tests) {
    const response = await fetch(test.url);
    console.log(`${test.name}: ${response.status === 200 ? '✅' : '❌'}`);
  }
};
```

## Monitoring et Maintenance

### 1. Monitoring Vercel

```javascript
// vercel.json - Analytics
{
  "analytics": {
    "id": "your-analytics-id"
  },
  "functions": {
    "app/api/**/*.js": {
      "maxDuration": 30
    }
  }
}
```

### 2. Monitoring Firebase

```javascript
// Alertes personnalisées
const monitoring = {
  errorRate: {
    threshold: 5, // %
    window: '5m'
  },
  responseTime: {
    threshold: 2000, // ms
    percentile: 95
  },
  activeUsers: {
    threshold: 100,
    window: '1h'
  }
};
```

### 3. Logs et Debugging

```bash
# Logs Firebase Functions
firebase functions:log

# Logs Vercel
vercel logs your-deployment-url.vercel.app

# Monitoring en temps réel
firebase functions:log --only functionName
```

## Backup et Sécurité

### 1. Backup Firestore

```bash
# Export automatique
gcloud firestore export gs://your-backup-bucket/$(date +%Y-%m-%d)

# Restore
gcloud firestore import gs://your-backup-bucket/2025-01-15
```

### 2. Sécurité

```javascript
// Configuration CSP
const securityHeaders = {
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' *.googleapis.com;
    style-src 'self' 'unsafe-inline' *.googleapis.com;
    img-src 'self' data: blob: *.googleusercontent.com;
    connect-src 'self' *.googleapis.com *.firebaseio.com;
  `.replace(/\s+/g, ' ').trim()
};
```

## Mise à Jour et Maintenance

### 1. Déploiement Blue-Green

```bash
# Déployment de test
vercel --prod --alias staging-fadju.sn

# Tests sur staging
npm run test:staging

# Basculement production
vercel alias set staging-fadju.sn fadju.sn
```

### 2. Rollback

```bash
# Lister les déploiements
vercel ls

# Rollback vers version précédente
vercel alias set previous-deployment-url.vercel.app fadju.sn
```

## Performance et Optimisation

### 1. Optimisations Build

```javascript
// next.config.js
const nextConfig = {
  // Compression
  compress: true,
  
  // Images
  images: {
    domains: ['firebasestorage.googleapis.com'],
    formats: ['image/webp', 'image/avif']
  },
  
  // Bundle analyzer
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false;
    }
    return config;
  }
};
```

### 2. Cache Strategy

```javascript
// Stratégie de cache
const cacheStrategy = {
  static: 'max-age=31536000, immutable',
  dynamic: 'max-age=0, s-maxage=86400, stale-while-revalidate',
  api: 'max-age=0, s-maxage=300, stale-while-revalidate=60'
};
```

Ce guide garantit un déploiement robuste et scalable de la plateforme Fadju Web avec une architecture moderne et des bonnes pratiques de sécurité.