#!/usr/bin/env node

/**
 * Script pour créer des résultats médicaux de test
 * Usage: node create-test-medical-results.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, Timestamp } = require('firebase/firestore');

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBKekXWGMvWB1jA7FHciZlBJDTb1S3vMrc",
  authDomain: "fadju-6e0a2.firebaseapp.com", 
  projectId: "fadju-6e0a2",
  storageBucket: "fadju-6e0a2.firebasestorage.app",
  messagingSenderId: "19429044846",
  appId: "1:19429044846:web:99078747d2821e1938ec7f"
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

const createTestResults = async () => {
  try {
    console.log('🧪 CRÉATION DE RÉSULTATS MÉDICAUX DE TEST');
    console.log('=========================================\n');

    const resultats = [];

    // Créer des résultats de consultation pour chaque patient
    for (let i = 0; i < PATIENTS.length; i++) {
      const patient = PATIENTS[i];
      const medecin = MEDECINS[i % MEDECINS.length];

      // Consultation récente
      const consultationRecente = {
        patient_id: patient.id,
        medecin_id: medecin.id,
        nom_medecin: medecin.nom,
        rendez_vous_id: `rdv_${patient.id}_recent`,
        date_consultation: Timestamp.fromDate(new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000)),
        date_creation: Timestamp.now(),
        type: 'consultation',
        titre: `Consultation du ${new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}`,
        description: `Consultation médicale générale pour ${patient.prenom} ${patient.nom}`,
        observations: `Patient en bonne santé générale. Pas de symptômes particuliers signalés. Examen clinique normal. Tension artérielle: 12/8. Pouls: 72 bpm. Poids stable.`,
        diagnostic: 'Bilan de santé satisfaisant',
        traitement_prescrit: i % 2 === 0 ? 'Paracétamol 1g en cas de douleur' : null,
        ordonnance: i % 2 === 0 ? 'Paracétamol 1000mg - 1 comprimé 3 fois par jour si besoin' : null,
        statut: 'finalise',
        recommandations: 'Maintenir une alimentation équilibrée et une activité physique régulière.'
      };

      // Analyse de sang (pour certains patients)
      if (i % 2 === 0) {
        const analyseSang = {
          patient_id: patient.id,
          medecin_id: medecin.id,
          nom_medecin: medecin.nom,
          rendez_vous_id: `rdv_${patient.id}_analyse`,
          date_consultation: Timestamp.fromDate(new Date(Date.now() - (i + 2) * 14 * 24 * 60 * 60 * 1000)),
          date_creation: Timestamp.now(),
          type: 'analyse',
          type_analyse: 'Sanguin',
          nom_analyse: 'Bilan sanguin complet',
          titre: `Analyse sanguine - ${new Date(Date.now() - (i + 2) * 14 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}`,
          description: `Résultats de l'analyse sanguine complète pour ${patient.prenom} ${patient.nom}`,
          resultats_analyse: `Hémoglobine: 14.2 g/dl (Normal)\nGlycémie: 0.95 g/l (Normal)\nCholestérol total: 1.85 g/l (Normal)\nTriglycérides: 1.2 g/l (Normal)\nNFS: Normale`,
          interpretation: 'Tous les paramètres analysés sont dans les valeurs normales.',
          observations: 'Résultats satisfaisants. Aucune anomalie détectée.',
          statut: 'finalise',
          recommandations: 'Contrôle à renouveler dans 6 mois.'
        };
        resultats.push(analyseSang);
      }

      // Consultation plus ancienne
      const consultationAncienne = {
        patient_id: patient.id,
        medecin_id: medecin.id,
        nom_medecin: medecin.nom,
        rendez_vous_id: `rdv_${patient.id}_old`,
        date_consultation: Timestamp.fromDate(new Date(Date.now() - (i + 3) * 30 * 24 * 60 * 60 * 1000)),
        date_creation: Timestamp.now(),
        type: 'consultation',
        titre: `Consultation du ${new Date(Date.now() - (i + 3) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}`,
        description: `Consultation de suivi pour ${patient.prenom} ${patient.nom}`,
        observations: `Suivi médical de routine. Patient présente une amélioration depuis la dernière visite. Symptômes précédents en régression.`,
        diagnostic: 'Évolution favorable',
        traitement_prescrit: 'Traitement préventif vitamines',
        ordonnance: 'Vitamine D3 - 1 comprimé par jour pendant 3 mois',
        statut: 'finalise',
        recommandations: 'Continuer le traitement et revenir dans 3 mois.'
      };

      resultats.push(consultationRecente, consultationAncienne);
    }

    // Sauvegarder tous les résultats
    console.log(`📊 Création de ${resultats.length} résultats médicaux...`);
    
    let saved = 0;
    for (const resultat of resultats) {
      try {
        await addDoc(collection(db, 'resultats_medicaux'), resultat);
        saved++;
        console.log(`✅ Résultat créé: ${resultat.titre} (${resultat.type})`);
      } catch (error) {
        console.error(`❌ Erreur pour ${resultat.titre}:`, error.message);
      }
    }

    console.log('\n🎉 CRÉATION TERMINÉE !');
    console.log(`📈 Résultats créés: ${saved}/${resultats.length}`);

    console.log('\n📋 Répartition par patient:');
    PATIENTS.forEach(patient => {
      const patientResults = resultats.filter(r => r.patient_id === patient.id);
      console.log(`   • ${patient.prenom} ${patient.nom}: ${patientResults.length} résultats`);
    });

    console.log('\n📋 Répartition par type:');
    const consultations = resultats.filter(r => r.type === 'consultation').length;
    const analyses = resultats.filter(r => r.type === 'analyse').length;
    console.log(`   • Consultations: ${consultations}`);
    console.log(`   • Analyses: ${analyses}`);

    console.log('\n✨ Les résultats sont maintenant visibles dans l\'historique médical !');
    
    process.exit(0);

  } catch (error) {
    console.error('💥 ERREUR FATALE:', error);
    process.exit(1);
  }
};

console.log('🚀 Démarrage de la création des résultats médicaux...');
createTestResults();