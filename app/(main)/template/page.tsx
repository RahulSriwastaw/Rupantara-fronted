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
import { TemplateCard, TemplateSkeleton } from "@/components/template/TemplateCard";
import { TemplateFilters } from "@/components/template/TemplateFilters";
import { TemplateDetailModal } from "@/components/template/TemplateDetailModal";
import { templatesApi, api } from "@/services/api";
import { useTemplateStore } from "@/store/templateStore";
import { useToast } from "@/hooks/use-toast";
import type { Template } from "@/types";
import { cn } from "@/lib/utils";

function TemplateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryChips, setCategoryChips] = useState<string[]>(["All", "Trending"]);
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [categoryWithSubs, setCategoryWithSubs] = useState<Record<string, string[]>>({});
  const [currentSubCategories, setCurrentSubCategories] = useState<string[]>([]);

  // Handle template ID from URL (redirect to generate page)
  useEffect(() => {
    const templateId = searchParams?.get("t");
    if (templateId) {
      router.replace(`/generate?templateId=${templateId}`);
    }
  }, [searchParams, router]);

  // Track template views when modal opens
  useEffect(() => {
    if (selectedTemplate?.id) {
      templatesApi.viewTemplate(selectedTemplate.id).catch(err => console.error("View track failed", err));
    }
  }, [selectedTemplate]);

  // Track template views when card is clicked (for analytics)
  const handleTemplateClick = (template: Template) => {
    setSelectedTemplate(template);
    // Track view when template card is clicked
    templatesApi.viewTemplate(template.id).catch(err => console.error("View track failed", err));
  };

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

  // Load categories with sub-categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await api.get('/admin/categories');
        // Build category data structure
        const catNames: string[] = [];
        const catSubMap: Record<string, string[]> = {};

        if (Array.isArray(cats)) {
          cats.forEach((c: any) => {
            if (c.name) {
              catNames.push(c.name);
              catSubMap[c.name] = c.subCategories || [];
            }
          });
        }

        if (catNames.length > 0) {
          setCategoryChips(["All", "Trending", ...catNames]);
          setFilterCategories(catNames);
          setCategoryWithSubs(catSubMap);
        }
      } catch (e) { console.error("Failed to load categories", e); }
    };
    loadCategories();
  }, []);

  // Update sub-categories when category changes
  useEffect(() => {
    if (selectedCategory && selectedCategory !== 'All' && selectedCategory !== 'Trending') {
      const subs = categoryWithSubs[selectedCategory] || [];
      setCurrentSubCategories(subs);
      setSelectedSubCategory(null); // Reset sub-category selection
    } else {
      setCurrentSubCategories([]);
      setSelectedSubCategory(null);
    }
  }, [selectedCategory, categoryWithSubs]);

  // Fetch Templates with Server-Side Filtering
  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();

        // Header Category Filter
        if (selectedCategory && selectedCategory !== 'All') {
          if (selectedCategory === "Trending") params.append('sort', 'Trending');
          else {
            params.append('category', selectedCategory);
            // Sub-category filter
            if (selectedSubCategory) {
              params.append('subCategory', selectedSubCategory);
            }
          }
        }

        // Search
        if (searchQuery) params.append('search', searchQuery);

        // Advanced Filters
        if (filters.gender?.length) filters.gender.forEach(g => params.append('gender', g));
        if (filters.ageGroup?.length) filters.ageGroup.forEach(a => params.append('ageGroup', a));
        if (filters.state) params.append('state', filters.state);

        // Type (Free/Premium)
        if (filters.type?.includes("premium") && !filters.type.includes("free")) params.append('isPremium', 'true');
        if (filters.type?.includes("free") && !filters.type.includes("premium")) params.append('isPremium', 'false');

        // Sidebar Category Filter
        if (filters.category?.length) filters.category.forEach(c => params.append('category', c));

        // Sorting
        if (filters.sortBy) {
          if (filters.sortBy === 'trending') params.append('sort', 'Trending');
          else if (filters.sortBy === 'popular') params.append('sort', 'Popular');
          else if (filters.sortBy === 'latest') params.append('sort', 'Latest');
          else if (filters.sortBy === 'top_rated') params.append('sort', 'Top Rated');
        }

        const data = await templatesApi.getAll(params.toString());
        const safeData = Array.isArray(data) ? data : [];

        // Sync liked templates from backend response to store FIRST (before rendering)
        // Backend is the source of truth for like status - ALWAYS sync, don't check conditions
        const likedTemplateIds = safeData
          .filter(t => t.isLiked === true) // Only include explicitly liked templates
          .map(t => t.id);

        // Sync saved templates from backend response to store FIRST (before rendering)
        const savedTemplateIds = safeData
          .filter(t => t.isSaved === true) // Only include explicitly saved templates
          .map(t => t.id);

        // ALWAYS sync store with backend state (backend is source of truth)
        // This ensures refresh always shows correct like/save status
        useTemplateStore.setState({
          likedTemplates: likedTemplateIds,
          savedTemplates: savedTemplateIds
        });
        console.log('✅ Synced liked templates from backend:', likedTemplateIds.length, 'templates');
        console.log('✅ Synced saved templates from backend:', savedTemplateIds.length, 'templates');

        // Set templates after store sync (ensures correct isLiked prop)
        setTemplates(safeData);
        setFilteredTemplates(safeData); // Backend handles filtering

      } catch (error: any) {
        console.error("API error:", error);
        setTemplates([]);
        setFilteredTemplates([]);
        toast({
          title: "Error",
          description: error?.message || "Unable to load templates",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchTemplates();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [selectedCategory, selectedSubCategory, searchQuery, filters, toast]);

  const handleUseTemplate = (templateId: string) => {
    router.push(`/generate?templateId=${templateId}`);
  };

  const handleLike = (templateId: string) => {
    // TemplateCard handles the API call directly
    // This function is kept for compatibility but doesn't do anything
    // to prevent double API calls
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
    <div className="w-full max-w-full py-2 sm:py-3 md:py-4 space-y-3 sm:space-y-4 overflow-x-hidden">
      {/* Header Section */}
      <div className="space-y-2 sm:space-y-3 w-full max-w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" />

        {/* Search & Filter */}
        <div className="flex flex-row items-center gap-2 w-full max-w-full">
          <div className="relative flex-1 min-w-0 max-w-full">
            <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 sm:pl-10 text-xs sm:text-sm h-9 sm:h-10"
            />
          </div>
          <div className="flex-shrink-0">
            <TemplateFilters
              filters={filters}
              onFiltersChange={(newFilters) => setFilters(newFilters)}
              onReset={resetFilters}
              categories={filterCategories}
            />
          </div>
        </div>

        {/* Category Bar */}
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 sm:-mx-0 px-2 sm:px-0">
          {categoryChips.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <Badge
                key={category}
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "cursor-pointer whitespace-nowrap flex-shrink-0 text-[10px] sm:text-xs md:text-sm transition-all px-2 sm:px-3 py-1 sm:py-1.5",
                  isSelected
                    ? "bg-primary text-white border-primary hover:bg-primary/90"
                    : "text-foreground border-border hover:bg-secondary"
                )}
                onClick={() => setSelectedCategory(category)}
              >
                {category === "Trending" && <Flame className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />}
                {category}
              </Badge>
            );
          })}
        </div>

        {/* Sub-Category Bar */}
        {currentSubCategories.length > 0 && (
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-2 sm:-mx-0 px-2 sm:px-0">
            {/* All sub-categories option */}
            <Badge
              variant={selectedSubCategory === null ? "default" : "outline"}
              className={cn(
                "cursor-pointer whitespace-nowrap flex-shrink-0 text-[10px] sm:text-xs transition-all px-2 sm:px-3 py-1",
                selectedSubCategory === null
                  ? "bg-primary/80 text-white border-primary"
                  : "text-foreground border-border hover:bg-secondary"
              )}
              onClick={() => setSelectedSubCategory(null)}
            >
              All Styles
            </Badge>

            {/* Individual sub-categories */}
            {currentSubCategories.map((subCat) => (
              <Badge
                key={subCat}
                variant={selectedSubCategory === subCat ? "default" : "outline"}
                className={cn(
                  "cursor-pointer whitespace-nowrap flex-shrink-0 text-[10px] sm:text-xs transition-all px-2 sm:px-3 py-1",
                  selectedSubCategory === subCat
                    ? "bg-primary/80 text-white border-primary"
                    : "text-foreground border-border hover:bg-secondary"
                )}
                onClick={() => setSelectedSubCategory(subCat)}
              >
                {subCat}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Trending Section */}
      {
        selectedCategory === "All" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
              <h2 className="text-lg sm:text-xl font-bold">Trending Now</h2>
            </div>
            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-2 sm:-mx-0 px-2 sm:px-0">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-36 sm:w-44 md:w-52 lg:w-56">
                    <TemplateSkeleton compact={true} />
                  </div>
                ))
              ) : (
                templates
                  .sort((a, b) => b.usageCount - a.usageCount)
                  .slice(0, 5)
                  .map((template, idx) => (
                    <div key={template.id} className="flex-shrink-0 w-36 sm:w-44 md:w-52 lg:w-56">
                      <TemplateCard
                        template={template}
                        // Use backend isLiked status as primary source, fallback to store
                        isLiked={template.isLiked !== undefined ? template.isLiked : likedTemplates.includes(template.id)}
                        isSaved={savedTemplates.includes(template.id)}
                        onLike={() => handleLike(template.id)}
                        onSave={() => handleSave(template.id)}
                        onUse={() => handleUseTemplate(template.id)}
                        onClick={() => handleTemplateClick(template)}
                        compact={true}
                        priority={idx < 5}
                      />
                    </div>
                  ))
              )}
            </div>
          </div>
        )
      }

      {/* Templates Grid */}
      <div className="space-y-2 sm:space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <h2 className="text-lg sm:text-xl font-bold">
            {selectedCategory === "All" ? "All Templates" : selectedCategory}
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 w-full max-w-full">
            {[...Array(8)].map((_, i) => (
              <TemplateSkeleton key={i} />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 w-full max-w-full">
            {filteredTemplates.map((template, idx) => (
              <TemplateCard
                key={template.id}
                template={template}
                // Use backend isLiked status as primary source, fallback to store
                isLiked={template.isLiked !== undefined ? template.isLiked : likedTemplates.includes(template.id)}
                isSaved={savedTemplates.includes(template.id)}
                onLike={() => handleLike(template.id)}
                onSave={() => handleSave(template.id)}
                onUse={() => handleUseTemplate(template.id)}
                onClick={() => handleTemplateClick(template)}
                priority={idx < 4}
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
    </div >
  );
}

export default function TemplatePage() {
  return (
    <Suspense fallback={<div />}>
      <TemplateContent />
    </Suspense>
  );
}

