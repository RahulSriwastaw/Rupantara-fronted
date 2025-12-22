"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TrendingUp, FileImage, Users, DollarSign, Plus, Bell, Check, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/authStore";
import { useEarningsStore } from "@/store/earningsStore";
import { useTemplateStore } from "@/store/templateStore";
import { creatorApi } from "@/services/api";

interface DashboardStats {
  totalTemplates: number;
  approvedTemplates: number;
  pendingTemplates: number;
  rejectedTemplates: number;
  templatesThisWeek: number;
  totalUses: number;
  totalViews: number;
  totalLikes: number;
  followers: number;
  totalEarnings: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  pendingWithdrawal: number;
  availableBalance: number;
}

export default function CreatorDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { fetchEarnings, totalEarnings, thisMonthEarnings, isLoading: earningsLoading } = useEarningsStore();
  const { fetchCreatorTemplates, templates, isLoading: templatesLoading } = useTemplateStore();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<number[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch all dashboard data
        const [statsData] = await Promise.all([
          creatorApi.getStats().catch(() => null),
          fetchEarnings().catch(() => { }),
          fetchCreatorTemplates().catch(() => { }),
        ]);

        if (statsData) {
          setStats(statsData);
        }

        // Generate chart data based on monthly trend or create dummy data
        const earningsData = await creatorApi.getEarnings().catch(() => null);
        if (earningsData?.monthlyTrend && earningsData.monthlyTrend.length > 0) {
          const chartData = earningsData.monthlyTrend.slice(-12).map((m: any) => m.amount);
          setMonthlyData(chartData);
        } else {
          // Fallback chart data
          setMonthlyData([20, 35, 28, 45, 38, 52, 48, 60, 55, 70, 65, 75]);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [fetchEarnings, fetchCreatorTemplates]);

  // Calculate engagement metrics from stats or templates
  const totalTemplates = stats?.totalTemplates ?? templates.length;
  // Use approvalStatus instead of status for approval workflow
  const approvedTemplates = stats?.approvedTemplates ?? templates.filter(t => {
    const template = t as any;
    return template.approvalStatus === "approved" || (!template.approvalStatus && t.status === "active");
  }).length;
  const pendingTemplates = stats?.pendingTemplates ?? templates.filter(t => {
    const template = t as any;
    return template.approvalStatus === "pending";
  }).length;
  const rejectedTemplates = stats?.rejectedTemplates ?? templates.filter(t => {
    const template = t as any;
    return template.approvalStatus === "rejected";
  }).length;

  const totalEngagement = stats?.totalUses ?? templates.reduce((sum, t) => sum + (t.usageCount || 0), 0);
  const followers = stats?.followers ?? 0;
  const avgRating = templates.length
    ? (templates.reduce((sum, t) => sum + (t.rating || 0), 0) / templates.length).toFixed(1)
    : "0.0";

  // Get earnings from stats or store
  const displayTotalEarnings = stats?.totalEarnings ?? totalEarnings;
  const displayThisMonthEarnings = stats?.thisMonthEarnings ?? thisMonthEarnings;
  const lastMonthEarnings = stats?.lastMonthEarnings ?? 0;

  // Calculate percentage change
  const percentageChange = lastMonthEarnings > 0
    ? ((displayThisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100
    : 0;
  const isPositive = percentageChange >= 0;

  // Normalize chart data for display
  const maxChartValue = Math.max(...monthlyData, 1);
  const normalizedChartData = monthlyData.map(v => (v / maxChartValue) * 100);

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 sm:space-y-4 md:space-y-6">
      {/* Header with Profile */}
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 ring-2 ring-primary/50 flex-shrink-0">
            <AvatarImage src={user?.profilePicture} />
            <AvatarFallback className="text-sm sm:text-base md:text-lg bg-primary/20">
              {user?.fullName?.charAt(0) || "D"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 sm:gap-2">
              <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold truncate">
                Welcome back, {user?.fullName?.split(' ')[0] || "Creator"}!
              </h1>
              <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary fill-primary flex-shrink-0" />
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
          onClick={() => router.push("/notifications")}
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
        </Button>
      </div>

      {/* Earnings Card with Graph */}
      <Card className="bg-gradient-to-br from-card to-card/50">
        <CardContent className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Earnings</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">${displayTotalEarnings.toFixed(2)}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
              <p className="text-xs sm:text-sm text-primary">This Month: ${displayThisMonthEarnings.toFixed(2)}</p>
              {percentageChange !== 0 && (
                <Badge className={`${isPositive ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'} text-xs`}>
                  <TrendingUp className={`h-3 w-3 mr-1 ${!isPositive ? 'rotate-180' : ''}`} />
                  {isPositive ? '+' : ''}{percentageChange.toFixed(1)}%
                </Badge>
              )}
            </div>
          </div>

          {/* Graph */}
          <div className="h-24 sm:h-28 md:h-32 w-full rounded-xl bg-gradient-to-t from-primary/20 to-transparent flex items-end justify-between px-1 sm:px-2 pb-1 sm:pb-2 gap-0.5 sm:gap-1">
            {normalizedChartData.map((height, i) => (
              <div
                key={i}
                className="flex-1 min-w-[2px] sm:min-w-[4px] rounded-t-lg bg-primary transition-all hover:bg-primary/80"
                style={{ height: `${Math.max(height, 5)}%` }}
                title={`Month ${i + 1}: $${monthlyData[i]?.toFixed(2) || 0}`}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* My Templates Card */}
      <Card>
        <CardContent className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">My Templates</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">{totalTemplates}</h2>
              <span className="text-xs sm:text-sm text-muted-foreground">Total</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
              <p className="text-xs sm:text-sm text-primary">
                {approvedTemplates} Approved, {pendingTemplates} Pending, {rejectedTemplates} Rejected
              </p>
              {stats?.templatesThisWeek && stats.templatesThisWeek > 0 && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                  +{stats.templatesThisWeek} this week
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Engagement Card */}
      <Card>
        <CardContent className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Engagement</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">{totalEngagement.toLocaleString()}</h2>
              <span className="text-xs sm:text-sm text-muted-foreground">Uses</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
              <p className="text-xs sm:text-sm text-primary">{followers.toLocaleString()} Followers</p>
              {stats?.totalViews && (
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                  {stats.totalViews.toLocaleString()} views
                </Badge>
              )}
              {stats?.totalLikes && (
                <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30 text-xs">
                  {stats.totalLikes.toLocaleString()} likes
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 mt-2 sm:mt-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-sm sm:text-base md:text-lg ${star <= parseFloat(avgRating) ? "text-yellow-400" : "text-muted-foreground/30"
                    }`}
                >
                  ★
                </span>
              ))}
              <span className="text-xs sm:text-sm text-primary ml-1 sm:ml-2">{avgRating}/5 Avg. Rating</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="space-y-2 sm:space-y-3">
        <h3 className="text-base sm:text-lg font-semibold">Quick Actions</h3>
        <div className="space-y-2">
          <Button
            onClick={() => router.push("/templates/new")}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 h-11 sm:h-12 md:h-14 text-sm sm:text-base"
          >
            Create New Template
          </Button>
          <Button
            onClick={() => router.push("/templates?status=pending")}
            variant="secondary"
            className="w-full h-11 sm:h-12 md:h-14 text-sm sm:text-base"
          >
            Check Pending Templates
          </Button>
          <Button
            onClick={() => router.push("/earnings")}
            variant="secondary"
            className="w-full h-11 sm:h-12 md:h-14 text-sm sm:text-base"
          >
            Withdraw Earnings
          </Button>
        </div>
      </div>
    </div>
  );
}
