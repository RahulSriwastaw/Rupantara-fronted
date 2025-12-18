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
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950" />

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-purple-300/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-indigo-300/20 dark:bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-700" />

      <Card className="w-full max-w-[95%] sm:max-w-md relative z-10 p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 shadow-2xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center space-y-1.5 sm:space-y-2">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="p-2.5 sm:p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Create Account
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">Join Rupantar AI and start creating</p>
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
            className="w-full h-11 sm:h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base font-semibold"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
