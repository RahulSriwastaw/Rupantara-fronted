"use client";

import { useState, useEffect } from "react";
import { X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocalStorage } from "@/hooks/use-local-storage";

interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector
}

const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Rupantar AI! 🎉",
    description: "Let's take a quick tour of the app",
  },
  {
    id: "templates",
    title: "Browse Templates",
    description: "Explore 1000+ AI templates to transform your photos",
    target: "[href='/template']",
  },
  {
    id: "generate",
    title: "Generate Images",
    description: "Upload photos and create amazing AI-generated images",
    target: "[href='/generate']",
  },
  {
    id: "wallet",
    title: "Manage Points",
    description: "Earn and spend points to unlock premium features",
    target: "[href='/wallet']",
  },
];

export function OnboardingTour() {
  const [completed, setCompleted] = useLocalStorage("onboarding-completed", false);
  const [currentStep, setCurrentStep] = useState(0);
  const [show, setShow] = useState(!completed);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setCompleted(true);
      setShow(false);
    }
  };

  const handleSkip = () => {
    setCompleted(true);
    setShow(false);
  };

  if (!show) return null;

  const step = tourSteps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSkip}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Step {currentStep + 1} of {tourSteps.length}</span>
              <span>{Math.round(((currentStep + 1) / tourSteps.length) * 100)}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSkip} className="flex-1">
              Skip Tour
            </Button>
            <Button onClick={handleNext} className="flex-1">
              {currentStep === tourSteps.length - 1 ? "Get Started" : "Next"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

