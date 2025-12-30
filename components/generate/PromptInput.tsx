"use client";

import { useState } from "react";
import { Mic, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface PromptInputProps {
  prompt: string;
  negativePrompt: string;
  onPromptChange: (prompt: string) => void;
  onNegativePromptChange: (negativePrompt: string) => void;
  templateName?: string;
}

const suggestions = [
  "Professional look",
  "Cinematic lighting",
  "Soft background",
  "Natural colors",
  "High detail",
  "Studio quality",
];

export function PromptInput({
  prompt,
  negativePrompt,
  onPromptChange,
  onNegativePromptChange,
  templateName,
}: PromptInputProps) {
  const [charCount, setCharCount] = useState(prompt.length);

  const handlePromptChange = (value: string) => {
    if (value.length <= 500) {
      onPromptChange(value);
      setCharCount(value.length);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text/plain');
    
    if (pastedText) {
      const currentText = prompt || '';
      const newText = currentText + pastedText;
      
      // Limit to 500 characters
      const limitedText = newText.slice(0, 500);
      handlePromptChange(limitedText);
      
      // If text was truncated, show a visual indication
      if (newText.length > 500) {
        // Text was truncated, but we already handled it
      }
    }
  };

  const addSuggestion = (suggestion: string) => {
    const newPrompt = prompt ? `${prompt}, ${suggestion}` : suggestion;
    handlePromptChange(newPrompt);
  };

  return (
    <div className="space-y-3 sm:space-y-4">

      {/* Main Prompt */}
      <div className="space-y-2">
        <Label htmlFor="prompt">Your Prompt</Label>
        <div className="relative">
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            onPaste={handlePaste}
            placeholder="Describe what you want to create..."
            className="w-full min-h-[120px] p-3 rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
          <div className="absolute bottom-2 right-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {charCount}/500
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Mic className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* AI Suggestions */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lightbulb className="h-4 w-4" />
          <span>Try these prompts:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <Badge
              key={suggestion}
              variant="secondary"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => addSuggestion(suggestion)}
            >
              + {suggestion}
            </Badge>
          ))}
        </div>
      </div>

      {/* Advanced Options */}
      <Accordion type="single" collapsible>
        <AccordionItem value="advanced" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="text-sm font-medium">Advanced Options</span>
          </AccordionTrigger>
          <AccordionContent className="space-y-4 pt-4">
            {/* Negative Prompt */}
            <div className="space-y-2">
              <Label htmlFor="negative-prompt">Negative Prompt</Label>
              <p className="text-xs text-muted-foreground">
                Describe what to avoid in the image
              </p>
              <textarea
                id="negative-prompt"
                value={negativePrompt}
                onChange={(e) => onNegativePromptChange(e.target.value)}
                onPaste={(e) => {
                  e.preventDefault();
                  const pastedText = e.clipboardData.getData('text/plain');
                  if (pastedText) {
                    const currentText = negativePrompt || '';
                    onNegativePromptChange(currentText + pastedText);
                  }
                }}
                placeholder="blurry, low quality, distorted..."
                className="w-full min-h-[80px] p-3 rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            </div>

            {/* Example Negative Prompts */}
            <div className="flex flex-wrap gap-2">
              {["blurry", "low quality", "distorted", "watermark"].map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => {
                    const newNegative = negativePrompt
                      ? `${negativePrompt}, ${tag}`
                      : tag;
                    onNegativePromptChange(newNegative);
                  }}
                >
                  + {tag}
                </Badge>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

