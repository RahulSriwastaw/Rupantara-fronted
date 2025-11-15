"use client";

import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { TopHeader } from "./TopHeader";

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

