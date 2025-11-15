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
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-card/95 backdrop-blur-xl">
      <div className="w-full flex h-16 sm:h-20 md:h-20 items-center justify-between px-3 sm:px-4 md:px-5 lg:px-6">
        {/* Logo */}
        <Link href="/template" className="flex items-center space-x-2 sm:space-x-2.5 md:space-x-3 min-w-0 flex-shrink-0 group hover:opacity-90 transition-opacity">
          <div className="relative h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-lg flex-shrink-0 flex items-center justify-center bg-transparent">
            <Image
              src="/logo.png"
              alt={APP_NAME}
              width={56}
              height={56}
              className="object-contain w-full h-full"
              priority
              unoptimized
            />
          </div>
          <span className="font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent text-base sm:text-lg md:text-xl lg:text-2xl whitespace-nowrap drop-shadow-sm">
            {APP_NAME}
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Points Display */}
          {isAuthenticated && (
            <Link href="/wallet">
              <Button variant="outline" size="sm" className="gap-1 sm:gap-2 h-8 sm:h-9">
                <span className="text-base sm:text-lg">💎</span>
                <span className="font-semibold text-sm sm:text-base">{balance}</span>
              </Button>
            </Link>
          )}

          {/* Notifications */}
          {isAuthenticated && <NotificationCenter />}

          {/* Profile */}
          {isAuthenticated ? (
            <Link href="/profile">
              <Avatar className="h-8 sm:h-9 w-8 sm:w-9 cursor-pointer ring-2 ring-primary/20">
                <AvatarImage src={user?.profilePicture} alt={user?.fullName} />
                <AvatarFallback className="bg-primary/10">
                  {user?.fullName?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Link href="/login">
              <Button size="sm" className="h-8 sm:h-9 text-sm sm:text-base">
                <User className="h-3 sm:h-4 w-3 sm:w-4 mr-1 sm:mr-2" />
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

