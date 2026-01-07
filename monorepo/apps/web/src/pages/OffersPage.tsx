import React from 'react';
import { ProductCard } from '../components/products/ProductCard';

const OffersPage = () => {
    // Mock data for offers
    const offerProducts = Array.from({ length: 8 }).map((_, i) => ({
        id: `offer-${i}`,
        title: i % 2 === 0 ? "طابعة فواتير حرارية X-Printer" : "جهاز كاشير لمس Sunmi T2",
        price: 1299,
        originalPrice: 1599, // Ensure original price is present for discount calculation
        rating: 4.8,
        reviews: 124,
        image: i % 2 === 0
            ? "https://images.unsplash.com/photo-1616400661955-44246ed8c826?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80"
            : "https://images.unsplash.com/photo-1599950753725-cb5f804f6e80?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        isNew: false,
        category: "أجهزة نقاط البيع"
    }));

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
                {/* Filters (Mock) */}
                <div className="flex flex-wrap gap-4 mb-8">
                    <button className="px-6 py-2 rounded-full bg-primary text-white font-bold">الكل</button>
                    <button className="px-6 py-2 rounded-full glass-card hover:bg-white/10 transition-colors">أجهزة نقاط البيع</button>
                    <button className="px-6 py-2 rounded-full glass-card hover:bg-white/10 transition-colors">الطابعات</button>
                    <button className="px-6 py-2 rounded-full glass-card hover:bg-white/10 transition-colors">الإكسسوارات</button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {offerProducts.map((product) => (
                        <ProductCard
                            key={product.id}
                            id={product.id}
                            name={product.title}
                            brand={product.category}
                            price={product.price}
                            originalPrice={product.originalPrice}
                            rating={product.rating}
                            reviewCount={product.reviews}
                            imageUrl={product.image}
                            badge={{ type: 'discount', text: 'Sale' }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OffersPage;
