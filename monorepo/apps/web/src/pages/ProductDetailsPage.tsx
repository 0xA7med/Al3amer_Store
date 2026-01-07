import React, { useState } from 'react';
import { Star, ShoppingCart, Heart, Share2, ChevronLeft, Minus, Plus, Check } from 'lucide-react';

export const ProductDetailsPage = () => {
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [selectedColor, setSelectedColor] = useState('orange');

    const images = [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCoa-8mMOQIAqz5O3DVUmiqoBik-XkxcAY83SZuafJCCHYvhLwWtqRzvTuN0ojFpNPqnYiu7c7rKgOaOsOct6dueKTyiLdvFwfe1UdAmg2_ByYoAu6d-eMbb4xy6QpRY-hkds5tFK9YMup6-5kD1nNnmNG56WEt9psL0oToq-LOlYD18y87BX-3bZkFsLLWAcyNWsOOU_xQ_q4g91fDZt2a1UywSDBaPVtgTSj2H541k0N48CE1VC3ySjGfrUdMAYESwzBWT0awC3k',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBMY8XfqON8lUvVVB9L69sQCxr7_AXsKOqvvJBEL-p_MMPwDWUdbHf-awLWJi_ZKqF2jGxwV8-GvgwwJPXxAV7J2Rpi3xa8Y7hhgt6Wub-IDsY9khzMfWLYG0VrbqUWhGlTGUqmEpvxMwiKagbJlQKIQvQmOv_OB02LOwuL8ghKhJ9K2PNa7ngMAaYDMUyyHDaj5xBRzx4nEIN5Jh6kVpftA7TbgLetNjv9sIMGH-bqbwAv6dOFSyrsekUOvbeS14GIpMij48qctVo',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuARj3xSr87HXA2HVKK2fzsGk0GLyntPqymRW61P1DfR46QcXWz824dNDHUy-iqktJJ-yAYw-cetY1Gs7-npRU0IRJF0-CR_HmjyxgU_PTHMdCz73pJrllPalklIQ0OcJj2IyAq40tNmhbEMOg-wB2DxkRO80Y6HxVypnERW878Bae0XqZdv9tk1hLNP317OR0Rq4KZWj5dnurpgwntQY_TD1cRo6YYLVUUkxCrG7yGz5_eCcc5KJLHGTxixCkVDSJ0aKd4ivRYSmxQ',
        'https://lh3.googleusercontent.com/aida-public/AB6AXuCoa-8mMOQIAqz5O3DVUmiqoBik-XkxcAY83SZuafJCCHYvhLwWtqRzvTuN0ojFpNPqnYiu7c7rKgOaOsOct6dueKTyiLdvFwfe1UdAmg2_ByYoAu6d-eMbb4xy6QpRY-hkds5tFK9YMup6-5kD1nNnmNG56WEt9psL0oToq-LOlYD18y87BX-3bZkFsLLWAcyNWsOOU_xQ_q4g91fDZt2a1UywSDBaPVtgTSj2H541k0N48CE1VC3ySjGfrUdMAYESwzBWT0awC3k'
    ];

    const features = [
        "طابعة إيصالات حرارية مدمجة 58 مم",
        "شاشة 5.45 بوصة IPS HD+",
        "معالج رباعي النواة 1.3 جيجاهرتز",
        "بطارية 2580 مللي أمبير",
        "دعم 4G / Wi-Fi / Bluetooth"
    ];

    return (
        <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
            {/* Breadcrumbs */}
            <nav className="flex items-center text-sm text-slate-400 mb-8 overflow-x-auto whitespace-nowrap pb-2">
                <a href="/" className="hover:text-primary transition-colors">الرئيسية</a>
                <ChevronLeft className="w-4 h-4 mx-2 rtl:rotate-180" />
                <a href="/shop" className="hover:text-primary transition-colors">أجهزة نقاط البيع</a>
                <ChevronLeft className="w-4 h-4 mx-2 rtl:rotate-180" />
                <span className="text-white">Sunmi V2 Pro</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
                {/* Gallery Section */}
                <div className="lg:col-span-7 space-y-4">
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden glass-panel relative group bg-white/5">
                        <img
                            src={images[selectedImage]}
                            alt="Product View"
                            className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                        <button className="absolute top-4 right-4 p-2 rounded-full glass-card hover:bg-white/10 transition-colors text-white">
                            <Share2 className="w-5 h-5" />
                        </button>
                        <button className="absolute top-4 left-4 p-2 rounded-full glass-card hover:bg-white/10 transition-colors text-white">
                            <Heart className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        {images.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedImage(idx)}
                                className={`aspect-square rounded-xl overflow-hidden glass-panel transition-all bg-white/5 ${selectedImage === idx ? 'ring-2 ring-primary ring-offset-2 ring-offset-[#0f172a]' : 'opacity-70 hover:opacity-100'}`}
                            >
                                <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-contain" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Info Section */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="glass-panel p-6 rounded-2xl space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0" />

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full border border-primary/20">جديد</span>
                                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/20">متوفر في المخزون</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-2">Sunmi V2 Pro</h1>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <div className="flex text-amber-400">
                                    {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                                </div>
                                <span>(4.8 تقييم)</span>
                                <span className="w-1 h-1 bg-slate-600 rounded-full" />
                                <span>128 تم بيعها</span>
                            </div>
                        </div>

                        <div className="flex items-baseline gap-3">
                            <span className="text-4xl font-bold text-primary">1,299 ر.س</span>
                            <span className="text-lg text-slate-500 line-through">1,599 ر.س</span>
                            <span className="text-sm text-emerald-400 font-medium bg-emerald-500/10 px-2 py-1 rounded">-20%</span>
                        </div>

                        <p className="text-slate-300 leading-relaxed">
                            جهاز نقاط بيع محمول ذكي يجمع بين الأداء القوي والتسيم الأنيق. مثالي للمطاعم والمقاهي ومحلات التجزئة، مع طابعة إيصالات مدمجة وبطارية تدوم طويلاً.
                        </p>

                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-3 block">اللون</label>
                                <div className="flex gap-3">
                                    {['orange', 'black', 'blue'].map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setSelectedColor(color)}
                                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${selectedColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f172a]' : 'hover:scale-110'}`}
                                            style={{ backgroundColor: color === 'orange' ? '#F97316' : color === 'black' ? '#1F2937' : '#3B82F6' }}
                                        >
                                            {selectedColor === color && <Check className="w-5 h-5 text-white drop-shadow-md" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-3 block">الكمية</label>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center bg-[#0f172a]/50 rounded-xl border border-white/10 p-1">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="w-12 text-center text-lg font-bold text-white">{quantity}</span>
                                        <button
                                            onClick={() => setQuantity(quantity + 1)}
                                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-lg shadow-primary/20">
                                <ShoppingCart className="w-5 h-5" />
                                <span>إضافة للسلة</span>
                            </button>
                            <button className="px-6 py-4 rounded-xl glass-card text-white font-bold hover:bg-white/10 transition-colors border border-white/10">
                                شراء الآن
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs text-slate-400 pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-emerald-400" />
                                <span>شحن مجاني للطلبات فوق 500 ر.س</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-emerald-400" />
                                <span>ضمان لمدة سنتين</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-emerald-400" />
                                <span>استرجاع مجاني خلال 14 يوم</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-emerald-400" />
                                <span>دعم فني 24/7</span>
                            </div>
                        </div>
                    </div>

                    {/* AI Recommendation Banner */}
                    <div className="glass-panel p-4 rounded-xl relative overflow-hidden group hover:border-primary/50 transition-colors cursor-pointer">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex items-start gap-4 relative z-10">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm mb-1">اقتراح الذكاء الاصطناعي</h3>
                                <p className="text-xs text-slate-300">ينصح بإضافة <span className="text-primary font-bold">لفات ورق حراري</span> مع هذا المنتج لتوفير 15%</p>
                            </div>
                            <ChevronLeft className="w-5 h-5 text-slate-500 mr-auto mt-2 rtl:rotate-180" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Tabs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-16">
                <div className="lg:col-span-2 space-y-8">
                    <div className="glass-panel rounded-2xl overflow-hidden">
                        <div className="flex border-b border-white/5">
                            <button className="px-8 py-4 text-sm font-bold text-primary border-b-2 border-primary bg-primary/5">الوصف</button>
                            <button className="px-8 py-4 text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors">المواصفات</button>
                            <button className="px-8 py-4 text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors">المراجعات (24)</button>
                        </div>
                        <div className="p-8 text-slate-300 leading-relaxed space-y-6">
                            <div>
                                <h3 className="text-white font-bold text-lg mb-4">نظرة عامة على المنتج</h3>
                                <p className="mb-4">
                                    يعد Sunmi V2 Pro خياراً مثالياً لأصحاب الأعمال الذين يبحثون عن حلول دفع متكاملة. يتميز الجهاز بتصميم نحيف وخفيف الوزن، مما يجعله سهل الحمل والاستخدام في أي مكان. بفضل شاشته عالية الدقة ومعالجه القوي، يضمن لك أداءً سريعاً وموثوقاً لجميع عمليات البيع.
                                </p>
                                <p>
                                    تأتي الطابعة الحرارية المدمجة بسرعة طباعة عالية، مما يقلل من وقت الانتظار للعملاء. كما يدعم الجهاز تقنيات الاتصال المتعددة بما في ذلك 4G و Wi-Fi، لضمان بقائك متصلاً دائماً.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                {features.map((feature, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <Check className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Related Products */}
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">منتجات قد تعجبك</h2>
                            <a href="/shop" className="text-primary hover:text-primary-light text-sm font-bold">عرض الكل</a>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {[1, 2, 3].map((item) => (
                                <div key={item} className="glass-panel p-4 rounded-xl group hover:border-primary/30 transition-all">
                                    <div className="aspect-square bg-white/5 rounded-lg mb-4 overflow-hidden relative">
                                        <img
                                            src={images[item % 4]}
                                            alt="Related Product"
                                            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                                        />
                                        <button className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary">
                                            <ShoppingCart className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <h3 className="text-white font-bold text-sm mb-1 truncate">ورق إيصالات حراري 80مم</h3>
                                    <div className="flex items-center justify-between">
                                        <span className="text-primary font-bold">45 ر.س</span>
                                        <div className="flex items-center text-amber-400 text-xs">
                                            <Star className="w-3 h-3 fill-current" />
                                            <span className="mr-1">4.5</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-2xl">
                        <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-4">اشتريت معاً عادة</h3>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="w-16 h-16 rounded-lg bg-white/5 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                                    <img src={images[0]} className="w-full h-full object-contain" alt="Main" />
                                </div>
                                <div>
                                    <h4 className="text-white text-sm font-bold line-clamp-2">Sunmi V2 Pro</h4>
                                    <span className="text-primary text-xs font-bold">1,299 ر.س</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-center">
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                                    <Plus className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-16 h-16 rounded-lg bg-white/5 overflow-hidden flex-shrink-0 relative flex items-center justify-center p-1">
                                    <div className="absolute top-0 left-0 bg-primary text-white text-[10px] px-1 font-bold">Recommended</div>
                                    <img src={images[2]} className="w-full h-full object-contain" alt="Accessory" />
                                </div>
                                <div>
                                    <h4 className="text-white text-sm font-bold line-clamp-2">صندوق كاشير ذكي</h4>
                                    <span className="text-primary text-xs font-bold">150 ر.س</span>
                                </div>
                            </div>
                            <button className="w-full mt-4 bg-white/5 hover:bg-white/10 text-white text-sm font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                                <span>إضافة الكل للسلة</span>
                                <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-xs">توفير 5%</span>
                            </button>
                        </div>
                    </div>

                    <div className="glass-panel p-6 rounded-2xl">
                        <h3 className="text-lg font-bold text-white mb-4">شارك المنتج</h3>
                        <div className="flex gap-2">
                            {['facebook', 'twitter', 'whatsapp', 'linkedin'].map(social => (
                                <button key={social} className="flex-1 h-10 rounded-lg bg-white/5 hover:bg-primary/20 hover:text-primary transition-colors flex items-center justify-center text-slate-400">
                                    <Share2 className="w-4 h-4" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
