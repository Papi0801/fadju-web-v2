#!/usr/bin/env node

/**
 * Script pour migrer les données patients existantes vers le système d'affiliation
 * et créer des données de test
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc,
  query,
  where,
  serverTimestamp 
} = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyC8ZOg2KGjcmMvLUoJgv6C9EJCgmOxNfzI",
  authDomain: "fadju-sante.firebaseapp.com",
  projectId: "fadju-sante",
  storageBucket: "fadju-sante.appspot.com",
  messagingSenderId: "446038742053",
  appId: "1:446038742053:web:ba0b8f789423659da98b36"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migratePatientAffiliations() {
  console.log('🔄 MIGRATION DES AFFILIATIONS PATIENTS');
  console.log('=====================================\n');

  try {
    // 1. Récupérer tous les patients existants
    console.log('📋 Récupération des patients existants...');
    const patientsQuery = query(
      collection(db, 'dossier_patient'),
      where('actif', '==', true)
    );
    
    const patientsSnapshot = await getDocs(patientsQuery);
    console.log(`   ✓ ${patientsSnapshot.docs.length} patients trouvés`);

    if (patientsSnapshot.docs.length === 0) {
      console.log('⚠️  Aucun patient existant trouvé. Création de données de test...\n');
      await createTestPatients();
      return;
    }

    // 2. Récupérer les établissements pour affiliation par défaut
    console.log('🏥 Récupération des établissements...');
    const etablissementsSnapshot = await getDocs(collection(db, 'etablissements_sante'));
    
    if (etablissementsSnapshot.docs.length === 0) {
      console.log('❌ Aucun établissement trouvé. Impossible de migrer.');
      return;
    }

    const etablissements = etablissementsSnapshot.docs.map(doc => ({
      id: doc.id,
      nom: doc.data().nom
    }));
    
    console.log(`   ✓ ${etablissements.length} établissements trouvés:`);
    etablissements.forEach(etab => {
      console.log(`     - ${etab.nom} (${etab.id})`);
    });

    // 3. Migrer chaque patient
    console.log('\n🔄 Migration des patients...');
    let migratedCount = 0;
    let skippedCount = 0;

    for (const patientDoc of patientsSnapshot.docs) {
      const patientData = patientDoc.data();
      const patientId = patientDoc.id;

      // Vérifier si le patient a déjà des affiliations
      if (patientData.etablissements_affilies && Array.isArray(patientData.etablissements_affilies)) {
        console.log(`   ⏭️  Patient ${patientData.prenom} ${patientData.nom} déjà migré`);
        skippedCount++;
        continue;
      }

      // Affecter le patient au premier établissement par défaut
      const etablissementDefaut = etablissements[0];
      
      await updateDoc(doc(db, 'dossier_patient', patientId), {
        etablissements_affilies: [etablissementDefaut.id],
        date_modification: serverTimestamp()
      });

      console.log(`   ✓ Patient ${patientData.prenom} ${patientData.nom} affilié à ${etablissementDefaut.nom}`);
      migratedCount++;
    }

    console.log(`\n✅ Migration terminée:`);
    console.log(`   • ${migratedCount} patients migrés`);
    console.log(`   • ${skippedCount} patients déjà migrés`);

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  }
}

async function createTestPatients() {
  try {
    // Récupérer un établissement pour les tests
    const etablissementsSnapshot = await getDocs(collection(db, 'etablissements_sante'));
    
    if (etablissementsSnapshot.docs.length === 0) {
      console.log('❌ Aucun établissement disponible pour créer des patients de test');
      return;
    }

    const etablissement = etablissementsSnapshot.docs[0];
    const etablissementId = etablissement.id;
    const etablissementNom = etablissement.data().nom;

    console.log(`🏥 Utilisation de l'établissement: ${etablissementNom} (${etablissementId})`);

    const testPatients = [
      {
        patient_id: 'test_patient_001',
        prenom: 'Aminata',
        nom: 'Diallo',
        email: 'aminata.diallo@email.sn',
        telephone: '+221 77 123 45 67',
        adresse: 'Dakar, Plateau, Rue 15 x Rue 20',
        date_naissance: new Date('1990-05-15'),
        genre: 'Femme',
        allergie: 'Pénicilline',
        maladie_chronique: 'Hypertension artérielle',
        groupe_sanguin: 'A+',
        poids: 65,
        taille: 165,
        etablissements_affilies: [etablissementId],
        actif: true
      },
      {
        patient_id: 'test_patient_002',
        prenom: 'Mamadou',
        nom: 'Sow',
        email: 'mamadou.sow@email.sn',
        telephone: '+221 77 987 65 43',
        adresse: 'Dakar, Sacré-Coeur, Villa 123',
        date_naissance: new Date('1985-11-20'),
        genre: 'Homme',
        allergie: null,
        maladie_chronique: 'Diabète type 2',
        groupe_sanguin: 'O+',
        poids: 78,
        taille: 175,
        etablissements_affilies: [etablissementId],
        actif: true
      },
      {
        patient_id: 'test_patient_003',
        prenom: 'Fatou',
        nom: 'Ndiaye',
        email: 'fatou.ndiaye@email.sn',
        telephone: '+221 78 555 44 33',
        adresse: 'Dakar, Mermoz, Cité Biagui',
        date_naissance: new Date('1992-08-10'),
        genre: 'Femme',
        allergie: 'Aspirine',
        maladie_chronique: null,
        groupe_sanguin: 'B+',
        poids: 58,
        taille: 160,
        etablissements_affilies: [etablissementId],
        actif: true
      }
    ];

    console.log('👥 Création des patients de test...');
    for (const patient of testPatients) {
      // Vérifier si le patient existe déjà
      const existingQuery = query(
        collection(db, 'dossier_patient'),
        where('patient_id', '==', patient.patient_id)
      );
      const existingSnapshot = await getDocs(existingQuery);

      if (existingSnapshot.docs.length > 0) {
        console.log(`   ⏭️  Patient ${patient.prenom} ${patient.nom} existe déjà`);
        continue;
      }

      await addDoc(collection(db, 'dossier_patient'), {
        ...patient,
        date_creation: serverTimestamp(),
        date_modification: serverTimestamp()
      });

      console.log(`   ✓ Patient ${patient.prenom} ${patient.nom} créé et affilié`);
    }

    console.log('\n✅ Patients de test créés avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la création des patients de test:', error);
  }
}

// Mode d'exécution
const mode = process.argv[2] || 'migrate';

if (mode === 'test') {
  createTestPatients();
} else if (mode === 'migrate') {
  migratePatientAffiliations();
} else {
  console.log('Usage:');
  console.log('  node migrate-patient-affiliations.js migrate  # Migrer les données existantes');
  console.log('  node migrate-patient-affiliations.js test     # Créer des patients de test');
}