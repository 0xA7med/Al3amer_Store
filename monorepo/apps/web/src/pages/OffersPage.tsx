import { useState } from 'react';
import { ProductCard } from '../components/products/ProductCard';
import { useProducts } from '../hooks/useProducts';

const OffersPage = () => {
    const { data: response, isLoading } = useProducts();
    const products = response?.data || [];
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Filter products that have a discount
    const discountedProducts = products.filter(p => {
        const price = parseFloat(p.price);
        const discountPrice = p.discountPrice ? parseFloat(p.discountPrice) : null;
        return discountPrice && discountPrice < price;
    });

    // Filter by selected category
    const filteredProducts = selectedCategory === 'all'
        ? discountedProducts
        : discountedProducts.filter(p => p.category?.name === selectedCategory);

    // Dynamic categories from discounted products
    const categories = ['all', ...Array.from(new Set(discountedProducts.map(p => p.category?.name).filter(Boolean)))];

    const categoryLabels: Record<string, string> = {
        'all': 'الكل',
        // Map other categories if needed, or just use the name directly
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-dark">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-background-dark min-h-screen text-slate-200 font-body">
            {/* Hero Banner */}
            <div className="relative h-[300px] overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900 to-blue-900 opacity-50" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center mix-blend-overlay" />
                <div className="relative z-10 text-center space-y-4 px-4">
                    <span className="inline-block px-4 py-1 rounded-full bg-secondary/20 text-secondary border border-secondary/20 font-bold text-sm backdrop-blur-md">
                        عروض خاصة
                    </span>
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">تخفيضات نهاية الموسم</h1>
                    <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto">
                        احصل على أفضل الأجهزة والأنظمة بأسعار لا تقبل المنافسة. خصومات تصل إلى 50% على منتجات مختارة.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-8">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat as string)}
                            className={`px-6 py-2 rounded-full font-bold transition-colors ${selectedCategory === cat
                                ? 'bg-primary text-white'
                                : 'glass-card hover:bg-white/10 text-slate-300'
                                }`}
                        >
                            {categoryLabels[cat as string] || cat}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                id={product.id}
                                name={product.name}
                                brand={product.brand?.name || product.category?.name || 'Generic'}
                                price={product.discountPrice ? parseFloat(product.discountPrice) : parseFloat(product.price)}
                                originalPrice={userHasDiscount(product) ? parseFloat(product.price) : undefined}
                                rating={5} // Mock rating if not available
                                imageUrl={product.images?.[0]?.url || 'https://via.placeholder.com/300'}
                                slug={product.slug}
                                stock={product.stock}
                                badge={{ type: 'discount', text: 'Sale' }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined text-6xl text-gray-600 mb-4">local_offer</span>
                        <h3 className="text-xl font-bold text-white">لا توجد عروض حالياً</h3>
                        <p className="text-gray-400">تابعنا قريباً للمزيد من العروض الحصرية</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Helper to check discount properly
function userHasDiscount(product: any) {
    const price = parseFloat(product.price);
    const discountPrice = product.discountPrice ? parseFloat(product.discountPrice) : null;
    return discountPrice && discountPrice < price;
}

export default OffersPage;
