"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { isValidCarouselIndex, getNextIndex } from "@/lib/carousel-utils";
import Image from "next/image";

interface ImageCarouselProps {
  images: Array<{ src: string; alt: string; title?: string }>;
  autoplay?: boolean;
  interval?: number;
  showThumbnails?: boolean;
}

export function ImageCarousel({
  images,
  autoplay = true,
  interval = 4000,
  showThumbnails = true,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isZoomed, setIsZoomed] = useState(false);

  const validIndex = useMemo(
    () => (isValidCarouselIndex(currentIndex, images.length) ? currentIndex : 0),
    [currentIndex, images.length]
  );

  useEffect(() => {
    if (!isPlaying || images.length <= 1) return;
    const timer = setInterval(
      () => setCurrentIndex(prev => getNextIndex(prev, images.length, "next")),
      interval
    );
    return () => clearInterval(timer);
  }, [isPlaying, images.length, interval]);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => getNextIndex(prev, images.length, "next"));
  }, [images.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex(prev => getNextIndex(prev, images.length, "prev"));
  }, [images.length]);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-text-secondary">Sem imagens para exibir</p>
      </div>
    );
  }

  const current = images[validIndex];

  return (
    <div className="w-full space-y-4">
      {/* Main image */}
      <div className="relative w-full aspect-video overflow-hidden rounded-xl shadow-lg group bg-black">
        <Image
          src={current.src}
          alt={current.alt}
          fill
          className={`object-cover transition-transform duration-300 ${
            isZoomed ? "scale-110" : "scale-100"
          } cursor-pointer hover:scale-105`}
          onClick={() => setIsZoomed(!isZoomed)}
          priority
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

        {/* Zoom indicator */}
        <button
          onClick={() => setIsZoomed(!isZoomed)}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-sm transition-all text-white opacity-0 group-hover:opacity-100"
          title="Ampliar"
        >
          <ZoomIn className="w-5 h-5" />
        </button>

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/30 hover:bg-white/50 backdrop-blur-sm transition-all text-white opacity-0 group-hover:opacity-100 hover:scale-110"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/30 hover:bg-white/50 backdrop-blur-sm transition-all text-white opacity-0 group-hover:opacity-100 hover:scale-110"
              aria-label="Próximo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Title overlay */}
        {current.title && (
          <div className="absolute bottom-4 left-4 right-4 z-20 text-white">
            <p className="text-lg font-semibold drop-shadow-lg">{current.title}</p>
          </div>
        )}

        {/* Counter */}
        <div className="absolute bottom-4 right-4 z-20 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm font-medium">
          {validIndex + 1}/{images.length}
        </div>
      </div>

      {/* Thumbnails */}
      {showThumbnails && images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all border-2 ${
                idx === validIndex
                  ? "border-primary shadow-lg scale-105"
                  : "border-gray-300 hover:border-gray-400 opacity-75 hover:opacity-100"
              }`}
              aria-label={`Ver imagem ${idx + 1}`}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Info bar */}
      <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-gray-50">
        <p className="text-sm text-text-secondary">{current.alt}</p>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
            isPlaying
              ? "bg-primary text-white"
              : "bg-gray-200 text-text-primary hover:bg-gray-300"
          }`}
        >
          {isPlaying ? "●" : "▶"} {isPlaying ? "Reproduzindo" : "Pausado"}
        </button>
      </div>
    </div>
  );
}
