import { EMAIL_CONFIG, isEmailConfigured } from './email-config';

// Types
export interface EmailData {
  to: string;
  toName?: string;
  subject: string;
  message: string;
  template?: 'welcome' | 'validation' | 'rejection' | 'notification';
  data?: Record<string, any>;
}

export interface EmailResult {
  success: boolean;
  message: string;
  provider: string;
  error?: any;
}

/**
 * Service d'email amélioré avec plusieurs providers
 */
export class EmailServiceV2 {
  /**
   * Envoie un email en utilisant le provider configuré
   */
  static async send(emailData: EmailData): Promise<EmailResult> {
    const provider = EMAIL_CONFIG.PROVIDER;
    
    // Si pas de configuration, utiliser console pour debug
    if (!isEmailConfigured()) {
      return this.sendViaConsole(emailData);
    }
    
    switch (provider) {
      case 'emailjs':
        return this.sendViaEmailJS(emailData);
      case 'api':
        return this.sendViaAPI(emailData);
      case 'console':
      default:
        return this.sendViaConsole(emailData);
    }
  }
  
  /**
   * Envoi via EmailJS (client-side)
   */
  private static async sendViaEmailJS(emailData: EmailData): Promise<EmailResult> {
    try {
      // Importer EmailJS dynamiquement
      const emailjs = (await import('@emailjs/browser')).default;
      
      // Initialiser avec la clé publique
      emailjs.init(EMAIL_CONFIG.EMAILJS.PUBLIC_KEY);
      
      // Préparer les paramètres du template
      const templateParams = {
        to_email: emailData.to,
        to_name: emailData.toName || 'Utilisateur',
        from_name: EMAIL_CONFIG.DEFAULT.FROM_NAME,
        subject: emailData.subject,
        message: emailData.message,
        ...emailData.data
      };
      
      // Envoyer l'email
      const result = await emailjs.send(
        EMAIL_CONFIG.EMAILJS.SERVICE_ID,
        EMAIL_CONFIG.EMAILJS.TEMPLATE_ID,
        templateParams
      );
      
      if (result.status === 200) {
        return {
          success: true,
          message: 'Email envoyé avec succès via EmailJS',
          provider: 'emailjs'
        };
      } else {
        throw new Error(`EmailJS erreur: ${result.status}`);
      }
    } catch (error) {
      console.error('Erreur EmailJS:', error);
      
      // Fallback vers console en cas d'erreur
      console.warn('EmailJS a échoué, utilisation de la console comme fallback');
      return this.sendViaConsole(emailData);
    }
  }
  
