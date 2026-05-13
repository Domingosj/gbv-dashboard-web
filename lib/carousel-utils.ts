/**
 * Safe carousel state management to prevent ReferenceError: can't access lexical declaration before initialization
 */

export interface CarouselState {
  currentIndex: number;
  direction: "next" | "prev";
  isAnimating: boolean;
}

export const createCarouselState = (initialIndex: number = 0): CarouselState => ({
  currentIndex: initialIndex,
  direction: "next",
  isAnimating: false,
});

/**
 * Calculate next carousel index safely
 */
export const getNextIndex = (
  currentIndex: number,
  totalItems: number,
  direction: "next" | "prev" = "next"
): number => {
  if (totalItems === 0) return 0;
  if (direction === "next") {
    return (currentIndex + 1) % totalItems;
  }
  return currentIndex === 0 ? totalItems - 1 : currentIndex - 1;
};

/**
 * Validate carousel item exists
 */
export const isValidCarouselIndex = (index: number, totalItems: number): boolean => {
  return index >= 0 && index < totalItems && Number.isInteger(index);
};
