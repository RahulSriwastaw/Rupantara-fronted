"use client";

import { HelpCircle, Book, Video, MessageCircle, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const helpSections = [
  {
    icon: Book,
    title: "Getting Started Guide",
    description: "Learn the basics of using Rupantar AI",
  },
  {
    icon: Video,
    title: "Video Tutorials",
    description: "Watch step-by-step video guides",
  },
  {
    icon: MessageCircle,
    title: "FAQs",
    description: "Find answers to common questions",
  },
  {
    icon: FileText,
    title: "Documentation",
    description: "Complete feature documentation",
  },
];

export function HelpCenter() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <HelpCircle className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Help Center</SheetTitle>
        </SheetHeader>

        <div className="space-y-3 mt-6">
          {helpSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.title} className="cursor-pointer hover:bg-secondary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{section.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {section.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 pt-6 border-t">
          <Button className="w-full" variant="outline">
            <MessageCircle className="h-4 w-4 mr-2" />
            Contact Support
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

