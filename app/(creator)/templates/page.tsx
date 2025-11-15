"use client";

import { useState } from "react";
import { Plus, Search, MoreVertical, Eye, DollarSign, Star, Menu } from "lucide-react";
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

export default function CreatorTemplatesPage() {
  const router = useRouter();
  const { templates } = useTemplateStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Filter templates based on active tab
  const filteredTemplates = templates.filter((t) => {
    if (activeTab === "all") return true;
    return t.status === activeTab;
  });

  return (
    <div className="w-full space-y-3 sm:space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 flex-shrink-0">
            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">My Templates</h1>
        </div>
        <Button
          size="icon"
          className="rounded-full bg-primary h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 flex-shrink-0"
          onClick={() => router.push("/templates/new")}
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="all" className="text-xs sm:text-sm py-1.5 sm:py-2">All</TabsTrigger>
          <TabsTrigger value="approved" className="text-xs sm:text-sm py-1.5 sm:py-2">Approved</TabsTrigger>
          <TabsTrigger value="pending" className="text-xs sm:text-sm py-1.5 sm:py-2">Pending</TabsTrigger>
          <TabsTrigger value="rejected" className="text-xs sm:text-sm py-1.5 sm:py-2">Rejected</TabsTrigger>
        </TabsList>

        {/* Sort */}
        <div className="mt-3 sm:mt-4">
          <Select defaultValue="recent">
            <SelectTrigger className="w-full md:w-auto h-9 sm:h-10">
              <SelectValue placeholder="Sort by: Most Recent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="earnings">Highest Earnings</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value={activeTab} className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
          {filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="p-6 sm:p-8 md:p-12 text-center">
                <div className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 mx-auto mb-3 sm:mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <Plus className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2">No Templates</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4">
                  Looks like everything is up to date! Create a new template to get started.
                </p>
                <Button onClick={() => router.push("/templates/new")} size="sm" className="sm:size-default">
                  Create Template
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredTemplates.map((template) => (
              <Card key={template.id}>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl ${template.image} flex-shrink-0`} />
                    
                    <div className="flex-1 space-y-1.5 sm:space-y-2 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                            {template.status === "approved" && (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] sm:text-xs">
                                APPROVED
                              </Badge>
                            )}
                            {template.status === "pending" && (
                              <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px] sm:text-xs">
                                PENDING
                              </Badge>
                            )}
                            {template.status === "rejected" && (
                              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] sm:text-xs">
                                REJECTED
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-bold text-sm sm:text-base md:text-lg truncate">{template.title}</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 sm:line-clamp-2">
                            {template.description}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>View Analytics</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm flex-wrap">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{template.views}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{template.earnings}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
                          <span>{template.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
