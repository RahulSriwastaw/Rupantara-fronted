"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Analytics tracking component
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Track page views
    if (typeof window !== "undefined") {
      // Google Analytics (if configured)
      if (window.gtag) {
        window.gtag("config", process.env.NEXT_PUBLIC_GA_ID || "", {
          page_path: pathname,
        });
      }

      // Custom analytics
      console.log("Page view:", pathname);
    }
  }, [pathname]);

  return <>{children}</>;
}

// Track events
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (typeof window !== "undefined") {
    // Google Analytics
    if (window.gtag) {
      window.gtag("event", eventName, properties);
    }

    // Custom tracking
    console.log("Event:", eventName, properties);
  }
}

// Extend Window interface
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

