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
}: TemplateCardProps) {
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
    } else if (isLiked !== undefined) {
      // Fallback to prop if backend status not available
      setLocalIsLiked(isLiked);
    }
    
    // Sync saved status
    if (template.isSaved !== undefined) {
      setLocalIsSaved(template.isSaved);
    } else if (isSaved !== undefined) {
      setLocalIsSaved(isSaved);
    }
    
    setLocalLikeCount(template.likeCount || 0);
    setLocalSaveCount(template.saveCount || 0);
  }, [template.isLiked, template.likeCount, template.isSaved, template.saveCount, isLiked, isSaved]);

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
        
        // Don't call onLike - it would trigger another API call
        // onLike?.(); // REMOVED - prevents double API call
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

  if (compact) {
    // Enhanced Compact version for trending section
    return (
      <Card className="overflow-hidden bg-gradient-to-br from-card to-card/95 border border-border/60 rounded-xl hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:border-primary/30 hover:-translate-y-1 group/compact">
        <div className="relative aspect-square overflow-hidden cursor-pointer bg-gradient-to-br from-muted via-muted/50 to-muted group-hover/compact:brightness-105 transition-all duration-300" onClick={onClick}>
          <Image
            src={imageSrc}
            alt={template.title}
            fill
            className="object-cover transition-transform duration-500 group-hover/compact:scale-110"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover/compact:opacity-100 transition-opacity duration-300" />
          <div className="absolute top-2 right-2 z-10">
            {!template.isFree ? (
              <Badge className="bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 border-0 w-6 h-6 rounded-full flex items-center justify-center shadow-xl backdrop-blur-md ring-2 ring-yellow-400/50 text-white p-0 hover:scale-110 transition-transform">
                <Crown className="h-3.5 w-3.5" />
              </Badge>
            ) : null}
          </div>
        </div>
        <CardContent className="p-3 space-y-2 bg-gradient-to-b from-transparent to-background/50">
          <h3 className="text-xs sm:text-sm font-bold line-clamp-1 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent group-hover/compact:from-primary group-hover/compact:to-primary/80 transition-all duration-300">
            {template.title}
          </h3>
          <div className="flex items-center gap-3 text-[10px] sm:text-xs">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10">
              <Heart className={cn("h-3 w-3 transition-all", localIsLiked && "fill-red-500 text-red-500 scale-110")} />
              <span className="font-semibold">{localLikeCount}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10">
              <Eye className="h-3 w-3" />
              <span className="font-semibold">{template.usageCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Professional Modern Card with Glassmorphism
  return (
    <Card className="overflow-hidden bg-gradient-to-br from-card via-card to-card/95 border border-border/60 rounded-2xl hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:border-primary/30 hover:-translate-y-1 mb-4 sm:mb-5 w-full max-w-full backdrop-blur-sm group/card">
      {/* Header - Creator Info with Glassmorphism */}
      <CardContent className="p-3 sm:p-4 md:p-5 pb-3 sm:pb-4 bg-gradient-to-b from-background/80 to-transparent backdrop-blur-sm border-b border-border/30">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-3.5 flex-1 min-w-0">
            <div className="relative">
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 md:h-11 md:w-11 border-2 border-primary/20 shadow-lg ring-2 ring-primary/10 flex-shrink-0 transition-all duration-300 group-hover/card:ring-primary/30 group-hover/card:scale-105">
                <AvatarFallback className="bg-gradient-to-br from-primary via-primary/90 to-primary/70 text-primary-foreground font-bold text-sm sm:text-base shadow-inner">
                  {template.creatorName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {template.creatorVerified && (
                <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg ring-2 ring-background">
                  <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white stroke-[3]" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-sm sm:text-base md:text-lg truncate bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  {template.creatorName}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground/70 mt-0.5">Creator</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={handleToggleFollow}
              variant={isFollowing ? "outline" : "default"}
              size="sm"
              className={cn(
                "h-8 sm:h-9 px-3 sm:px-4 md:px-5 text-xs sm:text-sm font-semibold transition-all duration-300 rounded-full shadow-md hover:shadow-lg",
                isFollowing 
                  ? "bg-secondary/50 hover:bg-secondary/70 border-secondary/50 backdrop-blur-sm" 
                  : "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-primary/20 hover:scale-105 active:scale-95"
              )}
            >
              {isFollowing ? (
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  Following
                </span>
              ) : (
                "Follow"
              )}
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Image Section with Advanced Effects */}
      <div
        className="relative w-full aspect-square overflow-hidden bg-gradient-to-br from-muted via-muted/50 to-muted cursor-pointer group/image"
        onClick={onClick}
        onDoubleClick={(e) => {
          e.stopPropagation();
          // Double-tap to like (only if not already liking)
          if (!localIsLiked && !isLiking) {
            handleLike();
          }
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover/image:opacity-100 transition-opacity duration-500 z-10" />
        
        <Image
          src={imageSrc}
          alt={template.title}
          fill
          className="object-cover transition-all duration-700 group-hover/image:scale-110 group-hover/image:brightness-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Multi-layer Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-500 z-10" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-500 z-10" />
        
        {/* Shine Effect on Hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/image:translate-x-full transition-transform duration-1000 z-10" />
        
        {/* Badges on Image - Top Right with Enhanced Design */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex flex-col gap-2 sm:gap-2.5 items-end z-20">
          {/* Official Badge - Only show for Official templates */}
          {template.type === 'Official' && (
            <Badge className="bg-gradient-to-r from-amber-500 via-yellow-400 to-orange-500 border-0 text-[10px] sm:text-[11px] md:text-xs font-bold px-3 sm:px-3.5 py-1 sm:py-1.5 shadow-2xl backdrop-blur-md ring-2 ring-amber-400/50 hover:scale-110 transition-transform duration-300 animate-pulse">
              ⭐ OFFICIAL
            </Badge>
          )}
          {/* Premium Badge - Enhanced Crown */}
          {!template.isFree && (
            <Badge className="bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 border-0 w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-md ring-2 ring-yellow-400/50 hover:scale-110 hover:rotate-12 transition-all duration-300 text-white p-0">
              <Crown className="h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 drop-shadow-lg" />
            </Badge>
          )}
        </div>
        
        {/* Quick View Indicator */}
        <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 opacity-0 group-hover/image:opacity-100 transition-all duration-300 z-20">
          <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-medium flex items-center gap-2">
            <Eye className="h-3.5 w-3.5" />
            <span>View Details</span>
          </div>
        </div>
      </div>

      {/* Action Buttons Row - Enhanced Design */}
      <CardContent className="p-3 sm:p-4 md:p-5 pt-3 sm:pt-4 space-y-3 bg-gradient-to-b from-transparent to-background/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4 md:gap-5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (!isLiking) {
                  handleLike();
                }
              }}
              disabled={isLiking}
              className={cn(
                "relative transition-all duration-300 hover:scale-110 active:scale-95 touch-manipulation rounded-full p-2 hover:bg-red-500/10",
                localIsLiked ? "text-red-500" : "text-foreground/70 hover:text-red-500",
                isLiking && "opacity-50 cursor-not-allowed"
              )}
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              <Heart
                className={cn(
                  "h-6 w-6 sm:h-6 sm:w-6 md:h-7 md:w-7 transition-all duration-300",
                  localIsLiked && "fill-red-500 scale-110 drop-shadow-lg animate-pulse"
                )}
              />
              {localIsLiked && (
                <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
              )}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="text-foreground/70 hover:text-primary transition-all duration-300 hover:scale-110 active:scale-95 touch-manipulation rounded-full p-2 hover:bg-primary/10"
                  style={{ minWidth: '44px', minHeight: '44px' }}
                >
                  <Share2 className="h-6 w-6 sm:h-6 sm:w-6 md:h-7 md:w-7" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {(() => {
                  const shareUrl = typeof window !== 'undefined'
                    ? `${window.location.origin}/generate?templateId=${template.id}`
                    : '';
                  const shareText = `Check out this amazing template: ${template.title}\n\nTry it now: ${shareUrl}`;
                  const shareTitle = template.title;

                  const handleShare = async (platform: string) => {
                    // Track share in backend
                    try {
                      await templatesApi.shareTemplate(template.id, platform);
                    } catch (error) {
                      console.error("Share tracking error:", error);
                    }

                    if (platform === "native") {
                      // For native share, prioritize image file sharing
                      let imageFile: File | null = null;

                      // Always try to get the image file first
                      if (imageSrc) {
                        try {
                          let imageBlob: Blob | null = null;

                          // Method 1: Try direct fetch with CORS
                          try {
                            const response = await fetch(imageSrc, {
                              mode: 'cors',
                              credentials: 'omit',
                            });

                            if (response.ok) {
                              imageBlob = await response.blob();
                            }
                          } catch (fetchError) {
                            // If direct fetch fails, try canvas method
                            try {
                              const img = document.createElement('img');
                              img.crossOrigin = 'anonymous';

                              await new Promise<void>((resolve, reject) => {
                                img.onload = () => {
                                  try {
                                    const canvas = document.createElement('canvas');
                                    canvas.width = img.width;
                                    canvas.height = img.height;
                                    const ctx = canvas.getContext('2d');
                                    if (ctx) {
                                      ctx.drawImage(img, 0, 0);
                                      canvas.toBlob((blob) => {
                                        if (blob) {
                                          imageBlob = blob;
                                          resolve();
                                        } else {
                                          reject(new Error('Canvas to blob failed'));
                                        }
                                      }, 'image/jpeg', 0.95);
                                    } else {
                                      reject(new Error('Canvas context not available'));
                                    }
                                  } catch (error) {
                                    reject(error);
                                  }
                                };
                                img.onerror = () => reject(new Error('Image load failed'));
                                img.src = imageSrc;
                              });
                            } catch (canvasError) {
                              // console.log("Image conversion failed:", canvasError);
                            }
                          }

                          // Create file from blob
                          if (imageBlob) {
                            imageFile = new File([imageBlob], `template-${template.id}.jpg`, {
                              type: imageBlob.type || 'image/jpeg'
                            });
                          }
                        } catch (error) {
                          // console.log("Image file creation failed:", error);
                        }
                      }

                      // Build share data with image file
                      const shareData: any = {
                        title: shareTitle,
                        text: `${shareText}\n\n${shareUrl}`,
                      };

                      // Add image file if available
                      if (imageFile && navigator.canShare) {
                        const testData = { ...shareData, files: [imageFile] };
                        if (navigator.canShare(testData)) {
                          shareData.files = [imageFile];
                          // Don't include URL when sharing files (some platforms don't support both)
                          delete shareData.text;
                          shareData.text = shareText;
                        }
                      } else if (!imageFile) {
                        // If no image file, include URL in text
                        shareData.text = shareText;
                        shareData.url = shareUrl;
                      }

                      if (navigator.share) {
                        try {
                          // Final check if we can share
                          if (navigator.canShare && !navigator.canShare(shareData)) {
                            // Remove files and try with URL only
                            if (shareData.files) {
                              delete shareData.files;
                              shareData.text = shareText;
                              shareData.url = shareUrl;
                            }
                            // If still can't share, remove URL
                            if (navigator.canShare && !navigator.canShare(shareData)) {
                              delete shareData.url;
                            }
                          }

                          await navigator.share(shareData);
                          toast({
                            title: "Shared successfully!",
                            description: imageFile ? "Image and link shared" : "Link shared",
                          });
                        } catch (error: any) {
                          if (error.name !== 'AbortError') {
                            // Fallback to copy if share fails
                            handleShare("copy");
                          }
                        }
                      } else {
                        handleShare("copy");
                      }
                      return;
                    }

                    if (platform === "copy") {
                      try {
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                          await navigator.clipboard.writeText(shareText);
                        } else {
                          const textArea = document.createElement('textarea');
                          textArea.value = shareText;
                          textArea.style.position = 'fixed';
                          textArea.style.left = '-999999px';
                          document.body.appendChild(textArea);
                          textArea.select();
                          document.execCommand('copy');
                          document.body.removeChild(textArea);
                        }
                        toast({
                          title: "Link copied!",
                          description: "Share link copied to clipboard",
                        });
                      } catch (error) {
                        toast({
                          title: "Failed to copy",
                          variant: "destructive",
                        });
                      }
                      return;
                    }

                    // Social media sharing
                    const shareUrls: Record<string, string> = {
                      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + (imageSrc ? `\n${imageSrc}` : ''))}`,
                      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareTitle)}&picture=${encodeURIComponent(imageSrc || '')}`,
                      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}&url=${encodeURIComponent(shareUrl)}`,
                    };

                    if (shareUrls[platform]) {
                      window.open(shareUrls[platform], "_blank", "width=600,height=400");
                      toast({
                        title: "Opening share...",
                      });
                    }
                  };

                  return (
                    <>
                      {typeof navigator !== 'undefined' && 'share' in navigator && (
                        <DropdownMenuItem onClick={() => handleShare("native")}>
                          <Share2 className="mr-2 h-4 w-4" />
                          Share via...
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleShare("whatsapp")}>
                        <MessageCircle className="mr-2 h-4 w-4 text-green-500" />
                        WhatsApp
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare("facebook")}>
                        <Facebook className="mr-2 h-4 w-4 text-blue-600" />
                        Facebook
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare("twitter")}>
                        <Twitter className="mr-2 h-4 w-4 text-blue-400" />
                        Twitter
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare("copy")}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Link
                      </DropdownMenuItem>
                    </>
                  );
                })()}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (!isSaving) {
                handleSave();
              }
            }}
            disabled={isSaving}
            className={cn(
              "relative transition-all duration-300 hover:scale-110 active:scale-95 touch-manipulation rounded-full p-2 hover:bg-primary/10",
              localIsSaved ? "text-primary" : "text-foreground/70 hover:text-primary",
              isSaving && "opacity-50 cursor-not-allowed"
            )}
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            <Bookmark
              className={cn(
                "h-6 w-6 sm:h-6 sm:w-6 md:h-7 md:w-7 transition-all duration-300",
                localIsSaved && "fill-primary scale-110 drop-shadow-lg"
              )}
            />
            {localIsSaved && (
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
            )}
          </button>
        </div>

        {/* Engagement Stats - Enhanced Professional styling */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm md:text-base">
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 transition-colors duration-300 group/stat">
            <Heart className={cn("h-4 w-4 sm:h-4.5 sm:w-4.5 transition-all", localIsLiked && "fill-red-500 text-red-500 scale-110")} />
            <span className="font-bold text-foreground group-hover/stat:text-red-500 transition-colors">{localLikeCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors duration-300 group/stat">
            <Bookmark className={cn("h-4 w-4 sm:h-4.5 sm:w-4.5 transition-all", localIsSaved && "fill-primary text-primary scale-110")} />
            <span className="font-bold text-foreground group-hover/stat:text-primary transition-colors">{template.saveCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 transition-colors duration-300 group/stat">
            <Eye className="h-4 w-4 sm:h-4.5 sm:w-4.5 transition-all" />
            <span className="font-bold text-foreground group-hover/stat:text-blue-500 transition-colors">{template.usageCount.toLocaleString()}</span>
          </div>
        </div>

        {/* Title - Enhanced Typography */}
        <div onClick={onClick} className="cursor-pointer group/title">
          <h3 className="font-extrabold text-base sm:text-lg md:text-xl line-clamp-2 bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent group-hover/title:from-primary group-hover/title:via-primary/90 group-hover/title:to-primary transition-all duration-300 break-words leading-tight">
            {template.title}
          </h3>
        </div>

        {/* Description - Enhanced Readability */}
        <div onClick={onClick} className="cursor-pointer group/desc">
          <p className="text-sm sm:text-base text-muted-foreground/90 line-clamp-2 leading-relaxed break-words group-hover/desc:text-foreground/80 transition-colors duration-300">
            {template.description}
          </p>
        </div>

        {/* Tags - Hidden as per requirement */}
        {/* {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {template.tags.slice(0, 3).map((tag) => (
              <button
                key={tag}
                onClick={(e) => {
                  e.stopPropagation();
                  // Filter by tag
                }}
                className="text-xs sm:text-sm text-primary/80 hover:text-primary font-medium transition-colors"
              >
                #{tag}
              </button>
            ))}
            {template.tags.length > 3 && (
              <span className="text-xs sm:text-sm text-muted-foreground">
                +{template.tags.length - 3} more
              </span>
            )}
          </div>
        )} */}

        {/* Use Template Button - Premium Design */}
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onUse?.();
          }}
          className="w-full bg-gradient-to-r from-primary via-primary/95 to-primary/90 hover:from-primary/95 hover:via-primary hover:to-primary/95 text-primary-foreground h-11 sm:h-12 text-sm sm:text-base md:text-lg font-bold shadow-lg hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 touch-manipulation rounded-xl hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group/button"
          size="lg"
          style={{ minHeight: '48px' }}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <span>Use Template</span>
            <span className="px-2.5 py-0.5 rounded-full bg-primary-foreground/20 text-primary-foreground font-semibold text-xs sm:text-sm">
              {template.pointsCost} pts
            </span>
          </span>
          {/* Shine effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/button:translate-x-full transition-transform duration-1000" />
        </Button>
      </CardContent>
    </Card>
  );
}
