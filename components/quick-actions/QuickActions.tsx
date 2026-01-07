"use client";

import { Plus, Image, Sparkles, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function QuickActions() {
  const router = useRouter();

  return (
    <div className="fixed bottom-24 right-4 z-40 md:bottom-6 flex flex-col gap-2">
      <Button
        onClick={() => router.push("/generate")}
        size="icon"
        className="h-14 w-14 rounded-full bg-gradient-to-r from-purple-600 to-purple-500 shadow-lg hover:shadow-xl transition-shadow"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
}

