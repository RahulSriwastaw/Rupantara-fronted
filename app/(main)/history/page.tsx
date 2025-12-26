"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, Heart, Download, Share2, Trash2, MoreVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useGenerationStore } from "@/store/generationStore";
import { generationsApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/ui/empty-state";
import { ImageIcon, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Generation } from "@/types";

export default function HistoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { generations, favorites, toggleFavorite, deleteGeneration, fetchGenerations, isLoading } =
    useGenerationStore();

  // Fetch generations from backend on mount
  useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedGeneration, setSelectedGeneration] = useState<Generation | null>(
    null
  );

  const displayGenerations = activeTab === "favorites" ? favorites : generations;

  const filteredGenerations = displayGenerations.filter((gen) =>
    (gen.prompt || "").toLowerCase().includes(searchQuery.toLowerCase())
  );


  const handleDownload = async (generation: Generation) => {
    try {
      let blob: Blob;
      
      // Handle data URLs directly
      if (generation.generatedImage.startsWith('data:')) {
        const response = await fetch(generation.generatedImage);
        blob = await response.blob();
      } else {
        // Use proxy for regular URLs
        blob = await generationsApi.downloadProxy(generation.generatedImage);
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rupantar-${generation.id}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: "Downloaded", description: "Image saved successfully" });
    } catch (e: any) {
      console.error('Download error:', e);
      toast({ 
        title: "Download failed", 
        description: e?.message || "Unable to download image", 
        variant: "destructive" 
      });
    }
  };

  const handleShare = async (generation: Generation) => {
    const shareUrl = generation.generatedImage;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Rupantara AI", text: "Check out my AI image", url: shareUrl });
      } catch (e) { console.error(e); }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: "Link copied", description: "Image link copied to clipboard" });
      } catch (e) {
        toast({ title: "Share failed", description: "Could not share", variant: "destructive" });
      }
    }
  };

  const handleDelete = (generationId: string) => {
    deleteGeneration(generationId);
    setSelectedGeneration(null);
    toast({
      title: "Deleted",
      description: "Generation has been removed",
    });
  };

  return (
    <div className="w-full max-w-6xl py-2 sm:py-3 md:py-4 space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold">History</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            View and manage your generations
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by prompt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            All History ({generations.length})
          </TabsTrigger>
          <TabsTrigger value="favorites">
            Favorites ({favorites.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {filteredGenerations.length === 0 ? (
            <EmptyState
              icon={activeTab === "favorites" ? ImageIcon : Sparkles}
              title={
                activeTab === "favorites"
                  ? "No favorite generations yet"
                  : "No generations yet"
              }
              description={
                activeTab === "favorites"
                  ? "Start favoriting your best creations!"
                  : "Start creating amazing images with AI"
              }
              actionLabel={activeTab === "all" ? "Generate Image" : undefined}
              onAction={
                activeTab === "all"
                  ? () => router.push("/generate")
                  : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredGenerations.map((generation) => (
                <Card
                  key={generation.id}
                  className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedGeneration(generation)}
                >
                  <div className="relative aspect-square">
                    <Image
                      src={generation.generatedImage}
                      alt={generation.prompt || 'Generated Image'}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />

                    {/* Favorite Badge */}
                    {generation.isFavorite && (
                      <div className="absolute top-2 right-2">
                        <div className="bg-red-500 text-white p-1.5 rounded-full">
                          <Heart className="h-3 w-3 fill-current" />
                        </div>
                      </div>
                    )}

                    {/* Quality Badge */}
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="text-xs">
                        {generation.quality}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-3 space-y-2">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {generation.prompt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {formatDistanceToNow(new Date(generation.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                      <span>{generation.pointsSpent} pts</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Generation Detail Modal */}
      <Dialog
        open={!!selectedGeneration}
        onOpenChange={() => setSelectedGeneration(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          {selectedGeneration && (
            <>
              {/* Image */}
              <div className="relative aspect-square w-full">
                <Image
                  src={selectedGeneration.generatedImage}
                  alt={selectedGeneration.prompt || 'Generated Image'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 896px"
                />
              </div>

              <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <DialogTitle className="text-xl font-bold">
                    Generation Details
                  </DialogTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleDownload(selectedGeneration)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleShare(selectedGeneration)}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(selectedGeneration.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Info */}
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Prompt
                    </p>
                    <p className="text-sm">{selectedGeneration.prompt}</p>
                  </div>

                  {selectedGeneration.templateName && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Template
                      </p>
                      <p className="text-sm">{selectedGeneration.templateName}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Quality</p>
                      <p className="font-medium">{selectedGeneration.quality}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Aspect Ratio</p>
                      <p className="font-medium">{selectedGeneration.aspectRatio}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Points Spent</p>
                      <p className="font-medium">{selectedGeneration.pointsSpent}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="font-medium">
                        {formatDistanceToNow(
                          new Date(selectedGeneration.createdAt),
                          { addSuffix: true }
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant={selectedGeneration.isFavorite ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => toggleFavorite(selectedGeneration.id)}
                  >
                    <Heart
                      className={`h-4 w-4 mr-2 ${selectedGeneration.isFavorite ? "fill-current" : ""
                        }`}
                    />
                    {selectedGeneration.isFavorite ? "Favorited" : "Add to Favorites"}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleDownload(selectedGeneration)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleShare(selectedGeneration)}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

