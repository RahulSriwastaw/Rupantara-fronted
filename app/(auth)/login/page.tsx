"use client";

import { useState, useEffect } from "react";
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

// Use centralized config for API URL (handles mobile builds properly)
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

  // Check for redirect result (for mobile/Capacitor apps)
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      // First check if user is already logged in
      if (user && user.email) {
        console.log("✅ User already logged in, redirecting...");
        router.replace("/template");
        return;
      }

      // Check for Google redirect result (for mobile apps)
      if (auth) {
        try {
          const result = await getRedirectResult(auth);
          if (result && result.user) {
            console.log("✅ Google redirect login successful");
            // Handle redirect result inline to avoid dependency issues
            try {
              setIsGoogleLoading(true);
              const idToken = await result.user.getIdToken();
              const response = await fetch(`${API_URL}/auth/firebase-login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
              });
              const data = await response.json();
              if (!response.ok) {
                throw new Error(data.msg || data.error || "Failed to sync with backend");
              }
              if (data.token) {
                localStorage.setItem("token", data.token);
              }
              const userData = {
                id: String(data.user?.id || data.user?._id || result.user.uid),
                fullName: String(data.user?.name || result.user.displayName || "User"),
                email: String(data.user?.email || result.user.email),
                phone: String(data.user?.phone || result.user.phoneNumber || ""),
                isCreator: Boolean(data.user?.isCreator || false),
                isVerified: Boolean(result.user.emailVerified),
                memberSince: String(data.user?.joinedDate || new Date().toISOString()),
                pointsBalance: Number(data.user?.points || 50),
                profilePicture: String(data.user?.photoURL || result.user.photoURL || ""),
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
            return;
          }
        } catch (error: any) {
          console.error("❌ Redirect result error:", error);
          // Don't show error for cancelled redirects
          if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
            toast({
              title: "Login Error",
              description: error.message || "Could not complete Google login",
              variant: "destructive",
            });
          }
        }
      }

      setIsCheckingAuth(false);
    };

    checkAuthAndRedirect();
  }, [user, router, toast, login]);

  const handleGoogleUser = async (googleUser: any) => {
    try {
      setIsGoogleLoading(true);

      // Get Firebase ID token
      const idToken = await googleUser.getIdToken();
      console.log("🔐 Got Firebase ID token, syncing with backend...");
      console.log("📡 API URL:", API_URL);

      // Sync with backend
      const response = await fetch(`${API_URL}/auth/firebase-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      console.log("📦 Backend response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Backend error response:", errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `HTTP ${response.status}` };
        }
        throw new Error(errorData.msg || errorData.error || "Failed to sync with backend");
      }

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
      console.error("❌ Error details:", {
        message: error.message,
        stack: error.stack,
        apiUrl: API_URL,
      });
      
      // Better error messages
      let errorMessage = error.message || "Could not complete Google login";
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        errorMessage = `Unable to connect to server (${API_URL}). Please check your internet connection.`;
      } else if (error.message?.includes('timeout')) {
        errorMessage = "Request timeout. Server may be slow or unreachable.";
      }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
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
      // Detect if we're running in Capacitor (mobile app)
      const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor;

      if (isCapacitor) {
        // Use native Capacitor Firebase Auth for mobile apps
        console.log("📱 Using native Firebase Auth for Capacitor");

        try {
          // Import dynamically to avoid issues in web build
          const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');

          // Sign in with native Google Sign-In
          const result = await FirebaseAuthentication.signInWithGoogle();

          // Get the credential and sign in to Firebase
          if (result.credential?.idToken) {
            const credential = GoogleAuthProvider.credential(result.credential.idToken);
            const userCredential = await signInWithCredential(auth, credential);
            await handleGoogleUser(userCredential.user);
            return;
          } else {
            throw new Error('No credential returned from native auth');
          }
        } catch (nativeError: any) {
          console.error("❌ Native auth error:", nativeError);
          console.error("❌ Native error details:", {
            message: nativeError.message,
            code: nativeError.code,
            error: nativeError.error,
            toString: nativeError.toString(),
          });
          
          // For ANY native plugin error, automatically fallback to redirect
          // This ensures seamless login experience even if native plugin fails
          console.log("⚠️ Native plugin error detected, automatically falling back to redirect method");
          console.log("🔄 Attempting redirect login...");
          
          try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });
            await signInWithRedirect(auth, provider);
            // Don't set loading to false, page will redirect
            return;
          } catch (redirectError: any) {
            console.error("❌ Redirect also failed:", redirectError);
            console.error("❌ Redirect error details:", {
              message: redirectError.message,
              code: redirectError.code,
              error: redirectError.error,
            });
            
            // Check for specific redirect errors
            if (redirectError.code === 'auth/unauthorized-domain' || redirectError.message?.includes('unauthorized-domain')) {
              throw new Error('Domain not authorized. Please configure Firebase Console settings.');
            } else if (redirectError.message?.includes('Failed to fetch') || redirectError.message?.includes('NetworkError')) {
              throw new Error('Network error. Please check your internet connection.');
            } else if (redirectError.code === 'auth/operation-not-allowed') {
              throw new Error('Google login is not enabled. Please contact support.');
            } else {
              // Generic error - don't throw, let it fall through to outer catch
              throw redirectError;
            }
          }
        }
      }

      // For web/desktop, use Firebase Web SDK popup
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile && window.innerWidth < 768) {
        // Mobile browser - use redirect
        console.log("📱 Using redirect for mobile browser");
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        await signInWithRedirect(auth, provider);
        return;
      }

      // Desktop - use popup
      console.log("🖥️ Using popup for desktop");
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
      });

      const result = await signInWithPopup(auth, provider);

      // Handle the user immediately
      await handleGoogleUser(result.user);

    } catch (error: any) {
      console.error("❌ Google login error:", error);

      // Only show error if user didn't close popup intentionally
      if (error.code === 'auth/popup-blocked') {
        // If popup is blocked, fallback to redirect
        console.log("⚠️ Popup blocked, falling back to redirect");
        try {
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          await signInWithRedirect(auth, provider);
          return; // Don't set loading to false, page will redirect
        } catch (redirectError: any) {
          toast({
            title: "Login Failed",
            description: "Please allow popups or try again.",
            variant: "destructive",
          });
        }
      } else if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        // User closed popup - don't show error
        console.log("User closed Google login popup");
      } else if (error.code === 'auth/unauthorized-domain' || error.message?.includes('unauthorized-domain') || error.message?.includes('Domain Not Authorized')) {
        // Try redirect as fallback
        console.log("⚠️ Unauthorized domain error, trying redirect as fallback");
        try {
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          await signInWithRedirect(auth, provider);
          return; // Don't set loading to false, page will redirect
        } catch (redirectError: any) {
          toast({
            title: "Domain Not Authorized",
            description: "Google login domain not authorized. Please check Firebase Console settings. SHA-1 fingerprint and OAuth client must be properly configured.",
            variant: "destructive",
          });
        }
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError') || error.message?.includes('Network request failed')) {
        toast({
          title: "Network Error",
          description: "Unable to connect to server. Please check your internet connection and try again.",
          variant: "destructive",
        });
      } else if (error.message?.includes('Domain not authorized') || error.code === 'auth/unauthorized-domain') {
        toast({
          title: "Domain Not Authorized",
          description: "Google login domain not authorized. Please check Firebase Console settings. SHA-1 fingerprint and OAuth client must be properly configured.",
          variant: "destructive",
        });
      } else if (error.message?.includes('Google login failed')) {
        // This is the error from redirect fallback - show network error
        toast({
          title: "Connection Error",
          description: "Unable to connect to Google. Please check your internet connection and try again.",
          variant: "destructive",
        });
      } else {
        // More specific error messages
        let errorTitle = "Google Login Failed";
        let errorDescription = error.message || "Could not sign in with Google. Please try again.";
        
        if (error.code === 'auth/operation-not-allowed') {
          errorTitle = "Login Not Available";
          errorDescription = "Google login is not enabled. Please contact support.";
        } else if (error.code === 'auth/network-request-failed') {
          errorTitle = "Network Error";
          errorDescription = "Unable to connect to Google. Please check your internet connection.";
        }
        
        toast({
          title: errorTitle,
          description: errorDescription,
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

      // Create timeout promise (30 seconds)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 30000);
      });

      // Race between fetch and timeout
      const response = await Promise.race([
        fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }),
        timeoutPromise
      ]);

      // Check if response is valid
      if (!response || !response.ok) {
        const errorData = await response.json().catch(() => ({
          msg: `Server error: ${response?.status || 'Unknown'}`,
          error: `Server error: ${response?.status || 'Unknown'}`
        }));
        throw new Error(errorData.msg || errorData.error || "Login failed");
      }

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
      console.error("❌ Error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
        apiUrl: API_URL
      });

      // Better error messages for network issues
      let errorMessage = error.message || "Please check your credentials";
      let errorTitle = "Login Failed";
      
      if (error.message === 'Request timeout' || error.message?.includes('timeout')) {
        errorTitle = "Connection Timeout";
        errorMessage = "Request took too long. Please check your internet connection and try again.";
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError') || error.message?.includes('Network request failed')) {
        errorTitle = "Connection Error";
        errorMessage = "Unable to connect to server. Please check your internet connection and try again.";
      } else if (error.message?.includes('CORS') || error.message?.includes('CORS policy')) {
        errorTitle = "Connection Error";
        errorMessage = "Unable to connect to server. Please check your internet connection.";
      } else if (error.message?.includes('Server error') || error.message?.includes('500')) {
        errorTitle = "Server Error";
        errorMessage = "Server is temporarily unavailable. Please try again later.";
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-3 sm:p-4 md:p-6 bg-transparent">

      <Card className="w-full max-w-[95%] sm:max-w-md relative z-10 p-6 sm:p-8 md:p-10 space-y-5 sm:space-y-6 shadow-2xl border border-white/10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-2xl">
        {/* Header */}
        <div className="text-center space-y-2 sm:space-y-3">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="relative">
              <Image
                src="/logo.png"
                alt="Rupantar AI"
                width={64}
                height={64}
                className="h-16 w-16 sm:h-20 sm:w-20"
              />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Sign in to your Rupantar AI account</p>
        </div>

        {/* Google Login Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 sm:h-14 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 text-sm sm:text-base font-medium shadow-sm hover:shadow-md"
          onClick={handleGoogleLogin}
          disabled={isLoading || isGoogleLoading}
        >
          {isGoogleLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              <span>Connecting to Google...</span>
            </>
          ) : (
            <>
              <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
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
            className="w-full h-12 sm:h-14 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base font-semibold text-white"
            disabled={isLoading || isGoogleLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
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
