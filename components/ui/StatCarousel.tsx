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

  return (
    <div className="w-full space-y-4">
      {/* Main stat display */}
      <div className="gcr-card p-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {current.icon && <div className="text-3xl">{current.icon}</div>}
            <p className="text-sm font-medium text-on-surface-variant">{current.label}</p>
          </div>

          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-bold text-on-surface">{current.value}</p>

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
      </div>

      {/* Navigation controls */}
      {stats.length > 1 && (
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={handlePrev}
            className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface"
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
                  idx === currentIndex ? "bg-primary w-6" : "bg-surface-container-highest w-2 hover:bg-gray-400"
                }`}
                aria-label={`Ir para métrica ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface"
            aria-label="Próxima estatística"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Counter */}
      <div className="text-center text-xs text-on-surface-variant">
        {currentIndex + 1} de {stats.length}
      </div>
    </div>
  );
}
