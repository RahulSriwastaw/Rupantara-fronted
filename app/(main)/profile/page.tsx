"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Edit2,
  Check,
  X,
  Sparkles,
  ImageIcon,
  Heart,
  Crown,
  Settings,
  HelpCircle,
  LogOut,
  Shield,
  Bell,
  Moon,
  Globe,
  ArrowLeft,
  Bookmark,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/store/authStore";
import { useGenerationStore } from "@/store/generationStore";
import { useWalletStore } from "@/store/walletStore";
import { useThemeStore } from "@/store/themeStore";
import { useToast } from "@/hooks/use-toast";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { PasswordStrength } from "@/components/security/PasswordStrength";
import { VersionInfo } from "@/components/version/VersionInfo";
import { creatorApi, templatesApi } from "@/services/api";
import { DataExport } from "@/components/backup/DataExport";

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    user,
    logout,
    updateUser,
    creatorApplication,
    submitCreatorApplication,
    setCreatorApplicationStatus,
    setCreatorStatus,
  } = useAuthStore();
  const { generations, fetchGenerations, favorites } = useGenerationStore();
  const { balance, fetchWalletData } = useWalletStore();
  const { theme, toggleTheme } = useThemeStore();

  const [isEditing, setIsEditing] = useState(false);
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [editedUser, setEditedUser] = useState(user);
  const [newPassword, setNewPassword] = useState("");
  const [hasHydrated, setHasHydrated] = useState<boolean>(() => (useAuthStore as any).persist?.hasHydrated?.() ?? false);

  useEffect(() => {
    const persist = (useAuthStore as any).persist;

    if (persist?.hasHydrated?.() && !hasHydrated) {
      setHasHydrated(true);
    }

    const unsub = persist?.onFinishHydration?.(() => {
      setHasHydrated(true);
    });

    return () => {
      if (typeof unsub === "function") {
        unsub();
      }
    };
  }, [hasHydrated]);

  // Creator application form state
  const [creatorUsername, setCreatorUsername] = useState("");
  const [creatorBio, setCreatorBio] = useState("");
  const [socialInstagram, setSocialInstagram] = useState("");
  const [socialYouTube, setSocialYouTube] = useState("");
  const [demo1Image, setDemo1Image] = useState<string>("");
  const [demo1Prompt, setDemo1Prompt] = useState("");
  const [demo2Image, setDemo2Image] = useState<string>("");
  const [demo2Prompt, setDemo2Prompt] = useState("");

  // Notify on application status change (only once per status change)
  useEffect(() => {
    if (!creatorApplication?.status || !user?.id) return;

    const statusKey = `creator_status_${user.id}_${creatorApplication.status}`;
    const hasShown = localStorage.getItem(statusKey);

    if (creatorApplication.status === 'approved' && !hasShown) {
      toast({ title: "✅ Congratulations! You are now a Creator." });
      localStorage.setItem(statusKey, 'true');
    }
    if (creatorApplication.status === 'rejected' && !hasShown) {
      toast({ 
        title: "❌ Your application has been rejected", 
        description: creatorApplication?.rejectionReason || "Please check the reason and try again."
      });
      localStorage.setItem(statusKey, 'true');
    }
  }, [creatorApplication?.status, user?.id, toast]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hasHydrated) return;

    const hasToken = !!localStorage.getItem("token");
    if (!user && !hasToken) {
      router.push("/login");
    }
  }, [user, router, hasHydrated]);

  useEffect(() => {
    const syncCreatorStatus = async () => {
      if (!user) return;

      // Auto-sync from role if available
      if (user.role === 'creator' && !user.isCreator) {
        setCreatorStatus(true);
      }

      try {
        const app = await creatorApi.getApplication();
        if (app && app.status) {
          setCreatorApplicationStatus(app.status, { rejectionReason: app.rejectionReason });
          if (app.status === 'approved') {
            setCreatorStatus(true);
          }
        }
      } catch (e) {
        // ignore if no application yet
      }
    };
    syncCreatorStatus();
  }, [user?.id, user?.role, user?.isCreator]);
  useEffect(() => {
    fetchGenerations();
    fetchWalletData();
  }, []);

  const handleSave = () => {
    if (editedUser) {
      updateUser(editedUser);
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your changes have been saved",
      });
    }
  };


  const handleSubmitCreatorApplication = async () => {
    try {
      if (!creatorUsername) {
        toast({ title: "Username required", description: "Please enter a creator username.", variant: "destructive" });
        return;
      }
      if (!demo1Image || !demo2Image) {
        toast({ title: "Upload required", description: "Please upload two demo images.", variant: "destructive" });
        return;
      }
      const app = await submitCreatorApplication({
        username: creatorUsername.startsWith("@") ? creatorUsername : `@${creatorUsername}`,
        bio: creatorBio,
        socialLinks: {
          instagram: socialInstagram,
          youtube: socialYouTube,
        },
        demoTemplates: [
          { image: demo1Image, prompt: demo1Prompt || "" },
          { image: demo2Image, prompt: demo2Prompt || "" },
        ],
      });
      setShowCreatorModal(false);
      toast({
        title: "🎉 आपकी Application भेज दी गई है",
        description: "हम 48 घंटे के अंदर समीक्षा करेंगे",
      });
    } catch (e) {
      toast({ title: "Failed to submit", description: (e as Error).message, variant: "destructive" });
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/welcome");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="w-full max-w-5xl py-2 sm:py-3 md:py-4 space-y-3 sm:space-y-4">
      <div className="flex items-center gap-2 sm:gap-4">
        <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-10 sm:w-10" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold">Profile</h1>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 ring-4 ring-primary/20">
              <AvatarImage src={user?.profilePicture || undefined} alt={user?.fullName || "User"} />
              <AvatarFallback className="text-3xl bg-teal-500/20 text-teal-400">
                {(user?.fullName?.charAt(0).toUpperCase()) || "U"}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold">{user?.fullName || "User"}</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {user.email} | {user.phone}
              </p>
              <p className="text-sm text-muted-foreground">
                Member since {user?.memberSince ? new Date(user.memberSince).toLocaleDateString("default", { month: "short", year: "numeric" }) : ""}
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                {user.isCreator && (
                  <Badge variant="default" className="flex items-center gap-1">
                    <Crown className="h-3 w-3" /> Creator
                  </Badge>
                )}
                {!user.isCreator && creatorApplication?.status === 'pending' && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Application Under Review
                  </Badge>
                )}
                {!user.isCreator && creatorApplication?.status === 'rejected' && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <X className="h-3 w-3" /> Rejected
                  </Badge>
                )}
              </div>
            </div>

            <Button
              onClick={() => setIsEditing(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-500"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4 md:p-6 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Generations</p>
            <p className="text-2xl sm:text-3xl font-bold">{generations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 md:p-6 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Points Balance</p>
            <p className="text-2xl sm:text-3xl font-bold">{balance}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 md:p-6 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Templates Used</p>
            <p className="text-2xl sm:text-3xl font-bold">{Array.from(new Set(generations.map(g => g.templateId).filter(Boolean))).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 md:p-6 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">Favorites Saved</p>
            <p className="text-2xl sm:text-3xl font-bold">{favorites.length}</p>
          </CardContent>
        </Card>
      </div>

      {!user.isCreator && user.role !== 'creator' && (!creatorApplication || creatorApplication.status === 'rejected') && (
        <Card className="relative overflow-hidden border-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.1\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }} />
          <CardContent className="p-4 sm:p-6 relative z-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-bold text-white">Become a Creator</h3>
                <p className="text-sm sm:text-base text-white/90">
                  Start monetizing your unique templates and share your creativity with the world.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => setShowCreatorModal(true)}
                  className="bg-white text-purple-600 hover:bg-white/90 text-sm sm:text-base px-3 sm:px-4 whitespace-nowrap"
                >
                  Apply for Creator
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!user.isCreator && creatorApplication?.status === 'pending' && (
        <Card className="relative overflow-hidden border-0">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 via-orange-500 to-pink-500 opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.1\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }} />
          <CardContent className="p-4 sm:p-6 relative z-10">
            <div className="flex items-center justify-between gap-3 sm:gap-4">
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-bold text-white">Application Under Review</h3>
                <p className="text-sm sm:text-base text-white/90">हमारी टीम आपकी रिक्वेस्ट की समीक्षा कर रही है। मंजूरी मिलते ही आपको नोटिफिकेशन मिलेगा।</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!user.isCreator && creatorApplication?.status === 'rejected' && (
        <Card className="relative overflow-hidden border-0">
          <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-pink-600 to-purple-600 opacity-90" />
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.1\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }} />
          <CardContent className="p-4 sm:p-6 relative z-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-lg sm:text-xl font-bold text-white">❌ Rejected</h3>
                <p className="text-sm sm:text-base text-white/90">कारण: {creatorApplication?.rejectionReason || 'कृपया डेमो क्वालिटी और लिंक जाँचें।'}</p>
              </div>
              <Button
                onClick={() => setShowCreatorModal(true)}
                className="bg-white text-purple-600 hover:bg-white/90 text-sm sm:text-base px-3 sm:px-4 whitespace-nowrap"
              >
                Apply Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {(user.isCreator || user.role === 'creator') && (
        <Card className="relative overflow-hidden border-0">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 opacity-90" />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.1\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
            }}
          />
          <CardContent className="p-4 sm:p-6 relative z-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              <div className="space-y-2">
                <h3 className="text-lg sm:text-xl font-bold text-white">Creator App</h3>
                <p className="text-sm sm:text-base text-white/90">
                  Access your creator dashboard, templates, and earnings.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => router.push('/dashboard')}
                  className="bg-white text-purple-600 hover:bg-white/90 text-sm sm:text-base px-3 sm:px-4 whitespace-nowrap"
                >
                  Go to Creator App
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="account" className="space-y-3 sm:space-y-4 w-full overflow-hidden">
        <TabsList className="grid w-full grid-cols-4 h-9 sm:h-10 overflow-x-auto scrollbar-hide">
          <TabsTrigger value="account" className="text-xs sm:text-sm">Account</TabsTrigger>
          <TabsTrigger value="saved" className="text-xs sm:text-sm">Saved</TabsTrigger>
          <TabsTrigger value="preferences" className="text-xs sm:text-sm">Preferences</TabsTrigger>
          <TabsTrigger value="support" className="text-xs sm:text-sm">Support</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-3 sm:space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-sm">Full Name</Label>
                  <div className="flex items-center gap-2 p-2 sm:p-3 rounded-lg bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm sm:text-base">{user.fullName}</span>
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-sm">Email</Label>
                  <div className="flex items-center gap-2 p-2 sm:p-3 rounded-lg bg-muted">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm sm:text-base">{user.email}</span>
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-sm">Phone</Label>
                  <div className="flex items-center gap-2 p-2 sm:p-3 rounded-lg bg-muted">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm sm:text-base">{user.phone}</span>
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-sm">Location</Label>
                  <div className="flex items-center gap-2 p-2 sm:p-3 rounded-lg bg-muted">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm sm:text-base">{user.location?.city || "Not set"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label>Change Password</Label>
                <Input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Input type="password" placeholder="Confirm password" />
                {newPassword && <PasswordStrength password={newPassword} />}
              </div>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Two-Factor Authentication
              </Button>
            </CardContent>
          </Card>

          <DataExport />
        </TabsContent>

        <TabsContent value="saved" className="space-y-3 sm:space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bookmark className="h-5 w-5" />
                Saved Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                View and manage your saved templates
              </p>
              <Button onClick={() => router.push("/saved")} className="w-full sm:w-auto">
                <Bookmark className="h-4 w-4 mr-2" />
                View All Saved Templates
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-3 sm:space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>App Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable dark theme
                  </p>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={toggleTheme}
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label>Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                    <SelectItem value="mr">Marathi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Generation Complete</Label>
                  <p className="text-sm text-muted-foreground">
                    When your image is ready
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Points Earned</Label>
                  <p className="text-sm text-muted-foreground">
                    When you earn points
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Promotional</Label>
                  <p className="text-sm text-muted-foreground">
                    Offers and updates
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support" className="space-y-3 sm:space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Help & Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <FeedbackButton inline />
              <Button variant="outline" className="w-full justify-start">
                <HelpCircle className="h-4 w-4 mr-2" />
                FAQs
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Privacy Policy
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Terms of Service
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Rupantar AI v1.0.0
              </p>
              <p className="text-sm text-muted-foreground">
                Made with ❤️ in India
              </p>
              <div className="pt-2">
                <VersionInfo />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-start text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="h-4 w-4 mr-2" />
            Delete Account
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your personal information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={editedUser?.fullName || ""}
                onChange={(e) =>
                  setEditedUser({ ...editedUser!, fullName: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editedUser?.email || ""}
                onChange={(e) =>
                  setEditedUser({ ...editedUser!, email: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={editedUser?.phone || ""}
                onChange={(e) =>
                  setEditedUser({ ...editedUser!, phone: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreatorModal} onOpenChange={setShowCreatorModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Become a Creator</DialogTitle>
            <DialogDescription className="text-sm">
              Apply to become a creator and start earning from your templates
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="username" className="text-sm">Creator Username <span className="text-destructive">*</span></Label>
              <Input
                id="username"
                placeholder="@username"
                value={creatorUsername}
                onChange={(e) => setCreatorUsername(e.target.value)}
                className="text-sm sm:text-base"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="bio" className="text-sm">Short Bio</Label>
              <Input
                id="bio"
                placeholder="Tell us about your style and niche"
                value={creatorBio}
                onChange={(e) => setCreatorBio(e.target.value)}
                className="text-sm sm:text-base"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-sm">Social Media Links (Optional)</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Instagram URL"
                  value={socialInstagram}
                  onChange={(e) => setSocialInstagram(e.target.value)}
                  className="text-sm sm:text-base"
                />
                <Input
                  placeholder="YouTube URL"
                  value={socialYouTube}
                  onChange={(e) => setSocialYouTube(e.target.value)}
                  className="text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-sm">Demo Template 1 <span className="text-destructive">*</span></Label>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row items-start gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const localUrl = URL.createObjectURL(file);
                          setDemo1Image(localUrl);

                          toast({
                            title: "Uploading image...",
                            description: "Please wait while we upload your demo image.",
                          });

                          const result = await templatesApi.adminUploadDemo(localUrl);
                          if (result?.url) {
                            setDemo1Image(result.url);
                            toast({
                              title: "Image uploaded!",
                              description: "Demo 1 uploaded successfully.",
                            });
                          }
                        } catch (err) {
                          toast({
                            title: "Upload failed",
                            description: "Failed to upload demo image. Please try again.",
                            variant: "destructive",
                          });
                        }
                      }
                    }}
                    className="text-xs sm:text-sm"
                  />
                  {demo1Image && (
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-md overflow-hidden border-2 border-green-500">
                      <img src={demo1Image} alt="Demo 1" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <Input
                  placeholder="Prompt used for this template"
                  value={demo1Prompt}
                  onChange={(e) => setDemo1Prompt(e.target.value)}
                  className="text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-sm">Demo Template 2 <span className="text-destructive">*</span></Label>
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row items-start gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const localUrl = URL.createObjectURL(file);
                          setDemo2Image(localUrl);

                          toast({
                            title: "Uploading image...",
                            description: "Please wait while we upload your demo image.",
                          });

                          const result = await templatesApi.adminUploadDemo(localUrl);
                          if (result?.url) {
                            setDemo2Image(result.url);
                            toast({
                              title: "Image uploaded!",
                              description: "Demo 2 uploaded successfully.",
                            });
                          }
                        } catch (err) {
                          toast({
                            title: "Upload failed",
                            description: "Failed to upload demo image. Please try again.",
                            variant: "destructive",
                          });
                        }
                      }
                    }}
                    className="text-xs sm:text-sm"
                  />
                  {demo2Image && (
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-md overflow-hidden border-2 border-green-500">
                      <img src={demo2Image} alt="Demo 2" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <Input
                  placeholder="Prompt used for this template"
                  value={demo2Prompt}
                  onChange={(e) => setDemo2Prompt(e.target.value)}
                  className="text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="bg-muted p-3 rounded-lg text-xs sm:text-sm text-muted-foreground">
              <p>📝 <strong>Tips:</strong></p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Choose your best template designs</li>
                <li>High-quality images get better approval chances</li>
                <li>Add social links to build trust</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCreatorModal(false)}
              className="w-full sm:w-auto text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitCreatorApplication}
              className="w-full sm:w-auto text-sm"
            >
              Submit Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
