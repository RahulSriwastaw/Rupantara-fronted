"use client";

import { ArrowLeft, Paperclip, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function CreatorSupportPage() {
  const router = useRouter();
  const { toast } = useToast();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 flex-shrink-0">
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold">Support & Help</h1>
      </div>

      {/* Priority Creator Support */}
      <Card>
        <CardContent className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
          <h2 className="text-base sm:text-lg md:text-xl font-bold">Priority Creator Support</h2>
          
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="subject" className="text-sm">Subject</Label>
              <Input
                id="subject"
                placeholder="e.g., Issue with template upload"
                className="h-9 sm:h-10"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="message" className="text-sm">Message</Label>
              <Textarea
                id="message"
                placeholder="Describe your issue in detail..."
                rows={5}
                className="text-sm"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button variant="outline" className="text-primary text-sm sm:text-base h-9 sm:h-10">
                <Paperclip className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Attach File</span>
                <span className="sm:hidden">Attach</span>
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 h-9 sm:h-10 text-sm sm:text-base"
                onClick={() => {
                  toast({
                    title: "Ticket Submitted!",
                    description: "We'll respond within 24 hours.",
                  });
                }}
              >
                Submit Ticket
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Creator Resources */}
      <Card>
        <CardContent className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
          <h2 className="text-base sm:text-lg md:text-xl font-bold">Creator Resources</h2>
          
          <div className="space-y-1.5 sm:space-y-2">
            {[
              "Guide: Creating Effective Templates",
              "Tips: Advanced Prompt Writing",
              "Marketing Your Creations",
              "Understanding Your Analytics",
            ].map((resource) => (
              <button
                key={resource}
                className="w-full flex items-center justify-between p-2.5 sm:p-3 md:p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors text-left"
              >
                <span className="font-medium text-sm sm:text-base truncate flex-1">{resource}</span>
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0 ml-2" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Creator Community */}
      <Card>
        <CardContent className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
          <h2 className="text-base sm:text-lg md:text-xl font-bold">Creator Community</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Join our creator forum to share tips, ask questions, and connect with other creators.
          </p>
          <Button variant="outline" className="text-primary text-sm sm:text-base h-9 sm:h-10">
            Join the Conversation
          </Button>
        </CardContent>
      </Card>

      {/* Account Management */}
      <Card>
        <CardContent className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
          <h2 className="text-base sm:text-lg md:text-xl font-bold">Account Management</h2>
          
          <div className="space-y-1.5 sm:space-y-2">
            <button className="w-full flex items-center justify-between p-2.5 sm:p-3 md:p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors text-left">
              <span className="font-medium text-sm sm:text-base">Switch to User View</span>
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
            </button>
            <button className="w-full flex items-center justify-between p-2.5 sm:p-3 md:p-4 rounded-xl bg-destructive/10 hover:bg-destructive/20 transition-colors text-destructive text-left">
              <span className="font-medium text-sm sm:text-base">Delete Creator Account</span>
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

