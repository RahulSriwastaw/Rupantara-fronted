"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, Sparkles, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "https://new-backend-g2gw.onrender.com/api";

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

  // Simple redirect check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user && user.email) {
        console.log("✅ User already logged in, redirecting...");
        router.replace("/template");
      } else {
        setIsCheckingAuth(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [user, router]);

  // Check for Google redirect result
  useEffect(() => {
    const checkGoogleRedirect = async () => {
      if (!auth) return;

      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          console.log("✅ Google redirect successful");
          await handleGoogleUser(result.user);
        }
      } catch (error: any) {
        console.error("❌ Google redirect error:", error);
        if (error.code !== 'auth/popup-closed-by-user') {
          toast({
            title: "Google Login Failed",
            description: error.message || "Could not complete Google login",
            variant: "destructive",
          });
        }
      }
    };

    checkGoogleRedirect();
  }, []);

  const handleGoogleUser = async (googleUser: any) => {
    try {
      setIsGoogleLoading(true);

      // Get Firebase ID token
      const idToken = await googleUser.getIdToken();

      // Sync with backend
      const response = await fetch(`${API_URL}/auth/firebase-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || data.error || "Failed to sync with backend");
      }

      // Save token
      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      // Create user object
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

      setTimeout(() => {
        router.replace("/template");
      }, 100);

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
    if (!auth) {
      toast({
        title: "Google Login Unavailable",
        description: "Firebase is not configured. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    setIsGoogleLoading(true);

    try {
      const provider = new GoogleAuthProvider();

      // Try popup first (better UX)
      try {
        const result = await signInWithPopup(auth, provider);
        await handleGoogleUser(result.user);
      } catch (popupError: any) {
        // If popup blocked, fall back to redirect
        if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/cancelled-popup-request') {
          console.log("Popup blocked, using redirect...");
          await signInWithRedirect(auth, provider);
          // Redirect will handle the rest
        } else {
          throw popupError;
        }
      }

    } catch (error: any) {
      console.error("❌ Google login error:", error);

      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        toast({
          title: "Google Login Failed",
          description: error.message || "Could not sign in with Google",
          variant: "destructive",
        });
      }

      setIsGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter email and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log("🔐 Login attempt:", { email, apiUrl: API_URL });

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || data.error || "Login failed");
      }

      if (!data.token || !data.user) {
        throw new Error("Invalid server response");
      }

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

      toast({
        title: "Welcome back!",
        description: `Logged in as ${userData.fullName}`,
      });

      setTimeout(() => {
        router.replace("/template");
      }, 100);

    } catch (error: any) {
      console.error("❌ Login error:", error);

      toast({
        title: "Login Failed",
        description: error.message || "Please check your credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-3 sm:p-4 md:p-6">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" />

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-purple-300/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-indigo-300/20 dark:bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-700" />

      <Card className="w-full max-w-[95%] sm:max-w-md relative z-10 p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 shadow-2xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        {/* Header */}
        <div className="text-center space-y-1.5 sm:space-y-2">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="p-2.5 sm:p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">Sign in to your Rupantar AI account</p>
        </div>

        {/* Google Login Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 sm:h-12 border-2 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all duration-200 text-sm sm:text-base"
          onClick={handleGoogleLogin}
          disabled={isLoading || isGoogleLoading}
        >
          {isGoogleLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
              <span className="text-sm sm:text-base">Connecting...</span>
            </>
          ) : (
            <>
              <svg className="mr-2 h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-sm sm:text-base">Continue with Google</span>
            </>
          )}
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-gray-900 px-2 text-muted-foreground text-xs sm:text-sm">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="email" className="text-sm">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 sm:top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                className="pl-10 h-11 sm:h-12 text-sm sm:text-base transition-all duration-200 focus:ring-2 focus:ring-indigo-500 border-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || isGoogleLoading}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs sm:text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 sm:top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="pl-10 pr-10 h-11 sm:h-12 text-sm sm:text-base transition-all duration-200 focus:ring-2 focus:ring-indigo-500 border-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || isGoogleLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 sm:top-3.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 sm:h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base font-semibold"
            disabled={isLoading || isGoogleLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-2">
          <p className="text-xs sm:text-sm">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
