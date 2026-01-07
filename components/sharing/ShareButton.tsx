"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonProps {
  url?: string;
  title?: string;
  text?: string;
  image?: string;
}

export function ShareButton({ url, title, text, image }: ShareButtonProps) {
  const { toast } = useToast();

  const shareData = {
    title: title || "Check this out!",
    text: text || "Created with Rupantar AI",
    url: url || (typeof window !== 'undefined' ? window.location.href : ''),
  };

  const handleShare = async (platform?: string) => {
    if (platform === "native" && typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share(shareData);
        toast({
          title: "Shared successfully!",
        });
      } catch (error) {
        // User cancelled
      }
      return;
    }

    // Copy to clipboard
    if (platform === "copy") {
      try {
        await navigator.clipboard.writeText(shareData.url);
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
    const shareText = `${shareData.text}\n\n🔥 *${shareData.title}*\n\n👉 Try it now: ${shareData.url}`;
    const shareUrls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text + " - " + shareData.title)}&url=${encodeURIComponent(shareData.url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`,
      instagram: `https://www.instagram.com/`,
    };

    if (platform && shareUrls[platform]) {
      window.open(shareUrls[platform], "_blank", "width=600,height=400");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Share2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <DropdownMenuItem onClick={() => handleShare("native")}>
            Share via...
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => handleShare("whatsapp")}>
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare("twitter")}>
          Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare("facebook")}>
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare("copy")}>
          Copy Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
