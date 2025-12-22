/**
 * Minimax I2I API Integration
 * Add this code to your existing services/api.ts file
 */

// Import these if not already in api.ts
// const API_URL = normalizeBackendUrl();
// const getHeaders = () => { ... };

/**
 * Minimax I2I Generation Data Interface
 */
export interface MinimaxI2IGenerationData {
    prompt: string;
    characterImageUrl?: string;
    styleImageUrl?: string;
    templateId?: string;
    aspectRatio?: string;
    n?: number;
    quality?: 'SD' | 'HD' | 'UHD';
    seed?: number;
}

/**
 * Minimax API functions
 * Add this export to your existing api.ts file after the other API exports
 */
export const minimaxApi = {
    /**
     * Generate image with character reference (I2I)
     */
    generateWithCharacter: async (data: MinimaxI2IGenerationData) => {
        // Get API_URL and getHeaders from the parent scope (should be defined in api.ts)
        const API_URL = normalizeBackendUrl(); // You may need to import this
        const getHeaders = (() => {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            return headers;
        });

        const res = await fetch(`${API_URL}/generation/minimax-i2i`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: 'Generation failed' }));
            throw new Error(error.error || 'Generation failed');
        }

        return await res.json();
    },

    /**
     * Generate with character only (simplified)
     */
    generateCharacterOnly: async (
        prompt: string,
        characterImageUrl: string,
        options: Partial<Omit<MinimaxI2IGenerationData, 'prompt' | 'characterImageUrl'>> = {}
    ) => {
        return minimaxApi.generateWithCharacter({
            prompt,
            characterImageUrl,
            ...options
        });
    },

    /**
     * Generate with style reference only
     */
    generateWithStyle: async (
        prompt: string,
        styleImageUrl: string,
        options: Partial<Omit<MinimaxI2IGenerationData, 'prompt' | 'styleImageUrl'>> = {}
    ) => {
        return minimaxApi.generateWithCharacter({
            prompt,
            styleImageUrl,
            ...options
        });
    },

    /**
     * Get available Minimax models and settings
     */
    getModels: async () => {
        const API_URL = normalizeBackendUrl();
        const getHeaders = (() => {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            return headers;
        });

        const res = await fetch(`${API_URL}/generation/minimax/models`, {
            headers: getHeaders()
        });

        if (!res.ok) throw new Error('Failed to fetch models');
        return await res.json();
    }
};

// Helper function (should be in api.ts)
function normalizeBackendUrl() {
    const source = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '').trim();
    if (!source) {
        return 'https://new-backend-g2gw.onrender.com/api/v1';
    }
    try {
        const u = new URL(source);
        if (u.pathname.includes('/api/v1')) {
            return `${u.protocol}//${u.host}${u.pathname}`;
        }
        if (u.pathname.includes('/api')) {
            return `${u.protocol}//${u.host}${u.pathname.replace(/\/api.*$/, '/api/v1')}`;
        }
        return `${u.protocol}//${u.host}/api/v1`;
    } catch {
        const cleaned = source.replace(/\/api.*$/, '').replace(/\/$/, '');
        return `${cleaned}/api/v1`;
    }
}
