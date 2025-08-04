import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp, writeBatch, doc } from 'firebase/firestore';

// Configuration Firebase (à adapter selon votre config)
const firebaseConfig = {
  // Remplacez par votre configuration Firebase
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

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

const ETABLISSEMENT_ID = 'Xn04Gjm42xgAZ5WPCEoThVKCA3Y2'; // Clinique La Sagesse

const MOTIFS = [
  'Consultation de routine',
  'Contrôle cardiaque',
  'Analyse de sang',
  'Suivi diabète',
  'Douleurs abdominales',
  'Consultation préventive',
  'Contrôle tension artérielle',
  'Bilan de santé',
  'Consultation dermatologique',
  'Suivi grossesse',
  'Vaccination',
  'Certificat médical',
];

const TYPES = ['consultation', 'analyse', 'suivi', 'urgence'] as const;

// Fonction pour générer une date aléatoire
const getRandomDate = (daysOffset: number, hoursRange: [number, number] = [8, 18]) => {
  const now = new Date();
  const date = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000);
  const randomHour = Math.floor(Math.random() * (hoursRange[1] - hoursRange[0]) + hoursRange[0]);
  const randomMinute = Math.random() < 0.5 ? 0 : 30;
  
  date.setHours(randomHour, randomMinute, 0, 0);
  return date;
};

// Fonction pour générer l'heure de fin (30 min après le début)
const getEndTime = (startTime: string) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const endDate = new Date();
  endDate.setHours(hours, minutes + 30, 0, 0);
  return endDate.toTimeString().slice(0, 5);
};

