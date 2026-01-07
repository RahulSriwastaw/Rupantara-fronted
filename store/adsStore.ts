import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AdsConfig {
    id?: string;
    isEnabled: boolean;
    provider: 'google_admob' | 'custom' | 'facebook_audience';

    // Reward Configuration
    rewardType: 'fixed' | 'random' | 'range';
    fixedPoints: number;
    randomMin: number;
    randomMax: number;

    // Page-wise Ad Placement
    pages: {
        home: boolean;
        templates: boolean;
        generate: boolean;
        history: boolean;
        profile: boolean;
        wallet: boolean;
        rewards: boolean;
    };

    // Template Page Settings
    templateAdsSettings: {
        showBetweenTemplates: boolean;
        frequency: number; // Show ad after every N templates
    };

    // Ad Provider IDs
    adIds: {
        bannerId: string;
        interstitialId: string;
        rewardedId: string;
        nativeId: string;
    };

    // Daily Limits
    maxAdsPerUser: number;
    cooldownMinutes: number;

    updatedAt?: string;
}

export interface AdWatchRecord {
    timestamp: string;
    pointsEarned: number;
    adType: 'banner' | 'interstitial' | 'rewarded' | 'native';
}

interface AdsState {
    config: AdsConfig | null;
    isLoading: boolean;
    adsWatchedToday: number;
    lastAdTimestamp: string | null;
    totalAdsWatched: number;
    todayEarnings: number;
    adHistory: AdWatchRecord[];

    // Actions
    fetchAdsConfig: () => Promise<void>;
    canShowAd: (page: keyof AdsConfig['pages']) => boolean;
    canWatchRewardedAd: () => boolean;
    recordAdWatch: (adType: AdWatchRecord['adType'], points?: number) => void;
    getRewardPoints: () => number;
    resetDailyStats: () => void;
    updateConfig: (config: AdsConfig) => void;
}

export const useAdsStore = create<AdsState>()(
    persist(
        (set, get) => ({
            config: null,
            isLoading: false,
            adsWatchedToday: 0,
            lastAdTimestamp: null,
            totalAdsWatched: 0,
            todayEarnings: 0,
            adHistory: [],

            fetchAdsConfig: async () => {
                set({ isLoading: true });
                try {
                    const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://new-backend-g2gw.onrender.com';
                    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

                    const headers: Record<string, string> = {
                        'Content-Type': 'application/json',
                    };
                    if (token) {
                        headers['Authorization'] = `Bearer ${token}`;
                    }

                    const response = await fetch(`${API_URL}/api/v1/ads/config`, {
                        headers,
                    });

                    if (response.ok) {
                        const config = await response.json();
                        set({ config, isLoading: false });
                    } else {
                        // Use default config if API fails
                        set({
                            config: {
                                isEnabled: true,
                                provider: 'google_admob',
                                rewardType: 'fixed',
                                fixedPoints: 5,
                                randomMin: 3,
                                randomMax: 10,
                                pages: {
                                    home: true,
                                    templates: true,
                                    generate: true,
                                    history: false,
                                    profile: false,
                                    wallet: true,
                                    rewards: true,
                                },
                                templateAdsSettings: {
                                    showBetweenTemplates: true,
                                    frequency: 6,
                                },
                                adIds: {
                                    bannerId: '',
                                    interstitialId: '',
                                    rewardedId: '',
                                    nativeId: '',
                                },
                                maxAdsPerUser: 20,
                                cooldownMinutes: 3,
                            },
                            isLoading: false,
                        });
                    }
                } catch (error) {
                    console.error('Failed to fetch ads config:', error);
                    set({ isLoading: false });
                }
            },

            canShowAd: (page) => {
                const { config } = get();
                if (!config || !config.isEnabled) return false;
                return config.pages[page] || false;
            },

            canWatchRewardedAd: () => {
                const { config, adsWatchedToday, lastAdTimestamp } = get();

                if (!config || !config.isEnabled) return false;

                // Check daily limit
                if (adsWatchedToday >= config.maxAdsPerUser) return false;

                // Check cooldown
                if (lastAdTimestamp) {
                    const lastAd = new Date(lastAdTimestamp);
                    const now = new Date();
                    const diffMinutes = (now.getTime() - lastAd.getTime()) / (1000 * 60);

                    if (diffMinutes < config.cooldownMinutes) return false;
                }

                return true;
            },

            getRewardPoints: () => {
                const { config } = get();
                if (!config) return 0;

                switch (config.rewardType) {
                    case 'fixed':
                        return config.fixedPoints;
                    case 'random':
                    case 'range':
                        return Math.floor(
                            Math.random() * (config.randomMax - config.randomMin + 1) + config.randomMin
                        );
                    default:
                        return 5;
                }
            },

            recordAdWatch: (adType, points) => {
                const { config, getRewardPoints } = get();
                if (!config) return;

                const rewardPoints = points !== undefined ? points : getRewardPoints();
                const record: AdWatchRecord = {
                    timestamp: new Date().toISOString(),
                    pointsEarned: rewardPoints,
                    adType,
                };

                set((state) => ({
                    adsWatchedToday: state.adsWatchedToday + 1,
                    totalAdsWatched: state.totalAdsWatched + 1,
                    todayEarnings: state.todayEarnings + rewardPoints,
                    lastAdTimestamp: record.timestamp,
                    adHistory: [record, ...state.adHistory.slice(0, 49)], // Keep last 50 records
                }));
            },

            resetDailyStats: () => {
                set({
                    adsWatchedToday: 0,
                    todayEarnings: 0,
                    lastAdTimestamp: null,
                });
            },

            updateConfig: (config) => {
                set({ config });
            },
        }),
        {
            name: 'rupantar-ads',
            partialize: (state) => ({
                adsWatchedToday: state.adsWatchedToday,
                lastAdTimestamp: state.lastAdTimestamp,
                totalAdsWatched: state.totalAdsWatched,
                todayEarnings: state.todayEarnings,
                adHistory: state.adHistory,
            }),
        }
    )
);
