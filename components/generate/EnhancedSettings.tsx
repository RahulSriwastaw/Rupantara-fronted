"use client";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { RotateCcw } from "lucide-react";

interface EnhancedSettingsProps {
  aspectRatio: string;
  onAspectRatioChange: (ratio: string) => void;
  promptEnhancer: boolean;
  onPromptEnhancerChange: (enabled: boolean) => void;
  variations: number;
  onVariationsChange: (count: number) => void;
  visibility: "public" | "private";
  onVisibilityChange: (visibility: "public" | "private") => void;
  imageStrength?: number;
  onImageStrengthChange?: (strength: number) => void;
}

export function EnhancedSettings({
  aspectRatio,
  onAspectRatioChange,
  promptEnhancer,
  onPromptEnhancerChange,
  variations,
  onVariationsChange,
  visibility,
  onVisibilityChange,
  imageStrength = 0.35,
  onImageStrengthChange,
}: EnhancedSettingsProps) {
  const aspectRatios = [
    { value: "9:16", label: "Portrait", icon: "📱" },
    { value: "1:1", label: "Square", icon: "⬜" },
    { value: "16:9", label: "Landscape", icon: "🖥️" },
  ];

  const handleReset = () => {
    onAspectRatioChange("1:1");
    onPromptEnhancerChange(false);
    onVariationsChange(1);
    onVisibilityChange("public");
    if (onImageStrengthChange) {
      onImageStrengthChange(0.35);
    }
  };

  return (
    <div className="space-y-6">
      {/* Image Size Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Image size</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-6 px-2 text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>

        {/* Aspect Ratio Preview */}
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 border-2 border-border rounded-lg flex items-center justify-center bg-muted">
            <span className="text-xs font-medium">{aspectRatio}</span>
          </div>

          {/* Aspect Ratio Buttons */}
          <div className="flex-1 flex gap-1">
            {aspectRatios.map((ratio) => (
              <Button
                key={ratio.value}
                variant={aspectRatio === ratio.value ? "default" : "outline"}
                size="sm"
                className={`flex-1 h-9 text-xs ${
                  aspectRatio === ratio.value
                    ? "bg-primary text-primary-foreground"
                    : ""
                }`}
                onClick={() => onAspectRatioChange(ratio.value)}
              >
                {ratio.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Image Strength Slider (for I2I) */}
        {onImageStrengthChange && (
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs">
              <span>Image Strength</span>
              <span className="text-muted-foreground">
                {Math.round(imageStrength * 100)}%
              </span>
            </div>
            <Slider
              value={[imageStrength]}
              onValueChange={([value]) => onImageStrengthChange(value)}
              min={0.1}
              max={1}
              step={0.05}
              className="w-full"
            />
            <p className="text-[10px] text-muted-foreground">
              Lower = more preservation, Higher = more transformation
            </p>
          </div>
        )}
      </div>

      <Separator />

      {/* More Options Section */}
      <div className="space-y-4">
        <Label className="text-sm font-semibold">More options</Label>

        {/* Prompt Enhancer Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm">Prompt Enhancer</Label>
            <p className="text-xs text-muted-foreground">
              Automatically improve your prompt
            </p>
          </div>
          <Switch
            checked={promptEnhancer}
            onCheckedChange={onPromptEnhancerChange}
          />
        </div>

        {/* Variations */}
        <div className="space-y-2">
          <Label className="text-sm">Variations</Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((count) => (
              <Button
                key={count}
                variant={variations === count ? "default" : "outline"}
                size="sm"
                className={`flex-1 h-9 ${
                  variations === count
                    ? "bg-primary text-primary-foreground"
                    : ""
                }`}
                onClick={() => onVariationsChange(count)}
              >
                {count}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      {/* Visibility Section */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Visibility</Label>
        <div className="flex gap-1">
          <Button
            variant={visibility === "public" ? "default" : "outline"}
            size="sm"
            className={`flex-1 h-9 ${
              visibility === "public"
                ? "bg-primary text-primary-foreground"
                : ""
            }`}
            onClick={() => onVisibilityChange("public")}
          >
            Public
          </Button>
          <Button
            variant={visibility === "private" ? "default" : "outline"}
            size="sm"
            className={`flex-1 h-9 ${
              visibility === "private"
                ? "bg-primary text-primary-foreground"
                : ""
            }`}
            onClick={() => onVisibilityChange("private")}
          >
            Private
          </Button>
        </div>
      </div>
    </div>
  );
}


