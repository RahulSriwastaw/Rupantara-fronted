"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import type { QualityLevel } from "@/types";

interface GenerationSettingsProps {
  quality: QualityLevel;
  aspectRatio: string;
  creativity: number;
  detailLevel: string;
  onQualityChange: (quality: QualityLevel) => void;
  onAspectRatioChange: (ratio: string) => void;
  onCreativityChange: (value: number) => void;
  onDetailLevelChange: (level: string) => void;
}

const qualityOptions: { value: QualityLevel; label: string; cost: number }[] = [
  { value: "SD", label: "SD (Standard)", cost: 0 },
  { value: "HD", label: "HD (High Definition)", cost: 5 },
  { value: "UHD", label: "UHD (Ultra HD)", cost: 10 },
  { value: "2K", label: "2K Resolution", cost: 15 },
  { value: "4K", label: "4K Resolution", cost: 20 },
  { value: "8K", label: "8K Resolution", cost: 30 },
];

const aspectRatios = [
  { value: "1:1", label: "Square (1:1)" },
  { value: "4:3", label: "Standard (4:3)" },
  { value: "16:9", label: "Widescreen (16:9)" },
  { value: "9:16", label: "Portrait (9:16)" },
  { value: "3:4", label: "Portrait (3:4)" },
];

export function GenerationSettings({
  quality,
  aspectRatio,
  creativity,
  detailLevel,
  onQualityChange,
  onAspectRatioChange,
  onCreativityChange,
  onDetailLevelChange,
}: GenerationSettingsProps) {
  const selectedQualityData = qualityOptions.find((q) => q.value === quality);

  return (
    <div className="space-y-6">
      <h3 className="font-semibold">Generation Settings</h3>

      {/* Quality Selector */}
      <div className="space-y-2">
        <Label>Quality Level</Label>
        <Select value={quality} onValueChange={(val) => onQualityChange(val as QualityLevel)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {qualityOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center justify-between w-full gap-4">
                  <span>{option.label}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {option.cost > 0 ? `+${option.cost} pts` : "Included"}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Higher quality = Better results + More points
        </p>
      </div>

      {/* Aspect Ratio */}
      <div className="space-y-2">
        <Label>Aspect Ratio</Label>
        <Select value={aspectRatio} onValueChange={onAspectRatioChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {aspectRatios.map((ratio) => (
              <SelectItem key={ratio.value} value={ratio.value}>
                {ratio.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>


    </div>
  );
}

