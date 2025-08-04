/**
 * Script de seeding simple pour les rendez-vous
 * Peut être exécuté directement avec Node.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, Timestamp, writeBatch, doc } = require('firebase/firestore');

// Configuration Firebase - ATTENTION: Remplacez par vos vraies valeurs
const firebaseConfig = {
  apiKey: "AIzaSyBKekXWGMvWB1jA7FHciZlBJDTb1S3vMrc",
  authDomain: "fadju-6e0a2.firebaseapp.com", 
  projectId: "fadju-6e0a2",
  storageBucket: "fadju-6e0a2.firebasestorage.app",
  messagingSenderId: "19429044846",
  appId: "1:19429044846:web:99078747d2821e1938ec7f"
};

// ⚠️ IMPORTANT: Mettez à jour cette configuration avant d'exécuter le script

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Données de test
const PATIENTS = [
  { id: 'test1234', nom: 'Diop', prenom: 'Aminata' },
  { id: 'test3456', nom: 'Fall', prenom: 'Mamadou' },
  { id: 'test9012', nom: 'Ndiaye', prenom: 'Fatou' },
  { id: 'test5678', nom: 'Sow', prenom: 'Ibrahim' },
];

const MEDECINS = [
  { id: 'mjh9zEKGEoQYOGRjvib6q34aUYO2', nom: 'Dr. Aissatou Salimata', specialite: 'Cardiologie' },
  { id: 'Xn04Gjm42xgAZ5WPCEoThVKCA3Y2', nom: 'Dr. Blaise Maronne', specialite: 'Médecine Générale' },
];

const ETABLISSEMENT_ID = 'Xn04Gjm42xgAZ5WPCEoThVKCA3Y2';

const MOTIFS = [
  'Consultation de routine', 'Contrôle cardiaque', 'Analyse de sang', 'Suivi diabète',
  'Douleurs abdominales', 'Consultation préventive', 'Contrôle tension artérielle',
  'Bilan de santé', 'Consultation dermatologique', 'Suivi grossesse'
];

const TYPES = ['consultation', 'analyse', 'suivi', 'urgence'];

// Fonction utilitaire pour générer une date
const getRandomDate = (daysOffset) => {
  const now = new Date();
  const date = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000);
  const hour = Math.floor(Math.random() * 10) + 8; // 8h-18h
  const minute = Math.random() < 0.5 ? 0 : 30;
  date.setHours(hour, minute, 0, 0);
  return date;
};

const getEndTime = (startTime) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const endDate = new Date();
  endDate.setHours(hours, minutes + 30, 0, 0);
  return endDate.toTimeString().slice(0, 5);
};

// Générateur de RDV de test
const generateRendezVous = () => {
  const rdvList = [];

  // 1. RDV en attente (5 RDV)
  console.log('Génération des RDV en attente...');
  for (let i = 0; i < 5; i++) {
    const patient = PATIENTS[i % PATIENTS.length];
    const dateRdv = getRandomDate(Math.floor(Math.random() * 15) + 1);
    const heureDebut = `${9 + i}:${i % 2 === 0 ? '00' : '30'}`;
    
    rdvList.push({
      patient_id: patient.id,
      etablissement_id: ETABLISSEMENT_ID,
      medecin_id: null,
      date_rdv: Timestamp.fromDate(dateRdv),
      heure_debut: heureDebut,
      heure_fin: getEndTime(heureDebut),
      motif: MOTIFS[i % MOTIFS.length],
      type: TYPES[i % TYPES.length],
      statut: 'en_attente',
      date_creation: Timestamp.now(),
      notes: 'RDV en attente de confirmation'
    });
  }

  // 2. RDV confirmés futurs (4 RDV)
  console.log('Génération des RDV confirmés futurs...');
  for (let i = 0; i < 4; i++) {
    const patient = PATIENTS[i % PATIENTS.length];
    const medecin = MEDECINS[i % MEDECINS.length];
    const dateRdv = getRandomDate(Math.floor(Math.random() * 10) + 3);
    const heureDebut = `${10 + i}:${i % 2 === 0 ? '00' : '30'}`;
    
    rdvList.push({
      patient_id: patient.id,
      etablissement_id: ETABLISSEMENT_ID,
      medecin_id: medecin.id,
      date_rdv: Timestamp.fromDate(dateRdv),
      heure_debut: heureDebut,
      heure_fin: getEndTime(heureDebut),
      motif: MOTIFS[(i + 2) % MOTIFS.length],
      type: TYPES[i % TYPES.length],
      statut: 'confirmee',
      date_creation: Timestamp.fromDate(new Date(Date.now() - i * 24 * 60 * 60 * 1000)),
      notes: `RDV confirmé avec ${medecin.nom}`
    });
  }

  // 3. RDV passés confirmés (3 RDV) - À finaliser par médecin
  console.log('Génération des RDV passés à finaliser...');
  for (let i = 0; i < 3; i++) {
    const patient = PATIENTS[i % PATIENTS.length];
    const medecin = MEDECINS[i % MEDECINS.length];
    const dateRdv = getRandomDate(-(Math.floor(Math.random() * 5) + 1));
    const heureDebut = `${14 + i}:00`;
    
    rdvList.push({
      patient_id: patient.id,
      etablissement_id: ETABLISSEMENT_ID,
      medecin_id: medecin.id,
      date_rdv: Timestamp.fromDate(dateRdv),
      heure_debut: heureDebut,
      heure_fin: getEndTime(heureDebut),
      motif: MOTIFS[(i + 4) % MOTIFS.length],
      type: TYPES[i % TYPES.length],
      statut: 'confirmee',
      date_creation: Timestamp.fromDate(new Date(dateRdv.getTime() - 3 * 24 * 60 * 60 * 1000)),
      notes: 'Consultation passée - en attente de finalisation'
    });
  }

  // 4. RDV terminés (6 RDV)
  console.log('Génération des RDV terminés...');
  for (let i = 0; i < 6; i++) {
    const patient = PATIENTS[i % PATIENTS.length];
    const medecin = MEDECINS[i % MEDECINS.length];
    const dateRdv = getRandomDate(-(Math.floor(Math.random() * 20) + 7));
    const heureDebut = `${9 + (i % 6)}:${i % 2 === 0 ? '00' : '30'}`;
    
    rdvList.push({
      patient_id: patient.id,
      etablissement_id: ETABLISSEMENT_ID,
      medecin_id: medecin.id,
      date_rdv: Timestamp.fromDate(dateRdv),
      heure_debut: heureDebut,
      heure_fin: getEndTime(heureDebut),
      motif: MOTIFS[i % MOTIFS.length],
      type: TYPES[i % TYPES.length],
      statut: 'terminee',
      date_creation: Timestamp.fromDate(new Date(dateRdv.getTime() - 5 * 24 * 60 * 60 * 1000)),
      observations: `Consultation terminée pour ${patient.prenom} ${patient.nom}. État satisfaisant.`,
      ordonnance: i % 2 === 0 ? 'Paracétamol 1g - 3 fois/jour pendant 5 jours' : null,
      notes: 'Consultation terminée avec succès'
    });
  }

  // 5. RDV reportés (2 RDV)
  console.log('Génération des RDV reportés...');
  for (let i = 0; i < 2; i++) {
    const patient = PATIENTS[i % PATIENTS.length];
    const medecin = MEDECINS[i % MEDECINS.length];
    const dateRdv = getRandomDate(Math.floor(Math.random() * 8) + 5);
    const heureDebut = `${13 + i}:00`;
    
    rdvList.push({
      patient_id: patient.id,
      etablissement_id: ETABLISSEMENT_ID,
      medecin_id: medecin.id,
      date_rdv: Timestamp.fromDate(dateRdv),
      heure_debut: heureDebut,
      heure_fin: getEndTime(heureDebut),
      motif: MOTIFS[(i + 6) % MOTIFS.length],
      type: TYPES[i % TYPES.length],
      statut: 'reportee',
      date_creation: Timestamp.fromDate(new Date(Date.now() - (i + 3) * 24 * 60 * 60 * 1000)),
      notes: 'RDV reporté'
    });
  }

  // 6. RDV annulés (2 RDV)
  console.log('Génération des RDV annulés...');
  for (let i = 0; i < 2; i++) {
    const patient = PATIENTS[i % PATIENTS.length];
    const dateRdv = getRandomDate(Math.floor(Math.random() * 12) + 1);
    const heureDebut = `${11 + i}:30`;
    
    rdvList.push({
      patient_id: patient.id,
      etablissement_id: ETABLISSEMENT_ID,
      medecin_id: i === 0 ? MEDECINS[0].id : null, // Un avec médecin, un sans
      date_rdv: Timestamp.fromDate(dateRdv),
      heure_debut: heureDebut,
      heure_fin: getEndTime(heureDebut),
      motif: MOTIFS[(i + 8) % MOTIFS.length],
      type: TYPES[i % TYPES.length],
      statut: 'annulee',
      date_creation: Timestamp.fromDate(new Date(Date.now() - (i + 2) * 24 * 60 * 60 * 1000)),
      notes: 'RDV annulé'
    });
  }

  return rdvList;
};

// Fonction principale
const seedDatabase = async () => {
  try {
    console.log('\n🌱 SEEDING DES RENDEZ-VOUS FADJU');
    console.log('================================\n');

    const rdvList = generateRendezVous();
    
    console.log(`\n📊 Nombre total de RDV à créer: ${rdvList.length}`);
    console.log('\n⏳ Insertion en cours...');

    let successCount = 0;
    
    for (const rdv of rdvList) {
      try {
        await addDoc(collection(db, 'rendez_vous'), rdv);
        successCount++;
        process.stdout.write(`\r✅ Insertés: ${successCount}/${rdvList.length}`);
      } catch (error) {
        console.error(`\n❌ Erreur pour RDV ${rdv.patient_id}:`, error.message);
      }
    }

    console.log('\n\n🎉 SEEDING TERMINÉ !');
    console.log('===================\n');

    // Statistiques
    const stats = rdvList.reduce((acc, rdv) => {
      acc[rdv.statut] = (acc[rdv.statut] || 0) + 1;
      return acc;
    }, {});

    console.log('📈 Répartition par statut:');
    Object.entries(stats).forEach(([statut, count]) => {
      console.log(`   ${statut}: ${count} RDV`);
    });

    console.log('\n🎯 Tests disponibles:');
    console.log('   • Page secrétaire: RDV en attente à confirmer');
    console.log('   • Page médecin: RDV passés à finaliser');
    console.log('   • Dashboard: Statistiques mises à jour');
    console.log('   • Historique: RDV terminés visibles');

    console.log('\n👤 Données patients utilisées:');
    PATIENTS.forEach(p => console.log(`   • ${p.prenom} ${p.nom} (${p.id})`));

    console.log('\n👨‍⚕️ Médecins utilisés:');
    MEDECINS.forEach(m => console.log(`   • ${m.nom} (${m.specialite})`));

    process.exit(0);

  } catch (error) {
    console.error('\n💥 ERREUR FATALE:', error);
    process.exit(1);
  }
};

// Vérification de la configuration
if (firebaseConfig.apiKey === "your-api-key") {
  console.error('\n❌ ERREUR: Veuillez configurer Firebase dans le script !');
  console.error('Modifiez les valeurs firebaseConfig avec vos vraies clés.\n');
  process.exit(1);
}

// Démarrage
console.log('🚀 Démarrage du script...');
seedDatabase();