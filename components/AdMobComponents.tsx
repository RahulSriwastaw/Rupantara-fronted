'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Gift, Coins, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAdMob } from '@/hooks/useAdMob';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface RewardedAdButtonProps {
    variant?: 'default' | 'compact' | 'card';
    onAdComplete?: (points: number) => void;
    className?: string;
}

export const RewardedAdButton: React.FC<RewardedAdButtonProps> = ({
    variant = 'default',
    onAdComplete,
    className = '',
}) => {
    const {
        config,
        canWatchRewardedAd,
        watchRewardedAd,
        adsWatchedToday,
        adsRemaining,
        maxAdsPerDay,
        timeUntilNextAd,
        isLoadingAd,
        todayEarnings,
    } = useAdMob();

    const [isWatching, setIsWatching] = useState(false);

    const handleWatchAd = async () => {
        setIsWatching(true);
        const success = await watchRewardedAd();

        if (success && config) {
            const points = config.rewardType === 'fixed'
                ? config.fixedPoints
                : Math.floor(Math.random() * (config.randomMax - config.randomMin + 1) + config.randomMin);

            onAdComplete?.(points);
        }

        setIsWatching(false);
    };

    if (!config || !config.isEnabled) {
        return null;
    }

    // Compact variant - just a button
    if (variant === 'compact') {
        return (
            <Button
                onClick={handleWatchAd}
                disabled={!canWatchRewardedAd || isLoadingAd || isWatching}
                className={`gap-2 ${className}`}
                variant="outline"
            >
                {isLoadingAd || isWatching ? (
                    <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                        <span>Loading...</span>
                    </>
                ) : (
                    <>
                        <Play className="w-4 h-4" />
                        <span>Watch Ad</span>
                    </>
                )}
            </Button>
        );
    }

    // Card variant - detailed info
    if (variant === 'card') {
        return (
            <Card className={`p-6 ${className}`}>
                <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Gift className="w-5 h-5 text-primary" />
                                Earn Free Points
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Watch ads to earn points and unlock more generations
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                                {config.rewardType === 'fixed'
                                    ? `${config.fixedPoints}`
                                    : `${config.randomMin}-${config.randomMax}`}
                            </div>
                            <div className="text-xs text-muted-foreground">points per ad</div>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Daily Progress</span>
                            <span className="font-medium">
                                {adsWatchedToday}/{maxAdsPerDay} ads watched
                            </span>
                        </div>
                        <Progress value={(adsWatchedToday / maxAdsPerDay) * 100} className="h-2" />
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <Coins className="w-4 h-4 text-amber-500" />
                                <span className="text-xs text-muted-foreground">Today's Earnings</span>
                            </div>
                            <div className="text-xl font-bold">{todayEarnings}</div>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-1">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-xs text-muted-foreground">Ads Remaining</span>
                            </div>
                            <div className="text-xl font-bold">{adsRemaining}</div>
                        </div>
                    </div>

                    {/* Action Button */}
                    {canWatchRewardedAd ? (
                        <Button
                            onClick={handleWatchAd}
                            disabled={isLoadingAd || isWatching}
                            className="w-full h-12 text-base gap-2"
                            size="lg"
                        >
                            {isLoadingAd || isWatching ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                                    <span>Loading Ad...</span>
                                </>
                            ) : (
                                <>
                                    <Play className="w-5 h-5" />
                                    <span>Watch Ad & Earn Points</span>
                                </>
                            )}
                        </Button>
                    ) : (
                        <div className="bg-muted/50 rounded-lg p-4 text-center">
                            {adsRemaining === 0 ? (
                                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span>Daily limit reached! Come back tomorrow</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                    <Clock className="w-5 h-5 text-orange-500" />
                                    <span>Next ad available in {timeUntilNextAd} minutes</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Card>
        );
    }

    // Default variant - animated button
    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={className}
        >
            <Button
                onClick={handleWatchAd}
                disabled={!canWatchRewardedAd || isLoadingAd || isWatching}
                className="w-full h-14 text-base gap-3 relative overflow-hidden"
                size="lg"
                variant={canWatchRewardedAd ? 'default' : 'secondary'}
            >
                {/* Animated background */}
                {canWatchRewardedAd && (
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary-foreground/20 to-primary/0"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    />
                )}

                <div className="relative z-10 flex items-center gap-3">
                    {isLoadingAd || isWatching ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                            <span>Loading Ad...</span>
                        </>
                    ) : canWatchRewardedAd ? (
                        <>
                            <Play className="w-5 h-5" />
                            <div className="text-left">
                                <div className="font-semibold">Watch Ad & Earn Points</div>
                                <div className="text-xs opacity-80">
                                    {adsRemaining} ads left today • {config.rewardType === 'fixed'
                                        ? `+${config.fixedPoints}`
                                        : `+${config.randomMin}-${config.randomMax}`} points
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {adsRemaining === 0 ? (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    <span>Daily limit reached</span>
                                </>
                            ) : (
                                <>
                                    <Clock className="w-5 h-5" />
                                    <span>Next ad in {timeUntilNextAd} minutes</span>
                                </>
                            )}
                        </>
                    )}
                </div>
            </Button>
        </motion.div>
    );
};

// Banner Ad Component
export const BannerAd: React.FC<{ className?: string }> = ({ className = '' }) => {
    const { shouldShowAds, recordAdImpression, adIds } = useAdMob();

    React.useEffect(() => {
        if (shouldShowAds && adIds?.bannerId) {
            recordAdImpression('banner');
        }
    }, [shouldShowAds, adIds?.bannerId]);

    if (!shouldShowAds || !adIds?.bannerId) return null;

    return (
        <div className={`bg-muted/30 border rounded-lg p-4 text-center ${className}`}>
            <div className="text-xs text-muted-foreground mb-2">Advertisement</div>
            <div className="h-16 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 rounded flex items-center justify-center">
                <span className="text-sm text-muted-foreground">Banner Ad Space - ID: {adIds.bannerId}</span>
            </div>
        </div>
    );
};

export default RewardedAdButton;
