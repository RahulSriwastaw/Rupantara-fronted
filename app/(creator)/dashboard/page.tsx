"use client";

import { useRouter } from "next/navigation";
import { TrendingUp, FileImage, Users, DollarSign, Plus, Bell, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/authStore";
import { useEarningsStore } from "@/store/earningsStore";
import { useTemplateStore } from "@/store/templateStore";

export default function CreatorDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { totalEarnings, thisMonthEarnings } = useEarningsStore();
  const { templates } = useTemplateStore();

  // Calculate engagement metrics
  const totalTemplates = templates.length;
  const approvedTemplates = templates.filter(t => t.status === "approved").length;
  const pendingTemplates = templates.filter(t => t.status === "pending").length;
  const rejectedTemplates = templates.filter(t => t.status === "rejected").length;
  
  const totalEngagement = String(templates.reduce((sum, t) => sum + (t.usageCount || 0), 0));
  const followers = String((user?.followingCreators || []).length);
  const avgRating = String(templates.length ? (templates.reduce((sum, t) => sum + (t.rating || 0), 0) / templates.length).toFixed(1) : "0.0");

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
                Welcome back, {user?.fullName?.split(' ')[0] || "David"}!
              </h1>
              <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary fill-primary flex-shrink-0" />
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0">
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
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">${totalEarnings.toFixed(2)}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
              <p className="text-xs sm:text-sm text-primary">This Month: ${thisMonthEarnings.toFixed(2)}</p>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                +5.2%
              </Badge>
            </div>
          </div>
          
          {/* Graph Placeholder */}
          <div className="h-24 sm:h-28 md:h-32 w-full rounded-xl bg-gradient-to-t from-primary/20 to-transparent flex items-end justify-between px-1 sm:px-2 pb-1 sm:pb-2 gap-0.5 sm:gap-1">
            {[20, 35, 28, 45, 38, 52, 48, 60, 55, 70, 65, 75].map((height, i) => (
              <div
                key={i}
                className="flex-1 min-w-[2px] sm:min-w-[4px] rounded-t-lg bg-primary"
                style={{ height: `${height}%` }}
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
              <p className="text-xs sm:text-sm text-primary">{approvedTemplates} Approved, {pendingTemplates} Pending, {rejectedTemplates} Rejected</p>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                +2 this week
              </Badge>
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
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">{totalEngagement}</h2>
              <span className="text-xs sm:text-sm text-muted-foreground">Uses</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2">
              <p className="text-xs sm:text-sm text-primary">{followers} Followers</p>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                1.1k this month
              </Badge>
            </div>
            <div className="flex items-center gap-1 mt-2 sm:mt-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-sm sm:text-base md:text-lg ${
                    star <= parseFloat(avgRating) ? "text-yellow-400" : "text-muted-foreground/30"
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
