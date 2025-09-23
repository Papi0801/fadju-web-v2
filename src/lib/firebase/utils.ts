import { Timestamp } from 'firebase/firestore';

/**
 * Convertit les Timestamps Firebase en objets JavaScript
 * @param data - L'objet contenant potentiellement des Timestamps
 * @returns L'objet avec les Timestamps conservés
 */
export function convertTimestamp(data: any): any {
  if (!data) return data;
  
  // Si c'est un Timestamp, on le laisse tel quel pour pouvoir utiliser .toDate()
  if (data instanceof Timestamp) {
    return data;
  }
  
  // Si c'est un objet, on parcourt ses propriétés
  if (typeof data === 'object' && !Array.isArray(data)) {
    const converted: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const value = data[key];
        // Si la valeur est un Timestamp, on la conserve
        if (value instanceof Timestamp) {
          converted[key] = value;
        } else if (value && typeof value === 'object' && value.toDate && typeof value.toDate === 'function') {
          // Si c'est un objet qui ressemble à un Timestamp
          converted[key] = value;
        } else if (value && typeof value === 'object') {
          // Récursion pour les objets imbriqués
          converted[key] = convertTimestamp(value);
        } else {
          converted[key] = value;
        }
      }
    }
    return converted;
  }
  
  // Si c'est un tableau, on parcourt ses éléments
  if (Array.isArray(data)) {
    return data.map(item => convertTimestamp(item));
  }
  
  return data;
}

/**
 * Convertit une date JavaScript en Timestamp Firebase
 * @param date - La date à convertir
 * @returns Un Timestamp Firebase
 */
export function dateToTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

/**
 * Convertit un Timestamp Firebase en date JavaScript
 * @param timestamp - Le Timestamp à convertir
 * @returns Une date JavaScript
 */
export function timestampToDate(timestamp: Timestamp): Date {
  return timestamp.toDate();
}

/**
 * Formate un Timestamp Firebase en chaîne de caractères
 * @param timestamp - Le Timestamp à formater
 * @param format - Le format souhaité (par défaut: 'DD/MM/YYYY')
 * @returns Une chaîne formatée
 */
export function formatTimestamp(timestamp: Timestamp, format: string = 'DD/MM/YYYY'): string {
  if (!timestamp) return '';
  
  const date = timestamp.toDate();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'DD/MM/YYYY HH:mm':
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    default:
      return `${day}/${month}/${year}`;
  }
}

/**
 * Vérifie si une valeur est un Timestamp Firebase
 * @param value - La valeur à vérifier
 * @returns true si c'est un Timestamp
 */
export function isTimestamp(value: any): value is Timestamp {
  return value instanceof Timestamp || 
         (value && typeof value === 'object' && value.toDate && typeof value.toDate === 'function');
}

/**
 * Normalise un rendez-vous pour assurer la compatibilité entre les anciens et nouveaux formats
 */
export function normalizeRendezVous(rdv: any): any {
  if (!rdv) return rdv;
  
  const normalized = { ...rdv };
  
  // Conversion date_rdv vers date_rendez_vous si nécessaire
  if (rdv.date_rdv && !rdv.date_rendez_vous) {
    normalized.date_rendez_vous = rdv.date_rdv;
  }
  
  // Conversion des statuts anciens vers nouveaux
  if (rdv.statut === 'confirme') {
    normalized.statut = 'confirmee';
  } else if (rdv.statut === 'termine') {
    normalized.statut = 'terminee';
  }
  
  // Ajouter l'heure par défaut si manquante
  if (!rdv.heure_debut && rdv.date_rendez_vous) {
    normalized.heure_debut = '09:00';
  }
  if (!rdv.heure_fin && rdv.date_rendez_vous) {
    normalized.heure_fin = '10:00';
  }
  
  return normalized;
}

/**
 * Normalise un résultat médical pour assurer la compatibilité entre les anciens et nouveaux formats
 */
export function normalizeResultatMedical(resultat: any): any {
  if (!resultat) return resultat;
  
  const normalized = { ...resultat };
  
  // Conversion date_consultation vers date_resultat si nécessaire
  if (resultat.date_consultation && !resultat.date_resultat) {
    normalized.date_resultat = resultat.date_consultation;
  }
  
  // Assurer que date_resultat existe toujours
  if (!normalized.date_resultat) {
    normalized.date_resultat = resultat.date_creation || Timestamp.now();
  }
  
  // Conversion des statuts anciens vers nouveaux
  if (resultat.statut === 'finalise') {
    normalized.statut = 'disponible';
  } else if (resultat.statut === 'brouillon') {
    normalized.statut = 'en_cours';
  }
  
  // Assurer que le statut est valide
  if (!['en_cours', 'disponible', 'archive'].includes(normalized.statut)) {
    normalized.statut = 'disponible';
  }
  
  // Restructurer les données dans l'objet donnees si nécessaire
  if (!resultat.donnees || typeof resultat.donnees !== 'object') {
    normalized.donnees = {};
  }
  
  // Migrer les propriétés vers donnees
  const propsToMigrate = ['observations', 'diagnostic', 'ordonnance', 'analyses_demandees', 
                         'nom_analyse', 'type_analyse', 'resultats_analyse', 'interpretation', 
                         'recommandations', 'resultats', 'analyses'];
  
  propsToMigrate.forEach(prop => {
    if (resultat[prop] && !normalized.donnees[prop]) {
      normalized.donnees[prop] = resultat[prop];
    }
  });
  
  // Assurer les propriétés requises
  if (!normalized.titre) {
    normalized.titre = resultat.nom_analyse || resultat.type || 'Résultat médical';
  }
  
  if (!normalized.description) {
    normalized.description = resultat.observations || resultat.diagnostic || 'Résultat médical';
  }
  
  if (!normalized.notes) {
    normalized.notes = resultat.notes || '';
  }
  
  return normalized;
}