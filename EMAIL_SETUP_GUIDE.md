# Guide de Configuration des Emails - Fadju Web

## 🎯 Vue d'ensemble

Le système d'email de Fadju supporte 3 modes :
1. **Console** (par défaut) - Affiche les emails dans la console pour debug
2. **EmailJS** - Service gratuit pour envoyer des emails depuis le frontend
3. **API** - Pour intégrer avec un service backend (Nodemailer, SendGrid, etc.)

## 📧 Mode 1: Console (Debug) - ACTUEL PAR DÉFAUT

C'est le mode par défaut qui fonctionne immédiatement sans configuration.

### Fonctionnement
- Les emails sont affichés dans la console du navigateur
- Stockés dans le localStorage pour debug
- Accessibles via l'interface de debug : `/superadmin/email-debug`

### Configuration (.env.local)
```env
NEXT_PUBLIC_EMAIL_PROVIDER=console
```

### Où voir les emails ?

1. **Console du navigateur** (F12 > Console)
   - Vous verrez les emails formatés avec emojis
   - Format structuré avec tous les détails

2. **Interface de debug**
   - Allez sur : `/superadmin/email-debug`
   - Visualisez l'historique des emails
   - Testez l'envoi de différents types d'emails

### Avantages
✅ Fonctionne immédiatement  
✅ Parfait pour le développement  
✅ Aucune configuration requise  
✅ Pas de coûts  

### Inconvénients
❌ Les emails ne sont pas réellement envoyés  
❌ Uniquement pour debug/développement  

## 📬 Mode 2: EmailJS (Production Simple)

EmailJS permet d'envoyer de vrais emails depuis le frontend, gratuit jusqu'à 200 emails/mois.

### Étape 1: Créer un compte EmailJS

