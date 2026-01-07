"use client";

import { useState, useEffect } from "react";
import { Bell, Check, X, Clock, AlertCircle, Info, DollarSign, FileImage, Loader2, Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { creatorApi } from "@/services/api";
import { formatDistanceToNow } from "date-fns";

interface CreatorNotification {
  id: string;
  type: "template" | "payment" | "system" | "earning" | "withdrawal";
  title: string;
  message: string;
  read: boolean;
  relatedId: string | null;
  createdAt: string;
}

export default function CreatorNotificationsPage() {
  const [notifications, setNotifications] = useState<CreatorNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const fetchNotifications = async (type?: string) => {
    setIsLoading(true);
    try {
      const data = await creatorApi.getNotifications(1, 50, type === "all" ? undefined : type);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(activeTab);
  }, [activeTab]);

  const markAsRead = async (id: string) => {
    try {
      await creatorApi.markNotificationRead(id);
      setNotifications(notifications.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await creatorApi.markAllNotificationsRead();
      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const filteredNotifications = activeTab === "all"
    ? notifications
    : notifications.filter(notif => notif.type === activeTab);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "template":
        return <FileImage className="h-3 w-3 sm:h-4 sm:w-4" />;
      case "payment":
      case "earning":
        return <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />;
      case "withdrawal":
        return <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />;
      case "system":
        return <Settings className="h-3 w-3 sm:h-4 sm:w-4" />;
      default:
        return <Info className="h-3 w-3 sm:h-4 sm:w-4" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "template":
        return "bg-blue-500/20 text-blue-500";
      case "payment":
      case "earning":
        return "bg-green-500/20 text-green-500";
      case "withdrawal":
        return "bg-yellow-500/20 text-yellow-500";
      case "system":
        return "bg-purple-500/20 text-purple-500";
      default:
        return "bg-blue-500/20 text-blue-500";
    }
  };

  if (isLoading && notifications.length === 0) {
    return (
      <div className="w-full flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 sm:space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="relative flex-shrink-0">
            <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary text-[9px] sm:text-[10px] text-primary-foreground flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">Notifications</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={markAllAsRead}
          disabled={unreadCount === 0 || isLoading}
          className="text-xs sm:text-sm h-8 sm:h-9 flex-shrink-0"
        >
          <span className="hidden sm:inline">Mark all as read</span>
          <span className="sm:hidden">Mark all</span>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="all" className="text-xs sm:text-sm py-1.5 sm:py-2">All</TabsTrigger>
          <TabsTrigger value="template" className="text-xs sm:text-sm py-1.5 sm:py-2">Template</TabsTrigger>
          <TabsTrigger value="earning" className="text-xs sm:text-sm py-1.5 sm:py-2">Earnings</TabsTrigger>
          <TabsTrigger value="system" className="text-xs sm:text-sm py-1.5 sm:py-2">System</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-2 sm:space-y-3 mt-3 sm:mt-4">
          {isLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-6 sm:p-8 md:p-12 text-center">
                <div className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 mx-auto mb-3 sm:mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <Check className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2">You&apos;re all caught up 🎉</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  No new notifications. We&apos;ll let you know when something important happens.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {filteredNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`p-3 sm:p-4 transition-colors ${notification.read ? '' : 'bg-primary/5 border-primary/20'}`}
                >
                  <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
                    <div className={`mt-0.5 sm:mt-1 h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm sm:text-base">{notification.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 sm:mt-2">
                        <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>

                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
