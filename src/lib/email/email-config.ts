// Configuration centralisée des emails
export const EMAIL_CONFIG = {
  // EmailJS Configuration
  EMAILJS: {
    SERVICE_ID: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '',
    TEMPLATE_ID: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || '',
    PUBLIC_KEY: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '',
  },
  
  // Alternative: Configuration API Route (pour nodemailer ou resend)
  API: {
    ENDPOINT: '/api/send-email',
    SECRET_KEY: process.env.EMAIL_SECRET_KEY || '',
  },
  
  // Provider à utiliser
  PROVIDER: process.env.NEXT_PUBLIC_EMAIL_PROVIDER || 'console', // 'emailjs' | 'api' | 'console'
  
  // Email par défaut pour les tests
  DEFAULT: {
    FROM_EMAIL: 'noreply@fadju.sn',
    FROM_NAME: 'Fadju Santé',
    ADMIN_EMAIL: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@fadju.sn',
  }
};

// Validation de la configuration
export const isEmailConfigured = () => {
  const provider = EMAIL_CONFIG.PROVIDER;
  
  switch (provider) {
    case 'emailjs':
      return !!(
        EMAIL_CONFIG.EMAILJS.SERVICE_ID &&
        EMAIL_CONFIG.EMAILJS.TEMPLATE_ID &&
        EMAIL_CONFIG.EMAILJS.PUBLIC_KEY &&
        EMAIL_CONFIG.EMAILJS.SERVICE_ID !== 'your_service_id'
      );
    case 'api':
      return !!EMAIL_CONFIG.API.ENDPOINT;
    case 'console':
      return true; // Toujours disponible pour debug
    default:
      return false;
  }
};