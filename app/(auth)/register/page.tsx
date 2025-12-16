"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, User, Mail, Phone, Lock, ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useAuthStore } from "@/store/authStore";
import { useWalletStore } from "@/store/walletStore";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/services/api";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";

const registerSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, "Invalid Indian phone number. Format: +91 9876543210 or 9876543210"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  terms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { addPoints } = useWalletStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<RegisterFormData>({
    resolver: async (values) => {
      const result = registerSchema.safeParse(values);
      if (result.success) return { values: result.data, errors: {} };
      const errors: Record<string, any> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] || 'form');
        errors[key] = { type: 'manual', message: issue.message };
      }
      return { values: {}, errors };
    },
  });

  const handleGoogleSignup = async () => {
    if (!auth) {
      toast({ title: 'Registration Failed', description: 'Firebase not initialized', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      const code = error?.code || '';
      if (code === 'auth/unauthorized-domain' || code === 'auth/operation-not-allowed') {
        toast({ title: 'Registration Failed', description: 'Google login not authorized for this domain. Please configure Firebase Auth domains.', variant: 'destructive' });
      } else {
        const hint = code === 'auth/invalid-continue-uri'
          ? `Add ${window.location.hostname} to Firebase Auth authorized domains and verify NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN.`
          : (error.message || "Failed to sign up with Google");
        toast({ title: "Registration Failed", description: hint, variant: "destructive" });
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkRedirect = async () => {
      if (!auth) return;
      try {
        const result = await getRedirectResult(auth);
        if (!result) return;
        const user = result.user;
        const firebaseToken = await user.getIdToken();
        const response = await authApi.syncUser(firebaseToken);
        const backendUser = response.user;
        login(backendUser || {
          id: user.uid,
          fullName: user.displayName || "User",
          email: user.email || "",
          phone: user.phoneNumber || "",
          isCreator: false,
          isVerified: user.emailVerified,
          memberSince: new Date().toISOString(),
          pointsBalance: 100,
          profilePicture: user.photoURL || null,
        });
        addPoints(100, 'purchase', 'Welcome bonus - 100 free points!');
        toast({ title: "Welcome to Rupantar AI! 🎉", description: "Your account has been created. Enjoy 100 bonus points!" });
        router.replace("/template");
      } catch (error: any) {
        const code = error?.code || '';
        if (code === 'auth/unauthorized-domain' || code === 'auth/operation-not-allowed') {
          toast({ title: 'Registration Failed', description: 'Google login not authorized for this domain. Please configure Firebase Auth domains.', variant: 'destructive' });
        } else {
          const hint = code === 'auth/invalid-continue-uri'
            ? `Add ${window.location.hostname} to Firebase Auth authorized domains and verify NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN.`
            : (error.message || "Failed to sign up with Google");
          toast({ title: "Registration Failed", description: hint, variant: "destructive" });
        }
      } finally {
        setIsLoading(false);
      }
    };
    checkRedirect();

    if (auth) {
      const unsub = onAuthStateChanged(auth, async (user) => {
        if (!user) return;
        try {
          const firebaseToken = await user.getIdToken();
          const response = await authApi.syncUser(firebaseToken);
          login(response.user || {
            id: user.uid,
            fullName: user.displayName || "User",
            email: user.email || "",
            phone: user.phoneNumber || "",
            isCreator: false,
            isVerified: user.emailVerified,
            memberSince: new Date().toISOString(),
            pointsBalance: 100,
            profilePicture: user.photoURL || null,
          });
          addPoints(100, 'purchase', 'Welcome bonus - 100 free points!');
          router.replace("/template");
        } catch (e: any) {
          toast({ title: "Registration Failed", description: e?.message || "Could not verify Google account", variant: "destructive" });
        }
      });
      return () => unsub();
    }
  }, [router, login, addPoints, toast]);

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);

    try {
      // Use Firebase for email/password registration, then sync with MongoDB
      if (auth) {
        try {
          // Create user in Firebase
          const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
          const firebaseUser = userCredential.user;

          // console.log("✅ Firebase user created:", firebaseUser.email);

          // Get Firebase token and sync with MongoDB (include fullName and phone)
          const firebaseToken = await firebaseUser.getIdToken();
          const response = await authApi.syncUser(firebaseToken);

          const backendUser = response.user;

          login(backendUser);
          addPoints(100, 'purchase', 'Welcome bonus - 100 free points!');

          toast({
            title: "Welcome to Rupantar AI! 🎉",
            description: "Your account has been created. Enjoy 100 bonus points!",
          });

          router.push("/template");
        } catch (firebaseError: any) {
          // If Firebase fails, try backend registration directly
          console.error("Firebase registration failed, trying backend:", firebaseError.message);
          const response = await authApi.register({
            email: data.email,
            password: data.password,
            fullName: data.fullName,
            phone: data.phone,
          });

          login(response.user);
          addPoints(100, 'purchase', 'Welcome bonus - 100 free points!');

          toast({
            title: "Welcome to Rupantar AI! 🎉",
            description: "Your account has been created. Enjoy 100 bonus points!",
          });

          router.push("/template");
        }
      } else {
        // Firebase not available, use backend directly
        const response = await authApi.register({
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          phone: data.phone,
        });

        login(response.user);
        addPoints(100, 'purchase', 'Welcome bonus - 100 free points!');

        toast({
          title: "Welcome to Rupantar AI! 🎉",
          description: "Your account has been created. Enjoy 100 bonus points!",
        });

        router.push("/template");
      }
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col items-center space-y-4">
        <Link href="/welcome" className="self-start">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>

        <div className="relative h-20 w-20">
          <Image
            src="/logo.png"
            alt="Rupantar AI"
            fill
            className="object-contain"
            priority
            unoptimized
          />
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-muted-foreground">
            Join Rupantar AI and start creating
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="fullName"
              placeholder="Enter your full name"
              className="pl-10"
              {...register("fullName")}
            />
          </div>
          {errors.fullName && (
            <p className="text-xs text-destructive">{errors.fullName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="pl-10"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              placeholder="+91 9876543210"
              className="pl-10"
              {...register("phone")}
            />
          </div>
          {errors.phone && (
            <p className="text-xs text-destructive">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              className="pl-10"
              {...register("password")}
            />
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              className="pl-10"
              {...register("confirmPassword")}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="terms"
            onCheckedChange={(checked) => setValue("terms", checked as boolean)}
          />
          <Label
            htmlFor="terms"
            className="text-sm font-normal cursor-pointer leading-tight"
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
        {errors.terms && (
          <p className="text-xs text-destructive">{errors.terms.message}</p>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Create Account"}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or sign up with
          </span>
        </div>
      </div>

      {/* Social Login */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          type="button"
          onClick={handleGoogleSignup}
          disabled={isLoading}
        >
          <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
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
          Google
        </Button>
        <Button variant="outline" type="button" disabled>
          <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Facebook
        </Button>
      </div>

      {/* Sign In Link */}
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </Card>
  );
}

