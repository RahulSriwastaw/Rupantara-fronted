import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Template, TemplateFilters as Filters } from '@/types';

interface TemplateState {
  templates: Template[];
  savedTemplates: string[];
  likedTemplates: string[];
  filters: Filters;
  searchQuery: string;
  addTemplate: (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTemplate: (id: string, updates: Partial<Template>) => void;
  deleteTemplate: (id: string) => void;
  getTemplatesByStatus: (status: Template['status']) => Template[];
  getTemplateById: (id: string) => Template | undefined;
  toggleSaveTemplate: (templateId: string) => void;
  toggleLikeTemplate: (templateId: string) => void;
  setFilters: (filters: Partial<Filters>) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
}

const mockTemplates: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>[] = [];

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set, get) => ({
      templates: mockTemplates.map((template, index) => ({
        ...template,
        id: `template_${index + 1}`,
        createdAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - index * 12 * 60 * 60 * 1000).toISOString(),
      })),
      savedTemplates: [],
      likedTemplates: [],
      filters: {
        gender: [],
        type: [],
        category: [],
        ageGroup: [],
        sortBy: "trending"
      },
      searchQuery: "",
      
      addTemplate: (templateData) => set((state) => {
        const newTemplate: Template = {
          ...templateData,
          id: `template_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        return {
          templates: [...state.templates, newTemplate]
        };
      }),
      
      updateTemplate: (id, updates) => set((state) => ({
        templates: state.templates.map(template => 
          template.id === id 
            ? { ...template, ...updates, updatedAt: new Date().toISOString() } 
            : template
        )
      })),
      
      deleteTemplate: (id) => set((state) => ({
        templates: state.templates.filter(template => template.id !== id)
      })),
      
      getTemplatesByStatus: (status) => {
        return get().templates.filter(template => template.status === status);
      },
      
      getTemplateById: (id) => {
        return get().templates.find(template => template.id === id);
      },
      
      toggleSaveTemplate: (templateId) => set((state) => {
        const isSaved = state.savedTemplates.includes(templateId);
        return {
          savedTemplates: isSaved
            ? state.savedTemplates.filter(id => id !== templateId)
            : [...state.savedTemplates, templateId]
        };
      }),
      
      toggleLikeTemplate: (templateId) => set((state) => {
        const isLiked = state.likedTemplates.includes(templateId);
        return {
          likedTemplates: isLiked
            ? state.likedTemplates.filter(id => id !== templateId)
            : [...state.likedTemplates, templateId]
        };
      }),
      
      setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters }
      })),
      
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      resetFilters: () => set({
        filters: {
          gender: [],
          type: [],
          category: [],
          ageGroup: [],
          sortBy: "trending"
        },
        searchQuery: ""
      })
    }),
    {
      name: 'rupantar-templates',
    }
  )
);
