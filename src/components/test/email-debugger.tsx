'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  RefreshCw,
  Settings,
  Code,
  Eye,
  Copy,
  TestTube
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge } from '@/components/ui';
import { EmailServiceV2 } from '@/lib/email/email-service-v2';
import { EMAIL_CONFIG, isEmailConfigured } from '@/lib/email/email-config';
import toast from 'react-hot-toast';

export const EmailDebugger: React.FC = () => {
  const [testEmail, setTestEmail] = useState('');
  const [debugEmails, setDebugEmails] = useState<any[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [configStatus, setConfigStatus] = useState({
    provider: EMAIL_CONFIG.PROVIDER,
    configured: false,
    details: {} as any
  });

  useEffect(() => {
    // Charger la configuration
    checkConfiguration();
    // Charger les emails de debug
    loadDebugEmails();
  }, []);

  const checkConfiguration = () => {
    const configured = isEmailConfigured();
    const details: any = {
      provider: EMAIL_CONFIG.PROVIDER
    };

    if (EMAIL_CONFIG.PROVIDER === 'emailjs') {
      details.serviceId = EMAIL_CONFIG.EMAILJS.SERVICE_ID ? '✅ Configuré' : '❌ Manquant';
      details.templateId = EMAIL_CONFIG.EMAILJS.TEMPLATE_ID ? '✅ Configuré' : '❌ Manquant';
      details.publicKey = EMAIL_CONFIG.EMAILJS.PUBLIC_KEY ? '✅ Configuré' : '❌ Manquant';
    } else if (EMAIL_CONFIG.PROVIDER === 'api') {
      details.endpoint = EMAIL_CONFIG.API.ENDPOINT;
    }

    setConfigStatus({
      provider: EMAIL_CONFIG.PROVIDER,
      configured,
      details
    });
  };

  const loadDebugEmails = () => {
    const emails = EmailServiceV2.getDebugEmails();
    setDebugEmails(emails.reverse()); // Plus récents en premier
  };

  const clearDebugEmails = () => {
    EmailServiceV2.clearDebugEmails();
    setDebugEmails([]);
    toast.success('Historique des emails effacé');
  };

  const testConfiguration = async () => {
    setIsLoading(true);
    try {
      const result = await EmailServiceV2.testConfiguration();
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error('Test échoué');
      }
      
      // Recharger les emails de debug
      setTimeout(loadDebugEmails, 500);
    } catch (error) {
      toast.error('Erreur lors du test');
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestEmail = async (type: 'welcome' | 'validation' | 'rejection' | 'admin') => {
    if (!testEmail) {
      toast.error('Veuillez entrer une adresse email de test');
      return;
    }

    setIsLoading(true);
    try {
      let result;
      
      switch (type) {
        case 'welcome':
          result = await EmailServiceV2.sendWelcomeEmail({
            email: testEmail,
            name: 'Dr. Test',
            password: 'TempPass123!',
            etablissement: 'Clinique Test'
          });
          break;
          
        case 'validation':
          result = await EmailServiceV2.sendValidationEmail({
            email: testEmail,
            name: 'Test Secrétaire',
            etablissement: 'Hôpital Test',
            status: 'approved'
          });
          break;
          
        case 'rejection':
          result = await EmailServiceV2.sendValidationEmail({
            email: testEmail,
            name: 'Test Secrétaire',
            etablissement: 'Hôpital Test',
            status: 'rejected',
            reason: 'Documents manquants'
          });
          break;
          
        case 'admin':
          result = await EmailServiceV2.sendAdminNotification({
            secretaryName: 'Test Secrétaire',
            etablissementName: 'Clinique Test',
            etablissementType: 'Clinique',
            ville: 'Dakar',
            region: 'Dakar'
          });
          break;
      }
      
      if (result?.success) {
        toast.success(`Email de type "${type}" envoyé avec succès`);
        setTimeout(loadDebugEmails, 500);
      } else {
        toast.error('Échec de l\'envoi');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié dans le presse-papier');
  };

  const getProviderBadge = () => {
    const colors = {
      emailjs: 'primary',
      api: 'secondary',
      console: 'warning'
    } as const;
    
    return (
      <Badge variant={colors[EMAIL_CONFIG.PROVIDER as keyof typeof colors] || 'default'}>
        {EMAIL_CONFIG.PROVIDER.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Configuration Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="w-5 h-5" />
              <CardTitle>Configuration Email</CardTitle>
            </div>
            {getProviderBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                {configStatus.configured ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span className="font-medium">
                  {configStatus.configured ? 'Configuration valide' : 'Configuration incomplète'}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={testConfiguration}
                loading={isLoading}
              >
                <TestTube className="w-4 h-4 mr-2" />
                Tester
              </Button>
            </div>

            {/* Détails de configuration */}
            {Object.entries(configStatus.details).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground capitalize">{key}:</span>
                <span className="font-mono">{String(value)}</span>
              </div>
            ))}

            {/* Instructions */}
            {!configStatus.configured && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                      Configuration requise
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                      Les emails sont actuellement en mode console (debug).
                      Configurez les variables d'environnement pour activer l'envoi réel.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test d'envoi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Send className="w-5 h-5" />
            <span>Test d'envoi d'emails</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              type="email"
              placeholder="Email de test (ex: test@example.com)"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => sendTestEmail('welcome')}
                disabled={isLoading || !testEmail}
              >
                Bienvenue
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => sendTestEmail('validation')}
                disabled={isLoading || !testEmail}
              >
                Validation
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => sendTestEmail('rejection')}
                disabled={isLoading || !testEmail}
              >
                Refus
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => sendTestEmail('admin')}
                disabled={isLoading}
              >
                Admin
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historique des emails */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Mail className="w-5 h-5" />
              <span>Historique des emails ({debugEmails.length})</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={loadDebugEmails}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearDebugEmails}
                disabled={debugEmails.length === 0}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {debugEmails.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun email dans l'historique
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {debugEmails.map((email, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => setSelectedEmail(email)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium truncate">
                          {email.to}
                        </span>
                        {email.template && (
                          <Badge variant="secondary" className="text-xs">
                            {email.template}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium mt-1">{email.subject}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(email.timestamp).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(JSON.stringify(email, null, 2));
                        }}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEmail(email);
                        }}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de détail */}
      {selectedEmail && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedEmail(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-background rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Détails de l'email</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedEmail(null)}
              >
                ✕
              </Button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-8rem)]">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">To:</label>
                  <p className="font-mono text-sm">{selectedEmail.to}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Subject:</label>
                  <p className="font-mono text-sm">{selectedEmail.subject}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Message:</label>
                  <pre className="bg-muted p-3 rounded-lg text-sm whitespace-pre-wrap">
                    {selectedEmail.message}
                  </pre>
                </div>
                {selectedEmail.data && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data:</label>
                    <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
                      {JSON.stringify(selectedEmail.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => {
                  copyToClipboard(JSON.stringify(selectedEmail, null, 2));
                  setSelectedEmail(null);
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copier les détails
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};