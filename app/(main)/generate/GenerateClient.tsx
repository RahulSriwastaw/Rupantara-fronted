"use client";

export const dynamic = "force-dynamic";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Sparkles, Download, Share2, History, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PhotoUpload } from "@/components/generate/PhotoUpload";
import { AITools } from "@/components/generate/AITools";
import { PromptInput } from "@/components/generate/PromptInput";
import { GenerationSettings } from "@/components/generate/GenerationSettings";
import { AIModelSelector } from "@/components/generate/AIModelSelector";
import { EnhancedSettings } from "@/components/generate/EnhancedSettings";
import { useWalletStore } from "@/store/walletStore";
import { useGenerationStore } from "@/store/generationStore";
import { useToast } from "@/hooks/use-toast";
import { generationsApi, templatesApi } from "@/services/api";
import type { QualityLevel, Template, Generation } from "@/types";

function GenerateContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const templateId = searchParams?.get("templateId");
    const { toast } = useToast();

    const { balance, deductPoints } = useWalletStore();
    const { addGeneration } = useGenerationStore();

    const [template, setTemplate] = useState<Template | null>(null);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [photos, setPhotos] = useState<string[]>([]);
    const [prompt, setPrompt] = useState("");
    const [negativePrompt, setNegativePrompt] = useState("");
    const [quality, setQuality] = useState<QualityLevel>("HD");
    const [aspectRatio, setAspectRatio] = useState("1:1");
    const [creativity, setCreativity] = useState(75);
    const [detailLevel, setDetailLevel] = useState("medium");
    const [selectedModel, setSelectedModel] = useState<string | null>(null);
    const [imageStrength, setImageStrength] = useState(0.35);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [result, setResult] = useState<Generation | null>(null);

    // Load template if provided
    useEffect(() => {
        templatesApi.getAll().then(setTemplates).catch(() => { })
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

    // Fetch costs from backend
    const [costs, setCosts] = useState<{
        baseCost: number;
        qualityCosts: Record<QualityLevel, number>;
        templateCost: number;
    }>({
        baseCost: 20,
        qualityCosts: { SD: 0, HD: 5, UHD: 10, "2K": 15, "4K": 20, "8K": 30 },
        templateCost: 0,
    });

    useEffect(() => {
        // Fetch costs from backend
        generationsApi.getCosts(template?.id).then((data: any) => {
            setCosts({
                baseCost: data.baseCost || 20,
                qualityCosts: data.qualityCosts || { SD: 0, HD: 5, UHD: 10, "2K": 15, "4K": 20, "8K": 30 },
                templateCost: data.templateCost || 0,
            });
        }).catch(() => {
            // Use defaults on error
        });
    }, [template?.id]);

    // Calculate total cost
    const calculateCost = () => {
        return costs.baseCost + (costs.qualityCosts[quality] || 0) + costs.templateCost;
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
            // Build prompt for Gemini - merge template hiddenPrompt with user prompt
            let finalPrompt = prompt;
            if (template?.hiddenPrompt) {
                finalPrompt = template.hiddenPrompt + (prompt ? `, ${prompt}` : '');
            }

            const body = {
                templateId: template?.id,
                userPrompt: prompt,
                prompt: finalPrompt,
                negativePrompt: negativePrompt || '',
                faceImageUrl: photos[0] || '',
                quality: quality,
                aspectRatio: aspectRatio,
                uploadedImages: photos.length ? photos : [],
                modelId: selectedModel,
                variations: 1, // Default to 1 variation
                strength: photos.length > 0 ? imageStrength : undefined,
                visibility: 'public', // Default to public
            }
            const generation = await generationsApi.create(body as any);

            clearInterval(progressInterval);
            setGenerationProgress(100);

            // Deduct points and save generation
            deductPoints(totalCost, "generation", `Image generation - ${quality}`);
            addGeneration(generation);
            setResult(generation);

            // Show success
            setTimeout(() => {
                toast({ title: "Generation complete! 🎉", description: "Your image is ready!" });
                setIsGenerating(false);
            }, 400);
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

    if (result) {
        const onDownload = async () => {
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://new-backend-g2gw.onrender.com'}/api/generation/${result.id}/download`, {
                    method: 'POST',
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                }).catch(() => { });

                let blob: Blob;

                // Handle data URLs directly (no proxy needed)
                if (result.generatedImage.startsWith('data:')) {
                    const response = await fetch(result.generatedImage);
                    blob = await response.blob();
                } else {
                    // Use proxy for regular URLs
                    blob = await generationsApi.downloadProxy(result.generatedImage);
                }

                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `rupantar-${result.id}.png`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
                toast({ title: "Downloaded", description: "Image saved" });
            } catch (e: any) {
                console.error('Download error:', e);
                toast({
                    title: "Download failed",
                    description: e?.message || "Unable to download",
                    variant: "destructive"
                });
            }
        };
        const onShare = async () => {
            const shareUrl = result.generatedImage;
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                await fetch(`/api/generation/${result.id}/share`, {
                    method: 'POST',
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                }).catch(() => { });
                if (navigator.share) {
                    await navigator.share({ title: "Rupantar AI Image", text: "Check out my AI image", url: shareUrl });
                    toast({ title: "Shared", description: "Shared via system share" });
                } else {
                    await navigator.clipboard.writeText(shareUrl);
                    toast({ title: "Link copied", description: "Image link copied to clipboard" });
                }
            } catch (e: any) {
                toast({ title: "Share failed", description: e?.message || "Unable to share", variant: "destructive" });
            }
        };
        return (
            <div className="min-h-[80vh] w-full flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in zoom-in duration-500">
                <div className="w-full max-w-lg space-y-6">
                    {/* Result Card */}
                    <Card className="overflow-hidden border-none bg-secondary/30 backdrop-blur-xl shadow-2xl ring-1 ring-white/10">
                        <CardContent className="p-0">
                            <div className="relative aspect-[4/5] w-full bg-muted">
                                <Image
                                    src={result.generatedImage}
                                    alt="Generated"
                                    fill
                                    className="object-cover transition-transform duration-700 hover:scale-105"
                                    priority
                                />

                                {/* Image Overlay Label */}
                                <div className="absolute top-4 left-4">
                                    <span className="bg-black/50 backdrop-blur-md text-white text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border border-white/20">
                                        Artistic Generation
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons Area */}
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-base"
                                        onClick={onDownload}
                                    >
                                        <Download className="h-5 w-5" />
                                        Download
                                    </Button>

                                    <Button
                                        variant="outline"
                                        className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold py-6 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-base"
                                        onClick={onShare}
                                    >
                                        <Share2 className="h-5 w-5" />
                                        Share
                                    </Button>
                                </div>

                                <Button
                                    variant="ghost"
                                    className="w-full text-muted-foreground hover:text-white hover:bg-white/5 py-4 rounded-xl flex items-center justify-center gap-2 text-sm"
                                    onClick={() => router.push('/history')}
                                >
                                    <History className="h-4 w-4" />
                                    View in History
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Secondary Actions */}
                    <div className="flex justify-center">
                        <Button
                            variant="link"
                            className="text-muted-foreground hover:text-blue-400 gap-2"
                            onClick={() => setResult(null)}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Generate Another
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto py-2 sm:py-3 md:py-4 space-y-3 sm:space-y-4 px-2 sm:px-0">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">Generate Image</h1>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                    Upload photos and describe what you want to create
                </p>
            </div>

            {/* Template Selector - Compact Dropdown */}
            <Card>
                <CardContent className="p-2 sm:p-3">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium">Template</label>
                        <select
                            className="w-full text-sm bg-background border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                            value={template?.id || ''}
                            onChange={(e) => {
                                const t = templates.find(x => (x as any).id === e.target.value)
                                setTemplate(t || null)
                            }}
                        >
                            <option value="">None (Free Style)</option>
                            {templates.map((t) => (
                                <option key={(t as any).id} value={(t as any).id}>
                                    {t.title} {(!t.isFree || t.pointsCost > 0) ? '(Premium)' : ''}
                                </option>
                            ))}
                        </select>
                        {template && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Using: {template.title}</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setTemplate(null);
                                        router.push("/generate");
                                    }}
                                    className="h-5 px-2 text-xs"
                                >
                                    Change
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="grid lg:grid-cols-3 gap-3 sm:gap-4 w-full max-w-full">
                {/* Main Column */}
                <div className="lg:col-span-2 space-y-3 sm:space-y-4 w-full max-w-full">
                    {/* Photo Upload */}
                    <Card>
                        <CardContent className="p-2 sm:p-3">
                            <PhotoUpload photos={photos} onPhotosChange={setPhotos} />
                        </CardContent>
                    </Card>

                    {/* AI Tools */}
                    <Card>
                        <CardContent className="p-2 sm:p-3">
                            <AITools
                                hasPhotos={photos.length > 0}
                                photos={photos}
                                onToolApply={(tool, resultUrl) => {
                                    if (resultUrl && tool === "bg-remove") {
                                        // Replace the first photo with the processed result
                                        setPhotos([resultUrl, ...photos.slice(1)]);
                                        toast({
                                            title: "Background removed!",
                                            description: "Image updated with background removed",
                                        });
                                    } else {
                                        toast({
                                            title: "Tool applied",
                                            description: `${tool} has been applied to your photos`,
                                        });
                                    }
                                }}
                            />
                        </CardContent>
                    </Card>

                    {/* Prompt Input */}
                    <Card>
                        <CardContent className="p-2 sm:p-3">
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

                {/* Settings Column - Compact */}
                <div className="space-y-2 sm:space-y-3">
                    {/* Combined Settings Card - All in one */}
                    <Card>
                        <CardContent className="p-2 sm:p-3 space-y-3">
                            {/* AI Model Selection - Compact Dropdown */}
                            <AIModelSelector
                                selectedModel={selectedModel}
                                onModelChange={setSelectedModel}
                            />

                            {/* Quality & Aspect Ratio - Inline */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Quality</label>
                                    <select
                                        className="w-full text-xs bg-background border border-input rounded-md px-2 py-1.5"
                                        value={quality}
                                        onChange={(e) => setQuality(e.target.value as QualityLevel)}
                                    >
                                        <option value="SD">SD (0 pts)</option>
                                        <option value="HD">HD (+{costs.qualityCosts.HD} pts)</option>
                                        <option value="UHD">UHD (+{costs.qualityCosts.UHD} pts)</option>
                                        <option value="2K">2K (+{costs.qualityCosts["2K"]} pts)</option>
                                        <option value="4K">4K (+{costs.qualityCosts["4K"]} pts)</option>
                                        <option value="8K">8K (+{costs.qualityCosts["8K"]} pts)</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium">Aspect Ratio</label>
                                    <select
                                        className="w-full text-xs bg-background border border-input rounded-md px-2 py-1.5"
                                        value={aspectRatio}
                                        onChange={(e) => setAspectRatio(e.target.value)}
                                    >
                                        <option value="1:1">Square (1:1)</option>
                                        <option value="4:3">Standard (4:3)</option>
                                        <option value="16:9">Widescreen (16:9)</option>
                                        <option value="9:16">Portrait (9:16)</option>
                                        <option value="3:4">Portrait (3:4)</option>
                                    </select>
                                </div>
                            </div>

                        </CardContent>
                    </Card>

                    {/* Cost Card - Sticky & Compact */}
                    <Card className="sticky top-20">
                        <CardContent className="p-2 sm:p-3 space-y-2">
                            <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between">
                                    <span>Base</span>
                                    <span>{costs.baseCost} pts</span>
                                </div>
                                {costs.qualityCosts[quality] > 0 && (
                                    <div className="flex justify-between">
                                        <span>Quality ({quality})</span>
                                        <span>+{costs.qualityCosts[quality]} pts</span>
                                    </div>
                                )}
                                {costs.templateCost > 0 && (
                                    <div className="flex justify-between">
                                        <span>Template</span>
                                        <span>+{costs.templateCost} pts</span>
                                    </div>
                                )}
                                <div className="border-t pt-1.5 flex justify-between font-semibold text-sm">
                                    <span>Total</span>
                                    <span>{totalCost} pts</span>
                                </div>
                            </div>

                            <div className="text-xs text-muted-foreground">
                                <div className="flex justify-between">
                                    <span>Balance</span>
                                    <span className={balance < totalCost ? "text-destructive font-semibold" : ""}>
                                        {balance} pts
                                    </span>
                                </div>
                            </div>

                            <Button
                                onClick={handleGenerate}
                                disabled={!canGenerate}
                                className="w-full text-sm py-2"
                                size="default"
                            >
                                {photos.length === 0
                                    ? "Upload Photos First"
                                    : balance < totalCost
                                        ? `Need ${totalCost - balance} more pts`
                                        : `Generate (${totalCost} pts)`}
                            </Button>

                            {balance < totalCost && (
                                <Button
                                    variant="outline"
                                    onClick={() => router.push("/pro")}
                                    className="w-full text-xs py-1.5"
                                    size="sm"
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

export default function GenerateClient() {
    return (
        <Suspense fallback={<div />}>
            <GenerateContent />
        </Suspense>
    );
}
