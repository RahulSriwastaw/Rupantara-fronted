"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, DollarSign, Star, Heart, TrendingUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { creatorApi } from "@/services/api";
import { useTemplateStore } from "@/store/templateStore";

export default function TemplateAnalyticsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { getTemplateById } = useTemplateStore();
  const templateId = searchParams.get('id') || '';
  
  const [template, setTemplate] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Get template from store
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
        
        // Fetch analytics
        try {
          const analyticsData = await creatorApi.getTemplateAnalytics(templateId);
          setAnalytics(analyticsData);
        } catch (error: any) {
          console.error('Failed to load analytics:', error);
          // Use template data as fallback
          const views = templateData.views ?? 0;
          const usageCount = templateData.usageCount || 0;
          setAnalytics({
            useCount: usageCount,
            viewCount: views,
            likeCount: templateData.likeCount || 0,
            savesCount: templateData.saveCount || 0,
            earningsGenerated: templateData.earnings || 0,
            conversionRate: views > 0 
              ? ((usageCount / views) * 100).toFixed(2)
              : 0
          });
        }
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
      loadData();
    }
  }, [templateId, router, toast, getTemplateById]);

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return null;
  }

  const templateViews = template.views ?? 0;
  const templateUsageCount = template.usageCount || 0;
  const stats = analytics || {
    useCount: templateUsageCount,
    viewCount: templateViews,
    likeCount: template.likeCount || 0,
    savesCount: template.saveCount || 0,
    earningsGenerated: template.earnings || 0,
    conversionRate: templateViews > 0 
      ? ((templateUsageCount / templateViews) * 100).toFixed(2)
      : 0
  };

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
        <div>
          <h1 className="text-2xl font-bold">Template Analytics</h1>
          <p className="text-sm text-muted-foreground">{template.title}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.viewCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">People who viewed this template</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Uses</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.useCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Times this template was used</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Views to uses ratio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.likeCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Users who liked this template</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saves</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.savesCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Users who saved this template</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.earningsGenerated.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Earnings from this template</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

