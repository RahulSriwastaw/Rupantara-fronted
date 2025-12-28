"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Wallet,
  Plus,
  Clock,
  Crown,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Home",
    icon: Home,
    href: "/",
  },
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

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 flex-col bg-card border-r border-border z-40 shadow-lg">
      <nav className="flex flex-col gap-0.5 w-full px-1.5 py-3 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = 
            (item.href === "/" && (pathname === "/" || pathname === "/template")) ||
            (item.href === "/template" && pathname === "/template") ||
            (item.href !== "/" && item.href !== "/template" && pathname === item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full py-2 rounded-lg transition-all group relative",
                "hover:bg-primary/10 hover:border-primary/20",
                isActive
                  ? "bg-primary/15 text-primary border-l-2 border-primary shadow-sm shadow-primary/20"
                  : "text-muted-foreground border-l-2 border-transparent"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-md transition-all",
                isActive
                  ? "bg-primary/20 text-primary"
                  : "bg-secondary/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
              )}>
                <Icon
                  className={cn(
                    "w-4 h-4 transition-all",
                    isActive 
                      ? "text-primary stroke-2" 
                      : "stroke-[1.5] group-hover:text-primary"
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium text-center leading-tight",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground group-hover:text-primary"
                )}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-primary rounded-l-full shadow-md shadow-primary/50" />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

