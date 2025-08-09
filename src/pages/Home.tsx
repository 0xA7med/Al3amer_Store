import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ShoppingBag, Truck, Headphones, Shield, Star } from 'lucide-react'
import { Product, Category, isSupabaseConfigured } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import ProductCard from '@/components/products/ProductCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import ModernCategoriesSlider from '@/components/ModernCategoriesSlider'

const Home: React.FC = () => {
  const { t } = useTranslation()
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesSlider, setCategoriesSlider] = useState(0);
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayedCategories, setDisplayedCategories] = useState<Category[]>([])
  const sliderRef = useRef<HTMLDivElement>(null)
  
  // Initialize displayed categories with loop items
  useEffect(() => {
    if (categories.length > 0) {
      // Create a longer list of categories for seamless looping
      const extendedCategories = [
        ...categories.slice(-3), // Last 3 items at the beginning
        ...categories,          // All items in the middle
        ...categories.slice(0, 3) // First 3 items at the end
      ];
      setDisplayedCategories(extendedCategories);
      // Start in the middle of the extended list
      setCategoriesSlider(3);
    }
  }, [categories]);
  
  // Handle the loop effect
  useEffect(() => {
    if (!sliderRef.current) return;
    
    const handleTransitionEnd = () => {
      if (!sliderRef.current) return;
      
      // If we're at the beginning (first clone), jump to the real last item
      if (categoriesSlider === 0) {
        sliderRef.current.style.transition = 'none';
        setCategoriesSlider(displayedCategories.length - 6);
        // Force reflow
        void sliderRef.current.offsetWidth;
        sliderRef.current.style.transition = 'transform 500ms ease-in-out';
      }
      // If we're at the end (last clone), jump to the real first item
      else if (categoriesSlider === displayedCategories.length - 1) {
        sliderRef.current.style.transition = 'none';
        setCategoriesSlider(3);
        // Force reflow
        void sliderRef.current.offsetWidth;
        sliderRef.current.style.transition = 'transform 500ms ease-in-out';
      }
      
      setIsTransitioning(false);
    };
    
    const slider = sliderRef.current;
    slider.addEventListener('transitionend', handleTransitionEnd);
    
    return () => {
      slider.removeEventListener('transitionend', handleTransitionEnd);
    };
  }, [categoriesSlider, displayedCategories.length]);

  // Calculate max slides based on number of categories
  const maxSlides = Math.ceil(categories.length / 3) - 1

  // Handle slider navigation with infinite loop
  const handleSliderNavigation = (direction: 'left' | 'right') => {
    if (isTransitioning || displayedCategories.length <= 1) return;
    
    setIsTransitioning(true);
    
    setCategoriesSlider(prev => {
      if (direction === 'left') {
        return prev - 1;
      } else {
        return prev + 1;
      }
    });
  }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!isSupabaseConfigured) {
          // Fallback: تحميل بيانات تجريبية من public
          const res = await fetch('/data/sample-products.json');
          const sample: any[] = await res.json();
          const nowIso = new Date().toISOString();
          const mapped: Product[] = sample.map((p, idx) => ({
            product_id: `sample-${idx}`,
            title_ar: p.title_ar,
            title_en: p.title_en,
            short_desc_ar: p.short_desc_ar,
            full_desc_ar: p.full_desc_ar,
            price: p.price,
            original_price: p.original_price,
            stock: p.stock ?? 0,
            min_stock_alert: 0,
            category_id: undefined,
            category_name: p.category_name,
            technical_specs_ar: p.technical_specs_ar,
            image_urls: p.image_urls,
            thumbnail_url: p.thumbnail_url,
            video_review_links: [],
            whatsapp_message_text: p.whatsapp_message_text,
            discount_percentage: p.original_price ? Math.max(0, Math.round(((p.original_price - p.price) / p.original_price) * 100)) : 0,
            is_featured: !!p.is_featured,
            is_active: true,
            view_count: 0,
            sale_count: 0,
            rating_average: 0,
            rating_count: 0,
            seo_title: undefined,
            seo_description: undefined,
            sku: p.sku,
            barcode: undefined,
            tags: p.tags || [],
            weight: undefined,
            dimensions: undefined,
            created_at: nowIso,
            updated_at: nowIso,
          }));
          setFeaturedProducts(mapped.filter(p => p.is_featured));
          const uniqueCats = Array.from(new Set(sample.map(p => p.category_name).filter(Boolean)));
          const fallbackCategories: Category[] = uniqueCats.map((name: string, idx: number) => ({
            category_id: `sample-${idx}`,
            name_ar: name,
            display_order: idx,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as unknown as Category));
          setCategories(fallbackCategories);
        } else {
          const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select('*')
            .eq('is_featured', true)
            .order('created_at', { ascending: false });
          if (productsError) throw productsError;
          setFeaturedProducts(productsData || []);
          const { data: categoriesData, error: categoriesError } = await supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });
          if (categoriesError) throw categoriesError;
          setCategories(categoriesData || []);
        }
      } catch (err) {
        setError('فشل في تحميل المنتجات أو الفئات');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (featuredProducts.length === 0) return;
    if (slideInterval.current) clearInterval(slideInterval.current);
    slideInterval.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredProducts.length);
    }, 4000);
    return () => {
      if (slideInterval.current) clearInterval(slideInterval.current);
    };
  }, [featuredProducts]);

  const features = [
    {
      icon: Truck,
      title: t('fastShipping'),
      description: 'شحن سريع لجميع محافظات مصر'
    },
    {
      icon: Headphones,
      title: t('technicalSupport'),
      description: 'دعم فني متميز على مدار الساعة'
    },
    {
      icon: Shield,
      title: t('warranty'),
      description: 'ضمان شامل على جميع المنتجات'
    },
    {
      icon: Star,
      title: t('bestPrices'),
      description: 'أفضل الأسعار في السوق'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner w-12 h-12"></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-gradient text-white py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-right">
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 animate-fade-in">
                {t('heroTitle')}
              </h1>
              <p className="text-xl lg:text-2xl mb-8 text-blue-100 animate-fade-in">
                {t('heroSubtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-in-right">
                <Link to="/products">
                  <Button size="lg" className="btn-alamer-secondary">
                    <ShoppingBag className="ml-2" size={20} />
                    {t('shopNow')}
                  </Button>
                </Link>
                <Link to="/about">
                  <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-lg shadow-md hover:shadow-lg border border-red-700 transition-colors gap-2">
                    {t('learnMore')}
                    <ArrowLeft className="mr-2" size={20} />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="w-full flex justify-center lg:justify-end">
              <div className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl relative">
                {featuredProducts.length > 0 && (
                  <div className="relative">
                    <img
                      src={featuredProducts[currentSlide]?.thumbnail_url || '/images/placeholder-product.png'}
                      alt={featuredProducts[currentSlide]?.title_ar}
                      className="rounded-2xl shadow-2xl w-full h-64 sm:h-80 md:h-96 object-cover object-center transition-all duration-700"
                    />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 text-alamer-blue p-4 rounded-xl shadow-lg w-[95%] max-w-xl text-center">
                      <h3 className="text-lg md:text-2xl font-bold mb-1">{featuredProducts[currentSlide]?.title_ar}</h3>
                      <div className="text-alamer-gold font-bold text-xl md:text-2xl mb-2">{featuredProducts[currentSlide]?.price} ج.م</div>
                      <Link to={`/product/${featuredProducts[currentSlide]?.product_id}`} className="inline-block mt-2">
                        <Button size="lg" className="btn-alamer-secondary">عرض المنتج</Button>
                      </Link>
                    </div>
                    {/* أزرار التنقل */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                      {featuredProducts.map((_, idx) => (
                        <button
                          key={idx}
                          className={`w-3 h-3 rounded-full border-2 ${currentSlide === idx ? 'bg-alamer-gold border-alamer-gold' : 'bg-white border-gray-300'} transition-all`}
                          onClick={() => setCurrentSlide(idx)}
                          aria-label={`انتقل للمنتج ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">لماذا تختار مركز العامر؟</h2>
            <p className="text-lg text-gray-600">نقدم لك أفضل الخدمات والمنتجات عالية الجودة</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-alamer-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="text-alamer-blue" size={32} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('categories')}</h2>
          </div>
          <ModernCategoriesSlider categories={categories} />
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">المنتجات المميزة</h2>
              <p className="text-lg text-gray-600">أحدث وأفضل منتجاتنا</p>
            </div>
            <Link to="/products">
              <Button variant="outline" className="btn-alamer-outline">
                عرض الكل
                <ArrowLeft className="mr-2" size={20} />
              </Button>
            </Link>
          </div>
          
          {featuredProducts.length > 0 ? (
            <div className="product-grid">
              {featuredProducts.map((product) => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">لا توجد منتجات مميزة حالياً</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-alamer-blue text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">هل تحتاج إلى استشارة؟</h2>
          <p className="text-xl text-blue-100 mb-8">
            فريقنا المتخصص جاهز لمساعدتك في اختيار الأنسب لعملك
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <Button size="lg" className="btn-alamer-secondary">
                تواصل معنا
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="text-white border-white hover:bg-white hover:text-alamer-blue"
              onClick={() => {
                const message = encodeURIComponent('مرحباً، أريد استشارة حول منتجاتكم')
                window.open(`https://wa.me/201026043165?text=${message}`, '_blank')
              }}
            >
              واتساب
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
