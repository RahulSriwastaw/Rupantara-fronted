"use client";

import { Download, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import { useGenerationStore } from "@/store/generationStore";
import { useWalletStore } from "@/store/walletStore";
import { useToast } from "@/hooks/use-toast";

export function DataExport() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { generations } = useGenerationStore();
  const { transactions, balance } = useWalletStore();

  const exportData = () => {
    const data = {
      user,
      generations,
      transactions,
      balance,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rupantar-data-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Data exported!",
      description: "Your data has been downloaded",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileJson className="h-5 w-5" />
          Export Your Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Download all your data including generations, transactions, and profile
          information in JSON format.
        </p>
        <Button onClick={exportData} className="w-full">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </CardContent>
    </Card>
  );
}

