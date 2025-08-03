'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Bell, User, LogOut, Settings, Menu } from 'lucide-react';
import Image from 'next/image';
import { useAuthStore } from '@/store';
import { Button, ConditionalThemeToggle } from '@/components/ui';
import { cn } from '@/lib/utils';

interface NavbarProps {
  onMenuClick?: () => void;
  className?: string;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick, className }) => {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        'bg-background border-b border-border px-4 py-3 sticky top-0 z-40 backdrop-blur-md',
        className
      )}
    >
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          {onMenuClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="flex items-center space-x-3">
            <motion.div whileHover={{ scale: 1.05 }}>
              <Image
                src="/assets/images/logo-fadju-fond-vert.jpg"
                alt="Fadju Logo"
                width={32}
                height={32}
                className="rounded-lg"
              />
            </motion.div>
            <h1 className="text-xl font-bold text-primary">Fadju</h1>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-3">
          {/* Theme Toggle */}
          <ConditionalThemeToggle />
          
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full text-xs flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full" />
            </span>
          </Button>

          {/* User menu */}
          <div className="flex items-center space-x-3 border-l border-border pl-3">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-foreground">
                {user?.prenom} {user?.nom}
              </span>
              <span className="text-xs text-muted-foreground capitalize">
                {user?.role}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4" />
              </Button>
              
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;