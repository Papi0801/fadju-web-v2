import { create } from 'zustand';
import { EtablissementSante } from '@/types';
import { EtablissementQueries, etablissementService } from '@/lib/firebase/firestore';

interface EtablissementState {
  etablissements: EtablissementSante[];
  etablissementsEnAttente: EtablissementSante[];
  selectedEtablissement: EtablissementSante | null;
  loading: boolean;
  error: string | null;
}

interface EtablissementActions {
  // Getters
  fetchEtablissements: () => Promise<void>;
  fetchEtablissementsEnAttente: () => Promise<void>;
  fetchEtablissementsByRegion: (region: string) => Promise<void>;
  getEtablissementById: (id: string) => Promise<void>;

  // Setters
  setSelectedEtablissement: (etablissement: EtablissementSante | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // CRUD Operations
  createEtablissement: (data: Omit<EtablissementSante, 'id'>) => Promise<string>;
  updateEtablissement: (id: string, data: Partial<EtablissementSante>) => Promise<void>;
  deleteEtablissement: (id: string) => Promise<void>;
  validateEtablissement: (id: string, statut: 'valide' | 'rejete') => Promise<void>;

  // Utility
  clearError: () => void;
}

type EtablissementStore = EtablissementState & EtablissementActions;

export const useEtablissementStore = create<EtablissementStore>((set, get) => ({
  // État initial
  etablissements: [],
  etablissementsEnAttente: [],
  selectedEtablissement: null,
  loading: false,
  error: null,

  // Getters
  fetchEtablissements: async () => {
    set({ loading: true, error: null });
    try {
      const etablissements = await EtablissementQueries.getEtablissementsValides();
      set({ etablissements, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchEtablissementsEnAttente: async () => {
    set({ loading: true, error: null });
    try {
      const etablissementsEnAttente = await EtablissementQueries.getEtablissementsEnAttente();
      set({ etablissementsEnAttente, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchEtablissementsByRegion: async (region: string) => {
    set({ loading: true, error: null });
    try {
      const etablissements = await EtablissementQueries.getEtablissementsByRegion(region);
      set({ etablissements, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  getEtablissementById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const etablissement = await etablissementService.getById(id);
      set({ selectedEtablissement: etablissement, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  // Setters
  setSelectedEtablissement: (etablissement) => {
    set({ selectedEtablissement: etablissement });
  },

  setLoading: (loading) => {
    set({ loading });
  },

  setError: (error) => {
    set({ error });
  },

  // CRUD Operations
  createEtablissement: async (data) => {
    set({ loading: true, error: null });
    try {
      const id = await etablissementService.create(data);
      
      // Rafraîchir la liste des établissements en attente
      const etablissementsEnAttente = await EtablissementQueries.getEtablissementsEnAttente();
      set({ etablissementsEnAttente, loading: false });
      
      return id;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateEtablissement: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await etablissementService.update(id, data);
      
      // Mettre à jour l'établissement sélectionné s'il correspond
      const { selectedEtablissement } = get();
      if (selectedEtablissement?.id === id) {
        set({ selectedEtablissement: { ...selectedEtablissement, ...data } });
      }
      
      // Rafraîchir les listes
      await get().fetchEtablissements();
      await get().fetchEtablissementsEnAttente();
      
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteEtablissement: async (id) => {
    set({ loading: true, error: null });
    try {
      await etablissementService.delete(id);
      
      // Supprimer de la liste locale
      const { etablissements, etablissementsEnAttente } = get();
      set({
        etablissements: etablissements.filter(e => e.id !== id),
        etablissementsEnAttente: etablissementsEnAttente.filter(e => e.id !== id),
        selectedEtablissement: get().selectedEtablissement?.id === id ? null : get().selectedEtablissement,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  validateEtablissement: async (id, statut) => {
    set({ loading: true, error: null });
    try {
      await etablissementService.update(id, { statut_validation: statut });
      
      // Rafraîchir les listes
      await get().fetchEtablissements();
      await get().fetchEtablissementsEnAttente();
      
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Utility
  clearError: () => {
    set({ error: null });
  },
}));