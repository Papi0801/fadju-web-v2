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
 * Normalise un rendez-vous pour assurer la compatibilité avec les anciennes données
 * @param rdv - Le rendez-vous brut de Firestore
 * @returns Le rendez-vous normalisé
 */
export function normalizeRendezVous(rdv: any): any {
  if (!rdv) return rdv;

  console.log('🔍 Normalisation RDV avant:', rdv.id, {
    date_rdv: rdv.date_rdv ? 'existe' : 'manque',
    date_rendez_vous: rdv.date_rendez_vous ? 'existe' : 'manque',
    heure_debut: rdv.heure_debut,
    heure_fin: rdv.heure_fin,
    statut: rdv.statut
  });

  const normalized = { ...rdv };

  // Compatibilité date_rdv -> date_rendez_vous
  if (rdv.date_rdv && !rdv.date_rendez_vous) {
    normalized.date_rendez_vous = rdv.date_rdv;
    console.log('✅ Copie date_rdv vers date_rendez_vous');
  }

  // Compatibilité statut 'confirme' -> 'confirmee' et 'termine' -> 'terminee'
  if (rdv.statut === 'confirme') {
    normalized.statut = 'confirmee';
    console.log('✅ Statut confirme -> confirmee');
  } else if (rdv.statut === 'termine') {
    normalized.statut = 'terminee';
    console.log('✅ Statut termine -> terminee');
  }

  // S'assurer que les heures sont définies
  if (!normalized.heure_debut || normalized.heure_debut === undefined) {
    normalized.heure_debut = '09:00';
    console.log('✅ Heure début par défaut: 09:00');
  }
  if (!normalized.heure_fin || normalized.heure_fin === undefined) {
    normalized.heure_fin = '10:00';
    console.log('✅ Heure fin par défaut: 10:00');
  }

  console.log('🔍 Normalisation RDV après:', {
    date_rendez_vous: normalized.date_rendez_vous ? 'existe' : 'manque',
    heure_debut: normalized.heure_debut,
    heure_fin: normalized.heure_fin,
    statut: normalized.statut
  });

  return normalized;
}

/**
 * Normalise un résultat médical pour assurer la compatibilité
 * @param resultat - Le résultat brut de Firestore
 * @returns Le résultat normalisé
 */
export function normalizeResultatMedical(resultat: any): any {
  if (!resultat) return resultat;

  const normalized = { ...resultat };

  // Compatibilité date_consultation -> date_resultat
  if (resultat.date_consultation && !resultat.date_resultat) {
    normalized.date_resultat = resultat.date_consultation;
  }

  // S'assurer que les champs obligatoires existent
  if (!normalized.description) {
    normalized.description = normalized.observations || 'Résultat médical';
  }

  if (!normalized.notes) {
    normalized.notes = '';
  }

  if (!normalized.donnees) {
    normalized.donnees = {
      observations: normalized.observations || '',
      ordonnance: normalized.ordonnance || normalized.traitement_prescrit || '',
      diagnostic: normalized.diagnostic || '',
      analyses: normalized.analyses_demandees || ''
    };
  }

  // Compatibilité statut
  if (normalized.statut === 'finalise') {
    normalized.statut = 'disponible';
  }

  return normalized;
}