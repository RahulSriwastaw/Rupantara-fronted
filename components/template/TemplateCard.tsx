"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Bookmark, Eye, Check, Share2, MessageCircle, Facebook, Twitter, Copy, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Template } from "@/types";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import { templatesApi } from "@/services/api";
import { useTemplateStore } from "@/store/templateStore";
import { useState, useRef, useEffect } from "react";

interface TemplateCardProps {
  template: Template;
  isLiked?: boolean;
  isSaved?: boolean;
  onLike?: () => void;
  onSave?: () => void;
  onUse?: () => void;
  onClick?: () => void;
  compact?: boolean; // For trending/horizontal cards
  priority?: boolean;
}

export function TemplateSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="relative aspect-[4/5] sm:aspect-[3/4] overflow-hidden rounded-2xl bg-muted animate-pulse">
        <div className="absolute bottom-0 left-0 w-full p-4 space-y-2">
          <div className="h-4 bg-foreground/10 rounded w-3/4" />
          <div className="flex gap-3">
            <div className="h-3 bg-foreground/10 rounded w-10" />
            <div className="h-3 bg-foreground/10 rounded w-10" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border-0 bg-card rounded-[24px] shadow-md animate-pulse">
      <div className="relative w-full aspect-[4/5] bg-muted">
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-foreground/10" />
            <div className="space-y-1">
              <div className="h-3 bg-foreground/10 rounded w-20" />
              <div className="h-2 bg-foreground/10 rounded w-10" />
            </div>
          </div>
          <div className="h-8 w-16 rounded-full bg-foreground/10" />
        </div>
      </div>
      <CardContent className="p-4 space-y-4">
        <div className="h-5 bg-foreground/10 rounded w-full" />
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <div className="h-8 w-8 rounded-full bg-foreground/10" />
            <div className="h-8 w-8 rounded-full bg-foreground/10" />
          </div>
          <div className="h-9 w-20 rounded-full bg-foreground/10" />
        </div>
      </CardContent>
    </Card>
  );
}

