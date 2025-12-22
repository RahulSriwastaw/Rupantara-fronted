"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock, Check } from "lucide-react";
import { api } from "@/services/api";

export interface AIModel {
  id: string;
  key: string;
  name: string;
  provider: "gemini" | "minimax" | "stability" | "openai" | "replicate";
  active: boolean;
  isActive: boolean;
  costPerImage: number;
  supportsImageToImage: boolean;
  icon?: string;
  description?: string;
  isPremium?: boolean;
}

interface AIModelSelectorProps {
  selectedModel: string | null;
  onModelChange: (modelId: string) => void;
}

const defaultModels: AIModel[] = [
  {
    id: "gemini-2.5-flash",
    key: "gemini",
    name: "Nano Banana Pro",
    provider: "gemini",
    active: true,
    isActive: true,
    costPerImage: 1,
    supportsImageToImage: true,
    description: "Best for photorealistic images",
  },
  {
    id: "minimax-image-01",
    key: "minimax",
    name: "Flux 2 Max",
    provider: "minimax",
    active: false,
    isActive: false,
    costPerImage: 1.5,
    supportsImageToImage: true,
    description: "High quality face preservation",
  },
  {
    id: "stability-sdxl",
    key: "stability",
    name: "Stability SDXL",
    provider: "stability",
    active: false,
    isActive: false,
    costPerImage: 2,
    supportsImageToImage: true,
    description: "Professional quality images",
  },
];

const getModelIcon = (provider: string) => {
  switch (provider.toLowerCase()) {
    case "gemini":
      return "G";
    case "minimax":
      return "M";
    case "stability":
      return "S";
    default:
      return "AI";
  }
};

export function AIModelSelector({ selectedModel, onModelChange }: AIModelSelectorProps) {
  const [models, setModels] = useState<AIModel[]>(defaultModels);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch available AI models from backend
    const fetchModels = async () => {
      try {
        const response = await api.get("/admin/ai-models");
        if (Array.isArray(response) && response.length > 0) {
          const formattedModels = response.map((m: any) => ({
            id: m.id || m._id,
            key: m.key,
            name: m.name,
            provider: m.provider?.toLowerCase() || "gemini",
            active: m.active || m.isActive,
            isActive: m.active || m.isActive,
            costPerImage: m.costPerImage || 1,
            supportsImageToImage: m.supportsImageToImage !== false,
            description: m.description || "",
            isPremium: m.isPremium || false,
          }));
          setModels(formattedModels);
          
          // Auto-select active model if none selected
          if (!selectedModel) {
            const activeModel = formattedModels.find(m => m.active || m.isActive);
            if (activeModel) {
              onModelChange(activeModel.id);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch AI models:", error);
        // Use default models on error
        if (!selectedModel && defaultModels.length > 0) {
          const activeModel = defaultModels.find(m => m.active);
          if (activeModel) {
            onModelChange(activeModel.id);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Select model</h3>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Select model</h3>
      <div className="grid grid-cols-4 gap-2">
        {models.map((model) => {
          const isSelected = selectedModel === model.id;
          const isLocked = model.isPremium && !model.active;

          return (
            <Button
              key={model.id}
              variant={isSelected ? "default" : "outline"}
              className={`relative h-20 flex flex-col items-center justify-center gap-1 p-2 ${
                isSelected
                  ? "bg-primary text-primary-foreground border-2 border-primary"
                  : "bg-background hover:bg-muted"
              }`}
              onClick={() => !isLocked && onModelChange(model.id)}
              disabled={isLocked}
            >
              {isLocked && (
                <Lock className="absolute top-1 right-1 h-3 w-3 text-muted-foreground" />
              )}
              {isSelected && (
                <Check className="absolute top-1 right-1 h-3 w-3" />
              )}
              <div className="text-lg font-bold">{getModelIcon(model.provider)}</div>
              <div className="text-[10px] text-center leading-tight line-clamp-2">
                {model.name}
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}


