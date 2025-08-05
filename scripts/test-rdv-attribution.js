#!/usr/bin/env node

/**
 * Script pour tester l'attribution de médecin sans erreurs undefined
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  updateDoc,
  serverTimestamp,
  query,
  where,
  limit
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

// Fonction utilitaire pour nettoyer les valeurs undefined
const cleanUndefinedFields = (obj) => {
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

async function testRdvAttribution() {
  console.log('🧪 TEST D\'ATTRIBUTION DE MÉDECIN');
  console.log('=================================\n');

  try {
    // 1. Récupérer un RDV en attente
    console.log('📋 Recherche d\'un RDV en attente...');
    const rdvQuery = query(
      collection(db, 'rendez_vous'),
      where('statut', '==', 'en_attente'),
      limit(1)
    );
    
    const rdvSnapshot = await getDocs(rdvQuery);
    
    if (rdvSnapshot.empty) {
      console.log('❌ Aucun RDV en attente trouvé. Créez d\'abord un RDV de test.');
      return;
    }

    const rdvDoc = rdvSnapshot.docs[0];
    const rdvData = rdvDoc.data();
    const rdvId = rdvDoc.id;

    console.log(`   ✓ RDV trouvé: ${rdvId}`);
    console.log(`   • Motif: ${rdvData.motif}`);
    console.log(`   • Statut: ${rdvData.statut}`);

    // 2. Récupérer un médecin
    console.log('\n👨‍⚕️ Recherche d\'un médecin...');
    const medecinQuery = query(
      collection(db, 'users'),
      where('role', '==', 'medecin'),
      where('actif', '==', true),
      limit(1)
    );
    
    const medecinSnapshot = await getDocs(medecinQuery);
    
    if (medecinSnapshot.empty) {
      console.log('❌ Aucun médecin trouvé');
      return;
    }

    const medecinDoc = medecinSnapshot.docs[0];
    const medecinData = medecinDoc.data();
    const medecinId = medecinDoc.id;

    console.log(`   ✓ Médecin trouvé: Dr. ${medecinData.prenom} ${medecinData.nom}`);

    // 3. Test d'attribution avec notes_secretaire undefined
    console.log('\n🔄 Test d\'attribution (avec notes_secretaire undefined)...');
    
    const updateData = cleanUndefinedFields({
      medecin_id: medecinId,
      statut: 'confirmee',
      notes_secretaire: undefined, // Volontairement undefined pour tester
      date_modification: serverTimestamp(),
      historique_modifications: [
        ...(rdvData.historique_modifications || []),
        {
          date: new Date(),
          action: 'confirmation',
          nouveau_medecin_id: medecinId,
          modifie_par: 'test_script',
          motif_modification: 'Test attribution sans erreur undefined'
        }
      ]
    });

    console.log('   • Données nettoyées (undefined supprimé):', Object.keys(updateData));

    const rdvRef = doc(db, 'rendez_vous', rdvId);
    await updateDoc(rdvRef, updateData);

    console.log('   ✅ Attribution réussie sans erreur !');

    // 4. Test d'attribution avec notes_secretaire définie
    console.log('\n🔄 Test d\'attribution (avec notes_secretaire définie)...');
    
    const updateData2 = cleanUndefinedFields({
      notes_secretaire: 'Test avec note secrétaire',
      date_modification: serverTimestamp(),
      historique_modifications: [
        ...(updateData.historique_modifications || []),
        {
          date: new Date(),
          action: 'modification',
          modifie_par: 'test_script',
          motif_modification: 'Ajout note secrétaire'
        }
      ]
    });

    await updateDoc(rdvRef, updateData2);
    console.log('   ✅ Mise à jour avec notes réussie !');

    console.log('\n🎉 Tous les tests passent ! Le problème undefined est résolu.');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    
    if (error.message.includes('undefined')) {
      console.log('\n💡 Solution:');
      console.log('   • Utilisez cleanUndefinedFields() avant updateDoc()');
      console.log('   • Vérifiez que tous les champs optionnels sont nettoyés');
    }
  }
}

// Fonction pour nettoyer un RDV spécifique
async function cleanSpecificRdv(rdvId) {
  console.log(`🧹 NETTOYAGE DU RDV: ${rdvId}`);
  console.log('=============================\n');

  try {
    const rdvRef = doc(db, 'rendez_vous', rdvId);
    const rdvDoc = await getDoc(rdvRef);
    
    if (!rdvDoc.exists()) {
      console.log('❌ RDV non trouvé');
      return;
    }

    const currentData = rdvDoc.data();
    console.log('📊 Données actuelles:', Object.keys(currentData));

    // Nettoyer tous les champs undefined
    const cleanedData = cleanUndefinedFields(currentData);
    console.log('🧽 Données nettoyées:', Object.keys(cleanedData));

    // Mise à jour avec les données nettoyées
    await updateDoc(rdvRef, {
      ...cleanedData,
      date_modification: serverTimestamp()
    });

    console.log('✅ RDV nettoyé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  }
}

// Mode d'exécution
const mode = process.argv[2] || 'test';
const rdvId = process.argv[3];

if (mode === 'clean' && rdvId) {
  cleanSpecificRdv(rdvId);
} else if (mode === 'test') {
  testRdvAttribution();
} else {
  console.log('Usage:');
  console.log('  node test-rdv-attribution.js test           # Tester l\'attribution');
  console.log('  node test-rdv-attribution.js clean <rdv-id> # Nettoyer un RDV spécifique');
}