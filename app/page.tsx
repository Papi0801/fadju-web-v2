'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Heart, 
  Building2, 
  Users, 
  Shield,
  ArrowRight,
  Stethoscope
} from 'lucide-react';
import { Button, Card, CardContent, ConditionalThemeToggle } from '@/components/ui';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();

  const userTypes = [
    {
      title: 'Secrétaire de Santé',
      description: 'Gérez votre établissement de santé et organisez les consultations',
      icon: Building2,
      href: '/health-secretary',
      color: 'from-green-500 to-blue-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Médecin',
      description: 'Accédez à vos consultations et gérez vos patients',
      icon: Stethoscope,
      href: '/auth/login',
      color: 'from-blue-500 to-purple-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Superadministrateur',
      description: 'Administration système et validation des établissements',
      icon: Shield,
      href: '/superadmin-login',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
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
              <h1 className="text-2xl font-bold text-primary">Fadju</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <ConditionalThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Bienvenue sur
              <span className="text-primary block mt-2">Fadju Santé</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              La plateforme digitale qui transforme la gestion des établissements de santé au Sénégal
            </p>
          </motion.div>

          {/* User Types */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {userTypes.map((type, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                whileHover={{ scale: 1.02 }}
                className="cursor-pointer"
                onClick={() => router.push(type.href)}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 group">
                  <CardContent className="p-8 text-center">
                    <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${type.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <type.icon className="w-10 h-10 text-white" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-foreground mb-3">
                      {type.title}
                    </h3>
                    
                    <p className="text-muted-foreground mb-6">
                      {type.description}
                    </p>
                    
                    <Button
                      variant="outline"
                      className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    >
                      Accéder
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Features Section */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="bg-muted/30 rounded-3xl p-8 md:p-12"
          >
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-foreground mb-4">
                Une solution complète
              </h3>
              <p className="text-lg text-muted-foreground">
                Fadju accompagne tous les acteurs de la santé
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-xl font-semibold text-foreground mb-2">
                  Établissements
                </h4>
                <p className="text-muted-foreground">
                  Digitalisez la gestion de votre structure de santé
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-xl font-semibold text-foreground mb-2">
                  Professionnels
                </h4>
                <p className="text-muted-foreground">
                  Simplifiez le suivi médical et la gestion des patients
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="text-xl font-semibold text-foreground mb-2">
                  Patients
                </h4>
                <p className="text-muted-foreground">
                  Améliorez l'expérience patient et l'accès aux soins
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Image
              src="/assets/images/logo-fadju-fond-blanc.jpg"
              alt="Fadju Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <h4 className="text-lg font-bold text-primary">Fadju</h4>
          </div>
          <p className="text-muted-foreground">
            &copy; {new Date().getFullYear()} Fadju. Tous droits réservés. 
            Une initiative pour la transformation digitale de la santé au Sénégal.
          </p>
        </div>
      </footer>
    </div>
  );
}