1. Allez sur [https://www.emailjs.com/](https://www.emailjs.com/)
2. Cliquez sur "Sign Up Free"
3. Confirmez votre email

### Étape 2: Configurer un Service Email

1. Dans le dashboard EmailJS, allez dans **Email Services**
2. Cliquez sur **Add New Service**
3. Choisissez votre provider :
   - **Gmail** (recommandé pour commencer)
   - **Outlook**
   - **Custom SMTP**

#### Pour Gmail :
1. Sélectionnez Gmail
2. Connectez votre compte Google
3. Autorisez EmailJS
4. Notez le **Service ID** (ex: `service_abc123`)

### Étape 3: Créer un Template

1. Allez dans **Email Templates**
2. Cliquez sur **Create New Template**
3. Configurez le template :

**Subject:**
```
{{subject}}
```

**Content:**
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>{{subject}}</h2>
  
  <p>Bonjour {{to_name}},</p>
  
  <div style="white-space: pre-wrap; background: #f5f5f5; padding: 15px; border-radius: 5px;">
{{message}}
  </div>
  
  {{#if doctor_email}}
  <div style="margin-top: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
    <h3>Identifiants de connexion :</h3>
    <p><strong>Email:</strong> {{doctor_email}}</p>
    <p><strong>Mot de passe:</strong> {{doctor_password}}</p>
    <p><strong>Établissement:</strong> {{etablissement_name}}</p>
    <p><strong>URL de connexion:</strong> <a href="{{login_url}}">{{login_url}}</a></p>
  </div>
  {{/if}}
  
  <p style="margin-top: 30px; color: #666; font-size: 12px;">
    Cet email a été envoyé automatiquement par la plateforme Fadju.
  </p>
</div>
```

4. Notez le **Template ID** (ex: `template_xyz789`)

### Étape 4: Obtenir la Clé Publique

1. Allez dans **Account** > **General**
2. Copiez votre **Public Key** (ex: `user_def456`)

### Étape 5: Configuration dans Fadju

Créez/modifiez `.env.local` :
```env
# Mode EmailJS
NEXT_PUBLIC_EMAIL_PROVIDER=emailjs

# Vos clés EmailJS
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_abc123
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_xyz789
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=user_def456

# Email admin
NEXT_PUBLIC_ADMIN_EMAIL=votre-email@gmail.com
```

### Étape 6: Redémarrer l'application

```bash
npm run dev
```

### Test
1. Allez sur `/superadmin/email-debug`
2. Entrez votre email de test
3. Cliquez sur les boutons de test
4. Vérifiez votre boîte de réception

### Limites EmailJS (gratuit)
- 200 emails/mois
- 2 templates
- Pas de pièces jointes
- Branding EmailJS dans les emails

## 🚀 Mode 3: API Backend (Production Avancée)

Pour une solution professionnelle, utilisez un service backend.

### Option A: Nodemailer avec SMTP

1. Installez nodemailer :
```bash
npm install nodemailer
```

2. Créez `/app/api/send-email/route.ts` :
```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(request: Request) {
  const body = await request.json();
  
  await transporter.sendMail({
    from: '"Fadju Santé" <noreply@fadju.sn>',
    to: body.to,
    subject: body.subject,
    html: body.message,
  });
  
  return Response.json({ success: true });
}
```

### Option B: SendGrid

1. Créez un compte sur [SendGrid](https://sendgrid.com/)
2. Installez le SDK :
```bash
npm install @sendgrid/mail
```

3. Configuration :
```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function POST(request: Request) {
  const body = await request.json();
  
  await sgMail.send({
    to: body.to,
    from: 'noreply@fadju.sn',
    subject: body.subject,
    html: body.message,
  });
  
  return Response.json({ success: true });
}
```

### Option C: Resend (Recommandé)

1. Créez un compte sur [Resend](https://resend.com/)
2. Installez :
```bash
npm install resend
```

3. Configuration :
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const body = await request.json();
  
  await resend.emails.send({
    from: 'Fadju <noreply@fadju.sn>',
    to: body.to,
    subject: body.subject,
    html: body.message,
  });
  
  return Response.json({ success: true });
}
```

### Configuration .env.local pour API
```env
NEXT_PUBLIC_EMAIL_PROVIDER=api

# Pour Nodemailer
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-app

# Pour SendGrid
SENDGRID_API_KEY=SG.xxxxx

# Pour Resend
RESEND_API_KEY=re_xxxxx
```

## 🧪 Tester la Configuration

### 1. Interface de Debug

Accédez à `/superadmin/email-debug` pour :
- Vérifier la configuration
- Tester l'envoi d'emails
- Voir l'historique
- Débugger les problèmes

### 2. Test Programmatique

```typescript
import { EmailServiceV2 } from '@/lib/email/email-service-v2';

// Test simple
const result = await EmailServiceV2.testConfiguration();
console.log('Test result:', result);

// Test email de bienvenue
const welcomeResult = await EmailServiceV2.sendWelcomeEmail({
  email: 'test@example.com',
  name: 'Dr. Test',
  password: 'TempPass123',
  etablissement: 'Clinique Test'
});
console.log('Welcome email:', welcomeResult);
```

## 🐛 Résolution des Problèmes

### Problème : "Les emails n'arrivent pas"

**Solutions :**
1. Vérifiez le mode dans `.env.local`
2. Si EmailJS : Vérifiez les clés (Service ID, Template ID, Public Key)
3. Regardez dans les spams
4. Utilisez l'interface de debug pour voir les logs

### Problème : "EmailJS non configuré"

**Solutions :**
1. Vérifiez que toutes les clés sont dans `.env.local`
2. Redémarrez l'application après modification
3. Les clés ne doivent pas contenir "your_"

### Problème : "Limite EmailJS atteinte"

**Solutions :**
1. Passez au mode console pour debug
2. Upgrade vers EmailJS Pro (15$/mois)
3. Migrez vers une solution API backend

## 📊 Comparaison des Solutions

| Feature | Console | EmailJS | API Backend |
|---------|---------|---------|-------------|
| Configuration | ✅ Aucune | ⚠️ Simple | ⚠️ Moyenne |
| Coût | ✅ Gratuit | ✅ 0-15$/mois | 💰 Variable |
| Limite | ∞ | 200/mois (gratuit) | Selon provider |
| Emails réels | ❌ | ✅ | ✅ |
| Sécurité | ✅ | ⚠️ Clé publique exposée | ✅ |
| Pièces jointes | ❌ | ❌ (gratuit) | ✅ |
| Templates | ✅ Code | ⚠️ Limité | ✅ |
| Debug | ✅ Excellent | ⚠️ Moyen | ⚠️ Logs serveur |

## 🎯 Recommandations

### Pour le Développement
→ Utilisez le mode **Console** (par défaut)

### Pour une Démo/Test
→ Utilisez **EmailJS** (rapide à configurer)

### Pour la Production
→ Utilisez une **API Backend** avec Resend ou SendGrid

## 📝 Checklist de Configuration

- [ ] Choisir le provider (`console`, `emailjs`, ou `api`)
- [ ] Configurer les variables d'environnement
- [ ] Tester avec `/superadmin/email-debug`
- [ ] Vérifier la réception des emails
- [ ] Configurer l'email admin pour les notifications
- [ ] Tester tous les types d'emails (bienvenue, validation, etc.)
- [ ] Documenter la configuration pour l'équipe

## Support

Pour toute question sur la configuration des emails, consultez :
- L'interface de debug : `/superadmin/email-debug`
- La console du navigateur pour les logs
- Ce guide de configuration

Le mode Console est parfait pour commencer et tester l'application sans configuration complexe !