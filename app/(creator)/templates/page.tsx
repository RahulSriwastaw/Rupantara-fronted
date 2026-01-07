"use client";

import { useState, useEffect } from "react";
import { Plus, Search, MoreVertical, Eye, DollarSign, Star, Menu, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useTemplateStore } from "@/store/templateStore";
import { creatorApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

export default function CreatorTemplatesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    templates,
    isLoading,
    totalTemplates,
    currentPage,
    totalPages,
    fetchCreatorTemplates
  } = useTemplateStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCreatorTemplates(activeTab === "all" ? undefined : activeTab, sortBy);
  }, [activeTab, sortBy, fetchCreatorTemplates]);

  // Filter templates based on search query (client-side filtering for instant feedback)
  const filteredTemplates = templates.filter((t) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  const handleEdit = (templateId: string) => {
    router.push(`/templates/edit?id=${templateId}`);
  };

  const handleViewAnalytics = (templateId: string) => {
    router.push(`/templates/analytics?id=${templateId}`);
  };

  const handleDuplicate = async (templateId: string) => {
    try {
      toast({
        title: "Duplicating template...",
        description: "Please wait while we create a copy of your template.",
      });
      
      // First get the template data
      const template = templates.find(t => t.id === templateId);
      if (!template) {
        toast({
          title: "Error",
          description: "Template not found",
          variant: "destructive",
        });
        return;
      }

      // Create a duplicate by creating a new template with same data
      const duplicateData = {
        title: `${template.title} (Copy)`,
        description: template.description || '',
        imageUrl: template.image || template.demoImage || '',
        category: template.category,
        subCategory: template.subCategory,
        prompt: template.hiddenPrompt || template.visiblePrompt || '',
        negativePrompt: template.negativePrompt || '',
        tags: template.tags || [],
        gender: (template as any).gender,
        isPremium: !template.isFree,
      };

      await creatorApi.createTemplate(duplicateData);
      
      toast({
        title: "Success!",
        description: "Template duplicated successfully. It will be submitted for review.",
      });
      
      // Refresh templates list
      fetchCreatorTemplates(activeTab === "all" ? undefined : activeTab, sortBy);
    } catch (error: any) {
      console.error('Failed to duplicate template:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to duplicate template",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingId(templateId);
      await creatorApi.deleteTemplate(templateId);
      
      toast({
        title: "Success!",
        description: "Template deleted successfully.",
      });
      
      // Refresh templates list
      fetchCreatorTemplates(activeTab === "all" ? undefined : activeTab, sortBy);
    } catch (error: any) {
      console.error('Failed to delete template:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete template. Only pending or rejected templates can be deleted.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading && templates.length === 0) {
    return (
      <div className="w-full flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 sm:space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 flex-shrink-0">
            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">My Templates</h1>
          <Badge variant="secondary" className="text-xs">
            {totalTemplates} total
          </Badge>
        </div>
        <Button
          size="icon"
          className="rounded-full bg-primary h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 flex-shrink-0"
          onClick={() => router.push("/templates/new")}
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="all" className="text-xs sm:text-sm py-1.5 sm:py-2">All</TabsTrigger>
          <TabsTrigger value="approved" className="text-xs sm:text-sm py-1.5 sm:py-2">Approved</TabsTrigger>
          <TabsTrigger value="pending" className="text-xs sm:text-sm py-1.5 sm:py-2">Pending</TabsTrigger>
          <TabsTrigger value="rejected" className="text-xs sm:text-sm py-1.5 sm:py-2">Rejected</TabsTrigger>
        </TabsList>

        {/* Sort */}
        <div className="mt-3 sm:mt-4 flex items-center justify-between gap-2">
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full md:w-auto h-9 sm:h-10">
              <SelectValue placeholder="Sort by: Most Recent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="earnings">Highest Earnings</SelectItem>
            </SelectContent>
          </Select>

          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        <TabsContent value={activeTab} className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
          {filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="p-6 sm:p-8 md:p-12 text-center">
                <div className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 mx-auto mb-3 sm:mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <Plus className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2">
                  {searchQuery ? "No Results Found" : "No Templates"}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4">
                  {searchQuery
                    ? "Try a different search term."
                    : "Looks like everything is up to date! Create a new template to get started."
                  }
                </p>
                {!searchQuery && (
                  <Button onClick={() => router.push("/templates/new")} size="sm" className="sm:size-default">
                    Create Template
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
                    {/* Template Image */}
                    <div
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex-shrink-0 bg-cover bg-center bg-secondary"
                      style={{
                        backgroundImage: template.image || template.demoImage
                          ? `url(${template.image || template.demoImage})`
                          : undefined
                      }}
                    />

                    <div className="flex-1 space-y-1.5 sm:space-y-2 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                            {template.approvalStatus === "approved" && (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] sm:text-xs">
                                🟢 LIVE
                              </Badge>
                            )}
                            {template.approvalStatus === "pending" && (
                              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px] sm:text-xs">
                                🟡 PENDING REVIEW
                              </Badge>
                            )}
                            {template.approvalStatus === "rejected" && (
                              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] sm:text-xs">
                                🔴 REJECTED
                              </Badge>
                            )}
                            {template.category && (
                              <Badge variant="outline" className="text-[10px] sm:text-xs">
                                {template.category}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-bold text-sm sm:text-base md:text-lg truncate">{template.title}</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 sm:line-clamp-2">
                            {template.description || "No description"}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleEdit(template.id)}
                              disabled={template.approvalStatus === 'approved'}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleViewAnalytics(template.id)}
                              disabled={template.approvalStatus !== 'approved'}
                            >
                              View Analytics
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDuplicate(template.id)}
                            >
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDelete(template.id)}
                              disabled={deletingId === template.id}
                            >
                              {deletingId === template.id ? "Deleting..." : "Delete"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm flex-wrap">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{template.views?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>${(template.earnings || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                          <span>{template.rating?.toFixed(1) || "0.0"}</span>
                        </div>
                        <div className="flex items-center gap-1 text-primary">
                          <span>{template.usageCount?.toLocaleString() || 0} uses</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => fetchCreatorTemplates(activeTab === "all" ? undefined : activeTab, sortBy, currentPage - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => fetchCreatorTemplates(activeTab === "all" ? undefined : activeTab, sortBy, currentPage + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
