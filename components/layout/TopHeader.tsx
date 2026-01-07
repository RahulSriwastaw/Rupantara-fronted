"use client";

import Link from "next/link";
import Image from "next/image";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { useAuthStore } from "@/store/authStore";
import { useWalletStore } from "@/store/walletStore";
import { APP_NAME } from "@/lib/constants";

export function TopHeader() {
  const { user, isAuthenticated } = useAuthStore();
  const { balance } = useWalletStore();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-card/95 backdrop-blur-xl max-w-full overflow-x-hidden">
      <div className="w-full max-w-full flex h-14 sm:h-16 md:h-20 items-center justify-between px-2 sm:px-3 md:px-4 lg:px-6">
        {/* Logo */}
        <Link href="/template" className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-3 min-w-0 flex-shrink-0 group hover:opacity-90 transition-opacity">
          <div className="relative h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-lg flex-shrink-0 flex items-center justify-center bg-transparent">
            <Image
              src="/logo.png"
              alt={APP_NAME}
              width={48}
              height={48}
              className="object-contain w-full h-full"
              priority
              unoptimized
            />
          </div>
          <span className="font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent text-sm sm:text-base md:text-lg lg:text-xl whitespace-nowrap drop-shadow-sm">
            {APP_NAME}
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
          {/* Points Display */}
          {isAuthenticated && (
            <Link href="/wallet">
              <Button variant="outline" size="sm" className="gap-1 h-7 sm:h-8 md:h-9 px-2 sm:px-3">
                <span className="text-sm sm:text-base">💎</span>
                <span className="font-semibold text-xs sm:text-sm md:text-base">{balance}</span>
              </Button>
            </Link>
          )}

          {/* Notifications */}
          {isAuthenticated && <NotificationCenter />}

          {/* Profile */}
          {isAuthenticated ? (
            <Link href="/profile">
              <Avatar className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 cursor-pointer ring-2 ring-primary/20 flex-shrink-0">
                <AvatarImage src={user?.profilePicture} alt={user?.fullName} />
                <AvatarFallback className="bg-primary/10 text-xs sm:text-sm">
                  {user?.fullName?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Link href="/login">
              <Button size="sm" className="h-7 sm:h-8 md:h-9 text-xs sm:text-sm md:text-base px-2 sm:px-3">
                <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden sm:inline">Login</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

