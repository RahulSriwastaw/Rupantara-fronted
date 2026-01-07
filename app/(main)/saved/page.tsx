"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import { templatesApi } from "@/services/api";
import { TemplateCard } from "@/components/template/TemplateCard";
import type { Template } from "@/types";

export default function SavedTemplatesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [savedTemplates, setSavedTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedTemplatesIds, setSavedTemplatesIds] = useState<string[]>([]);
  const [likedTemplates, setLikedTemplates] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    fetchSavedTemplates();
  }, [user]);

  const fetchSavedTemplates = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching saved templates...');

      // ALTERNATIVE APPROACH: Fetch all templates and filter client-side
      // This works around the /saved endpoint 500 error
      const allTemplates = await templatesApi.getAll('');
      console.log('📦 All templates response:', allTemplates);

      // Filter only saved templates (where isSaved === true)
      const savedOnly = Array.isArray(allTemplates)
        ? allTemplates.filter((t: Template) => t.isSaved === true)
        : [];

      console.log(`✅ Found ${savedOnly.length} saved templates (filtered from ${Array.isArray(allTemplates) ? allTemplates.length : 0} total)`);
      setSavedTemplates(savedOnly);

      // Extract saved and liked template IDs
      const savedIds = savedOnly.map((t: Template) => t.id);
      const likedIds = savedOnly
        .filter((t: Template) => t.isLiked)
        .map((t: Template) => t.id);

      setSavedTemplatesIds(savedIds);
      setLikedTemplates(likedIds);

    } catch (error: any) {
      console.error("❌ Error fetching saved templates:", error);
      console.error("❌ Error details:", {
        message: error?.message,
        response: error?.response,
        status: error?.status
      });
      toast({
        title: "Error",
        description: error?.message || "Failed to load saved templates",
        variant: "destructive",
      });
      setSavedTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = (templateId: string) => {
    // Update local state
    if (likedTemplates.includes(templateId)) {
      setLikedTemplates(likedTemplates.filter(id => id !== templateId));
    } else {
      setLikedTemplates([...likedTemplates, templateId]);
    }
  };

  const handleSave = (templateId: string) => {
    // Update local state and remove from saved list if unsaved
    if (savedTemplatesIds.includes(templateId)) {
      setSavedTemplatesIds(savedTemplatesIds.filter(id => id !== templateId));
      setSavedTemplates(savedTemplates.filter(t => t.id !== templateId));
    } else {
      setSavedTemplatesIds([...savedTemplatesIds, templateId]);
    }
  };

  const handleUseTemplate = (templateId: string) => {
    router.push(`/generate?template=${templateId}`);
  };

  const handleTemplateClick = (template: Template) => {
    // Track view
    templatesApi.viewTemplate(template.id).catch(err => console.error("Failed to track view", err));
    // Could open modal or navigate to detail page
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <Bookmark className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Saved Templates</h1>
              <p className="text-sm text-muted-foreground">
                Your collection of favorite templates
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty State */}
        {!loading && savedTemplates.length === 0 && (
          <Card className="p-8 sm:p-12">
            <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
              <Bookmark className="h-16 w-16 text-muted-foreground/50" />
              <div>
                <h3 className="text-xl font-semibold mb-2">No saved templates yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start saving templates you like to access them later
                </p>
                <Button onClick={() => router.push("/template")}>
                  Browse Templates
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Templates Grid */}
        {!loading && savedTemplates.length > 0 && (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              {savedTemplates.length} {savedTemplates.length === 1 ? 'template' : 'templates'} saved
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {savedTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isLiked={likedTemplates.includes(template.id)}
                  isSaved={savedTemplatesIds.includes(template.id)}
                  onLike={() => handleLike(template.id)}
                  onSave={() => handleSave(template.id)}
                  onUse={() => handleUseTemplate(template.id)}
                  onClick={() => handleTemplateClick(template)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

