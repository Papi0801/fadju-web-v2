'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Building2,
  Calendar,
  Users,
  FileText,
  Phone,
  Settings,
  UserCheck,
  Stethoscope,
  ClipboardList,
  TestTube,
} from 'lucide-react';
import { useAuthStore } from '@/store';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose, className }) => {
  const pathname = usePathname();
  const { user } = useAuthStore();

  // Menu items basés sur le rôle
  const getMenuItems = () => {
    if (user?.role === 'superadmin') {
      return [
        {
          name: 'Tableau de bord',
          href: '/superadmin',
          icon: LayoutDashboard,
        },
        {
          name: 'Établissements',
          href: '/superadmin/etablissements',
          icon: Building2,
        },
        {
          name: 'Validation',
          href: '/superadmin/validation',
          icon: UserCheck,
        },
        {
          name: 'Contacts urgence',
          href: '/superadmin/urgences',
          icon: Phone,
        },
        {
          name: 'Test Synchronisation',
          href: '/superadmin/sync-test',
          icon: TestTube,
        },
        {
          name: 'Paramètres',
          href: '/superadmin/settings',
          icon: Settings,
        },
      ];
    }

    if (user?.role === 'secretaire') {
      return [
        {
          name: 'Tableau de bord',
          href: '/secretaire/dashboard',
          icon: LayoutDashboard,
        },
        {
          name: 'Rendez-vous',
          href: '/secretaire/rendez-vous',
          icon: Calendar,
        },
        {
          name: 'Patients',
          href: '/secretaire/patients',
          icon: Users,
        },
        {
          name: 'Médecins',
          href: '/secretaire/medecins',
          icon: Stethoscope,
        },
        {
          name: 'Établissement',
          href: '/secretaire/etablissement',
          icon: Building2,
        },
        {
          name: 'Profil',
          href: '/secretaire/profil',
          icon: Settings,
        },
      ];
    }

    if (user?.role === 'medecin') {
      return [
        {
          name: 'Tableau de bord',
          href: '/medecin/dashboard',
          icon: LayoutDashboard,
        },
        {
          name: 'Mes consultations',
          href: '/medecin/consultations',
          icon: Calendar,
        },
        {
          name: 'Historique médical',
          href: '/medecin/historique-medical',
          icon: ClipboardList,
        },
        {
          name: 'Mes patients',
          href: '/medecin/patients',
          icon: Users,
        },
        {
          name: 'Profil',
          href: '/medecin/profil',
          icon: Settings,
        },
      ];
    }

    return [];
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && onClose && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : -280,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={cn(
          'fixed left-0 top-0 h-full w-72 bg-background border-r border-border z-50 lg:relative lg:translate-x-0 lg:opacity-100 lg:z-auto',
          'max-w-[85vw] sm:max-w-[320px]', // Responsive width
          className
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center space-x-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center"
              >
                <span className="text-primary-foreground font-bold">F</span>
              </motion.div>
              <div>
                <h2 className="text-lg font-bold text-primary">Fadju</h2>
                <p className="text-xs text-muted-foreground">Gestion Santé</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-5 w-5 transition-transform group-hover:scale-110',
                          isActive && 'text-primary-foreground'
                        )}
                      />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-xs text-primary-foreground font-bold">
                    {user?.prenom?.[0]}{user?.nom?.[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user?.prenom} {user?.nom}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {user?.role}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;