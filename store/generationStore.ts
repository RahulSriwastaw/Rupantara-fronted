import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Generation } from '@/types';

interface GenerationState {
  generations: Generation[];
  favorites: Generation[];
  addGeneration: (generation: Generation) => void;
  toggleFavorite: (generationId: string) => void;
  deleteGeneration: (generationId: string) => void;
  getGenerationById: (generationId: string) => Generation | undefined;
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Generation } from '@/types';
import { generationsApi } from '@/services/api';

interface GenerationState {
  generations: Generation[];
  favorites: Generation[];
  isLoading: boolean;

  fetchGenerations: () => Promise<void>;
  addGeneration: (generation: Generation) => void;
  toggleFavorite: (generationId: string) => Promise<void>;
  deleteGeneration: (generationId: string) => Promise<void>;
  getGenerationById: (generationId: string) => Generation | undefined;
}

export const useGenerationStore = create<GenerationState>()(
  persist(
    (set, get) => ({
      generations: [],
      favorites: [],
      isLoading: false,

      fetchGenerations: async () => {
        set({ isLoading: true });
        try {
          const response = await generationsApi.getHistory(1, 50);
          set({
            generations: response.generations || [],
            // We can filter favorites from the full list if the API returns that flag
            favorites: (response.generations || []).filter((g: Generation) => g.isFavorite),
            isLoading: false
          });
        } catch (error) {
          console.error('Failed to fetch generations:', error);
          set({ isLoading: false });
        }
      },

      addGeneration: (generation) => {
        set((state) => ({
          generations: [generation, ...state.generations],
        }));
      },

      toggleFavorite: async (generationId) => {
        // Optimistic update
        set((state) => {
          const generations = state.generations.map((gen) =>
            gen.id === generationId
              ? { ...gen, isFavorite: !gen.isFavorite }
              : gen
          );
          const favorites = generations.filter((gen) => gen.isFavorite);
          return { generations, favorites };
        });

        // TODO: Call API to toggle favorite
        // await generationsApi.toggleFavorite(generationId);
      },

      deleteGeneration: async (generationId) => {
        // Optimistic update
        set((state) => ({
          generations: state.generations.filter((gen) => gen.id !== generationId),
          favorites: state.favorites.filter((gen) => gen.id !== generationId),
        }));

        // TODO: Call API to delete
        // await generationsApi.delete(generationId);
      },

      getGenerationById: (generationId) => {
        return get().generations.find((gen) => gen.id === generationId);
      },
    }),
    {
      name: 'rupantar-generations',
    }
  )
);