// Scénarios de test
const generateTestRendezVous = () => {
  const rendezVous = [];
  let rdvCount = 0;

  // Scénario 1: RDV en attente (futurs)
  for (let i = 0; i < 8; i++) {
    const patient = PATIENTS[i % PATIENTS.length];
    const dateRdv = getRandomDate(Math.floor(Math.random() * 30) + 1); // 1-30 jours dans le futur
    const heureDebut = `${9 + (i % 8)}:${i % 2 === 0 ? '00' : '30'}`;
    
    rendezVous.push({
      patient_id: patient.id,
      etablissement_id: ETABLISSEMENT_ID,
      medecin_id: null, // Pas encore attribué
      date_rdv: Timestamp.fromDate(dateRdv),
      heure_debut: heureDebut,
      heure_fin: getEndTime(heureDebut),
      motif: MOTIFS[i % MOTIFS.length],
      type: TYPES[i % TYPES.length],
      statut: 'en_attente',
      date_creation: Timestamp.now(),
      notes: 'Demande de rendez-vous en attente de confirmation',
      historique_modifications: [{
        date: new Date(),
        action: 'creation',
        utilisateur_id: patient.id,
        motif_modification: 'Demande de rendez-vous créée par le patient'
      }]
    });
  }

  // Scénario 2: RDV confirmés (futurs)
  for (let i = 0; i < 6; i++) {
    const patient = PATIENTS[i % PATIENTS.length];
    const medecin = MEDECINS[i % MEDECINS.length];
    const dateRdv = getRandomDate(Math.floor(Math.random() * 15) + 1); // 1-15 jours dans le futur
    const heureDebut = `${10 + (i % 6)}:${i % 2 === 0 ? '00' : '30'}`;
    
    rendezVous.push({
      patient_id: patient.id,
      etablissement_id: ETABLISSEMENT_ID,
      medecin_id: medecin.id,
      date_rdv: Timestamp.fromDate(dateRdv),
      heure_debut: heureDebut,
      heure_fin: getEndTime(heureDebut),
      motif: MOTIFS[(i + 4) % MOTIFS.length],
      type: TYPES[i % TYPES.length],
      statut: 'confirmee',
      date_creation: Timestamp.fromDate(new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000)),
      notes: `Rendez-vous confirmé avec ${medecin.nom}`,
      historique_modifications: [
        {
          date: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
          action: 'creation',
          utilisateur_id: patient.id,
          motif_modification: 'Demande de rendez-vous créée'
        },
        {
          date: new Date(Date.now() - i * 12 * 60 * 60 * 1000),
          action: 'confirmation',
          utilisateur_id: 'secretaire_test',
          ancien_statut: 'en_attente',
          nouveau_statut: 'confirmee',
          motif_modification: `Rendez-vous confirmé et attribué au ${medecin.nom}`
        }
      ]
    });
  }

  // Scénario 3: RDV passés confirmés (en attente de finalisation par le médecin)
  for (let i = 0; i < 4; i++) {
    const patient = PATIENTS[i % PATIENTS.length];
    const medecin = MEDECINS[i % MEDECINS.length];
    const dateRdv = getRandomDate(-(Math.floor(Math.random() * 7) + 1)); // 1-7 jours dans le passé
    const heureDebut = `${14 + (i % 3)}:${i % 2 === 0 ? '00' : '30'}`;
    
    rendezVous.push({
      patient_id: patient.id,
      etablissement_id: ETABLISSEMENT_ID,
      medecin_id: medecin.id,
      date_rdv: Timestamp.fromDate(dateRdv),
      heure_debut: heureDebut,
      heure_fin: getEndTime(heureDebut),
      motif: MOTIFS[(i + 8) % MOTIFS.length],
      type: TYPES[i % TYPES.length],
      statut: 'confirmee',
      date_creation: Timestamp.fromDate(new Date(dateRdv.getTime() - 3 * 24 * 60 * 60 * 1000)),
      notes: `Consultation passée - en attente de finalisation`,
      historique_modifications: [
        {
          date: new Date(dateRdv.getTime() - 3 * 24 * 60 * 60 * 1000),
          action: 'creation',
          utilisateur_id: patient.id,
          motif_modification: 'Demande de rendez-vous créée'
        },
        {
          date: new Date(dateRdv.getTime() - 2 * 24 * 60 * 60 * 1000),
          action: 'confirmation',
          utilisateur_id: 'secretaire_test',
          motif_modification: `Rendez-vous confirmé avec ${medecin.nom}`
        }
      ]
    });
  }

  // Scénario 4: RDV terminés
  for (let i = 0; i < 10; i++) {
    const patient = PATIENTS[i % PATIENTS.length];
    const medecin = MEDECINS[i % MEDECINS.length];
    const dateRdv = getRandomDate(-(Math.floor(Math.random() * 30) + 8)); // 8-38 jours dans le passé
    const heureDebut = `${9 + (i % 8)}:${i % 2 === 0 ? '00' : '30'}`;
    
    rendezVous.push({
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
      observations: `Consultation terminée. Patient ${patient.prenom} ${patient.nom} examiné pour ${MOTIFS[i % MOTIFS.length].toLowerCase()}. État général satisfaisant.`,
      ordonnance: i % 3 === 0 ? 'Paracétamol 1g - 3 fois par jour pendant 5 jours' : undefined,
      analyses_demandees: i % 4 === 0 ? 'Bilan sanguin complet, glycémie à jeun' : undefined,
      notes: 'Consultation terminée avec succès',
      historique_modifications: [
        {
          date: new Date(dateRdv.getTime() - 5 * 24 * 60 * 60 * 1000),
          action: 'creation',
          utilisateur_id: patient.id,
          motif_modification: 'Demande créée'
        },
        {
          date: new Date(dateRdv.getTime() - 4 * 24 * 60 * 60 * 1000),
          action: 'confirmation',
          utilisateur_id: 'secretaire_test',
          motif_modification: 'Confirmé'
        },
        {
          date: new Date(dateRdv.getTime() + 30 * 60 * 1000), // 30 min après le RDV
          action: 'terminaison',
          utilisateur_id: medecin.id,
          motif_modification: 'Consultation terminée'
        }
      ]
    });
  }

  // Scénario 5: RDV reportés
  for (let i = 0; i < 3; i++) {
    const patient = PATIENTS[i % PATIENTS.length];
    const medecin = MEDECINS[i % MEDECINS.length];
    const dateRdv = getRandomDate(Math.floor(Math.random() * 10) + 5); // 5-15 jours dans le futur
    const heureDebut = `${13 + i}:${i % 2 === 0 ? '00' : '30'}`;
    
    rendezVous.push({
      patient_id: patient.id,
      etablissement_id: ETABLISSEMENT_ID,
      medecin_id: medecin.id,
      date_rdv: Timestamp.fromDate(dateRdv),
      heure_debut: heureDebut,
      heure_fin: getEndTime(heureDebut),
      motif: MOTIFS[(i + 6) % MOTIFS.length],
      type: TYPES[i % TYPES.length],
      statut: 'reportee',
      date_creation: Timestamp.fromDate(new Date(Date.now() - (i + 8) * 24 * 60 * 60 * 1000)),
      notes: 'Rendez-vous reporté à la demande du patient/médecin',
      historique_modifications: [
        {
          date: new Date(Date.now() - (i + 8) * 24 * 60 * 60 * 1000),
          action: 'creation',
          utilisateur_id: patient.id,
          motif_modification: 'Demande créée'
        },
        {
          date: new Date(Date.now() - (i + 7) * 24 * 60 * 60 * 1000),
          action: 'confirmation',
          utilisateur_id: 'secretaire_test',
          motif_modification: 'Confirmé'
        },
        {
          date: new Date(Date.now() - (i + 2) * 24 * 60 * 60 * 1000),
          action: 'report',
          utilisateur_id: 'secretaire_test',
          motif_modification: 'Report demandé pour conflit d\'horaire'
        }
      ]
    });
  }

  // Scénario 6: RDV annulés
  for (let i = 0; i < 4; i++) {
    const patient = PATIENTS[i % PATIENTS.length];
    const medecin = i % 2 === 0 ? MEDECINS[0] : null; // Certains annulés avant attribution
    const dateRdv = getRandomDate(Math.floor(Math.random() * 20) + 1);
    const heureDebut = `${11 + i}:${i % 2 === 0 ? '00' : '30'}`;
    
    rendezVous.push({
      patient_id: patient.id,
      etablissement_id: ETABLISSEMENT_ID,
      medecin_id: medecin?.id || null,
      date_rdv: Timestamp.fromDate(dateRdv),
      heure_debut: heureDebut,
      heure_fin: getEndTime(heureDebut),
      motif: MOTIFS[(i + 2) % MOTIFS.length],
      type: TYPES[i % TYPES.length],
      statut: 'annulee',
      date_creation: Timestamp.fromDate(new Date(Date.now() - (i + 5) * 24 * 60 * 60 * 1000)),
      notes: 'Rendez-vous annulé',
      historique_modifications: [
        {
          date: new Date(Date.now() - (i + 5) * 24 * 60 * 60 * 1000),
          action: 'creation',
          utilisateur_id: patient.id,
          motif_modification: 'Demande créée'
        },
        ...(medecin ? [{
          date: new Date(Date.now() - (i + 4) * 24 * 60 * 60 * 1000),
          action: 'confirmation',
          utilisateur_id: 'secretaire_test',
          motif_modification: 'Confirmé'
        }] : []),
        {
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          action: 'annulation',
          utilisateur_id: patient.id,
          motif_modification: 'Annulation demandée par le patient'
        }
      ]
    });
  }

  return rendezVous;
};

