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
import { SlidersHorizontal } from "lucide-react";
import type { TemplateFilters as Filters, TemplateCategory } from "@/types";

interface TemplateFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Partial<Filters>) => void;
  onReset: () => void;
}

export function TemplateFilters({
  filters,
  onFiltersChange,
  onReset,
}: TemplateFiltersProps) {
  const [open, setOpen] = useState(false);

  const categories = [
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
  ];

  const ageGroups = ["18-25", "25-35", "35-45", "45+"];

  // Ensure filters properties are properly initialized
  const safeFilters = {
    gender: filters.gender || [],
    type: filters.type || [],
    category: filters.category || [],
    ageGroup: filters.ageGroup || [],
    sortBy: filters.sortBy || "trending"
  };

  const genders: TemplateCategory[] = ["male", "female", "unisex"];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>
            Refine your template search
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Gender */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Gender</Label>
            <div className="space-y-2">
              {genders.map((gender) => (
                <div key={gender} className="flex items-center space-x-2">
                  <Checkbox
                    id={gender}
                    checked={safeFilters.gender.includes(gender)}
                    onCheckedChange={(checked) => {
                      const newGender = checked
                        ? [...safeFilters.gender, gender]
                        : safeFilters.gender.filter((g) => g !== gender);
                      onFiltersChange({ gender: newGender });
                    }}
                  />
                  <Label
                    htmlFor={gender}
                    className="text-sm font-normal capitalize cursor-pointer"
                  >
                    {gender}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Type */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Type</Label>
            <div className="space-y-2">
              {["free", "premium"].map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={type}
                    checked={safeFilters.type.includes(type as any)}
                    onCheckedChange={(checked) => {
                      const newType = checked
                        ? [...safeFilters.type, type as any]
                        : safeFilters.type.filter((t) => t !== type);
                      onFiltersChange({ type: newType });
                    }}
                  />
                  <Label
                    htmlFor={type}
                    className="text-sm font-normal capitalize cursor-pointer"
                  >
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Category</Label>
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={category}
                    checked={safeFilters.category.includes(category as any)}
                    onCheckedChange={(checked) => {
                      const newCategory = checked
                        ? [...safeFilters.category, category as any]
                        : safeFilters.category.filter((c) => c !== category);
                      onFiltersChange({ category: newCategory });
                    }}
                  />
                  <Label
                    htmlFor={category}
                    className="text-sm font-normal capitalize cursor-pointer"
                  >
                    {category}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Age Group */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Age Group</Label>
            <div className="space-y-2">
              {ageGroups.map((age) => (
                <div key={age} className="flex items-center space-x-2">
                  <Checkbox
                    id={age}
                    checked={safeFilters.ageGroup.includes(age)}
                    onCheckedChange={(checked) => {
                      const newAgeGroup = checked
                        ? [...safeFilters.ageGroup, age]
                        : safeFilters.ageGroup.filter((a) => a !== age);
                      onFiltersChange({ ageGroup: newAgeGroup });
                    }}
                  />
                  <Label
                    htmlFor={age}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {age}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Sort By</Label>
            <Select
              value={safeFilters.sortBy}
              onValueChange={(value) =>
                onFiltersChange({ sortBy: value as any })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trending">Trending</SelectItem>
                <SelectItem value="popular">Popular</SelectItem>
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="top_rated">Top Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onReset} className="flex-1">
            Reset All
          </Button>
          <Button onClick={() => setOpen(false)} className="flex-1">
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}