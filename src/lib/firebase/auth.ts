import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithEmailAndPassword as signInForRestore,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, secondaryAuth, db } from './config';
import { User, UserRole } from '@/types';
import { COLLECTIONS } from '@/lib/constants';

// Connexion utilisateur
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userData = await getUserData(userCredential.user.uid);
    return userData;
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

// Déconnexion utilisateur
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error('Erreur lors de la déconnexion');
  }
};

// Créer un utilisateur sans affecter la session actuelle
export const createUser = async (
  email: string,
  password: string,
  userData: Omit<User, 'id' | 'date_creation'>
) => {
  try {
    // Utiliser l'instance secondaire pour créer l'utilisateur sans affecter la session principale
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const userId = userCredential.user.uid;

    const newUser: User = {
      id: userId,
      ...userData,
      date_creation: new Date() as any,
    };

    // Sauvegarder les données du nouvel utilisateur
    await setDoc(doc(db, COLLECTIONS.USERS, userId), newUser);
    
    // Déconnecter l'utilisateur de l'instance secondaire (pas nécessaire mais plus propre)
    await signOut(secondaryAuth);
    
    return newUser;
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

// Réinitialiser le mot de passe
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

// Récupérer les données utilisateur
export const getUserData = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
    if (userDoc.exists()) {
      return userDoc.data() as User;
    }
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération des données utilisateur:', error);
    return null;
  }
};

// Observer l'état d'authentification
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      const userData = await getUserData(firebaseUser.uid);
      callback(userData);
    } else {
      callback(null);
    }
  });
};

// Vérifier les permissions utilisateur
export const checkUserPermission = (userRole: UserRole, requiredRole: UserRole[]): boolean => {
  return requiredRole.includes(userRole);
};

// Messages d'erreur personnalisés
const getAuthErrorMessage = (errorCode: string): string => {
  const errorMessages: { [key: string]: string } = {
    'auth/user-not-found': 'Aucun utilisateur trouvé avec cet email',
    'auth/wrong-password': 'Mot de passe incorrect',
    'auth/email-already-in-use': 'Un compte existe déjà avec cet email',
    'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères',
    'auth/invalid-email': 'Adresse email invalide',
    'auth/user-disabled': 'Ce compte a été désactivé',
    'auth/too-many-requests': 'Trop de tentatives. Veuillez réessayer plus tard',
    'auth/network-request-failed': 'Erreur de connexion réseau',
  };

  return errorMessages[errorCode] || 'Une erreur inattendue s\'est produite';
};