"use client";

import { ReactNode } from "react";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

interface LazyLoadProps {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
}

export function LazyLoad({
  children,
  fallback,
  rootMargin = "100px",
}: LazyLoadProps) {
  const [ref, isIntersecting] = useIntersectionObserver({
    rootMargin,
  });

  return (
    <div ref={ref}>
      {isIntersecting ? children : fallback}
    </div>
  );
}

