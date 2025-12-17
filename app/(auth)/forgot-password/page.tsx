"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";

export default function ForgotPassword() {
    const router = useRouter();
    const { toast } = useToast();

    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast({
                title: "Error",
                description: "Please enter your email address",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);

        try {
            console.log("📧 Sending password reset email to:", email);

            if (auth) {
                // Use Firebase to send password reset email
                await sendPasswordResetEmail(auth, email);

                console.log("✅ Password reset email sent");
                setEmailSent(true);

                toast({
                    title: "Email Sent! ✉️",
                    description: "Check your inbox for password reset instructions.",
                });

            } else {
                throw new Error("Authentication service not available");
            }

        } catch (error: any) {
            console.error("❌ Password reset error:", error);

            let errorMessage = "Could not send reset email. Please try again.";

            if (error.code === 'auth/user-not-found') {
                errorMessage = "No account found with this email address.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "Please enter a valid email address.";
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = "Too many requests. Please try again later.";
            }

            toast({
                title: "Reset Failed",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md p-8 space-y-6">
                {!emailSent ? (
                    <>
                        {/* Header */}
                        <div className="space-y-4">
                            <Link href="/login">
                                <Button variant="ghost" size="sm" className="mb-2">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to login
                                </Button>
                            </Link>

                            <div className="text-center space-y-2">
                                <h1 className="text-3xl font-bold">Forgot Password?</h1>
                                <p className="text-muted-foreground">
                                    No worries! Enter your email and we'll send you reset instructions.
                                </p>
                            </div>
                        </div>

                        {/* Reset Form */}
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
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
                                        autoFocus
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
                                        Sending...
                                    </>
                                ) : (
                                    "Send Reset Link"
                                )}
                            </Button>
                        </form>

                        {/* Footer */}
                        <div className="text-center text-sm text-muted-foreground">
                            <p>
                                Remember your password?{" "}
                                <Link href="/login" className="text-primary hover:underline font-medium">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Success State */}
                        <div className="text-center space-y-6">
                            <div className="flex justify-center">
                                <CheckCircle2 className="h-16 w-16 text-green-500" />
                            </div>

                            <div className="space-y-2">
                                <h1 className="text-2xl font-bold">Check Your Email</h1>
                                <p className="text-muted-foreground">
                                    We've sent password reset instructions to:
                                </p>
                                <p className="font-semibold text-primary">{email}</p>
                            </div>

                            <div className="space-y-4 text-sm text-muted-foreground">
                                <p>
                                    Click the link in the email to reset your password. The link will expire in 1 hour.
                                </p>

                                <div className="border-t pt-4">
                                    <p className="mb-2">Didn't receive the email?</p>
                                    <ul className="space-y-1 text-left">
                                        <li>• Check your spam/junk folder</li>
                                        <li>• Make sure you entered the correct email</li>
                                        <li>• Wait a few minutes and check again</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Button
                                    onClick={() => {
                                        setEmailSent(false);
                                        setEmail("");
                                    }}
                                    variant="outline"
                                    className="w-full"
                                >
                                    Try Different Email
                                </Button>

                                <Link href="/login" className="block">
                                    <Button variant="default" className="w-full">
                                        Back to Login
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
}
