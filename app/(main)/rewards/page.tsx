'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Gift,
    TrendingUp,
    Calendar,
    Zap,
    Award,
    Clock,
    CheckCircle2,
    Info
} from 'lucide-react';
import { RewardedAdButton, BannerAd } from '@/components/AdMobComponents';
import { useAdMob } from '@/hooks/useAdMob';
import { useWalletStore } from '@/store/walletStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export default function RewardsPage() {
    const {
        config,
        adsWatchedToday,
        todayEarnings,
        maxAdsPerDay,
        adsRemaining,
        timeUntilNextAd,
        isAdsEnabled,
    } = useAdMob('rewards');

    const { balance, totalEarned } = useWalletStore();

    if (!isAdsEnabled || !config) {
        return (
            <div className="container max-w-4xl mx-auto px-4 py-8">
                <Card className="p-8 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                            <Info className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold mb-2">Rewards Not Available</h2>
                            <p className="text-muted-foreground">
                                The rewards program is currently not available. Please check back later.
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    const dailyProgress = (adsWatchedToday / maxAdsPerDay) * 100;

    return (
        <div className="container max-w-6xl mx-auto px-4 py-8 space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-2"
            >
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Earn Free Points
                </h1>
                <p className="text-muted-foreground text-lg">
                    Watch ads and complete tasks to earn points for free AI generations
                </p>
            </motion.div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-4">
                <StatsCard
                    title="Current Balance"
                    value={balance}
                    icon={<Gift className="w-5 h-5 text-purple-500" />}
                    suffix="points"
                    trend="+12% this week"
                />
                <StatsCard
                    title="Today's Earnings"
                    value={todayEarnings}
                    icon={<TrendingUp className="w-5 h-5 text-green-500" />}
                    suffix="points"
                    trend={`${adsWatchedToday} ads watched`}
                />
                <StatsCard
                    title="Ads Remaining"
                    value={adsRemaining}
                    icon={<Zap className="w-5 h-5 text-amber-500" />}
                    suffix={`/ ${maxAdsPerDay}`}
                    trend="Resets daily"
                />
                <StatsCard
                    title="Total Earned"
                    value={totalEarned}
                    icon={<Award className="w-5 h-5 text-blue-500" />}
                    suffix="lifetime"
                    trend="All time"
                />
            </div>

            {/* Main Rewarded Ad Section */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
            >
                <RewardedAdButton variant="card" />
            </motion.div>

            {/* Daily Progress */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Daily Progress
                    </CardTitle>
                    <CardDescription>
                        Track your daily ad watching progress and earnings
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Ads Watched Today</span>
                            <span className="font-semibold">
                                {adsWatchedToday} / {maxAdsPerDay}
                            </span>
                        </div>
                        <Progress value={dailyProgress} className="h-3" />
                    </div>

                    <div className="h-px w-full bg-border" />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Points per Ad</div>
                            <div className="text-2xl font-bold">
                                {config.rewardType === 'fixed'
                                    ? config.fixedPoints
                                    : `${config.randomMin}-${config.randomMax}`}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Cooldown Time</div>
                            <div className="text-2xl font-bold">{config.cooldownMinutes}min</div>
                        </div>
                    </div>

                    {timeUntilNextAd > 0 && adsRemaining > 0 && (
                        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                                Next ad available in <strong>{timeUntilNextAd} minutes</strong>
                            </span>
                        </div>
                    )}

                    {adsRemaining === 0 && (
                        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-green-600 dark:text-green-400">
                                <strong>Daily limit reached!</strong> Come back tomorrow to earn more points.
                            </span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* How It Works */}
            <Card>
                <CardHeader>
                    <CardTitle>How It Works</CardTitle>
                    <CardDescription>
                        Easy steps to earn free points
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <HowItWorksStep
                            step={1}
                            title="Click Watch Ad"
                            description="Click the button above to start watching a rewarded ad"
                            icon="🎥"
                        />
                        <HowItWorksStep
                            step={2}
                            title="Watch Complete Ad"
                            description="Watch the entire ad without skipping to earn points"
                            icon="⏱️"
                        />
                        <HowItWorksStep
                            step={3}
                            title="Get Instant Points"
                            description={`Receive ${config.rewardType === 'fixed' ? config.fixedPoints : `${config.randomMin}-${config.randomMax}`} points instantly to your wallet`}
                            icon="🎉"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Banner Ad */}
            <BannerAd />

            {/* Tips & Limits */}
            <Card>
                <CardHeader>
                    <CardTitle>Tips & Limits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <TipItem
                        icon="📺"
                        title="Daily Limit"
                        description={`You can watch up to ${maxAdsPerDay} ads per day`}
                    />
                    <TipItem
                        icon="⏰"
                        title="Cooldown Period"
                        description={`Wait ${config.cooldownMinutes} minutes between ads`}
                    />
                    <TipItem
                        icon="✅"
                        title="Complete Viewing"
                        description="Make sure to watch the full ad to receive points"
                    />
                    <TipItem
                        icon="🔄"
                        title="Daily Reset"
                        description="Your daily limit resets every 24 hours at midnight"
                    />
                </CardContent>
            </Card>
        </div>
    );
}

// Helper Components
const StatsCard = ({
    title,
    value,
    icon,
    suffix,
    trend
}: {
    title: string;
    value: number;
    icon: React.ReactNode;
    suffix: string;
    trend?: string;
}) => (
    <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300 }}
    >
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">{title}</span>
                    {icon}
                </div>
                <div className="space-y-1">
                    <div className="text-2xl font-bold">
                        {value} <span className="text-sm font-normal text-muted-foreground">{suffix}</span>
                    </div>
                    {trend && (
                        <div className="text-xs text-muted-foreground">{trend}</div>
                    )}
                </div>
            </CardContent>
        </Card>
    </motion.div>
);

const HowItWorksStep = ({
    step,
    title,
    description,
    icon
}: {
    step: number;
    title: string;
    description: string;
    icon: string;
}) => (
    <div className="relative p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
        <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
            {step}
        </div>
        <div className="text-3xl mb-3">{icon}</div>
        <h3 className="font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
    </div>
);

const TipItem = ({
    icon,
    title,
    description
}: {
    icon: string;
    title: string;
    description: string;
}) => (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
            <div className="font-medium mb-1">{title}</div>
            <div className="text-sm text-muted-foreground">{description}</div>
        </div>
    </div>
);
