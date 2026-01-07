"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Gift,
  Users,
  Play,
  RefreshCw,
  Plus,
  Minus,
  Search,
  Filter,
  Crown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWalletStore } from "@/store/walletStore";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import { ReferralLink } from "@/components/social/ReferralLink";
import { RewardedAdButton } from "@/components/AdMobComponents";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { subscriptionApi } from "@/services/api";

export default function WalletPage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    balance,
    totalEarned,
    totalSpent,
    transactions,
    dailyLoginClaimed,
    dailyStreak,
    claimDailyLogin,
  } = useWalletStore();
  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const thisMonthEarned = transactions
    .filter((t) => {
      const txDate = new Date(t.createdAt);
      const now = new Date();
      return (
        txDate.getMonth() === now.getMonth() &&
        txDate.getFullYear() === now.getFullYear() &&
        t.amount > 0
      );
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const thisMonthSpent = transactions
    .filter((t) => {
      const txDate = new Date(t.createdAt);
      const now = new Date();
      return (
        txDate.getMonth() === now.getMonth() &&
        txDate.getFullYear() === now.getFullYear() &&
        t.amount < 0
      );
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoadingSubscription(true);
        const subscription = await subscriptionApi.getCurrent();
        setCurrentSubscription(subscription);
      } catch (error) {
        console.error('Error fetching subscription:', error);
        setCurrentSubscription(null);
      } finally {
        setLoadingSubscription(false);
      }
    };
    fetchSubscription();
  }, []);

  const handleClaimDaily = () => {
    if (!dailyLoginClaimed) {
      claimDailyLogin();
      toast({
        title: "Daily bonus claimed! 🎉",
        description: "+3 points added to your balance",
      });
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }

    try {
      setCancelling(true);
      await subscriptionApi.cancel();
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription will remain active until the end of the billing period.",
      });
      setCurrentSubscription(null);
      await useWalletStore.getState().fetchWalletData();
    } catch (error: any) {
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    } finally {
      setCancelling(false);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      !searchQuery ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "earned" && t.amount > 0) ||
      (activeTab === "spent" && t.amount < 0);

    return matchesSearch && matchesTab;
  });

  return (
    <div className="w-full max-w-6xl mx-auto py-2 sm:py-3 md:py-4 space-y-3 sm:space-y-4 px-2 sm:px-0">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Wallet</h1>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground">Manage your points and earnings</p>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-purple-600 to-pink-600 text-white border-0">
        <CardContent className="p-4 sm:p-5 md:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-2 text-center sm:text-left">
              <p className="text-white/80 text-sm sm:text-base">Current Balance</p>
              <div className="flex items-baseline justify-center sm:justify-start gap-1 sm:gap-2">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">{balance}</h2>
                <span className="text-lg sm:text-xl md:text-2xl">points</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-1 sm:gap-2 text-xs sm:text-sm text-white/80">
                <RefreshCw className="h-3 w-3" />
                <span>Last updated just now</span>
              </div>
            </div>
            <Button
              onClick={() => router.push("/pro")}
              variant="secondary"
              size="sm"
              className="bg-white text-purple-600 hover:bg-white/90 text-sm sm:text-base h-9 sm:h-10 px-3 sm:px-4"
            >
              Add Points
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Subscription Status */}
      {!loadingSubscription && currentSubscription && (
        <Card className="bg-gradient-to-br from-blue-600 to-purple-600 text-white border-0">
          <CardContent className="p-4 sm:p-5 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  <h3 className="text-lg sm:text-xl font-bold">Active Subscription</h3>
                  <Badge variant="secondary" className="bg-green-500 text-white">
                    {currentSubscription.status?.toUpperCase() || 'ACTIVE'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xl sm:text-2xl font-semibold">{currentSubscription.planName}</p>
                  <p className="text-sm text-white/80">
                    {currentSubscription.billingCycle?.charAt(0).toUpperCase() + currentSubscription.billingCycle?.slice(1)} Plan
                  </p>
                  {currentSubscription.endDate && (
                    <p className="text-xs text-white/70">
                      {currentSubscription.status === 'active' && currentSubscription.nextBillingDate
                        ? `Renews on ${new Date(currentSubscription.nextBillingDate).toLocaleDateString()}`
                        : `Expires on ${new Date(currentSubscription.endDate).toLocaleDateString()}`}
                    </p>
                  )}
                  {currentSubscription.creditsAllocated && (
                    <p className="text-xs text-white/70">
                      {currentSubscription.creditsAllocated - (currentSubscription.creditsUsed || 0)} credits remaining
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => router.push("/pro")}
                  variant="secondary"
                  size="sm"
                  className="bg-white text-blue-600 hover:bg-white/90"
                >
                  Upgrade Plan
                </Button>
                {currentSubscription.status === 'active' && (
                  <Button
                    onClick={handleCancelSubscription}
                    variant="outline"
                    size="sm"
                    disabled={cancelling}
                    className="bg-transparent border-white text-white hover:bg-white/10"
                  >
                    {cancelling ? "Cancelling..." : "Cancel Subscription"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!loadingSubscription && !currentSubscription && (
        <Card className="border-dashed">
          <CardContent className="p-4 sm:p-5 md:p-6 text-center">
            <Crown className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-1">No Active Subscription</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Subscribe to unlock premium features and get monthly credits
            </p>
            <Button onClick={() => router.push("/pro")} className="bg-gradient-to-r from-blue-600 to-purple-600">
              View Plans
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Total Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-1 sm:gap-2">
                <span className="text-xl sm:text-2xl font-bold">{totalEarned}</span>
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              +{thisMonthEarned} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-1 sm:gap-2">
                <span className="text-xl sm:text-2xl font-bold">{totalSpent}</span>
                <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              -{thisMonthSpent} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-1 sm:gap-2">
                <span className="text-xl sm:text-2xl font-bold">
                  {thisMonthEarned - thisMonthSpent}
                </span>
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Net change in {new Date().toLocaleString("default", { month: "long" })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Earning Methods */}
      <div className="space-y-4">
        <h2 className="text-lg sm:text-xl font-bold">Earn Points</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {/* Daily Login */}
          <Card>
            <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">Daily Login</h3>
                  <p className="text-xs text-muted-foreground">+3 points</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span>Current streak</span>
                  <Badge variant="secondary" className="text-xs">{dailyStreak} days 🔥</Badge>
                </div>
              </div>

              <Button
                onClick={handleClaimDaily}
                disabled={dailyLoginClaimed}
                className="w-full h-8 sm:h-9 text-xs sm:text-sm"
              >
                {dailyLoginClaimed ? "Claimed Today ✓" : "Claim 3 Points"}
              </Button>
            </CardContent>
          </Card>

          {/* Referrals - Using ReferralLink Component */}
          <ReferralLink />

          {/* Watch Ads - NEW AdMob Integration */}
          <RewardedAdButton
            variant="compact"
            className="h-full"
          />
        </div>
      </div>

      {/* Transaction History */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-lg sm:text-xl font-bold">Transaction History</h2>
          <div className="w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full sm:w-48 md:w-64 text-sm"
              />
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 h-9 sm:h-10">
            <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
            <TabsTrigger value="earned" className="text-xs sm:text-sm">Earned</TabsTrigger>
            <TabsTrigger value="spent" className="text-xs sm:text-sm">Spent</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-3 mt-4">
            {filteredTransactions.length === 0 ? (
              <Card>
                <CardContent className="p-8 sm:p-12 text-center">
                  <p className="text-muted-foreground text-sm sm:text-base">No transactions found</p>
                </CardContent>
              </Card>
            ) : (
              filteredTransactions.map((transaction) => (
                <Card key={transaction.id} className="overflow-hidden">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div
                          className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center ${transaction.amount > 0
                            ? "bg-green-100 dark:bg-green-900"
                            : "bg-red-100 dark:bg-red-900"
                            }`}
                        >
                          {transaction.amount > 0 ? (
                            <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <Minus className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{transaction.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(transaction.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold text-sm ${transaction.amount > 0 ? "text-green-600" : "text-red-600"
                            }`}
                        >
                          {transaction.amount > 0 ? "+" : ""}
                          {transaction.amount}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Balance: {transaction.balanceAfter}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

