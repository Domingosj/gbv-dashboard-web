"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { isValidCarouselIndex, getNextIndex } from "@/lib/carousel-utils";

interface CarouselProps {
  items: React.ReactNode[];
  autoplay?: boolean;
  interval?: number;
  showControls?: boolean;
  showIndicators?: boolean;
  height?: string;
  variant?: "default" | "card" | "fullscreen";
}

export function Carousel({
  items,
  autoplay = false,
  interval = 5000,
  showControls = true,
  showIndicators = true,
  height = "h-96",
  variant = "default",
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Memoize valid index
  const validIndex = useMemo(
    () => (isValidCarouselIndex(currentIndex, items.length) ? currentIndex : 0),
    [currentIndex, items.length]
  );

  // Auto-advance carousel
  useEffect(() => {
    if (!isPlaying || items.length <= 1) return;

    const timer = setInterval(() => {
      setDirection("next");
      setIsTransitioning(true);
      setCurrentIndex(prev => getNextIndex(prev, items.length, "next"));
    }, interval);

    return () => clearInterval(timer);
  }, [isPlaying, items.length, interval]);

  // Reset transition state
  useEffect(() => {
    if (!isTransitioning) return;
    const timer = setTimeout(() => setIsTransitioning(false), 300);
    return () => clearTimeout(timer);
  }, [isTransitioning]);

  const handleNext = useCallback(() => {
    setDirection("next");
    setIsTransitioning(true);
    setCurrentIndex(prev => getNextIndex(prev, items.length, "next"));
  }, [items.length]);

  const handlePrev = useCallback(() => {
    setDirection("prev");
    setIsTransitioning(true);
    setCurrentIndex(prev => getNextIndex(prev, items.length, "prev"));
  }, [items.length]);

  const handleIndicatorClick = useCallback((idx: number) => {
    setDirection(idx > validIndex ? "next" : "prev");
    setIsTransitioning(true);
    setCurrentIndex(idx);
  }, [validIndex]);

  if (!items || items.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-64 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300">
        <p className="text-text-secondary text-sm">Sem itens para exibir</p>
      </div>
    );
  }

  const hasMultipleItems = items.length > 1;

  // Determine styling based on variant
  const variantStyles = {
    default: "rounded-lg shadow-card overflow-hidden",
    card: "rounded-2xl shadow-lg overflow-hidden border border-border",
    fullscreen: "rounded-none overflow-hidden",
  };

  return (
    <div className={`relative w-full ${height} ${variantStyles[variant]} group`}>
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 z-10 pointer-events-none" />

      {/* Main carousel item container */}
      <div className="relative w-full h-full overflow-hidden bg-gray-200">
        {/* Item wrapper with transitions */}
        <div
          className={`w-full h-full transition-all duration-300 ease-in-out transform ${
            isTransitioning
              ? direction === "next"
                ? "opacity-0 scale-95"
                : "opacity-0 scale-95"
              : "opacity-100 scale-100"
          }`}
        >
          {items[validIndex] ? (
            items[validIndex]
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <p className="text-text-secondary">Erro ao carregar item</p>
            </div>
          )}
        </div>

        {/* Loading skeleton during transition */}
        {isTransitioning && (
          <div className="absolute inset-0 bg-gray-300 animate-pulse z-20" />
        )}
      </div>

      {/* Previous button */}
      {showControls && hasMultipleItems && (
        <button
          onClick={handlePrev}
          className="absolute left-0 top-0 bottom-0 z-30 px-4 flex items-center justify-center bg-gradient-to-r from-black/40 to-transparent hover:from-black/60 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
          aria-label="Item anterior"
        >
          <div className="p-2 rounded-full bg-white/90 hover:bg-white shadow-lg transform transition-transform hover:scale-110">
            <ChevronLeft className="w-5 h-5 text-gray-900" />
          </div>
        </button>
      )}

      {/* Next button */}
      {showControls && hasMultipleItems && (
        <button
          onClick={handleNext}
          className="absolute right-0 top-0 bottom-0 z-30 px-4 flex items-center justify-center bg-gradient-to-l from-black/40 to-transparent hover:from-black/60 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
          aria-label="Próximo item"
        >
          <div className="p-2 rounded-full bg-white/90 hover:bg-white shadow-lg transform transition-transform hover:scale-110">
            <ChevronRight className="w-5 h-5 text-gray-900" />
          </div>
        </button>
      )}

      {/* Bottom controls bar */}
      {hasMultipleItems && (
        <div className="absolute bottom-0 left-0 right-0 z-40 px-4 py-3 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-between">
          {/* Indicators */}
          {showIndicators && (
            <div className="flex gap-1.5 items-center">
              {items.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handleIndicatorClick(idx)}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    idx === validIndex
                      ? "bg-white h-2 w-8 shadow-lg"
                      : "bg-white/50 h-2 w-2 hover:bg-white/75"
                  }`}
                  aria-label={`Ir para item ${idx + 1}`}
                  title={`Item ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Counter */}
          <div className="text-white text-sm font-medium tabular-nums">
            {validIndex + 1}/{items.length}
          </div>

          {/* Play/Pause button */}
          {autoplay && (
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/40 transition-all text-white"
              aria-label={isPlaying ? "Pausar" : "Reproduzir"}
              title={isPlaying ? "Pausar apresentação" : "Iniciar apresentação"}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      )}

      {/* Keyboard navigation hint */}
      <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-white/60 pointer-events-none">
        ← →
      </div>
    </div>
  );
}
