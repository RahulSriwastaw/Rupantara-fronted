const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const API_TIMEOUT = 30000; // 30 seconds

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
      const response = await Promise.race([
        fetch(`${API_URL}${endpoint}`, {
          headers: getHeaders(),
        }),
        timeout(API_TIMEOUT) as Promise<Response>
      ]);

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: `API request failed: ${response.status} ${response.statusText}`
        }));
        throw new Error(error.error || `API request failed: ${response.status}`);
      }
      return response.json();
    } catch (error: any) {
      if (error.message === 'Request timeout') {
        throw new Error('Request timeout. Please check your connection and try again.');
      }
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect to server. Please check your connection.');
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
        const error = await response.json().catch(() => ({
          error: `API request failed: ${response.status} ${response.statusText}`
        }));
        throw new Error(error.error || `API request failed: ${response.status}`);
      }
      return response.json();
    } catch (error: any) {
      if (error.message === 'Request timeout') {
        throw new Error('Request timeout. Please check your connection and try again.');
      }
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect to server. Please check your connection.');
      }
      throw error;
    }
  },
};

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; fullName: string; phone?: string; photoURL?: string; firebaseUid?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  syncUser: (firebaseToken: string, fullName?: string, phone?: string) =>
    api.post('/auth/syncUser', { firebaseToken, fullName, phone }),
  getMe: () => api.get('/auth/me'),
};

// Templates API
export const templatesApi = {
  getAll: () => api.get('/templates'),
  getById: (id: string) => api.get(`/templates/${id}`),
  adminUploadDemo: async (dataUrl: string) => {
    const blob = await fetch(dataUrl).then(r => r.blob())
    const fd = new FormData()
    fd.append('image', blob, 'demo.png')
    // Note: FormData needs special handling for headers (no Content-Type, browser sets it with boundary)
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/admin/upload/template-demo`, {
      method: 'POST',
      headers,
      body: fd
    })
    if (!res.ok) throw new Error('Upload failed')
    return res.json()
  },
  adminCreateTemplate: (payload: any) => api.post('/admin/templates', payload),
};

// Payments API
export const paymentsApi = {
  createStripeIntent: (amount: number) =>
    api.post('/payment/stripe/create-payment-intent', { amount }),
  createRazorpayOrder: (packageId: string, gateway: 'razorpay' | 'stripe' = 'razorpay') =>
    api.post('/payment/create-order', { packageId, gateway }),
  verifyRazorpay: (data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; packageId: string }) =>
    api.post('/payment/verify-razorpay', data),
};

// Generations API
export const generationsApi = {
  create: (data: any) => api.post('/generation/generate', data),
  getStatus: (id: string) => api.get(`/generation/status/${id}`),
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
  removeBg: (imageUrl: string) => api.post('/tools/remove-bg', { imageUrl }),
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
  getEarnings: () => api.get('/creator/earnings'),
  requestWithdrawal: (data: { amount: number; method: 'bank' | 'upi'; bankDetails?: any; upiId?: string }) =>
    api.post('/creator/withdraw', data),
  getWithdrawals: () => api.get('/creator/withdrawals'),
};

