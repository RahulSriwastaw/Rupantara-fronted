"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { creatorApi } from "@/services/api";
import { useTemplateStore } from "@/store/templateStore";

export default function EditTemplatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { getTemplateById, fetchCreatorTemplates } = useTemplateStore();
  const templateId = searchParams.get('id') || '';
  
  const [template, setTemplate] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setIsLoading(true);
        // Try to get from store first
        let templateData = getTemplateById(templateId);
        
        // If not in store, fetch from API
        if (!templateData) {
          const templates = await creatorApi.getTemplates();
          templateData = templates.templates?.find((t: any) => t.id === templateId);
        }
        
        if (!templateData) {
          toast({
            title: "Error",
            description: "Template not found",
            variant: "destructive",
          });
          router.push("/templates");
          return;
        }
        
        setTemplate(templateData);
      } catch (error: any) {
        console.error('Failed to load template:', error);
        toast({
          title: "Error",
          description: "Failed to load template",
          variant: "destructive",
        });
        router.push("/templates");
      } finally {
        setIsLoading(false);
      }
    };

    if (templateId) {
      loadTemplate();
    }
  }, [templateId, router, toast, getTemplateById]);

  const handleUpdate = async (formData: any) => {
    try {
      await creatorApi.updateTemplate(templateId, formData);
      toast({
        title: "Success!",
        description: "Template updated successfully. It will be reviewed again if it was previously approved.",
      });
      router.push("/templates");
    } catch (error: any) {
      console.error('Failed to update template:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update template",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading template...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return null;
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Edit Template</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Note: Editing an approved template will reset its status to pending review.
            </p>
            <Button
              onClick={() => router.push(`/templates/new?edit=${templateId}`)}
              className="w-full"
            >
              Open Full Edit Form
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Or use the form below for quick edits
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

