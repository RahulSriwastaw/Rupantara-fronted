"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2 } from "lucide-react";
import Link from "next/link";

// Simple API URL - directly use production backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "https://new-backend-g2gw.onrender.com/api";

export default function NewLoginPage() {
    const router = useRouter();
    const { login, user } = useAuthStore();
    const { toast } = useToast();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    // Simple redirect check - if user exists, go to template
    useEffect(() => {
        // Wait a bit for Zustand to hydrate
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

            // Direct fetch call - no complex wrapper
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            console.log("📦 Server response:", { status: response.status, data });

            if (!response.ok) {
                throw new Error(data.msg || data.error || "Login failed");
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
                fullName: String(data.user.name || data.user.fullName || "User"),
                email: String(data.user.email),
                phone: String(data.user.phone || ""),
                isCreator: Boolean(data.user.isCreator || data.user.role === "creator"),
                isVerified: true,
                memberSince: String(data.user.joinedDate || data.user.createdAt || new Date().toISOString()),
                pointsBalance: Number(data.user.points || 0),
                profilePicture: String(data.user.photoURL || data.user.avatar || ""),
            };

            console.log("👤 User data prepared:", userData);

            // Login to store
            login(userData as any);
            console.log("✅ User logged into Zustand store");

            // Success message
            toast({
                title: "Welcome back!",
                description: `Logged in as ${userData.fullName}`,
            });

            console.log("🔄 Redirecting to /template...");

            // Small delay to ensure store update
            setTimeout(() => {
                router.replace("/template");
            }, 100);

        } catch (error: any) {
            console.error("❌ Login error:", error);

            toast({
                title: "Login Failed",
                description: error.message || "Please check your credentials and try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Show loading while checking auth
    if (isCheckingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md p-8 space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold">Welcome Back</h1>
                    <p className="text-muted-foreground">Sign in to your Rupantar AI account</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="your@email.com"
                                className="pl-10"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                className="pl-10"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        disabled={isLoading}
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
                <div className="text-center text-sm text-muted-foreground space-y-2">
                    <p>
                        Don't have an account?{" "}
                        <Link href="/register" className="text-primary hover:underline font-medium">
                            Sign up
                        </Link>
                    </p>
                    <p className="text-xs">
                        API: {API_URL}
                    </p>
                </div>
            </Card>
        </div>
    );
}
