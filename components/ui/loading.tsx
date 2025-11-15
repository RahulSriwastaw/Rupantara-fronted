"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
}

export function Loading({ size = "md", text, fullScreen = false }: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div
          className={cn(
            "rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center animate-pulse",
            sizeClasses[size]
          )}
        >
          <Sparkles className={cn("text-white", sizeClasses[size])} />
        </div>
        <div
          className={cn(
            "absolute inset-0 rounded-full bg-primary animate-ping opacity-20",
            sizeClasses[size]
          )}
        />
      </div>
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}

