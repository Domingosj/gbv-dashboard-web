"use client";

import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { getNextIndex } from "@/lib/carousel-utils";

interface StatItem {
  label: string;
  value: string | number;
  change?: { value: number; trend: "up" | "down" };
  icon?: React.ReactNode;
  color?: "primary" | "success" | "warning" | "critical";
}

interface StatCarouselProps {
  stats: StatItem[];
  autoplay?: boolean;
  interval?: number;
}

export function StatCarousel({
  stats,
  autoplay = true,
  interval = 3000,
}: StatCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoplay);

  useEffect(() => {
    if (!isPlaying || stats.length <= 1) return;
    const timer = setInterval(
      () => setCurrentIndex(prev => getNextIndex(prev, stats.length, "next")),
      interval
    );
    return () => clearInterval(timer);
  }, [isPlaying, stats.length, interval]);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => getNextIndex(prev, stats.length, "next"));
    setIsPlaying(false);
  }, [stats.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex(prev => getNextIndex(prev, stats.length, "prev"));
    setIsPlaying(false);
  }, [stats.length]);

  if (!stats || stats.length === 0) return null;

  const current = stats[currentIndex];
  const colorMap = {
    primary: "from-primary/20 to-primary/5 border-primary/30 text-primary",
    success: "from-success/20 to-success/5 border-success/30 text-success",
    warning: "from-warning/20 to-warning/5 border-warning/30 text-warning",
    critical: "from-critical/20 to-critical/5 border-critical/30 text-critical",
  };

  return (
    <div className="w-full space-y-4">
      {/* Main stat display */}
      <div
        className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${
          colorMap[current.color || "primary"]
        } p-8 transition-all duration-300`}
      >
        {/* Background animation */}
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-20 animate-pulse" />

        <div className="relative space-y-3">
          {/* Icon and label */}
          <div className="flex items-center gap-3">
            {current.icon && <div className="text-3xl">{current.icon}</div>}
            <p className="text-sm font-medium text-text-secondary">{current.label}</p>
          </div>

          {/* Main value */}
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-bold text-text-primary">{current.value}</p>

            {/* Change indicator */}
            {current.change && (
              <div
                className={`flex items-center gap-1 text-sm font-semibold ${
                  current.change.trend === "up" ? "text-success" : "text-critical"
                }`}
              >
                <TrendingUp
                  className={`w-4 h-4 ${
                    current.change.trend === "down" ? "rotate-180" : ""
                  }`}
                />
                {Math.abs(current.change.value)}%
              </div>
            )}
          </div>
        </div>

        {/* Animated border */}
        <div className="absolute inset-0 rounded-2xl border border-transparent bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      </div>

      {/* Navigation controls */}
      {stats.length > 1 && (
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={handlePrev}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-text-primary"
            aria-label="Estatística anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Indicators */}
          <div className="flex gap-2 flex-1 justify-center">
            {stats.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentIndex(idx);
                  setIsPlaying(false);
                }}
                className={`h-2 rounded-full transition-all ${
                  idx === currentIndex ? "bg-primary w-6" : "bg-gray-300 w-2 hover:bg-gray-400"
                }`}
                aria-label={`Ir para métrica ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-text-primary"
            aria-label="Próxima estatística"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Counter */}
      <div className="text-center text-xs text-text-secondary">
        {currentIndex + 1} de {stats.length}
      </div>
    </div>
  );
}
