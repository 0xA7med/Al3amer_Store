import { useRef } from 'react';
import { ArrowLeft, ArrowRight, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Category } from '@/lib/supabase';

interface ModernCategoriesSliderProps {
  categories: Category[];
}

export default function ModernCategoriesSlider({ categories }: ModernCategoriesSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;

  // Mouse/touch drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDown = true;
    startX = e.pageX - (containerRef.current?.offsetLeft || 0);
    scrollLeft = containerRef.current?.scrollLeft || 0;
    document.body.style.userSelect = 'none';
  };
  const handleMouseLeave = () => {
    isDown = false;
    document.body.style.userSelect = '';
  };
  const handleMouseUp = () => {
    isDown = false;
    document.body.style.userSelect = '';
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown || !containerRef.current) return;
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;
    const card = containerRef.current.querySelector('a') as HTMLAnchorElement;
    const cardWidth = card ? card.offsetWidth : 80;
    const gap = 16;
    const offset = direction === 'left' ? -(cardWidth + gap) : cardWidth + gap;
    containerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  if (!categories || categories.length === 0) return null;

  return (
    <div className="relative w-full flex items-center justify-center py-6 md:py-10">
      {/* أسهم التنقل */}
      <button
        type="button"
        onClick={() => scroll('left')}
        aria-label="السابق"
        className="absolute right-0 md:-right-6 top-1/2 -translate-y-1/2 z-20 bg-white dark:bg-gray-800 p-3 md:p-4 rounded-full shadow border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
        style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }}
      >
        <ArrowRight size={28} className="text-alamer-blue dark:text-alamer-blue-light" />
      </button>
      <button
        type="button"
        onClick={() => scroll('right')}
        aria-label="التالي"
        className="absolute left-0 md:-left-6 top-1/2 -translate-y-1/2 z-20 bg-white dark:bg-gray-800 p-3 md:p-4 rounded-full shadow border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
        style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }}
      >
        <ArrowLeft size={28} className="text-alamer-blue dark:text-alamer-blue-light" />
      </button>
      {/* السلايدر */}
      <div
        ref={containerRef}
        className="flex overflow-x-auto no-scrollbar gap-8 md:gap-12 px-6 md:px-24 py-6 bg-white dark:bg-gray-950 rounded-3xl shadow-md items-center mx-auto min-w-0"
        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', minHeight: '170px' }}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        {categories.map((category) => (
          <Link
            key={category.category_id}
            to={`/products?category=${encodeURIComponent(category.name_ar)}`}
            className="flex flex-col items-center min-w-[120px] md:min-w-[150px] max-w-[180px] snap-center flex-shrink-0 group"
            style={{ margin: '0 8px' }}
          >
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-alamer-blue to-alamer-blue-light flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform border-4 border-white dark:border-gray-950">
              <ShoppingBag size={38} className="text-white" />
            </div>
            <span className="text-base md:text-lg text-center font-bold text-alamer-blue dark:text-alamer-blue-light group-hover:underline">
              {category.name_ar}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
} 