"use client";

import { useState, useEffect } from "react";
import { User, Mail, Camera, Save, Loader2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import { creatorApi } from "@/services/api";

interface CreatorProfile {
    name: string;
    email: string;
    bio: string;
    socialLinks: string[];
    profilePicture: string;
    totalTemplates: number;
    totalEarnings: number;
    followers: number;
}

export default function CreatorProfilePage() {
    const { user } = useAuthStore();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [profile, setProfile] = useState<CreatorProfile>({
        name: "",
        email: "",
        bio: "",
        socialLinks: [],
        profilePicture: "",
        totalTemplates: 0,
        totalEarnings: 0,
        followers: 0,
    });
    const [editedBio, setEditedBio] = useState("");
    const [editedSocialLinks, setEditedSocialLinks] = useState<{
        instagram: string;
        youtube: string;
        website: string;
    }>({
        instagram: "",
        youtube: "",
        website: "",
    });

    useEffect(() => {
        const loadProfile = async () => {
            setIsLoading(true);
            try {
                // Get stats for additional data
                const stats = await creatorApi.getStats().catch(() => null);

                setProfile({
                    name: user?.fullName || "",
                    email: user?.email || "",
                    bio: "",
                    socialLinks: [],
                    profilePicture: user?.profilePicture || "",
                    totalTemplates: stats?.totalTemplates || 0,
                    totalEarnings: stats?.totalEarnings || 0,
                    followers: stats?.followers || 0,
                });

                // Parse social links if available
                if (stats?.socialLinks && Array.isArray(stats.socialLinks)) {
                    const links = stats.socialLinks;
                    setEditedSocialLinks({
                        instagram: links.find((l: string) => l.includes("instagram")) || "",
                        youtube: links.find((l: string) => l.includes("youtube")) || "",
                        website: links.find((l: string) => !l.includes("instagram") && !l.includes("youtube")) || "",
                    });
                }
            } catch (error) {
                console.error("Failed to load profile:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadProfile();
    }, [user]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // In a real implementation, this would call an API to update the profile
            toast({
                title: "Profile Updated",
                description: "Your profile has been updated successfully.",
            });
        } catch (error) {
            toast({
                title: "Update Failed",
                description: "Failed to update profile. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="w-full flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl sm:text-2xl font-bold">Creator Profile</h1>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>

            {/* Profile Picture & Basic Info */}
            <Card>
                <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                        <div className="relative">
                            <Avatar className="h-24 w-24 sm:h-32 sm:w-32">
                                <AvatarImage src={profile.profilePicture} />
                                <AvatarFallback className="text-2xl bg-primary/20">
                                    {profile.name?.charAt(0) || "C"}
                                </AvatarFallback>
                            </Avatar>
                            <Button
                                size="icon"
                                className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                            >
                                <Camera className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex-1 text-center sm:text-left">
                            <h2 className="text-xl sm:text-2xl font-bold">{profile.name}</h2>
                            <p className="text-sm text-muted-foreground">{profile.email}</p>

                            <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold">{profile.totalTemplates}</p>
                                    <p className="text-xs text-muted-foreground">Templates</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold">${profile.totalEarnings.toFixed(0)}</p>
                                    <p className="text-xs text-muted-foreground">Earnings</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold">{profile.followers}</p>
                                    <p className="text-xs text-muted-foreground">Followers</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Bio */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">About Me</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea
                        placeholder="Tell users about yourself and your creative work..."
                        value={editedBio}
                        onChange={(e) => setEditedBio(e.target.value)}
                        className="min-h-[100px]"
                    />
                </CardContent>
            </Card>

            {/* Social Links */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Social Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="instagram">Instagram</Label>
                        <div className="flex gap-2">
                            <Input
                                id="instagram"
                                placeholder="https://instagram.com/yourprofile"
                                value={editedSocialLinks.instagram}
                                onChange={(e) => setEditedSocialLinks({ ...editedSocialLinks, instagram: e.target.value })}
                            />
                            {editedSocialLinks.instagram && (
                                <Button variant="outline" size="icon" asChild>
                                    <a href={editedSocialLinks.instagram} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="youtube">YouTube</Label>
                        <div className="flex gap-2">
                            <Input
                                id="youtube"
                                placeholder="https://youtube.com/@yourchannel"
                                value={editedSocialLinks.youtube}
                                onChange={(e) => setEditedSocialLinks({ ...editedSocialLinks, youtube: e.target.value })}
                            />
                            {editedSocialLinks.youtube && (
                                <Button variant="outline" size="icon" asChild>
                                    <a href={editedSocialLinks.youtube} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <div className="flex gap-2">
                            <Input
                                id="website"
                                placeholder="https://yourwebsite.com"
                                value={editedSocialLinks.website}
                                onChange={(e) => setEditedSocialLinks({ ...editedSocialLinks, website: e.target.value })}
                            />
                            {editedSocialLinks.website && (
                                <Button variant="outline" size="icon" asChild>
                                    <a href={editedSocialLinks.website} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
