import type { Template, TemplateCategory, TemplateSubCategory } from "@/types";
import { getApiUrl } from "@/lib/config";

// Use centralized config for API URL (handles mobile builds properly)
const API_URL = getApiUrl();
const API_TIMEOUT = 30000; // 30 seconds
const GENERATION_TIMEOUT = 180000; // 3 minutes for image generation (Replicate can take longer)

// Debug logging (always log in mobile/Capacitor for debugging)
if (typeof window !== 'undefined') {
  const isMobile = (window as any).Capacitor ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile || process.env.NODE_ENV === 'development') {
    console.log('🔗 API Configuration:', {
      API_URL,
      NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      isMobile,
      hasCapacitor: !!(window as any).Capacitor,
    });
  }
}

// Helper function to create a timeout promise
const timeout = (ms: number) => new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Request timeout')), ms)
);

// Helper to get auth headers
const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  // Try to get token from localStorage (custom auth) or you might need to integrate with Firebase auth state
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  async get(endpoint: string) {
    try {
      const fullUrl = `${API_URL}${endpoint}`;
      if (process.env.NODE_ENV === 'development') {
        console.log('📡 GET Request:', fullUrl);
      }

      const response = await Promise.race([
        fetch(`${API_URL}${endpoint}`, {
          headers: getHeaders(),
        }),
        timeout(API_TIMEOUT) as Promise<Response>
      ]);

      if (!response.ok) {
        // Check for specific backend messages
        const errorMessage = error.message || error.error || error.msg || error.details;

        // Handle 404 errors gracefully
        if (response.status === 404) {
          if (endpoint === '/templates' || endpoint.startsWith('/templates')) {
            console.warn('Templates endpoint not found, returning empty array');
            return [];
          }
          throw new Error(errorMessage || 'The requested resource was not found.');
        }

        // Handle 403 Forbidden (CORS or Auth)
        if (response.status === 403) {
          throw new Error(errorMessage || 'Access denied (CORS or Permissions).');
        }

        // Handle 500 errors
        if (response.status >= 500) {
          throw new Error(errorMessage || 'Server error. Please try again later.');
        }

        throw new Error(errorMessage || `API request failed: ${response.status}`);
      }
      return response.json();
    } catch (error: any) {
      if (error.message === 'Request timeout') {
        throw new Error('Request timeout. Please check your connection and try again.');
      }
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      }
      throw error;
    }
  },

  async post(endpoint: string, data: any) {
    try {
      const response = await Promise.race([
        fetch(`${API_URL}${endpoint}`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(data),
        }),
        timeout(API_TIMEOUT) as Promise<Response>
      ]);

      if (!response.ok) {
        // Check for specific backend messages
        const errorMessage = error.msg || error.message || error.error || error.details;

        // Handle 404 errors with user-friendly messages
        if (response.status === 404) {
          throw new Error(errorMessage || 'Resource not found. Please try again.');
        }

        // Handle 403 Forbidden
        if (response.status === 403) {
          throw new Error(errorMessage || 'Access denied (CORS or Permissions).');
        }

        // Handle 401 Unauthorized
        if (response.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
          }
          throw new Error(errorMessage || 'Session expired. Please login again.');
        }

        // Handle 400 Bad Request
        if (response.status === 400) {
          throw new Error(errorMessage || 'Invalid request. Please check your input.');
        }

        // Handle 500 errors
        if (response.status >= 500) {
          throw new Error(errorMessage || 'Server error. Please try again later.');
        }

        throw new Error(errorMessage || `API request failed: ${response.status}`);
      }
      return response.json();
    } catch (error: any) {
      if (error.message === 'Request timeout') {
        throw new Error('Request timeout. Please check your connection and try again.');
      }
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      }
      throw error;
    }
  },

  async put(endpoint: string, data: any) {
    try {
      const response = await Promise.race([
        fetch(`${API_URL}${endpoint}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(data),
        }),
        timeout(API_TIMEOUT) as Promise<Response>
      ]);

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: `API request failed: ${response.status} ${response.statusText}`
        }));
        throw new Error(error.message || error.error || `PUT request failed: ${response.status}`);
      }
      return response.json();
    } catch (error: any) {
      if (error.message === 'Request timeout') {
        throw new Error('Request timeout. Please check your connection and try again.');
      }
      throw error;
    }
  },

  async delete(endpoint: string) {
    try {
      const response = await Promise.race([
        fetch(`${API_URL}${endpoint}`, {
          method: 'DELETE',
          headers: getHeaders(),
        }),
        timeout(API_TIMEOUT) as Promise<Response>
      ]);

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: `API request failed: ${response.status} ${response.statusText}`
        }));
        throw new Error(error.message || error.error || `DELETE request failed: ${response.status}`);
      }
      return response.json();
    } catch (error: any) {
      if (error.message === 'Request timeout') {
        throw new Error('Request timeout. Please check your connection and try again.');
      }
      throw error;
    }
  }
};

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; fullName: string; phone?: string; photoURL?: string; firebaseUid?: string; name?: string }) =>
    api.post('/auth/register', {
      name: data.name || data.fullName,
      email: data.email,
      password: data.password,
      phone: data.phone,
      photoURL: data.photoURL,
      firebaseUid: data.firebaseUid,
    }),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  syncUser: (firebaseToken: string) =>
    api.post('/auth/firebase-login', { idToken: firebaseToken }),
  socialLogin: (provider: 'google' | 'facebook', email?: string, name?: string) =>
    api.post('/auth/social-login', { provider, email, name }),
  getMe: () => api.get('/auth/me'),
};

// Templates API
export const templatesApi = {
  getAll: async (queryString: string = ''): Promise<Template[]> => {
    // Use public endpoint with search/filter support
    const endpoint = queryString ? `/templates?${queryString}` : '/templates';
    const list = await api.get(endpoint);
    const arr = Array.isArray(list) ? list : [];
    return arr.map((t: any) => ({
      id: String(t.id || t._id || ''),
      title: String(t.title || t.name || 'Template'),
      description: String(t.description || t.prompt || ''),
      image: String(t.image || t.imageUrl || t.demoImage || ''),
      demoImage: String(t.demoImage || t.imageUrl || t.image || ''),
      inputImage: String(t.inputImage || t.inputImageUrl || ''),  // ✅ Include inputImage
      additionalImages: Array.isArray(t.additionalImages) ? t.additionalImages : [],
      category: (String(t.category || 'unisex') as TemplateCategory),
      subCategory: (String(t.subCategory || 'other') as TemplateSubCategory),
      tags: Array.isArray(t.tags) ? t.tags.map((x: any) => String(x)) : [],
      creatorId: String(t.creatorId || ''),
      creatorName: String(t.creatorName || 'Creator'),
      creatorAvatar: String(t.creatorAvatar || ''),
      creatorBio: String(t.creatorBio || ''),
      creatorVerified: Boolean(t.creatorVerified || false),
      hiddenPrompt: String(t.hiddenPrompt || t.prompt || ''),
      visiblePrompt: String(t.visiblePrompt || t.title || ''),
      negativePrompt: String(t.negativePrompt || ''),
      isFree: Boolean(t.isFree !== undefined ? t.isFree : !t.isPremium),
      pointsCost: Number(t.pointsCost ?? 0),
      usageCount: Number(t.usageCount ?? t.useCount ?? 0),
      views: Number(t.views ?? 0),
      earnings: Number(t.earnings ?? 0),
      likeCount: Number(t.likeCount ?? 0),
      saveCount: Number(t.saveCount ?? t.savesCount ?? 0), // Backend uses savesCount
      isLiked: Boolean(t.isLiked || false), // Include like status from backend
      isSaved: Boolean(t.isSaved || false), // Include save status from backend
      rating: Number(t.rating ?? 0),
      ratingCount: Number(t.ratingCount ?? 0),
      ageGroup: t.ageGroup ? String(t.ageGroup) : undefined,
      state: t.state ? String(t.state) : undefined,
      createdAt: String(t.createdAt || new Date().toISOString()),
      updatedAt: String(t.updatedAt || new Date().toISOString()),
      status: (String(t.status || 'active') as Template['status']),
      // Approval Workflow
      approvalStatus: (String(t.approvalStatus || (t.status === 'active' ? 'approved' : 'pending')) as Template['approvalStatus']),
      rejectionReason: t.rejectionReason ? String(t.rejectionReason) : undefined,
      approvedAt: t.approvedAt ? String(t.approvedAt) : undefined,
      rejectedAt: t.rejectedAt ? String(t.rejectedAt) : undefined,
      submittedAt: t.submittedAt ? String(t.submittedAt) : undefined,
      // Display & Features
      isFeatured: Boolean(t.isFeatured || false),
      isPaused: Boolean(t.isPaused || false),
      // Template Type & Source
      type: (String(t.type || (t.isOfficial ? 'Official' : 'Creator')) as Template['type']),
      source: (String(t.source || (t.isOfficial ? 'admin' : 'creator')) as Template['source']),
      isOfficial: Boolean(t.isOfficial || t.type === 'Official' || t.source === 'admin'),
    }));
  },
  getById: async (id: string): Promise<Template | null> => {
    const list = await templatesApi.getAll();
    return list.find(t => t.id === id) || null;
  },
  adminUploadDemo: async (dataUrl: string) => {
    const blob = await fetch(dataUrl).then(r => r.blob())
    const fd = new FormData()
    fd.append('image', blob, 'demo.png')
    // Note: FormData needs special handling for headers (no Content-Type, browser sets it with boundary)
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Use the base API URL without /api for admin upload
    const baseUrl = API_URL.replace('/api', '');
    const res = await fetch(`${baseUrl}/api/admin/upload/template-demo`, {
      method: 'POST',
      headers,
      body: fd
    })
    if (!res.ok) throw new Error('Upload failed')
    return res.json()
  },
  adminCreateTemplate: (payload: any) => api.post('/admin/templates', payload),
  creatorSubmitTemplate: (payload: any) => api.post('/creator/templates', payload),
  creatorGetTemplates: () => api.get('/creator/templates'),
  creatorUpdateTemplate: (id: string, payload: any) => api.put(`/creator/templates/${id}`, payload),
  creatorDeleteTemplate: (id: string) => api.delete(`/creator/templates/${id}`),
  likeTemplate: (id: string) => api.post(`/templates/${id}/like`, {}),
  saveTemplate: (id: string) => api.post(`/templates/${id}/save`, {}),
  getSavedTemplates: async (page?: number, limit?: number) => {
    try {
      console.log('🔍 Fetching saved templates...');
      const response = await api.get(`/templates/saved?page=${page || 1}&limit=${limit || 50}`);
      console.log('📦 Saved templates response:', response);

      if (response && response.templates) {
        const arr = Array.isArray(response.templates) ? response.templates : [];
        console.log(`✅ Found ${arr.length} saved templates`);

        const mappedTemplates = arr.map((t: any) => ({
          id: String(t.id || t._id || ''),
          title: String(t.title || t.name || 'Template'),
          description: String(t.description || t.prompt || ''),
          image: String(t.image || t.imageUrl || t.demoImage || ''),
          demoImage: String(t.demoImage || t.imageUrl || t.image || ''),
          inputImage: String(t.inputImage || t.inputImageUrl || ''),
          additionalImages: Array.isArray(t.additionalImages) ? t.additionalImages : [],
          category: (String(t.category || 'unisex') as TemplateCategory),
          subCategory: (String(t.subCategory || 'other') as TemplateSubCategory),
          tags: Array.isArray(t.tags) ? t.tags.map((x: any) => String(x)) : [],
          creatorId: String(t.creatorId || ''),
          creatorName: String(t.creatorName || 'Creator'),
          creatorAvatar: String(t.creatorAvatar || ''),
          creatorBio: String(t.creatorBio || ''),
          creatorVerified: Boolean(t.creatorVerified || false),
          hiddenPrompt: String(t.hiddenPrompt || t.prompt || ''),
          visiblePrompt: String(t.visiblePrompt || t.title || ''),
          negativePrompt: String(t.negativePrompt || ''),
          isFree: Boolean(t.isFree !== undefined ? t.isFree : !t.isPremium),
          pointsCost: Number(t.pointsCost ?? 0),
          usageCount: Number(t.usageCount ?? t.useCount ?? 0),
          views: Number(t.views ?? 0),
          earnings: Number(t.earnings ?? 0),
          likeCount: Number(t.likeCount ?? 0),
          saveCount: Number(t.saveCount ?? t.savesCount ?? 0), // Backend uses savesCount
          isLiked: Boolean(t.isLiked || false),
          isSaved: true, // Always true for saved templates endpoint
          rating: Number(t.rating ?? 0),
          ratingCount: Number(t.ratingCount ?? 0),
          ageGroup: t.ageGroup ? String(t.ageGroup) : undefined,
          state: t.state ? String(t.state) : undefined,
          createdAt: String(t.createdAt || new Date().toISOString()),
          updatedAt: String(t.updatedAt || new Date().toISOString()),
          status: (String(t.status || 'active') as Template['status']),
          approvalStatus: (String(t.approvalStatus || (t.status === 'active' ? 'approved' : 'pending')) as Template['approvalStatus']),
          rejectionReason: t.rejectionReason ? String(t.rejectionReason) : undefined,
          approvedAt: t.approvedAt ? String(t.approvedAt) : undefined,
          rejectedAt: t.rejectedAt ? String(t.rejectedAt) : undefined,
          submittedAt: t.submittedAt ? String(t.submittedAt) : undefined,
          isFeatured: Boolean(t.isFeatured || false),
          isPaused: Boolean(t.isPaused || false),
          type: (String(t.type || (t.isOfficial ? 'Official' : 'Creator')) as Template['type']),
          source: (String(t.source || (t.isOfficial ? 'admin' : 'creator')) as Template['source']),
          isOfficial: Boolean(t.isOfficial || t.type === 'Official' || t.source === 'admin'),
        }));

        return {
          ...response,
          templates: mappedTemplates
        };
      }

      console.log('⚠️ No templates in response, returning empty');
      return { templates: [] };
    } catch (error) {
      console.error('❌ Error in getSavedTemplates:', error);
      throw error;
    }
  },
  viewTemplate: (id: string) => api.post(`/templates/${id}/view`, {}),
  shareTemplate: (id: string, platform?: string) => api.post(`/templates/${id}/share`, { platform }),
};

// Category API
export const categoryApi = {
  getAll: async () => {
    const response = await api.get('/categories');
    // Handle both old array format and new {success, categories} format
    if (Array.isArray(response)) {
      return response;
    }
    return response.categories || [];
  },
  adminCreate: (payload: any) => api.post('/admin/categories', payload),
  adminUpdate: (id: string, payload: any) => api.put(`/admin/categories/${id}`, payload),
  adminDelete: (id: string) => api.delete(`/admin/categories/${id}`),
  adminSeed: () => api.post('/admin/categories/seed', {})
};

export const userApi = {
  followUser: (id: string) => api.post(`/user/follow/${id}`, {}),
};

// Payments API
export const paymentsApi = {
  getActiveGateway: () => api.get('/payment/active-gateway').then(res => res.provider),
  verifyStripe: (data: { sessionId: string }) => api.post('/payment/verify-stripe', data),
  createOrder: (packageId: string, gateway: 'razorpay' | 'stripe' = 'razorpay') =>
    api.post('/payment/create-order', { packageId, gateway }),
  verifyRazorpay: (data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; packageId: string }) =>
    api.post('/payment/verify-razorpay', data),
  // Legacy support - maps to createOrder
  createStripeIntent: (packageId: string) =>
    api.post('/payment/create-order', { packageId, gateway: 'stripe' }),
  createRazorpayOrder: (packageId: string) =>
    api.post('/payment/create-order', { packageId, gateway: 'razorpay' }),
};

// Packages API
export const packagesApi = {
  list: () => api.get('/packages'),
};

// Subscriptions API
export const subscriptionApi = {
  getPlans: () => api.get('/subscriptions/plans').then(res => res.plans || []),
  getCurrent: () => api.get('/subscriptions/current').then(res => res.subscription),
  subscribe: (data: { planId: string; billingCycle: 'monthly' | 'quarterly' | 'yearly'; gateway?: 'razorpay' | 'stripe'; promoCode?: string }) =>
    api.post('/subscriptions/subscribe', data),
  verifyPayment: (data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; subscriptionId: string }) =>
    api.post('/subscriptions/verify-payment', data),
  cancel: () => api.post('/subscriptions/cancel', {}),
  getPaymentHistory: () => api.get('/subscriptions/payment-history').then(res => res.payments || []),
};

// Generations API
export const generationsApi = {
  getCosts: (templateId?: string) => {
    const params = templateId ? `?templateId=${templateId}` : '';
    return api.get(`/generation/costs${params}`);
  },
  downloadProxy: async (imageUrl: string) => {
    // Handle data URLs directly (no proxy needed)
    if (imageUrl.startsWith('data:')) {
      // Convert data URL to blob
      const response = await fetch(imageUrl);
      return response.blob();
    }

    // For regular URLs, use proxy
    try {
      const res = await fetch(`${API_URL}/proxy?url=${encodeURIComponent(imageUrl)}`, {
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });
      if (!res.ok) {
        throw new Error(`Download failed: ${res.status} ${res.statusText}`);
      }
      return res.blob();
    } catch (error: any) {
      // If proxy fails, try direct download as fallback
      if (error.name === 'AbortError' || error.message?.includes('timeout')) {
        console.warn('Proxy timeout, trying direct download...');
        try {
          const directRes = await fetch(imageUrl, {
            signal: AbortSignal.timeout(30000)
          });
          if (!directRes.ok) throw new Error(`Direct download failed: ${directRes.status}`);
          return directRes.blob();
        } catch (directError) {
          throw new Error('Download failed: Unable to fetch image');
        }
      }
      throw error;
    }
  },
  create: async (data: any) => {
    // Map frontend fields to backend expected format
    const backendData = {
      templateId: data.templateId,
      userPrompt: data.userPrompt || data.prompt,
      prompt: data.prompt || data.userPrompt,
      negativePrompt: data.negativePrompt,
      uploadedImages: data.uploadedImages || (data.faceImageUrl ? [data.faceImageUrl] : []),
      quality: data.quality || 'HD',
      aspectRatio: data.aspectRatio || '1:1',
      modelId: data.modelId, // Pass model selection to backend
      strength: data.imageStrength, // For I2I strength
      variations: data.variations || 1,
    };

    // Use longer timeout for generation requests
    try {
      const fullUrl = `${API_URL}/generation/generate`;
      if (process.env.NODE_ENV === 'development') {
        console.log('📡 POST Generation Request:', fullUrl);
      }

      const response = await Promise.race([
        fetch(fullUrl, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(backendData),
        }),
        timeout(GENERATION_TIMEOUT) as Promise<Response>
      ]);

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: `API request failed: ${response.status} ${response.statusText}`,
          msg: `API request failed: ${response.status} ${response.statusText}`
        }));

        const errorMessage = error.msg || error.message || error.error || error.details;

        if (response.status >= 500) {
          throw new Error(errorMessage || 'Server error. Please try again later.');
        }

        if (response.status === 400) {
          throw new Error(errorMessage || 'Invalid request. Please check your input.');
        }

        throw new Error(errorMessage || `API request failed: ${response.status}`);
      }

      return response.json();
    } catch (error: any) {
      if (error.message === 'Request timeout') {
        throw new Error('Generation is taking longer than expected. Please wait and try again.');
      }
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      }
      throw error;
    }
  },
  getById: (id: string) => api.get(`/generation/${id}`),
  getHistory: (page = 1, limit = 20) => api.get(`/generation/history?page=${page}&limit=${limit}`),
  toggleFavorite: (id: string) => {
    const headers = getHeaders();
    return fetch(`${API_URL}/generation/${id}/favorite`, {
      method: 'PATCH',
      headers,
    }).then(res => res.json());
  },
  delete: (id: string) => {
    const headers = getHeaders();
    return fetch(`${API_URL}/generation/${id}`, {
      method: 'DELETE',
      headers,
    }).then(res => res.json());
  },
};

// Tools API
export const toolsApi = {
  removeBg: async (imageUrl: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Use longer timeout for Replicate API calls (can take 30-60 seconds)
    const TOOL_TIMEOUT = 120000; // 2 minutes

    try {
      const response = await Promise.race([
        fetch(`${API_URL}/tools/remove-bg`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ imageUrl })
        }),
        timeout(TOOL_TIMEOUT) as Promise<Response>
      ]);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          const errorText = await response.text();
          errorData = { error: errorText };
        }
        throw new Error(errorData.error || errorData.message || `Request failed: ${response.status}`);
      }

      return response.json();
    } catch (error: any) {
      if (error.message === 'Request timeout') {
        throw new Error('Background removal is taking longer than expected. Please try again or use a smaller image.');
      }
      throw error;
    }
  },
  upscale: (imageUrl: string) => api.post('/tools/upscale', { imageUrl }),
  faceEnhance: (imageUrl: string) => api.post('/tools/face-enhance', { imageUrl }),
  compress: (imageUrl: string) => api.post('/tools/compress', { imageUrl }),
};

// Wallet API
export const walletApi = {
  getBalance: () => api.get('/wallet/balance'),
  getTransactions: (page = 1, limit = 20, type?: string) =>
    api.get(`/wallet/transactions?page=${page}&limit=${limit}${type ? `&type=${type}` : ''}`),
  addPoints: (amount: number, description: string) =>
    api.post('/wallet/add-points', { amount, description }),
};

// Creator API
export const creatorApi = {
  // Dashboard Stats
  getStats: () => api.get('/creator/stats'),

  // Earnings
  getEarnings: () => api.get('/creator/earnings'),

  // Withdrawal
  requestWithdrawal: (data: { amount: number; method: 'bank' | 'upi'; bankDetails?: any; upiId?: string }) =>
    api.post('/creator/withdraw', data),
  getWithdrawals: (page = 1, limit = 20, status?: string) =>
    api.get(`/creator/withdrawals?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`),

  // Templates
  getTemplates: (status?: string, sort = 'recent', page = 1, limit = 20) =>
    api.get(`/creator/templates?page=${page}&limit=${limit}&sort=${sort}${status ? `&status=${status}` : ''}`),
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
  }) => api.post('/creator/templates', data),
  updateTemplate: (id: string, data: {
    title?: string;
    description?: string;
    inputImage?: string;  // ✅ Add inputImage field
    imageUrl?: string;
    category?: string;
    subCategory?: string;
    prompt?: string;
    negativePrompt?: string;
    tags?: string[];
    gender?: string;
    isPremium?: boolean;
  }) => api.put(`/creator/templates/${id}`, data),
  deleteTemplate: (id: string) => api.delete(`/creator/templates/${id}`),
  duplicateTemplate: (id: string) => api.post(`/creator/templates/${id}/duplicate`, {}),
  getTemplateAnalytics: (id: string) => {
    // Try creator endpoint first, fallback to admin endpoint
    return api.get(`/creator/templates/${id}/analytics`).catch(() =>
      api.get(`/admin/creators/templates/${id}/analytics`)
    );
  },

  // Notifications
  getNotifications: (page = 1, limit = 20, type?: string) =>
    api.get(`/creator/notifications?page=${page}&limit=${limit}${type ? `&type=${type}` : ''}`),
  markNotificationRead: (id: string) => api.post(`/creator/notifications/${id}/read`, {}),
  markAllNotificationsRead: () => api.post('/creator/notifications/mark-all-read', {}),

  // Transactions
  getTransactions: (page = 1, limit = 20, type?: string) =>
    api.get(`/creator/transactions?page=${page}&limit=${limit}${type ? `&type=${type}` : ''}`),

  // Application (existing)
  getApplication: () => api.get('/creator/application'),
  apply: (payload: { username: string; socialLinks?: { facebook?: string; youtube?: string; instagram?: string; telegram?: string; whatsapp?: string } }) => {
    const name = (payload.username || '').replace(/^@/, '');
    const links = Object.values(payload.socialLinks || {}).filter(v => v && v.trim()) as string[];
    return api.post('/creator/apply', { name, socialLinks: links });
  },
};

// Ads API
export const adsApi = {
  // Get ads configuration from admin panel
  getConfig: () => api.get('/ads/config'),

  // Watch a rewarded ad and get points
  watchRewardedAd: (adId?: string) =>
    api.post('/ads/watch', { adId, adType: 'rewarded' }),

  // Record ad impression
  recordImpression: (adType: 'banner' | 'interstitial' | 'rewarded' | 'native', adId?: string) =>
    api.post('/ads/impression', { adType, adId }),

  // Get user's ad watch stats
  getAdStats: () => api.get('/ads/stats'),
};

