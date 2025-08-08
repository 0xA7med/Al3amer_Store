import { useRef } from 'react'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Category } from '@/lib/supabase'

interface CategoriesSliderProps {
  categories: Category[]
}

export default function CategoriesSlider({ categories }: CategoriesSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Helper to scroll the container smoothly by one card width (300px + gap)
  const scroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return
    const card = containerRef.current.querySelector('a') as HTMLAnchorElement
    const cardWidth = card ? card.offsetWidth : 300
    const gap = 20 // gap-5 = 20px
    const offset = direction === 'left' ? -(cardWidth + gap) : cardWidth + gap
    containerRef.current.scrollBy({ left: offset, behavior: 'smooth' })
  }

  if (categories.length === 0) return null

  return (
    <section className="w-full py-8 md:py-12 bg-white dark:bg-gray-950 rounded-3xl shadow-sm mb-8">
      <div className="flex items-center justify-between mb-6 px-4 md:px-8">
        {/* حذف العنوان الداخلي */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scroll('left')}
            aria-label="السابق"
            className="bg-white dark:bg-gray-800 p-2 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 border border-gray-200 dark:border-gray-700"
          >
            <ArrowLeft size={22} className="text-alamer-blue dark:text-alamer-blue-light" />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            aria-label="التالي"
            className="bg-white dark:bg-gray-800 p-2 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 border border-gray-200 dark:border-gray-700"
          >
            <ArrowLeft size={22} className="rotate-180 text-alamer-blue dark:text-alamer-blue-light" />
          </button>
        </div>
      </div>
      <div
        ref={containerRef}
        className="flex overflow-x-auto no-scrollbar scroll-smooth gap-5 px-4 md:px-8"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {categories.map((category) => (
          <Link
            key={category.category_id}
            to={`/products?category=${encodeURIComponent(category.name_ar)}`}
            className="group min-w-[220px] md:min-w-[260px] lg:min-w-[300px] max-w-[90vw] snap-center flex-shrink-0"
          >
            <div className="hover:shadow-xl transition-shadow duration-300 rounded-2xl overflow-hidden h-full bg-gradient-to-br from-alamer-blue to-alamer-blue-light flex flex-col items-center justify-center py-8 px-4">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <ShoppingBag size={30} className="md:size-8 text-white" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-center mb-1 text-white">{category.name_ar}</h3>
              {category.description_ar && (
                <p className="text-blue-100 text-xs md:text-sm text-center line-clamp-2">
                  {category.description_ar}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
