# Configuration de l'envoi d'emails automatiques

Ce projet utilise **EmailJS** pour envoyer automatiquement les identifiants de connexion aux médecins créés par les secrétaires.

## Configuration EmailJS

### 1. Créer un compte EmailJS

1. Allez sur [EmailJS.com](https://www.emailjs.com/)
2. Créez un compte gratuit
3. Vérifiez votre email

### 2. Configurer le service d'email

1. Dans le dashboard EmailJS, allez dans **Email Services**
2. Cliquez sur **Add New Service**
3. Choisissez votre fournisseur d'email (Gmail, Outlook, etc.)
4. Suivez les instructions de configuration
5. Notez votre **Service ID**

### 3. Créer un template d'email

1. Allez dans **Email Templates**
2. Cliquez sur **Create New Template**
3. Utilisez ce template pour les médecins :

```html
Bonjour {{to_name}},

Votre compte médecin a été créé avec succès sur la plateforme Fadju pour l'établissement {{etablissement_name}}.

Vos identifiants de connexion :
- Email : {{doctor_email}}
- Mot de passe temporaire : {{doctor_password}}

⚠️ IMPORTANT : Pour votre sécurité, vous devrez changer ce mot de passe temporaire lors de votre première connexion.

Pour vous connecter :
1. Rendez-vous sur : {{login_url}}
2. Utilisez vos identifiants ci-dessus
3. Suivez les instructions pour changer votre mot de passe

Une fois connecté, vous pourrez :
- Consulter vos rendez-vous
- Gérer vos patients
- Accéder à votre planning

Si vous avez des questions, n'hésitez pas à contacter votre secrétaire santé.

Cordialement,
L'équipe Fadju
```

4. Notez votre **Template ID**

### 4. Obtenir la clé publique

1. Allez dans **Account** > **General**
2. Copiez votre **Public Key**

### 5. Configurer les variables d'environnement

Créez un fichier `.env.local` à la racine du projet avec :

```env
# EmailJS Configuration
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id_here
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id_here
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key_here
```

### 6. Variables disponibles dans le template

Les variables suivantes sont automatiquement injectées :

- `{{to_email}}` : Email du médecin
- `{{to_name}}` : Nom complet du médecin
- `{{doctor_email}}` : Email de connexion
- `{{doctor_password}}` : Mot de passe temporaire
- `{{doctor_name}}` : Nom du médecin
- `{{etablissement_name}}` : Nom de l'établissement
- `{{login_url}}` : URL de connexion
- `{{from_name}}` : "Équipe Fadju"
- `{{subject}}` : Sujet de l'email

## Test de la configuration

Une fois configuré, le système :

1. ✅ Vérifie automatiquement si EmailJS est configuré
2. ✅ Envoie l'email au médecin avec ses identifiants
3. ✅ Envoie une notification au secrétaire
4. ✅ Affiche un message de succès approprié
5. ✅ Fonctionne même si l'email échoue (mode dégradé)

## Mode dégradé

Si EmailJS n'est pas configuré ou échoue :
- Le médecin est créé normalement
- Un message informe le secrétaire qu'il doit communiquer les identifiants manuellement
- Les identifiants sont affichés dans l'interface

## Limites EmailJS (compte gratuit)

- 200 emails/mois
- Pas de support prioritaire
- Branding EmailJS dans les emails

Pour plus d'emails, considérez l'upgrade vers un plan payant.

## Alternative : Resend.com

Pour un usage professionnel, vous pouvez remplacer EmailJS par Resend :
- API plus puissante
- Pas de branding
- Meilleure délivrabilité
- Support prioritaire

Le code est structuré pour faciliter cette migration.