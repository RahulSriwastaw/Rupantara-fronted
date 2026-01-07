import { api } from './api';

export const monetizationApi = {
  // Popups
  getActivePopups: () => api.get('/monetization/popups/active'),
  trackPopupClick: (id: string) => api.post(`/monetization/popups/${id}/click`, {}),
  trackPopupClose: (id: string) => api.post(`/monetization/popups/${id}/close`, {}),

  // Offers
  getActiveOffers: () => api.get('/monetization/offers/active'),

  // Promo Codes
  validatePromoCode: (code: string, packageId?: string, amount?: number) => 
    api.post('/monetization/promo/validate', { code, packageId, amount }),

  // Ads
  getAdsConfig: () => api.get('/monetization/ads/config'),
  rewardAdWatch: (data: { watchedFull: boolean; skipped: boolean; adType?: string; deviceInfo?: string; ipAddress?: string }) =>
    api.post('/monetization/ads/reward', data),
  getAdStats: () => api.get('/monetization/ads/stats')
};

