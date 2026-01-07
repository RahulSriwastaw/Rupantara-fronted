"use client";

import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { APP_NAME, APP_VERSION } from "@/lib/constants";

export function VersionInfo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
          <Info className="h-3 w-3 mr-1" />
          v{APP_VERSION}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>About {APP_NAME}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="font-semibold">Version</p>
            <p className="text-sm text-muted-foreground">{APP_VERSION}</p>
          </div>
          <div>
            <p className="font-semibold">Description</p>
            <p className="text-sm text-muted-foreground">
              AI-powered photo transformation and generation platform
            </p>
          </div>
          <div>
            <p className="font-semibold">Built with</p>
            <p className="text-sm text-muted-foreground">
              Next.js, React, TypeScript, TailwindCSS
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              Made with ❤️ in India
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

