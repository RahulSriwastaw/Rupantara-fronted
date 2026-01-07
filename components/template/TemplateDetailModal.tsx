"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ShareButton } from "@/components/sharing/ShareButton";
import { Heart, Bookmark, Eye, Star, Check } from "lucide-react";
import type { Template } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface TemplateDetailModalProps {
  template: Template | null;
  isOpen: boolean;
  onClose: () => void;
  isLiked?: boolean;
  isSaved?: boolean;
  onLike?: () => void;
  onSave?: () => void;
}

export function TemplateDetailModal({
  template,
  isOpen,
  onClose,
  isLiked,
  isSaved,
  onLike,
  onSave,
}: TemplateDetailModalProps) {
  const router = useRouter();
  const { user, followCreator, unfollowCreator } = useAuthStore();
  const { toast } = useToast();

  if (!template) return null;
  const imageSrc = template.demoImage || (template as any).image || (template.additionalImages?.[0] ?? '/logo.png');

  const handleUse = () => {
    router.push(`/generate?templateId=${template.id}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {/* Image Section */}
        <div className="relative aspect-square w-full">
          <Image
            src={imageSrc}
            alt={template.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 896px"
          />
        </div>

        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold">
                  {template.title}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  <span className="font-medium">{template.rating}</span>
                  <span>({template.ratingCount} ratings)</span>
                </div>
              </div>
              
              {!template.isFree && (
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 border-0">
                  Premium - {template.pointsCost} points
                </Badge>
              )}
            </div>

            {/* Engagement Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={onLike}
                className="flex items-center gap-2 text-sm hover:text-red-500 transition-colors"
              >
                <Heart
                  className={cn(
                    "h-5 w-5",
                    isLiked && "fill-red-500 text-red-500"
                  )}
                />
                <span>{template.likeCount} Likes</span>
              </button>
              
              <button
                onClick={onSave}
                className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
              >
                <Bookmark
                  className={cn(
                    "h-5 w-5",
                    isSaved && "fill-primary text-primary"
                  )}
                />
                <span>{template.saveCount} Saves</span>
              </button>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="h-5 w-5" />
                <span>{template.usageCount} Uses</span>
              </div>
            </div>
          </div>

          {/* Creator Info */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
            <Avatar className="h-12 w-12">
              <AvatarFallback>{template.creatorName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <p className="font-medium">{template.creatorName}</p>
                {template.creatorVerified && (
                  <Check className="h-4 w-4 text-blue-500 fill-blue-500" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">Creator</p>
            </div>
            {(() => {
              const isFollowing = (user?.followingCreators || []).some(
                (c) => c.id === template.creatorId
              );
              const handleToggleFollow = () => {
                if (!user) {
                  toast({ title: "Login required", description: "Please login to follow creators.", variant: "default" });
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
              return (
                <Button
                  variant={isFollowing ? "default" : "outline"}
                  size="sm"
                  onClick={handleToggleFollow}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Button>
              );
            })()}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-semibold">Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {template.description}
            </p>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg bg-muted/50">
            <div>
              <p className="text-xs text-muted-foreground">Category</p>
              <p className="font-medium capitalize">{template.subCategory}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Age Group</p>
              <p className="font-medium">{template.ageGroup || "All Ages"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">State</p>
              <p className="font-medium">{template.state || "All India"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="font-medium">{template.isFree ? "Free" : "Premium"}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <ShareButton 
              url={`${typeof window !== 'undefined' ? window.location.origin : ''}/template?id=${template.id}`}
              title={template.title}
              text={`Check out this amazing AI template: ${template.title}`}
              image={imageSrc}
            />
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            <Button onClick={handleUse} className="flex-1">
              Use This Template ({template.pointsCost} points)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
