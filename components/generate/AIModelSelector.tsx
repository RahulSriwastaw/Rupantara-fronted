"use client";

import { useState, useEffect } from "react";
import { Check, Sparkles } from "lucide-react";
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

const getModelDisplayName = (model: AIModel) => {
  // Format: "AI Gemini Premium" or "AI MiniMax" etc.
  const providerName = model.provider.charAt(0).toUpperCase() + model.provider.slice(1);
  return `AI ${providerName}${model.isPremium ? ' Premium' : ''}`;
};

export function AIModelSelector({ selectedModel, onModelChange }: AIModelSelectorProps) {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Fetch available AI models from backend
    const fetchModels = async () => {
      try {
        const response = await api.get("/admin/ai-models");
        if (Array.isArray(response) && response.length > 0) {
          const formattedModels = response
            .map((m: any) => ({
              id: String(m.id || m._id || ''),
              key: m.key || '',
              name: m.name || 'AI Model',
              provider: (m.provider?.toLowerCase() || "gemini") as AIModel["provider"],
              active: m.active || m.isActive || false,
              isActive: m.active || m.isActive || false,
              costPerImage: m.costPerImage || 1,
              supportsImageToImage: m.supportsImageToImage !== false,
              description: m.description || "",
              isPremium: m.isPremium || false,
            }))
            // Filter: Only show active models
            .filter((m: AIModel) => m.active || m.isActive);
          
          setModels(formattedModels);
          
          // Auto-select first active model if none selected
          if (!selectedModel && formattedModels.length > 0) {
            onModelChange(formattedModels[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch AI models:", error);
        setModels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, [selectedModel, onModelChange]);

  const selectedModelData = models.find(m => m.id === selectedModel);

  if (loading) {
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-medium">AI Model</label>
        <div className="h-9 bg-muted animate-pulse rounded-md" />
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-medium">AI Model</label>
        <div className="h-9 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">
          No active models
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium">AI Model</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full h-9 bg-background border border-input rounded-md px-3 py-1.5 text-xs flex items-center justify-between hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium">
              {selectedModelData ? getModelDisplayName(selectedModelData) : 'Select Model'}
            </span>
            {selectedModelData && (
              <span className="text-muted-foreground text-[10px]">
                ({selectedModelData.costPerImage} pts)
              </span>
            )}
          </div>
          <svg
            className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute z-20 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
              {models.map((model) => {
                const isSelected = selectedModel === model.id;
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      onModelChange(model.id);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-xs text-left flex items-center justify-between hover:bg-accent hover:text-accent-foreground transition-colors ${
                      isSelected ? 'bg-accent' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span className="font-medium">{getModelDisplayName(model)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-[10px]">
                        {model.costPerImage} pts
                      </span>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
      {selectedModelData?.description && (
        <p className="text-[10px] text-muted-foreground line-clamp-1">
          {selectedModelData.description}
        </p>
      )}
    </div>
  );
}


