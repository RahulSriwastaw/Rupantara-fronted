"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, Clock, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  recentSearches?: string[];
  suggestions?: string[];
  className?: string;
}

export function SearchBar({
  placeholder = "Search...",
  onSearch,
  recentSearches = [],
  suggestions = [],
  className,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    setShowSuggestions(false);
    onSearch?.(searchQuery);
  };

  const clearSearch = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative w-full", className)} ref={inputRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => {
            setIsFocused(true);
            setShowSuggestions(true);
          }}
          onBlur={() => setIsFocused(false)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSearch(query);
            }
          }}
          className="pl-10 pr-10"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (query || recentSearches.length > 0 || suggestions.length > 0) && (
        <Card className="absolute top-full mt-2 w-full z-50 shadow-xl">
          <CardContent className="p-2">
            {/* Recent Searches */}
            {recentSearches.length > 0 && !query && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Recent Searches
                </div>
                {recentSearches.map((search, i) => (
                  <button
                    key={i}
                    onClick={() => handleSearch(search)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary text-sm transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && query && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  Suggestions
                </div>
                {suggestions
                  .filter((s) =>
                    s.toLowerCase().includes(query.toLowerCase())
                  )
                  .slice(0, 5)
                  .map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleSearch(suggestion)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary text-sm transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
              </div>
            )}

            {/* No Results */}
            {query && suggestions.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                No results found
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

