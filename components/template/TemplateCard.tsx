"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Bookmark, Eye, Check, Share2, MessageCircle, Facebook, Twitter, Copy } from "lucide-react";
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
  const isFollowing = (user?.followingCreators || []).some(
    (c) => c.id === template.creatorId
  );
  
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

  if (compact) {
    // Compact version for trending section
    return (
      <Card className="overflow-hidden bg-card border-border hover:shadow-md transition-shadow">
        <div className="relative aspect-square overflow-hidden cursor-pointer bg-muted" onClick={onClick}>
          <Image
            src={template.demoImage}
            alt={template.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          <div className="absolute top-2 right-2">
            {!template.isFree ? (
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 border-0 text-[10px] px-1.5 py-0">
                Premium
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Free
              </Badge>
            )}
          </div>
        </div>
        <CardContent className="p-2 space-y-1">
          <h3 className="text-xs font-semibold line-clamp-1">{template.title}</h3>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <Heart className={cn("h-3 w-3", isLiked && "fill-red-500 text-red-500")} />
            <span>{template.likeCount}</span>
            <Eye className="h-3 w-3" />
            <span>{template.usageCount}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Instagram/Facebook style card
  return (
    <Card className="overflow-hidden bg-card border-b sm:border sm:rounded-lg border-border hover:shadow-lg transition-shadow sm:mb-4 mb-4">
      {/* Header - Creator Info */}
      <CardContent className="p-2.5 sm:p-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Avatar className="h-7 w-7 sm:h-8 sm:w-8 border border-border">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {template.creatorName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-xs sm:text-sm truncate">
                  {template.creatorName}
                </span>
                {template.creatorVerified && (
                  <div className="flex-shrink-0 h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-white stroke-[3]" />
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
                "h-7 px-2.5 sm:px-3 text-[10px] sm:text-xs",
                isFollowing && "bg-secondary hover:bg-secondary/80"
              )}
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Image Section */}
      <div
        className="relative w-full aspect-square overflow-hidden bg-muted cursor-pointer"
        onClick={onClick}
      >
        <Image
          src={template.demoImage}
          alt={template.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Premium Badge on Image */}
        {!template.isFree && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 border-0 text-[10px] sm:text-xs px-2 py-0.5 shadow-lg">
              Premium
            </Badge>
          </div>
        )}
      </div>

      {/* Action Buttons Row */}
      <CardContent className="p-2.5 sm:p-3 pt-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLike?.();
              }}
              className={cn(
                "transition-colors",
                isLiked ? "text-red-500" : "text-foreground hover:text-red-500"
              )}
            >
              <Heart
                className={cn(
                  "h-4 w-4 sm:h-5 sm:w-5 transition-transform hover:scale-110",
                  isLiked && "fill-red-500"
                )}
              />
            </button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="text-foreground hover:text-primary transition-colors"
                >
                  <Share2 className="h-4 w-4 sm:h-5 sm:w-5 transition-transform hover:scale-110" />
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
                    
                    if (platform === "native") {
                      // For native share, prioritize image file sharing
                      let imageFile: File | null = null;
                      
                      // Always try to get the image file first
                      if (template.demoImage) {
                        try {
                          let imageBlob: Blob | null = null;
                          
                          // Method 1: Try direct fetch with CORS
                          try {
                            const response = await fetch(template.demoImage, {
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
                                img.src = template.demoImage;
                              });
                            } catch (canvasError) {
                              console.log("Image conversion failed:", canvasError);
                            }
                          }
                          
                          // Create file from blob
                          if (imageBlob) {
                            imageFile = new File([imageBlob], `template-${template.id}.jpg`, { 
                              type: imageBlob.type || 'image/jpeg' 
                            });
                          }
                        } catch (error) {
                          console.log("Image file creation failed:", error);
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
                      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + (template.demoImage ? `\n${template.demoImage}` : ''))}`,
                      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareTitle)}&picture=${encodeURIComponent(template.demoImage || '')}`,
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
              "transition-colors",
              isSaved ? "text-primary" : "text-foreground hover:text-primary"
            )}
          >
            <Bookmark
              className={cn(
                "h-4 w-4 sm:h-5 sm:w-5 transition-transform hover:scale-110",
                isSaved && "fill-primary"
              )}
            />
          </button>
        </div>

        {/* Engagement Stats - All in one line */}
        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-foreground">
          <span className="font-semibold">{template.likeCount.toLocaleString()}</span>
          <span className="text-muted-foreground">•</span>
          <span className="font-semibold">{template.saveCount.toLocaleString()}</span>
          <span className="text-muted-foreground">•</span>
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>{template.usageCount.toLocaleString()}</span>
          </div>
        </div>

        {/* Title Only */}
        <div onClick={onClick} className="cursor-pointer">
          <h3 className="font-semibold text-sm sm:text-base line-clamp-2">
            {template.title}
          </h3>
        </div>

        {/* Description */}
        <div onClick={onClick} className="cursor-pointer">
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
            {template.description}
          </p>
        </div>

        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map((tag) => (
              <button
                key={tag}
                onClick={(e) => {
                  e.stopPropagation();
                  // Filter by tag
                }}
                className="text-[10px] sm:text-xs text-primary hover:underline"
              >
                #{tag}
              </button>
            ))}
            {template.tags.length > 3 && (
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                +{template.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Use Template Button */}
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onUse?.();
          }}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-8 text-xs sm:text-sm"
          size="sm"
        >
          Use Template ({template.pointsCost} pts)
        </Button>
      </CardContent>
    </Card>
  );
}
