"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, LayoutDashboard, FileImage, TrendingUp, User, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";

export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isCreator } = useAuthStore();

  useEffect(() => {
    if (!isCreator) {
      router.push("/profile");
    }
  }, [isCreator, router]);

  if (!isCreator) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="w-full flex h-14 sm:h-16 items-center justify-between px-2 sm:px-3 md:px-4 lg:px-6">
          <div className="flex items-center gap-1 sm:gap-2 md:gap-4 min-w-0 flex-1">
            <Link href="/template">
              <Button variant="ghost" size="sm" className="h-8 sm:h-9 px-2 sm:px-3">
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Return to Main App</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
            <h1 className="text-sm sm:text-base md:text-lg font-bold truncate">Creator Dashboard</h1>
            <span className="hidden sm:inline-flex text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-primary/10 text-primary whitespace-nowrap">
              Creator Mode
            </span>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground truncate ml-2">
            <span className="hidden sm:inline">Welcome, </span>
            <span className="truncate max-w-[100px] sm:max-w-none">{user?.fullName}</span>
          </div>
        </div>
      </header>

      {/* Sidebar & Content */}
      <div className="w-full flex flex-col lg:flex-row gap-3 sm:gap-4 md:gap-6 py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-4 lg:px-6">
        {/* Mobile Nav */}
        <nav className="lg:hidden w-full">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
            <Link href="/dashboard">
              <Button variant="outline" className="w-full justify-center text-xs sm:text-sm py-1.5 sm:py-2 h-auto">
                <LayoutDashboard className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1.5" />
                <span className="ml-1 sm:ml-0">Overview</span>
              </Button>
            </Link>
            <Link href="/templates">
              <Button variant="outline" className="w-full justify-center text-xs sm:text-sm py-1.5 sm:py-2 h-auto">
                <FileImage className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1.5" />
                <span className="ml-1 sm:ml-0">Templates</span>
              </Button>
            </Link>
            <Link href="/earnings">
              <Button variant="outline" className="w-full justify-center text-xs sm:text-sm py-1.5 sm:py-2 h-auto">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1.5" />
                <span className="ml-1 sm:ml-0">Earnings</span>
              </Button>
            </Link>
            <Link href="/notifications">
              <Button variant="outline" className="w-full justify-center text-xs sm:text-sm py-1.5 sm:py-2 h-auto">
                <Bell className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1.5" />
                <span className="ml-1 sm:ml-0">Alerts</span>
              </Button>
            </Link>
            <Link href="/creator-profile">
              <Button variant="outline" className="w-full justify-center text-xs sm:text-sm py-1.5 sm:py-2 h-auto">
                <User className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1.5" />
                <span className="ml-1 sm:ml-0">Profile</span>
              </Button>
            </Link>
            <Link href="/support">
              <Button variant="outline" className="w-full justify-center text-xs sm:text-sm py-1.5 sm:py-2 h-auto">
                <User className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1.5" />
                <span className="ml-1 sm:ml-0">Support</span>
              </Button>
            </Link>
          </div>
        </nav>
        {/* Sidebar */}
        <aside className="w-full lg:w-64 space-y-1 sm:space-y-2 hidden lg:block flex-shrink-0">
          <Link href="/dashboard">
            <Button variant="ghost" className="w-full justify-start">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Overview
            </Button>
          </Link>
          <Link href="/templates">
            <Button variant="ghost" className="w-full justify-start">
              <FileImage className="h-4 w-4 mr-2" />
              Templates
            </Button>
          </Link>
          <Link href="/earnings">
            <Button variant="ghost" className="w-full justify-start">
              <TrendingUp className="h-4 w-4 mr-2" />
              Earnings
            </Button>
          </Link>
          <Link href="/notifications">
            <Button variant="ghost" className="w-full justify-start">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Button>
          </Link>
          <Link href="/creator-profile">
            <Button variant="ghost" className="w-full justify-start">
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
          </Link>
          <Link href="/support">
            <Button variant="ghost" className="w-full justify-start">
              <User className="h-4 w-4 mr-2" />
              Support & Help
            </Button>
          </Link>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 w-full">{children}</main>
      </div>
    </div>
  );
}

