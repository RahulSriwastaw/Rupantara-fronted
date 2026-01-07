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
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-safe border-t border-primary/5 bg-background/80 backdrop-blur-lg md:hidden">
      <div className="w-full max-w-7xl mx-auto flex h-16 items-center justify-around">
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
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-600 shadow-lg hover:shadow-xl transition-all active:scale-95 border-4 border-background">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <span className={cn(
                  "mt-1 text-[10px] font-semibold transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
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
                "flex flex-col items-center justify-center gap-1 transition-all active:scale-90 flex-1",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary/70"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "fill-primary/10")} />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
