"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Mail, Phone, Lock, Loader2, Sparkles, Eye, EyeOff, Check, X } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "https://new-backend-g2gw.onrender.com/api";

export default function RegisterPage() {
  const router = useRouter();
  const { login, user } = useAuthStore();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: "", color: "" };
    if (password.length < 6) return { strength: 1, label: "Weak", color: "bg-red-500" };
    if (password.length < 10) return { strength: 2, label: "Fair", color: "bg-yellow-500" };
    if (password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { strength: 3, label: "Strong", color: "bg-green-500" };
    }
    return { strength: 2, label: "Good", color: "bg-blue-500" };
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;

  // Redirect if already logged in
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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
        title: "Welcome to Rupantar AI! 🎉",
        description: `Account created successfully! You have ${userData.pointsBalance} points.`,
      });

      setTimeout(() => {
        router.replace("/template");
      }, 100);

    } catch (error: any) {
      console.error("❌ Google sync error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "Could not complete Google registration",
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
      
      // Add custom parameters for better UX
      provider.setCustomParameters({
        prompt: 'select_account',
        hd: '*',
      });

      // Use popup (better UX, no redirect)
      const result = await signInWithPopup(auth, provider);
      
      // Handle the user immediately
      await handleGoogleUser(result.user);

    } catch (error: any) {
      console.error("❌ Google login error:", error);

      if (error.code === 'auth/popup-blocked') {
        toast({
          title: "Popup Blocked",
          description: "Please allow popups for this site and try again.",
          variant: "destructive",
        });
      } else if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        console.log("User closed Google login popup");
      } else if (error.code === 'auth/unauthorized-domain') {
        toast({
          title: "Domain Not Authorized",
          description: "Please contact support to authorize this domain for Google login.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Google Login Failed",
          description: error.message || "Could not sign in with Google. Please try again.",
          variant: "destructive",
        });
      }

      setIsGoogleLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.fullName || !formData.email || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords don't match",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (!formData.terms) {
      toast({
        title: "Error",
        description: "Please accept the terms and conditions",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log("📝 Registration attempt:", { email: formData.email, apiUrl: API_URL });

      // Call backend registration endpoint
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
        }),
      });

      const data = await response.json();

      console.log("📦 Server response:", { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.msg || data.error || "Registration failed");
      }

      if (!data.token || !data.user) {
        throw new Error("Invalid server response - missing token or user");
      }

      // Save token
      localStorage.setItem("token", data.token);
      console.log("✅ Token saved to localStorage");

      // Create proper user object
      const userData = {
        id: String(data.user.id || data.user._id),
        fullName: String(data.user.name || data.user.fullName || formData.fullName),
        email: String(data.user.email),
        phone: String(data.user.phone || formData.phone || ""),
        isCreator: Boolean(data.user.isCreator || false),
        isVerified: true,
        memberSince: String(data.user.joinedDate || data.user.createdAt || new Date().toISOString()),
        pointsBalance: Number(data.user.points || 50), // New users get 50 points
        profilePicture: String(data.user.photoURL || data.user.avatar || ""),
      };

      console.log("👤 User data prepared:", userData);

      // Login to store
      login(userData as any);
      console.log("✅ User registered and logged into Zustand store");

      // Success message
      toast({
        title: "Welcome to Rupantar AI! 🎉",
        description: `Account created successfully! You have ${userData.pointsBalance} points.`,
      });

      console.log("🔄 Redirecting to /template...");

      // Small delay to ensure store update
      setTimeout(() => {
        router.replace("/template");
      }, 100);

    } catch (error: any) {
      console.error("❌ Registration error:", error);

      toast({
        title: "Registration Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-3 sm:p-4 md:p-6">
      {/* Professional Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" />
      
      {/* Animated Mesh Gradient Overlay */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_50%,rgba(120,119,198,0.3),transparent_50%)]" />
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_50%,rgba(139,92,246,0.3),transparent_50%)]" />
        <div className="absolute bottom-0 left-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_80%,rgba(99,102,241,0.2),transparent_50%)]" />
      </div>

      {/* Animated Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <Card className="w-full max-w-[95%] sm:max-w-md relative z-10 p-6 sm:p-8 md:p-10 space-y-5 sm:space-y-6 shadow-2xl border border-white/10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-2xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center space-y-2 sm:space-y-3">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur-lg opacity-50 animate-pulse" />
              <div className="relative p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl">
                <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Create Account
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Join Rupantar AI and start creating</p>
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

        {/* Register Form */}
        <form onSubmit={handleRegister} className="space-y-3 sm:space-y-4">
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="fullName" className="text-sm">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 sm:top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="fullName"
                name="fullName"
                placeholder="Your full name"
                className="pl-10 h-11 sm:h-12 text-sm sm:text-base transition-all duration-200 focus:ring-2 focus:ring-indigo-500 border-2"
                value={formData.fullName}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="email" className="text-sm">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 sm:top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                className="pl-10 h-11 sm:h-12 text-sm sm:text-base transition-all duration-200 focus:ring-2 focus:ring-indigo-500 border-2"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="phone" className="text-sm">Phone Number (Optional)</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 sm:top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                name="phone"
                placeholder="+91 9876543210"
                className="pl-10 h-11 sm:h-12 text-sm sm:text-base transition-all duration-200 focus:ring-2 focus:ring-indigo-500 border-2"
                value={formData.phone}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="password" className="text-sm">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 sm:top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password (min 6 characters)"
                className="pl-10 pr-10 h-11 sm:h-12 text-sm sm:text-base transition-all duration-200 focus:ring-2 focus:ring-indigo-500 border-2"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
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
            {formData.password && (
              <div className="space-y-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={`h-1.5 flex-1 rounded-full transition-all ${level <= passwordStrength.strength ? passwordStrength.color : "bg-gray-200 dark:bg-gray-700"
                        }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Password strength: <span className={`font-medium ${passwordStrength.strength >= 2 ? "text-green-600" : "text-yellow-600"}`}>{passwordStrength.label}</span>
                </p>
              </div>
            )}
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 sm:top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                className="pl-10 pr-10 h-11 sm:h-12 text-sm sm:text-base transition-all duration-200 focus:ring-2 focus:ring-indigo-500 border-2"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 sm:top-3.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {formData.confirmPassword && (
              <div className="flex items-center gap-1.5 text-xs">
                {passwordsMatch ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-green-600">Passwords match</span>
                  </>
                ) : (
                  <>
                    <X className="h-3.5 w-3.5 text-red-600" />
                    <span className="text-red-600">Passwords don't match</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-start space-x-2 pt-1">
            <Checkbox
              id="terms"
              checked={formData.terms}
              onCheckedChange={(checked) =>
                setFormData(prev => ({ ...prev, terms: checked as boolean }))
              }
              disabled={isLoading}
              className="mt-0.5"
            />
            <Label
              htmlFor="terms"
              className="text-xs sm:text-sm font-normal cursor-pointer leading-tight"
            >
              I agree to the{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Terms & Conditions
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full h-12 sm:h-14 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base font-semibold text-white"
            disabled={isLoading || isGoogleLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground pt-1">
          <p className="text-xs sm:text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