export function TemplateCard({
  template,
  isLiked,
  isSaved,
  onLike,
  onSave,
  onUse,
  onClick,
  compact = false,
  priority = false,
}: TemplateCardProps) {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const { user, followCreator, unfollowCreator } = useAuthStore();
  const { toast } = useToast();
  const { updateLikeStatus, updateSaveStatus } = useTemplateStore();
  const [localLikeCount, setLocalLikeCount] = useState(template.likeCount || 0);
  const [localSaveCount, setLocalSaveCount] = useState(template.saveCount || 0);
  // Use backend isLiked status if available, otherwise use prop
  const [localIsLiked, setLocalIsLiked] = useState(template.isLiked !== undefined ? template.isLiked : (isLiked || false));
  const [localIsSaved, setLocalIsSaved] = useState(template.isSaved !== undefined ? template.isSaved : (isSaved || false));
  const [isLiking, setIsLiking] = useState(false); // Prevent double-clicks
  const [isSaving, setIsSaving] = useState(false); // Prevent double-clicks
  const lastTapRef = useRef<number>(0);
  const isFollowing = (user?.followingCreators || []).some(
    (c) => c.id === template.creatorId
  );
  const imageSrc = template.demoImage || (template as any).image || (template.additionalImages?.[0] ?? '/logo.png');

  // Sync with backend isLiked and isSaved status when template changes
  useEffect(() => {
    // Always prioritize backend isLiked status
    if (template.isLiked !== undefined) {
      setLocalIsLiked(template.isLiked);
    }

    // Sync saved status
    if (template.isSaved !== undefined) {
      setLocalIsSaved(template.isSaved);
    }

    setLocalLikeCount(template.likeCount || 0);
    setLocalSaveCount(template.saveCount || 0);
  }, [template.isLiked, template.likeCount, template.isSaved, template.saveCount, template.id]);

  const handleToggleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to follow creators.",
      });
      return;
    }
    if (isFollowing) {
      unfollowCreator(template.creatorId);
      toast({ title: "Unfollowed", description: `You unfollowed ${template.creatorName}.` });
    } else {
      followCreator(template.creatorId, template.creatorName);
      toast({ title: "Following", description: `You are now following ${template.creatorName}.` });
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to like templates.",
      });
      return;
    }

    // Prevent double-clicks and race conditions
    if (isLiking) {
      console.log('⏳ Like operation already in progress, ignoring...');
      return;
    }

    setIsLiking(true);
    const previousLiked = localIsLiked;
    const previousCount = localLikeCount;

    // Optimistic update
    setLocalIsLiked(!previousLiked);
    setLocalLikeCount(previousLiked ? Math.max(0, previousCount - 1) : previousCount + 1);

    try {
      const response = await templatesApi.likeTemplate(template.id);
      if (response.success) {
        // Update with actual backend response
        setLocalIsLiked(response.liked || false);
        setLocalLikeCount(response.likes || 0);

        // Update store WITHOUT calling API again (just sync state)
        updateLikeStatus(template.id, response.liked || false);
      } else {
        // Revert optimistic update on failure
        setLocalIsLiked(previousLiked);
        setLocalLikeCount(previousCount);
      }
    } catch (error: any) {
      console.error("Like error:", error);
      // Revert optimistic update on error
      setLocalIsLiked(previousLiked);
      setLocalLikeCount(previousCount);
      toast({
        title: "Error",
        description: error?.message || "Failed to like template",
        variant: "destructive",
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to save templates.",
      });
      return;
    }

    // Prevent double-clicks and race conditions
    if (isSaving) {
      console.log('⏳ Save operation already in progress, ignoring...');
      return;
    }

    setIsSaving(true);
    const previousSaved = localIsSaved;
    const previousCount = localSaveCount;

    // Optimistic update
    setLocalIsSaved(!previousSaved);
    setLocalSaveCount(previousSaved ? Math.max(0, previousCount - 1) : previousCount + 1);

    try {
      const response = await templatesApi.saveTemplate(template.id);
      if (response.success) {
        // Update with actual backend response
        setLocalIsSaved(response.saved || false);
        setLocalSaveCount(response.saves || 0);

        // Update store WITHOUT calling API again (just sync state)
        updateSaveStatus(template.id, response.saved || false);

        toast({
          title: response.saved ? "Saved" : "Unsaved",
          description: response.saved
            ? "Template saved to your collection"
            : "Template removed from saved",
        });
      } else {
        // Revert optimistic update on failure
        setLocalIsSaved(previousSaved);
        setLocalSaveCount(previousCount);
      }
    } catch (error: any) {
      console.error("Save error:", error);
      // Revert optimistic update on error
      setLocalIsSaved(previousSaved);
      setLocalSaveCount(previousCount);
      toast({
        title: "Error",
        description: error?.message || "Failed to save template",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async (platform: string) => {
    // Track share in backend
    try {
      await templatesApi.shareTemplate(template.id, platform);
    } catch (error) {
      console.error("Share tracking error:", error);
    }

    const shareUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/generate?templateId=${template.id}`
      : '';
    const shareText = `✨ Create your own AI Masterpiece! 🎨\n\nI found this amazing template "${template.title}" on Rupantar AI.\n\n👇 Try it now and transform your photos: \n${shareUrl}`;
    const shareTitle = template.title;

    if (platform === "native") {
      // 1. Show loading feedback as fetching image might take time
      const loadingToast = toast({ title: "Preparing share...", description: "Formatting image and link..." });

      // 2. Prepare Image File (Best Effort)
      let imageFile: File | null = null;
      if (imageSrc) {
        try {
          const response = await fetch(imageSrc, { mode: 'cors', credentials: 'omit' });
          if (response.ok) {
            const blob = await response.blob();
            // Create a file with a safe name
            imageFile = new File([blob], `template-${template.id}.jpg`, { type: blob.type || 'image/jpeg' });
          }
        } catch (error) {
          console.error("Image share prep failed (likely CORS):", error);
        }
      }

      // 3. Construct Share Data
      // Note: Some platforms ignore 'url' if 'files' are present, so we ALWAYS bake the URL into 'text'.
      const shareData: any = {
        title: shareTitle,
        text: shareText, // URL is already inside shareText
      };

      if (imageFile && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
        shareData.files = [imageFile];
        // When sharing files, avoid setting 'url' separately as it confuses some apps (like WhatsApp).
        // The URL is already inside 'shareData.text'.
      } else {
        // Fallback: If no file or file sharing not supported, explicitly attach URL
        shareData.url = shareUrl;
      }

      // 4. Trigger Share
      loadingToast.dismiss();
      if (typeof navigator !== 'undefined' && 'share' in navigator) {
        try {
          // KEY FIX: Copy text to clipboard first because many apps (like WhatsApp) drop the text when sharing files from Web
          try {
            await navigator.clipboard.writeText(shareText);
            toast({
              title: "Link Copied! 📋",
              description: "Please PASTE the link as the caption.",
              duration: 5000
            });
          } catch (clipError) {
            console.warn("Clipboard write failed during share:", clipError);
          }

          await navigator.share(shareData);
          // toast({ title: "Shared successfully!", description: "Content shared" }); // Toast covered by clipboard msg
        } catch (error: any) {
          if (error.name !== 'AbortError') {
            console.error("Native share failed:", error);
            // If share failed (maybe due to file), try sharing just the text/link
            try {
              await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
            } catch (retryError) {
              handleShare("copy"); // Fallback to copy link
            }
          }
        }
      } else {
        handleShare("copy");
      }
      return;
    }

    if (platform === "copy") {
      try {
        await navigator.clipboard.writeText(shareText);
        toast({ title: "Link copied!", description: "Share link copied to clipboard" });
      } catch (error) {
        toast({ title: "Failed to copy", variant: "destructive" });
      }
      return;
    }

    // Social media sharing (Links Only)
    const shareUrls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], "_blank", "width=600,height=400");
    }
  };

  if (compact) {
    // Trending/Compact Card matching Reference Top Row (Full Image, Overlay Bottom)
    return (
      <Card
        className="relative overflow-hidden border-0 rounded-2xl group/compact h-full bg-gray-900 shadow-lg cursor-pointer"
        onClick={onClick}
      >
        <div className="relative w-full h-full aspect-[4/5] sm:aspect-[3/4]">
          <Image
            src={imageSrc}
            alt={template.title}
            fill
            className={cn(
              "object-cover transition-all duration-1000",
              isImageLoading ? "scale-110 blur-lg" : "scale-100 blur-0"
            )}
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 20vw"
            style={{ objectPosition: (template as any).demoImagePosition || 'center center' }}
            onLoad={() => setIsImageLoading(false)}
            priority={priority}
            quality={75}
            loading={priority ? undefined : "lazy"}
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

          {/* Content Overlay */}
          <div className="absolute bottom-0 left-0 w-full p-4 text-white z-20">
            <h3 className="font-bold text-sm sm:text-base leading-tight mb-1 line-clamp-1 drop-shadow-md">
              {template.title}
            </h3>
            <div className="flex items-center gap-3 text-xs opacity-90 font-medium text-gray-200">
              <div className="flex items-center gap-1">
                <Heart className={cn("w-3.5 h-3.5", localIsLiked && "fill-red-500 text-red-500")} />
                <span>{localLikeCount > 1000 ? (localLikeCount / 1000).toFixed(1) + 'k' : localLikeCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span>{template.usageCount > 1000 ? (template.usageCount / 1000).toFixed(1) + 'k' : template.usageCount}</span>
              </div>
            </div>
          </div>

          {/* Premium Badge Top Right */}
          {!template.isFree && (
            <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md p-1.5 rounded-full border border-white/30 shadow-lg">
              <Crown className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            </div>
          )}
        </div>
      </Card>
    );
  }

  // Main Card matching User Image Reference (Header Row with Avatar on Left, Follow on Right)
  return (
    <Card className="overflow-hidden border-0 bg-card rounded-[24px] shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group/card">

      {/* Image Section */}
      <div
        className="relative w-full aspect-[4/5] bg-muted cursor-pointer overflow-hidden rounded-t-[24px]"
        onClick={onClick}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (!localIsLiked && !isLiking) handleLike();
        }}
      >
        <Image
          src={imageSrc}
          alt={template.title}
          fill
          className={cn(
            "object-cover transition-all duration-1000",
            isImageLoading ? "scale-110 blur-xl" : "scale-100 blur-0"
          )}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          style={{ objectPosition: (template as any).demoImagePosition || 'center center' }}
          onLoad={() => setIsImageLoading(false)}
          priority={priority}
          quality={75}
          loading={priority ? undefined : "lazy"}
        />

        {/* Header Overlay (Creator & Follow) */}
        <div className="absolute top-0 left-0 w-full p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/60 via-black/40 to-transparent pt-4 pb-8">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border-2 border-white/20 shadow-lg">
              <AvatarImage src={(template as any).creatorAvatar} />
              <AvatarFallback className="bg-white/10 text-white backdrop-blur-md text-[10px] font-bold">
                {template.creatorName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col drop-shadow-md">
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-bold text-white leading-none tracking-wide">
                  {template.creatorName}
                </span>
                {template.creatorVerified && (
                  <Check className="w-3.5 h-3.5 text-blue-400 stroke-[3]" />
                )}
              </div>
              <span className="text-[10px] text-gray-200 font-medium mt-0.5 opacity-90">
                Creator
              </span>
            </div>
          </div>

          {!isFollowing && (
            <Button
              onClick={handleToggleFollow}
              size="sm"
              className="h-8 px-5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shadow-xl border border-white/10 transition-all hover:scale-105"
            >
              Follow
            </Button>
          )}
        </div>

        {/* Floating Badges (Top Right of Image - Positioned below Header) */}
        <div className="absolute top-16 right-3 flex flex-col gap-2 items-end">
          {!template.isFree ? (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 border-0 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 text-white">
              <Crown className="w-3 h-3 fill-white/90" />
            </Badge>
          ) : null}
        </div>

        {/* Hover Gradient Overlay */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      {/* Content Section */}
      <CardContent className="p-4 pt-3 space-y-3">
        {/* Title */}
        <div onClick={onClick} className="cursor-pointer">
          <h3 className="font-bold text-[17px] leading-snug text-foreground/90 line-clamp-2 group-hover/card:text-primary transition-colors">
            {template.title}
          </h3>
        </div>

        {/* Footer Row: Stats & Action */}
        <div className="flex items-center justify-between pt-1 gap-2">
          {/* Left: Actions Row */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Like Button */}
            <button
              onClick={(e) => { e.stopPropagation(); if (!isLiking) handleLike(); }}
              className="group/like flex items-center gap-1.5 px-2 py-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Heart className={cn("w-5 h-5 transition-transform group-active/like:scale-95", localIsLiked ? "fill-red-500 text-red-500" : "text-muted-foreground group-hover/like:text-red-500")} />
              <span className={cn("text-sm font-medium", localIsLiked ? "text-red-500" : "text-muted-foreground")}>{localLikeCount}</span>
            </button>

            {/* Save Button */}
            <button
              onClick={(e) => { e.stopPropagation(); if (!isSaving) handleSave(); }}
              className="group/save flex items-center gap-1.5 px-2 py-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <Bookmark className={cn("w-5 h-5 transition-transform group-active/save:scale-95", localIsSaved ? "fill-blue-500 text-blue-500" : "text-muted-foreground group-hover/save:text-blue-500")} />
              <span className={cn("text-sm font-medium", localIsSaved ? "text-blue-500" : "text-muted-foreground")}>{localSaveCount}</span>
            </button>

            {/* Share Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="group/share p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Share2 className="w-5 h-5 text-muted-foreground group-hover/share:text-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {/* Unified Share Action - Smart detection */}
                {/* Direct WhatsApp - Use Link Share so Caption + Image Preview appear together */}
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  handleShare("whatsapp");
                }}>
                  <MessageCircle className="mr-2 h-4 w-4 text-green-500" /> WhatsApp (Link + Caption)
                </DropdownMenuItem>

                {/* Secondary Option: Share File Only */}
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleShare("native"); }}>
                  <Share2 className="mr-2 h-4 w-4" /> Share Image File Only
                </DropdownMenuItem>

                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleShare("copy"); }}>
                  <Copy className="mr-2 h-4 w-4" /> Copy Link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View Count Display */}
            <div className="flex items-center gap-1 px-2 text-muted-foreground">
              <Eye className="w-4 h-4" />
              <span className="text-xs font-medium whitespace-nowrap">
                {template.usageCount > 1000 ? (template.usageCount / 1000).toFixed(1) + 'k' : template.usageCount}
              </span>
            </div>
          </div>

          {/* Right: Use Template Button */}
          <Button
            onClick={(e) => { e.stopPropagation(); onUse?.(); }}
            className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-full px-4 sm:px-5 h-9 sm:h-10 text-xs sm:text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            Use <span className="hidden sm:inline ml-1">Template</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
