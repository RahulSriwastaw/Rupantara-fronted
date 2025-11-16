"use client";

export const dynamic = "force-dynamic";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PhotoUpload } from "@/components/generate/PhotoUpload";
import { AITools } from "@/components/generate/AITools";
import { PromptInput } from "@/components/generate/PromptInput";
import { GenerationSettings } from "@/components/generate/GenerationSettings";
import { useWalletStore } from "@/store/walletStore";
import { useGenerationStore } from "@/store/generationStore";
import { useToast } from "@/hooks/use-toast";
import { generationsApi, templatesApi } from "@/services/api";
import type { QualityLevel, Template } from "@/types";

function GenerateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams?.get("templateId");
  const { toast } = useToast();
  
  const { balance, deductPoints } = useWalletStore();
  const { addGeneration } = useGenerationStore();

  const [template, setTemplate] = useState<Template | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [quality, setQuality] = useState<QualityLevel>("HD");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [creativity, setCreativity] = useState(75);
  const [detailLevel, setDetailLevel] = useState("medium");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Load template if provided
  useEffect(() => {
    if (templateId) {
      // Use real API only
      templatesApi.getById(templateId)
        .then((data) => {
          if (data) {
            setTemplate(data);
          }
        })
        .catch((error) => {
          console.error("Failed to load template:", error);
          toast({
            title: "Error",
            description: error.message || "Failed to load template. Please try again.",
            variant: "destructive",
          });
        });
    }
  }, [templateId, toast]);

  // Calculate total cost
  const calculateCost = () => {
    let cost = 20; // Base cost
    
    // Quality cost
    const qualityCosts: Record<QualityLevel, number> = {
      SD: 0,
      HD: 5,
      UHD: 10,
      "2K": 15,
      "4K": 20,
      "8K": 30,
    };
    cost += qualityCosts[quality];

    return cost;
  };

  const totalCost = calculateCost();
  const canGenerate = photos.length > 0 && balance >= totalCost;

  const handleGenerate = async () => {
    if (!canGenerate) {
      toast({
        title: "Cannot generate",
        description: photos.length === 0 
          ? "Please upload at least one photo"
          : "Insufficient points. Please add more points.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // Call API
      const generation = await generationsApi.create({
        templateId: template?.id,
        prompt: template ? `${template.hiddenPrompt}, ${prompt}` : prompt,
        uploadedImages: photos,
        quality,
        aspectRatio,
        creativity,
        detailLevel,
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      // Deduct points and save generation
      deductPoints(totalCost, "generation", `Image generation - ${quality}`);
      addGeneration(generation);

      // Show success
      setTimeout(() => {
        toast({
          title: "Generation complete! 🎉",
          description: "Your image is ready!",
        });
        router.push(`/history`);
      }, 500);
    } catch (error: any) {
      clearInterval(progressInterval);
      setIsGenerating(false);
      setGenerationProgress(0);
      
      // Refund points if generation failed
      // Note: Points are only deducted after successful generation, so no refund needed
      // But we should show proper error message
      toast({
        title: "Generation failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center animate-pulse">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-center">Creating Your Image</h2>
              <p className="text-muted-foreground text-center">
                {generationProgress < 30 && "Checking your request..."}
                {generationProgress >= 30 && generationProgress < 50 && "Uploading photos..."}
                {generationProgress >= 50 && generationProgress < 90 && "Creating with AI..."}
                {generationProgress >= 90 && "Almost done..."}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
              <p className="text-sm text-center text-muted-foreground">
                {generationProgress}%
              </p>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Powered by AI • This may take a few moments
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-2 sm:py-3 md:py-4 space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Generate Image</h1>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
          Upload photos and describe what you want to create
        </p>
      </div>

      {/* Selected Template Preview */}
      {template && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={template.demoImage}
                  alt={template.title}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground">Using Template</p>
                <h3 className="text-sm sm:text-base font-semibold truncate">{template.title}</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTemplate(null);
                  router.push("/generate");
                }}
                className="text-xs sm:text-sm"
              >
                Change
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
          {/* Photo Upload */}
          <Card>
            <CardContent className="p-3 sm:p-4 md:p-5">
              <PhotoUpload photos={photos} onPhotosChange={setPhotos} />
            </CardContent>
          </Card>

          {/* AI Tools */}
          <Card>
            <CardContent className="p-3 sm:p-4 md:p-5">
              <AITools
                hasPhotos={photos.length > 0}
                onToolApply={(tool) => {
                  toast({
                    title: "Tool applied",
                    description: `${tool} has been applied to your photos`,
                  });
                }}
              />
            </CardContent>
          </Card>

          {/* Prompt Input */}
          <Card>
            <CardContent className="p-3 sm:p-4 md:p-5">
              <PromptInput
                prompt={prompt}
                negativePrompt={negativePrompt}
                onPromptChange={setPrompt}
                onNegativePromptChange={setNegativePrompt}
                templateName={template?.title}
              />
            </CardContent>
          </Card>
        </div>

        {/* Settings Column */}
        <div className="space-y-3 sm:space-y-4">
          {/* Settings Card */}
          <Card>
            <CardContent className="p-3 sm:p-4 md:p-5">
              <GenerationSettings
                quality={quality}
                aspectRatio={aspectRatio}
                creativity={creativity}
                detailLevel={detailLevel}
                onQualityChange={setQuality}
                onAspectRatioChange={setAspectRatio}
                onCreativityChange={setCreativity}
                onDetailLevelChange={setDetailLevel}
              />
            </CardContent>
          </Card>

          {/* Cost Card - Sticky */}
          <Card className="sticky top-20">
            <CardContent className="p-3 sm:p-4 md:p-5 space-y-2 sm:space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Base generation</span>
                  <span>20 points</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Quality ({quality})</span>
                  <span>+{calculateCost() - 20} points</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total Cost</span>
                  <span>{totalCost} points</span>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Your Balance</span>
                  <span className={balance < totalCost ? "text-destructive" : ""}>
                    {balance} points
                  </span>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="w-full"
                size="lg"
              >
                {photos.length === 0
                  ? "Upload Photos First"
                  : balance < totalCost
                  ? "Insufficient Points"
                  : `Generate Image (${totalCost} points)`}
              </Button>

              {balance < totalCost && (
                <Button
                  variant="outline"
                  onClick={() => router.push("/pro")}
                  className="w-full"
                >
                  Add Points
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<div />}> 
      <GenerateContent />
    </Suspense>
  );
}

