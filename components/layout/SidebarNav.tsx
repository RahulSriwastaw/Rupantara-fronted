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
  Bookmark,
  User,
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
    label: "Saved",
    icon: Bookmark,
    href: "/saved",
  },
  {
    label: "Pro",
    icon: Crown,
    href: "/pro",
  },
  {
    label: "Profile",
    icon: User,
    href: "/profile",
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-24 flex-col items-center py-4 bg-[#0a0a0a] border-r border-gray-800 z-40">
      <nav className="flex flex-col items-center gap-2 w-full px-2 overflow-y-auto">
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
                "flex flex-col items-center justify-center gap-1.5 w-full py-3 rounded-lg transition-all group relative",
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:bg-gray-900 hover:text-gray-200"
              )}
            >
              <Icon
                className={cn(
                  "w-6 h-6 transition-all",
                  isActive 
                    ? "text-white stroke-2" 
                    : "text-gray-400 stroke-[1.5] group-hover:text-gray-200"
                )}
              />
              <span
                className={cn(
                  "text-[11px] font-medium text-center leading-tight mt-0.5",
                  isActive 
                    ? "text-white font-semibold" 
                    : "text-gray-400 group-hover:text-gray-200"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

