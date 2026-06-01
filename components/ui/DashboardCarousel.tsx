"use client";

import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import { getNextIndex } from "@/lib/carousel-utils";

interface DashboardCarouselProps {
  children: React.ReactNode[];
  titles: string[];
  autoplay?: boolean;
  interval?: number;
}

export function DashboardCarousel({
  children,
  titles,
  autoplay = false,
  interval = 8000,
}: DashboardCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const totalPanels = children.length;

  useEffect(() => {
    if (!isPlaying || totalPanels <= 1) return;
    const timer = setInterval(
      () => setCurrentIndex(prev => getNextIndex(prev, totalPanels, "next")),
      interval
    );
    return () => clearInterval(timer);
  }, [isPlaying, totalPanels, interval]);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => getNextIndex(prev, totalPanels, "next"));
  }, [totalPanels]);

  const handlePrev = useCallback(() => {
    setCurrentIndex(prev => getNextIndex(prev, totalPanels, "prev"));
  }, [totalPanels]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    },
    [handleNext, handlePrev]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const containerClass = isFullscreen
    ? "fixed inset-0 z-50 bg-surface-container-lowest rounded-none"
    : "relative w-full rounded-lg border border-outline-variant overflow-hidden";

  return (
    <div className={containerClass}>
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-4 flex items-center justify-between">
        <div>
          <h2 className="text-title-md font-bold">{titles[currentIndex]}</h2>
          <p className="text-body-sm text-white/80">
            {currentIndex + 1} de {totalPanels}
          </p>
        </div>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>

      <div className={`relative ${isFullscreen ? "h-[calc(100vh-120px)]" : "h-full min-h-96"} overflow-hidden bg-surface-container-lowest`}>
        <div className="relative w-full h-full">
          {Array.isArray(children) &&
            children.map((child, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-all duration-500 transform ${
                  idx === currentIndex
                    ? "opacity-100 scale-100 pointer-events-auto"
                    : idx > currentIndex
                      ? "opacity-0 scale-105 pointer-events-none"
                      : "opacity-0 scale-95 pointer-events-none"
                }`}
              >
                <div className="w-full h-full p-6 overflow-auto">{child}</div>
              </div>
            ))}
        </div>
      </div>

      <div className="bg-surface-container border-t border-outline-variant px-4 py-4 flex items-center justify-between">
        <button
          onClick={handlePrev}
          className="p-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest transition-colors text-on-surface"
          aria-label="Anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex gap-1.5 flex-1 justify-center mx-4">
          {Array(totalPanels)
            .fill(0)
            .map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentIndex
                    ? "bg-primary w-8"
                    : "bg-outline-variant w-2 hover:bg-outline"
                }`}
                aria-label={`Ir para slide ${idx + 1}`}
                title={titles[idx]}
              />
            ))}
        </div>

        <button
          onClick={handleNext}
          className="p-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest transition-colors text-on-surface"
          aria-label="Próximo"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="absolute bottom-16 right-4 text-xs text-on-surface-variant opacity-60 pointer-events-none">
        Setas ← →
      </div>
    </div>
  );
}
