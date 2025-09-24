/**
 * Script pour créer un seed de test pour le dossier patient
 * Utilisation: npx ts-node scripts/create-test-seed.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, serverTimestamp } from 'firebase/firestore';
import { dossierPatientService } from '../src/lib/firebase/dossier-patient';

// Configuration Firebase (remplacez par vos vraies valeurs)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createTestSeed() {
  console.log('🌱 Création du seed de test pour le dossier patient...');

  try {
    // Créer le dossier patient de test
    const testPatientData = {
      patient_id: 'test1234',
      prenom: 'Aminata',
      nom: 'Diallo',
      email: 'aminata.diallo@email.sn',
      telephone: '+221 77 123 45 67',
      adresse: 'Dakar, Plateau, Rue 15 x Rue 20, Appartement 3B',
      date_naissance: new Date('1985-03-15'),
      genre: 'Femme' as const,
      allergie: 'Pénicilline, Arachides, Pollen de graminées',
      maladies_chroniques: 'Hypertension artérielle, Diabète type 2',
      groupe_sanguin: 'A+' as const,
      poids: 65,
      taille: 165,
      traitement_regulier: 'Amlodipine 5mg (1x/jour matin), Metformine 500mg (2x/jour), Aspirine 100mg (1x/jour)',
      actif: true,
    };

    await dossierPatientService.create(testPatientData as any);
    console.log('✅ Dossier patient créé avec succès !');

    // Créer quelques patients supplémentaires pour les tests
    const additionalPatients = [
      {
        patient_id: 'test5678',
        prenom: 'Moussa',
        nom: 'Sarr',
        email: 'moussa.sarr@email.sn',
        telephone: '+221 76 987 65 43',
        adresse: 'Thiès, Quartier Randoulène, Villa 45',
        date_naissance: new Date('1978-08-22'),
        genre: 'Homme' as const,
        allergie: 'Iode, Latex',
        maladies_chroniques: 'Asthme bronchique',
        groupe_sanguin: 'O+' as const,
        poids: 78,
        taille: 175,
        traitement_regulier: 'Ventoline (selon besoin), Symbicort 160/4.5 (2x/jour)',
        actif: true,
      },
      {
        patient_id: 'test9012',
        prenom: 'Fatou',
        nom: 'Ba',
        email: 'fatou.ba@email.sn',
        telephone: '+221 78 456 12 34',
        adresse: 'Saint-Louis, Sor, Rue Khalifa Ababacar Sy, Maison 12',
        date_naissance: new Date('1992-11-07'),
        genre: 'Femme' as const,
        allergie: null,
        maladies_chroniques: null,
        groupe_sanguin: 'B-' as const,
        poids: 58,
        taille: 160,
        traitement_regulier: null,
        actif: true,
      },
      {
        patient_id: 'test3456',
        prenom: 'Ibrahima',
        nom: 'Fall',
        email: 'ibrahima.fall@email.sn',
        telephone: '+221 77 654 32 10',
        adresse: 'Kaolack, Médina Baye, Quartier Léona',
        date_naissance: new Date('1965-05-14'),
        genre: 'Homme' as const,
        allergie: 'Sulfamides',
        maladies_chroniques: 'Insuffisance cardiaque, Arthrose du genou',
        groupe_sanguin: 'AB+' as const,
        poids: 85,
        taille: 170,
        traitement_regulier: 'Lisinopril 10mg (1x/jour), Furosémide 40mg (1x/jour), Glucosamine (2x/jour)',
        actif: true,
      },
    ];

    for (const patient of additionalPatients) {
      await dossierPatientService.create(patient as any);
      console.log(`✅ Patient ${patient.prenom} ${patient.nom} créé !`);
    }

    console.log('🎉 Tous les seeds de test ont été créés avec succès !');
    console.log('\n📋 Résumé des patients créés :');
    console.log('- test1234: Aminata Diallo (35 ans, A+, HTA + Diabète)');
    console.log('- test5678: Moussa Sarr (45 ans, O+, Asthme)');
    console.log('- test9012: Fatou Ba (31 ans, B-, Aucune pathologie)');
    console.log('- test3456: Ibrahima Fall (58 ans, AB+, Insuffisance cardiaque)');
    console.log('\n💡 Vous pouvez maintenant créer des rendez-vous avec ces patient_id pour tester l\'affichage dans le dashboard médecin.');

  } catch (error) {
    console.error('❌ Erreur lors de la création du seed:', error);
  }
}

// Créer un rendez-vous de test pour Aminata Diallo
async function createTestRendezVous() {
  console.log('\n📅 Création d\'un rendez-vous de test...');

  // Note: Ceci nécessiterait d'importer et d'utiliser les services de rendez-vous
  // Pour l'instant, on donne juste les instructions
  console.log('📝 Pour créer un rendez-vous de test manuellement dans Firestore :');
  console.log('Collection: rendez_vous');
  console.log('Document: {');
  console.log('  patient_id: "test1234",');
  console.log('  medecin_id: "VOTRE_MEDECIN_ID",');
  console.log('  etablissement_id: "VOTRE_ETABLISSEMENT_ID",');
  console.log('  date_rendez_vous: "2024-12-15T14:00:00Z",');
  console.log('  creneau_horaire: "14:00 - 14:30",');
  console.log('  motif: "Consultation de contrôle",');
  console.log('  statut: "confirme",');
  console.log('  type: "consultation",');
  console.log('  lieu: "Cabinet médical",');
  console.log('  specialite: "Médecine générale",');
  console.log('  date_creation: serverTimestamp()');
  console.log('}');
}

// Lancement du script
if (require.main === module) {
  createTestSeed()
    .then(() => createTestRendezVous())
    .then(() => {
      console.log('\n✨ Script terminé !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

export { createTestSeed };