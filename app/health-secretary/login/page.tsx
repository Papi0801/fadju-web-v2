'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Lock, Mail, Eye, EyeOff, Building2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Image from 'next/image';

import { useAuthStore } from '@/store';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Loading, LoadingOverlay, ConditionalThemeToggle } from '@/components/ui';
import { LoginForm } from '@/types';

const loginSchema = yup.object({
  email: yup.string().email('Email invalide').required('Email requis'),
  password: yup.string().required('Mot de passe requis'),
});

const HealthSecretaryLoginPage: React.FC = () => {
  const router = useRouter();
  const { login, loading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: yupResolver(loginSchema),
  });

  // Redirection vers la page de connexion partagée
  React.useEffect(() => {
    router.push('/auth/login');
  }, [router]);

  return null;
};

export default HealthSecretaryLoginPage;