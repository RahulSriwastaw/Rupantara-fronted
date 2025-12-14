"use client";

import { useState } from "react";
import { Bell, Check, X, Clock, AlertCircle, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mockNotifications = [
  {
    id: 1,
    type: "template",
    title: "Your template '3D Avatar' has been approved ✅",
    description: "Your template is now live and available to all users.",
    time: "2 hours ago",
    unread: true,
  },
  {
    id: 2,
    type: "payment",
    title: "Payout ₹500 processed successfully 💸",
    description: "Your earnings have been transferred to your bank account.",
    time: "1 day ago",
    unread: false,
  },
  {
    id: 3,
    type: "system",
    title: "New update: You can now create HD templates",
    description: "We've added support for high-definition template creation.",
    time: "2 days ago",
    unread: false,
  },
  {
    id: 4,
    type: "template",
    title: "Template review in progress ⏳",
    description: "Your 'Cyberpunk Character' template is under review.",
    time: "3 days ago",
    unread: false,
  },
  {
    id: 5,
    type: "payment",
    title: "New earnings: ₹150 from template usage",
    description: "Your 'Pastel Dreams' template generated new income.",
    time: "4 days ago",
    unread: false,
  },
];

export default function CreatorNotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [activeTab, setActiveTab] = useState("all");

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, unread: false } : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, unread: false })));
  };

  const filteredNotifications = activeTab === "all" 
    ? notifications 
    : notifications.filter(notif => notif.type === activeTab);

  const unreadCount = notifications.filter(n => n.unread).length;

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
          disabled={unreadCount === 0}
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
          <TabsTrigger value="payment" className="text-xs sm:text-sm py-1.5 sm:py-2">Payment</TabsTrigger>
          <TabsTrigger value="system" className="text-xs sm:text-sm py-1.5 sm:py-2">System</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-2 sm:space-y-3 mt-3 sm:mt-4">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-6 sm:p-8 md:p-12 text-center">
                <div className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 mx-auto mb-3 sm:mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <Check className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2">You&#39;re all caught up 🎉</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  No new notifications. We&#39;ll let you know when something important happens.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {filteredNotifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`p-3 sm:p-4 ${notification.unread ? 'bg-primary/5 border-primary/20' : ''}`}
                >
                  <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
                    <div className={`mt-0.5 sm:mt-1 h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      notification.type === 'template' ? 'bg-blue-500/20 text-blue-500' :
                      notification.type === 'payment' ? 'bg-green-500/20 text-green-500' :
                      'bg-blue-500/20 text-blue-500'
                    }`}>
                      {notification.type === 'template' ? <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" /> :
                       notification.type === 'payment' ? <Info className="h-3 w-3 sm:h-4 sm:w-4" /> :
                       <Info className="h-3 w-3 sm:h-4 sm:w-4" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm sm:text-base">{notification.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {notification.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 sm:mt-2">
                        <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {notification.time}
                        </span>
                      </div>
                    </div>
                    
                    {notification.unread && (
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
