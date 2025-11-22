"use client";

import { ReactNode, useEffect } from "react";
import { BottomNav } from "./BottomNav";
import { TopHeader } from "./TopHeader";
import { useWalletStore } from "@/store/walletStore";
import { useGenerationStore } from "@/store/generationStore";
import { useAuthStore } from "@/store/authStore";

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
  const { fetchWalletData } = useWalletStore();
  const { fetchGenerations } = useGenerationStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      fetchWalletData();
      fetchGenerations();
    }
  }, [user, fetchWalletData, fetchGenerations]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {showTopHeader && <TopHeader />}

      <main id="main-content" className="flex-1 pb-16 sm:pb-20 md:pb-0 px-2 sm:px-3 md:px-4 lg:px-6">
        {children}
      </main>

      {showBottomNav && <BottomNav />}
    </div>
  );
}

