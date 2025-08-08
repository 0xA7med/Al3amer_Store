import React from 'react'
import { Input } from '@/components/ui/input'
import ProductCard from '@/components/products/ProductCard'
import { useSearch } from '@/contexts/SearchContext'
import { supabase } from '@/lib/supabase'

import { useTranslation } from 'react-i18next';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { motion } from 'framer-motion';

const sortOptions = [
  { value: 'newest', label: { ar: 'الأحدث', en: 'Newest' } },
  { value: 'price-asc', label: { ar: 'السعر: من الأقل', en: 'Price: Low to High' } },
  { value: 'price-desc', label: { ar: 'السعر: من الأعلى', en: 'Price: High to Low' } },
];

const Products: React.FC = () => {
  const { searchQuery } = useSearch();
  const { t, i18n } = useTranslation();
  const [products, setProducts] = React.useState<any[]>([]);
  const [categories, setCategories] = React.useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [sortBy, setSortBy] = React.useState<string>('newest');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*');
        
        if (error) {
          console.error('Supabase error:', error);
          setError(`خطأ في جلب المنتجات: ${error.message}\n\nتفاصيل الخطأ:\n${JSON.stringify(error, null, 2)}`);
          setProducts([]);
        } else if (!data) {
          setError('لا توجد بيانات');
          setProducts([]);
        } else if (data.length === 0) {
          setError('لا توجد منتجات في قاعدة البيانات');
          setProducts([]);
        } else {
          setProducts(data);
          // استخراج التصنيفات الفريدة
          const uniqueCategories = Array.from(new Set(data.map((p:any) => p.category).filter(Boolean)));
          setCategories(uniqueCategories);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError(`حدث خطأ غير متوقع:\n\nتفاصيل الخطأ:\n${JSON.stringify(err, null, 2)}`);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [t]);

  // فلترة حسب البحث والتصنيف
  let filteredProducts = products;
  if (searchQuery) {
    filteredProducts = filteredProducts.filter(product =>
      (product.title_ar || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.title_en || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  if (selectedCategory !== 'all') {
    filteredProducts = filteredProducts.filter(product => product.category === selectedCategory);
  }

  // الفرز
  if (sortBy === 'price-asc') {
    filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-desc') {
    filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);
  } else if (sortBy === 'newest') {
    filteredProducts = [...filteredProducts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="loading-spinner w-12 h-12"></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-center text-red-500 py-12">{error}</div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 text-center">{t('products')}</h1>
        <div className="grid grid-cols-12 gap-6 mb-8">
          <div className="col-span-12 md:col-span-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full bg-white dark:bg-gray-900 border rounded-2xl shadow-lg">
                <SelectValue placeholder={t('sortBy') || 'فرز حسب'} />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {i18n.language === 'ar' ? opt.label.ar : opt.label.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-12 md:col-span-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full bg-white dark:bg-gray-900 border rounded-2xl shadow-lg">
                <SelectValue placeholder={t('filterByCategory') || 'تصفية حسب التصنيف'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all') || 'الكل'}</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ delay: 0.2, duration: 0.5 }}
        className="w-full"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(product => (
              <ProductCard key={product.product_id} product={product} />
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 py-12">
              لا توجد منتجات مطابقة
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default Products
