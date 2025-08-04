#!/usr/bin/env node

/**
 * Script pour exécuter le seeding des rendez-vous
 * Usage: npm run seed:rdv
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Démarrage du script de seeding des rendez-vous...\n');

try {
  // Compiler et exécuter le script TypeScript
  const scriptPath = path.join(__dirname, 'seed-rendez-vous.ts');
  
  console.log('📦 Compilation du script TypeScript...');
  execSync(`npx tsx "${scriptPath}"`, { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
} catch (error) {
  console.error('💥 Erreur lors de l\'exécution du script:', error.message);
  process.exit(1);
}