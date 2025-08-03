'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Smartphone,
  Monitor,
  Wifi,
  Database,
  Zap,
  Activity,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  collection, 
  addDoc,
  Timestamp,
  query,
  orderBy,
  limit,
  where
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  duration?: number;
  error?: string;
  details?: any;
}

interface SyncTestProps {
  className?: string;
}

export const FirebaseSyncTester: React.FC<SyncTestProps> = ({ className }) => {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Connexion Firebase', status: 'pending' },
    { name: 'Test Écriture/Lecture', status: 'pending' },
    { name: 'Synchronisation Temps Réel', status: 'pending' },
    { name: 'Performance (Latence)', status: 'pending' },
    { name: 'Simulation Mobile', status: 'pending' },
    { name: 'Test Rendez-vous', status: 'pending' },
    { name: 'Test Notifications', status: 'pending' },
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [globalStats, setGlobalStats] = useState({
    totalTests: 0,
    passed: 0,
    failed: 0,
    avgLatency: 0
  });

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => 
      i === index ? { ...test, ...updates } : test
    ));
  };

  // Test 1: Connexion Firebase
  const testFirebaseConnection = async (testIndex: number) => {
    updateTest(testIndex, { status: 'running' });
    const startTime = Date.now();

    try {
      // Test de lecture d'un document
      const testDoc = await getDoc(doc(db, 'test', 'connection'));
      
      // Test d'écriture
      await setDoc(doc(db, 'test', 'connection'), {
        timestamp: Timestamp.now(),
        source: 'web-test',
        test_id: startTime
      });

      const duration = Date.now() - startTime;
      updateTest(testIndex, { 
        status: 'success', 
        duration,
        details: { readable: true, writable: true }
      });
    } catch (error: any) {
      updateTest(testIndex, { 
        status: 'error', 
        error: error.message,
        duration: Date.now() - startTime
      });
    }
  };

  // Test 2: Écriture/Lecture
  const testReadWrite = async (testIndex: number) => {
    updateTest(testIndex, { status: 'running' });
    const startTime = Date.now();

    try {
      const testData = {
        message: 'Test Web-Mobile Sync',
        timestamp: Timestamp.now(),
        platform: 'web',
        test_id: `test_${Date.now()}`
      };

      // Écriture
      const docRef = await addDoc(collection(db, 'sync_tests'), testData);
      
      // Lecture pour vérifier
      const savedDoc = await getDoc(docRef);
      const savedData = savedDoc.data();

      const success = savedData?.message === testData.message;
      const duration = Date.now() - startTime;

      updateTest(testIndex, {
        status: success ? 'success' : 'error',
        duration,
        details: { docId: docRef.id, dataMatch: success }
      });
    } catch (error: any) {
      updateTest(testIndex, {
        status: 'error',
        error: error.message,
        duration: Date.now() - startTime
      });
    }
  };

  // Test 3: Synchronisation Temps Réel
  const testRealtimeSync = async (testIndex: number) => {
    updateTest(testIndex, { status: 'running' });
    const startTime = Date.now();

    try {
      const testId = `realtime_${Date.now()}`;
      let syncReceived = false;

      // Écouter les changements
      const unsubscribe = onSnapshot(
        doc(db, 'sync_tests', testId),
        (doc) => {
          if (doc.exists() && !syncReceived) {
            syncReceived = true;
            const duration = Date.now() - startTime;
            
            updateTest(testIndex, {
              status: 'success',
              duration,
              details: { syncLatency: duration, realTimeData: doc.data() }
            });
            
            unsubscribe();
          }
        },
        (error) => {
          updateTest(testIndex, {
            status: 'error',
            error: error.message,
            duration: Date.now() - startTime
          });
          unsubscribe();
        }
      );

      // Écrire le document pour déclencher la sync
      setTimeout(async () => {
        await setDoc(doc(db, 'sync_tests', testId), {
          message: 'Realtime sync test',
          timestamp: Timestamp.now(),
          test_type: 'realtime'
        });
      }, 100);

      // Timeout après 5 secondes
      setTimeout(() => {
        if (!syncReceived) {
          updateTest(testIndex, {
            status: 'error',
            error: 'Timeout - Pas de synchronisation reçue',
            duration: Date.now() - startTime
          });
          unsubscribe();
        }
      }, 5000);

    } catch (error: any) {
      updateTest(testIndex, {
        status: 'error',
        error: error.message,
        duration: Date.now() - startTime
      });
    }
  };

  // Test 4: Performance (Latence)
  const testPerformance = async (testIndex: number) => {
    updateTest(testIndex, { status: 'running' });
    const iterations = 5;
    const latencies: number[] = [];

    try {
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        await setDoc(doc(db, 'performance_tests', `test_${i}`), {
          iteration: i,
          timestamp: Timestamp.now()
        });
        
        const latency = Date.now() - startTime;
        latencies.push(latency);
      }

      const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);
      const minLatency = Math.min(...latencies);

      updateTest(testIndex, {
        status: avgLatency < 1000 ? 'success' : 'error',
        duration: avgLatency,
        details: {
          avgLatency: Math.round(avgLatency),
          maxLatency,
          minLatency,
          iterations
        }
      });

      // Mettre à jour les stats globales
      setGlobalStats(prev => ({ ...prev, avgLatency: Math.round(avgLatency) }));

    } catch (error: any) {
      updateTest(testIndex, {
        status: 'error',
        error: error.message
      });
    }
  };

  // Test 5: Simulation Mobile
  const testMobileSimulation = async (testIndex: number) => {
    updateTest(testIndex, { status: 'running' });
    const startTime = Date.now();

    try {
      // Simuler un scénario mobile typique
      const mobileData = {
        device_type: 'mobile_simulation',
        user_agent: 'Fadju Mobile App v1.0',
        platform: 'iOS/Android',
        timestamp: Timestamp.now(),
        test_scenario: 'patient_booking'
      };

      // Créer un rendez-vous depuis "mobile"
      const rdvRef = await addDoc(collection(db, 'rendez_vous_test'), {
        patient_id: 'test_patient_001',
        medecin_id: 'test_medecin_001',
        etablissement_id: 'test_etablissement_001',
        date_rendez_vous: Timestamp.now(),
        statut: 'programme',
        motif: 'Consultation test mobile',
        cree_par: 'mobile',
        ...mobileData
      });

      // Vérifier depuis "web"
      const rdvDoc = await getDoc(rdvRef);
      const rdvData = rdvDoc.data();

      const duration = Date.now() - startTime;
      updateTest(testIndex, {
        status: rdvData?.cree_par === 'mobile' ? 'success' : 'error',
        duration,
        details: {
          rdvId: rdvRef.id,
          mobileToWeb: true,
          dataIntegrity: !!rdvData
        }
      });

    } catch (error: any) {
      updateTest(testIndex, {
        status: 'error',
        error: error.message,
        duration: Date.now() - startTime
      });
    }
  };

  // Test 6: Test Rendez-vous Complet
  const testRendezVousWorkflow = async (testIndex: number) => {
    updateTest(testIndex, { status: 'running' });
    const startTime = Date.now();

    try {
      // 1. Créer RDV (Web - Secrétaire)
      const rdvRef = await addDoc(collection(db, 'rendez_vous_test'), {
        patient_id: 'test_patient_002',
        medecin_id: 'test_medecin_002',
        etablissement_id: 'test_etablissement_002',
        date_rendez_vous: Timestamp.now(),
        statut: 'programme',
        motif: 'Test workflow complet',
        cree_par: 'web',
        notes_secretaire: 'RDV créé pour test'
      });

      // 2. Simuler confirmation (Mobile - Patient)
      await setDoc(rdvRef, {
        statut: 'confirme',
        confirmation_patient: true,
        date_confirmation: Timestamp.now()
      }, { merge: true });

      // 3. Simuler début consultation (Web - Médecin)
      await setDoc(rdvRef, {
        statut: 'en_cours',
        heure_debut_reel: Timestamp.now(),
        notes_medecin: 'Consultation démarrée'
      }, { merge: true });

      // Vérifier l'état final
      const finalDoc = await getDoc(rdvRef);
      const finalData = finalDoc.data();

      const duration = Date.now() - startTime;
      const success = finalData?.statut === 'en_cours' && 
                     finalData?.confirmation_patient === true;

      updateTest(testIndex, {
        status: success ? 'success' : 'error',
        duration,
        details: {
          workflowSteps: 3,
          finalStatus: finalData?.statut,
          confirmed: finalData?.confirmation_patient
        }
      });

    } catch (error: any) {
      updateTest(testIndex, {
        status: 'error',
        error: error.message,
        duration: Date.now() - startTime
      });
    }
  };

  // Test 7: Test Notifications
  const testNotifications = async (testIndex: number) => {
    updateTest(testIndex, { status: 'running' });
    const startTime = Date.now();

    try {
      // Simuler création d'une notification
      const notifRef = await addDoc(collection(db, 'notifications_test'), {
        user_id: 'test_patient_003',
        type: 'rendez_vous_confirme',
        title: 'Rendez-vous confirmé',
        message: 'Votre rendez-vous du 15/01/2025 à 14h00 est confirmé',
        timestamp: Timestamp.now(),
        lu: false,
        source: 'web_to_mobile_test'
      });

      // Vérifier que la notification est créée
      const notifDoc = await getDoc(notifRef);
      const notifData = notifDoc.data();

      const duration = Date.now() - startTime;
      updateTest(testIndex, {
        status: notifData ? 'success' : 'error',
        duration,
        details: {
          notifId: notifRef.id,
          notificationType: notifData?.type,
          created: !!notifData
        }
      });

    } catch (error: any) {
      updateTest(testIndex, {
        status: 'error',
        error: error.message,
        duration: Date.now() - startTime
      });
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    
    // Reset tous les tests
    setTests(prev => prev.map(test => ({ ...test, status: 'pending' as const })));

    const testFunctions = [
      testFirebaseConnection,
      testReadWrite,
      testRealtimeSync,
      testPerformance,
      testMobileSimulation,
      testRendezVousWorkflow,
      testNotifications
    ];

    // Exécuter les tests séquentiellement
    for (let i = 0; i < testFunctions.length; i++) {
      await testFunctions[i](i);
      // Petite pause entre les tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Calculer les stats finales
    const finalTests = tests;
    const passed = finalTests.filter(t => t.status === 'success').length;
    const failed = finalTests.filter(t => t.status === 'error').length;
    
    setGlobalStats(prev => ({
      ...prev,
      totalTests: finalTests.length,
      passed,
      failed
    }));

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className={className}>
      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>Test Synchronisation Web-Mobile Firebase</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Vérification de l'interconnexion entre la plateforme web et l'application mobile
                </p>
              </div>
            </div>
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>{isRunning ? 'Tests en cours...' : 'Lancer tous les tests'}</span>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tests</p>
                <p className="text-2xl font-bold">{globalStats.totalTests || tests.length}</p>
              </div>
              <Database className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Réussis</p>
                <p className="text-2xl font-bold text-green-600">{globalStats.passed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Échecs</p>
                <p className="text-2xl font-bold text-red-600">{globalStats.failed}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Latence Moy.</p>
                <p className="text-2xl font-bold">{globalStats.avgLatency}ms</p>
              </div>
              <Zap className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tests */}
      <div className="space-y-4">
        {tests.map((test, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`transition-all duration-200 ${getStatusColor(test.status)}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <h3 className="font-medium">{test.name}</h3>
                      {test.duration && (
                        <p className="text-sm text-muted-foreground">
                          Durée: {test.duration}ms
                        </p>
                      )}
                      {test.error && (
                        <p className="text-sm text-red-600 mt-1">
                          Erreur: {test.error}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {test.status === 'success' && test.details && (
                      <Badge variant="secondary" className="text-xs">
                        {Object.keys(test.details).length} détails
                      </Badge>
                    )}
                    
                    {index < 2 && <Monitor className="w-4 h-4 text-gray-400" />}
                    {index >= 2 && index < 5 && <Wifi className="w-4 h-4 text-gray-400" />}
                    {index >= 5 && <Smartphone className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {/* Détails du test */}
                {test.details && test.status === 'success' && (
                  <div className="mt-3 p-3 bg-white/50 rounded-lg">
                    <p className="text-xs font-medium text-gray-600 mb-2">Détails:</p>
                    <pre className="text-xs text-gray-700 overflow-x-auto">
                      {JSON.stringify(test.details, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Instructions */}
      <Card className="mt-6 border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800">Instructions de Test</h4>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• Les tests simulent l'interaction entre la plateforme web et l'application mobile</li>
                <li>• Vérifiez que Firebase est correctement configuré avec les mêmes credentials</li>
                <li>• La latence doit être inférieure à 1000ms pour une bonne UX</li>
                <li>• Tous les tests doivent passer pour garantir la synchronisation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};