"use client";

export const dynamic = "force-dynamic";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Flame } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { ImageIcon } from "lucide-react";
import { TemplateCard } from "@/components/template/TemplateCard";
import { TemplateFilters } from "@/components/template/TemplateFilters";
import { TemplateDetailModal } from "@/components/template/TemplateDetailModal";
import { templatesApi } from "@/services/api";
import { templatesApi as mockTemplatesApi } from "@/services/mockApi";
import { useTemplateStore } from "@/store/templateStore";
import { useToast } from "@/hooks/use-toast";
import type { Template } from "@/types";
import { cn } from "@/lib/utils";

const categories = [
  "All",
  "Trending",
  "Cartoon",
  "Wedding",
  "Fashion",
  "Business",
  "Cinematic",
  "Festival",
  "Portrait",
  "Couple",
  "Traditional",
  "Modern",
];

function TemplateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Handle template ID from URL (redirect to generate page)
  useEffect(() => {
    const templateId = searchParams?.get("t");
    if (templateId) {
      router.replace(`/generate?templateId=${templateId}`);
    }
  }, [searchParams, router]);
  
  const {
    savedTemplates,
    likedTemplates,
    filters,
    searchQuery,
    toggleSaveTemplate,
    toggleLikeTemplate,
    setFilters,
    setSearchQuery,
    resetFilters,
  } = useTemplateStore();

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      setIsLoading(true);
      try {
        // Use real API only
        const data = await templatesApi.getAll();
        console.log('Templates loaded from API:', data.length);
        setTemplates(data);
        setFilteredTemplates(data);
      } catch (error: any) {
        console.error("API error:", error);
        setTemplates([]);
        setFilteredTemplates([]);
        toast({
          title: "Error",
          description: error.message || "Failed to load templates",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadTemplates();
  }, [toast]);

  // Filter templates
  useEffect(() => {
    let filtered = [...templates];

    // Category filter
    if (selectedCategory !== "All") {
      if (selectedCategory === "Trending") {
        filtered = filtered.sort((a, b) => b.usageCount - a.usageCount).slice(0, 20);
      } else {
        filtered = filtered.filter(
          (t) => t.subCategory.toLowerCase() === selectedCategory.toLowerCase()
        );
      }
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Gender filter
    if (filters.gender.length > 0) {
      filtered = filtered.filter((t) => filters.gender.includes(t.category));
    }

    // Type filter
    if (filters.type.length > 0) {
      filtered = filtered.filter((t) => {
        if (filters.type.includes("free")) return t.isFree;
        if (filters.type.includes("premium")) return !t.isFree;
        return true;
      });
    }

    // Category filter
    if (filters.category.length > 0) {
      filtered = filtered.filter((t) =>
        filters.category.includes(t.subCategory)
      );
    }

    // Age group filter
    if (filters.ageGroup.length > 0) {
      filtered = filtered.filter(
        (t) => t.ageGroup && filters.ageGroup.includes(t.ageGroup)
      );
    }

    // Sort
    switch (filters.sortBy) {
      case "trending":
        filtered.sort((a, b) => b.usageCount - a.usageCount);
        break;
      case "popular":
        filtered.sort((a, b) => b.likeCount - a.likeCount);
        break;
      case "latest":
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "top_rated":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
    }

    setFilteredTemplates(filtered);
  }, [templates, selectedCategory, searchQuery, filters]);

  const handleUseTemplate = (templateId: string) => {
    router.push(`/generate?templateId=${templateId}`);
  };

  const handleLike = (templateId: string) => {
    toggleLikeTemplate(templateId);
    toast({
      title: likedTemplates.includes(templateId) ? "Unliked" : "Liked",
      description: likedTemplates.includes(templateId)
        ? "Removed from liked templates"
        : "Added to liked templates",
    });
  };

  const handleSave = (templateId: string) => {
    toggleSaveTemplate(templateId);
    toast({
      title: savedTemplates.includes(templateId) ? "Unsaved" : "Saved",
      description: savedTemplates.includes(templateId)
        ? "Removed from saved templates"
        : "Added to saved templates",
    });
  };

  return (
    <div className="w-full py-2 sm:py-3 md:py-4 space-y-3 sm:space-y-4">
      {/* Header Section */}
      <div className="space-y-2 sm:space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" />

        {/* Search & Filter */}
        <div className="flex flex-row items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
          <TemplateFilters
            filters={filters}
            onFiltersChange={(newFilters) => setFilters(newFilters)}
            onReset={resetFilters}
          />
        </div>

        {/* Category Bar */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <Badge
                key={category}
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "cursor-pointer whitespace-nowrap flex-shrink-0 text-xs sm:text-sm transition-all",
                  isSelected 
                    ? "bg-primary text-white border-primary hover:bg-primary/90" 
                    : "text-foreground border-border hover:bg-secondary"
                )}
                onClick={() => setSelectedCategory(category)}
              >
                {category === "Trending" && <Flame className="h-3 w-3 mr-1" />}
                {category}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Trending Section */}
      {selectedCategory === "All" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
            <h2 className="text-lg sm:text-xl font-bold">Trending Now</h2>
          </div>
          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {templates
              .sort((a, b) => b.usageCount - a.usageCount)
              .slice(0, 5)
              .map((template) => (
                <div key={template.id} className="flex-shrink-0 w-40 sm:w-48 md:w-56">
                  <TemplateCard
                    template={template}
                    isLiked={likedTemplates.includes(template.id)}
                    isSaved={savedTemplates.includes(template.id)}
                    onLike={() => handleLike(template.id)}
                    onSave={() => handleSave(template.id)}
                    onUse={() => handleUseTemplate(template.id)}
                    onClick={() => setSelectedTemplate(template)}
                    compact={true}
                  />
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Templates Grid */}
      <div className="space-y-2 sm:space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <h2 className="text-lg sm:text-xl font-bold">
            {selectedCategory === "All" ? "All Templates" : selectedCategory}
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="aspect-square rounded-lg bg-muted animate-pulse"
              />
            ))}
          </div>
        ) : filteredTemplates.length === 0 ? (
          <EmptyState
            icon={ImageIcon}
            title="No templates found"
            description="Try adjusting your search or filters to find more templates"
            actionLabel="Clear Filters"
            onAction={resetFilters}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:max-w-5xl mx-auto">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isLiked={likedTemplates.includes(template.id)}
                isSaved={savedTemplates.includes(template.id)}
                onLike={() => handleLike(template.id)}
                onSave={() => handleSave(template.id)}
                onUse={() => handleUseTemplate(template.id)}
                onClick={() => setSelectedTemplate(template)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Template Detail Modal */}
      <TemplateDetailModal
        template={selectedTemplate}
        isOpen={!!selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        isLiked={
          selectedTemplate ? likedTemplates.includes(selectedTemplate.id) : false
        }
        isSaved={
          selectedTemplate ? savedTemplates.includes(selectedTemplate.id) : false
        }
        onLike={() => selectedTemplate && handleLike(selectedTemplate.id)}
        onSave={() => selectedTemplate && handleSave(selectedTemplate.id)}
      />
    </div>
  );
}

export default function TemplatePage() {
  return (
    <Suspense fallback={<div />}> 
      <TemplateContent />
    </Suspense>
  );
}

