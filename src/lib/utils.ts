import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function generateInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function phoneNumberFormat(phone: string): string {
  // Format phone number for Senegal (+221 XX XXX XX XX)
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('221')) {
    const number = cleaned.substring(3);
    return `+221 ${number.substring(0, 2)} ${number.substring(2, 5)} ${number.substring(5, 7)} ${number.substring(7, 9)}`;
  }
  return phone;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhoneSenegal(phone: string): boolean {
  const phoneRegex = /^(\+221|00221|221)?[0-9]{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

export function getStatusColor(status: string): string {
  const statusColors: { [key: string]: string } = {
    'en_attente': 'text-yellow-600 bg-yellow-50 border-yellow-200',
    'confirmee': 'text-green-600 bg-green-50 border-green-200',
    'annule': 'text-red-600 bg-red-50 border-red-200',
    'termine': 'text-blue-600 bg-blue-50 border-blue-200',
    'valide': 'text-green-600 bg-green-50 border-green-200',
    'rejete': 'text-red-600 bg-red-50 border-red-200',
    'disponible': 'text-green-600 bg-green-50 border-green-200',
    'en_cours': 'text-blue-600 bg-blue-50 border-blue-200',
    'archive': 'text-gray-600 bg-gray-50 border-gray-200',
  };
  
  return statusColors[status] || 'text-gray-600 bg-gray-50 border-gray-200';
}

export function getStatusLabel(status: string): string {
  const statusLabels: { [key: string]: string } = {
    'en_attente': 'En attente',
    'confirmee': 'Confirmé',
    'annule': 'Annulé',
    'termine': 'Terminé',
    'valide': 'Validé',
    'rejete': 'Rejeté',
    'disponible': 'Disponible',
    'en_cours': 'En cours',
    'archive': 'Archivé',
  };
  
  return statusLabels[status] || status;
}