const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const API_TIMEOUT = 30000; // 30 seconds

// Helper function to create a timeout promise
const timeout = (ms: number) => new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Request timeout')), ms)
);

export const api = {
  async get(endpoint: string) {
    try {
      const response = await Promise.race([
        fetch(`${API_URL}${endpoint}`, {
          headers: {
            'Content-Type': 'application/json',
          },
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
          headers: { 'Content-Type': 'application/json' },
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
};

// Payments API
export const paymentsApi = {
  createStripeIntent: (amount: number) => 
    api.post('/payment/stripe/create-payment-intent', { amount }),
  createRazorpayOrder: (amount: number) => 
    api.post('/payment/razorpay/create-order', { amount }),
  verifyRazorpay: (data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
    api.post('/payment/razorpay/verify', data),
};

// Generations API
export const generationsApi = {
  create: (data: any) => api.post('/generation/generate', data),
  getStatus: (id: string) => api.get(`/generation/status/${id}`),
};

// Wallet API
export const walletApi = {
  getBalance: () => api.get('/wallet/balance'),
  getTransactions: () => api.get('/wallet/transactions'),
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