  /**
   * Envoi via API Route (server-side)
   */
  private static async sendViaAPI(emailData: EmailData): Promise<EmailResult> {
    try {
      const response = await fetch(EMAIL_CONFIG.API.ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...emailData,
          from: EMAIL_CONFIG.DEFAULT.FROM_EMAIL
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          message: 'Email envoyé avec succès via API',
          provider: 'api'
        };
      } else {
        throw new Error(result.error || 'API email erreur');
      }
    } catch (error) {
      console.error('Erreur API email:', error);
      
      // Fallback vers console
      return this.sendViaConsole(emailData);
    }
  }
  
  /**
   * Affichage dans la console (pour debug/développement)
   */
  private static async sendViaConsole(emailData: EmailData): Promise<EmailResult> {
    const timestamp = new Date().toISOString();
    
    console.log('📧 =================== EMAIL DEBUG ===================');
    console.log(`📅 Timestamp: ${timestamp}`);
    console.log(`📬 To: ${emailData.to} ${emailData.toName ? `(${emailData.toName})` : ''}`);
    console.log(`📋 Subject: ${emailData.subject}`);
    console.log(`📝 Message:`);
    console.log(emailData.message);
    
    if (emailData.data) {
      console.log(`📎 Data:`, emailData.data);
    }
    console.log('=====================================================\n');
    
    // Stocker dans localStorage pour debug
    if (typeof window !== 'undefined') {
      const emails = JSON.parse(localStorage.getItem('debug_emails') || '[]');
      emails.push({
        timestamp,
        ...emailData
      });
      
      // Garder seulement les 50 derniers emails
      if (emails.length > 50) {
        emails.shift();
      }
      
      localStorage.setItem('debug_emails', JSON.stringify(emails));
    }
    
    return {
      success: true,
      message: 'Email affiché dans la console (mode debug)',
      provider: 'console'
    };
  }
  
  /**
   * Méthodes spécifiques pour chaque type d'email
   */
  
  // Email de bienvenue pour médecin
  static async sendWelcomeEmail(params: {
    email: string;
    name: string;
    password: string;
    etablissement: string;
  }): Promise<EmailResult> {
    const message = `
Bonjour Dr. ${params.name},

Votre compte médecin a été créé avec succès sur la plateforme Fadju.

Vos identifiants de connexion :
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email : ${params.email}
🔐 Mot de passe : ${params.password}
🏥 Établissement : ${params.etablissement}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ IMPORTANT : Vous devrez changer ce mot de passe lors de votre première connexion.

Pour vous connecter :
1. Rendez-vous sur : ${typeof window !== 'undefined' ? window.location.origin : 'https://fadju.sn'}/auth/login
2. Utilisez vos identifiants ci-dessus
3. Suivez les instructions pour changer votre mot de passe

Cordialement,
L'équipe Fadju
    `.trim();
    
    return this.send({
      to: params.email,
      toName: params.name,
      subject: '🎉 Bienvenue sur Fadju - Vos identifiants de connexion',
      message,
      template: 'welcome',
      data: {
        doctor_email: params.email,
        doctor_password: params.password,
        doctor_name: params.name,
        etablissement_name: params.etablissement,
        login_url: `${typeof window !== 'undefined' ? window.location.origin : 'https://fadju.sn'}/auth/login`
      }
    });
  }
  
  // Notification de validation d'établissement
  static async sendValidationEmail(params: {
    email: string;
    name: string;
    etablissement: string;
    status: 'approved' | 'rejected';
    reason?: string;
  }): Promise<EmailResult> {
    const isApproved = params.status === 'approved';
    
    const message = isApproved ? `
Félicitations ${params.name} !

Excellente nouvelle ! Votre établissement "${params.etablissement}" a été validé.

✅ Statut : VALIDÉ
📅 Date : ${new Date().toLocaleDateString('fr-FR')}

Vous pouvez maintenant :
• Ajouter et gérer vos médecins
• Recevoir des rendez-vous via l'application mobile
• Gérer les consultations de votre établissement
• Accéder à toutes les fonctionnalités

Connectez-vous : ${typeof window !== 'undefined' ? window.location.origin : 'https://fadju.sn'}/secretaire/dashboard

Bienvenue dans l'écosystème Fadju !

L'équipe Fadju
    `.trim() : `
Bonjour ${params.name},

Nous avons examiné votre demande pour l'établissement "${params.etablissement}".

❌ Statut : REFUSÉ
📅 Date : ${new Date().toLocaleDateString('fr-FR')}

Motif du refus :
${params.reason || 'Informations non conformes aux exigences'}

Que faire maintenant ?
• Corrigez les points mentionnés ci-dessus
• Soumettez une nouvelle demande
• Contactez notre support si besoin

Nouvelle inscription : ${typeof window !== 'undefined' ? window.location.origin : 'https://fadju.sn'}/health-secretary/register

Cordialement,
L'équipe Fadju
    `.trim();
    
    return this.send({
      to: params.email,
      toName: params.name,
      subject: isApproved 
        ? '✅ Votre établissement a été validé !' 
        : '⚠️ Mise à jour de votre demande d\'inscription',
      message,
      template: isApproved ? 'validation' : 'rejection',
      data: {
        secretary_name: params.name,
        etablissement_name: params.etablissement,
        validation_status: params.status,
        rejection_reason: params.reason
      }
    });
  }
  
  // Notification admin pour nouvelle inscription
  static async sendAdminNotification(params: {
    secretaryName: string;
    etablissementName: string;
    etablissementType: string;
    ville: string;
    region: string;
  }): Promise<EmailResult> {
    const message = `
Nouvelle demande d'inscription reçue !

📍 Établissement : ${params.etablissementName}
🏥 Type : ${params.etablissementType}
📍 Ville : ${params.ville}
🌍 Région : ${params.region}
👤 Secrétaire : ${params.secretaryName}

Actions requises :
1. Connectez-vous au dashboard superadmin
2. Vérifiez les informations
3. Validez ou refusez la demande

⏰ Les demandes doivent être traitées sous 48h.

Dashboard : ${typeof window !== 'undefined' ? window.location.origin : 'https://fadju.sn'}/superadmin/validation

Système Fadju
    `.trim();
    
    return this.send({
      to: EMAIL_CONFIG.DEFAULT.ADMIN_EMAIL,
      toName: 'Équipe Admin',
      subject: '🆕 Nouvelle demande d\'inscription d\'établissement',
      message,
      template: 'notification',
      data: params
    });
  }
  
  /**
   * Méthode pour récupérer les emails de debug depuis localStorage
   */
  static getDebugEmails(): any[] {
    if (typeof window === 'undefined') return [];
    
    try {
      return JSON.parse(localStorage.getItem('debug_emails') || '[]');
    } catch {
      return [];
    }
  }
  
  /**
   * Méthode pour effacer les emails de debug
   */
  static clearDebugEmails(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('debug_emails');
    }
  }
  
  /**
   * Tester la configuration email
   */
  static async testConfiguration(): Promise<EmailResult> {
    return this.send({
      to: 'test@example.com',
      toName: 'Test User',
      subject: '🧪 Test de configuration email',
      message: `Ceci est un email de test envoyé le ${new Date().toLocaleString('fr-FR')}`,
      data: {
        test: true,
        timestamp: new Date().toISOString()
      }
    });
  }
}