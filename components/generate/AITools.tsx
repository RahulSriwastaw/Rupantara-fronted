"use client";

import { useState } from "react";
import { Scissors, Sparkles, Smile, Maximize2, Palette, Paintbrush, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { toolsApi } from "@/services/api";
import { useWalletStore } from "@/store/walletStore";

interface AIToolsProps {
  hasPhotos: boolean;
  photos: string[]; // Current uploaded photos
  onToolApply: (tool: string, resultUrl?: string) => void;
}

const tools = [
  {
    id: "bg-remove",
    name: "BG Remove",
    icon: Scissors,
    cost: 0,
    description: "Remove background instantly",
  },
  {
    id: "upscale",
    name: "Upscale",
    icon: Maximize2,
    cost: 10,
    description: "Increase resolution",
  },
  {
    id: "colorize",
    name: "Colorize",
    icon: Palette,
    cost: 10,
    description: "B&W to color",
  },
];

export function AITools({ hasPhotos, photos, onToolApply }: AIToolsProps) {
  const { toast } = useToast();
  const { balance, deductPoints } = useWalletStore();
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [intensity, setIntensity] = useState([75]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleToolClick = (toolId: string) => {
    if (!hasPhotos) {
      toast({
        title: "Upload photos first",
        description: "Please upload at least one photo to use AI tools",
        variant: "destructive",
      });
      return;
    }
    setSelectedTool(toolId);
  };

  const handleApply = async () => {
    if (!selectedTool || !photos.length) return;

    setIsProcessing(true);
    setError(null);
    setProcessedImage(null);

    try {
      const currentImage = photos[0]; // Use first uploaded photo
      const selectedToolData = tools.find(t => t.id === selectedTool);

      if (selectedTool === "bg-remove") {
        // Call remove background API
        const response = await toolsApi.removeBg(currentImage);
        
        if (response.result || response.imageUrl) {
          const resultUrl = response.result || response.imageUrl;
          setProcessedImage(resultUrl);
          
          // Deduct points if cost > 0
          if (selectedToolData && selectedToolData.cost > 0) {
            deductPoints(selectedToolData.cost);
          }
          
          toast({
            title: "Background removed!",
            description: "Your image has been processed successfully",
          });
        } else {
          throw new Error("No result received from API");
        }
      } else {
        // For other tools, use placeholder for now
        setTimeout(() => {
          toast({
            title: "Tool applied!",
            description: `Successfully applied ${selectedToolData?.name}`,
          });
          setSelectedTool(null);
          setIsProcessing(false);
        }, 1500);
      }
    } catch (err: any) {
      console.error("Tool processing error:", err);
      setError(err?.message || "Failed to process image. Please try again.");
      toast({
        title: "Error",
        description: err?.message || "Failed to process image",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;
    
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `bg-removed-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download started",
      description: "Your image is being downloaded",
    });
  };

  const handleUseResult = () => {
    if (processedImage && selectedTool) {
      onToolApply(selectedTool, processedImage);
      setSelectedTool(null);
      setProcessedImage(null);
    }
  };

  const selectedToolData = tools.find((t) => t.id === selectedTool);

  return (
    <>
      <div className="space-y-2 sm:space-y-3">
        <h3 className="text-sm sm:text-base font-semibold">Quick AI Tools</h3>
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool.id)}
                disabled={!hasPhotos}
                className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className={cn(
                  "rounded-full p-2 sm:p-2.5 bg-primary/10 group-hover:bg-primary/20 transition-colors",
                  !hasPhotos && "opacity-50"
                )}>
                  <Icon className={cn(
                    "text-primary",
                    "h-4 w-4 sm:h-5 sm:w-5"
                  )} />
                </div>
                <div className="text-center w-full">
                  <div className="text-[10px] sm:text-xs font-medium leading-tight">{tool.name}</div>
                  <div className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">
                    {tool.cost === 0 ? "FREE" : `${tool.cost}pts`}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tool Dialog */}
      <Dialog open={!!selectedTool} onOpenChange={() => setSelectedTool(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedToolData?.name}
              {selectedToolData && selectedToolData.cost > 0 && (
                <Badge className="ml-2">{selectedToolData.cost} points</Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              {selectedToolData?.description}
            </p>

            {/* Intensity Slider */}
            {selectedTool !== "bg-remove" && selectedTool !== "upscale" && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Intensity</label>
                  <span className="text-sm text-muted-foreground">
                    {intensity[0]}%
                  </span>
                </div>
                <Slider
                  value={intensity}
                  onValueChange={setIntensity}
                  max={100}
                  step={1}
                />
              </div>
            )}

            {/* Upscale Options */}
            {selectedTool === "upscale" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Scale Factor</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline">2x (10 points)</Button>
                  <Button variant="outline">4x (15 points)</Button>
                </div>
              </div>
            )}

            {/* Preview area */}
            <div className="space-y-3">
              {selectedTool === "bg-remove" && photos.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Original Image</p>
                  <div className="aspect-video rounded-lg bg-muted overflow-hidden">
                    <img
                      src={photos[0]}
                      alt="Original"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {processedImage ? "Processed Result" : "Preview will appear here"}
                </p>
                <div className="aspect-video rounded-lg bg-muted overflow-hidden flex items-center justify-center">
                  {isProcessing ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Processing...</p>
                    </div>
                  ) : processedImage ? (
                    <img
                      src={processedImage}
                      alt="Processed"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">Preview will appear here</p>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/50 text-destructive px-4 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedTool(null);
                setProcessedImage(null);
                setError(null);
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            {processedImage && (
              <>
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button
                  onClick={handleUseResult}
                >
                  Use This Image
                </Button>
              </>
            )}
            {!processedImage && (
              <Button onClick={handleApply} disabled={isProcessing || !hasPhotos}>
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Generate"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

