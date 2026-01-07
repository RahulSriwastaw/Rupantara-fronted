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
    router.push("/login");
  }, [login, claimDailyLogin, router, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting to Login...</h1>
        <p className="text-muted-foreground">Please log in to access creator features.</p>
      </div>
    </div>
  );
}
