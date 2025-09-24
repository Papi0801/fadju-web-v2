import { create } from 'zustand';
import { RendezVous } from '@/types';
import { RendezVousQueries, rendezVousService } from '@/lib/firebase/firestore';

interface RendezVousState {
  rendezVous: RendezVous[];
  rendezVousEnAttente: RendezVous[];
  rendezVousAujourdhui: RendezVous[];
  selectedRendezVous: RendezVous | null;
  loading: boolean;
  error: string | null;
}

interface RendezVousActions {
  // Getters
  fetchRendezVousByMedecin: (medecinId: string) => Promise<void>;
  fetchRendezVousEnAttenteByEtablissement: (etablissementId: string) => Promise<void>;
  fetchRendezVousByPatient: (patientId: string) => Promise<void>;
  fetchRendezVousAujourdhui: (medecinId: string) => Promise<void>;
  getRendezVousById: (id: string) => Promise<void>;

  // Setters
  setSelectedRendezVous: (rendezVous: RendezVous | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // CRUD Operations
  createRendezVous: (data: Omit<RendezVous, 'id'>) => Promise<string>;
  updateRendezVous: (id: string, data: Partial<RendezVous>) => Promise<void>;
  deleteRendezVous: (id: string) => Promise<void>;
  confirmerRendezVous: (id: string, medecinId: string) => Promise<void>;
  annulerRendezVous: (id: string, motif?: string) => Promise<void>;

  // Utility
  clearError: () => void;
}

type RendezVousStore = RendezVousState & RendezVousActions;

export const useRendezVousStore = create<RendezVousStore>((set, get) => ({
  // État initial
  rendezVous: [],
  rendezVousEnAttente: [],
  rendezVousAujourdhui: [],
  selectedRendezVous: null,
  loading: false,
  error: null,

  // Getters
  fetchRendezVousByMedecin: async (medecinId: string) => {
    set({ loading: true, error: null });
    try {
      const rendezVous = await RendezVousQueries.getRendezVousByMedecin(medecinId);
      set({ rendezVous, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchRendezVousEnAttenteByEtablissement: async (etablissementId: string) => {
    set({ loading: true, error: null });
    try {
      const rendezVousEnAttente = await RendezVousQueries.getRendezVousEnAttenteByEtablissement(etablissementId);
      set({ rendezVousEnAttente, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchRendezVousByPatient: async (patientId: string) => {
    set({ loading: true, error: null });
    try {
      const rendezVous = await RendezVousQueries.getRendezVousByPatient(patientId);
      set({ rendezVous, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchRendezVousAujourdhui: async (medecinId: string) => {
    set({ loading: true, error: null });
    try {
      const rendezVousAujourdhui = await RendezVousQueries.getRendezVousAujourdhui(medecinId);
      set({ rendezVousAujourdhui, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  getRendezVousById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const rendezVous = await rendezVousService.getById(id);
      set({ selectedRendezVous: rendezVous, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  // Setters
  setSelectedRendezVous: (rendezVous) => {
    set({ selectedRendezVous: rendezVous });
  },

  setLoading: (loading) => {
    set({ loading });
  },

  setError: (error) => {
    set({ error });
  },

  // CRUD Operations
  createRendezVous: async (data) => {
    set({ loading: true, error: null });
    try {
      const id = await rendezVousService.create(data);
      set({ loading: false });
      return id;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateRendezVous: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await rendezVousService.update(id, data);

      // Mettre à jour le rendez-vous sélectionné s'il correspond
      const { selectedRendezVous } = get();
      if (selectedRendezVous?.id === id) {
        set({ selectedRendezVous: { ...selectedRendezVous, ...data } });
      }

      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteRendezVous: async (id) => {
    set({ loading: true, error: null });
    try {
      await rendezVousService.delete(id);

      // Supprimer de toutes les listes locales
      const { rendezVous, rendezVousEnAttente, rendezVousAujourdhui } = get();
      set({
        rendezVous: rendezVous.filter(rv => rv.id !== id),
        rendezVousEnAttente: rendezVousEnAttente.filter(rv => rv.id !== id),
        rendezVousAujourdhui: rendezVousAujourdhui.filter(rv => rv.id !== id),
        selectedRendezVous: get().selectedRendezVous?.id === id ? null : get().selectedRendezVous,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  confirmerRendezVous: async (id, medecinId) => {
    set({ loading: true, error: null });
    try {
      await rendezVousService.update(id, {
        statut: 'confirme' as any,
        medecin_id: medecinId,
      });

      // Mettre à jour les listes locales
      const updateRendezVous = (rv: RendezVous) =>
        rv.id === id ? { ...rv, statut: 'confirme' as const, medecin_id: medecinId } : rv;

      const { rendezVous, rendezVousEnAttente, rendezVousAujourdhui } = get();
      set({
        rendezVous: ((rendezVous as any) || []).map(updateRendezVous),
        rendezVousEnAttente: ((rendezVousEnAttente as any) || []).filter((rv: { id: string; }) => rv.id !== id),
        rendezVousAujourdhui: ((rendezVousAujourdhui as any) || []).map(updateRendezVous),
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  annulerRendezVous: async (id, motif) => {
    set({ loading: true, error: null });
    try {
      await rendezVousService.update(id, {
        statut: 'annule' as any,
        notes_secretaire: motif || 'Rendez-vous annulé',
      });

      // Mettre à jour les listes locales
      const updateRendezVous = (rv: RendezVous) =>
        rv.id === id ? { ...rv, statut: 'annule' as const, notes_secretaire: motif } : rv;

      const { rendezVous, rendezVousEnAttente, rendezVousAujourdhui } = get();
      set({
        rendezVous: ((rendezVous as any) || []).map(updateRendezVous),
        rendezVousEnAttente: ((rendezVousEnAttente as any) || []).map(updateRendezVous),
        rendezVousAujourdhui: ((rendezVousAujourdhui as any) || []).map(updateRendezVous),
        loading: false,
      });
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