// Fonction principale pour seed la base de données
const seedRendezVous = async () => {
  try {
    console.log('🌱 Début du seeding des rendez-vous...');

    const rendezVousList = generateTestRendezVous();
    console.log(`📅 Génération de ${rendezVousList.length} rendez-vous de test...`);

    // Utiliser batch pour optimiser les écritures
    const batchSize = 500; // Limite de Firestore
    const batches = [];
    
    for (let i = 0; i < rendezVousList.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchItems = rendezVousList.slice(i, i + batchSize);
      
      batchItems.forEach((rdv) => {
        const docRef = doc(collection(db, 'rendez_vous'));
        batch.set(docRef, rdv);
      });
      
      batches.push(batch);
    }

    // Exécuter tous les batches
    await Promise.all(batches.map(batch => batch.commit()));

    console.log('✅ Seeding terminé avec succès !');
    console.log('\n📊 Récapitulatif des rendez-vous créés :');
    
    const stats = {
      en_attente: rendezVousList.filter(r => r.statut === 'en_attente').length,
      confirmee: rendezVousList.filter(r => r.statut === 'confirmee').length,
      terminee: rendezVousList.filter(r => r.statut === 'terminee').length,
      reportee: rendezVousList.filter(r => r.statut === 'reportee').length,
      annulee: rendezVousList.filter(r => r.statut === 'annulee').length,
    };

    Object.entries(stats).forEach(([statut, count]) => {
      console.log(`  - ${statut}: ${count} RDV`);
    });

    console.log('\n🎯 Scénarios de test disponibles :');
    console.log('  - RDV en attente de confirmation par secrétaire');
    console.log('  - RDV confirmés futurs');
    console.log('  - RDV passés confirmés (à finaliser par médecin)');
    console.log('  - RDV terminés avec historique complet');
    console.log('  - RDV reportés avec historique');
    console.log('  - RDV annulés (avec et sans médecin attribué)');

    console.log('\n👥 Données utilisées :');
    console.log(`  - Établissement: ${ETABLISSEMENT_ID} (Clinique La Sagesse)`);
    console.log(`  - Médecins: ${MEDECINS.map(m => m.nom).join(', ')}`);
    console.log(`  - Patients: ${PATIENTS.map(p => `${p.prenom} ${p.nom} (${p.id})`).join(', ')}`);

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    throw error;
  }
};

// Exécuter le script si appelé directement
if (require.main === module) {
  seedRendezVous()
    .then(() => {
      console.log('\n🎉 Script de seeding terminé !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erreur fatale:', error);
      process.exit(1);
    });
}

export { seedRendezVous };