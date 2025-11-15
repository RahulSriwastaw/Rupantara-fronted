import type { Template, Generation, Transaction, PointsPackage } from '@/types';
import templatesData from '@/data/templates.json';

// Mock delay for realistic API simulation
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Templates API
export const templatesApi = {
  getAll: async (): Promise<Template[]> => {
    await delay();
    return templatesData as Template[];
  },

  getById: async (id: string): Promise<Template | null> => {
    await delay();
    const template = templatesData.find((t) => t.id === id);
    return template as Template || null;
  },

  search: async (query: string): Promise<Template[]> => {
    await delay();
    const lowerQuery = query.toLowerCase();
    return templatesData.filter((t) =>
      t.title.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    ) as Template[];
  },

  getTrending: async (): Promise<Template[]> => {
    await delay();
    return [...templatesData]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10) as Template[];
  },
};

// Generations API
export const generationsApi = {
  create: async (data: {
    templateId?: string;
    prompt: string;
    uploadedImages: string[];
    quality: string;
  }): Promise<Generation> => {
    await delay(2000); // Longer delay for generation
    const generation: Generation = {
      id: `gen_${Date.now()}`,
      userId: 'current_user',
      templateId: data.templateId,
      prompt: data.prompt,
      uploadedImages: data.uploadedImages,
      generatedImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800',
      quality: data.quality as any,
      aspectRatio: '1:1',
      pointsSpent: 20,
      status: 'completed',
      createdAt: new Date().toISOString(),
      isFavorite: false,
      downloadCount: 0,
      shareCount: 0,
    };
    return generation;
  },
};

// Points Packages API
export const pointsPackagesApi = {
  getAll: async (): Promise<PointsPackage[]> => {
    await delay();
    return [
      {
        id: 'pkg_mini',
        name: 'Mini Pack',
        price: 9,
        points: 50,
        bonusPoints: 0,
        badge: 'Best for Beginners',
        benefits: [
          'Generate 2-3 images',
          'Access all free templates',
          'Basic quality (HD)',
        ],
      },
      {
        id: 'pkg_pro',
        name: 'Pro Pack',
        price: 49,
        points: 300,
        bonusPoints: 50,
        badge: '🔥 Most Popular',
        benefits: [
          'Generate 15+ images',
          'Access premium templates',
          'HD & UHD quality',
          'Priority generation queue',
          'Email support',
        ],
        isPopular: true,
      },
      {
        id: 'pkg_ultimate',
        name: 'Ultimate Pack',
        price: 199,
        points: 1500,
        bonusPoints: 300,
        badge: '👑 Best Value',
        benefits: [
          'Generate 75+ images',
          'All premium features',
          'Up to 8K quality',
          'Priority support',
          'Early access to new features',
          'Exclusive templates',
          'No watermarks',
        ],
      },
    ];
  },
};

export default {
  templatesApi,
  generationsApi,
  pointsPackagesApi,
};

