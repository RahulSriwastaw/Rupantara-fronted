"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useWalletStore } from "@/store/walletStore";
import { useToast } from "@/hooks/use-toast";

export default function CreatorLogin() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { claimDailyLogin } = useWalletStore();
  const { toast } = useToast();

  useEffect(() => {
    // Mock creator login for demo purposes
    const mockCreatorUser = {
      id: "creator_123",
      fullName: "Creator Demo",
      email: "creator@rupantar.ai",
      phone: "+91 9876543210",
      isCreator: true,
      isVerified: true,
      memberSince: new Date().toISOString(),
      pointsBalance: 1000,
    };
    
    login(mockCreatorUser);
    claimDailyLogin();
    
    toast({
      title: "Welcome Creator!",
      description: "You've been logged in as a demo creator.",
    });
    
    // Redirect to creator dashboard route group -> /dashboard
    router.push("/dashboard");
  }, [login, claimDailyLogin, router, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Logging you in as Creator...</h1>
        <p className="text-muted-foreground">Please wait while we redirect you to the creator dashboard.</p>
      </div>
    </div>
  );
}