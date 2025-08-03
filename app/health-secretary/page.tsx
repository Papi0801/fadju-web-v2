'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Building2, 
  Users, 
  Calendar,
  Activity,
  Shield,
  Heart,
  CheckCircle,
  ArrowRight,
  Phone,
  MapPin,
  Clock
} from 'lucide-react';
import { Button, Card, CardContent, ConditionalThemeToggle } from '@/components/ui';

const HealthSecretaryHomePage: React.FC = () => {
  const router = useRouter();

  const features = [
    {
      icon: Building2,
      title: 'Gestion d\'établissement',
      description: 'Enregistrez et gérez votre structure de santé en toute simplicité',
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      icon: Calendar,
      title: 'Planification des rendez-vous',
      description: 'Organisez efficacement les consultations de vos médecins',
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      icon: Users,
      title: 'Gestion des médecins',
      description: 'Ajoutez et gérez les profils de vos professionnels de santé',
      color: 'text-purple-500',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      icon: Activity,
      title: 'Suivi en temps réel',
      description: 'Visualisez l\'activité de votre établissement instantanément',
      color: 'text-orange-500',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    },
  ];

  const stats = [
    { label: 'Établissements inscrits', value: '150+', icon: Building2 },
    { label: 'Rendez-vous gérés', value: '10k+', icon: Calendar },
    { label: 'Médecins actifs', value: '500+', icon: Users },
    { label: 'Patients satisfaits', value: '95%', icon: Heart },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Image
                src="/assets/images/logo-fadju-fond-blanc.jpg"
                alt="Fadju Logo"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <h1 className="text-2xl font-bold text-primary">Fadju Santé</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <ConditionalThemeToggle />
              <Button
                variant="outline"
                onClick={() => router.push('/auth/login')}
              >
                Se connecter
              </Button>
              <Button
                variant="primary"
                onClick={() => router.push('/health-secretary/register')}
                className="hidden sm:flex"
              >
                S'inscrire
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Simplifiez la gestion de votre
              <span className="text-primary block mt-2">établissement de santé</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Fadju vous accompagne dans la digitalisation de votre structure médicale
              pour une meilleure prise en charge des patients au Sénégal
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="primary"
                onClick={() => router.push('/health-secretary/register')}
                className="group"
              >
                Commencer maintenant
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => router.push('/auth/login')}
              >
                J'ai déjà un compte
              </Button>
            </div>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-12 relative"
          >
            <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/assets/images/banniere-medicale.jpg"
                alt="Gestion médicale"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-8 left-8 text-white">
                <h3 className="text-2xl font-bold mb-2">
                  Modernisez votre établissement
                </h3>
                <p className="text-lg opacity-90">
                  Rejoignez la transformation digitale de la santé au Sénégal
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Tout ce dont vous avez besoin
            </h3>
            <p className="text-lg text-muted-foreground">
              Des outils pensés pour faciliter votre quotidien
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <h4 className="text-lg font-semibold text-foreground mb-2">
                      {feature.title}
                    </h4>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-primary/5 dark:bg-primary/10 rounded-3xl p-8 md:p-12">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h4 className="text-3xl font-bold text-foreground">{stat.value}</h4>
                  <p className="text-muted-foreground mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Partenaires de confiance
            </h3>
            <p className="text-lg text-muted-foreground">
              Soutenus par les acteurs majeurs de la santé au Sénégal
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex justify-center"
            >
              <Image
                src="/assets/images/logo-ministère-santé.png"
                alt="Ministère de la Santé"
                width={150}
                height={80}
                className="object-contain"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex justify-center"
            >
              <Image
                src="/assets/images/OMS.png"
                alt="OMS"
                width={120}
                height={80}
                className="object-contain"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex justify-center"
            >
              <Image
                src="/assets/images/Flag_of_Senegal.png"
                alt="Sénégal"
                width={100}
                height={60}
                className="object-contain"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h3 className="text-3xl font-bold text-foreground mb-6">
                Pourquoi choisir Fadju ?
              </h3>
              <div className="space-y-4">
                {[
                  {
                    title: 'Simple et intuitif',
                    description: 'Interface conçue pour être utilisée sans formation complexe'
                  },
                  {
                    title: 'Sécurisé et fiable',
                    description: 'Vos données sont protégées selon les normes internationales'
                  },
                  {
                    title: 'Support local',
                    description: 'Équipe dédiée disponible pour vous accompagner'
                  },
                  {
                    title: 'Adapté au Sénégal',
                    description: 'Conçu spécifiquement pour le système de santé sénégalais'
                  }
                ].map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-3"
                  >
                    <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-foreground">{benefit.title}</h4>
                      <p className="text-muted-foreground">{benefit.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative h-[400px] rounded-2xl overflow-hidden"
            >
              <Image
                src="/assets/images/Femme-Analyse.jpg"
                alt="Analyse médicale"
                fill
                className="object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary/5 dark:bg-primary/10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Prêt à transformer votre établissement ?
            </h3>
            <p className="text-lg text-muted-foreground mb-8">
              Rejoignez les établissements de santé qui ont déjà fait le choix de la modernité
            </p>
            <Button
              size="lg"
              variant="primary"
              onClick={() => router.push('/health-secretary/register')}
              className="group"
            >
              Créer mon compte gratuitement
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t border-border py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Image
                  src="/assets/images/logo-fadju-fond-blanc.jpg"
                  alt="Fadju Logo"
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
                <h4 className="text-xl font-bold text-primary">Fadju</h4>
              </div>
              <p className="text-muted-foreground">
                La plateforme de gestion médicale au service de la santé sénégalaise
              </p>
            </div>
            
            <div>
              <h5 className="font-semibold text-foreground mb-4">Produit</h5>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Fonctionnalités</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Tarifs</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Sécurité</a></li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold text-foreground mb-4">Support</h5>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Guide d'utilisation</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold text-foreground mb-4">Contact</h5>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>+221 33 123 45 67</span>
                </li>
                <li className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Dakar, Sénégal</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Lun-Ven: 8h-18h</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-border text-center text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Fadju. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HealthSecretaryHomePage;