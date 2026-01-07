"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:bottom-4 md:left-auto md:right-4 md:w-80">
      <Card className="border-orange-500/50 bg-orange-500/10">
        <CardContent className="p-3 flex items-center gap-3">
          <WifiOff className="h-5 w-5 text-orange-500" />
          <div className="flex-1">
            <p className="text-sm font-semibold">You’re offline</p>
            <p className="text-xs text-muted-foreground">
              Some features may not work
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

