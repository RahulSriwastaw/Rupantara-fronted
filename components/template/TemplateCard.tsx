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
import { useState, useRef } from "react";

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
  const [localLikeCount, setLocalLikeCount] = useState(template.likeCount || 0);
  const [localIsLiked, setLocalIsLiked] = useState(isLiked || false);
  const lastTapRef = useRef<number>(0);
  const isFollowing = (user?.followingCreators || []).some(
    (c) => c.id === template.creatorId
  );
  const imageSrc = template.demoImage || (template as any).image || (template.additionalImages?.[0] ?? '/logo.png');

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

    try {
      const response = await templatesApi.likeTemplate(template.id);
      if (response.success) {
        setLocalIsLiked(response.liked || false);
        setLocalLikeCount(response.likes || 0);
        onLike?.(); // Call parent handler for state sync
      }
    } catch (error: any) {
      console.error("Like error:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to like template",
        variant: "destructive",
      });
    }
  };

  if (compact) {
    // Compact version for trending section
    return (
      <Card className="overflow-hidden bg-card border-border hover:shadow-md transition-shadow">
        <div className="relative aspect-square overflow-hidden cursor-pointer bg-muted" onClick={onClick}>
          <Image
            src={imageSrc}
            alt={template.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          <div className="absolute top-2 right-2">
            {!template.isFree ? (
              <Badge className="bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 border-0 w-5 h-5 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm text-white p-0">
                <Crown className="h-3 w-3" />
              </Badge>
            ) : null}
          </div>
        </div>
        <CardContent className="p-2 space-y-1">
          <h3 className="text-xs font-semibold line-clamp-1">{template.title}</h3>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <Heart className={cn("h-3 w-3", localIsLiked && "fill-red-500 text-red-500")} />
            <span>{localLikeCount}</span>
            <Eye className="h-3 w-3" />
            <span>{template.usageCount}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Professional Instagram/Facebook style card
  return (
    <Card className="overflow-hidden bg-card border border-border/50 rounded-xl hover:shadow-xl transition-all duration-300 hover:border-primary/20 sm:mb-4 mb-4">
      {/* Header - Creator Info */}
      <CardContent className="p-3 sm:p-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border-2 border-border/50 shadow-sm">
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold text-sm">
                {template.creatorName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm sm:text-base truncate">
                  {template.creatorName}
                </span>
                {template.creatorVerified && (
                  <div className="flex-shrink-0 h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center shadow-sm">
                    <Check className="h-2.5 w-2.5 text-white stroke-[3]" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={handleToggleFollow}
              variant={isFollowing ? "outline" : "default"}
              size="sm"
              className={cn(
                "h-8 px-3 sm:px-4 text-xs sm:text-sm font-medium transition-all",
                isFollowing && "bg-secondary hover:bg-secondary/80 border-secondary"
              )}
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Image Section */}
      <div
        className="relative w-full aspect-square overflow-hidden bg-muted cursor-pointer group"
        onClick={onClick}
        onDoubleClick={(e) => {
          e.stopPropagation();
          // Double-tap to like
          if (!localIsLiked) {
            handleLike();
          }
        }}
      >
        <Image
          src={imageSrc}
          alt={template.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Badges on Image - Top Right */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end z-10">
          {/* Official Badge - Only show for Official templates */}
          {template.type === 'Official' && (
            <Badge className="bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 border-0 text-[10px] sm:text-[11px] font-semibold px-2.5 py-1 shadow-xl backdrop-blur-sm">
              ⭐ OFFICIAL
            </Badge>
          )}
          {/* Premium Badge - Only icon (Crown) */}
          {!template.isFree && (
            <Badge className="bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 border-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shadow-xl backdrop-blur-sm text-white p-0">
              <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Badge>
          )}
        </div>
      </div>

      {/* Action Buttons Row */}
      <CardContent className="p-3 sm:p-4 pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLike();
              }}
              className={cn(
                "transition-all duration-200 hover:scale-110 active:scale-95",
                localIsLiked ? "text-red-500" : "text-foreground/70 hover:text-red-500"
              )}
            >
              <Heart
                className={cn(
                  "h-5 w-5 sm:h-6 sm:w-6 transition-all",
                  localIsLiked && "fill-red-500 scale-110"
                )}
              />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="text-foreground/70 hover:text-primary transition-all duration-200 hover:scale-110 active:scale-95"
                >
                  <Share2 className="h-5 w-5 sm:h-6 sm:w-6" />
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
              onSave?.();
            }}
            className={cn(
              "transition-all duration-200 hover:scale-110 active:scale-95",
              isSaved ? "text-primary" : "text-foreground/70 hover:text-primary"
            )}
          >
            <Bookmark
              className={cn(
                "h-5 w-5 sm:h-6 sm:w-6 transition-all",
                isSaved && "fill-primary scale-110"
              )}
            />
          </button>
        </div>

        {/* Engagement Stats - Professional styling */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-foreground/80">
          <div className="flex items-center gap-1">
            <Heart className={cn("h-3.5 w-3.5", localIsLiked && "fill-red-500 text-red-500")} />
            <span className="font-semibold">{localLikeCount.toLocaleString()}</span>
          </div>
          <span className="text-muted-foreground/50">•</span>
          <div className="flex items-center gap-1">
            <Bookmark className={cn("h-3.5 w-3.5", isSaved && "fill-primary text-primary")} />
            <span className="font-semibold">{template.saveCount.toLocaleString()}</span>
          </div>
          <span className="text-muted-foreground/50">•</span>
          <div className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            <span className="font-semibold">{template.usageCount.toLocaleString()}</span>
          </div>
        </div>

        {/* Title */}
        <div onClick={onClick} className="cursor-pointer group">
          <h3 className="font-bold text-base sm:text-lg line-clamp-2 group-hover:text-primary transition-colors">
            {template.title}
          </h3>
        </div>

        {/* Description */}
        <div onClick={onClick} className="cursor-pointer">
          <p className="text-sm sm:text-base text-muted-foreground line-clamp-2 leading-relaxed">
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

        {/* Use Template Button */}
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onUse?.();
          }}
          className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground h-10 text-sm sm:text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200"
          size="lg"
        >
          Use Template ({template.pointsCost} pts)
        </Button>
      </CardContent>
    </Card>
  );
}
