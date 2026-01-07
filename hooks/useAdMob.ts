import { useEffect, useState } from 'react';
import { useAdsStore, AdsConfig } from '@/store/adsStore';
import { useWalletStore } from '@/store/walletStore';
import { adsApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export const useAdMob = (currentPage?: keyof AdsConfig['pages']) => {
    const { toast } = useToast();
    const {
        config,
        fetchAdsConfig,
        canShowAd,
        canWatchRewardedAd,
        recordAdWatch,
        getRewardPoints,
        adsWatchedToday,
        lastAdTimestamp,
        todayEarnings,
    } = useAdsStore();

    const { fetchWalletData } = useWalletStore();
    const [isLoadingAd, setIsLoadingAd] = useState(false);
    const [adError, setAdError] = useState<string | null>(null);

    // Fetch ads config on mount
    useEffect(() => {
        if (!config) {
            fetchAdsConfig();
        }
    }, [config, fetchAdsConfig]);

    // Check if ads should be shown on current page
    const shouldShowAds = currentPage ? canShowAd(currentPage) : false;

    // Calculate time until next ad is available
    const getTimeUntilNextAd = () => {
        if (!config || !lastAdTimestamp) return 0;

        const lastAd = new Date(lastAdTimestamp);
        const now = new Date();
        const diffMinutes = (now.getTime() - lastAd.getTime()) / (1000 * 60);
        const remainingMinutes = Math.max(0, config.cooldownMinutes - diffMinutes);

        return Math.ceil(remainingMinutes);
    };

    // Watch a rewarded ad
    const watchRewardedAd = async () => {
        if (!canWatchRewardedAd()) {
            const reason = adsWatchedToday >= (config?.maxAdsPerUser || 20)
                ? 'You have reached the daily ad limit'
                : `Please wait ${getTimeUntilNextAd()} minutes before watching another ad`;

            toast({
                title: 'Cannot watch ad',
                description: reason,
                variant: 'destructive',
            });
            return false;
        }

        setIsLoadingAd(true);
        setAdError(null);

        try {
            // Call backend to record ad watch and get points
            const response = await adsApi.watchRewardedAd(config?.adIds.rewardedId);

            if (response.success) {
                const points = response.points || getRewardPoints();

                // Record in local store
                recordAdWatch('rewarded', points);

                // Refresh wallet to show new balance
                await fetchWalletData();

                toast({
                    title: '🎉 Reward Earned!',
                    description: `You earned ${points} points for watching the ad!`,
                });

                setIsLoadingAd(false);
                return true;
            } else {
                throw new Error(response.message || 'Failed to process ad reward');
            }
        } catch (error: any) {
            const errorMsg = error.message || 'Failed to load ad. Please try again.';
            setAdError(errorMsg);

            toast({
                title: 'Ad Failed',
                description: errorMsg,
                variant: 'destructive',
            });

            setIsLoadingAd(false);
            return false;
        }
    };

    // Record ad impression (for banner/interstitial/native ads)
    const recordAdImpression = async (adType: 'banner' | 'interstitial' | 'native') => {
        if (!config) return;

        try {
            const adId = adType === 'banner'
                ? config.adIds.bannerId
                : adType === 'interstitial'
                    ? config.adIds.interstitialId
                    : config.adIds.nativeId;

            await adsApi.recordImpression(adType, adId);
        } catch (error) {
            console.error('Failed to record ad impression:', error);
        }
    };

    return {
        // Configuration
        config,
        isAdsEnabled: config?.isEnabled || false,
        shouldShowAds,

        // Stats
        adsWatchedToday,
        todayEarnings,
        maxAdsPerDay: config?.maxAdsPerUser || 20,
        adsRemaining: Math.max(0, (config?.maxAdsPerUser || 20) - adsWatchedToday),
        timeUntilNextAd: getTimeUntilNextAd(),

        // Actions
        canWatchRewardedAd: canWatchRewardedAd(),
        watchRewardedAd,
        recordAdImpression,
        isLoadingAd,
        adError,

        // Ad IDs
        adIds: config?.adIds,
    };
};
