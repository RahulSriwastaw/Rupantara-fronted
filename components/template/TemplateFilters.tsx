// Enhanced Template Filters Component with Professional UI
"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal, X, Check } from "lucide-react";
import type { TemplateFilters as Filters, TemplateCategory } from "@/types";

interface TemplateFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Partial<Filters>) => void;
  onReset: () => void;
  categories?: string[];
}

export function TemplateFilters({
  filters,
  onFiltersChange,
  onReset,
  categories = [
    "wedding",
    "fashion",
    "business",
    "cinematic",
    "festival",
    "portrait",
    "couple",
    "traditional",
    "modern",
    "cartoon",
  ],
}: TemplateFiltersProps) {
  const [open, setOpen] = useState(false);

  const ageGroups = ["18-25", "25-35", "35-45", "45+"];
  const indianStates = [
    "Maharashtra",
    "Delhi",
    "Karnataka",
    "Punjab",
    "Gujarat",
    "Rajasthan",
    "West Bengal",
    "Tamil Nadu",
    "Uttar Pradesh",
    "Madhya Pradesh",
    "Kerala",
    "Telangana",
  ];

  // Ensure filters properties are properly initialized
  const safeFilters = {
    gender: filters.gender || [],
    type: filters.type || [],
    category: filters.category || [],
    ageGroup: filters.ageGroup || [],
    sortBy: filters.sortBy || "trending",
  };

  const genders: TemplateCategory[] = ["male", "female", "unisex"];

  // Count active filters
  const activeFilterCount =
    safeFilters.gender.length +
    safeFilters.type.length +
    safeFilters.category.length +
    safeFilters.ageGroup.length +
    (filters.state && filters.state !== "All" ? 1 : 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:w-[380px] overflow-y-auto bg-gradient-to-b from-background via-background to-muted/20"
      >
        <SheetHeader className="pb-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Filters
              </SheetTitle>
              <SheetDescription>
                Refine your template search
              </SheetDescription>
            </div>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Gender Filter */}
          <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/50">
            <Label className="text-base font-semibold flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-primary" />
              Gender
            </Label>
            <div className="space-y-2.5">
              {genders.map((gender) => (
                <div
                  key={gender}
                  className="flex items-center space-x-3 group"
                >
                  <Checkbox
                    id={`gender-${gender}`}
                    checked={safeFilters.gender.includes(gender)}
                    onCheckedChange={(checked) => {
                      const newGender = checked
                        ? [...safeFilters.gender, gender]
                        : safeFilters.gender.filter((g) => g !== gender);
                      onFiltersChange({ gender: newGender });
                    }}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label
                    htmlFor={`gender-${gender}`}
                    className="text-sm font-medium capitalize cursor-pointer flex-1 group-hover:text-primary transition-colors"
                  >
                    {gender}
                  </Label>
                  {safeFilters.gender.includes(gender) && (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/50">
            <Label className="text-base font-semibold flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-primary" />
              Type
            </Label>
            <div className="space-y-2.5">
              {["free", "premium"].map((type) => (
                <div
                  key={type}
                  className="flex items-center space-x-3 group"
                >
                  <Checkbox
                    id={`type-${type}`}
                    checked={safeFilters.type.includes(type as any)}
                    onCheckedChange={(checked) => {
                      const newType = checked
                        ? [...safeFilters.type, type as any]
                        : safeFilters.type.filter((t) => t !== type);
                      onFiltersChange({ type: newType });
                    }}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label
                    htmlFor={`type-${type}`}
                    className="text-sm font-medium capitalize cursor-pointer flex-1 group-hover:text-primary transition-colors"
                  >
                    {type}
                  </Label>
                  {safeFilters.type.includes(type as any) && (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/50">
            <Label className="text-base font-semibold flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-primary" />
              Category
            </Label>
            <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
              {categories.map((category) => (
                <div
                  key={category}
                  className="flex items-center space-x-3 group"
                >
                  <Checkbox
                    id={`category-${category}`}
                    checked={safeFilters.category.includes(category as any)}
                    onCheckedChange={(checked) => {
                      const newCategory = checked
                        ? [...safeFilters.category, category as any]
                        : safeFilters.category.filter((c) => c !== category);
                      onFiltersChange({ category: newCategory });
                    }}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label
                    htmlFor={`category-${category}`}
                    className="text-sm font-medium capitalize cursor-pointer flex-1 group-hover:text-primary transition-colors"
                  >
                    {category}
                  </Label>
                  {safeFilters.category.includes(category as any) && (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Age Group Filter */}
          <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/50">
            <Label className="text-base font-semibold flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-primary" />
              Age Group
            </Label>
            <div className="space-y-2.5">
              {ageGroups.map((age) => (
                <div
                  key={age}
                  className="flex items-center space-x-3 group"
                >
                  <Checkbox
                    id={`age-${age}`}
                    checked={safeFilters.ageGroup.includes(age)}
                    onCheckedChange={(checked) => {
                      const newAgeGroup = checked
                        ? [...safeFilters.ageGroup, age]
                        : safeFilters.ageGroup.filter((a) => a !== age);
                      onFiltersChange({ ageGroup: newAgeGroup });
                    }}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <Label
                    htmlFor={`age-${age}`}
                    className="text-sm font-medium cursor-pointer flex-1 group-hover:text-primary transition-colors"
                  >
                    {age}
                  </Label>
                  {safeFilters.ageGroup.includes(age) && (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* State Filter (India) */}
          <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/50">
            <Label className="text-base font-semibold flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-primary" />
              State
            </Label>
            <Select
              value={filters.state || "All"}
              onValueChange={(value) =>
                onFiltersChange({ state: value === "All" ? undefined : value })
              }
            >
              <SelectTrigger className="bg-background border-border/50 hover:border-primary/50 transition-colors">
                <SelectValue placeholder="All India" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All India</SelectItem>
                {indianStates.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort By */}
          <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/50">
            <Label className="text-base font-semibold flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-primary" />
              Sort By
            </Label>
            <Select
              value={safeFilters.sortBy}
              onValueChange={(value) =>
                onFiltersChange({ sortBy: value as any })
              }
            >
              <SelectTrigger className="bg-background border-border/50 hover:border-primary/50 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trending">🔥 Trending</SelectItem>
                <SelectItem value="popular">⭐ Popular</SelectItem>
                <SelectItem value="latest">🆕 Latest</SelectItem>
                <SelectItem value="top_rated">🏆 Top Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border/50 pt-4 pb-2 px-1">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onReset}
              className="flex-1 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all"
            >
              <X className="h-4 w-4 mr-2" />
              Reset All
            </Button>
            <Button
              onClick={() => setOpen(false)}
              className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
            >
              <Check className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: hsl(var(--muted));
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--primary));
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--primary) / 0.8);
        }
      `}</style>
    </Sheet>
  );
}
