import emailjs from '@emailjs/browser';

// Configuration EmailJS
const EMAILJS_CONFIG = {
  SERVICE_ID: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'your_service_id',
  TEMPLATE_ID: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'your_template_id',
  PUBLIC_KEY: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'your_public_key',
};

// Initialiser EmailJS
emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);

export interface EmailTemplate {
  to_email: string;
  to_name: string;
  from_name: string;
  subject: string;
  message: string;
  doctor_email?: string;
  doctor_password?: string;
  doctor_name?: string;
  etablissement_name?: string;
  login_url?: string;
  validation_status?: string;
  rejection_reason?: string;
  secretary_name?: string;
  superadmin_name?: string;
  dashboard_url?: string;
}

export class EmailService {
  /**
   * Envoie un email de bienvenue au médecin avec ses identifiants
   */
  static async sendWelcomeEmailToDoctor(params: {
    doctorEmail: string;
    doctorName: string;
    password: string;
    etablissementName: string;
  }): Promise<void> {
    const { doctorEmail, doctorName, password, etablissementName } = params;

    const templateParams: EmailTemplate = {
      to_email: doctorEmail,
      to_name: doctorName,
      from_name: 'Équipe Fadju',
      subject: 'Bienvenue sur la plateforme Fadju - Vos identifiants de connexion',
      message: `
Bonjour Dr. ${doctorName},

Votre compte médecin a été créé avec succès sur la plateforme Fadju pour l'établissement ${etablissementName}.

Vos identifiants de connexion :
- Email : ${doctorEmail}
- Mot de passe temporaire : ${password}

⚠️ IMPORTANT : Pour votre sécurité, vous devrez changer ce mot de passe temporaire lors de votre première connexion.

Pour vous connecter :
1. Rendez-vous sur : ${window.location.origin}/auth/login
2. Utilisez vos identifiants ci-dessus
3. Suivez les instructions pour changer votre mot de passe

Une fois connecté, vous pourrez :
- Consulter vos rendez-vous
- Gérer vos patients
- Accéder à votre planning

Si vous avez des questions, n'hésitez pas à contacter votre secrétaire santé.

Cordialement,
L'équipe Fadju
      `.trim(),
      doctor_email: doctorEmail,
      doctor_password: password,
      doctor_name: doctorName,
      etablissement_name: etablissementName,
      login_url: `${window.location.origin}/auth/login`,
    };

    try {
      const result = await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams as any
      );

      if (result.status === 200) {
        console.log('Email de bienvenue envoyé avec succès');
      } else {
        throw new Error(`Erreur EmailJS: ${result.status}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      throw new Error('Impossible d\'envoyer l\'email de bienvenue');
    }
  }

  /**
   * Envoie un email de notification au secrétaire
   */
  static async sendNotificationToSecretary(params: {
    secretaryEmail: string;
    secretaryName: string;
    doctorName: string;
    etablissementName: string;
  }): Promise<void> {
    const { secretaryEmail, secretaryName, doctorName, etablissementName } = params;

    const templateParams: EmailTemplate = {
      to_email: secretaryEmail,
      to_name: secretaryName,
      from_name: 'Système Fadju',
      subject: 'Nouveau médecin ajouté à votre établissement',
      message: `
Bonjour ${secretaryName},

Le médecin Dr. ${doctorName} a été ajouté avec succès à votre établissement ${etablissementName}.

Le médecin a reçu ses identifiants de connexion par email et pourra se connecter dès maintenant.

Actions effectuées :
✅ Compte médecin créé
✅ Email de bienvenue envoyé
✅ Mot de passe temporaire généré

Le médecin apparaîtra dans votre liste des médecins et pourra commencer à recevoir des rendez-vous via l'application mobile.

Cordialement,
Le système Fadju
      `.trim(),
      doctor_name: doctorName,
      etablissement_name: etablissementName,
    };

    try {
      await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams as any
      );
      console.log('Email de notification envoyé au secrétaire');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error);
      // Ne pas faire échouer la création si l'email échoue
    }
  }

  /**
   * Notifie le superadmin d'une nouvelle demande d'inscription
   */
  static async notifyAdminNewRequest(params: {
    adminEmail: string;
    adminName: string;
    secretaryName: string;
    etablissementName: string;
    etablissementType: string;
    etablissementVille: string;
    etablissementRegion: string;
  }): Promise<void> {
    const { adminEmail, adminName, secretaryName, etablissementName, etablissementType, etablissementVille, etablissementRegion } = params;

    const templateParams: EmailTemplate = {
      to_email: adminEmail,
      to_name: adminName,
      from_name: 'Système Fadju',
      subject: 'Nouvelle demande d\'inscription d\'établissement de santé',
      message: `
Bonjour ${adminName},

Une nouvelle demande d'inscription a été soumise sur la plateforme Fadju.

Détails de la demande :
📍 Établissement : ${etablissementName}
🏥 Type : ${etablissementType}
📍 Ville : ${etablissementVille}
🌍 Région : ${etablissementRegion}
👤 Secrétaire : ${secretaryName}

Actions requises :
1. Connectez-vous à votre espace superadministrateur
2. Vérifiez les informations de l'établissement
3. Validez ou refusez la demande

⏰ Les demandes en attente nécessitent une validation dans un délai de 48h.

Accéder au portail : ${window.location.origin}/superadmin

Cordialement,
Le système Fadju
      `.trim(),
      etablissement_name: etablissementName,
      secretary_name: secretaryName,
      dashboard_url: `${window.location.origin}/superadmin`,
    };

    try {
      await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams as any
      );
      console.log('Notification admin envoyée avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification admin:', error);
      throw new Error('Impossible d\'envoyer la notification au superadmin');
    }
  }

  /**
   * Notifie le secrétaire que sa demande a été validée
   */
  static async notifySecretaryApproval(params: {
    secretaryEmail: string;
    secretaryName: string;
    etablissementName: string;
    adminName?: string;
  }): Promise<void> {
    const { secretaryEmail, secretaryName, etablissementName, adminName = 'L\'équipe Fadju' } = params;

    const templateParams: EmailTemplate = {
      to_email: secretaryEmail,
      to_name: secretaryName,
      from_name: 'Équipe Fadju',
      subject: '🎉 Votre établissement a été validé !',
      message: `
Félicitations ${secretaryName} !

Excellente nouvelle ! Votre établissement "${etablissementName}" a été validé par notre équipe.

✅ Validation effectuée par : ${adminName}
📅 Date de validation : ${new Date().toLocaleDateString('fr-FR', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}

🎯 Vous pouvez maintenant :
• Ajouter et gérer vos médecins
• Recevoir des rendez-vous via l'application mobile
• Gérer les consultations de votre établissement
• Accéder à toutes les fonctionnalités de la plateforme

🚀 Votre établissement est désormais visible sur l'application mobile Fadju et les patients peuvent prendre rendez-vous avec vos médecins.

Accéder à votre dashboard : ${window.location.origin}/secretaire/dashboard

Prochaines étapes recommandées :
1. Ajoutez vos médecins dans la section "Gestion des médecins"
2. Vérifiez les informations de votre établissement
3. Configurez vos horaires et services

Bienvenue dans l'écosystème Fadju !

L'équipe Fadju
      `.trim(),
      etablissement_name: etablissementName,
      secretary_name: secretaryName,
      validation_status: 'validé',
      dashboard_url: `${window.location.origin}/secretaire/dashboard`,
      superadmin_name: adminName,
    };

    try {
      await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams as any
      );
      console.log('Email de validation envoyé au secrétaire');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de validation:', error);
      throw new Error('Impossible d\'envoyer l\'email de validation');
    }
  }

  /**
   * Notifie le secrétaire que sa demande a été refusée
   */
  static async notifySecretaryRejection(params: {
    secretaryEmail: string;
    secretaryName: string;
    etablissementName: string;
    rejectionReason: string;
    adminName?: string;
  }): Promise<void> {
    const { secretaryEmail, secretaryName, etablissementName, rejectionReason, adminName = 'L\'équipe Fadju' } = params;

    const templateParams: EmailTemplate = {
      to_email: secretaryEmail,
      to_name: secretaryName,
      from_name: 'Équipe Fadju',
      subject: 'Mise à jour de votre demande d\'inscription',
      message: `
Bonjour ${secretaryName},

Nous avons examiné votre demande d'inscription pour l'établissement "${etablissementName}".

❌ Statut : Demande non validée
👤 Examiné par : ${adminName}
📅 Date d'examen : ${new Date().toLocaleDateString('fr-FR', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}

📝 Motif du refus :
${rejectionReason}

🔄 Que faire maintenant ?
Vous pouvez soumettre une nouvelle demande en corrigeant les points mentionnés ci-dessus.

Pour créer une nouvelle demande :
1. Rendez-vous sur : ${window.location.origin}/health-secretary/register
2. Remplissez le formulaire avec les informations correctes
3. Assurez-vous que toutes les informations sont exactes et complètes

💬 Besoin d'aide ?
Si vous avez des questions concernant ce refus ou besoin d'éclaircissements, n'hésitez pas à nous contacter.

Nous restons à votre disposition pour vous accompagner dans votre démarche.

Cordialement,
L'équipe Fadju
      `.trim(),
      etablissement_name: etablissementName,
      secretary_name: secretaryName,
      validation_status: 'refusé',
      rejection_reason: rejectionReason,
      superadmin_name: adminName,
      login_url: `${window.location.origin}/health-secretary/register`,
    };

    try {
      await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams as any
      );
      console.log('Email de refus envoyé au secrétaire');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de refus:', error);
      throw new Error('Impossible d\'envoyer l\'email de refus');
    }
  }

  /**
   * Notifie le secrétaire lors de l'inscription (confirmation de réception)
   */
  static async confirmRegistrationToSecretary(params: {
    secretaryEmail: string;
    secretaryName: string;
    etablissementName: string;
  }): Promise<void> {
    const { secretaryEmail, secretaryName, etablissementName } = params;

    const templateParams: EmailTemplate = {
      to_email: secretaryEmail,
      to_name: secretaryName,
      from_name: 'Équipe Fadju',
      subject: 'Confirmation de votre demande d\'inscription',
      message: `
Bonjour ${secretaryName},

Nous avons bien reçu votre demande d'inscription pour l'établissement "${etablissementName}".

✅ Demande enregistrée avec succès
📅 Date de soumission : ${new Date().toLocaleDateString('fr-FR', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}
🔍 Statut : En cours d'examen

⏰ Délai d'examen : 24 à 48 heures
📧 Vous recevrez un email dès que votre demande sera traitée

Pendant l'attente :
• Votre compte est créé et vous pouvez vous connecter
• L'accès aux fonctionnalités sera débloqué après validation
• Vous pouvez consulter le statut dans votre dashboard

Accéder à votre dashboard : ${window.location.origin}/secretaire/dashboard

Notre équipe examine chaque demande avec attention pour garantir la qualité de notre réseau d'établissements de santé.

Merci de votre confiance !

L'équipe Fadju
      `.trim(),
      etablissement_name: etablissementName,
      secretary_name: secretaryName,
      dashboard_url: `${window.location.origin}/secretaire/dashboard`,
    };

    try {
      await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams as any
      );
      console.log('Email de confirmation d\'inscription envoyé');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de confirmation:', error);
      // Ne pas faire échouer l'inscription si l'email échoue
    }
  }

  /**
   * Vérifie si EmailJS est correctement configuré
   */
  static isConfigured(): boolean {
    return (
      EMAILJS_CONFIG.SERVICE_ID !== 'your_service_id' &&
      EMAILJS_CONFIG.TEMPLATE_ID !== 'your_template_id' &&
      EMAILJS_CONFIG.PUBLIC_KEY !== 'your_public_key'
    );
  }

  /**
   * Test de configuration EmailJS
   */
  static async testConfiguration(): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('EmailJS non configuré');
      return false;
    }

    try {
      const testParams: EmailTemplate = {
        to_email: 'test@example.com',
        to_name: 'Test',
        from_name: 'Test Fadju',
        subject: 'Test de configuration',
        message: 'Ceci est un test de configuration EmailJS.',
      };

      await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        testParams as any
      );
      return true;
    } catch (error) {
      console.error('Test EmailJS échoué:', error);
      return false;
    }
  }
}