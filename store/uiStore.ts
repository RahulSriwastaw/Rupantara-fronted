import { create } from 'zustand';

interface UIState {
  // Template creation wizard
  templateCreationStep: number;
  templateCreationTotalSteps: number;
  setTemplateCreationStep: (step: number) => void;
  nextTemplateCreationStep: () => void;
  prevTemplateCreationStep: () => void;
  resetTemplateCreation: () => void;
  
  // Modals
  isModalOpen: Record<string, boolean>;
  openModal: (modalName: string) => void;
  closeModal: (modalName: string) => void;
  toggleModal: (modalName: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // Template creation wizard
  templateCreationStep: 1,
  templateCreationTotalSteps: 5,
  setTemplateCreationStep: (step) => set({ templateCreationStep: step }),
  nextTemplateCreationStep: () => set((state) => ({
    templateCreationStep: Math.min(state.templateCreationStep + 1, state.templateCreationTotalSteps)
  })),
  prevTemplateCreationStep: () => set((state) => ({
    templateCreationStep: Math.max(state.templateCreationStep - 1, 1)
  })),
  resetTemplateCreation: () => set({ templateCreationStep: 1 }),
  
  // Modals
  isModalOpen: {},
  openModal: (modalName) => set((state) => ({
    isModalOpen: { ...state.isModalOpen, [modalName]: true }
  })),
  closeModal: (modalName) => set((state) => ({
    isModalOpen: { ...state.isModalOpen, [modalName]: false }
  })),
  toggleModal: (modalName) => set((state) => ({
    isModalOpen: { ...state.isModalOpen, [modalName]: !state.isModalOpen[modalName] }
  }))
}));