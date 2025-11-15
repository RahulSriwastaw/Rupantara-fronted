"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Wallet,
  Plus,
  Clock,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Template",
    icon: LayoutGrid,
    href: "/template",
  },
  {
    label: "Wallet",
    icon: Wallet,
    href: "/wallet",
  },
  {
    label: "Generate",
    icon: Plus,
    href: "/generate",
    isCenter: true,
  },
  {
    label: "History",
    icon: Clock,
    href: "/history",
  },
  {
    label: "Pro",
    icon: Crown,
    href: "/pro",
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-card/95 backdrop-blur-xl md:hidden">
      <div className="w-full flex h-14 sm:h-16 items-center justify-around px-2 sm:px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-8"
              >
                <div className="flex h-12 sm:h-14 w-12 sm:w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                  <Icon className="h-5 sm:h-6 w-5 sm:w-6 text-white" />
                </div>
                <span className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs font-medium">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-[10px] sm:text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

