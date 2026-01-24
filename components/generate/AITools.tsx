"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eraser, Zap, Brush, UserRound, Sparkles, Smile, Download, Loader2, ChevronRight } from "lucide-react";
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
    icon: Eraser,
    cost: 0,
    description: "Remove background instantly",
  },
  {
    id: "upscale",
    name: "Upscale",
    icon: Zap,
    cost: 10,
    description: "Increase resolution",
  },
  {
    id: "colorize",
    name: "Colorize",
    icon: Brush,
    cost: 10,
    description: "B&W to color",
  },
];

export function AITools({ hasPhotos, photos, onToolApply }: AIToolsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { balance, deductPoints } = useWalletStore();
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [intensity, setIntensity] = useState([75]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleToolClick = (toolId: string) => {
    // Map tool IDs to match tools page
    const toolIdMap: Record<string, string> = {
      'bg-remove': 'remove-bg',
      'upscale': 'upscale',
      'face-enhance': 'face-enhance',
      'colorize': 'colorize'
    };
    const mappedToolId = toolIdMap[toolId] || toolId;
    // Redirect to tools page with selected tool
    router.push(`/tools?tool=${mappedToolId}`);
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
            deductPoints(selectedToolData.cost, 'tool_use', `Tool used: ${selectedToolData.name}`);
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
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-foreground">Quick AI Tools</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/tools')}
            className="h-8 px-2 text-primary hover:text-primary/80 hover:bg-primary/5 text-xs font-bold"
          >
            More Tools
            <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isBgRemove = tool.id === "bg-remove";
            return (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3.5 rounded-xl border-2 transition-all duration-200 group relative overflow-hidden cursor-pointer",
                  isBgRemove
                    ? "bg-gradient-to-br from-blue-500/20 via-blue-400/15 to-blue-600/20 border-blue-400/50 hover:border-blue-400 hover:bg-blue-500/30 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95"
                    : "border-border/60 bg-card/80 hover:bg-accent hover:border-primary/50 hover:shadow-md active:scale-95"
                )}
              >
                {/* Shine effect for BG Remove */}
                {isBgRemove && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                )}

                <div className={cn(
                  "rounded-full p-2 sm:p-2.5 transition-all duration-200 relative z-10",
                  isBgRemove
                    ? "bg-blue-500/20 group-hover:bg-blue-500/30 group-hover:scale-110"
                    : "bg-primary/10 group-hover:bg-primary/20"
                )}>
                  <Icon className={cn(
                    isBgRemove ? "text-blue-400 group-hover:text-blue-300" : "text-primary",
                    "h-4 w-4 sm:h-5 sm:w-5 transition-colors"
                  )} />
                </div>
                <div className="text-center w-full relative z-10">
                  <div className={cn(
                    "text-[10px] sm:text-xs font-semibold leading-tight transition-colors",
                    isBgRemove ? "text-blue-300 group-hover:text-blue-200" : "text-foreground"
                  )}>
                    {tool.name}
                  </div>
                  <div className={cn(
                    "text-[9px] sm:text-[10px] mt-0.5 font-medium",
                    isBgRemove
                      ? "text-blue-400/80 group-hover:text-blue-300"
                      : "text-muted-foreground"
                  )}>
                    {tool.cost === 0 ? (
                      <span className="inline-flex items-center gap-0.5">
                        <Sparkles className="h-2.5 w-2.5" />
                        FREE
                      </span>
                    ) : (
                      `${tool.cost}pts`
                    )}
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
                <div className="aspect-video rounded-lg bg-muted overflow-hidden flex items-center justify-center relative">
                  {/* Checkerboard pattern for transparency */}
                  {processedImage && (
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        backgroundImage: `
                          linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
                          linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
                          linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
                          linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)
                        `,
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                      }}
                    />
                  )}
                  {isProcessing ? (
                    <div className="flex flex-col items-center gap-2 relative z-10">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Processing...</p>
                    </div>
                  ) : processedImage ? (
                    <img
                      src={processedImage}
                      alt="Processed"
                      className="w-full h-full object-contain relative z-10"
                      style={{ mixBlendMode: 'normal' }}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground relative z-10">Preview will appear here</p>
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

