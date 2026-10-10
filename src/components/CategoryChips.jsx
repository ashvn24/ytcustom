import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CategoryChips({
  categories = [],
  selectedCategory = 'All',
  onSelectCategory,
}) {
  const scrollRef = useRef(null);

  const handleScroll = direction => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -250 : 250;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative flex items-center w-full py-1">
      {/* Scroll Left Button */}
      <button
        type="button"
        onClick={() => handleScroll('left')}
        className="hidden md:flex absolute left-0 z-10 w-8 h-8 items-center justify-center rounded-full bg-white/90 dark:bg-neutral-800/90 shadow-md border border-neutral-200 dark:border-neutral-700 hover:scale-105 transition-transform"
        title="Scroll left"
      >
        <ChevronLeft className="w-4 h-4 text-neutral-700 dark:text-neutral-200" />
      </button>

      {/* Chips Container */}
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5 px-2 md:px-8 w-full"
      >
        {categories.map(cat => {
          const isSelected = selectedCategory === cat.name;

          return (
            <button
              key={cat.name}
              type="button"
              onClick={() => onSelectCategory(cat.name)}
              className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                isSelected
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm font-semibold'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Scroll Right Button */}
      <button
        type="button"
        onClick={() => handleScroll('right')}
        className="hidden md:flex absolute right-0 z-10 w-8 h-8 items-center justify-center rounded-full bg-white/90 dark:bg-neutral-800/90 shadow-md border border-neutral-200 dark:border-neutral-700 hover:scale-105 transition-transform"
        title="Scroll right"
      >
        <ChevronRight className="w-4 h-4 text-neutral-700 dark:text-neutral-200" />
      </button>
    </div>
  );
}
