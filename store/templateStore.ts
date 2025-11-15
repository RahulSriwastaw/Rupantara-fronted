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

// Mock template data
const mockTemplates: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: "Cyberpunk Cityscape",
    description: "Vibrant, neon-lit futuristic metropolis with flying vehicles and towering skyscrapers",
    demoImage: "https://images.unsplash.com/photo-1515879218367-8466d29d2d1a?w=400",
    additionalImages: [
      "https://images.unsplash.com/photo-1515879218367-8466d29d2d1a?w=400",
      "https://images.unsplash.com/photo-1515879218367-8466d29d2d1a?w=400"
    ],
    category: "male",
    subCategory: "cinematic",
    tags: ["cyberpunk", "futuristic", "neon", "city"],
    creatorId: "creator_123",
    creatorName: "Demo Creator",
    creatorAvatar: "https://images.unsplash.com/photo-1515879218367-8466d29d2d1a?w=400",
    creatorVerified: true,
    hiddenPrompt: "cyberpunk cityscape, futuristic metropolis, neon lights, flying vehicles, towering skyscrapers, hyperdetailed, 8k",
    visiblePrompt: "A photo of a [subject] in a cyberpunk city",
    negativePrompt: "blurry, watermark, text, ugly, deformed",
    isFree: false,
    pointsCost: 25,
    usageCount: 1250,
    likeCount: 450,
    saveCount: 320,
    rating: 4.8,
    ratingCount: 120,
    ageGroup: "All Ages",
    state: "active",
    status: "approved",
  },
  {
    title: "Enchanted Forest",
    description: "Mystical woods with glowing flora and magical creatures",
    demoImage: "https://images.unsplash.com/photo-1515879218367-8466d29d2d1a?w=400",
    additionalImages: [
      "https://images.unsplash.com/photo-1515879218367-8466d29d2d1a?w=400"
    ],
    category: "female",
    subCategory: "festival",
    tags: ["fantasy", "magic", "forest", "glowing"],
    creatorId: "creator_123",
    creatorName: "Demo Creator",
    creatorAvatar: "https://images.unsplash.com/photo-1515879218367-8466d29d2d1a?w=400",
    creatorVerified: true,
    hiddenPrompt: "enchanted forest, glowing flora, magical creatures, ethereal light, fantasy art, detailed, 8k",
    visiblePrompt: "A photo of a [subject] in an enchanted forest",
    negativePrompt: "blurry, watermark, text, ugly, deformed",
    isFree: true,
    pointsCost: 0,
    usageCount: 850,
    likeCount: 320,
    saveCount: 210,
    rating: 4.6,
    ratingCount: 95,
    ageGroup: "All Ages",
    state: "active",
    status: "approved",
  },
  {
    title: "Steampunk Inventor",
    description: "Portrait of a character with gears, goggles, and mechanical accessories",
    demoImage: "https://images.unsplash.com/photo-1515879218367-8466d29d2d1a?w=400",
    additionalImages: [],
    category: "unisex",
    subCategory: "portrait",
    tags: ["steampunk", "portrait", "mechanical", "victorian"],
    creatorId: "creator_123",
    creatorName: "Demo Creator",
    creatorAvatar: "https://images.unsplash.com/photo-1515879218367-8466d29d2d1a?w=400",
    creatorVerified: true,
    hiddenPrompt: "steampunk inventor portrait, gears, goggles, mechanical accessories, victorian era, detailed, 8k",
    visiblePrompt: "A photo of a [subject] as a steampunk inventor",
    negativePrompt: "blurry, watermark, text, ugly, deformed",
    isFree: false,
    pointsCost: 30,
    usageCount: 420,
    likeCount: 180,
    saveCount: 150,
    rating: 4.3,
    ratingCount: 65,
    ageGroup: "18-35",
    state: "active",
    status: "pending",
  },
  {
    title: "Wedding Dreams",
    description: "Romantic wedding scene with elegant dress and scenic background",
    demoImage: "https://images.unsplash.com/photo-1515879218367-8466d29d2d1a?w=400",
    additionalImages: [
      "https://images.unsplash.com/photo-1515879218367-8466d29d2d1a?w=400",
      "https://images.unsplash.com/photo-1515879218367-8466d29d2d1a?w=400",
      "https://images.unsplash.com/photo-1515879218367-8466d29d2d1a?w=400"
    ],
    category: "female",
    subCategory: "wedding",
    tags: ["wedding", "romantic", "elegant", "dress"],
    creatorId: "creator_123",
    creatorName: "Demo Creator",
    creatorAvatar: "https://images.unsplash.com/photo-1515879218367-8466d29d2d1a?w=400",
    creatorVerified: true,
    hiddenPrompt: "romantic wedding scene, elegant dress, scenic background, soft lighting, cinematic, detailed, 8k",
    visiblePrompt: "A photo of a [subject] at their wedding",
    negativePrompt: "blurry, watermark, text, ugly, deformed",
    isFree: false,
    pointsCost: 35,
    usageCount: 210,
    likeCount: 95,
    saveCount: 75,
    rating: 4.1,
    ratingCount: 40,
    ageGroup: "25-45",
    state: "active",
    status: "rejected",
  }
];

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