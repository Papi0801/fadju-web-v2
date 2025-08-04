# 🌱 Script de Seeding - Rendez-vous de Test

Ce document explique comment utiliser les scripts de seeding pour créer des données de test pour les rendez-vous.

## 📋 Données générées

### 👥 Patients de test
- **test1234** - Aminata Diop
- **test3456** - Mamadou Fall  
- **test9012** - Fatou Ndiaye
- **test5678** - Ibrahim Sow

### 👨‍⚕️ Médecins utilisés
- **mjh9zEKGEoQYOGRjvib6q34aUYO2** - Dr. Aissatou Salimata (Cardiologie)
- **Xn04Gjm42xgAZ5WPCEoThVKCA3Y2** - Dr. Blaise Maronne (Médecine Générale)

### 🏥 Établissement
- **Xn04Gjm42xgAZ5WPCEoThVKCA3Y2** - Clinique La Sagesse

## 🎯 Scénarios de test créés

### 1. **RDV en attente** (8 RDV)
- Statut: `en_attente`
- Dates: Futures (1-30 jours)
- Médecin: Non attribué (`medecin_id: null`)
- **Usage**: Tester la confirmation par secrétaire

### 2. **RDV confirmés futurs** (6 RDV)
- Statut: `confirmee`  
- Dates: Futures (1-15 jours)
- Médecin: Attribué
- **Usage**: Tester l'affichage des prochains RDV

### 3. **RDV passés confirmés** (4 RDV)
- Statut: `confirmee`
- Dates: Passées (1-7 jours)
- Médecin: Attribué
- **Usage**: Tester la finalisation par médecin

### 4. **RDV terminés** (10 RDV)
- Statut: `terminee`
- Dates: Passées (8-38 jours)
- Contient: observations, ordonnances, analyses
- **Usage**: Tester l'historique médical

### 5. **RDV reportés** (3 RDV)
- Statut: `reportee`
- Dates: Futures (5-15 jours)
- Historique complet
- **Usage**: Tester la gestion des reports

### 6. **RDV annulés** (4 RDV)  
- Statut: `annulee`
- Certains avec médecin attribué, d'autres sans
- **Usage**: Tester les annulations

## 🚀 Utilisation

### Option 1: Script Node.js simple

1. **Configurer Firebase** dans `scripts/seed-simple.js`:
```javascript
const firebaseConfig = {
  apiKey: "votre-api-key",
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-project-id",
  // ... autres valeurs
};
```

2. **Exécuter**:
```bash
cd scripts
node seed-simple.js
```

### Option 2: Script TypeScript complet

1. **Configurer les variables d'environnement** dans `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
# ... autres variables
```

2. **Exécuter**:
```bash
# Avec tsx (recommandé)
npx tsx scripts/seed-rendez-vous.ts

# Ou avec ts-node
npx ts-node scripts/seed-rendez-vous.ts
```

### Option 3: Via package.json

Ajouter dans `package.json`:
```json
{
  "scripts": {
    "seed:rdv": "tsx scripts/seed-rendez-vous.ts",
    "seed:simple": "node scripts/seed-simple.js"
  }
}
```

Puis:
```bash
npm run seed:rdv
# ou
npm run seed:simple
```

## 📊 Résultat attendu

Après exécution, vous aurez **35 rendez-vous** répartis comme suit:
- ✳️ En attente: 8 RDV
- ✅ Confirmés: 6 RDV  
- ⏰ Passés à finaliser: 4 RDV
- ✔️ Terminés: 10 RDV
- 🔄 Reportés: 3 RDV
- ❌ Annulés: 4 RDV

## 🧪 Tests possibles

### Pour Secrétaire:
- Confirmer des RDV en attente
- Attribuer des médecins
- Reporter des RDV
- Voir l'historique complet

### Pour Médecin:
- Finaliser des consultations passées
- Voir l'historique des consultations terminées
- Consulter les prochains RDV

### Pour Dashboard:
- Statistiques mises à jour
- Répartition par statut
- Graphiques de suivi

## ⚠️ Important

- **Sauvegardez** votre base de données avant le seeding
- Les **IDs des médecins et établissement** doivent exister
- Les **patients** seront référencés mais leurs dossiers doivent être créés séparément
- Le script utilise des **dates relatives** (futures/passées par rapport à maintenant)

## 🔧 Personnalisation

Pour modifier les données, éditez dans le script:
- `PATIENTS`: Ajouter/modifier les patients
- `MEDECINS`: Changer les médecins  
- `ETABLISSEMENT_ID`: Utiliser votre établissement
- `MOTIFS`: Personnaliser les motifs de consultation
- Nombre de RDV par scénario dans `generateTestRendezVous()`

## 🐛 Dépannage

### Erreur de permissions Firebase
```
Error: Missing or insufficient permissions
```
**Solution**: Vérifiez les règles Firestore et l'authentification

### Erreur de configuration
```
Error: Firebase configuration missing
```
**Solution**: Vérifiez vos variables d'environnement ou la configuration dans le script

### Erreur d'IDs inexistants
```
Error: Medecin/Etablissement not found
```
**Solution**: Vérifiez que les IDs des médecins et établissement existent dans votre base

## 📞 Support

Si vous rencontrez des problèmes:
1. Vérifiez la configuration Firebase
2. Contrôlez les permissions Firestore  
3. Validez que les IDs référencés existent
4. Consultez les logs de la console Firebase