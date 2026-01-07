"use client";

import { AlertCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RateLimitIndicatorProps {
  remaining: number;
  limit: number;
  resetTime?: Date;
}

export function RateLimitIndicator({
  remaining,
  limit,
  resetTime,
}: RateLimitIndicatorProps) {
  const percentage = (remaining / limit) * 100;
  const isLow = percentage < 20;

  if (remaining >= limit * 0.5) return null; // Only show if below 50%

  return (
    <Card className={isLow ? "border-orange-500/50 bg-orange-500/10" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isLow ? (
              <AlertCircle className="h-5 w-5 text-orange-500" />
            ) : (
              <Clock className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-medium">
                {isLow ? "Rate limit warning" : "Rate limit"}
              </p>
              <p className="text-xs text-muted-foreground">
                {remaining} of {limit} requests remaining
              </p>
            </div>
          </div>
          <Badge variant={isLow ? "destructive" : "secondary"}>
            {Math.round(percentage)}%
          </Badge>
        </div>
        {resetTime && (
          <p className="text-xs text-muted-foreground mt-2">
            Resets at {resetTime.toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

