"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Image as ImageIcon, Zap, Crown } from "lucide-react";

export default function WelcomePage() {
  return (
    <Card className="w-full max-w-md p-8 space-y-6 bg-card/80 backdrop-blur-xl border-border/50">
      {/* Logo */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative h-24 w-24">
          <Image
            src="/logo.png"
            alt="Rupantar AI"
            fill
            className="object-contain"
            priority
            unoptimized
          />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">
          Rupantra AI
        </h1>
        <p className="text-center text-muted-foreground">
          Transform your photos with AI magic
        </p>
      </div>

      {/* Features */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
            <ImageIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium">AI-Powered Generation</p>
            <p className="text-xs text-muted-foreground">
              Create stunning images with AI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <div className="h-10 w-10 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center">
            <Zap className="h-5 w-5 text-pink-600 dark:text-pink-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium">1000+ Templates</p>
            <p className="text-xs text-muted-foreground">
              Choose from vast collection
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
            <Crown className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Premium Quality</p>
            <p className="text-xs text-muted-foreground">
              Up to 8K resolution support
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3 pt-4">
        <Link href="/register" className="block">
          <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg shadow-purple-500/30" size="lg">
            Get Started
          </Button>
        </Link>
        <Link href="/login" className="block">
          <Button variant="outline" className="w-full border-border/50 bg-secondary/50 hover:bg-secondary" size="lg">
            Sign In
          </Button>
        </Link>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        By continuing, you agree to our{" "}
        <Link href="/terms" className="text-primary hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-primary hover:underline">
          Privacy Policy
        </Link>
      </p>
    </Card>
  );
}

