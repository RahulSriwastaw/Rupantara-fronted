"use client";

import { useState } from "react";
import { Scissors, Sparkles, Smile, Maximize2, Palette, Paintbrush } from "lucide-react";
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

interface AIToolsProps {
  hasPhotos: boolean;
  onToolApply: (tool: string) => void;
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
    id: "enhance",
    name: "Enhance",
    icon: Sparkles,
    cost: 5,
    description: "Auto color & brightness",
  },
  {
    id: "face-fix",
    name: "Face Fix",
    icon: Smile,
    cost: 8,
    description: "Enhance facial features",
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
  {
    id: "style",
    name: "Style",
    icon: Paintbrush,
    cost: 8,
    description: "Apply artistic styles",
  },
];

export function AITools({ hasPhotos, onToolApply }: AIToolsProps) {
  const { toast } = useToast();
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [intensity, setIntensity] = useState([75]);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleApply = () => {
    if (!selectedTool) return;
    
    setIsProcessing(true);
    setTimeout(() => {
      onToolApply(selectedTool);
      toast({
        title: "Tool applied!",
        description: `Successfully applied ${tools.find(t => t.id === selectedTool)?.name}`,
      });
      setSelectedTool(null);
      setIsProcessing(false);
    }, 1500);
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

            {/* Preview placeholder */}
            <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Preview will appear here</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedTool(null)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button onClick={handleApply} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Apply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

