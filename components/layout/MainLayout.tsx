"use client";

import { ReactNode, useEffect, useState } from "react";
import { BottomNav } from "./BottomNav";
import { SidebarNav } from "./SidebarNav";
import { TopHeader } from "./TopHeader";
import { useWalletStore } from "@/store/walletStore";
import { useGenerationStore } from "@/store/generationStore";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

interface MainLayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
  showTopHeader?: boolean;
}

export function MainLayout({
  children,
  showBottomNav = true,
  showTopHeader = true,
}: MainLayoutProps) {
  const router = useRouter();
  const { fetchWalletData } = useWalletStore();
  const { fetchGenerations } = useGenerationStore();
  const { user } = useAuthStore();
  const [hasHydrated, setHasHydrated] = useState<boolean>(() => (useAuthStore as any).persist?.hasHydrated?.() ?? false);

  // Wait for Zustand persist hydration to complete
  useEffect(() => {
    const persist = (useAuthStore as any).persist;
    if (persist?.hasHydrated?.() && !hasHydrated) {
      setHasHydrated(true);
    }
    const unsub = persist?.onFinishHydration?.(() => setHasHydrated(true));
    return () => { if (typeof unsub === "function") unsub(); };
  }, [hasHydrated]);

  // Auth guard: run only after hydration; if no user, redirect to login
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hasHydrated) return;
    // Removed token check as requested - rely only on user state
    if (!user) {
      router.replace("/login");
    }
  }, [user, router, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (user) {
      fetchWalletData();
      fetchGenerations();
    }
  }, [user, fetchWalletData, fetchGenerations, hasHydrated]);

  return (
    <div className="flex min-h-screen bg-background overflow-x-hidden">
      {/* Sidebar Navigation - Desktop Only */}
      {showBottomNav && <SidebarNav />}

      <div className="flex flex-col flex-1 min-h-screen w-full md:ml-20 max-w-full">
        {showTopHeader && <TopHeader />}

        <main id="main-content" className="flex-1 pb-16 sm:pb-20 md:pb-0 px-2 sm:px-3 md:px-4 lg:px-6 w-full max-w-full overflow-x-hidden">
          <div className="w-full max-w-full">
            {children}
          </div>
        </main>

        {/* Bottom Navigation - Mobile Only */}
        {showBottomNav && <BottomNav />}
      </div>
    </div>
  );
}

