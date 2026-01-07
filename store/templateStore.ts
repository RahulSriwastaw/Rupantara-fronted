import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Template, TemplateFilters as Filters } from '@/types';
import { creatorApi, templatesApi } from '@/services/api';

interface TemplateState {
  templates: Template[];
  savedTemplates: string[];
  likedTemplates: string[];
  filters: Filters;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  totalTemplates: number;
  currentPage: number;
  totalPages: number;

  // Actions
  fetchCreatorTemplates: (status?: string, sort?: string, page?: number) => Promise<void>;
  addTemplate: (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => void;
  createTemplate: (data: {
    title: string;
    description?: string;
    imageUrl: string;
    category?: string;
    subCategory?: string;
    prompt?: string;
    negativePrompt?: string;
    tags?: string[];
    gender?: string;
    isPremium?: boolean;
  }) => Promise<boolean>;
  updateTemplate: (id: string, updates: Partial<Template>) => void;
  deleteTemplate: (id: string) => void;
  getTemplatesByStatus: (status: Template['status']) => Template[];
  getTemplateById: (id: string) => Template | undefined;
  toggleSaveTemplate: (templateId: string) => void;
  toggleLikeTemplate: (templateId: string) => Promise<void>;
  updateLikeStatus: (templateId: string, isLiked: boolean) => void; // Update store without API call
  updateSaveStatus: (templateId: string, isSaved: boolean) => void; // Update store without API call
  setFilters: (filters: Partial<Filters>) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
}

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set, get) => ({
      templates: [],
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
      isLoading: false,
      error: null,
      totalTemplates: 0,
      currentPage: 1,
      totalPages: 1,

      fetchCreatorTemplates: async (status, sort = 'recent', page = 1) => {
        set({ isLoading: true, error: null });
        try {
          const data = await creatorApi.getTemplates(status, sort, page, 20);
          const templates = (data.templates || []).map((t: any) => ({
            id: t.id || t._id,
            title: t.title,
            description: t.description || '',
            image: t.image || t.imageUrl || t.demoImage || '',
            demoImage: t.demoImage || t.imageUrl || t.image || '',
            inputImage: t.inputImage || t.inputImageUrl || '',  // ✅ Include inputImage
            additionalImages: t.additionalImages || [],
            category: t.category || 'unisex',
            subCategory: t.subCategory || 'other',
            tags: t.tags || [],
            creatorId: t.creatorId || '',
            creatorName: t.creatorName || 'Creator',
            creatorAvatar: t.creatorAvatar || '',
            creatorBio: t.creatorBio || '',
            creatorVerified: t.creatorVerified || false,
            hiddenPrompt: t.hiddenPrompt || t.prompt || '',
            visiblePrompt: t.visiblePrompt || t.title || '',
            negativePrompt: t.negativePrompt || '',
            isFree: t.isFree !== undefined ? t.isFree : !t.isPremium,
            pointsCost: t.pointsCost ?? 0,
            usageCount: t.usageCount ?? 0,
            views: t.views ?? 0,
            earnings: t.earnings ?? 0,
            likeCount: t.likeCount ?? 0,
            saveCount: t.saveCount ?? 0,
            rating: t.rating ?? 0,
            ratingCount: t.ratingCount ?? 0,
            ageGroup: t.ageGroup,
            state: t.state,
            createdAt: t.createdAt || new Date().toISOString(),
            updatedAt: t.updatedAt || new Date().toISOString(),
            status: t.status || 'approved',
          }));
          set({
            templates,
            totalTemplates: data.total || templates.length,
            currentPage: data.page || page,
            totalPages: data.totalPages || 1,
            isLoading: false
          });
        } catch (error: any) {
          console.error('Failed to fetch creator templates:', error);
          set({
            isLoading: false,
            error: error.message || 'Failed to fetch templates'
          });
        }
      },

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

      createTemplate: async (data) => {
        set({ isLoading: true, error: null });
        try {
          await creatorApi.createTemplate(data);
          // Refresh templates list
          await get().fetchCreatorTemplates();
          set({ isLoading: false });
          return true;
        } catch (error: any) {
          console.error('Failed to create template:', error);
          set({
            isLoading: false,
            error: error.message || 'Failed to create template'
          });
          return false;
        }
      },

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

      toggleLikeTemplate: async (templateId) => {
        const state = get();
        const isLiked = state.likedTemplates.includes(templateId);

        try {
          // Call API to toggle like/unlike
          const response = await templatesApi.likeTemplate(templateId);
          if (response.success) {
            // Update store based on backend response
            const currentLiked = new Set(state.likedTemplates);
            if (response.liked) {
              // Add to liked if not already there
              if (!currentLiked.has(templateId)) {
                set({
                  likedTemplates: [...state.likedTemplates, templateId]
                });
              }
            } else {
              // Remove from liked if present
              if (currentLiked.has(templateId)) {
                set({
                  likedTemplates: state.likedTemplates.filter(id => id !== templateId)
                });
              }
            }
          }
        } catch (err) {
          console.error("Failed to sync like", err);
          // Don't update local state on error - let backend response handle it
          // This prevents race conditions
        }
      },

      // Update like status in store without API call (used after API call succeeds)
      updateLikeStatus: (templateId, isLiked) => {
        const state = get();
        const currentLiked = new Set(state.likedTemplates);
        
        if (isLiked) {
          // Add to liked if not already there
          if (!currentLiked.has(templateId)) {
            set({
              likedTemplates: [...state.likedTemplates, templateId]
            });
          }
        } else {
          // Remove from liked if present
          if (currentLiked.has(templateId)) {
            set({
              likedTemplates: state.likedTemplates.filter(id => id !== templateId)
            });
          }
        }
      },

      // Update save status in store without API call (used after API call succeeds)
      updateSaveStatus: (templateId, isSaved) => {
        const state = get();
        const currentSaved = new Set(state.savedTemplates);
        
        if (isSaved) {
          // Add to saved if not already there
          if (!currentSaved.has(templateId)) {
            set({
              savedTemplates: [...state.savedTemplates, templateId]
            });
          }
        } else {
          // Remove from saved if present
          if (currentSaved.has(templateId)) {
            set({
              savedTemplates: state.savedTemplates.filter(id => id !== templateId)
            });
          }
        }
      },

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
      partialize: (state) => ({
        savedTemplates: state.savedTemplates,
        likedTemplates: state.likedTemplates,
        filters: state.filters,
        searchQuery: state.searchQuery,
      }),
    }
  )
);
