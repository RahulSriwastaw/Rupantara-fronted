"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const checks = [
    {
      label: "At least 6 characters",
      test: password.length >= 6,
    },
    {
      label: "Contains uppercase letter",
      test: /[A-Z]/.test(password),
    },
    {
      label: "Contains lowercase letter",
      test: /[a-z]/.test(password),
    },
    {
      label: "Contains number",
      test: /[0-9]/.test(password),
    },
    {
      label: "Contains special character",
      test: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    },
  ];

  const strength = checks.filter((check) => check.test).length;
  const strengthLevel =
    strength <= 2 ? "weak" : strength <= 4 ? "medium" : "strong";

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              level <= strength
                ? strengthLevel === "weak"
                  ? "bg-red-500"
                  : strengthLevel === "medium"
                  ? "bg-yellow-500"
                  : "bg-green-500"
                : "bg-secondary"
            )}
          />
        ))}
      </div>
      <div className="space-y-1">
        {checks.map((check, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-2 text-xs",
              check.test ? "text-green-500" : "text-muted-foreground"
            )}
          >
            {check.test ? (
              <Check className="h-3 w-3" />
            ) : (
              <X className="h-3 w-3" />
            )}
            <span>{check.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

