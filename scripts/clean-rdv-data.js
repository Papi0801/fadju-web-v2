#!/usr/bin/env node

/**
 * Script pour nettoyer les données de rendez-vous incohérentes
 * Usage: node scripts/clean-rdv-data.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc, writeBatch } = require('firebase/firestore');

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

const cleanRdvData = async () => {
  try {
    console.log('🧹 NETTOYAGE DES DONNÉES RENDEZ-VOUS');
    console.log('======================================\n');

    // Récupérer tous les rendez-vous
    const rdvSnapshot = await getDocs(collection(db, 'rendez_vous'));
    const allRdv = rdvSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`📊 Total des RDV trouvés: ${allRdv.length}`);

    let problematiques = 0;
    let corriges = 0;
    let supprimes = 0;

    const batch = writeBatch(db);

    for (const rdv of allRdv) {
      let hasIssues = false;
      let shouldDelete = false;
      const updates = {};

      // Vérifier la propriété date
      if (rdv.date_rendez_vous && !rdv.date_rdv) {
        // Migrer l'ancienne propriété vers la nouvelle
        updates.date_rdv = rdv.date_rendez_vous;
        hasIssues = true;
        console.log(`📅 Migration date pour RDV ${rdv.id}`);
      }

      if (!rdv.date_rdv && !rdv.date_rendez_vous) {
        // RDV sans date - à supprimer
        shouldDelete = true;
        hasIssues = true;
        console.log(`❌ RDV ${rdv.id} sans date - suppression`);
      }

      // Vérifier les statuts incohérents
      if (rdv.statut) {
        const validStatuts = ['en_attente', 'confirmee', 'annulee', 'reportee', 'terminee'];
        if (!validStatuts.includes(rdv.statut)) {
          // Corriger les anciens statuts
          if (rdv.statut === 'confirme') updates.statut = 'confirmee';
          else if (rdv.statut === 'termine') updates.statut = 'terminee';
          else if (rdv.statut === 'annule') updates.statut = 'annulee';
          else {
            updates.statut = 'en_attente'; // Par défaut
          }
          hasIssues = true;
          console.log(`🔧 Correction statut ${rdv.statut} → ${updates.statut} pour RDV ${rdv.id}`);
        }
      }

      // Vérifier les IDs manquants
      if (!rdv.patient_id) {
        shouldDelete = true;
        hasIssues = true;
        console.log(`❌ RDV ${rdv.id} sans patient_id - suppression`);
      }

      if (!rdv.etablissement_id) {
        // Ajouter l'établissement par défaut
        updates.etablissement_id = 'Xn04Gjm42xgAZ5WPCEoThVKCA3Y2';
        hasIssues = true;
        console.log(`🏥 Ajout etablissement_id par défaut pour RDV ${rdv.id}`);
      }

      // Appliquer les corrections
      if (hasIssues) {
        problematiques++;
        
        if (shouldDelete) {
          batch.delete(doc(db, 'rendez_vous', rdv.id));
          supprimes++;
        } else if (Object.keys(updates).length > 0) {
          batch.update(doc(db, 'rendez_vous', rdv.id), updates);
          corriges++;
        }
      }
    }

    // Exécuter les mises à jour par batch
    if (problematiques > 0) {
      await batch.commit();
      console.log('\n✅ Nettoyage terminé !');
    } else {
      console.log('\n✅ Aucune donnée problématique détectée !');
    }

    console.log('\n📈 RÉSUMÉ:');
    console.log(`   RDV problématiques: ${problematiques}`);
    console.log(`   RDV corrigés: ${corriges}`);
    console.log(`   RDV supprimés: ${supprimes}`);
    console.log(`   RDV sains: ${allRdv.length - problematiques}`);

    process.exit(0);

  } catch (error) {
    console.error('💥 ERREUR:', error);
    process.exit(1);
  }
};

// Démarrage
console.log('🚀 Démarrage du nettoyage...');
cleanRdvData();