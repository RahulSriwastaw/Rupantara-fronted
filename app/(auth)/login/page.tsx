"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signInWithCredential } from "firebase/auth";

import { getApiUrl } from "@/lib/config";

const API_URL = getApiUrl();

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuthStore();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [isCapacitor, setIsCapacitor] = useState(false);

  useEffect(() => {
    const capacitor = typeof window !== 'undefined' && (window as any).Capacitor;
    setIsCapacitor(!!capacitor);
  }, []);

  // Simplified redirect logic to prevent loops
  useEffect(() => {
    const checkAuth = () => {
      const currentUser = useAuthStore.getState().user;
      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;

      // Strict check: User must be in store AND token must be in localStorage
      if (currentUser && currentUser.email && token) {
        console.log("✅ User already logged in, redirecting...");
        router.replace("/template");
        return true;
      }
      return false;
    };

    if (checkAuth()) {
      setIsCheckingAuth(false);
      return;
    }

    const checkRedirect = async () => {
      if (!auth) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          console.log("✅ Google redirect login successful");
          await handleGoogleUser(result.user);
        }
      } catch (error: any) {
        console.error("❌ Redirect result error:", error);
        if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
          toast({
            title: "Login Error",
            description: error.message || "Could not complete Google login",
            variant: "destructive",
          });
        }
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkRedirect();
  }, [router, toast]);

  const handleGoogleUser = async (googleUser: any) => {
    try {
      setIsGoogleLoading(true);
      const idToken = await googleUser.getIdToken();

      const response = await fetch(`${API_URL}/auth/firebase-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to sync" }));
        throw new Error(errorData.msg || errorData.error || "Failed to sync with backend");
      }

      const data = await response.json();
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      const userData = {
        id: String(data.user?.id || data.user?._id || googleUser.uid),
        fullName: String(data.user?.name || googleUser.displayName || "User"),
        email: String(data.user?.email || googleUser.email),
        phone: String(data.user?.phone || googleUser.phoneNumber || ""),
        isCreator: Boolean(data.user?.isCreator || false),
        isVerified: Boolean(googleUser.emailVerified),
        memberSince: String(data.user?.joinedDate || new Date().toISOString()),
        pointsBalance: Number(data.user?.points || 50),
        profilePicture: String(data.user?.photoURL || googleUser.photoURL || ""),
      };

      login(userData as any);

      toast({
        title: "Welcome! 🎉",
        description: `Logged in as ${userData.fullName}`,
      });

      // Use hard navigation for mobile/capacitor to ensure storage persistence
      if (isCapacitor || (typeof window !== 'undefined' && window.innerWidth < 768)) {
        window.location.href = "/template";
      } else {
        router.replace("/template");
      }
    } catch (error: any) {
      console.error("❌ Google sync error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Could not complete Google login",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth) return;
    setIsGoogleLoading(true);

    try {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isCapacitorApp = typeof window !== 'undefined' && (window as any).Capacitor;

      if (isCapacitorApp || (isMobile && window.innerWidth < 768)) {
        console.log("📱 Using redirect for mobile");
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        await signInWithRedirect(auth, provider);
        return;
      }

      console.log("🖥️ Using popup for desktop");
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      await handleGoogleUser(result.user);
    } catch (error: any) {
      console.error("❌ Google login error:", error);
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({
          title: "Login Failed",
          description: error.message || "Could not sign in with Google",
          variant: "destructive",
        });
      }
      setIsGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Login failed" }));
        throw new Error(errorData.msg || errorData.error || "Login failed");
      }

      const data = await response.json();
      localStorage.setItem("token", data.token);

      const userData = {
        id: String(data.user.id || data.user._id),
        fullName: String(data.user.name || data.user.fullName || "User"),
        email: String(data.user.email),
        phone: String(data.user.phone || ""),
        isCreator: Boolean(data.user.isCreator || data.user.role === "creator"),
        isVerified: true,
        memberSince: String(data.user.joinedDate || new Date().toISOString()),
        pointsBalance: Number(data.user.points || 0),
        profilePicture: String(data.user.photoURL || ""),
      };

      login(userData as any);
      toast({ title: "Welcome back!", description: `Logged in as ${userData.fullName}` });

      // Use hard navigation for mobile/capacitor to ensure storage persistence
      if (isCapacitor || (typeof window !== 'undefined' && window.innerWidth < 768)) {
        window.location.href = "/template";
      } else {
        router.replace("/template");
      }
    } catch (error: any) {
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/90 to-primary/5 p-4 sm:p-6">
      <Card className="w-full max-w-md p-6 sm:p-8 space-y-6 shadow-xl border-primary/10">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-2xl flex items-center justify-center overflow-hidden">
              <Image src="/logo.png" alt="Rupantar AI" fill className="object-contain p-2" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to continue to Rupantar AI</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="pl-10"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pl-10"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full h-11 text-base font-medium transition-all hover:scale-[1.01]" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Sign In"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-muted" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or continue with</span></div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full h-11 space-x-2 border-primary/20 hover:bg-primary/5 transition-all"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>Google</span>
            </>
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary font-semibold hover:underline">Sign up</Link>
        </p>
      </Card>
    </div>
  );
}
