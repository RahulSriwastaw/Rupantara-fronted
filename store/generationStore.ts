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

export const useGenerationStore = create<GenerationState>()(
  persist(
    (set, get) => ({
      generations: [],
      favorites: [],
      
      addGeneration: (generation) => {
        set((state) => ({
          generations: [generation, ...state.generations],
        }));
      },
      
      toggleFavorite: (generationId) => {
        set((state) => {
          const generations = state.generations.map((gen) =>
            gen.id === generationId
              ? { ...gen, isFavorite: !gen.isFavorite }
              : gen
          );
          const favorites = generations.filter((gen) => gen.isFavorite);
          return { generations, favorites };
        });
      },
      
      deleteGeneration: (generationId) => {
        set((state) => ({
          generations: state.generations.filter((gen) => gen.id !== generationId),
          favorites: state.favorites.filter((gen) => gen.id !== generationId),
        }));
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

